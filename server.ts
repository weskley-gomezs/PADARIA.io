import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

// Initialize Firebase App in Node (using same config as client)
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON parser for webhooks
  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Asaas Webhook Endpoint
  app.post('/api/webhooks/asaas', async (req, res) => {
    try {
      console.log('Webhook Asaas recebido:', JSON.stringify(req.body, null, 2));
      const { event, payment } = req.body;

      if (!payment) {
        return res.status(400).json({ error: 'Payload de pagamento ausente' });
      }

      // Procura o código da padaria no externalReference ou na description
      const searchString = `${payment.externalReference || ''} ${payment.description || ''}`.toUpperCase();
      
      if (!db) {
        console.error('Firestore não inicializado no servidor');
        return res.status(500).json({ error: 'Firestore não inicializado' });
      }

      // Busca as empresas para encontrar a correspondente
      const companiesSnapshot = await getDocs(collection(db, 'companies'));
      let targetCompanyId = null;
      let targetCompanyData = null;

      companiesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.codigoAtivacao && searchString.includes(data.codigoAtivacao.toUpperCase())) {
          targetCompanyId = doc.id;
          targetCompanyData = data;
        }
      });

      if (!targetCompanyId) {
        console.log('Nenhuma empresa encontrada para o pagamento:', payment.id);
        // Mesmo não encontrando, retorna 200 para o Asaas parar de tentar enviar
        return res.status(200).json({ received: true, message: 'Empresa não encontrada' });
      }

      console.log(`Atualizando status financeiro da empresa ${targetCompanyData?.empresa} (${targetCompanyData?.codigoAtivacao})`);

      const financeiro = targetCompanyData?.financeiro || {};
      let newStatus = financeiro.statusAssinatura;

      // Mapeia eventos do Asaas para os status internos
      if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
        newStatus = 'ativo';
        if (financeiro.tipoUltimoLink === 'implementacao' || searchString.includes('IMPLEMENTACAO')) {
           financeiro.implementacaoPaga = true;
        } else {
           financeiro.assinaturaMensalAtiva = true;
        }
      } else if (event === 'PAYMENT_OVERDUE') {
        newStatus = 'pendente';
      } else if (event === 'PAYMENT_DELETED' || event === 'PAYMENT_REFUNDED') {
        newStatus = 'suspenso';
      }

      // Atualiza o documento no Firestore
      const companyRef = doc(db, 'companies', targetCompanyId);
      await updateDoc(companyRef, {
        'financeiro.statusAssinatura': newStatus,
        'financeiro.implementacaoPaga': financeiro.implementacaoPaga || false,
        'financeiro.assinaturaMensalAtiva': financeiro.assinaturaMensalAtiva || false,
      });

      console.log(`Status atualizado para: ${newStatus}`);
      return res.status(200).json({ received: true, updatedStatus: newStatus });

    } catch (error) {
      console.error('Erro ao processar webhook do Asaas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
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
