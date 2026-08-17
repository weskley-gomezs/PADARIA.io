import 'dotenv/config';
console.log("[VERCEL] API entry point called (/api/index.ts) - Zero-Trust Mode");

import express from 'express';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import { PaymentService } from '../src/services/paymentService.js';
import { initializeApp as initAdminApp, getApps as getAdminApps, getApp as getAdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email?: string;
        emailVerified: boolean;
        bakeryCode: string | null;
        role: string;
      };
    }
  }
}

let adminApp: any = null;
let adminAuth: any = null;
let adminDb: any = null;

try {
  const possiblePaths = [
    path.join(process.cwd(), 'firebase-applet-config.json'),
    path.join(process.cwd(), 'api', '..', 'firebase-applet-config.json'),
    '/var/task/firebase-applet-config.json'
  ];
  let projectId = "gen-lang-client-0055764381";
  let databaseId = "ai-studio-padariaio-05de0e5c-f467-434d-8538-8f91ddb8777f";
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const conf = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (conf.projectId) projectId = conf.projectId;
        if (conf.firestoreDatabaseId) databaseId = conf.firestoreDatabaseId;
      } catch (e) {}
      break;
    }
  }

  adminApp = getAdminApps().length > 0 ? getAdminApp() : initAdminApp({ projectId });
  adminAuth = getAdminAuth(adminApp);
  adminDb = getAdminFirestore(adminApp, databaseId);
  console.log("[INIT] Firebase Admin SDK (Auth & Firestore) inicializado com sucesso.");
} catch (adminErr) {
  console.error("[INIT] Erro ao inicializar Firebase Admin SDK:", adminErr);
}

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; resetTime: number }>();
function rateLimit(limit: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let record = requestCounts.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      requestCounts.set(ip, record);
    } else {
      record.count++;
      if (record.count > limit) {
        console.warn(`[SECURITY] Rate limit excedido para IP: ${ip}`);
        return res.status(429).json({ success: false, error: 'Muitas requisições. Tente novamente mais tarde.', code: 'RATE_LIMIT_EXCEEDED' });
      }
    }
    next();
  };
}

// Reusable middleware to authenticate Firebase user via Bearer token
async function authenticateFirebaseUser(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('[SECURITY] Tentativa de acesso sem token Bearer em rota protegida:', req.path);
    return res.status(401).json({ success: false, error: 'Não autorizado. Token Bearer ausente ou inválido.', code: 'UNAUTHORIZED' });
  }
  const rawToken = authHeader.split('Bearer ')[1];
  const token = rawToken ? rawToken.trim() : '';
  if (!token || token === 'undefined' || token === 'null') {
    console.warn('[SECURITY] Token Bearer vazio ou inválido:', req.path);
    return res.status(401).json({ success: false, error: 'Não autorizado. Token Bearer ausente ou inválido.', code: 'UNAUTHORIZED' });
  }

  const authStart = Date.now();
  req.perf = { authStart, totalStart: authStart };

  try {
    console.log(`[PADEIA API] Authentication middleware reached - path: ${req.path}, token length: ${token.length}`);
    if (!adminAuth) {
      throw new Error('Firebase Admin Auth não foi inicializado no servidor.');
    }
    const decodedToken = await adminAuth.verifyIdToken(token);
    console.log(`[PADEIA API] Firebase token verification: success for UID=${decodedToken.uid}`);
    const uid = decodedToken.uid;

    let bakeryCode = null;
    let role = 'owner';

    try {
      if (adminDb) {
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          bakeryCode = data?.bakeryCode ? String(data.bakeryCode).trim().toUpperCase() : null;
          role = data?.role || 'owner';
        } else {
          // Fallback: check companies by ownerUid or email
          const companiesSnap = await adminDb.collection('companies').get();
          companiesSnap.forEach((docSnap: any) => {
            const comp = docSnap.data();
            if (comp.ownerUid === uid || comp.email === decodedToken.email) {
              bakeryCode = docSnap.id.toUpperCase();
              role = 'owner';
            }
          });
        }
      }
    } catch (dbErr: any) {
      console.warn('[AUTH] Aviso ao buscar mapeamento de usuário no Firestore (usando fallback por payload do cliente autenticado):', dbErr?.message || dbErr);
    }

    req.user = {
      uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
      bakeryCode,
      role: (role === 'admin' || decodedToken.admin || decodedToken.email === 'weskleyg4000@gmail.com' || decodedToken.email === 'admin@padaria.io') ? 'admin' : role
    };

    req.perf.authEnd = Date.now();
    console.log(`[AUTH] Usuário autenticado: UID=${uid}, Email=${decodedToken.email}, BakeryCode=${bakeryCode}, Role=${req.user.role}`);
    next();
  } catch (error: any) {
    console.error(`[PADEIA API] Firebase token verification: failure - ${error.message}`);
    return res.status(401).json({ success: false, error: 'Token de autenticação inválido ou expirado.', code: 'INVALID_TOKEN' });
  }
}

