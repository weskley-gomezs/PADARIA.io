import jsPDF from 'jspdf';
import { BakeryCompany, ContractInfo, Product, VipOffer } from '../types/index.js';
import { formatDateToBR } from './dateUtils.js';

async function getBase64ImageFromUrl(imageUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } else {
        reject(new Error('Canvas context error'));
      }
    };
    img.onerror = (err) => reject(err);
    img.src = imageUrl;
  });
}

export function generateContractPDF(company: BakeryCompany, customCnpj?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const today = new Date().toLocaleDateString('pt-BR');
  const contract: Partial<ContractInfo> = company.contrato || {};
  
  const fornecedor = contract.fornecedorNome || 'PADARIA.IO TECNOLOGIA E SISTEMAS DE GESTÃO LTDA.';
  const respTecnico = contract.responsavelTecnico || 'Weskley Gomes';
  const clienteNome = contract.clienteNome || company.empresa;
  const cnpjValue = customCnpj || contract.clienteCnpj || company.cnpj || 'Não informado (Pendente)';
  const valorImp = contract.valorImplementacao ?? company.financeiro?.valorImplementacao ?? 1500;
  const valorMensal = contract.valorMensalidade ?? company.financeiro?.valorMensalidade ?? 199;
  const vigenciaMeses = contract.prazoVigenciaMeses ?? 12;
  const obs = contract.observacoesAdicionais || '';

  const formattedImp = valorImp.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formattedMensal = valorMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Calculate renewal date based on vigenciaMeses
  const nextDate = new Date();
  nextDate.setMonth(nextDate.getMonth() + vigenciaMeses);
  const nextDateStr = nextDate.toLocaleDateString('pt-BR');

  // Header Styling
  doc.setFillColor(44, 44, 44);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(212, 165, 116);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PADARIA.io', 15, 18);

  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE SOFTWARE', 15, 25);

  let y = 42;

  // Title
  doc.setTextColor(44, 44, 44);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CONTRATO DE LICENCIAMENTO DE SISTEMA E MONITORAMENTO', 15, y);
  y += 10;

  // Section: Partes
  doc.setFontSize(11);
  doc.setFillColor(245, 230, 211);
  doc.rect(15, y, 180, 8, 'F');
  doc.setTextColor(44, 44, 44);
  doc.text('1. PARTES CONTRATANTES', 18, y + 5.5);
  y += 13;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`FORNECEDOR: ${fornecedor.toUpperCase()}`, 18, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`RESPONSÁVEL TÉCNICO PADARIA.IO: ${respTecnico}`, 18, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`CONTRATANTE / CLIENTE: ${clienteNome.toUpperCase()}`, 18, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(232, 87, 26);
  doc.text(`CNPJ DO CLIENTE: ${cnpjValue}`, 18, y);
  doc.setTextColor(44, 44, 44);
  doc.setFont('helvetica', 'normal');
  y += 6;
  doc.text(`E-MAIL: ${company.email} | TELEFONE: ${company.telefone || 'Não informado'}`, 18, y);
  y += 6;
  doc.text(`CÓDIGO DE ATIVAÇÃO DA PANIFICADORA: ${company.codigoAtivacao}`, 18, y);
  y += 6;
  doc.text(`DATA DA ASSINATURA: ${today}`, 18, y);
  y += 12;

  // Section: Objeto
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 230, 211);
  doc.rect(15, y, 180, 8, 'F');
  doc.text('2. OBJETO DO SERVIÇO', 18, y + 5.5);
  y += 13;

  doc.setFont('helvetica', 'normal');
  const objetoText =
    'Licenciamento de uso do sistema web PADARIA.IO para controle de estoque, alertas automáticos de validade sanitária para auditorias da Vigilância Sanitária e acompanhamento em tempo real de produtos alimentícios.';
  const splitObjeto = doc.splitTextToSize(objetoText, 175);
  doc.text(splitObjeto, 18, y);
  y += splitObjeto.length * 6 + 6;

  // Section: Valores e Condições
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 230, 211);
  doc.rect(15, y, 180, 8, 'F');
  doc.text('3. VALORES E CONDIÇÕES FINANCEIRAS', 18, y + 5.5);
  y += 13;

  doc.setFont('helvetica', 'normal');
  doc.text(`• Implementação, Setup e Treinamento: ${formattedImp} (Taxa única de ativação)`, 18, y);
  y += 6;
  doc.text(`• Assinatura e Suporte Recorrente: ${formattedMensal} / mês (cobrança recorrente)`, 18, y);
  y += 6;
  doc.text(`• Vigência Inicial: ${vigenciaMeses} meses (renovação automática) até ${nextDateStr}`, 18, y);
  y += 12;

  // Section: Cancelamento e Suporte
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 230, 211);
  doc.rect(15, y, 180, 8, 'F');
  doc.text('4. CANCELAMENTO E SUPORTE TÉCNICO', 18, y + 5.5);
  y += 13;

  doc.setFont('helvetica', 'normal');
  doc.text('• Cancelamento: O cliente pode solicitar o encerramento sem multa com 7 dias de aviso prévio.', 18, y);
  y += 6;
  doc.text(`• Suporte Técnico Direto: Atendimento especializado via central de chamados com ${respTecnico}.`, 18, y);
  y += 6;
  doc.text('• Garantia de atualização legal e técnica perante os órgãos sanitários vigentes.', 18, y);
  y += 12;

  if (obs) {
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(245, 230, 211);
    doc.rect(15, y, 180, 8, 'F');
    doc.text('5. CLÁUSULAS ADICIONAIS / OBSERVAÇÕES', 18, y + 5.5);
    y += 13;
    doc.setFont('helvetica', 'normal');
    const splitObs = doc.splitTextToSize(obs, 175);
    doc.text(splitObs, 18, y);
    y += splitObs.length * 6 + 10;
  } else {
    y += 8;
  }

  // Signatures
  doc.setFont('helvetica', 'bold');
  doc.text(`DOCUMENTO EMITIDO EM: ${today}`, 15, y);
  y += 22;

  doc.setLineWidth(0.5);
  doc.line(15, y, 95, y);
  doc.line(115, y, 195, y);
  y += 5;

  doc.setFontSize(8.5);
  doc.text(clienteNome.toUpperCase(), 15, y);
  doc.text('PADARIA.IO TECNOLOGIA', 115, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.text(`CNPJ: ${cnpjValue}`, 15, y);
  doc.text(`${respTecnico} - Responsável Técnico`, 115, y);

  // Download trigger
  doc.save(`Contrato_${clienteNome.replace(/\s+/g, '_')}_${company.codigoAtivacao}.pdf`);
}

