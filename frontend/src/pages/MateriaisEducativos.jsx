import { useEffect, useState, useCallback } from 'react';
import {
  BookOpenIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  ChevronRightIcon,
  SparklesIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { ubsService } from '../services/ubsService';
import { useNotifications } from '../components/ui/Notifications';

const BASE_API = import.meta.env.PROD
  ? '/api'
  : import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const PUBLICO_ALVO_OPTIONS = [
  { value: 'Profissionais', label: 'Profissionais', color: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  { value: 'Usuários', label: 'Usuários', color: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
  { value: 'AMBOS', label: 'AMBOS', color: 'bg-violet-500', light: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300' },
];

/* ─── reusable classes ─── */
const inputClass =
  'w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-colors';

const selectClass = inputClass;

const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5';

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const btnSecondary =
  'inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors';

const btnDanger =
  'inline-flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 transition-colors';

const cardClass =
  'rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm transition-colors';

const buildDownloadUrl = (fileId) => {
  const token = api.getToken();
  if (!token) return `/api/materiais/files/${fileId}/download`;
  return `/api/materiais/files/${fileId}/download?token=${encodeURIComponent(token)}`;
};

const getPublicoAlvo = (value) => PUBLICO_ALVO_OPTIONS.find((p) => p.value === value) || PUBLICO_ALVO_OPTIONS[0];

const MateriaisEducativos = () => {
  const ITEMS_PER_PAGE = 8;
  const { notify, confirm } = useNotifications();
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const role = (user?.role || 'USER').toUpperCase();
  const canManageMaterials = ['PROFISSIONAL', 'GESTOR'].includes(role);
  const [ubsInfo, setUbsInfo] = useState(null);
  const [ubsId, setUbsId] = useState('');
  const [materials, setMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [fileInputs, setFileInputs] = useState({});
  const [createFile, setCreateFile] = useState(null);

  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    publico_alvo: '',
  });

  const [showForm, setShowForm] = useState(false);
  const [filterPublicoAlvo, setFilterPublicoAlvo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedMaterials, setExpandedMaterials] = useState({});

  const loadUbs = useCallback(async () => {
    try {
      const data = await ubsService.getSingleUbs();
      setUbsInfo(data);
      setUbsId(data ? String(data.id) : '');
    } catch (error) {
      setUbsInfo(null);
      setUbsId('');
      notify({ type: 'error', message: 'Erro ao carregar UBS.' });
    }
  }, [notify]);

  const loadMaterials = useCallback(async (ubsId) => {
    if (!ubsId) return;
    setIsLoading(true);
    try {
      const data = await api.request(`/materiais?ubs_id=${ubsId}`, { requiresAuth: true });
      setMaterials(Array.isArray(data) ? data : []);
    } catch (error) {
      setMaterials([]);
      notify({ type: 'error', message: 'Erro ao carregar materiais.' });
    } finally {
      setIsLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadUbs();
  }, [loadUbs]);

  useEffect(() => {
    loadMaterials(ubsId);
  }, [loadMaterials, ubsId]);

  const resetForm = () => {
    setForm({ titulo: '', descricao: '', categoria: '', publico_alvo: '' });
    setCreateFile(null);
    setShowForm(false);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!canManageMaterials) {
      notify({ type: 'warning', message: 'Apenas profissionais e gestores podem cadastrar materiais.' });
      return;
    }
    if (!ubsId) {
      notify({ type: 'warning', message: 'Configure uma UBS antes de cadastrar materiais.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ubs_id', ubsId);
      formData.append('titulo', form.titulo);
      formData.append('descricao', form.descricao || '');
      formData.append('categoria', form.categoria || '');
      formData.append('publico_alvo', form.publico_alvo || '');
      if (createFile) {
        if (createFile.size > MAX_FILE_SIZE_BYTES) {
          notify({ type: 'warning', message: 'Arquivo excede o limite de 20MB.' });
          setIsSubmitting(false);
          return;
        }
        formData.append('file', createFile);
      }

      const response = await fetch(`${BASE_API}/materiais`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${api.getToken() || ''}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha ao criar material');
      }

      resetForm();
      await loadMaterials(ubsId);
      notify({ type: 'success', message: 'Material criado com sucesso.' });
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao criar material.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!canManageMaterials) {
      notify({ type: 'warning', message: 'Apenas profissionais e gestores podem remover materiais.' });
      return;
    }
    const confirmed = await confirm({
      title: 'Remover material',
      message: 'Deseja remover este material e seus arquivos?',
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;

    try {
      await api.request(`/materiais/${materialId}`, { method: 'DELETE', requiresAuth: true });
      await loadMaterials(ubsId);
      notify({ type: 'success', message: 'Material removido.' });
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao remover material.' });
    }
  };

  const handleUpload = async (materialId) => {
    if (!canManageMaterials) {
      notify({ type: 'warning', message: 'Apenas profissionais e gestores podem enviar arquivos.' });
      return;
    }
    const file = fileInputs[materialId];
    if (!file) {
      notify({ type: 'warning', message: 'Selecione um arquivo.' });
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      notify({ type: 'warning', message: 'Arquivo excede o limite de 20MB.' });
      return;
    }

    setUploadingId(materialId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BASE_API}/materiais/${materialId}/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${api.getToken() || ''}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha no upload');
      }

      setFileInputs((prev) => ({ ...prev, [materialId]: null }));
      await loadMaterials(ubsId);
      notify({ type: 'success', message: 'Arquivo enviado.' });
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao enviar arquivo.' });
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!canManageMaterials) {
      notify({ type: 'warning', message: 'Apenas profissionais e gestores podem remover arquivos.' });
      return;
    }
    const confirmed = await confirm({
      title: 'Remover arquivo',
      message: 'Deseja remover este arquivo?',
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
    });
    if (!confirmed) return;

    try {
      await api.request(`/materiais/files/${fileId}`, { method: 'DELETE', requiresAuth: true });
      await loadMaterials(ubsId);
      notify({ type: 'success', message: 'Arquivo removido.' });
    } catch (error) {
      notify({ type: 'error', message: 'Erro ao remover arquivo.' });
    }
  };

  const filteredMaterials = materials.filter((material) => {
    const searchMatch = material.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
    const publicoAlvoMatch = !filterPublicoAlvo || material.publico_alvo === filterPublicoAlvo;
    return searchMatch && publicoAlvoMatch;
  });

  const totalFiltered = filteredMaterials.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE));
  const pageStart = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMaterials = filteredMaterials.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPublicoAlvo]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const toggleExpanded = (materialId) => {
    setExpandedMaterials((prev) => ({
      ...prev,
      [materialId]: !prev[materialId],
    }));
  };

  const totalMaterials = materials.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">

        {/* ═══ HEADER ═══ */}
        <section className={`${cardClass} relative overflow-hidden p-6 sm:p-8 rise-fade`}>
          <div
            className="absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-30 dark:opacity-20"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.4), transparent 65%)' }}
          />
          <div
            className="absolute -bottom-28 left-10 h-64 w-64 rounded-full opacity-30 dark:opacity-20"
            style={{ background: 'radial-gradient(circle at 30% 30%, rgba(34, 197, 94, 0.35), transparent 65%)' }}
          />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                Conteúdo educativo
              </p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Materiais Educativos
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Centralize orientações, documentos oficiais, protocolos e anexos da sua UBS.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-900 dark:bg-slate-800 px-5 py-4 text-white shadow-lg">
                <BookOpenIcon className="h-7 w-7 text-emerald-300" />
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-300">Total</p>
                  <p className="text-2xl font-bold">{totalMaterials}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ═══ SIDEBAR ═══ */}
          <aside className="lg:col-span-3 space-y-6 rise-fade stagger-1">

            {/* UBS info */}
            <div className={`${cardClass} p-5`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">UBS Ativa</h3>
              </div>
              {ubsInfo ? (
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{ubsInfo.nome_ubs}</p>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400">Nenhuma UBS configurada</p>
              )}
            </div>

            {/* Filtros */}
            <div className={`${cardClass} p-5`}>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex w-full items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-4"
              >
                <span className="flex items-center gap-2">
                  <FunnelIcon className="h-4 w-4 text-slate-400" />
                  Filtros
                </span>
                <ChevronRightIcon className={`h-4 w-4 text-slate-400 transition-transform ${showForm ? 'rotate-90' : ''}`} />
              </button>

              <div className="space-y-3">
                {/* Search */}
                <div>
                  <label className={labelClass}>Buscar</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={inputClass}
                    placeholder="Título, categoria..."
                  />
                </div>

                {/* Filter by audience */}
                <div>
                  <label className={labelClass}>Público-alvo</label>
                  <select
                    value={filterPublicoAlvo}
                    onChange={(e) => setFilterPublicoAlvo(e.target.value)}
                    className={selectClass}
                  >
                    <option value="">Todos</option>
                    {PUBLICO_ALVO_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear filters */}
                {(searchTerm || filterPublicoAlvo) && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterPublicoAlvo('');
                    }}
                    className={`${btnSecondary} w-full justify-center`}
                  >
                    <XMarkIcon className="h-4 w-4" /> Limpar filtros
                  </button>
                )}
              </div>
            </div>

            {/* Legendas */}
            <div className={`${cardClass} p-5`}>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Públicos-alvo</h3>
              <div className="space-y-2">
                {PUBLICO_ALVO_OPTIONS.map((p) => (
                  <div key={p.value} className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${p.color}`} />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{p.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ═══ MAIN CONTENT ═══ */}
          <main className="lg:col-span-9 space-y-6 rise-fade stagger-2">

            {/* Ações */}
            {canManageMaterials && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <BookOpenIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Novo Material</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Cadastre conteúdo educativo</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (showForm) { resetForm(); }
                    else { setShowForm(true); }
                  }}
                  className={`${showForm ? btnSecondary : btnPrimary} !w-auto`}
                >
                  {showForm ? (
                    <><XMarkIcon className="h-5 w-5" /> Cancelar</>
                  ) : (
                    <><PlusIcon className="h-5 w-5" /> Novo material</>
                  )}
                </button>
              </div>
            )}

            {/* ── Formulário de criação ── */}
            {showForm && canManageMaterials && (
              <div className={`${cardClass} p-6 rise-fade`}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <PlusIcon className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Criar novo material</h3>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Título *</label>
                      <input
                        type="text"
                        value={form.titulo}
                        onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
                        className={inputClass}
                        placeholder="Ex: Protocolo de Hipertensão"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Categoria</label>
                      <input
                        type="text"
                        value={form.categoria}
                        onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))}
                        className={inputClass}
                        placeholder="Ex: PNAB, e-SUS"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Público-alvo</label>
                      <select
                        value={form.publico_alvo}
                        onChange={(e) => setForm((prev) => ({ ...prev, publico_alvo: e.target.value }))}
                        className={selectClass}
                      >
                        <option value="">Selecione...</option>
                        {PUBLICO_ALVO_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Descrição</label>
                    <textarea
                      value={form.descricao}
                      onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
                      className={inputClass}
                      placeholder="Descreva o material..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Arquivo (opcional)</label>
                    <input
                      type="file"
                      onChange={(e) => {
                        const nextFile = e.target.files[0];
                        if (nextFile && nextFile.size > MAX_FILE_SIZE_BYTES) {
                          notify({ type: 'warning', message: 'Arquivo excede o limite de 20MB.' });
                          e.target.value = '';
                          setCreateFile(null);
                          return;
                        }
                        setCreateFile(nextFile || null);
                      }}
                      className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 transition-colors"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={btnPrimary}
                    >
                      {isSubmitting ? 'Salvando...' : 'Salvar material'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className={btnSecondary}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ── Lista de materiais ── */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <BookOpenIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Materiais</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {totalFiltered} de {totalMaterials} material{totalMaterials !== 1 ? 'is' : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {isLoading && (
                  <div className={`${cardClass} p-6 text-center`}>
                    <p className="text-slate-500 dark:text-slate-400">Carregando materiais...</p>
                  </div>
                )}

                {!isLoading && filteredMaterials.length === 0 && (
                  <div className={`${cardClass} p-6 text-center`}>
                    <BookOpenIcon className="h-8 w-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="text-slate-500 dark:text-slate-400">
                      {materials.length === 0 ? 'Nenhum material cadastrado' : 'Nenhum resultado para os filtros'}
                    </p>
                  </div>
                )}

                {paginatedMaterials.map((material) => {
                  const isExpanded = !!expandedMaterials[material.id];
                  return (
                  <div key={material.id} className={`${cardClass} p-6 hover:shadow-md transition-shadow`}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex-shrink-0 mt-1">
                            <BookOpenIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                              {material.titulo}
                            </h4>
                            {material.categoria && (
                              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {material.categoria}
                              </p>
                            )}
                            {material.descricao && (
                              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                {material.descricao}
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              {material.publico_alvo && (
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getPublicoAlvo(material.publico_alvo).light}`}>
                                  {getPublicoAlvo(material.publico_alvo).label}
                                </span>
                              )}
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {material.files.length} arquivo{material.files.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start">
                        <button
                          onClick={() => toggleExpanded(material.id)}
                          className={btnSecondary}
                        >
                          <ChevronDownIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                        </button>
                        {canManageMaterials && (
                          <button
                            onClick={() => handleDelete(material.id)}
                            className={btnDanger}
                          >
                            <TrashIcon className="h-4 w-4" /> Remover
                          </button>
                        )}
                      </div>

                    </div>

                    {/* ─ Arquivos ─ */}
                    {isExpanded && (
                    <div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                      {canManageMaterials && (
                        <div className="mb-4 flex flex-col sm:flex-row gap-3">
                          <input
                            type="file"
                            onChange={(e) => {
                              const nextFile = e.target.files[0];
                              if (nextFile && nextFile.size > MAX_FILE_SIZE_BYTES) {
                                notify({ type: 'warning', message: 'Arquivo excede o limite de 20MB.' });
                                e.target.value = '';
                                setFileInputs((prev) => ({ ...prev, [material.id]: null }));
                                return;
                              }
                              setFileInputs((prev) => ({ ...prev, [material.id]: nextFile }));
                            }}
                            className="flex-1 text-sm text-slate-600 dark:text-slate-400 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:bg-slate-200 dark:hover:file:bg-slate-700 transition-colors"
                          />
                          <button
                            onClick={() => handleUpload(material.id)}
                            disabled={uploadingId === material.id}
                            className={btnPrimary}
                          >
                            <DocumentArrowDownIcon className="h-4 w-4" />
                            {uploadingId === material.id ? 'Enviando...' : 'Enviar'}
                          </button>
                        </div>
                      )}

                      {material.files.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Arquivos ({material.files.length})
                          </p>
                          <ul className="space-y-1">
                            {material.files.map((file) => (
                              <li key={file.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 px-3 py-2.5">
                                <a
                                  href={buildDownloadUrl(file.id)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 flex-1 min-w-0 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                >
                                  <DocumentArrowDownIcon className="h-4 w-4 flex-shrink-0" />
                                  <span className="truncate">{file.original_filename}</span>
                                </a>
                                {canManageMaterials && (
                                  <button
                                    onClick={() => handleDeleteFile(file.id)}
                                    className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                                    title="Remover arquivo"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum arquivo anexado</p>
                      )}
                    </div>
                    )}
                  </div>
                )})}

                {!isLoading && totalFiltered > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Página {currentPage} de {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className={btnSecondary}
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className={btnSecondary}
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default MateriaisEducativos;
