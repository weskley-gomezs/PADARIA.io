import {
  PartyKit,
  PartyOrder,
  PartyOrderRules,
  DistributionType,
  PartyOrderOptionItem,
  PartyOrderChosenAddon,
  PartyBakeryPublicConfig,
} from '../types';

/**
 * Normaliza um nome para slug público exclusivo
 * Regras: lowercase, sem acentos, hífens no lugar de espaços, sem caracteres inválidos
 */
export function generateBakerySlug(name: string, code?: string): string {
  if (!name && !code) return 'padaria';
  const base = name || code || 'padaria';
  const cleaned = base
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/&/g, 'e') // & vira e
    .replace(/[^a-z0-9\s-]/g, '') // remove inválidos
    .replace(/\s+/g, '-') // espaços viram hífens
    .replace(/-+/g, '-') // múltiplos hífens viram um só
    .replace(/^-+|-+$/g, ''); // remove hífens do começo e fim

  return cleaned || 'padaria';
}

/**
 * Valida data e horário de agendamento com base em horas mínimas de antecedência
 */
export function validateOrderDateTime(
  dateStr: string,
  timeStr: string,
  minHoursAhead: number = 24
): { valid: boolean; message?: string } {
  if (!dateStr) {
    return { valid: false, message: 'Por favor, selecione a data da encomenda.' };
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = (timeStr || '12:00').split(':').map(Number);
  const selectedDateTime = new Date(year, month - 1, day, hours || 0, minutes || 0, 0);

  const now = new Date();
  const minAllowedTime = new Date(now.getTime() + minHoursAhead * 60 * 60 * 1000);

  if (selectedDateTime.getTime() < minAllowedTime.getTime()) {
    const hoursFormatted = minHoursAhead >= 24 ? `${Math.round(minHoursAhead / 24)} dia(s)` : `${minHoursAhead} horas`;
    return {
      valid: false,
      message: `A padaria exige antecedência mínima de ${hoursFormatted} para encomendas. Por favor, escolha outra data ou horário.`,
    };
  }

  return { valid: true };
}

/**
 * Valida se um slug segue o padrão seguro
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || slug.length < 2 || slug.length > 60) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Mapeia o dia da semana (0=Dom, 1=Seg...) para a chave em PartyOrderRules.diasDisponiveis
 */
export function getDayKeyFromDate(date: Date): keyof PartyOrderRules['diasDisponiveis'] {
  const day = date.getDay();
  switch (day) {
    case 0: return 'domingo';
    case 1: return 'segunda';
    case 2: return 'terca';
    case 3: return 'quarta';
    case 4: return 'quinta';
    case 5: return 'sexta';
    case 6: return 'sabado';
    default: return 'segunda';
  }
}

export const DAY_NAMES_BR: Record<keyof PartyOrderRules['diasDisponiveis'], string> = {
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

/**
 * Formata objeto Date para string YYYY-MM-DD em fuso horário local
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte string YYYY-MM-DD para objeto Date local (sem interferência de UTC)
 */
export function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * Calcula a primeira data disponível para encomenda baseado nas regras de antecedência e horário limite
 */
export function calculateFirstAvailableDate(rules: PartyOrderRules, now: Date = new Date()): string {
  let minDays = Math.max(1, rules.antecedenciaMinimaDias || 1);

  // Verifica horário limite
  if (rules.horarioLimite) {
    const [limitHour, limitMinute] = rules.horarioLimite.split(':').map(Number);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (
      currentHour > limitHour ||
      (currentHour === limitHour && currentMinute >= (limitMinute || 0))
    ) {
      // Pedido após o horário limite -> adiciona +1 dia de antecedência
      minDays += 1;
    }
  }

  // Avança minDays a partir de hoje
  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + minDays);

  // Procura o primeiro dia que esteja habilitado em rules.diasDisponiveis
  let safetyLoop = 0;
  while (safetyLoop < 30) {
    const dayKey = getDayKeyFromDate(targetDate);
    if (rules.diasDisponiveis && rules.diasDisponiveis[dayKey] !== false) {
      return formatDateISO(targetDate);
    }
    // Se esse dia estiver desabilitado, avança 1 dia
    targetDate.setDate(targetDate.getDate() + 1);
    safetyLoop++;
  }

  return formatDateISO(targetDate);
}

/**
 * Valida se uma data específica pode ser selecionada pelo cliente
 */
export function isDateAvailableForOrder(
  dateStr: string,
  rules: PartyOrderRules,
  now: Date = new Date(),
  ordersCountForDate: number = 0
): { available: boolean; reason?: string } {
  if (!dateStr) {
    return { available: false, reason: 'Nenhuma data informada.' };
  }

  const firstAvailable = calculateFirstAvailableDate(rules, now);
  if (dateStr < firstAvailable) {
    return {
      available: false,
      reason: `Data indisponível. A padaria exige no mínimo ${rules.antecedenciaMinimaDias} dia(s) de antecedência (primeira data: ${firstAvailable.split('-').reverse().join('/')}).`,
    };
  }

  const selectedDate = parseDateLocal(dateStr);
  const dayKey = getDayKeyFromDate(selectedDate);

  if (rules.diasDisponiveis && rules.diasDisponiveis[dayKey] === false) {
    return {
      available: false,
      reason: `A padaria não realiza entregas ou retiradas aos(às) ${DAY_NAMES_BR[dayKey]}s.`,
    };
  }

  if (rules.maxPedidosPorDia && rules.maxPedidosPorDia > 0) {
    if (ordersCountForDate >= rules.maxPedidosPorDia) {
      return {
        available: false,
        reason: 'Essa data atingiu o limite de encomendas da padaria. Por favor, escolha outra data.',
      };
    }
  }

  return { available: true };
}

/**
 * Gera lista de próximas datas disponíveis para exibição no calendário do cliente
 */
export function getAvailableDateCards(
  rules: PartyOrderRules,
  bookedCountMap: Record<string, number> = {},
  daysToGenerate: number = 21,
  now: Date = new Date()
): Array<{
  dateStr: string;
  dayNumber: number;
  dayName: string;
  monthName: string;
  available: boolean;
  reason?: string;
  slotsRemaining?: number;
}> {
  const list = [];
  const firstDateStr = calculateFirstAvailableDate(rules, now);
  const startDate = parseDateLocal(firstDateStr);

  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dayShortNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const cur = new Date(startDate);
  for (let i = 0; i < daysToGenerate; i++) {
    const dateStr = formatDateISO(cur);
    const dayKey = getDayKeyFromDate(cur);
    const isDayOfWeekEnabled = rules.diasDisponiveis ? rules.diasDisponiveis[dayKey] !== false : true;
    const booked = bookedCountMap[dateStr] || 0;
    const maxLimit = rules.maxPedidosPorDia || 0;
    const isCapExceeded = maxLimit > 0 && booked >= maxLimit;

    let available = true;
    let reason: string | undefined;

    if (!isDayOfWeekEnabled) {
      available = false;
      reason = `${DAY_NAMES_BR[dayKey]} indisponível`;
    } else if (isCapExceeded) {
      available = false;
      reason = 'Limite do dia atingido';
    }

    list.push({
      dateStr,
      dayNumber: cur.getDate(),
      dayName: dayShortNames[cur.getDay()],
      monthName: monthNames[cur.getMonth()],
      available,
      reason,
      slotsRemaining: maxLimit > 0 ? Math.max(0, maxLimit - booked) : undefined,
    });

    cur.setDate(cur.getDate() + 1);
  }

  return list;
}

/**
 * Validação rigorosa de distribuição de salgados ou docinhos
 */
export function validateOptionDistribution(
  type: 'salgados' | 'docinhos',
  distribution: PartyOrderOptionItem[],
  rules: {
    quantidadeTotal: number;
    maxSabores: number;
    regraDistribuicao: DistributionType;
    minimoPorSabor?: number;
    saboresDisponiveis: string[];
  }
): { valid: boolean; error?: string } {
  if (!distribution || distribution.length === 0) {
    return { valid: false, error: `Selecione os sabores dos ${type}.` };
  }

  // Filtrar apenas itens com quantidade > 0
  const activeItems = distribution.filter((item) => item.quantidade > 0);

  if (activeItems.length === 0) {
    return { valid: false, error: `A quantidade de ${type} deve somar ${rules.quantidadeTotal} unidades.` };
  }

  if (activeItems.length > rules.maxSabores) {
    return {
      valid: false,
      error: `Você selecionou ${activeItems.length} sabores de ${type}, mas o limite deste kit é de no máximo ${rules.maxSabores} sabores.`,
    };
  }

  // Verifica se todos os sabores existem no kit
  for (const item of activeItems) {
    if (!rules.saboresDisponiveis.includes(item.sabor)) {
      return { valid: false, error: `O sabor "${item.sabor}" não está disponível neste kit.` };
    }
  }

  // Calcula soma total
  const totalChosen = activeItems.reduce((sum, item) => sum + item.quantidade, 0);
  if (totalChosen !== rules.quantidadeTotal) {
    return {
      valid: false,
      error: `A soma dos ${type} deve ser exatamente ${rules.quantidadeTotal} unidades (atualmente está em ${totalChosen}).`,
    };
  }

  // Validação por tipo de regra
  if (rules.regraDistribuicao === 'equal') {
    const count = activeItems.length;
    const expectedPerFlavor = rules.quantidadeTotal / count;

    if (!Number.isInteger(expectedPerFlavor)) {
      return {
        valid: false,
        error: `Com distribuição igual, ${rules.quantidadeTotal} unidades não podem ser divididas igualmente entre ${count} sabores.`,
      };
    }

    for (const item of activeItems) {
      if (item.quantidade !== expectedPerFlavor) {
        return {
          valid: false,
          error: `Na distribuição igual deste kit, cada um dos ${count} sabores deve ter exatamente ${expectedPerFlavor} unidades.`,
        };
      }
    }
  } else if (rules.regraDistribuicao === 'min_per_flavor') {
    const min = rules.minimoPorSabor || 1;
    for (const item of activeItems) {
      if (item.quantidade < min) {
        return {
          valid: false,
          error: `Cada sabor de ${type} precisa ter pelo menos ${min} unidades (o sabor "${item.sabor}" está com ${item.quantidade}).`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Calcula os totais do pedido com segurança matemática
 */
export function calculateOrderPrice(
  precoBase: number,
  adicionais: PartyOrderChosenAddon[] = []
): { precoBase: number; valorAdicionais: number; valorTotal: number } {
  const safePrecoBase = Math.max(0, Number(precoBase) || 0);
  let valorAdicionais = 0;

  for (const add of adicionais) {
    const p = Math.max(0, Number(add.preco) || 0);
    const q = Math.max(0, Number(add.quantidade) || 0);
    valorAdicionais += p * q;
  }

  const valorTotal = Number((safePrecoBase + valorAdicionais).toFixed(2));
  return {
    precoBase: Number(safePrecoBase.toFixed(2)),
    valorAdicionais: Number(valorAdicionais.toFixed(2)),
    valorTotal,
  };
}

/**
 * Gera a URL oficial de encomenda da padaria.
 * Em produção: https://padariaio.com.br/encomendas/{slug}
 * Em desenvolvimento/preview: utiliza a origem atual da aplicação.
 */
export function getPublicOrderingUrl(slug: string, forceProduction: boolean = false): string {
  const cleanSlug = slug ? slug.trim().toLowerCase() : 'padaria';
  
  if (forceProduction) {
    return `https://padariaio.com.br/encomendas/${cleanSlug}`;
  }

  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    // Se estiver em localhost ou domínio de desenvolvimento, gera link funcional no ambiente atual
    if (origin.includes('localhost') || origin.includes('run.app') || origin.includes('web.app') || origin.includes('ais-')) {
      return `${origin}/#/encomendas/${cleanSlug}`;
    }
  }

  return `https://padariaio.com.br/encomendas/${cleanSlug}`;
}

/**
 * Retorna a URL de produção definitiva para exibição oficial nos cards de compartilhamento
 */
export function getProductionOrderingUrl(slug: string): string {
  const cleanSlug = slug ? slug.trim().toLowerCase() : 'padaria';
  return `https://padariaio.com.br/encomendas/${cleanSlug}`;
}

/**
 * Divide uma quantidade total igualmente ou proporcionalmente entre os sabores selecionados
 */
export function distributeFlavorQuantities(
  total: number,
  selectedFlavors: string[]
): Record<string, number> {
  if (!selectedFlavors || selectedFlavors.length === 0 || total <= 0) {
    return {};
  }

  const count = selectedFlavors.length;
  const basePerFlavor = Math.floor(total / count);
  const remainder = total % count;

  const result: Record<string, number> = {};
  selectedFlavors.forEach((flavor, index) => {
    // Adiciona o resto da divisão ao primeiro sabor
    result[flavor] = index === 0 ? basePerFlavor + remainder : basePerFlavor;
  });

  return result;
}

/**
 * Gera ID único amigável no formato #PD-XXXXXX ou PED-YYYYMMDD-XXXX
 */
export function generatePartyOrderId(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `PD-${year}${month}${day}-${rand}`;
}

/**
 * Cria a mensagem de inspiração do bolo para o WhatsApp
 */
export function createWhatsAppInspirationMessage(
  orderId: string,
  clientName: string,
  bakeryName?: string
): string {
  const cleanId = orderId.startsWith('#') ? orderId : `#${orderId}`;
  return `Olá! Fiz um pedido de Kit Festa pelo Padariaio na ${bakeryName || 'padaria'}.\n\nNúmero do pedido: ${cleanId}\nCliente: ${clientName || 'Cliente'}\n\nGostaria de enviar a foto de inspiração do bolo por aqui. 🎂📸`;
}

/**
 * Cria mensagem para divulgar o link do cardápio no WhatsApp
 */
export function createWhatsAppShareLinkMessage(
  bakeryName: string,
  orderingUrl: string
): string {
  return `Olá! 🎉\n\nAgora você pode encomendar nossos deliciosos *Kits Festa* (bolos decorados, salgadinhos e docinhos) de forma rápida e personalizada online!\n\n👉 Acesse nosso cardápio de encomendas:\n${orderingUrl}\n\nMonte seu pedido com seus sabores favoritos e receba tudo fresquinho! 🎂🥟✨`;
}

/**
 * Cria a mensagem para a padaria conversar com o cliente no WhatsApp sobre a encomenda
 */
export function createBakeryContactClientMessage(
  bakeryName: string,
  clientName: string,
  orderId: string
): string {
  const cleanId = orderId.startsWith('#') ? orderId : `#${orderId}`;
  return `Olá, ${clientName}! Aqui é da ${bakeryName}.\nEstamos entrando em contato sobre a sua encomenda ${cleanId} do Padariaio.`;
}

export const generatePublicBakerySlug = generateBakerySlug;

/**
 * Cria a mensagem completa do pedido com resumo para o WhatsApp
 */
export function createWhatsAppOrderMessage(order: PartyOrder, bakeryName: string): string {
  const formattedDate = order.agendamento.data.split('-').reverse().join('/');
  const cleanId = order.id.startsWith('#') ? order.id : `#${order.id}`;
  
  let msg = `Olá! Fiz um pedido de Kit Festa pelo Padariaio.\n\n`;
  msg += `*PEDIDO:* ${cleanId}\n`;
  msg += `*Kit:* ${order.kitNome}\n`;
  msg += `*Data:* ${formattedDate} às ${order.agendamento.horario}\n`;
  msg += `*Cliente:* ${order.cliente.nome}\n`;
  msg += `*Contato:* ${order.cliente.whatsapp}\n`;
  msg += `*Entrega/Retirada:* ${order.cliente.tipoEntrega === 'entrega' ? `Receber em casa (${order.cliente.enderecoEntrega || 'Endereço informado'})` : 'Retirar na loja'}\n\n`;

  msg += `*--- DETALHES DO PEDIDO ---*\n`;
  if (order.bolo.massa) msg += `• *Massa do Bolo:* ${order.bolo.massa}\n`;
  msg += `• *Recheios do Bolo:* ${order.bolo.recheiosEscolhidos.join(' + ')}\n`;
  if (order.bolo.publicoAlvo) {
    msg += `• *Público / Estilo:* ${order.bolo.publicoAlvo}\n`;
  }
  if (order.bolo.cor || order.bolo.corPersonalizada) {
    msg += `• *Cor/Preferência:* ${order.bolo.corPersonalizada || order.bolo.cor}\n`;
  }
  if (order.bolo.tema) msg += `• *Tema:* ${order.bolo.tema}\n`;
  if (order.bolo.nomeAniversariante) {
    msg += `• *Aniversariante:* ${order.bolo.nomeAniversariante} ${order.bolo.idadeAniversariante ? `(${order.bolo.idadeAniversariante} anos)` : ''}\n`;
  }
  if (order.bolo.mensagem) msg += `• *Frase no Bolo:* "${order.bolo.mensagem}"\n`;

  if (order.salgados.distribuicao.length > 0) {
    msg += `\n*Salgados (${order.salgados.total} un):*\n`;
    order.salgados.distribuicao.forEach(s => {
      msg += `• ${s.quantidade}x ${s.sabor}\n`;
    });
  }

  if (order.docinhos.distribuicao.length > 0) {
    msg += `\n*Docinhos (${order.docinhos.total} un):*\n`;
    order.docinhos.distribuicao.forEach(d => {
      msg += `• ${d.quantidade}x ${d.sabor}\n`;
    });
  }

  if (order.adicionaisEscolhidos && order.adicionaisEscolhidos.length > 0) {
    msg += `\n*Adicionais:*\n`;
    order.adicionaisEscolhidos.forEach(a => {
      msg += `• ${a.quantidade}x ${a.nome} (R$ ${(a.preco * a.quantidade).toFixed(2).replace('.', ',')})\n`;
    });
  }

  if (order.taxaEntrega && order.taxaEntrega > 0) {
    msg += `\n*Taxa de Entrega:* R$ ${order.taxaEntrega.toFixed(2).replace('.', ',')}\n`;
  }

  msg += `\n*VALOR TOTAL: R$ ${order.valorTotal.toFixed(2).replace('.', ',')}*\n`;
  
  if (order.cliente.observacoes) {
    msg += `\n*Observações:* ${order.cliente.observacoes}\n`;
  }

  if (order.bolo.enviaraInspiracaoWhatsApp) {
    msg += `\n🎂 *Foto de Inspiração:* Estou enviando a foto de inspiração do bolo logo a seguir!\n`;
  }

  msg += `\nGostaria de confirmar meu pedido!`;

  return msg;
}

/**
 * Calcula totais a partir de um PartyKit e quantidades de adicionais
 */
export function calculateOrderTotals(
  kit: PartyKit,
  addonQuantities: Record<string, number> = {},
  deliveryFee: number = 0
): {
  precoBase: number;
  valorAdicionais: number;
  taxaEntrega: number;
  valorTotal: number;
  itensAdicionaisEscolhidos: PartyOrderChosenAddon[];
} {
  const precoBase = Math.max(0, kit?.precoBase || 0);
  const itensAdicionaisEscolhidos: PartyOrderChosenAddon[] = [];
  let valorAdicionais = 0;

  if (kit?.adicionais) {
    for (const add of kit.adicionais) {
      const q = addonQuantities[add.id] || 0;
      if (q > 0) {
        itensAdicionaisEscolhidos.push({
          id: add.id,
          nome: add.nome,
          preco: add.preco,
          quantidade: q,
        });
        valorAdicionais += add.preco * q;
      }
    }
  }

  const taxaEntrega = Math.max(0, Number(deliveryFee) || 0);
  const valorTotal = Number((precoBase + valorAdicionais + taxaEntrega).toFixed(2));

  return {
    precoBase: Number(precoBase.toFixed(2)),
    valorAdicionais: Number(valorAdicionais.toFixed(2)),
    taxaEntrega: Number(taxaEntrega.toFixed(2)),
    valorTotal,
    itensAdicionaisEscolhidos,
  };
}
export function getDefaultPublicConfig(bakeryCode: string, bakeryName: string): PartyBakeryPublicConfig {
  return {
    bakeryCode,
    slug: generateBakerySlug(bakeryName) || bakeryCode.toLowerCase(),
    nomePublico: bakeryName || 'Minha Padaria',
    descricao: 'Encomende seu Kit Festa completo com bolos personalizados, salgados fritos na hora e docinhos artesanais.',
    telefone: '',
    whatsapp: '',
    endereco: '',
    horarioFuncionamento: 'Segunda a Sábado das 06:00 às 20:00 • Domingo das 07:00 às 13:00',
    mensagemApresentacao: '🎉 Monte seu Kit Festa personalizado em poucos passos e receba tudo fresquinho para sua comemoração!',
    paginaAtiva: true,
    exibirEndereco: true,
    exibirTelefone: true,
    exibirWhatsApp: true,
    exibirInstagram: true,
    regras: {
      antecedenciaMinimaDias: 2,
      horarioLimite: '18:00',
      diasDisponiveis: {
        segunda: true,
        terca: true,
        quarta: true,
        quinta: true,
        sexta: true,
        sabado: true,
        domingo: true,
      },
      horariosRetirada: ['10:00', '12:00', '14:00', '16:00', '18:00'],
      maxPedidosPorDia: 15,
      permitirEntrega: true,
    },
    updatedAt: new Date().toISOString(),
  };
}