export function generateTrainingGuidePDF(company: BakeryCompany) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const today = new Date().toLocaleDateString('pt-BR');

  // Header Styling
  doc.setFillColor(232, 87, 26); // Accent orange
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('PADARIA.io', 15, 18);

  doc.setFontSize(10);
  doc.text('GUIA OFICIAL DE TREINAMENTO E OPERAÇÃO SANITÁRIA', 15, 25);

  let y = 42;

  // Title
  doc.setTextColor(44, 44, 44);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`PLANO DE TREINAMENTO - ${company.empresa.toUpperCase()}`, 15, y);
  y += 6;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Código de Ativação: ${company.codigoAtivacao} | Data: ${today}`, 15, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Responsável Técnico PADARIA.io: Weskley Gomes', 15, y);
  y += 12;

  // Passo 1
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 230, 211);
  doc.rect(15, y, 180, 7, 'F');
  doc.text('PASSO 1: PRIMEIRO ACESSO AO SISTEMA', 18, y + 5);
  y += 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('1. Acesse o sistema e selecione a opção "Entrar com Código de Padaria".', 18, y);
  y += 5.5;
  doc.text(`2. Digite seu código exclusivo de ativação de 8 dígitos: ${company.codigoAtivacao}`, 18, y);
  y += 5.5;
  doc.text('3. Clique no botão "Acessar Minha Padaria" para abrir o painel operacional.', 18, y);
  y += 11;

  // Passo 2
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 230, 211);
  doc.rect(15, y, 180, 7, 'F');
  doc.text('PASSO 2: CADASTRAR PRODUTOS E LOTES DE FABRICAÇÃO', 18, y + 5);
  y += 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('1. Ao produzir pães, bolos, frios ou confeitaria, clique no botão "+ Adicionar Produto".', 18, y);
  y += 5.5;
  doc.text('2. Preencha Nome do item, Quantidade e a Data exata de Validade.', 18, y);
  y += 5.5;
  doc.text('3. Clique em "Salvar Produto". O sistema aplicará as regras de controle automaticamente.', 18, y);
  y += 11;

  // Passo 3
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 230, 211);
  doc.rect(15, y, 180, 7, 'F');
  doc.text('PASSO 3: ENTENDENDO OS INDICADORES DE COR (AUDITORIA)', 18, y + 5);
  y += 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('🟢 VERDE (Válido): Produto com prazo seguro (mais de 3 dias).', 18, y);
  y += 5.5;
  doc.text('🟡 AMARELO (Atenção): Faltam 3 dias ou menos para vencer - ideal para colocar em promoção.', 18, y);
  y += 5.5;
  doc.text('🔴 VERMELHO (Vencido): Venceu! Remova imediatamente da vitrine/balcão de vendas.', 18, y);
  y += 11;

  // Passo 4
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 230, 211);
  doc.rect(15, y, 180, 7, 'F');
  doc.text('PASSO 4: REGISTRAR VENDA OU DAR BAIXA', 18, y + 5);
  y += 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('1. Localize o produto na tabela de produtos da sua padaria.', 18, y);
  y += 5.5;
  doc.text('2. Clique no botão "Marcar como Vendido" para dar baixa no estoque.', 18, y);
  y += 5.5;
  doc.text('3. O item é movido para o histórico, registrando data e hora com total rastreabilidade.', 18, y);
  y += 14;

  // Suporte
  doc.setFillColor(44, 44, 44);
  doc.rect(15, y, 180, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('CENTRAL DE SUPORTE E TREINAMENTO - PADARIA.io', 20, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Responsável Técnico: Weskley Gomes (PADARIA.io)', 20, y + 13);
  doc.text(`Empresa Parceira: ${company.empresa} (CNPJ: ${company.cnpj || 'Não cadastrado'})`, 20, y + 18);

  doc.save(`Guia_Treinamento_${company.empresa.replace(/\s+/g, '_')}.pdf`);
}

export function generateSystemManualPDF(companyName?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const today = new Date().toLocaleDateString('pt-BR');

  const addHeader = (pageNum: number) => {
    // Header Bar Dark Slate
    doc.setFillColor(17, 24, 39); // Gray 900
    doc.rect(0, 0, 210, 26, 'F');

    // Accent line
    doc.setFillColor(232, 87, 26); // Brand Orange #E8571A
    doc.rect(0, 26, 210, 1.5, 'F');

    // Title / Brand
    doc.setTextColor(255, 107, 0); // Orange
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('PADARIA.io', 14, 15);

    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text('MANUAL DE VENDAS & GUIA COMPLETO DE FUNCIONALIDADES', 14, 21);

    doc.setFontSize(8);
    doc.setTextColor(209, 213, 219);
    doc.text(`Página ${pageNum} de 2 | Material de Prospecção`, 145, 15);
  };

  const addFooter = (pageNum: number) => {
    doc.setFillColor(243, 244, 246);
    doc.rect(0, 282, 210, 15, 'F');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('PADARIA.io Tecnologia © Gestão Sanitária e Inteligência para Panificação.', 14, 290);
    doc.text(`Emissão: ${today}`, 170, 290);
  };

  // --- PAGE 1 ---
  addHeader(1);
  let y = 34;

  // Title Section
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SISTEMA PADARIA.IO: GUIA PRÁTICO PARA PROSPECÇÃO E VENDAS', 14, y);
  y += 5;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(217, 119, 6);
  doc.text('Entenda o sistema em minutos e feche contratos com padarias e confeitarias.', 14, y);
  y += 7;

  // Box Proposta de Valor
  doc.setFillColor(254, 243, 199); // Light Amber
  doc.setDrawColor(245, 158, 11);
  doc.rect(14, y, 182, 22, 'DF');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(146, 64, 14);
  doc.text('💡 O QUE É O PADARIA.IO E POR QUE TODO DONO DE PADARIA PRECISA DELE?', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(31, 41, 55);
  const valorText = 'O Padaria.io é um sistema feito exclusivamente para padarias, confeitarias e panificadoras. Ele resolve os 2 maiores problemas do setor: o risco de multas pesadas da Vigilância Sanitária (ANVISA) por falta de etiquetas de validade e o desperdício diário de alimentos e insumos caros no estoque.';
  const splitValor = doc.splitTextToSize(valorText, 174);
  doc.text(splitValor, 18, y + 11);
  y += 27;

  // Header 1: As 4 Principais Funcionalidades
  doc.setFillColor(31, 41, 55);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('1. AS 4 REVOLUCIONÁRIAS FUNCIONALIDADES DO SISTEMA', 18, y + 5);
  y += 11;

  // Funcionalidade 1
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12); // Orange
  doc.setFontSize(9);
  doc.text('1.1. PadeIA™ - Assistente de Voz Inteligente (Sem Digitação)', 14, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  const f1 = [
    '• Como funciona: O funcionário clica no microfone e apenas fala no celular ou computador (Ex: "Cadastrar 100 coxinhas a 5 reais validade dia 10").',
    '• O que a IA faz: Entende a fala, calcula automaticamente o valor total do lote (R$ 500,00) e cadastra o produto direto no banco de dados do sistema.',
    '• Benefício comercial: O padeiro ou balconista não perde tempo digitando. É rápido, simples e elimina erros humanos de digitação.'
  ];
  f1.forEach(item => {
    const lines = doc.splitTextToSize(item, 180);
    doc.text(lines, 14, y);
    y += lines.length * 3.8;
  });
  y += 3;

  // Funcionalidade 2
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.setFontSize(9);
  doc.text('1.2. Impressão de Etiquetas Sanitárias Oficiais (Norma ANVISA RDC 216)', 14, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  const f2 = [
    '• O que imprime: Nome do produto, data de fabricação, data exata de vencimento, quantidade/peso, número do lote e código de barras / QR Code.',
    '• Compatibilidade: Funciona com qualquer impressora térmica do mercado (Elgin, Zebra, Bematech, Argox, Bluetooth ou USB).',
    '• Benefício comercial: Proteção total contra fiscalização e multas que podem passar de R$ 5.000,00.'
  ];
  f2.forEach(item => {
    const lines = doc.splitTextToSize(item, 180);
    doc.text(lines, 14, y);
    y += lines.length * 3.8;
  });
  y += 3;

  // Funcionalidade 3
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.setFontSize(9);
  doc.text('1.3. Controle Visual de Validade & Prevenção de Perdas (PVPS)', 14, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  const f3 = [
    '• Alerta por Cores: Verde = Produto ótimo | Amarelo = Vence em até 3 dias (Atenção!) | Vermelho = Vencido.',
    '• Regra do PVPS (Primeiro que Vence, Primeiro que Sai): Indica ao atendente exatamente qual lote deve ser vendido primeiro no balcão.',
    '• Indicador R$ de Perdas Evitadas: Mostra ao dono em reais quanto dinheiro ele economizou ao não jogar comida no lixo.'
  ];
  f3.forEach(item => {
    const lines = doc.splitTextToSize(item, 180);
    doc.text(lines, 14, y);
    y += lines.length * 3.8;
  });
  y += 3;

  // Funcionalidade 4
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.setFontSize(9);
  doc.text('1.4. Lucratividade, Fechamento de Caixa e Relatórios em PDF', 14, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  const f4 = [
    '• Cálculo do Valor do Lote e Margem: Mostra o custo dos insumos e o valor total em estoque.',
    '• Fechamento Diário: Painel simples para conferência de vendas e baixas.',
    '• Relatórios Executivos: Emissão de relatórios e contratos prontos em PDF para impressão.'
  ];
  f4.forEach(item => {
    const lines = doc.splitTextToSize(item, 180);
    doc.text(lines, 14, y);
    y += lines.length * 3.8;
  });

  addFooter(1);

  // --- PAGE 2 ---
  doc.addPage();
  addHeader(2);
  y = 34;

  // Seção 2: Roteiro de Vendas
  doc.setFillColor(31, 41, 55);
  doc.rect(14, y, 182, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('2. GUIA PRÁTICO DE ABORDAGEM E FECHAMENTO DE VENDAS', 18, y + 5);
  y += 11;

  // Dores do Cliente
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.setFontSize(9);
  doc.text('2.1. As 3 Maiores "Dores" do Dono da Padaria (Ganchos de Venda)', 14, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  const dores = [
    '1. Medo da Vigilância Sanitária: Fiscalização aparecendo de surpresa e interditando o estabelecimento por causa de produtos sem etiqueta de data de manipulação.',
    '2. Dinheiro jogado no lixo: Frios, queijos, massas e doces estragando na geladeira por falta de controle de validade.',
    '3. Sistemas difíceis e burocráticos: Balconistas e padeiros reclamam que não têm tempo de ficar digitando em computador.'
  ];
  dores.forEach(item => {
    const lines = doc.splitTextToSize(item, 180);
    doc.text(lines, 14, y);
    y += lines.length * 3.8;
  });
  y += 5;

  // Pitch Script Box
  doc.setFillColor(240, 253, 244); // Light Emerald
  doc.setDrawColor(34, 197, 94);
  doc.rect(14, y, 182, 32, 'DF');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52);
  doc.text('🗣️ SCRIPT DE ABORDAGEM MATADOR (O QUE FALAR AO CHEGAR NA PADARIA):', 18, y + 6);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(31, 41, 55);
  const pitchText = '"Olá, [Nome do Dono]! Nós ajudamos padarias e confeitarias a eliminarem de vez o desperdício de insumos no estoque e a ficarem 100% protegidas contra multas da Vigilância Sanitária. O nosso sistema funciona no celular por comando de voz: o seu padeiro só fala o que produziu e o sistema imprime a etiqueta da ANVISA na hora e avisa o que precisa ser vendido antes de vencer. Posso te mostrar em 3 minutos aqui no balcão?"';
  const splitPitch = doc.splitTextToSize(pitchText, 174);
  doc.text(splitPitch, 18, y + 11);
  y += 37;

  // Como Quebrar Objeções
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.setFontSize(9);
  doc.text('2.2. Como Responder às Principais Objeções dos Clientes', 14, y);
  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(8);
  const obj = [
    '• "Meus funcionários não sabem mexer em sistema": Resposta: "Eles não precisam digitar nada! Nosso sistema aceita comando de voz por celular. É tão simples quanto mandar um áudio no WhatsApp."',
    '• "Já tenho um sistema de caixa (PDV)": Resposta: "O Padaria.io não substitui seu caixa. Ele é um sistema complementar para a cozinha e estoque, focado na etiquetagem sanitária e prevenção de perdas que o caixa não faz."',
    '• "Agora não estou podendo gastar": Resposta: "O sistema não é um gasto, é economia. Se ele evitar que apenas 2 tortas ou 1 peça de presunto estraguem no mês, ele se paga sozinho."'
  ];
  obj.forEach(item => {
    const lines = doc.splitTextToSize(item, 180);
    doc.text(lines, 14, y);
    y += lines.length * 3.8;
  });
  y += 5;

  // Tabela de Preços Recomendada
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.setFontSize(9);
  doc.text('2.3. Tabela Sugerida de Valores para Venda', 14, y);
  y += 4.5;

  doc.setFillColor(254, 243, 199);
  doc.rect(14, y, 182, 22, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text('• Taxa de Implantação e Treinamento:', 18, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.text('R$ 800,00 a R$ 1.500,00 (Pagamento único na adesão)', 75, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('• Licença Mensal de Uso (SaaS):', 18, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.text('R$ 149,00 a R$ 299,00 / mês (Inclui IA de voz ilimitada)', 75, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('• Comissão do Vendedor:', 18, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(31, 41, 55);
  doc.text('100% da Taxa de Implantação + Recorrência conforme acordo comercial', 75, y + 17);

  addFooter(2);

  doc.save('Manual_Completo_PadariaIO_Vendas.pdf');
}

export async function generateExecutiveReportPDF(
  company: BakeryCompany,
  products: Product[],
  periodFilter: 'todos' | 'dia' | 'semana' | 'mes' = 'todos',
  _vipOffers: VipOffer[] = []
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const currentYearMonth = todayStr.substring(0, 7);

  const expiredList = products.filter((p) => p.status === 'vencido');
  const expiringList = products.filter((p) => p.status === 'vencendo');
  const normalList = products.filter((p) => p.status === 'normal');

  const filteredExpiredList = expiredList.filter((item) => {
    if (periodFilter === 'todos') return true;
    if (periodFilter === 'dia') {
      return item.dataValidade === todayStr || item.dataCadastro === todayStr;
    }
    if (periodFilter === 'mes') {
      return (
        (item.dataValidade && item.dataValidade.startsWith(currentYearMonth)) ||
        (item.dataCadastro && item.dataCadastro.startsWith(currentYearMonth)) ||
        item.status === 'vencido'
      );
    }
    if (periodFilter === 'semana') {
      if (item.dataValidade === todayStr || item.dataCadastro === todayStr) return true;
      const refDate = item.dataCadastro || item.dataValidade;
      if (!refDate) return false;
      const itemDate = new Date(refDate).getTime();
      const now = new Date().getTime();
      const diffDays = Math.abs((now - itemDate) / (1000 * 3600 * 24));
      return diffDays <= 7 || item.status === 'vencido';
    }
    return true;
  });

  const totalExpiredValue = filteredExpiredList.reduce(
    (acc, p) => acc + (p.valorTotal || p.quantidade * (p.valorKg || 12)),
    0
  );

  const totalExpiredQty = filteredExpiredList.reduce((acc, p) => acc + p.quantidade, 0);
  const todayFormatted = formatDateToBR(todayStr);

  // Top Dark Header Box
  doc.setFillColor(31, 41, 55);
  doc.rect(0, 0, 210, 32, 'F');

  // Accent Line
  doc.setFillColor(232, 87, 26);
  doc.rect(0, 32, 210, 2, 'F');

  // Load Logo Image (https://i.imgur.com/ZGsjvWy.png)
  try {
    const logoBase64 = await getBase64ImageFromUrl('https://i.imgur.com/ZGsjvWy.png');
    doc.addImage(logoBase64, 'PNG', 12, 6, 48, 18);
  } catch {
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('PADARIA.io', 14, 18);
  }

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO EXECUTIVO DE VALIDADES E DESTRUIÇÃO SANITÁRIA', 66, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 213, 219);
  doc.text(`Empresa: ${company.empresa} | CNPJ: ${company.cnpj || 'Não informado'}`, 66, 21);
  doc.text(`Código: ${company.codigoAtivacao} | Filtro: ${periodFilter.toUpperCase()} | Emissão: ${todayFormatted}`, 66, 26);

  let y = 42;

  // Title on page
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`RESUMO EXECUTIVO DE CONTROLE - ${company.empresa.toUpperCase()}`, 14, y);
  y += 6;

  // Summary Metrics Box
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(14, y, 182, 22, 3, 3, 'DF');

  // Metric 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 38, 38);
  doc.text('QTD VENCIDOS', 18, y + 6);
  doc.setFontSize(11);
  doc.text(`${totalExpiredQty} un`, 18, y + 15);

  // Metric 2
  doc.setFontSize(7.5);
  doc.setTextColor(185, 28, 28);
  doc.text('PREJUÍZO DE VENCIDOS', 62, y + 6);
  doc.setFontSize(11);
  doc.text(`R$ ${totalExpiredValue.toFixed(2)}`, 62, y + 15);

  // Metric 3
  doc.setFontSize(7.5);
  doc.setTextColor(217, 119, 6);
  doc.text('VENCENDO (3 DIAS)', 115, y + 6);
  doc.setFontSize(11);
  doc.text(`${expiringList.length} itens`, 115, y + 15);

  // Metric 4
  doc.setFontSize(7.5);
  doc.setTextColor(22, 163, 74);
  doc.text('NORMAIS NO ESTOQUE', 158, y + 6);
  doc.setFontSize(11);
  doc.text(`${normalList.length} itens`, 158, y + 15);

  y += 28;

  // Table Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55);
  doc.text(`ESPECIFICAÇÕES DE PRODUTOS VENCIDOS (${filteredExpiredList.length} ITENS)`, 14, y);
  y += 5;

  // Table Header
  doc.setFillColor(31, 41, 55);
  doc.rect(14, y, 182, 7, 'F');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PRODUTO / CATEGORIA', 16, y + 5);
  doc.text('CÓD. BARRAS', 75, y + 5);
  doc.text('FABRICAÇÃO', 108, y + 5);
  doc.text('VALIDADE', 133, y + 5);
  doc.text('QTD', 158, y + 5);
  doc.text('TOTAL (R$)', 173, y + 5);

  y += 7;

  if (filteredExpiredList.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text(`Nenhum produto vencido encontrado para o filtro selecionado (${periodFilter}).`, 16, y + 8);
    y += 16;
  } else {
    doc.setFontSize(7.5);

    filteredExpiredList.forEach((item, index) => {
      if (y > 265) {
        doc.addPage();
        y = 15;
        // Table Header repeat
        doc.setFillColor(31, 41, 55);
        doc.rect(14, y, 182, 7, 'F');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text('PRODUTO / CATEGORIA', 16, y + 5);
        doc.text('CÓD. BARRAS', 75, y + 5);
        doc.text('FABRICAÇÃO', 108, y + 5);
        doc.text('VALIDADE', 133, y + 5);
        doc.text('QTD', 158, y + 5);
        doc.text('TOTAL (R$)', 173, y + 5);
        y += 7;
        doc.setFontSize(7.5);
      }

      const unitVal = item.valorKg || 12.0;
      const totalVal = item.valorTotal || item.quantidade * unitVal;

      if (index % 2 === 0) {
        doc.setFillColor(254, 242, 242);
        doc.rect(14, y, 182, 7.5, 'F');
      } else {
        doc.setFillColor(255, 255, 255);
        doc.rect(14, y, 182, 7.5, 'F');
      }

      doc.setTextColor(153, 27, 27);
      doc.setFont('helvetica', 'bold');
      const truncatedName = item.nome.length > 27 ? item.nome.substring(0, 25) + '..' : item.nome;
      doc.text(truncatedName, 16, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      doc.text(item.barcode || 'N/D', 75, y + 5);
      doc.text(formatDateToBR(item.dataFabricacao) || '-', 108, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28);
      doc.text(formatDateToBR(item.dataValidade) || '-', 133, y + 5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);
      doc.text(`${item.quantidade} un`, 158, y + 5);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(185, 28, 28);
      doc.text(`R$ ${totalVal.toFixed(2)}`, 173, y + 5);

      y += 7.5;
    });
  }

  if (y > 250) {
    doc.addPage();
    y = 20;
  } else {
    y += 12;
  }

  // Footer / Signature lines
  doc.setLineWidth(0.3);
  doc.setDrawColor(156, 163, 175);
  doc.line(14, y, 90, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('Assinatura do Gerente / Responsável Técnico', 14, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('PADARIA.io Compliance & Waste Control', 120, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório gerado automaticamente pelo sistema PADARIA.io', 120, y + 9);

  // Save PDF Directly
  const fileName = `Relatorio_Executivo_Validades_${company.empresa.replace(/\s+/g, '_')}_${todayStr}.pdf`;
  doc.save(fileName);
}


