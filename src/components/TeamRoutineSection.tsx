import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
  Sun,
  Sunset,
  Moon,
  Layers,
  AlertCircle,
  Calendar,
  User,
  Filter,
  CheckCheck,
  Sparkles,
  Info
} from 'lucide-react';
import { OperationalTask, TaskShift, TaskCategory } from '../types';
import { formatDateToISO } from '../utils/dateUtils';

export const TeamRoutineSection: React.FC = () => {
  const {
    operationalTasks,
    activeCode,
    addOperationalTask,
    toggleOperationalTask,
    deleteOperationalTask
  } = useData();

  const [selectedShift, setSelectedShift] = useState<TaskShift | 'todos'>('todos');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'pendentes' | 'concluidas'>('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for new task
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newShift, setNewShift] = useState<TaskShift>('manha');
  const [newCategory, setNewCategory] = useState<TaskCategory>('conferencia');
  const [newDueTime, setNewDueTime] = useState('10:00');
  const [newPriority, setNewPriority] = useState<'baixa' | 'media' | 'alta' | 'urgente'>('media');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Completion note prompt state
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completedByName, setCompletedByName] = useState('Equipe do Balcão');
  const [completionNote, setCompletionNote] = useState('');

  const todayStr = useMemo(() => formatDateToISO(new Date()), []);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return operationalTasks.filter((task) => {
      const matchesShift = selectedShift === 'todos' || task.shift === selectedShift;
      const matchesStatus =
        statusFilter === 'todas'
          ? true
          : statusFilter === 'pendentes'
          ? task.status !== 'concluida'
          : task.status === 'concluida';
      return matchesShift && matchesStatus;
    });
  }, [operationalTasks, selectedShift, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = operationalTasks.length;
    const completed = operationalTasks.filter((t) => t.status === 'concluida').length;
    const pending = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 100;

    const manhaCount = operationalTasks.filter((t) => t.shift === 'manha').length;
    const tardeCount = operationalTasks.filter((t) => t.shift === 'tarde').length;
    const noiteCount = operationalTasks.filter((t) => t.shift === 'noite').length;

    return { total, completed, pending, rate, manhaCount, tardeCount, noiteCount };
  }, [operationalTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCode || !newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await addOperationalTask({
        bakeryCode: activeCode,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        shift: newShift,
        category: newCategory,
        status: 'pendente',
        dueDate: todayStr,
        dueTime: newDueTime,
        priority: newPriority,
        assignedTo: newAssignedTo.trim() || undefined
      });

      // Reset form & close
      setNewTitle('');
      setNewDescription('');
      setNewAssignedTo('');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error creating operational task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    const task = operationalTasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.status !== 'concluida') {
      // Prompt modal/quick action to confirm completion details
      setCompletingTaskId(taskId);
      setCompletionNote('');
    } else {
      // Untoggle directly
      await toggleOperationalTask(taskId);
    }
  };

  const confirmTaskCompletion = async () => {
    if (!completingTaskId) return;
    await toggleOperationalTask(completingTaskId, completedByName, completionNote);
    setCompletingTaskId(null);
  };

  const getShiftBadge = (shift: TaskShift) => {
    switch (shift) {
      case 'manha':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
            <Sun className="w-3 h-3 text-amber-600" /> Manhã
          </span>
        );
      case 'tarde':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-orange-100 text-orange-900 border border-orange-200">
            <Sunset className="w-3 h-3 text-orange-600" /> Tarde
          </span>
        );
      case 'noite':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
            <Moon className="w-3 h-3 text-indigo-600" /> Noite
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
            <Layers className="w-3 h-3" /> Geral
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">Urgente</span>;
      case 'alta':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">Alta</span>;
      case 'media':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">Média</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600 uppercase">Baixa</span>;
    }
  };

  return (
    <div id="team-routine-section" className="space-y-6 pb-12 animate-fadeIn">
      {/* ---------------------------------------------------- */}
      {/* 1. SECTION HEADER & STATS CARD                       */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-stone-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs font-semibold uppercase tracking-wider mb-2">
              <CheckCheck className="w-3.5 h-3.5" />
              Gestão Operacional da Equipe
            </div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Rotinas & Checklists por Turno
            </h1>
            <p className="text-stone-500 text-sm mt-1">
              Garanta que a equipe realize conferências de estoque, registros de perdas e auditorias de validades no horário correto.
            </p>
          </div>

          <button
            id="btn-new-routine-task"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-sm shadow-md transition-all active:scale-95 whitespace-nowrap self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nova Rotina / Tarefa
          </button>
        </div>

        {/* Progress Bar & Shift Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-stone-100">
          <div className="md:col-span-2 p-4 rounded-xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-1.5">
              <span>Progresso das Rotinas de Hoje</span>
              <span>{stats.completed} de {stats.total} concluídas ({stats.rate}%)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-stone-200 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${stats.rate}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-stone-500 mt-2 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-stone-400" />
              {stats.pending === 0
                ? 'Todas as tarefas operacionais de hoje foram executadas com sucesso!'
                : `Restam ${stats.pending} tarefas pendentes para o fechamento da padaria.`}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Manhã</span>
            <div className="text-xl font-bold text-amber-950 mt-1">
              {operationalTasks.filter((t) => t.shift === 'manha' && t.status === 'concluida').length} / {stats.manhaCount}
            </div>
            <span className="text-[11px] text-amber-800 font-medium">Abertura & 1ª Fornada</span>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/60 flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">Tarde & Noite</span>
            <div className="text-xl font-bold text-indigo-950 mt-1">
              {operationalTasks.filter((t) => (t.shift === 'tarde' || t.shift === 'noite') && t.status === 'concluida').length} / {stats.tardeCount + stats.noiteCount}
            </div>
            <span className="text-[11px] text-indigo-800 font-medium">Auditoria & Fechamento</span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. FILTERS & SHIFT NAVIGATION TABS                   */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
        {/* Shift Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedShift('todos')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              selectedShift === 'todos'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Todos os Turnos ({operationalTasks.length})
          </button>
          <button
            onClick={() => setSelectedShift('manha')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              selectedShift === 'manha'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <Sun className="w-3.5 h-3.5" /> Manhã ({stats.manhaCount})
          </button>
          <button
            onClick={() => setSelectedShift('tarde')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              selectedShift === 'tarde'
                ? 'bg-orange-700 text-white'
                : 'bg-orange-50 text-orange-900 hover:bg-orange-100'
            }`}
          >
            <Sunset className="w-3.5 h-3.5" /> Tarde ({stats.tardeCount})
          </button>
          <button
            onClick={() => setSelectedShift('noite')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              selectedShift === 'noite'
                ? 'bg-indigo-700 text-white'
                : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
            }`}
          >
            <Moon className="w-3.5 h-3.5" /> Noite ({stats.noiteCount})
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 border-t sm:border-t-0 pt-2 sm:pt-0 border-stone-100">
          <button
            onClick={() => setStatusFilter('todas')}
            className={`px-2.5 py-1 rounded text-xs font-semibold ${statusFilter === 'todas' ? 'bg-stone-200 text-stone-900' : 'text-stone-500 hover:text-stone-800'}`}
          >
            Todas
          </button>
          <button
            onClick={() => setStatusFilter('pendentes')}
            className={`px-2.5 py-1 rounded text-xs font-semibold ${statusFilter === 'pendentes' ? 'bg-amber-100 text-amber-900' : 'text-stone-500 hover:text-stone-800'}`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setStatusFilter('concluidas')}
            className={`px-2.5 py-1 rounded text-xs font-semibold ${statusFilter === 'concluidas' ? 'bg-emerald-100 text-emerald-900' : 'text-stone-500 hover:text-stone-800'}`}
          >
            Concluídas
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. TASK LIST / CHECKLIST CARDS                       */}
      {/* ---------------------------------------------------- */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'concluida';

            return (
              <div
                key={task.id}
                id={`task-item-${task.id}`}
                className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                  isDone
                    ? 'bg-stone-50/80 border-stone-200 text-stone-600 opacity-90'
                    : 'bg-white border-stone-200 text-stone-900 shadow-sm hover:border-amber-300'
                }`}
              >
                <div>
                  {/* Top Bar: Shift & Priority */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getShiftBadge(task.shift)}
                      {getPriorityBadge(task.priority)}
                    </div>
                    {task.dueTime && (
                      <span className="text-xs font-semibold text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        Horário: {task.dueTime}
                      </span>
                    )}
                  </div>

                  {/* Task Main Content */}
                  <div className="mt-3 flex items-start gap-3">
                    <button
                      id={`btn-toggle-task-${task.id}`}
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-0.5 text-stone-400 hover:text-emerald-600 transition-colors flex-shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Circle className="w-6 h-6 text-stone-300 hover:text-emerald-500" />
                      )}
                    </button>

                    <div className="flex-1">
                      <h3 className={`font-bold text-sm leading-snug ${isDone ? 'line-through text-stone-500' : 'text-stone-900'}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">{task.description}</p>
                      )}

                      {/* Completed metadata */}
                      {isDone && task.completedAt && (
                        <div className="mt-2.5 p-2 rounded-lg bg-emerald-50/80 border border-emerald-100 text-[11px] text-emerald-900">
                          <span className="font-semibold">Concluído por:</span> {task.completedBy || 'Equipe'}{' '}
                          às {new Date(task.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {task.notes && (
                            <p className="mt-0.5 text-emerald-800 italic font-normal">"{task.notes}"</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {task.assignedTo ? `Atribuído a: ${task.assignedTo}` : 'Qualquer colaborador'}
                  </span>

                  <button
                    id={`btn-delete-task-${task.id}`}
                    onClick={() => deleteOperationalTask(task.id)}
                    className="p-1 text-stone-300 hover:text-rose-600 transition-colors"
                    title="Excluir rotina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <CheckCheck className="w-10 h-10 mx-auto text-stone-300 mb-2" />
          <h3 className="text-sm font-bold text-stone-700">Nenhuma rotina encontrada neste filtro</h3>
          <p className="text-xs text-stone-400 mt-1">
            Clique em "Nova Rotina / Tarefa" para adicionar procedimentos operacionais para sua equipe.
          </p>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. MODAL: NOVA ROTINA OPERACIONAL                    */}
      {/* ---------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-lg font-bold text-stone-900">Cadastrar Nova Rotina de Operação</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Título da Rotina / Tarefa *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Auditoria de validades na gôndola de pães"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Instruções / Detalhes</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Explique o que deve ser checado ou registrado pela equipe..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Turno</label>
                  <select
                    value={newShift}
                    onChange={(e) => setNewShift(e.target.value as TaskShift)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="manha">🌅 Manhã (Abertura)</option>
                    <option value="tarde">☀️ Tarde</option>
                    <option value="noite">🌙 Noite (Fechamento)</option>
                    <option value="geral">⚙️ Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Horário Previsto</label>
                  <input
                    type="time"
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="conferencia">Conferência de Estoque</option>
                    <option value="perdas">Registro de Perdas</option>
                    <option value="producao">Produção / Fornada</option>
                    <option value="fechamento">Fechamento do Dia</option>
                    <option value="limpeza">Higienização / Limpeza</option>
                    <option value="geral">Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Prioridade</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Responsável / Colaborador (Opcional)</label>
                <input
                  type="text"
                  value={newAssignedTo}
                  onChange={(e) => setNewAssignedTo(e.target.value)}
                  placeholder="Ex: João da Panificação, Maria do Balcão"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-stone-300 text-stone-600 font-semibold text-sm hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Rotina'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. MODAL: CONFIRMAÇÃO DE CONCLUSÃO DE TAREFA         */}
      {/* ---------------------------------------------------- */}
      {completingTaskId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                <CheckCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Registrar Conclusão de Rotina</h3>
                <p className="text-xs text-stone-500">Confirme quem executou esta tarefa na padaria.</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nome do Responsável *</label>
                <input
                  type="text"
                  value={completedByName}
                  onChange={(e) => setCompletedByName(e.target.value)}
                  placeholder="Ex: Carlos (Padeiro), Ana (Caixa)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Observações Operacionais (Opcional)</label>
                <textarea
                  rows={2}
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder="Ex: Tudo conferido sem divergências. Sobras dentro do padrão."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompletingTaskId(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-600 font-semibold text-xs hover:bg-stone-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmTaskCompletion}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition-all active:scale-95"
              >
                Confirmar Conclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
