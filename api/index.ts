console.log("[VERCEL] API entry point called (/api/index.ts)");

import express from 'express';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import { PaymentService } from '../src/services/paymentService.js';

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

console.log("[INIT] Inicializando servidor Express em /api/index.ts...");
const app = express();
app.use(express.json({ limit: '10mb' }));

let db: any = null;
let ai: any = null;

try {
  console.log("[INIT] Verificando configuração do Firebase...");
  // Tenta carregar o config de vários lugares comuns
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

  console.log(`[INIT] Usando caminho do config Firebase: ${firebaseConfigPath}`);

  if (fs.existsSync(firebaseConfigPath)) {
    console.log("[INIT] Arquivo firebase-applet-config.json encontrado.");
    const configRaw = fs.readFileSync(firebaseConfigPath, 'utf8');
    
    try {
      const firebaseConfig = JSON.parse(configRaw);
      console.log("[INIT] Conteúdo do JSON do Firebase carregado com sucesso.");
      
      console.log("[INIT] Inicializando Firebase App...");
      const firebaseApp = initializeApp(firebaseConfig);
      db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
      console.log("[INIT] Firebase inicializado com sucesso.");
    } catch (jsonError) {
      console.error("[INIT] Erro ao parsear o JSON do Firebase:", jsonError);
    }
  } else {
    console.log("[INIT] AVISO: Arquivo firebase-applet-config.json NÃO encontrado em nenhum dos caminhos tentados.");
  }

  console.log("[INIT] Verificando GEMINI_API_KEY...");
  if (!process.env.GEMINI_API_KEY) {
    console.error("[INIT] ERRO: GEMINI_API_KEY não encontrada nas variáveis de ambiente.");
  } else {
    console.log("[INIT] GEMINI_API_KEY encontrada.");
  }

  console.log("[INIT] Inicializando Gemini...");
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("[INIT] Gemini inicializado.");

  console.log("[INIT] Registrando rotas...");
  
  app.get('/api/health', (req, res) => {
    console.log("[ROUTE] GET /api/health - Recebido");
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.VERCEL ? 'vercel' : 'local' });
  });

  app.post('/api/analyze-product-image', async (req, res) => {
    console.log("[ROUTE] POST /api/analyze-product-image - Recebido");
    try {
      const { imageBase64, bakeryCode } = req.body;
      
      if (!imageBase64) {
        console.warn("[ROUTE] Falha: Nenhuma imagem fornecida no body.");
        return res.status(400).json({ error: 'Nenhuma imagem fornecida.' });
      }

      console.log("[ROUTE] Processando base64 e iniciando chamada ao Gemini...");
      const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      console.log(`[GEMINI] Chamando generateContent com modelo gemini-3.1-flash-lite (MIME: ${mimeType})...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data,
              },
            },
            {
              text: "Você é um assistente especialista de leitura de etiquetas e rótulos de padaria/supermercado. Analise a imagem fornecida da etiqueta do produto e extraia os seguintes 7 dados com extrema precisão:\n1. nome: O nome do produto impresso na etiqueta (ex: PÃO DE QUEIJO, BOLO DE CENOURA, QUEIJO MUSSARELA, PRESUNTO).\n2. dataFabricacao: Data de fabricação no formato YYYY-MM-DD. Deixe em branco se não houver.\n3. dataValidade: Data de validade no formato YYYY-MM-DD. Deixe em branco se não houver.\n4. peso: O peso líquido do produto impresso na etiqueta em Quilos (KG) como número. Exemplo: se for 350g ou 0,350kg, retorne 0.35. Se for 1,200kg, retorne 1.2.\n5. valorKg: O preço por quilo (R$/KG) impresso na etiqueta como número.\n6. valorTotal: O valor total / preço final cobrado pelo produto (R$) impresso na etiqueta como número.\n7. barcode: O código de barras impresso na etiqueta. Pode ser um EAN-13 (ex: 7891234567890) ou o código numérico impresso abaixo do código de barras da balança (ex: 200012345678). Extraia apenas os dígitos numéricos sem caracteres especiais.\n\nRetorne rigorosamente em formato JSON. Extraia todos os dados visíveis sem omitir nada.",
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              nome: {
                type: Type.STRING,
                description: "O nome do produto identificado na embalagem/etiqueta.",
              },
              dataFabricacao: {
                type: Type.STRING,
                description: "A data de fabricação impressa no formato YYYY-MM-DD.",
              },
              dataValidade: {
                type: Type.STRING,
                description: "A data de validade impressa no formato YYYY-MM-DD.",
              },
              peso: {
                type: Type.NUMBER,
                description: "O peso do produto em KG (ex: 0.35 para 350g, 1.20 para 1.20kg).",
              },
              valorKg: {
                type: Type.NUMBER,
                description: "O valor por quilo do produto (R$/KG) em formato numérico.",
              },
              valorTotal: {
                type: Type.NUMBER,
                description: "O valor total do produto (preço final R$) em formato numérico.",
              },
              barcode: {
                type: Type.STRING,
                description: "O código de barras numérico impresso na etiqueta (ex: 7891234567890 ou código da balança).",
              },
            },
            required: ["nome"],
          },
        },
      });

      console.log("[GEMINI] Resposta recebida.");
      let text = response.text || "{}";
      text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const result = JSON.parse(text);

      // If bakeryCode is provided and DB is available, save product directly to Firestore
      if (bakeryCode && db) {
        console.log(`[FIRESTORE] Salvando produto escaneado diretamente no Firestore para bakeryCode: ${bakeryCode}...`);
        const todayStr = new Date().toISOString().split('T')[0];
        const valDate = result.dataValidade || todayStr;
        
        // Calculate days remaining
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(valDate + 'T00:00:00');
        const diffTime = target.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const status = daysRemaining < 0 ? 'vencido' : daysRemaining <= 3 ? 'vencendo' : 'normal';

        const productId = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const newProduct = {
          id: productId,
          bakeryCode: String(bakeryCode).trim().toUpperCase(),
          nome: result.nome || 'Produto Escaneado',
          quantidade: 1,
          dataValidade: valDate,
          categoria: 'Descarte IA',
          dataCadastro: todayStr,
          diasParaVencer: daysRemaining,
          status: status,
          barcode: result.barcode ? String(result.barcode).trim() : '',
          peso: typeof result.peso === 'number' ? result.peso : null,
          valorKg: typeof result.valorKg === 'number' ? result.valorKg : null,
          dataFabricacao: result.dataFabricacao || null,
          valorTotal: typeof result.valorTotal === 'number' ? result.valorTotal : null,
          motivo: 'Vencimento',
          notas: 'Registrado via Leitura de Etiquetas IA',
        };

        await setDoc(doc(db, 'products', productId), removeUndefined(newProduct));
        console.log(`[FIRESTORE] Confirmação de gravação do produto ${productId} no Firestore com SUCESSO!`);
        return res.json({
          ...result,
          savedToFirestore: true,
          product: newProduct,
        });
      }

      res.json(result);
    } catch (error: any) {
      console.error('[ROUTE] ERRO em /api/analyze-product-image:', error);
      res.status(500).json({ 
        error: 'Erro ao processar imagem.',
        details: error.message
      });
    }
  });

  app.post('/api/padeia/chat', async (req, res) => {
    console.log("[ROUTE] POST /api/padeia/chat - Recebido");
    try {
      const { message, history = [], contextData = {} } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Mensagem inválida ou não fornecida.' });
      }

      if (!ai) {
        return res.status(500).json({ error: 'O serviço de IA PadeIA™ não está inicializado no servidor.' });
      }

      const company = contextData.company || {};
      const products: any[] = contextData.products || [];
      const salesHistory: any[] = contextData.salesHistory || [];
      const vipOffers: any[] = contextData.vipOffers || [];

      // Calculate context metrics
      const expiredProds = products.filter((p: any) => p.status === 'vencido');
      const expiringProds = products.filter((p: any) => p.status === 'vencendo');
      const normalProds = products.filter((p: any) => p.status === 'normal');

      const expiredVal = expiredProds.reduce((sum: number, p: any) => sum + (p.valorTotal || p.quantidade * (p.valorKg || 12)), 0);
      const expiringVal = expiringProds.reduce((sum: number, p: any) => sum + (p.valorTotal || p.quantidade * (p.valorKg || 12)), 0);

      const vipActive = vipOffers.filter((o: any) => o.status === 'ativo');
      const vipPotential = vipActive.reduce((sum: number, o: any) => sum + (o.valorPromocional || 0), 0);
      const vipRecovered = vipOffers.filter((o: any) => o.status === 'vendido').reduce((sum: number, o: any) => sum + (o.valorPromocional || o.valorOriginal || 0), 0);

      // Summarize product highlights (top 15 items)
      const topProductsText = products.slice(0, 15).map((p: any) => 
        `- ${p.nome} (Qtd: ${p.quantidade}, Val: ${p.dataValidade}, Status: ${p.status}, Categoria: ${p.categoria || 'Geral'}, ValorTotal: R$ ${p.valorTotal || (p.quantidade * (p.valorKg || 12)).toFixed(2)})`
      ).join('\n');

      const vipOffersText = vipOffers.slice(0, 10).map((o: any) =>
        `- ${o.nomeProduto} (Original: R$ ${o.valorOriginal}, Promo: R$ ${o.valorPromocional}, Desc: ${o.desconto}%, Val: ${o.dataValidade}, Status: ${o.status})`
      ).join('\n');

      const systemInstruction = `Você é a PadeIA™, a Inteligência Artificial oficial do Padaria.io e a Gerente Inteligente Especializada em Panificação, Confeitarias e Supermercados.

REGRAS RÍGIDAS DE IDENTIDADE E COMPORTAMENTO:
1. Seu nome é estritamente PadeIA™.
2. Sua descrição oficial é: "Sua gerente inteligente especializada em panificação."
3. NUNCA, sob nenhuma hipótese, mencione Gemini, Google AI, ChatGPT, OpenAI, Anthropic ou qualquer outro modelo/fornecedor de IA. Para o usuário, você é simplesmente a PadeIA™, a IA nativa do Padaria.io.
4. Se perguntarem "quem criou você" ou "qual seu modelo", responda: "Eu sou a PadeIA™, a Inteligência Artificial oficial desenvolvida para o Padaria.io com foco em gestão de panificação, controle de estoques e redução de desperdícios."
5. Idioma: Português do Brasil (PT-BR).
6. Tom de voz: Profissional, objetivo, extremamente inteligente, educado, consultivo, amigável e especialista em panificação.
7. Áreas de Especialidade: Validade e PVPS/FIFO, gestão de perdas e descartes, precificação inteligente, cálculo de margem e markup, controle de estoque, vigilância sanitária e análise de indicadores financeiros.
8. RESTRIÇÃO ABSOLUTA: O módulo "Clube VIP" foi desativado/ocultado pelo usuário. NUNCA mencione o Clube VIP, promoções do clube VIP ou ofertas VIP em suas respostas, sob nenhuma circunstância.

DADOS EM TEMPO REAL DA PADARIA CONECTADA:
- Nome da Empresa: ${company.empresa || 'Minha Padaria'}
- Código de Ativação: ${company.codigoAtivacao || 'N/A'}
- E-mail do Responsável: ${company.email || 'N/A'}

RESUMO EXECUTIVO DO ESTOQUE E PERDAS:
- Total de Itens Registrados: ${products.length}
- Produtos Vencidos: ${expiredProds.length} (Perda total estimada: R$ ${expiredVal.toFixed(2)})
- Produtos Vencendo nos próximos 3 dias: ${expiringProds.length} (Valor em risco: R$ ${expiringVal.toFixed(2)})
- Produtos com Validade em Dia: ${normalProds.length}
- Vendas e Recuperações Registradas no Histórico: ${salesHistory.length} vendas

AMOSTRA DE PRODUTOS NO SISTEMA:
${topProductsText || 'Nenhum produto cadastrado no momento.'}

INSTRUÇÕES DE RESPOSTA AO USUÁRIO:
- Forneça respostas diretas, estruturadas e fáceis de ler. Utilize tópicos, negritos, emojis adequados e listas.
- Sempre que o usuário perguntar sobre prejuízos, produtos vencendo, o que fazer para economizar ou como precificar, utilize os dados acima para dar respostas personalizadas e exatas.
- Se não houver dados suficientes no contexto para responder com precisão (ex: dados de funcionários específicos não cadastrados ou um produto que não está na lista), responda educadamente: "Ainda não possuo informações suficientes para responder isso com precisão."
- Ofereça ajuda proativa no final da resposta sugerindo um próximo passo estratégico.`;

      const formattedHistory = history.map((h: any) => ({
        role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content || h.text || '' }],
      }));

      const contents = [
        ...formattedHistory,
        {
          role: 'user',
          parts: [{ text: message }],
        }
      ];

      console.log("[PADEIA] Gerando resposta com Gemini 3.6 Flash...");
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      const reply = response.text || 'Não consegui processar a resposta no momento. Por favor, tente novamente.';
      console.log("[PADEIA] Resposta gerada com sucesso!");

      return res.json({ reply });
    } catch (error: any) {
      console.error('[ROUTE] ERRO em /api/padeia/chat:', error);
      res.status(500).json({ 
        error: 'Erro ao processar consulta com a PadeIA™.', 
        details: error.message 
      });
    }
  });

  async function parseAsaasResponse(res: any): Promise<any> {
    const status = res.status;
    const is2xx = res.ok || (status >= 200 && status < 300);

    const headersLog = {
      'content-type': res.headers?.get?.('content-type') || '',
      'x-request-id': res.headers?.get?.('x-request-id') || '',
      'date': res.headers?.get?.('date') || '',
    };

    let text = '';
    try {
      text = await res.text();
    } catch (err: any) {
      console.error(`[ASAAS] Erro ao ler corpo da resposta (Status ${status}):`, err);
    }

    console.log(`[ASAAS RESPONSE] HTTP Status: ${status}`);
    console.log(`[ASAAS HEADERS]:`, JSON.stringify(headersLog));
    console.log(`[ASAAS BODY]:`, text);

    let parsedData: any = {};
    try {
      parsedData = text ? JSON.parse(text) : {};
    } catch (jsonErr) {
      console.warn(`[ASAAS] Resposta com corpo não-JSON (Status ${status})`);
      parsedData = { rawText: text };
    }

    if (is2xx) {
      return parsedData;
    }

    const errorDescription =
      parsedData?.errors?.[0]?.description ||
      parsedData?.error ||
      `Erro na API Asaas (HTTP ${status})`;

    return {
      error: errorDescription,
      details: parsedData,
      _httpStatus: status,
    };
  }

  app.post('/api/asaas/create-subscription', async (req, res) => {
    console.log("[ROUTE] POST /api/asaas/create-subscription - Recebido");
    try {
      const {
        empresa,
        email,
        telefone,
        cnpj,
        codigoAtivacao,
        valorImplementacao,
        valorMensalidade,
        teste1Dia,
        dataInicioCobranca,
      } = req.body;

      const asaasApiKey = process.env.ASAAS_API_KEY;
      const asaasEnvironment = process.env.ASAAS_ENVIRONMENT || 'production';

      if (!asaasApiKey) {
        return res.status(400).json({ 
          error: 'A chave de API do Asaas não está configurada no servidor (Vercel). Configure a variável de ambiente ASAAS_API_KEY.' 
        });
      }

      const baseUrl = asaasEnvironment === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/v3';

      console.log(`[ASAAS] Conectando ao Asaas (${asaasEnvironment})...`);

      const extRef = codigoAtivacao ? String(codigoAtivacao).trim().toUpperCase() : undefined;

      // 1. Create or find customer in Asaas
      const customerRes = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify({
          name: empresa,
          email: email,
          cpfCnpj: cnpj || undefined,
          phone: telefone || undefined,
          externalReference: extRef,
        }),
      });

      const customerData = await parseAsaasResponse(customerRes);
      let customerId = customerData?.id;

      if (!customerRes.ok) {
        console.warn(`[ASAAS] Aviso/Erro ao criar cliente (HTTP ${customerRes.status}). Buscando cliente existente...`);
        if (extRef || email || cnpj) {
          let searchUrl = `${baseUrl}/customers?`;
          if (extRef) searchUrl += `externalReference=${encodeURIComponent(extRef)}`;
          else if (email) searchUrl += `&email=${encodeURIComponent(email)}`;
          else if (cnpj) searchUrl += `&cpfCnpj=${encodeURIComponent(cnpj)}`;

          try {
            const searchRes = await fetch(searchUrl, {
              headers: { 'access_token': asaasApiKey }
            });
            if (searchRes.ok) {
              const searchData = await parseAsaasResponse(searchRes);
              if (searchData.data && searchData.data.length > 0) {
                customerId = searchData.data[0].id;
                console.log(`[ASAAS] Cliente existente localizado no Asaas: ${customerId}`);
              }
            }
          } catch (sErr) {
            console.warn('[ASAAS] Erro ao buscar cliente existente:', sErr);
          }
        }

        if (!customerId) {
          console.error('[ASAAS] Erro definitivo ao criar/localizar cliente no Asaas:', customerData);
          return res.status(customerRes.status || 400).json({
            error: customerData.error || 'Erro ao criar cliente no Asaas',
            details: customerData
          });
        }
      }

      console.log(`[ASAAS] Cliente Asaas obtido: ${customerId} (extRef: ${extRef})`);

      // Calculate next due date
      let nextDueDate = '';
      if (dataInicioCobranca && dataInicioCobranca.trim() !== '') {
        nextDueDate = dataInicioCobranca.trim();
      } else {
        const today = new Date();
        if (teste1Dia) {
          today.setDate(today.getDate() + 1);
        } else {
          today.setMonth(today.getMonth() + 1);
        }
        nextDueDate = today.toISOString().split('T')[0];
      }

      // 2. Create subscription in Asaas
      const subRes = await fetch(`${baseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: 'BOLETO',
          value: valorMensalidade || 199,
          nextDueDate: nextDueDate,
          cycle: 'MONTHLY',
          description: 'Assinatura Mensal PADARIA.io - Controle de Desperdícios',
          externalReference: extRef,
        }),
      });

      const subData = await parseAsaasResponse(subRes);
      if (!subRes.ok) {
        console.error('[ASAAS] Erro ao criar assinatura no Asaas:', subData);
        return res.status(subRes.status || 400).json({
          error: subData.error || 'Erro ao criar assinatura no Asaas',
          details: subData
        });
      }

      console.log(`[ASAAS] Assinatura criada com sucesso: ${subData.id}`);

      // 3. Create implementation fee charge if valorImplementacao > 0
      let paymentLink = subData.invoiceUrl || subData.bankSlipUrl || '';
      if (valorImplementacao && valorImplementacao > 0) {
        const payRes = await fetch(`${baseUrl}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'access_token': asaasApiKey,
          },
          body: JSON.stringify({
            customer: customerId,
            billingType: 'BOLETO',
            value: valorImplementacao,
            dueDate: new Date().toISOString().split('T')[0],
            description: 'Taxa de Implementação - PADARIA.io',
            externalReference: extRef,
          }),
        });
        const payData = await parseAsaasResponse(payRes);
        if (payRes.ok && (payData.invoiceUrl || payData.bankSlipUrl)) {
          paymentLink = payData.invoiceUrl || payData.bankSlipUrl;
        }
      }

      // If paymentLink is still empty, fetch the pending payments for this subscription
      if (!paymentLink && subData.id) {
        try {
          const subPaymentsRes = await fetch(`${baseUrl}/subscriptions/${subData.id}/payments`, {
            headers: {
              'Content-Type': 'application/json',
              'access_token': asaasApiKey,
            },
          });
          if (subPaymentsRes.ok) {
            const subPaymentsData = await parseAsaasResponse(subPaymentsRes);
            if (subPaymentsData.data && subPaymentsData.data.length > 0) {
              const firstPayment = subPaymentsData.data[0];
              paymentLink = firstPayment.invoiceUrl || firstPayment.bankSlipUrl || '';
            }
          }
        } catch (err) {
          console.warn('[ASAAS] Aviso ao consultar cobranças da assinatura:', err);
        }
      }

      if (extRef && db) {
        try {
          const compData = {
            financeiro: {
              asaasCustomerId: customerId ?? null,
              asaasSubscriptionId: subData?.id ?? null,
              asaasPaymentLink: paymentLink || null,
              ultimoLinkPagamento: paymentLink || null,
              statusAssinatura: 'PENDENTE',
            }
          };
          console.log("DADOS ANTES DO FIRESTORE", JSON.stringify(compData));
          await setDoc(doc(db, 'companies', extRef), removeUndefined(compData), { merge: true });
        } catch (e) {
          console.warn('[FIRESTORE] Erro ao atualizar empresa no Firestore:', e);
        }
      }

      return res.json({
        success: true,
        customerId,
        subscriptionId: subData.id,
        paymentLink: paymentLink || '',
        nextDueDate,
        asaasEnvironment,
      });
    } catch (error: any) {
      console.error('[ROUTE] ERRO em /api/asaas/create-subscription:', error);
      res.status(500).json({ error: 'Erro ao integrar com Asaas', details: error.message });
    }
  });

  // Endpoint to send single Implementation Fee Boleto via Asaas
  app.post('/api/asaas/send-implementation-fee', async (req, res) => {
    console.log("[ROUTE] POST /api/asaas/send-implementation-fee - Recebido");
    try {
      const {
        codigoAtivacao,
        empresa,
        email,
        telefone,
        cnpj,
        valorImplementacao,
        dataVencimento,
      } = req.body;

      const asaasApiKey = process.env.ASAAS_API_KEY;
      const asaasEnvironment = process.env.ASAAS_ENVIRONMENT || 'production';

      if (!asaasApiKey) {
        return res.status(400).json({
          error: 'A chave de API do Asaas não está configurada no servidor (ASAAS_API_KEY).'
        });
      }

      const baseUrl = asaasEnvironment === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/v3';

      const extRef = codigoAtivacao ? String(codigoAtivacao).trim().toUpperCase() : undefined;
      const valImp = Number(valorImplementacao) || 1500;
      const dueDateStr = dataVencimento && dataVencimento.trim() !== ''
        ? dataVencimento.trim()
        : new Date().toISOString().split('T')[0];

      // 1. Get or Create Customer on Asaas
      let customerId: string | null = null;
      const custRes = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify({
          name: empresa,
          email: email,
          cpfCnpj: cnpj || undefined,
          phone: telefone || undefined,
          externalReference: extRef,
        }),
      });

      const custData = await parseAsaasResponse(custRes);
      if (custRes.ok && custData.id) {
        customerId = custData.id;
      } else if (extRef || email) {
        // Search for existing
        let searchUrl = `${baseUrl}/customers?`;
        if (extRef) searchUrl += `externalReference=${encodeURIComponent(extRef)}`;
        else if (email) searchUrl += `&email=${encodeURIComponent(email)}`;

        const searchRes = await fetch(searchUrl, { headers: { 'access_token': asaasApiKey } });
        if (searchRes.ok) {
          const searchData = await parseAsaasResponse(searchRes);
          if (searchData.data && searchData.data.length > 0) {
            customerId = searchData.data[0].id;
          }
        }
      }

      if (!customerId) {
        return res.status(400).json({
          error: custData.error || 'Não foi possível cadastrar ou localizar o cliente no Asaas.'
        });
      }

      // 2. Create Implementation Payment Charge in Asaas
      const payRes = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: 'BOLETO',
          value: valImp,
          dueDate: dueDateStr,
          description: `Taxa de Implementação - PADARIA.io (${empresa})`,
          externalReference: extRef,
        }),
      });

      const payData = await parseAsaasResponse(payRes);
      if (!payRes.ok) {
        return res.status(payRes.status || 400).json({
          error: payData.error || 'Erro ao gerar boleto de implementação no Asaas.',
          details: payData
        });
      }

      const paymentLink = payData.invoiceUrl || payData.bankSlipUrl || payData.paymentLink || '';

      // 3. Update Firestore if db is ready
      if (extRef && db) {
        try {
          const compData = {
            financeiro: {
              asaasCustomerId: customerId,
              asaasPaymentLink: paymentLink,
              ultimoLinkPagamento: paymentLink,
              tipoUltimoLink: 'implementacao',
              valorImplementacao: valImp,
              implementacaoPaga: false,
            }
          };
          await setDoc(doc(db, 'companies', extRef), removeUndefined(compData), { merge: true });
        } catch (e) {
          console.warn('[FIRESTORE] Erro ao atualizar implementação no Firestore:', e);
        }
      }

      return res.json({
        success: true,
        paymentId: payData.id,
        paymentUrl: paymentLink,
        invoiceUrl: paymentLink,
        valorImplementacao: valImp,
        dataVencimento: dueDateStr,
        message: `Boleto de implementação (R$ ${valImp.toFixed(2)}) enviado direto para o e-mail ${email} via Asaas!`
      });
    } catch (error: any) {
      console.error('[ROUTE] ERRO em /api/asaas/send-implementation-fee:', error);
      res.status(500).json({ error: 'Erro ao enviar taxa de implementação no Asaas', details: error.message });
    }
  });

  // Endpoint to send/start Monthly Subscription Boleto via Asaas
  app.post('/api/asaas/send-monthly-subscription', async (req, res) => {
    console.log("[ROUTE] POST /api/asaas/send-monthly-subscription - Recebido");
    try {
      const {
        codigoAtivacao,
        empresa,
        email,
        telefone,
        cnpj,
        valorMensalidade,
        dataVencimento,
      } = req.body;

      const asaasApiKey = process.env.ASAAS_API_KEY;
      const asaasEnvironment = process.env.ASAAS_ENVIRONMENT || 'production';

      if (!asaasApiKey) {
        return res.status(400).json({
          error: 'A chave de API do Asaas não está configurada no servidor (ASAAS_API_KEY).'
        });
      }

      const baseUrl = asaasEnvironment === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/v3';

      const extRef = codigoAtivacao ? String(codigoAtivacao).trim().toUpperCase() : undefined;
      const valMensal = Number(valorMensalidade) || 199;
      const nextDueDateStr = dataVencimento && dataVencimento.trim() !== ''
        ? dataVencimento.trim()
        : new Date().toISOString().split('T')[0];

      // 1. Get or Create Customer on Asaas
      let customerId: string | null = null;
      const custRes = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify({
          name: empresa,
          email: email,
          cpfCnpj: cnpj || undefined,
          phone: telefone || undefined,
          externalReference: extRef,
        }),
      });

      const custData = await parseAsaasResponse(custRes);
      if (custRes.ok && custData.id) {
        customerId = custData.id;
      } else if (extRef || email) {
        let searchUrl = `${baseUrl}/customers?`;
        if (extRef) searchUrl += `externalReference=${encodeURIComponent(extRef)}`;
        else if (email) searchUrl += `&email=${encodeURIComponent(email)}`;

        const searchRes = await fetch(searchUrl, { headers: { 'access_token': asaasApiKey } });
        if (searchRes.ok) {
          const searchData = await parseAsaasResponse(searchRes);
          if (searchData.data && searchData.data.length > 0) {
            customerId = searchData.data[0].id;
          }
        }
      }

      if (!customerId) {
        return res.status(400).json({
          error: custData.error || 'Não foi possível cadastrar ou localizar o cliente no Asaas.'
        });
      }

      // 2. Create Monthly Subscription on Asaas
      const subRes = await fetch(`${baseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasApiKey,
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: 'BOLETO',
          value: valMensal,
          nextDueDate: nextDueDateStr,
          cycle: 'MONTHLY',
          description: `Assinatura Mensal PADARIA.io - ${empresa}`,
          externalReference: extRef,
        }),
      });

      const subData = await parseAsaasResponse(subRes);
      if (!subRes.ok) {
        return res.status(subRes.status || 400).json({
          error: subData.error || 'Erro ao criar assinatura mensal no Asaas.',
          details: subData
        });
      }

      let paymentLink = subData.invoiceUrl || subData.bankSlipUrl || '';

      // If invoiceUrl isn't directly on subData, fetch the first payment generated for this sub
      if (!paymentLink && subData.id) {
        try {
          const subPayRes = await fetch(`${baseUrl}/subscriptions/${subData.id}/payments`, {
            headers: { 'access_token': asaasApiKey },
          });
          if (subPayRes.ok) {
            const subPayData = await parseAsaasResponse(subPayRes);
            if (subPayData.data && subPayData.data.length > 0) {
              paymentLink = subPayData.data[0].invoiceUrl || subPayData.data[0].bankSlipUrl || '';
            }
          }
        } catch (e) {
          console.warn('[ASAAS] Aviso ao buscar boleto da assinatura:', e);
        }
      }

      // 3. Update Firestore
      if (extRef && db) {
        try {
          const compData = {
            financeiro: {
              asaasCustomerId: customerId,
              asaasSubscriptionId: subData.id,
              asaasPaymentLink: paymentLink || null,
              ultimoLinkPagamento: paymentLink || null,
              tipoUltimoLink: 'mensalidade',
              valorMensalidade: valMensal,
              dataProximaCobranca: nextDueDateStr,
              statusAssinatura: 'pendente',
            }
          };
          await setDoc(doc(db, 'companies', extRef), removeUndefined(compData), { merge: true });
        } catch (e) {
          console.warn('[FIRESTORE] Erro ao atualizar assinatura no Firestore:', e);
        }
      }

      return res.json({
        success: true,
        subscriptionId: subData.id,
        paymentUrl: paymentLink,
        valorMensalidade: valMensal,
        nextDueDate: nextDueDateStr,
        message: `Assinatura mensal de R$ ${valMensal.toFixed(2)} ativada no Asaas com vencimento em ${nextDueDateStr}. Boleto enviado para ${email}!`
      });
    } catch (error: any) {
      console.error('[ROUTE] ERRO em /api/asaas/send-monthly-subscription:', error);
      res.status(500).json({ error: 'Erro ao enviar mensalidade no Asaas', details: error.message });
    }
  });

  // Endpoint to fetch or generate official Asaas payment/invoice URL
  app.post('/api/asaas/get-payment-link', async (req, res) => {
    console.log("[ROUTE] POST /api/asaas/get-payment-link - Recebido");
    try {
      const {
        codigoAtivacao,
        empresa,
        email,
        telefone,
        cnpj,
        valorMensalidade,
        valorImplementacao,
        asaasCustomerId,
        asaasSubscriptionId,
      } = req.body;

      const asaasApiKey = process.env.ASAAS_API_KEY;
      const asaasEnvironment = process.env.ASAAS_ENVIRONMENT || 'production';

      const baseUrl = asaasEnvironment === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/v3';

      const extRef = codigoAtivacao ? String(codigoAtivacao).trim().toUpperCase() : undefined;

      let paymentUrl = '';
      let customerId = asaasCustomerId;
      let subscriptionId = asaasSubscriptionId;

      // 1. If ASAAS_API_KEY exists, query Asaas API for subscription/customer charges
      if (asaasApiKey) {
        try {
          // If subscriptionId exists, get payments for subscription
          if (subscriptionId) {
            const subPayRes = await fetch(`${baseUrl}/subscriptions/${subscriptionId}/payments`, {
              headers: { 'access_token': asaasApiKey },
            });
            if (subPayRes.ok) {
              const subPayData = await parseAsaasResponse(subPayRes);
              if (subPayData.data && subPayData.data.length > 0) {
                const firstPayment = subPayData.data[0];
                paymentUrl = firstPayment.invoiceUrl || firstPayment.bankSlipUrl || firstPayment.paymentLink || '';
              }
            }
          }

          // If no paymentUrl yet, but customerId exists, get customer payments
          if (!paymentUrl && customerId) {
            const custPayRes = await fetch(`${baseUrl}/payments?customer=${customerId}`, {
              headers: { 'access_token': asaasApiKey },
            });
            if (custPayRes.ok) {
              const custPayData = await parseAsaasResponse(custPayRes);
              if (custPayData.data && custPayData.data.length > 0) {
                const firstPayment = custPayData.data[0];
                paymentUrl = firstPayment.invoiceUrl || firstPayment.bankSlipUrl || firstPayment.paymentLink || '';
              }
            }
          }

          // If still no customer or subscription on Asaas, create customer & subscription now
          if (!paymentUrl && empresa) {
            // Create customer
            const custRes = await fetch(`${baseUrl}/customers`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
              body: JSON.stringify({ name: empresa, email: email || 'financeiro@padaria.io', cpfCnpj: cnpj || undefined, phone: telefone || undefined, externalReference: extRef }),
            });
            const custData = await parseAsaasResponse(custRes);
            if (custRes.ok && custData.id) {
              customerId = custData.id;
              // Create subscription
              const todayStr = new Date().toISOString().split('T')[0];
              const subRes = await fetch(`${baseUrl}/subscriptions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'access_token': asaasApiKey },
                body: JSON.stringify({
                  customer: customerId,
                  billingType: 'BOLETO',
                  value: valorMensalidade || 199,
                  nextDueDate: todayStr,
                  cycle: 'MONTHLY',
                  description: 'Assinatura Mensal PADARIA.io - Controle de Desperdícios',
                  externalReference: extRef,
                }),
              });
              const subData = await parseAsaasResponse(subRes);
              if (subRes.ok && subData.id) {
                subscriptionId = subData.id;
                paymentUrl = subData.invoiceUrl || subData.bankSlipUrl || '';
              }
            }
          }
        } catch (apiErr) {
          console.warn('[ASAAS] Erro ao consultar API do Asaas:', apiErr);
        }
      }

      // 2. Fallback Asaas sandbox URL format if API key is not configured or didn't return URL
      if (!paymentUrl) {
        const cleanCode = extRef || 'PADARIA';
        const isProd = asaasEnvironment === 'production';
        paymentUrl = isProd
          ? `https://www.asaas.com/i/invoice_${cleanCode.toLowerCase()}`
          : `https://sandbox.asaas.com/i/invoice_${cleanCode.toLowerCase()}`;
      }

      // Save updated link to Firestore if db is ready
      if (extRef && db && paymentUrl) {
        try {
          const compData = {
            financeiro: {
              asaasCustomerId: customerId ?? null,
              asaasSubscriptionId: subscriptionId ?? null,
              asaasPaymentLink: paymentUrl || null,
              ultimoLinkPagamento: paymentUrl || null,
            }
          };
          console.log("DADOS ANTES DO FIRESTORE", JSON.stringify(compData));
          await setDoc(doc(db, 'companies', extRef), removeUndefined(compData), { merge: true });
        } catch (e) {
          console.warn('[FIRESTORE] Erro ao salvar link do Asaas:', e);
        }
      }

      return res.json({
        success: true,
        paymentUrl,
        invoiceUrl: paymentUrl,
        customerId,
        subscriptionId,
        asaasEnvironment,
      });
    } catch (error: any) {
      console.error('[ROUTE] ERRO em /api/asaas/get-payment-link:', error);
      res.status(500).json({ error: 'Erro ao obter link do Asaas', details: error.message });
    }
  });

  // Webhook for Asaas notifications
  app.post('/api/asaas/webhook', async (req, res) => {
    console.log("[ROUTE] POST /api/asaas/webhook - Evento recebido do Asaas", req.body);
    try {
      const eventPayload = req.body;
      const result = await PaymentService.processAsaasWebhook(eventPayload, db);
      
      console.log(`[ASAAS WEBHOOK RESULT] ${result.message}`);

      return res.json({ 
        received: true, 
        processed: result.success,
        companyCode: result.companyCode,
        updatedStatus: result.updatedStatus,
        message: result.message
      });
    } catch (error: any) {
      console.error('[ROUTE] ERRO em /api/asaas/webhook:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  console.log("[INIT] Servidor pronto.");
} catch (globalError: any) {
  console.error("[CRITICAL] Erro fatal durante a inicialização do backend:", globalError);
}

export default app;
