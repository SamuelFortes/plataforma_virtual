import { Link, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

/**
 * Barra de "Voltar" exibida no topo das telas internas.
 *
 * Fica num único lugar (renderizada no App, logo abaixo da NavBar) em vez de
 * repetida em cada página: assim nenhuma tela nova nasce sem o botão.
 *
 * O destino é o pai real de cada tela, não o histórico do navegador. Voltar por
 * histórico levaria a resultados imprevisíveis — uma tela recarregada mandaria o
 * usuário para fora do sistema, e um caminho longo faria o botão parecer não
 * funcionar. Um destino fixo sempre leva ao mesmo lugar.
 */
const PARENTS = {
  // Módulos abertos pelo menu do dashboard
  '/agendamento': { to: '/dashboard', label: 'Voltar ao menu' },
  '/relatorios-situacionais': { to: '/dashboard', label: 'Voltar ao menu' },
  '/materiais-educativos': { to: '/dashboard', label: 'Voltar ao menu' },
  '/cronograma': { to: '/dashboard', label: 'Voltar ao menu' },
  '/suporte-feedback': { to: '/dashboard', label: 'Voltar ao menu' },
  '/admin': { to: '/dashboard', label: 'Voltar ao menu' },
  '/setup-ubs': { to: '/dashboard', label: 'Voltar ao menu' },

  // Telas abertas de dentro de Relatórios Situacionais
  '/mapa-problemas-intervencoes': {
    to: '/relatorios-situacionais',
    label: 'Voltar para Relatórios',
  },
  '/gestao-equipes': {
    to: '/relatorios-situacionais',
    label: 'Voltar para Relatórios',
  },

  // Telas abertas pelo menu do usuário na barra superior
  '/notificacoes': { to: '/dashboard', label: 'Voltar ao menu' },
  '/gerenciar-mensagens': { to: '/dashboard', label: 'Voltar ao menu' },
  '/configuracoes': { to: '/dashboard', label: 'Voltar ao menu' },
  '/solicitacoes': { to: '/dashboard', label: 'Voltar ao menu' },
  '/gerenciar-cargos': { to: '/dashboard', label: 'Voltar ao menu' },
  '/gerenciar-ubs': { to: '/dashboard', label: 'Voltar ao menu' },
  '/redefinir-senha': { to: '/dashboard', label: 'Voltar ao menu' },
};

const BackBar = () => {
  const { pathname } = useLocation();

  // Remove barra final para /cronograma/ casar com /cronograma.
  const chave = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const destino = PARENTS[chave];

  // O dashboard é o próprio menu, e as telas de login não têm para onde voltar.
  if (!destino) return null;

  return (
    <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Link
          to={destino.to}
          aria-label={destino.label}
          /* min-h-[44px] mantém a área de toque no mínimo recomendado para uso
             com o dedo, que é a razão de existir deste botão. */
          className="group -ml-2 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ArrowLeftIcon className="h-5 w-5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
          {destino.label}
        </Link>
      </div>
    </div>
  );
};

export default BackBar;