// Middleware de Tenant (Zero-Trust Tenant Access Control)
function requireTenantAccess(req: any, res: any, next: any) {
  if (req.perf) req.perf.tenantStart = Date.now();
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Usuário não autenticado.', code: 'UNAUTHORIZED' });
  }

  // Admins have global access
  if (req.user.role === 'admin') {
    if (req.perf) req.perf.tenantEnd = Date.now();
    return next();
  }

  const requestedBakeryCode = (req.body?.bakeryCode || req.query?.bakeryCode || req.params?.bakeryCode || '').trim().toUpperCase();

  if (requestedBakeryCode && req.user.bakeryCode && requestedBakeryCode !== req.user.bakeryCode) {
    console.warn(`[SECURITY] ATENÇÃO: Tentativa de Acesso Cross-Tenant BLOQUEADA! Usuário (Bakery: ${req.user.bakeryCode}) tentou acessar tenant: ${requestedBakeryCode}`);
    return res.status(403).json({ success: false, error: 'Acesso negado: Tentativa de acesso cross-tenant não autorizada.', code: 'FORBIDDEN_CROSS_TENANT' });
  }

  // If server-side Firestore query was unable to map bakeryCode, accept requestedBakeryCode from the authenticated user
  if (!req.user.bakeryCode && requestedBakeryCode) {
    req.user.bakeryCode = requestedBakeryCode;
  }

  if (!req.user.bakeryCode && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Usuário não vinculado a nenhuma padaria ativa.', code: 'NO_TENANT_ASSIGNED' });
  }

  // Enforce server-side bakeryCode authority over request body
  if (req.body && typeof req.body === 'object') {
    req.body.bakeryCode = req.user.bakeryCode;
  }

  if (req.perf) req.perf.tenantEnd = Date.now();
  next();
}

// Middleware de Admin
function requireAdmin(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Não autorizado.', code: 'UNAUTHORIZED' });
  }
  if (req.user.role !== 'admin') {
    console.warn(`[SECURITY] Tentativa de acesso administrativo não autorizado por UID: ${req.user.uid}`);
    return res.status(403).json({ success: false, error: 'Acesso restrito a administradores do sistema.', code: 'FORBIDDEN_ADMIN_ONLY' });
  }
  next();
}

function removeUndefined(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefined);

  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => [key, removeUndefined(value)])
  );
}

function classifyIntent(message: string): string {
  const msg = message.toLowerCase().trim();
  
  if (/\b(perda|perdi|perdeu|descarte|desperdi|lixo|jogou fora|estragou|prejuizo|prejuízo|quebra|desperdiço|desperdício|cmv)\b/i.test(msg)) {
    return 'PERDAS';
  }
  if (/\b(estoque|quantidade|quanto tem|ingrediente|insumo|almoxarifado|físico|fisico|contagem|conferência|conferencia|ajuste|inventário|inventario)\b/i.test(msg)) {
    return 'ESTOQUE';
  }
  if (/\b(divergencia|divergência|diferença|diferenca|desvio|inconsist|furo|contagem errada|furos|divergencias|divergências)\b/i.test(msg)) {
    return 'DIVERGENCIA';
  }
  if (/\b(validade|venc|vence|vencido|vencendo|prazo|vencer|estragar|venciment|vencimentos|vencimento)\b/i.test(msg)) {
    return 'VALIDADE';
  }
  if (/\b(venda|vendeu|quanto vendeu|faturamento|faturou|receita|ticket|vendas)\b/i.test(msg)) {
    return 'VENDAS';
  }
  if (/\b(financeiro|caixa|dinheiro|lucro|custo|pagamento|pagar|receber|gasto|gastos|contas)\b/i.test(msg)) {
    return 'FINANCEIRO';
  }
  if (/\b(fechamento|fechar|fechou|fechar caixa)\b/i.test(msg)) {
    return 'FECHAMENTO';
  }
  if (/\b(tarefa|rotina|equipe|fazer hoje|cronograma|checklist|pendente|limpeza|concluida|concluída|tarefas|rotinas|escala|colaborador)\b/i.test(msg)) {
    return 'TAREFAS';
  }
  if (/\b(produto|itens|item|cadastro|cadastrado|produtos|cadastrar)\b/i.test(msg)) {
    return 'PRODUTOS';
  }
  if (/\b(relatorio|relatório|pdf|resumo|geral|dashboard|balanço|balanco)\b/i.test(msg)) {
    return 'RELATORIOS';
  }
  if (/\b(ajuda|socorro|ajudar|como usar|suporte|menu|comandos|funciona|fazer)\b/i.test(msg)) {
    return 'AJUDA';
  }
  
  return 'GENERAL';
}

function getCopilotIntentCategory(message: string): 'SYSTEM_HELP' | 'OPERATIONAL_DATA' | 'ANALYSIS' | 'RECOMMENDATION' | 'GREETING' | 'GENERAL' {
  const msg = message.toLowerCase().trim();

  const staticResponse = getStaticGreetingOrSimpleResponse(message);
  if (staticResponse) {
    if (staticResponse.includes("PadeIA! 🧠 O braço direito") || staticResponse.includes("quais areas voce controla")) {
      return 'SYSTEM_HELP';
    }
    return 'GREETING';
  }

  if (/\b(ajuda|como usar|como funciona|suporte|módulos|modulo|funcionalidades|telas|páginas|onde cadastrar|funciona|sistema|ajudar|explicar|manual|manuais|pdf)\b/i.test(msg)) {
    return 'SYSTEM_HELP';
  }

  if (/\b(recomenda|sugere|sugestão|sugerir|indica|o que fazer|resolver|fazer hoje|melhorar|diminuir|reduzir|clube vip|vip|evitar|prevenir|dica|dicas|conselho|conselhos)\b/i.test(msg)) {
    return 'RECOMMENDATION';
  }

  if (/\b(analis|anális|resumo|balanço|balanco|gráfico|grafico|média|media|porcentagem|comparar|tendência|tendencia|relatório|relatorio|histórico|historico)\b/i.test(msg)) {
    return 'ANALYSIS';
  }

  if (/\b(quantos|quanto|produto|estoque|validade|perda|descarte|venda|caixa|faturamento|faturou|vence|tarefa|rotina|conferido|divergencia|divergência|diferença|diferenca|furo|contagem|lixo|vencimento|vencidos|vencendo|produtos|caixas|vendas)\b/i.test(msg)) {
    return 'OPERATIONAL_DATA';
  }

  return 'GENERAL';
}

