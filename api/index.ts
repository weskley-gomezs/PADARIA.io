console.log("[VERCEL] API entry point called (/api/index.ts)");

import express from 'express';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';

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
      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        console.warn("[ROUTE] Falha: Nenhuma imagem fornecida no body.");
        return res.status(400).json({ error: 'Nenhuma imagem fornecida.' });
      }

      console.log("[ROUTE] Processando base64 e iniciando chamada ao Gemini...");
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      console.log("[GEMINI] Chamando generateContent...");
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
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
      const text = response.text || "{}";
      const result = JSON.parse(text);
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
