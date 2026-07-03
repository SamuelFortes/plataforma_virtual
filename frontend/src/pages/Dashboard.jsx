import React from 'react';
import CardGrid from '../components/CardGrid';

const Dashboard = () => {
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  return (
    <div className="page-shell">
      <div className="page-panel mb-6 rise-fade">
        <div className="page-panel-header">
          <h1 className="page-title">Olá, {user?.nome?.split(' ')[0] || 'bem-vindo'}!</h1>
          <p className="page-subtitle">
            {user?.cargo
              ? `${user.cargo} · MeuTerritório`
              : 'Selecione uma das opções abaixo para começar.'}
          </p>
        </div>
      </div>

      <CardGrid />
    </div>
  );
};

export default Dashboard;
