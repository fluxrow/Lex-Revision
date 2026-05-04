"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '../ui/Icon';

const NAV_PRIMARY = [
  { id: '/dashboard',  label: 'Início',         icon: 'home' },
  { id: '/novo',       label: 'Novo contrato',  icon: 'plus' },
  { id: '/historico',  label: 'Histórico',      icon: 'history', badge: '24' },
  { id: '/modelos',    label: 'Modelos',        icon: 'folder' },
  { id: '/clientes',   label: 'Clientes',       icon: 'users' },
  { id: '/assinaturas', label: 'Assinaturas',    icon: 'pen', badge: '3' },
];
const NAV_SECONDARY = [
  { id: '/faturamento', label: 'Faturamento', icon: 'card' },
  { id: '/config',      label: 'Configurações', icon: 'settings' },
];
const MOBILE_NAV = [
  { id: '/dashboard', label: 'Início',   icon: 'home' },
  { id: '/novo',      label: 'Novo',     icon: 'plus' },
  { id: '/historico', label: 'Histórico',icon: 'history' },
  { id: '/clientes',  label: 'Clientes', icon: 'users' },
  { id: '/config',    label: 'Mais',     icon: 'more' },
];

export function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">L</div>
        <div className="sidebar-logo-text">
          Lex<span className="legal"> Revision</span>
        </div>
      </div>

      <div className="sidebar-section">Menu</div>
      {NAV_PRIMARY.map(item => (
        <Link key={item.id} href={item.id} className={`nav-item ${pathname?.startsWith(item.id) ? 'active' : ''}`} style={{textDecoration: 'none'}}>
          <span className="nav-icon"><Icon name={item.icon} size={17}/></span>
          {item.label}
          {item.badge && <span className="nav-badge">{item.badge}</span>}
        </Link>
      ))}

      <div className="sidebar-section">Conta</div>
      {NAV_SECONDARY.map(item => (
        <Link key={item.id} href={item.id} className={`nav-item ${pathname?.startsWith(item.id) ? 'active' : ''}`} style={{textDecoration: 'none'}}>
          <span className="nav-icon"><Icon name={item.icon} size={17}/></span>
          {item.label}
        </Link>
      ))}

      <div className="sidebar-footer">
        <Link href="/config" className="user-card" style={{textDecoration: 'none'}}>
          <div className="avatar">MR</div>
          <div className="user-info">
            <div className="user-name">Marina Rocha</div>
            <div className="user-email">marina@silvaadv.com</div>
          </div>
          <Icon name="chevron-right" size={14} style={{color:'var(--text-dim)'}}/>
        </Link>
      </div>
    </aside>
  );
}

export function Topbar({ title, sub, actions }: { title: string, sub?: string, actions?: React.ReactNode }) {
  const [theme, setTheme] = useState('dark');
  
  useEffect(() => {
    try { 
      const t = localStorage.getItem('lex-revision-theme') || 'dark';
      setTheme(t);
      document.documentElement.setAttribute('data-theme', t);
    } catch {}
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try { localStorage.setItem('lex-revision-theme', nextTheme); } catch {}
  };

  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {sub && <div className="muted" style={{fontSize:12, marginTop:2}}>{sub}</div>}
      </div>
      <div className="search-box">
        <Icon name="search" size={15}/>
        <input placeholder="Buscar contratos, clientes, modelos..."/>
        <span className="kbd">⌘K</span>
      </div>
      <div className="topbar-actions">
        {actions}
        <button className="btn btn-ghost btn-icon" title="Alternar tema" onClick={toggleTheme}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={17}/>
        </button>
        <button className="btn btn-ghost btn-icon" title="Notificações">
          <Icon name="bell" size={17}/>
        </button>
      </div>
    </div>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="mobile-nav">
      {MOBILE_NAV.map(item => (
        <Link key={item.id} href={item.id} className={`mn-item ${pathname?.startsWith(item.id) ? 'active' : ''}`} style={{textDecoration: 'none'}}>
          <Icon name={item.icon} size={20}/>
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
