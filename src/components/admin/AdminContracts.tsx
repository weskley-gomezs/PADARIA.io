import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Building2,
  BookOpen,
  FileCheck2,
  Sparkles,
  UserCheck,
  Building,
  Save,
  CheckCircle,
  Sliders,
  DollarSign,
  Calendar,
  Edit3,
} from 'lucide-react';
import { BakeryCompany, ContractInfo } from '../../types';
import { generateContractPDF, generateTrainingGuidePDF } from '../../utils/pdfGenerator';
import { StorageService } from '../../services/storageService';

interface AdminContractsProps {
  companies: BakeryCompany[];
  onCompanyUpdate?: () => void;
}

export const AdminContracts: React.FC<AdminContractsProps> = ({ companies, onCompanyUpdate }) => {
  const [selectedCompany, setSelectedCompany] = useState<BakeryCompany | null>(
    companies[0] || null
  );

  // Form states for contract customization
  const [clienteNome, setClienteNome] = useState<string>('');
  const [cnpjInput, setCnpjInput] = useState<string>('');
  const [respTecnico, setRespTecnico] = useState<string>('Weskley Gomes');
  const [valorImp, setValorImp] = useState<number>(1500);
  const [valorMensal, setValorMensal] = useState<number>(199);
  const [vigenciaMeses, setVigenciaMeses] = useState<number>(12);
  const [obs, setObs] = useState<string>('');

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (selectedCompany) {
      const contract = selectedCompany.contrato || {};
      setClienteNome(contract.clienteNome || selectedCompany.empresa || '');
      setCnpjInput(contract.clienteCnpj || selectedCompany.cnpj || '');
      setRespTecnico(contract.responsavelTecnico || 'Weskley Gomes');
      setValorImp(contract.valorImplementacao ?? selectedCompany.financeiro?.valorImplementacao ?? 1500);
      setValorMensal(contract.valorMensalidade ?? selectedCompany.financeiro?.valorMensalidade ?? 199);
      setVigenciaMeses(contract.prazoVigenciaMeses ?? 12);
      setObs(contract.observacoesAdicionais || '');
      setSavedSuccess(false);
    }
  }, [selectedCompany]);

  const handleSaveContractDetails = () => {
    if (!selectedCompany) return;

    const updates: Partial<ContractInfo> = {
      clienteNome: clienteNome.trim(),
      clienteCnpj: cnpjInput.trim(),
      responsavelTecnico: respTecnico.trim(),
      valorImplementacao: Number(valorImp),
      valorMensalidade: Number(valorMensal),
      prazoVigenciaMeses: Number(vigenciaMeses),
      observacoesAdicionais: obs.trim(),
    };

    StorageService.updateCompanyContract(selectedCompany.codigoAtivacao, updates);

    // Also update current local selectedCompany object
    selectedCompany.cnpj = cnpjInput.trim();
    selectedCompany.contrato = {
      ...(selectedCompany.contrato || {
        contratoAceito: true,
        dataAssinaturaContrato: new Date().toISOString(),
        dataVencimentoContrato: new Date().toISOString(),
      }),
      ...updates,
    };

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    if (onCompanyUpdate) onCompanyUpdate();
  };

  const handleDownloadContract = () => {
    if (!selectedCompany) return;
    handleSaveContractDetails();
    generateContractPDF(selectedCompany, cnpjInput.trim());
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-[#E8571A]" />
            <h2 className="text-xl font-extrabold text-[#2C2C2C]">
              Personalização de Contratos & Documentos Oficiais
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Altere valores de implementação, mensalidade, prazo, CNPJ e insira cláusulas adicionais personalizadas por cliente
          </p>
        </div>

        <div className="bg-orange-50 px-4 py-2.5 rounded-xl border border-orange-200 flex items-center space-x-2.5">
          <UserCheck className="w-4 h-4 text-[#E8571A]" />
          <div className="text-xs">
            <p className="font-bold text-[#2C2C2C]">Responsável Técnico PADARIA.io</p>
            <p className="text-gray-600 font-semibold">{respTecnico}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Selection List */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-[#2C2C2C] flex items-center space-x-2 border-b pb-3">
            <Building2 className="w-4 h-4 text-[#D4A574]" />
            <span>Selecione a Panificadora</span>
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {companies.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Nenhuma padaria cadastrada.</p>
            ) : (
              companies.map((c) => (
                <button
                  key={c.codigoAtivacao}
                  onClick={() => setSelectedCompany(c)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex items-center justify-between cursor-pointer ${
                    selectedCompany?.codigoAtivacao === c.codigoAtivacao
                      ? 'bg-[#2C2C2C] text-white border-[#2C2C2C] shadow-sm'
                      : 'bg-white border-gray-200 text-[#2C2C2C] hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="font-extrabold text-sm">{c.empresa}</p>
                    <p className="text-[11px] opacity-75">{c.email}</p>
                    {c.cnpj && (
                      <p className="text-[10px] mt-0.5 opacity-80 font-mono">CNPJ: {c.cnpj}</p>
                    )}
                  </div>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                      selectedCompany?.codigoAtivacao === c.codigoAtivacao
                        ? 'bg-[#D4A574] text-white'
                        : 'bg-orange-50 text-[#E8571A]'
                    }`}
                  >
                    {c.codigoAtivacao}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Selected Company Document Actions & Contract Customization Form */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCompany ? (
            <div className="bg-white p-6 rounded-2xl border border-[#E0E0E0] shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-[#2C2C2C]">{selectedCompany.empresa}</h3>
                  <p className="text-xs text-gray-500">
                    Contratante: {selectedCompany.email} • Código: {selectedCompany.codigoAtivacao}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadContract}
                    className="px-4 py-2.5 rounded-xl bg-[#2C2C2C] hover:bg-black text-white font-extrabold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#D4A574]" />
                    <span>Baixar Contrato (PDF)</span>
                  </button>

                  <button
                    onClick={() => generateTrainingGuidePDF(selectedCompany)}
                    className="px-4 py-2.5 rounded-xl bg-[#E8571A] hover:bg-[#d44e15] text-white font-extrabold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Guia Treinamento (PDF)</span>
                  </button>
                </div>
              </div>

              {/* Editable Contract Form */}
              <div className="bg-[#FAFAF8] p-5 rounded-2xl border border-gray-200 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <Edit3 className="w-4 h-4 text-[#E8571A]" />
                    <h4 className="font-extrabold text-sm text-[#2C2C2C]">
                      Editar Cláusulas e Dados do Contrato
                    </h4>
                  </div>
                  {savedSuccess && (
                    <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full flex items-center space-x-1 animate-pulse">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      <span>Dados do Contrato Salvos!</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Razao Social */}
                  <div>
                    <label className="block font-bold text-[#2C2C2C] mb-1">
                      Razão Social / Nome Fantasia
                    </label>
                    <input
                      type="text"
                      value={clienteNome}
                      onChange={(e) => setClienteNome(e.target.value)}
                      placeholder="Nome completo da empresa"
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-[#E8571A] focus:outline-none"
                    />
                  </div>

                  {/* CNPJ */}
                  <div>
                    <label className="block font-bold text-[#2C2C2C] mb-1">
                      CNPJ da Panificadora
                    </label>
                    <input
                      type="text"
                      value={cnpjInput}
                      onChange={(e) => setCnpjInput(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 font-mono focus:ring-2 focus:ring-[#E8571A] focus:outline-none"
                    />
                  </div>

                  {/* Responsavel Tecnico */}
                  <div>
                    <label className="block font-bold text-[#2C2C2C] mb-1">
                      Responsável Técnico PADARIA.io
                    </label>
                    <input
                      type="text"
                      value={respTecnico}
                      onChange={(e) => setRespTecnico(e.target.value)}
                      placeholder="Ex: Weskley Gomes"
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-[#E8571A] focus:outline-none font-medium"
                    />
                  </div>

                  {/* Prazo Vigencia */}
                  <div>
                    <label className="block font-bold text-[#2C2C2C] mb-1">
                      Prazo de Vigência (Meses)
                    </label>
                    <input
                      type="number"
                      value={vigenciaMeses}
                      onChange={(e) => setVigenciaMeses(Number(e.target.value))}
                      placeholder="12"
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 font-mono focus:ring-2 focus:ring-[#E8571A] focus:outline-none"
                    />
                  </div>

                  {/* Valor Implementacao */}
                  <div>
                    <label className="block font-bold text-[#2C2C2C] mb-1">
                      Taxa de Implementação (R$)
                    </label>
                    <input
                      type="number"
                      value={valorImp}
                      onChange={(e) => setValorImp(Number(e.target.value))}
                      placeholder="1500"
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 font-mono focus:ring-2 focus:ring-[#E8571A] focus:outline-none"
                    />
                  </div>

                  {/* Valor Mensalidade */}
                  <div>
                    <label className="block font-bold text-[#2C2C2C] mb-1">
                      Valor da Mensalidade (R$/mês)
                    </label>
                    <input
                      type="number"
                      value={valorMensal}
                      onChange={(e) => setValorMensal(Number(e.target.value))}
                      placeholder="199"
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 font-mono focus:ring-2 focus:ring-[#E8571A] focus:outline-none"
                    />
                  </div>

                  {/* Observacoes Adicionais */}
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-[#2C2C2C] mb-1">
                      Cláusulas Adicionais ou Observações Customizadas (opcional)
                    </label>
                    <textarea
                      rows={3}
                      value={obs}
                      onChange={(e) => setObs(e.target.value)}
                      placeholder="Ex: Condições especiais de pagamento, descontos ou termos de suporte específicos..."
                      className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-[#E8571A] focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSaveContractDetails}
                    className="px-5 py-2.5 rounded-xl bg-[#E8571A] hover:bg-[#d44e15] text-white text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações do Contrato</span>
                  </button>
                </div>
              </div>

              {/* Document Overview Box */}
              <div className="bg-[#FAFAF8] p-5 rounded-xl border border-gray-200 space-y-4 text-xs">
                <div className="flex items-center justify-between text-[#2C2C2C]">
                  <div className="flex items-center space-x-2">
                    <FileCheck2 className="w-5 h-5 text-[#27AE60]" />
                    <h4 className="font-black text-sm">Resumo Atualizado da Minuta do Contrato</h4>
                  </div>
                  <span className="text-[11px] font-semibold bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-full">
                    Geração Dinâmica jsPDF
                  </span>
                </div>

                <div className="space-y-2.5 text-gray-700 font-sans leading-relaxed">
                  <p>
                    <strong>FORNECEDOR:</strong> PADARIA.IO TECNOLOGIA E SISTEMAS DE GESTÃO (
                    <strong className="text-[#E8571A]">{respTecnico} - Responsável Técnico</strong>).
                  </p>
                  <p>
                    <strong>CONTRATANTE:</strong> {clienteNome.toUpperCase()} (
                    <strong>CNPJ: {cnpjInput || 'Pendente'}</strong>).
                  </p>
                  <p>
                    <strong>CLÁUSULA 1ª - OBJETO:</strong> Licenciamento do Software SaaS de Controle de
                    Validade e Alertas Sanitários para Auditorias da Vigilância Sanitária.
                  </p>
                  <p>
                    <strong>CLÁUSULA 2ª - VALORES FINANCEIROS:</strong>
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-600">
                    <li>
                      <strong>Implementação & Treinamento:</strong> R${' '}
                      {Number(valorImp).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (pago no setup).
                    </li>
                    <li>
                      <strong>Mensalidade e Suporte:</strong> R${' '}
                      {Number(valorMensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês (cobrança recorrente).
                    </li>
                  </ul>
                  <p>
                    <strong>CLÁUSULA 3ª - PRAZO DE VIGÊNCIA:</strong> {vigenciaMeses} meses com renovação automática.
                  </p>
                  {obs && (
                    <p className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                      <strong>OBSERVAÇÕES ADICIONAIS:</strong> {obs}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-[#E0E0E0] text-gray-400">
              <Sparkles className="w-8 h-8 mx-auto text-[#D4A574] mb-2" />
              <p className="font-bold text-sm">Selecione uma padaria para gerar ou visualizar documentos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


