import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { logout } from '../firebase';
import { Home, ScanLine, HeartHandshake, MapPin, LogOut, User, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import Chatbot from './Chatbot';

export default function Layout() {
  const { user, isGuest } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/scan', icon: ScanLine, label: 'AI Scan' },
    { path: '/donate', icon: HeartHandshake, label: 'Donate' },
    { path: '/book', icon: MapPin, label: 'Book Pickup' },
    { path: '/schedule-pickup', icon: Clock, label: 'Schedule Scrap' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex">
      <div className="ambient-blob blob-1"></div>
      <div className="ambient-blob blob-2"></div>
      
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-screen w-64 glass-panel z-50 flex flex-col border-r border-gray-200/30">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200/30">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="neu-convex p-2 rounded-full text-[var(--color-mint)]">
              <ScanLine size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-navy)] to-[var(--color-mint)]">
              ScrapKart AI
            </h1>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-lg transition-all",
                  isActive 
                    ? "neu-pressed text-[var(--color-mint)] font-semibold" 
                    : "text-[var(--color-navy)] opacity-70 hover:opacity-100 hover:neu-flat"
                )}
              >
                <Icon size={22} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200/30 space-y-3">
          <Link 
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-lg neu-flat hover:neu-pressed transition-all"
          >
            <User size={20} className="text-[var(--color-navy)] opacity-70" />
            <span className="text-sm font-medium text-[var(--color-navy)] opacity-80 truncate">
              {user ? user.displayName?.split(' ')[0] || user.email : 'Guest User'}
            </span>
          </Link>
          <button 
            onClick={() => logout()} 
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg neu-flat hover:neu-pressed transition-all text-red-500 font-medium"
          >
            <LogOut size={20} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Header */}
        <header className="glass-panel sticky top-0 z-40 px-6 py-4 flex justify-between items-center rounded-b-[20px] mx-2 mt-2 mr-2">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-[var(--color-navy)]">
              {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="text-sm text-[var(--color-navy)] opacity-70">
            Welcome back!
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      <Chatbot />
    </div>
  );
}
