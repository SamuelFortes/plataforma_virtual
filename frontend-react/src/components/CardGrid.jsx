import React from 'react';
import Card from './Card';
import {
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  CalendarIcon,
  LifebuoyIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

const CardGrid = () => {
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;
  const role = (user?.role || 'USER').toUpperCase();
  const cargo = user?.cargo || null;

  const allCards = [
    {
      title: 'Gerenciar Relatórios Situacionais',
      to: '/relatorios-situacionais',
      icon: DocumentTextIcon,
      inDevelopment: false,
      allowed: ['USER', 'PROFISSIONAL', 'GESTOR']
    },
    {
      title: 'Marcação de Consultas',
      to: '/agendamento',
      icon: CalendarDaysIcon,
      inDevelopment: false,
      allowed: ['USER', 'PROFISSIONAL', 'GESTOR']
    },
    {
      title: 'Suporte e Feedback',
      to: '/suporte-feedback',
      icon: LifebuoyIcon,
      inDevelopment: false,
      allowed: ['USER', 'PROFISSIONAL', 'GESTOR']
    },
    {
      title: 'Mapa de problemas e intervenções',
      to: '/mapa-problemas-intervencoes',
      icon: ChartBarIcon,
      inDevelopment: false,
      allowed: ['USER', 'PROFISSIONAL', 'GESTOR']
    },
    {
      title: 'Gestão de Equipes e Microáreas',
      to: '/gestao-equipes',
      icon: UserGroupIcon,
      inDevelopment: false,
      allowed: ['GESTOR'],
      allowedCargos: ['Recepcionista']
    },
  ];

  if (['PROFISSIONAL', 'GESTOR'].includes(role)) {
    allCards.push(
      {
        title: 'Materiais Educativos',
        to: '/materiais-educativos',
        icon: BookOpenIcon,
        inDevelopment: false,
        allowed: ['PROFISSIONAL', 'GESTOR']
      },
      {
        title: 'Cronograma e Calendário',
        to: '/cronograma',
        icon: CalendarIcon,
        inDevelopment: false,
        allowed: ['PROFISSIONAL', 'GESTOR']
      }
    );
  }

  const filteredCards = allCards.filter(card => {
    const roleOk = card.allowed.includes(role);
    const cargoOk = card.allowedCargos && card.allowedCargos.includes(cargo);
    return roleOk || cargoOk;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {filteredCards.map((card, index) => {
        const staggerClass = `stagger-${(index % 6) + 1}`;
        return (
          <Card key={index} {...card} className={`rise-fade ${staggerClass}`} />
        );
      })}
    </div>
  );
};

export default CardGrid;