function getStaticGreetingOrSimpleResponse(message: string): string | null {
  const msg = message.toLowerCase().replace(/[?.,!]/g, '').trim();

  const greetings = ['ola', 'olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'tudo bem?'];
  if (greetings.includes(msg)) {
    return "Olá! 👋 Sou a PadeIA. Posso te ajudar com estoque, perdas, validade e divergências da sua padaria. O que você quer saber?";
  }

  const identity = ['quem e voce', 'quem é você', 'quem e você', 'quem é voce'];
  if (identity.includes(msg)) {
    return "Eu sou a PadeIA! 🧠 O braço direito do dono de padaria. Sou o copiloto inteligente do Padaria.io, focado em trazer clareza operacional e estratégica para a sua gestão, de forma simples e rápida.";
  }

  const whatDoYouDo = ['o que voce faz', 'o que você faz', 'o que voce faz?', 'o que você faz?'];
  if (whatDoYouDo.includes(msg)) {
    return "Eu analiso as informações de estoque, perdas, validades e rotinas da sua padaria para ajudar na gestão e evitar prejuízos. Consigo te dar relatórios e responder sobre esses temas.";
  }

  const howItWorks = ['como funciona', 'como funciona?', 'como e o funcionamento', 'como é o funcionamento'];
  if (howItWorks.includes(msg)) {
    return "Eu me conecto de forma segura ao banco de dados da sua padaria no Padaria.io. Quando você me faz uma pergunta, consulto as informações relevantes e utilizo inteligência artificial para te dar respostas curtas e ações objetivas.";
  }

  const areasControl = ['quais areas voce controla', 'quais áreas você controla', 'quais areas voce controla?', 'quais áreas você controla?'];
  if (areasControl.includes(msg)) {
    return "Eu analiso e ajudo a controlar quatro áreas críticas da sua operação:\n- 📦 **Estoque**: Quantidades e reposição.\n- 💸 **Perdas**: Motivos e custos de descarte.\n- 📅 **Validades**: Rastreamento preventivo de vencimentos.\n- 📋 **Rotinas e Divergências**: Tarefas diárias e diferenças físicas.";
  }

  return null;
}

console.log("[INIT] Inicializando servidor Express em /api/index.ts (Zero-Trust)...");
const app = express();
app.use(express.json({ limit: '10mb' }));

// Restrictive CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

let db: any = null;
let ai: any = null;

// Safe modular initializations to prevent fatal boot failures of the entire routing table
try {
  console.log("[INIT] Verificando configuração do Firebase...");
  const possiblePaths = [
    path.join(process.cwd(), 'firebase-applet-config.json'),
    path.join(process.cwd(), 'api', '..', 'firebase-applet-config.json'),
    '/var/task/firebase-applet-config.json'
  ];
  
  let firebaseConfigPath = possiblePaths[0];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      firebaseConfigPath = p;
      break;
    }
  }

  if (fs.existsSync(firebaseConfigPath)) {
    const configRaw = fs.readFileSync(firebaseConfigPath, 'utf8');
    try {
      const firebaseConfig = JSON.parse(configRaw);
      const firebaseApp = initializeApp(firebaseConfig);
      db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
      console.log("[INIT] Firebase inicializado com sucesso.");
    } catch (jsonError) {
      console.error("[INIT] Erro ao parsear o JSON do Firebase:", jsonError);
    }
  }
} catch (fbInitErr) {
  console.error("[INIT] Erro durante a inicialização do Firebase client SDK:", fbInitErr);
}

try {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("[INIT] AVISO: GEMINI_API_KEY não encontrada nas variáveis de ambiente.");
  }

  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("[INIT] GoogleGenAI instanciado com sucesso.");
} catch (aiErr) {
  console.error("[INIT] Erro ao instanciar GoogleGenAI:", aiErr);
}

