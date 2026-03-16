import React, { useState, useEffect } from 'react';
import { agendamentoService } from '../services/agendamentoService';
import AppointmentList from '../components/agendamento/AppointmentList';
import BookingForm from '../components/agendamento/BookingForm';
import CalendarView from '../components/agendamento/CalendarView';
import { useNotifications } from '../components/ui/Notifications';

const Agendamento = () => {
  const { notify, confirm } = useNotifications();
  const [activeTab, setActiveTab] = useState('meus'); // meus, novo, agenda_geral
  const [meusAgendamentos, setMeusAgendamentos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal para Reagendamento
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState(null);

  // Recupera usuário do localStorage (mockado ou real)
  const userJson = localStorage.getItem('user');
  let user = null;
  try {
    user = userJson ? JSON.parse(userJson) : null;
  } catch {
    user = null;
  }

  const isStaff = ['PROFISSIONAL', 'GESTOR'].includes(user?.role);

  useEffect(() => {
    if (activeTab === 'meus') {
      loadMeusAgendamentos();
    }
  }, [activeTab]);

  const loadMeusAgendamentos = async () => {
    setLoading(true);
    try {
      const data = await agendamentoService.getMeusAgendamentos();
      setMeusAgendamentos(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    const confirmed = await confirm({
      title: 'Cancelar agendamento',
      message: 'Tem certeza de que deseja cancelar?',
      confirmLabel: 'Cancelar',
      cancelLabel: 'Voltar',
    });
    if (!confirmed) return;
    try {
      await agendamentoService.atualizarAgendamento(id, { status: 'CANCELADO' });
      loadMeusAgendamentos();
    } catch (err) {
      notify({ type: 'error', message: `Erro ao cancelar: ${err.message}` });
    }
  };

  const handleRescheduleClick = (apt) => {
    setSelectedApt(apt);
    setIsRescheduleModalOpen(true);
  };

  return (
    <div className="page-shell">
      {/* Modal de Reagendamento */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
          <div className="relative w-full max-w-lg">
            <BookingForm
              initialData={selectedApt}
              title="Reagendar Consulta"
              submitLabel="Confirmar Reagendamento"
              onSuccess={() => {
                setIsRescheduleModalOpen(false);
                loadMeusAgendamentos();
              }}
              onCancel={() => setIsRescheduleModalOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="page-panel mb-6 rise-fade">
        <div className="page-panel-header">
          <h1 className="page-title">Agendamento de Consultas</h1>
          <p className="page-subtitle">Gerencie atendimentos, reagendamentos e agenda da equipe em um só fluxo.</p>
          <nav className="-mb-px mt-4 flex flex-wrap gap-5" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('meus')}
            className={`${
              activeTab === 'meus'
                ? 'tab-btn tab-btn-active'
                : 'tab-btn tab-btn-idle'
            }`}
          >
            Meus Agendamentos
          </button>

          <button
            onClick={() => setActiveTab('novo')}
            className={`${
              activeTab === 'novo'
                ? 'tab-btn tab-btn-active'
                : 'tab-btn tab-btn-idle'
            }`}
          >
            Agendar Consulta
          </button>

          {isStaff && (
            <button
              onClick={() => setActiveTab('agenda_geral')}
              className={`${
                activeTab === 'agenda_geral'
                  ? 'tab-btn tab-btn-active'
                  : 'tab-btn tab-btn-idle'
              }`}
            >
              Visualizar Agenda (Equipe)
            </button>
          )}
          </nav>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'meus' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Seu Histórico de Consultas</h2>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <AppointmentList
                appointments={meusAgendamentos}
                onCancel={handleCancel}
                onReschedule={handleRescheduleClick}
              />
            )}
          </div>
        )}

        {activeTab === 'novo' && (
          <div className="max-w-2xl mx-auto animate-fade-in">
             <BookingForm
                onSuccess={() => setActiveTab('meus')}
                onCancel={() => setActiveTab('meus')}
             />
          </div>
        )}

        {activeTab === 'agenda_geral' && isStaff && (
          <div className="animate-fade-in">
            <CalendarView user={user} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Agendamento;
