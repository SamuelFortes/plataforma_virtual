import React from 'react';
import CardGrid from '../components/CardGrid';

const Dashboard = () => {
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  return (
    <div className="page-shell">
      <div className="page-panel mb-6 rise-fade">
        <div className="page-panel-header">
          <h1 className="page-title">Bem-vindo à Plataforma UBS</h1>
          <p className="page-subtitle">
            Você está autenticado como <strong className="capitalize text-gray-900 dark:text-white">{user?.cargo || user?.role?.toLowerCase() || 'Usuário'}</strong>.
          </p>
        </div>
      </div>

      <CardGrid />
    </div>
  );
};

export default Dashboard;
