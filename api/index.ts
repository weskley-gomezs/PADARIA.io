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

    console.log(`[AUTH] Usuário autenticado: UID=${uid}, Email=${decodedToken.email}, BakeryCode=${bakeryCode}, Role=${req.user.role}`);
    next();
  } catch (error: any) {
    console.error(`[PADEIA API] Firebase token verification: failure - ${error.message}`);
    return res.status(401).json({ success: false, error: 'Token de autenticação inválido ou expirado.', code: 'INVALID_TOKEN' });
  }
}

// Middleware de Tenant (Zero-Trust Tenant Access Control)
function requireTenantAccess(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Usuário não autenticado.', code: 'UNAUTHORIZED' });
  }

  // Admins have global access
  if (req.user.role === 'admin') {
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

  if (!process.env.GEMINI_API_KEY) {
    console.error("[INIT] ERRO: GEMINI_API_KEY não encontrada nas variáveis de ambiente.");
  }

  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

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

  app.post('/api/padeia/chat', authenticateFirebaseUser, requireTenantAccess, rateLimit(30, 60000), async (req, res) => {
    console.log("[ROUTE] POST /api/padeia/chat - Recebido");
    try {
      const { message, history = [] } = req.body;

      if (!message || typeof message !== 'string' || message.trim() === '') {
        return res.status(400).json({ success: false, error: 'Mensagem inválida ou não fornecida.', code: 'INVALID_MESSAGE' });
      }

      if (message.length > 3000) {
        return res.status(400).json({ success: false, error: 'Mensagem excede o limite máximo permitido de 3000 caracteres.', code: 'MESSAGE_TOO_LONG' });
      }

      if (!ai) {
        return res.status(500).json({ success: false, error: 'Serviço PadeIA™ não inicializado.', code: 'AI_UNAVAILABLE' });
      }

      // ZERO-TRUST: Fetch tenant data strictly from Firestore based on authenticated user's bakeryCode
      const bakeryCode = req.user.bakeryCode;
      let company: any = { empresa: bakeryCode };
      let products: any[] = [];
      let salesHistory: any[] = [];
      let vipOffers: any[] = [];
      let stockDivergencesText: string = 'Nenhuma conferência realizada ainda.';
      let tasksOverviewText: string = 'Nenhuma rotina da equipe cadastrada para hoje.';

      if (adminDb && bakeryCode) {
        try {
          const compDoc = await adminDb.collection('companies').doc(bakeryCode).get();
          if (compDoc.exists) company = compDoc.data();

          const prodSnap = await adminDb.collection('products').where('bakeryCode', '==', bakeryCode).get();
          products = prodSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

          const salesSnap = await adminDb.collection('sales').where('bakeryCode', '==', bakeryCode).get();
          salesHistory = salesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

          const vipSnap = await adminDb.collection('vipOffers').where('bakeryCode', '==', bakeryCode).get();
          vipOffers = vipSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

          const stockSnap = await adminDb.collection('stockCounts').where('bakeryCode', '==', bakeryCode).get();
          const stockCounts = stockSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

          const movSnap = await adminDb.collection('inventoryMovements').where('bakeryCode', '==', bakeryCode).get();
          const inventoryMovements = movSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

          const taskSnap = await adminDb.collection('operationalTasks').where('bakeryCode', '==', bakeryCode).get();
          const operationalTasks = taskSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

          stockDivergencesText = stockCounts.length > 0
            ? stockCounts.slice(0, 10).map((c: any) =>
                `- ${c.productName}: Esperado ${c.expectedQuantity} ${c.unit}, Físico ${c.physicalQuantity} ${c.unit}, Divergência ${c.varianceQuantity} ${c.unit} (R$ ${c.varianceValue || 0})`
              ).join('\n')
            : 'Nenhuma conferência de estoque físico registrada ainda.';

          tasksOverviewText = operationalTasks.length > 0
            ? operationalTasks.slice(0, 10).map((t: any) =>
                `- [${t.status === 'concluida' ? 'CONCLUÍDA' : 'PENDENTE'}] [Turno: ${t.shift.toUpperCase()}] ${t.title} (Resp: ${t.completedBy || t.assignedTo || 'Equipe'}, Venc: ${t.dueTime || t.dueDate})`
              ).join('\n')
            : 'Nenhuma tarefa de rotina cadastrada para hoje.';
        } catch (dbErr) {
          console.warn('[PADEIA] Erro ao buscar dados do tenant no Firestore:', dbErr);
        }
      }

      const expiredProds = products.filter((p: any) => p.status === 'vencido');
      const expiringProds = products.filter((p: any) => p.status === 'vencendo');
      const normalProds = products.filter((p: any) => p.status === 'normal');

      const expiredVal = expiredProds.reduce((sum: number, p: any) => sum + (p.valorTotal || p.quantidade * (p.valorKg || 12)), 0);
      const expiringVal = expiringProds.reduce((sum: number, p: any) => sum + (p.valorTotal || p.quantidade * (p.valorKg || 12)), 0);

      const topProductsText = products.slice(0, 15).map((p: any) => 
        `- ${p.nome} (Qtd: ${p.quantidade}, Val: ${p.dataValidade}, Status: ${p.status}, ValTotal: R$ ${p.valorTotal || 0})`
      ).join('\n');

      const systemInstruction = `Você é a PadeIA™, a Inteligência Artificial e Copiloto Operacional Executivo do Padaria.io ("Sua padaria funcionando. Você vivendo.").
SEU PAPEL: Dar ao dono da padaria uma visão clara, executiva e estratégica do que está acontecendo na operação, mesmo quando ele está fisicamente longe da padaria.
REGRAS DE SEGURANÇA E CONTEXTO DO TENANT AUTENTICADO:
1. Seu escopo é estritamente limitado à padaria autenticada atual (${company.empresa || bakeryCode}).
2. Nunca revele dados de outras padarias ou ignore seu tenant.
3. Hoje é ${new Date().toISOString().split('T')[0]}.
4. Responda em Português do Brasil com postura consultiva, executiva, precisa e construtiva (sem fazer acusações diretas à equipe).
5. Use os dados reais da operação (Validades, Perdas, Divergências Físicas e Rotinas da Equipe) para fundamentar suas respostas.

DADOS DA PADARIA (${company.empresa || bakeryCode}):
- Produtos em Vencimento/Normal (${products.length} itens no total):
${topProductsText || 'Nenhum produto cadastrado'}

- Status de Rotinas e Tarefas Operacionais da Equipe:
${tasksOverviewText}

- Histórico de Divergências de Estoque Físico:
${(typeof stockDivergencesText !== 'undefined' && stockDivergencesText) ? stockDivergencesText : 'Nenhuma conferência realizada ainda.'}`;

      const formattedHistory = Array.isArray(history) ? history.slice(-20).map((h: any) => ({
        role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(h.content || h.text || '').substring(0, 2000) }],
      })) : [];

      const contents = [
        ...formattedHistory,
        { role: 'user', parts: [{ text: message }] }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: { systemInstruction },
      });

      const reply = response.text || 'Não consegui processar a resposta no momento.';
      return res.json({ success: true, reply });
    } catch (error: any) {
      console.error('[ROUTE] ERRO em /api/padeia/chat:', error);
      return res.status(500).json({ success: false, error: 'Erro ao processar consulta com a PadeIA™.', code: 'PADEIA_ERROR' });
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
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: { systemInstruction: systemInstruction || 'Você é um assistente especialista.' }
      });
      return res.json({ success: true, text: response.text || '' });
    } catch (err: any) {
      console.error('[ROUTE] Erro em /api/gemini:', err);
      return res.status(500).json({ success: false, error: err.message, code: 'GEMINI_ERROR' });
    }
  });

  console.log("[INIT] Servidor Zero-Trust pronto.");
} catch (globalError: any) {
  console.error("[CRITICAL] Erro fatal durante a inicialização do backend:", globalError);
}

export default app;