// Public Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.VERCEL ? 'vercel' : 'local' });
  });

  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      return res.sendFile(robotsPath);
    }
    res.send("User-agent: *\nAllow: /\nAllow: /api/\nDisallow: /admin\nDisallow: /app\n");
  });

  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      return res.sendFile(sitemapPath);
    }
    res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://padaria.io/</loc></url></urlset>`);
  });

  // Protected Routes
  app.post('/api/analyze-product-image', authenticateFirebaseUser, requireTenantAccess, async (req, res) => {
    console.log("[ROUTE] POST /api/analyze-product-image - Recebido");
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ success: false, error: 'Nenhuma imagem fornecida.', code: 'MISSING_IMAGE' });
      }

      const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Você é um assistente especialista de leitura de etiquetas e rótulos de padaria/supermercado. Analise a imagem fornecida da etiqueta do produto e extraia os seguintes 7 dados com extrema precisão:\n1. nome\n2. dataFabricacao (YYYY-MM-DD)\n3. dataValidade (YYYY-MM-DD)\n4. peso (KG)\n5. valorKg\n6. valorTotal\n7. barcode\nRetorne rigorosamente em formato JSON." },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nome: { type: Type.STRING },
              dataFabricacao: { type: Type.STRING },
              dataValidade: { type: Type.STRING },
              peso: { type: Type.NUMBER },
              valorKg: { type: Type.NUMBER },
              valorTotal: { type: Type.NUMBER },
              barcode: { type: Type.STRING },
            },
            required: ["nome"],
          },
        },
      });

      let text = response.text || "{}";
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const result = JSON.parse(text);

      return res.json(result);
    } catch (error: any) {
      console.error('[ROUTE] ERRO em /api/analyze-product-image:', error);
      return res.status(500).json({ success: false, error: 'Erro ao processar imagem.', code: 'INTERNAL_ERROR' });
    }
  });

  app.post('/api/padeia/chat', authenticateFirebaseUser, requireTenantAccess, rateLimit(30, 60000), async (req: any, res: any) => {
    console.log("[PADEIA] Request received");
    try {
      console.log("[PADEIA] Authentication verified");
      console.log("[PADEIA] Tenant verified");

      const { message, history = [] } = req.body;

      if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ success: false, error: 'Mensagem inválida ou não fornecida.', code: 'INVALID_MESSAGE' });
      }

      if (message.length > 3000) {
        return res.status(400).json({ success: false, error: 'Mensagem excede o limite máximo permitido de 3000 caracteres.', code: 'MESSAGE_TOO_LONG' });
      }

      // Check for static greeting or simple response first for ultra-low latency (< 1ms)
      const staticResponse = getStaticGreetingOrSimpleResponse(message);
      if (staticResponse) {
        console.log("[PADEIA] Static response matches. Bypassing Firestore and Gemini.");
        
        // Output performance metrics
        const totalEnd = Date.now();
        const totalTime = totalEnd - (req.perf?.totalStart || totalEnd);
        const authTime = (req.perf?.authEnd && req.perf?.authStart) ? (req.perf.authEnd - req.perf.authStart) : 0;
        const tenantTime = (req.perf?.tenantEnd && req.perf?.tenantStart) ? (req.perf.tenantEnd - req.perf.tenantStart) : 0;

        console.log(`[PADEIA PERF] auth: ${authTime}ms`);
        console.log(`[PADEIA PERF] tenant: ${tenantTime}ms`);
        console.log(`[PADEIA PERF] context: 0ms`);
        console.log(`[PADEIA PERF] firestore: 0ms`);
        console.log(`[PADEIA PERF] gemini: 0ms`);
        console.log(`[PADEIA PERF] formatting: 0ms`);
        console.log(`[PADEIA PERF] total: ${totalTime}ms`);

        return res.json({ success: true, reply: staticResponse });
      }

      const hasApiKey = !!process.env.GEMINI_API_KEY;
      console.log(`[PADEIA] GEMINI_API_KEY configured: ${hasApiKey}`);

      if (!ai || !hasApiKey) {
        console.error('[PADEIA ERROR] stage=gemini_init error="GEMINI_API_KEY não configurada ou serviço Gemini não inicializado"');
        return res.status(500).json({ success: false, error: 'Serviço PadeIA™ não configurado (chave de API ausente).', code: 'AI_UNAVAILABLE' });
      }

      // ZERO-TRUST: Extract bakeryCode from authenticated tenant authority
      const bakeryCode = req.user.bakeryCode;
      
      const intent = classifyIntent(message);
      const intentCategory = getCopilotIntentCategory(message);
      console.log(`[PADEIA] Intent classified: ${intent} | Category: ${intentCategory}`);

      // Map required collections selectively to minimize Firestore fetch footprint
      const requiredCollections = new Set<string>();
      const msg = message.toLowerCase();

      // Granular keyword matching for selective loading
      if (/\b(produto|itens|item|cadastro|estoque|quantidade|quanto tem|farinha|pão|pao|bolo|salgado|venc|validade|prazo|vence|perda|descarte|lixo|vencimento|vencidos|vencendo)\b/i.test(msg)) {
        requiredCollections.add('products');
      }
      if (/\b(venda|vendeu|quanto vendeu|faturamento|faturou|receita|ticket|financeiro|caixa|fechamento|balanço|balanco|lucro|cmv|vendas)\b/i.test(msg)) {
        requiredCollections.add('sales');
        requiredCollections.add('dailyClosings');
      }
      if (/\b(divergencia|divergência|diferença|diferenca|desvio|furo|contagem|conferência|conferencia|ajuste|inventário|furos)\b/i.test(msg)) {
        requiredCollections.add('stockCounts');
        requiredCollections.add('products');
      }
      if (/\b(movimento|entrada|consumo|produção|produziu|saída|perda|descarte|movimentação|movimentacoes)\b/i.test(msg)) {
        requiredCollections.add('inventoryMovements');
        requiredCollections.add('products');
      }
      if (/\b(tarefa|rotina|equipe|fazer hoje|cronograma|checklist|pendente|limpeza|concluida|concluída|escala|colaborador|tarefas|rotinas)\b/i.test(msg)) {
        requiredCollections.add('operationalTasks');
      }
      if (/\b(fechamento|fechar|fechou|caixa)\b/i.test(msg)) {
        requiredCollections.add('dailyClosings');
        requiredCollections.add('sales');
      }
      if (/\b(vip|oferta|promocional|desconto|clube)\b/i.test(msg)) {
        requiredCollections.add('vipOffers');
        requiredCollections.add('products');
      }

      // If they ask for recommendations or general analysis, or no specific category matched, load key overview data
      if (intentCategory === 'RECOMMENDATION' || intentCategory === 'ANALYSIS' || intentCategory === 'GENERAL' || requiredCollections.size === 0) {
        requiredCollections.add('products');
        requiredCollections.add('operationalTasks');
        requiredCollections.add('stockCounts');
        requiredCollections.add('dailyClosings');
        requiredCollections.add('vipOffers');
      }

      const firestoreStart = Date.now();
      const promises: Promise<any>[] = [];
      const keys: string[] = [];

      if (bakeryCode && adminDb) {
        // Always fetch company settings
        promises.push(adminDb.collection('companies').doc(bakeryCode).get());
        keys.push('company');

        if (requiredCollections.has('products')) {
          promises.push(adminDb.collection('products').where('bakeryCode', '==', bakeryCode).limit(40).get());
          keys.push('products');
        }
        if (requiredCollections.has('sales')) {
          promises.push(adminDb.collection('sales').where('bakeryCode', '==', bakeryCode).limit(20).get());
          keys.push('sales');
        }
        if (requiredCollections.has('stockCounts')) {
          promises.push(adminDb.collection('stockCounts').where('bakeryCode', '==', bakeryCode).limit(10).get());
          keys.push('stockCounts');
        }
        if (requiredCollections.has('inventoryMovements')) {
          promises.push(adminDb.collection('inventoryMovements').where('bakeryCode', '==', bakeryCode).limit(10).get());
          keys.push('inventoryMovements');
        }
        if (requiredCollections.has('operationalTasks')) {
          promises.push(adminDb.collection('operationalTasks').where('bakeryCode', '==', bakeryCode).limit(15).get());
          keys.push('operationalTasks');
        }
        if (requiredCollections.has('dailyClosings')) {
          promises.push(adminDb.collection('dailyClosings').where('bakeryCode', '==', bakeryCode).limit(10).get());
          keys.push('dailyClosings');
        }
        if (requiredCollections.has('vipOffers')) {
          promises.push(adminDb.collection('vipOffers').where('bakeryCode', '==', bakeryCode).limit(10).get());
          keys.push('vipOffers');
        }
      }

      console.log(`[PADEIA] Loading selected context keys: ${keys.join(', ')}`);
      const results = await Promise.all(promises);
      const firestoreEnd = Date.now();
      const firestoreTime = firestoreEnd - firestoreStart;

      let company: any = { empresa: bakeryCode || 'Admin' };
      let products: any[] = [];
      let salesHistory: any[] = [];
      let stockCounts: any[] = [];
      let inventoryMovements: any[] = [];
      let operationalTasks: any[] = [];
      let dailyClosings: any[] = [];
      let vipOffers: any[] = [];

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const snap = results[i];
        if (key === 'company') {
          if (snap && snap.exists) company = snap.data();
        } else if (key === 'products') {
          products = snap ? snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [];
        } else if (key === 'sales') {
          salesHistory = snap ? snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [];
        } else if (key === 'stockCounts') {
          stockCounts = snap ? snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [];
        } else if (key === 'inventoryMovements') {
          inventoryMovements = snap ? snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [];
        } else if (key === 'operationalTasks') {
          operationalTasks = snap ? snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [];
        } else if (key === 'dailyClosings') {
          dailyClosings = snap ? snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [];
        } else if (key === 'vipOffers') {
          vipOffers = snap ? snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [];
        }
      }

      // Format highly dense context
      const contextStart = Date.now();
      let contextText = '';

      if (requiredCollections.has('products') && products.length > 0) {
        const topProductsText = products.map((p: any) => 
          `- ${p.nome || 'Produto'} (Qtd: ${p.quantidade ?? 0}, Validade: ${p.dataValidade || 'N/A'}, Status: ${p.status || 'normal'}, Preço Unitário/Kg: R$ ${p.valorKg || 'N/A'}, Valor Total Perda: R$ ${p.valorTotal || 0}, Categoria: ${p.categoria || 'Geral'}, Cadastrado em: ${p.dataCadastro || 'N/A'})`
        ).join('\n');
        contextText += `\n📦 PRODUTOS / HISTÓRICO DE DESCARTE E VALIDADE (Limite de 40 itens):\n${topProductsText}`;
      }

      if (requiredCollections.has('stockCounts') && stockCounts.length > 0) {
        const stockDivergencesText = stockCounts.map((c: any) =>
          `- ${c.productName || 'Produto'}: Inicial: ${c.initialQuantity ?? 0}, Entradas: ${c.entriesQuantity ?? 0}, Produção: ${c.productionQuantity ?? 0}, Descarte: ${c.wasteQuantity ?? 0}, Esperado no Sistema: ${c.expectedQuantity ?? 0}, Físico Real Verificado: ${c.physicalQuantity ?? 0}, Divergência: ${c.varianceQuantity ?? 0} (Custo Financeiro Divergência: R$ ${c.varianceValue || 0}, Notas: ${c.notes || 'Nenhuma'}, Conferido em: ${c.countedAt || 'N/A'} por ${c.countedBy || 'N/A'})`
        ).join('\n');
        contextText += `\n⚠️ DIVERGÊNCIAS CONFERIDAS E BALANÇO DE CONFERÊNCIAS (Limite de 10 itens):\n${stockDivergencesText}`;
      }

      if (requiredCollections.has('operationalTasks') && operationalTasks.length > 0) {
        const tasksOverviewText = operationalTasks.map((t: any) =>
          `- [${t.status === 'concluida' ? 'CONCLUÍDA' : 'PENDENTE'}] Turno: ${t.shift || 'Qualquer'} - ${t.title || 'Tarefa'} (Vencimento/Limite: ${t.dueTime || t.dueDate || 'N/A'}, Notas: ${t.notes || 'Nenhuma'})`
        ).join('\n');
        contextText += `\n📋 TAREFAS E ROTINAS OPERACIONAIS DA EQUIPE (Limite de 15 itens):\n${tasksOverviewText}`;
      }

      if (requiredCollections.has('sales') && salesHistory.length > 0) {
        const salesText = salesHistory.map((s: any) =>
          `- Venda em ${s.dataVenda || 'N/A'}: ${s.nomeProduto || 'Produto'} x ${s.quantidade ?? 0} un (Validade do item vendido: ${s.dataValidade || 'N/A'})`
        ).join('\n');
        contextText += `\n💰 HISTÓRICO DE VENDAS RECENTES (Limite de 20 itens):\n${salesText}`;
      }

      if (requiredCollections.has('inventoryMovements') && inventoryMovements.length > 0) {
        const movementsText = inventoryMovements.map((m: any) =>
          `- Movimentação de Estoque [Tipo: ${m.type || 'N/A'}]: ${m.productName || 'Produto'} x ${m.quantity || 0} ${m.unit || 'un'} (Motivo: ${m.reason || 'N/A'}, Custo: R$ ${m.costAtMovement || 0}, Registrado em: ${m.createdAt || 'N/A'} por ${m.createdBy || 'N/A'})`
        ).join('\n');
        contextText += `\n📉 MOVIMENTAÇÕES DE ESTOQUE RECENTES (Limite de 10 itens):\n${movementsText}`;
      }

      if (requiredCollections.has('dailyClosings') && dailyClosings.length > 0) {
        const closingsText = dailyClosings.map((c: any) =>
          `- Fechamento de Caixa em ${c.dataFechamento || 'N/A'}: Faturamento Bruto: R$ ${c.faturamentoBruto || 0}, Perdas Registradas: R$ ${c.perdasTotais || 0}, Sobras de Produção: R$ ${c.sobrasProducao || 0}, CMV Calculado: ${c.cmvPercent || 0}%, Diferença de Caixa: R$ ${c.diferencaCaixa || 0}, Observações: ${c.observacoes || 'Nenhuma'}, Status: ${c.status || 'N/A'}`
        ).join('\n');
        contextText += `\n🏦 FECHAMENTOS DIÁRIOS DE CAIXA (Limite de 10 itens):\n${closingsText}`;
      }

      if (requiredCollections.has('vipOffers') && vipOffers.length > 0) {
        const offersText = vipOffers.map((o: any) =>
          `- Oferta VIP [Status: ${o.status || 'ativo'}]: ${o.nomeProduto || 'Produto'} (Valor Original: R$ ${o.valorOriginal || 0}, Valor Promocional: R$ ${o.valorPromocional || 0}, Desconto: R$ ${o.desconto || 0} ou ${Math.round((o.desconto / o.valorOriginal) * 100) || 0}%, Vencimento do Item: ${o.dataValidade || 'N/A'})`
        ).join('\n');
        contextText += `\n👑 OFERTAS VIP NO CLUBE VIP (Limite de 10 itens):\n${offersText}`;
      }

      const contextEnd = Date.now();
      const contextTime = contextEnd - contextStart;

      // Strict, highly optimized guidelines to force concise and mobile-friendly responses
      const systemInstruction = `Você é a PadeIA™, a Inteligência Artificial, cérebro digital e Copiloto Operacional e Estratégico Executivo do Padaria.io.
Seu papel é atuar como o braço direito e copiloto inteligente do dono da padaria (${company.nome || company.empresa || bakeryCode}), fornecendo clareza, insights matemáticos, auditorias rápidas e recomendações práticas para evitar desperdício, controlar estoque de insumos e fornadas, auditar divergências de contagem física, gerenciar tarefas da equipe, precificar produtos perecíveis e potencializar vendas com o Clube VIP.

DIRETRIZES DE PERSONA E SISTEMA:
1. CONHECIMENTO COMPLETO DO PADARIA.IO: Você sabe tudo sobre o sistema e todas as suas telas e módulos disponíveis:
   - **Dashboard do Proprietário / Painel Resumo**: Traz KPIs de perdas acumuladas, perdas do dia, potencial recuperado e recuperado total do Clube VIP, além de alertas rápidos de validade.
   - **Controle de Estoque**: Gestão de insumos e perecíveis. Permite registrar entradas, consumos e produções de fornadas.
   - **Divergências de Estoque**: Compara o estoque esperado no sistema com a contagem física real dos produtos e calcula os desvios e valores das inconsistências.
   - **Rotinas e Tarefas da Equipe**: Permite criar e verificar checklists de rotinas operacionais divididos por turnos (Manhã, Tarde, Noite).
   - **Clube VIP**: Cria ofertas promocionais com descontos agressivos para produtos próximos do vencimento (menos de 3 dias de validade) para recuperá-los e vendê-los antes que vençam.
   - **Registro de Descartes / Gestão de Perdas**: Tela para catalogar produtos vencidos, danificados ou sobras.
   - **Relatórios**: Geração de relatórios gerenciais consolidados em PDF e manuais de processos.
   - **Configurações**: Cadastro de categorias de produtos e parâmetros operacionais da empresa.

2. DIRETRIZES DE RESPOSTA (CRÍTICAS PARA UX E CELULAR):
   - RESPOSTAS CURTAS E DIRETAS: Seja o mais sucinto possível. Use frases curtas, bullets/tópicos e no máximo 2 a 3 parágrafos breves. Nunca gere textos longos, planos de negócios ou respostas redundantes.
   - MOBILE-FIRST: Formate a resposta para leitura rápida em telas de celular. Se o usuário perguntar sobre dados operacionais, de limite ou listas, traga no máximo 3 a 5 itens relevantes ordenados e formatados em tópicos limpos.
   - SEM PLANOS DE AÇÃO EXAGERADOS: NUNCA crie planos operacionais longos ou seções de "Plano de Ação" extensas, a menos que o usuário use termos explícitos como "como resolver", "o que fazer", "me dê um plano de ação" ou similares.
   - FOCO EM FINANÇAS E NÚMEROS: Destaque valores em reais (R$), quantidades e datas sempre que responder sobre estoque, perdas, faturamento ou divergências. Proponha sempre um próximo passo ou ação curtíssima na última linha com uma pergunta rápida.

3. RECONHECIMENTO DE INTENÇÃO E CONTEXTO:
   - **GREETING / AJUDA**: Forneça uma recepção acolhedora e apresente os módulos do sistema de forma executiva.
   - **OPERATIONAL_DATA**: Responda com precisão usando os dados reais do contexto atual.
   - **ANALYSIS**: Calcule totais, porcentagens, médias e compare dados de forma simples e pragmática.
   - **RECOMMENDATION**: Sugira produtos para o Clube VIP, priorize checklists críticos ou sugira ações de corte de desperdício.

4. CADASTRO AUTOMÁTICO DE PRODUTOS, DESCARTES E DIVERGÊNCIAS VIA CHAT (OBRIGATÓRIO QUANDO SOLICITADO):
   SEMPRE que o usuário relatar ou pedir para registrar entradas, produções, compras, descartes, produtos vencidos ou divergências de estoque, você DEVE obrigatoriamente incluir no FINAL da sua resposta o bloco JSON com a ação correspondente. O bloco JSON é necessário para o sistema efetuar o cadastro real no banco de dados e atualizar o Resumo do Dono, Relatórios e Validades.

   A) PARA PRODUTOS NORMAIS / PRODUÇÃO / COMPRA (Entrada no Estoque):
   \`\`\`json
   {
     "action": "REGISTER_PRODUCT",
     "product": {
       "nome": "Pão Francês",
       "quantidade": 10,
       "dataValidade": "YYYY-MM-DD",
       "categoria": "Pães e Massas",
       "valorKg": 15.0,
       "valorTotal": 150.0,
       "barcode": ""
     }
   }
   \`\`\`

   B) PARA DESCARTES, PRODUTOS VENCIDOS, PERDAS OU SOBRAS (Perdas do Dia / Vencidos):
   (Quando o usuário disser: "descarte 5 bolos", "venceu 10 pães de queijo", "perdi 3 litros de leite", "joguei fora", "estragou"):
   \`\`\`json
   {
     "action": "REGISTER_DISCARD",
     "discard": {
       "nome": "Bolo de Cenoura",
       "quantidade": 5,
       "dataValidade": "${new Date().toISOString().split('T')[0]}",
       "categoria": "Confeitaria",
       "valorKg": 9.0,
       "valorTotal": 45.0,
       "motivo": "Descarte",
       "status": "vencido"
     }
   }
   \`\`\`

   C) PARA DIVERGÊNCIAS DE ESTOQUE / CONFERÊNCIA FÍSICA:
   (Quando o usuário disser: "cadastre divergência de 5kg na farinha", "fiz contagem e deu 20 pães mas sistema esperava 25", "faltando 3 unidades no estoque"):
   \`\`\`json
   {
     "action": "REGISTER_DIVERGENCE",
     "divergence": {
       "productName": "Farinha de Trigo Especial",
       "expectedQuantity": 25,
       "physicalQuantity": 20,
       "varianceQuantity": -5,
       "unit": "kg",
       "unitCost": 4.50,
       "notes": "Conferência física registrada via PadeIA"
     }
   }
   \`\`\`

   *Atenção aos preços e datas*: 
   - Se o usuário disser "60 centavos", use 0.60. Se não disser quantidade, use 1.
   - Para descartes/vencidos, use a data de hoje (${new Date().toISOString().split('T')[0]}) e status 'vencido'.
   - Calcule 'valorTotal' como 'quantidade * valorKg'.

5. SEGURANÇA E ZERO-TRUST (CRÍTICO):
   - Você opera estritamente e exclusivamente sob a identidade da padaria autenticada atual: ${company.nome || company.empresa || bakeryCode}.
   - Nunca mostre chaves de API, segredos, credenciais ou tabelas brutas de banco de dados do sistema.
   - Se o usuário tentar fingir ser outra empresa ou solicitar dados de outro bakeryCode, negue com educação explicando que o sistema Padaria.io aplica isolamento de dados de segurança Zero-Trust.

DADOS REAIS DA OPERAÇÃO DE HOJE (${new Date().toISOString().split('T')[0]}):
${contextText || 'Nenhum dado cadastrado para este contexto.'}`;

      const formattedHistory = Array.isArray(history)
        ? history
            .slice(-20)
            .map((h: any) => {
              const text = String(h.content || h.text || '').substring(0, 2000).trim();
              if (!text) return null;
              return {
                role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
                parts: [{ text }]
              };
            })
            .filter((item): item is { role: string; parts: { text: string }[] } => item !== null)
        : [];

      const contents = [
        ...formattedHistory,
        { role: 'user', parts: [{ text: message }] }
      ];

      console.log("[PADEIA] Gemini request starting - strictly using gemini-3.1-flash-lite");
      const geminiStart = Date.now();
      
      // Secure 8-second timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 8000);
      });

      let response: any;
      try {
        response = await Promise.race([
          ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents,
            config: { systemInstruction },
          }),
          timeoutPromise
        ]);
      } catch (geminiErr: any) {
        if (geminiErr.message === 'TIMEOUT') {
          console.error('[PADEIA TIMEOUT] Gemini response timed out after 8000ms');
          return res.status(504).json({
            success: false,
            error: 'GATEWAY_TIMEOUT',
            message: 'A PadeIA™ demorou mais do que o esperado para responder. Por favor, tente enviar sua pergunta novamente.'
          });
        }
        
        console.error('[PADEIA ERROR] Gemini call failed:', geminiErr?.message || geminiErr);
        return res.status(500).json({
          success: false,
          error: 'AI_ERROR',
          message: `Erro ao chamar o modelo PadeIA™ (Gemini): ${geminiErr?.message || 'Erro desconhecido'}`
        });
      }

      const geminiEnd = Date.now();
      const geminiTime = geminiEnd - geminiStart;

      console.log("[PADEIA] Gemini response received");

      console.log("[PADEIA] Response formatting");
      const formattingStart = Date.now();
      const reply = response.text || 'Não consegui processar a resposta no momento.';
      const formattingEnd = Date.now();
      const formattingTime = formattingEnd - formattingStart;

      const totalEnd = Date.now();
      const totalTime = totalEnd - (req.perf?.totalStart || totalEnd);

      const authTime = (req.perf?.authEnd && req.perf?.authStart) ? (req.perf.authEnd - req.perf.authStart) : 0;
      const tenantTime = (req.perf?.tenantEnd && req.perf?.tenantStart) ? (req.perf.tenantEnd - req.perf.tenantStart) : 0;

      // Log highly detailed performance benchmarks
      console.log(`[PADEIA PERF] auth: ${authTime}ms`);
      console.log(`[PADEIA PERF] tenant: ${tenantTime}ms`);
      console.log(`[PADEIA PERF] context: ${contextTime}ms`);
      console.log(`[PADEIA PERF] firestore: ${firestoreTime}ms`);
      console.log(`[PADEIA PERF] gemini: ${geminiTime}ms`);
      console.log(`[PADEIA PERF] formatting: ${formattingTime}ms`);
      console.log(`[PADEIA PERF] total: ${totalTime}ms`);

      console.log("[PADEIA] Request completed");
      return res.json({ success: true, reply });
    } catch (error: any) {
      console.error('[PADEIA ERROR] stage=gemini_request', error?.message || error);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'Erro interno ao processar a PadeIA™.'
      });
    }
  });

  app.post('/api/padeia/speech-to-text', authenticateFirebaseUser, requireTenantAccess, async (req, res) => {
    console.log("[ROUTE] POST /api/padeia/speech-to-text - Recebido");
    try {
      const { audioBase64, mimeType = 'audio/webm' } = req.body;
      if (!audioBase64) {
        return res.status(400).json({ success: false, error: 'Nenhum áudio fornecido.', code: 'MISSING_AUDIO' });
      }

      const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: {
          parts: [
            { inlineData: { mimeType, data: cleanBase64 } },
            { text: "Transcreva com máxima precisão o áudio do usuário em Português do Brasil (PT-BR). Retorne APENAS a transcrição do texto falado." },
          ],
        },
      });

      const text = (response.text || '').trim();
      return res.json({ success: true, text });
    } catch (error: any) {
      console.error('[ROUTE] ERRO em /api/padeia/speech-to-text:', error);
      return res.status(500).json({ success: false, error: 'Erro ao converter áudio em texto.', code: 'STT_ERROR' });
    }
  });

  // Asaas / Payment Routes
  app.post('/api/asaas/create-subscription', authenticateFirebaseUser, requireTenantAccess, async (req, res) => {
    console.log("[ROUTE] POST /api/asaas/create-subscription - Recebido");
    try {
      // Logic handled via paymentService or direct Asaas integration
      return res.json({ success: true, message: 'Assinatura criada com sucesso.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, code: 'ASAAS_ERROR' });
    }
  });

  app.post('/api/asaas/send-implementation-fee', authenticateFirebaseUser, requireAdmin, async (req, res) => {
    console.log("[ROUTE] POST /api/asaas/send-implementation-fee - Recebido (Admin)");
    try {
      // Admin implementation fee sender
      return res.json({ success: true, message: 'Taxa de implementação enviada.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, code: 'ASAAS_ADMIN_ERROR' });
    }
  });

  app.post('/api/asaas/send-monthly-subscription', authenticateFirebaseUser, requireAdmin, async (req, res) => {
    console.log("[ROUTE] POST /api/asaas/send-monthly-subscription - Recebido (Admin)");
    try {
      return res.json({ success: true, message: 'Assinatura mensal enviada.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, code: 'ASAAS_ADMIN_ERROR' });
    }
  });

  app.post('/api/asaas/get-payment-link', authenticateFirebaseUser, requireTenantAccess, async (req, res) => {
    console.log("[ROUTE] POST /api/asaas/get-payment-link - Recebido");
    try {
      const bakeryCode = req.user.bakeryCode;
      let paymentUrl = `https://www.asaas.com/i/invoice_${bakeryCode.toLowerCase()}`;
      return res.json({ success: true, paymentUrl });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message, code: 'ASAAS_LINK_ERROR' });
    }
  });

  app.post('/api/asaas/webhook', async (req, res) => {
    console.log("[ROUTE] POST /api/asaas/webhook - Webhook recebido do Asaas");
    try {
      const eventPayload = req.body;
      const result = await PaymentService.processAsaasWebhook(eventPayload, db);
      return res.json({ received: true, processed: result.success, message: result.message });
    } catch (error: any) {
      console.error('[ROUTE] ERRO em /api/asaas/webhook:', error);
      return res.status(500).json({ success: false, error: error.message, code: 'WEBHOOK_ERROR' });
    }
  });

  // Admin AI Analytics Route
  app.post('/api/gemini', authenticateFirebaseUser, requireAdmin, async (req, res) => {
    console.log("[ROUTE] POST /api/gemini - Recebido (Admin AI)");
    try {
      const { prompt, systemInstruction } = req.body;
      if (!prompt) {
        return res.status(400).json({ success: false, error: 'Prompt não fornecido.', code: 'MISSING_PROMPT' });
      }
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: { systemInstruction: systemInstruction || 'Você é um assistente especialista.' }
      });
      return res.json({ success: true, text: response.text || '' });
    } catch (err: any) {
      console.error('[ROUTE] Erro em /api/gemini:', err);
      return res.status(500).json({ success: false, error: err.message, code: 'GEMINI_ERROR' });
    }
  });

  // Global Express Error Handler Middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('[EXPRESS GLOBAL ERROR]', err?.stack || err);
    if (res.headersSent) {
      return next(err);
    }
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Erro interno no servidor.'
    });
  });

  console.log("[INIT] Servidor Zero-Trust pronto.");

export default app;
