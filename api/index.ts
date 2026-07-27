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
              text: "Você é um assistente de controle de perdas e descarte de padaria. Leia o rótulo do produto na imagem e extraia o nome do produto, a data de fabricação (se houver), a data de validade (se houver), o valor total do produto (se houver), e o valor por KG (se houver). Formate as datas para YYYY-MM-DD. O valor KG e o valor total devem ser numéricos. Retorne em formato JSON. Extraia todos os dados visíveis com precisão, sem recusar nenhum produto.",
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
                description: "O nome do produto identificado na embalagem.",
              },
              dataFabricacao: {
                type: Type.STRING,
                description: "A data de fabricação impressa na embalagem no formato YYYY-MM-DD. Deixe vazio se não for possível identificar.",
              },
              dataValidade: {
                type: Type.STRING,
                description: "A data de validade impressa na embalagem no formato YYYY-MM-DD. Deixe vazio se não for possível identificar.",
              },
              valorKg: {
                type: Type.NUMBER,
                description: "O valor por quilo do produto, se houver.",
              },
              valorTotal: {
                type: Type.NUMBER,
                description: "O valor total do produto (ex: preço final), se houver.",
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
          barcode: '',
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
      } = req.body;

      const asaasApiKey = process.env.ASAAS_API_KEY;
      const asaasEnvironment = process.env.ASAAS_ENVIRONMENT || 'sandbox';

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

      // Calculate next due date (1 day trial if requested)
      const today = new Date();
      if (teste1Dia) {
        today.setDate(today.getDate() + 1);
      }
      const nextDueDate = today.toISOString().split('T')[0];

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
      const asaasEnvironment = process.env.ASAAS_ENVIRONMENT || 'sandbox';

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
