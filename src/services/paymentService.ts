import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { BakeryCompany, BillingStatus, BillingInfo } from '../types';

export interface AsaasPaymentPayload {
  id: string;
  customer: string;
  subscription?: string;
  externalReference?: string;
  value: number;
  netValue?: number;
  billingType?: string;
  status: string; // CONFIRMED, RECEIVED, OVERDUE, REFUNDED, DELETED, etc.
  dueDate?: string;
  confirmedDate?: string;
  description?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
}

export interface AsaasSubscriptionPayload {
  id: string;
  customer: string;
  externalReference?: string;
  status: string; // ACTIVE, INACTIVE, CANCELLED
  value?: number;
}

export interface AsaasWebhookEvent {
  id?: string;
  event: string;
  dateCreated?: string;
  externalReference?: string;
  payment?: AsaasPaymentPayload;
  subscription?: AsaasSubscriptionPayload;
}

function cleanFirestoreData(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanFirestoreData);
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = cleanFirestoreData(val);
    }
  }
  return clean;
}

export class PaymentService {
  /**
   * Processa eventos do webhook do Asaas e atualiza o status de assinatura ('ativo' ou 'cancelado') das padarias na Firestore.
   * Busca a padaria pelo campo 'externalReference' (código da padaria) ou por customerId / subscriptionId.
   */
  static async processAsaasWebhook(
    eventPayload: AsaasWebhookEvent,
    firestoreDb: any = db
  ): Promise<{
    success: boolean;
    companyCode?: string;
    updatedStatus?: BillingStatus;
    message: string;
  }> {
    try {
      console.log(`[PAYMENT SERVICE] Processando webhook do Asaas - Evento: ${eventPayload?.event}`);

      if (!eventPayload || !eventPayload.event) {
        return {
          success: false,
          message: 'Payload do webhook do Asaas inválido ou sem tipo de evento.',
        };
      }

      const eventType = eventPayload.event;
      const payment = eventPayload.payment;
      const subscription = eventPayload.subscription;

      // Extrair externalReference (código da padaria) de qualquer nó do payload
      const externalReference = (
        payment?.externalReference ||
        subscription?.externalReference ||
        eventPayload.externalReference ||
        (eventPayload as any).payment?.externalReference
      )?.trim().toUpperCase();

      const customerId = payment?.customer || subscription?.customer;
      const subscriptionId = payment?.subscription || subscription?.id;

      if (!externalReference && !customerId && !subscriptionId) {
        return {
          success: false,
          message: 'Evento do Asaas não possui externalReference (código da padaria), customer ID nem subscription ID.',
        };
      }

      const targetDb = firestoreDb || db;
      let matchedCompany: BakeryCompany | null = null;
      let matchedDocId: string | null = null;

      // 1. Tentar busca direta no Firestore via externalReference (código da padaria)
      if (externalReference) {
        try {
          const directDocRef = doc(targetDb, 'companies', externalReference);
          const directDocSnap = await getDoc(directDocRef);
          if (directDocSnap.exists()) {
            matchedCompany = directDocSnap.data() as BakeryCompany;
            matchedDocId = externalReference;
            console.log(`[PAYMENT SERVICE] Padaria encontrada por externalReference direto: ${externalReference}`);
          }
        } catch (e) {
          console.warn('[PAYMENT SERVICE] Aviso na busca por externalReference:', e);
        }
      }

      // 2. Se não encontrou por ID direto, buscar em toda a coleção 'companies'
      if (!matchedCompany) {
        const companiesRef = collection(targetDb, 'companies');
        const snapshot = await getDocs(companiesRef);

        if (!snapshot.empty) {
          snapshot.forEach((d) => {
            const company = d.data() as BakeryCompany;
            const fin = company?.financeiro;
            const companyCode = company.codigoAtivacao?.trim().toUpperCase();

            // Match por código de ativacao == externalReference
            if (externalReference && companyCode === externalReference) {
              matchedCompany = company;
              matchedDocId = d.id || company.codigoAtivacao;
            }
            // Match por ID de Assinatura ou Cliente do Asaas
            else if (
              !matchedCompany &&
              ((subscriptionId && fin?.asaasSubscriptionId === subscriptionId) ||
                (customerId && fin?.asaasCustomerId === customerId))
            ) {
              matchedCompany = company;
              matchedDocId = d.id || company.codigoAtivacao;
            }
          });
        }
      }

      if (!matchedCompany || !matchedDocId) {
        console.warn(
          `[PAYMENT SERVICE] Nenhuma padaria encontrada para Asaas extRef: "${externalReference}", Customer: "${customerId}", Sub: "${subscriptionId}"`
        );
        return {
          success: false,
          message: `Nenhuma padaria encontrada para os dados do Asaas (extRef: ${externalReference}, Customer: ${customerId}, Sub: ${subscriptionId}).`,
        };
      }

      const company = matchedCompany as BakeryCompany;
      const docId = matchedDocId as string;
      const currentFin: BillingInfo = company.financeiro || {
        implementacaoPaga: false,
        valorImplementacao: 1500,
        assinaturaMensalAtiva: true,
        valorMensalidade: 199,
        dataProximaCobranca: new Date().toISOString().split('T')[0],
        statusAssinatura: 'pendente',
        historicoCobrancas: [],
      };

      let newStatus: BillingStatus = currentFin.statusAssinatura;
      let newAtivo: boolean = company.ativo;
      let newImplementacaoPaga: boolean = currentFin.implementacaoPaga;
      let newNextDueDate: string = currentFin.dataProximaCobranca;

      // 3. Mapeamento dos eventos do Asaas para alterar status na Firestore
      switch (eventType) {
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_DUNNING_RECEIVED':
          // Pagamento confirmado pelo Asaas: Ativa assinatura da padaria na Firestore
          newStatus = 'ativo';
          newAtivo = true;

          // Se a cobrança for referente à taxa de implantação / setup
          if (
            payment?.description &&
            (payment.description.toLowerCase().includes('implementação') ||
              payment.description.toLowerCase().includes('implantação') ||
              payment.description.toLowerCase().includes('setup'))
          ) {
            newImplementacaoPaga = true;
          }

          // Atualizar a próxima data de cobrança
          if (payment?.dueDate) {
            const dueDateObj = new Date(payment.dueDate);
            dueDateObj.setMonth(dueDateObj.getMonth() + 1);
            newNextDueDate = dueDateObj.toISOString().split('T')[0];
          }
          break;

        case 'PAYMENT_OVERDUE':
        case 'PAYMENT_DUNNING_REQUESTED':
          // Pagamento em atraso
          newStatus = 'vencido';
          break;

        case 'SUBSCRIPTION_DELETED':
        case 'SUBSCRIPTION_DISABLED':
        case 'SUBSCRIPTION_INACTIVE':
        case 'PAYMENT_DELETED':
        case 'PAYMENT_REFUNDED':
          // Cancelamento automático ou falta de pagamento recorrente no Asaas
          newStatus = 'cancelado';
          newAtivo = false; // Bloqueia ou suspende o acesso da padaria
          break;

        default:
          console.log(`[PAYMENT SERVICE] Evento do Asaas recebido: ${eventType}`);
          break;
      }

      // 4. Atualizar histórico de cobranças da padaria
      const existingHistory = currentFin.historicoCobrancas || [];
      if (payment && (eventType === 'PAYMENT_CONFIRMED' || eventType === 'PAYMENT_RECEIVED')) {
        const invoiceId = payment.id || 'inv_' + Date.now();
        const paymentDate = payment.confirmedDate || new Date().toISOString().split('T')[0];

        const alreadyExists = existingHistory.some((item) => item.id === invoiceId);
        if (!alreadyExists) {
          existingHistory.unshift({
            id: invoiceId,
            data: paymentDate,
            valor: payment.value || currentFin.valorMensalidade || 199,
            tipo:
              payment.description?.toLowerCase().includes('implementação') ||
              payment.description?.toLowerCase().includes('setup')
                ? 'implementacao'
                : 'mensalidade',
            status: 'pago',
            linkBoleto: payment.invoiceUrl || payment.bankSlipUrl,
          });
        }
      }

      // 5. Vincular IDs do Asaas caso ainda não estivessem gravados
      const updatedFin: BillingInfo = {
        ...currentFin,
        statusAssinatura: newStatus,
        implementacaoPaga: newImplementacaoPaga,
        dataProximaCobranca: newNextDueDate,
        historicoCobrancas: existingHistory,
        asaasCustomerId: customerId || currentFin.asaasCustomerId,
        asaasSubscriptionId: subscriptionId || currentFin.asaasSubscriptionId,
        asaasPaymentLink: payment?.invoiceUrl || payment?.bankSlipUrl || currentFin.asaasPaymentLink,
      };

      const updatedCompany: BakeryCompany = {
        ...company,
        ativo: newAtivo,
        financeiro: updatedFin,
      };

      // 6. Gravar atualização na coleção 'companies' no Firestore
      const sanitizedCompany = cleanFirestoreData(updatedCompany);
      await setDoc(doc(targetDb, 'companies', docId), sanitizedCompany);

      console.log(
        `[PAYMENT SERVICE] Firestore atualizado com SUCESSO para "${company.empresa}" (${company.codigoAtivacao}). Status Assinatura: ${newStatus}, Ativo: ${newAtivo}`
      );

      return {
        success: true,
        companyCode: company.codigoAtivacao,
        updatedStatus: newStatus,
        message: `Status da assinatura da padaria "${company.empresa}" atualizado para "${newStatus}" com sucesso na Firestore.`,
      };
    } catch (error: any) {
      console.error('[PAYMENT SERVICE] Erro no PaymentService.processAsaasWebhook:', error);
      return {
        success: false,
        message: `Erro ao processar webhook do Asaas: ${error.message}`,
      };
    }
  }

  /**
   * Atualiza manualmente o status da assinatura de uma padaria no Firestore
   */
  static async updateBakerySubscriptionStatus(
    bakeryCode: string,
    newStatus: BillingStatus,
    firestoreDb: any = db
  ): Promise<boolean> {
    try {
      const code = bakeryCode.trim().toUpperCase();
      const companyDocRef = doc(firestoreDb || db, 'companies', code);
      const isAtivo = newStatus === 'ativo' || newStatus === 'concluido';

      await setDoc(
        companyDocRef,
        {
          ativo: isAtivo,
          financeiro: {
            statusAssinatura: newStatus,
          },
        },
        { merge: true }
      );

      console.log(`[PAYMENT SERVICE] Status da padaria ${code} atualizado para ${newStatus} no Firestore.`);
      return true;
    } catch (error) {
      console.error('[PAYMENT SERVICE] Erro ao atualizar status manualmente:', error);
      return false;
    }
  }
}

