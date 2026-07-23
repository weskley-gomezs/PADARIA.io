import jsPDF from 'jspdf';
import { BakeryCompany, ContractInfo } from '../types';

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

