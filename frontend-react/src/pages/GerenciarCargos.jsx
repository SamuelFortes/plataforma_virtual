import { useState, useEffect } from 'react';
import { useNotifications } from '../components/ui/Notifications';
import { cargosService } from '../services/cargosService';
import {
  BriefcaseIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

const GerenciarCargos = () => {
  const { notify, confirm } = useNotifications();
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [novoCargo, setNovoCargo] = useState('');
  const [criando, setCriando] = useState(false);

  const carregarCargos = async () => {
    try {
      setLoading(true);
      const data = await cargosService.listar();
      setCargos(Array.isArray(data) ? data : []);
    } catch (err) {
      notify({ type: 'error', message: 'Erro ao carregar cargos.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarCargos();
  }, []);

  const handleCriar = async (e) => {
    e.preventDefault();
    const nome = novoCargo.trim();
    if (!nome) {
      notify({ type: 'error', message: 'Informe o nome do cargo.' });
      return;
    }
    if (cargos.some((c) => c.nome.toLowerCase() === nome.toLowerCase())) {
      notify({ type: 'error', message: 'Este cargo já existe.' });
      return;
    }
    try {
      setCriando(true);
      const novo = await cargosService.criar(nome);
      setCargos((prev) => [...prev, novo].sort((a, b) => a.nome.localeCompare(b.nome)));
      setNovoCargo('');
      notify({ type: 'success', message: 'Cargo criado com sucesso.' });
    } catch (err) {
      notify({ type: 'error', message: err.message || 'Erro ao criar cargo.' });
    } finally {
      setCriando(false);
    }
  };

  const handleRemover = async (cargo) => {
    const ok = await confirm({
      title: 'Remover cargo',
      message: `Deseja remover o cargo "${cargo.nome}"? Isso só é possível se nenhum usuário estiver utilizando este cargo.`,
      confirmLabel: 'Remover',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;
    try {
      await cargosService.remover(cargo.id);
      setCargos((prev) => prev.filter((c) => c.id !== cargo.id));
      notify({ type: 'success', message: 'Cargo removido.' });
    } catch (err) {
      notify({ type: 'error', message: err.message || 'Erro ao remover cargo.' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 rise-fade">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Gerenciar Cargos
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
          Adicione ou remova os cargos disponíveis para profissionais de saúde.
        </p>
      </div>

      {/* Formulário de criação */}
      <form onSubmit={handleCriar} className="mb-6 rise-fade stagger-1">
        <div className="flex gap-3">
          <input
            type="text"
            value={novoCargo}
            onChange={(e) => setNovoCargo(e.target.value)}
            placeholder="Nome do novo cargo"
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={criando}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <PlusIcon className="h-4 w-4" />
            {criando ? 'Criando...' : 'Adicionar'}
          </button>
        </div>
      </form>

      {/* Lista de cargos */}
      <div className="bg-white dark:bg-slate-900 shadow-md rounded-lg overflow-hidden rise-fade stagger-2">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center gap-2">
          <BriefcaseIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">
            {cargos.length} cargo(s) cadastrado(s)
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">Carregando...</p>
          </div>
        ) : cargos.length === 0 ? (
          <div className="p-12 text-center">
            <BriefcaseIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-slate-600" />
            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">Nenhum cargo cadastrado.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-slate-700">
            {cargos.map((cargo) => (
              <li
                key={cargo.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {cargo.nome}
                </span>
                <button
                  onClick={() => handleRemover(cargo)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default GerenciarCargos;
