import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';

// Initialize Firebase App in Node (using same config as client)
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON parser for webhooks and big payloads
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/analyze-product-image', async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Nenhuma imagem fornecida.' });
      }

      // Remove the prefix if it exists (e.g., "data:image/jpeg;base64,")
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

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

      const text = response.text || "{}";
      const result = JSON.parse(text);
      res.json(result);
    } catch (error: any) {
      console.error('Error analyzing image:', error);
      res.status(500).json({ error: 'Erro ao processar imagem.' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
