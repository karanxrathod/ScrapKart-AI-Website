import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Package, Monitor, Book, Shirt, HeartHandshake, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';

const rates = [
  { id: 1, material: 'Paper & Cardboard', rate: '$0.15/kg', trend: 'up', icon: Book },
  { id: 2, material: 'Plastic (PET/HDPE)', rate: '$0.25/kg', trend: 'down', icon: Package },
  { id: 3, material: 'Metal (Aluminum)', rate: '$1.20/kg', trend: 'up', icon: Package },
  { id: 4, material: 'E-Waste', rate: '$2.50/kg', trend: 'up', icon: Monitor },
  { id: 5, material: 'Textiles', rate: '$0.10/kg', trend: 'down', icon: Shirt },
];

export default function Dashboard() {
  const { user, isGuest } = useAuth();

  return (
    <div className="space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 rounded-[30px]"
      >
        <h2 className="text-3xl font-bold mb-2">
          Welcome back, {user ? user.displayName?.split(' ')[0] || 'User' : 'Guest'}!
        </h2>
        <p className="opacity-70">Ready to make a difference today?</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link to="/scan" className="neu-convex p-6 rounded-[30px] flex flex-col items-center justify-center gap-4 hover:neu-pressed transition-all group">
          <div className="p-4 rounded-full neu-flat group-hover:text-[var(--color-mint)] transition-colors">
            <Package size={32} />
          </div>
          <span className="font-semibold text-lg">AI Scan</span>
        </Link>
        <Link to="/donate" className="neu-convex p-6 rounded-[30px] flex flex-col items-center justify-center gap-4 hover:neu-pressed transition-all group">
          <div className="p-4 rounded-full neu-flat group-hover:text-[var(--color-mint)] transition-colors">
            <HeartHandshake size={32} />
          </div>
          <span className="font-semibold text-lg">Donate</span>
        </Link>
        <Link to="/book" className="neu-convex p-6 rounded-[30px] flex flex-col items-center justify-center gap-4 hover:neu-pressed transition-all group">
          <div className="p-4 rounded-full neu-flat group-hover:text-[var(--color-mint)] transition-colors">
            <MapPin size={32} />
          </div>
          <span className="font-semibold text-lg">Book Pickup</span>
        </Link>
        <Link to="/schedule-pickup" className="neu-convex p-6 rounded-[30px] flex flex-col items-center justify-center gap-4 hover:neu-pressed transition-all group bg-gradient-to-br from-[var(--color-mint)]/10 to-transparent border border-[var(--color-mint)]/20">
          <div className="p-4 rounded-full neu-flat group-hover:text-[var(--color-mint)] transition-colors">
            <Clock size={32} className="text-[var(--color-mint)]" />
          </div>
          <span className="font-semibold text-lg text-[var(--color-mint)]">Schedule Scrap</span>
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-8 rounded-[30px]"
      >
        <h3 className="text-xl font-bold mb-6">Live Scrap Rates</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rates.map((rate) => {
            const Icon = rate.icon;
            return (
              <div key={rate.id} className="neu-flat p-4 rounded-[20px] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full neu-convex">
                    <Icon size={20} className="opacity-70" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{rate.material}</p>
                    <p className="font-bold text-lg text-[var(--color-mint)]">{rate.rate}</p>
                  </div>
                </div>
                <div>
                  {rate.trend === 'up' ? (
                    <TrendingUp size={24} className="text-[var(--color-mint)]" />
                  ) : (
                    <TrendingDown size={24} className="text-red-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
