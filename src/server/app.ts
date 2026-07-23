import express from 'express';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';

console.log("[INIT] Inicializando servidor Express...");
const app = express();
app.use(express.json({ limit: '10mb' }));

let db: any = null;
let ai: any = null;

try {
  console.log("[INIT] Verificando configuração do Firebase...");
  const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
  console.log(`[INIT] Caminho do config Firebase: ${firebaseConfigPath}`);

  if (fs.existsSync(firebaseConfigPath)) {
    console.log("[INIT] Arquivo firebase-applet-config.json encontrado.");
    const configRaw = fs.readFileSync(firebaseConfigPath, 'utf8');
    
    try {
      const firebaseConfig = JSON.parse(configRaw);
      console.log("[INIT] Conteúdo do JSON do Firebase carregado com sucesso.");
      
      if (firebaseConfig.firestoreDatabaseId) {
        console.log(`[INIT] firestoreDatabaseId encontrado: ${firebaseConfig.firestoreDatabaseId}`);
      } else {
        console.log("[INIT] AVISO: firestoreDatabaseId não encontrado no config.");
      }

      console.log("[INIT] Inicializando Firebase App...");
      const firebaseApp = initializeApp(firebaseConfig);
      db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
      console.log("[INIT] Firebase inicializado com sucesso.");
    } catch (jsonError) {
      console.error("[INIT] Erro ao parsear o JSON do Firebase:", jsonError);
    }
  } else {
    console.log("[INIT] AVISO: Arquivo firebase-applet-config.json NÃO encontrado.");
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
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/analyze-product-image', async (req, res) => {
    console.log("[ROUTE] POST /api/analyze-product-image - Recebido");
    try {
      const { imageBase64 } = req.body;
      console.log(`[ROUTE] Payload recebido. Tamanho base64: ${imageBase64?.length || 0}`);
      
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
      console.log(`[GEMINI] Texto retornado: ${text}`);
      
      const result = JSON.parse(text);
      console.log("[ROUTE] Retornando JSON ao cliente.");
      res.json(result);
    } catch (error: any) {
      console.error('[ROUTE] ERRO em /api/analyze-product-image:', error);
      if (error.stack) console.error(`[ROUTE] STACK: ${error.stack}`);
      res.status(500).json({ 
        error: 'Erro ao processar imagem.',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  console.log("[INIT] Servidor pronto.");
} catch (globalError: any) {
  console.error("[CRITICAL] Erro fatal durante a inicialização do backend:", globalError);
  if (globalError.stack) console.error(`[CRITICAL] STACK: ${globalError.stack}`);
}

export { app };
