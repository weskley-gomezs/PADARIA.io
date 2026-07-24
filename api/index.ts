console.log("[VERCEL] API entry point called (/api/index.ts)");

import express from 'express';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';

console.log("[INIT] Inicializando servidor Express em /api/index.ts...");
const app = express();
app.use(express.json({ limit: '10mb' }));

let supabase: any = null;
let ai: any = null;

try {
  console.log("[INIT] Verificando configuração do Supabase...");
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log("[INIT] Supabase inicializado com sucesso no backend.");
  } else {
    console.log("[INIT] AVISO: Credenciais do Supabase não encontradas no ambiente do backend.");
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

      // If bakeryCode is provided and Supabase is available, save product directly to Supabase
      if (bakeryCode && supabase) {
        console.log(`[SUPABASE] Salvando produto escaneado diretamente no Supabase para bakeryCode: ${bakeryCode}...`);
        const todayStr = new Date().toISOString().split('T')[0];
        const valDate = result.dataValidade || todayStr;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(valDate + 'T00:00:00');
        const diffTime = target.getTime() - today.getTime();
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const status = daysRemaining < 0 ? 'vencido' : daysRemaining <= 3 ? 'vencendo' : 'normal';

        const productId = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const newProduct = {
          id: productId,
          bakery_code: String(bakeryCode).trim().toUpperCase(),
          nome: result.nome || 'Produto Escaneado',
          quantidade: 1,
          data_validade: valDate,
          dias_para_vencer: daysRemaining,
          status: status,
          codigo_barras: '',
          valor_kg: typeof result.valorKg === 'number' ? result.valorKg : null,
          data_fabricacao: result.dataFabricacao || null,
          preco_venda: typeof result.valorTotal === 'number' ? result.valorTotal : null,
          motivo: 'Vencimento',
          notas: 'Registrado via Leitura de Etiquetas IA',
        };

        await supabase.from('produtos').insert([newProduct]);
        console.log(`[SUPABASE] Confirmação de gravação do produto ${productId} no Supabase com SUCESSO!`);
        return res.json({
          ...result,
          savedToSupabase: true,
          product: {
            id: newProduct.id,
            bakeryCode: newProduct.bakery_code,
            nome: newProduct.nome,
            quantidade: newProduct.quantidade,
            dataValidade: newProduct.data_validade,
            diasParaVencer: newProduct.dias_para_vencer,
            status: newProduct.status,
            valorKg: newProduct.valor_kg,
            dataFabricacao: newProduct.data_fabricacao,
            valorTotal: newProduct.preco_venda,
            motivo: newProduct.motivo,
            notas: newProduct.notas,
          },
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

  console.log("[INIT] Servidor pronto.");
} catch (globalError: any) {
  console.error("[CRITICAL] Erro fatal durante a inicialização do backend:", globalError);
}

export default app;
