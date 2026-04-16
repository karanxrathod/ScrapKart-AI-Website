import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db, logout } from '../firebase';
import { useAuth } from '../AuthContext';
import { Award, DollarSign, History, Leaf, Loader2, LogOut, Scale, Settings, User } from 'lucide-react';

interface PickupRecord {
  id: string;
  address?: string;
  scheduledTime?: string;
  status?: string;
  createdAt?: string;
  categories?: string[];
}

interface DonationRecord {
  id: string;
  category?: string;
  categories?: string[];
  details?: string;
  status?: string;
  createdAt?: string;
}

interface UserStats {
  totalScrap: string;
  totalEarnings: string;
  treesSaved: string;
  badges: string[];
}

const defaultStats: UserStats = {
  totalScrap: '0 kg',
  totalEarnings: 'Rs 0',
  treesSaved: '0 Trees Saved',
  badges: ['Eco Starter'],
};

export default function UserProfile() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pickupOrders, setPickupOrders] = useState<PickupRecord[]>([]);
  const [donationOrders, setDonationOrders] = useState<DonationRecord[]>([]);
  const [userData, setUserData] = useState({
    displayName: 'Guest User',
    email: 'Guest Session',
  });
  const [stats, setStats] = useState<UserStats>(defaultStats);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (isGuest || !user) {
        setUserData({ displayName: 'Guest User', email: 'Guest Session' });
        setPickupOrders([]);
        setDonationOrders([]);
        setStats(defaultStats);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const pickupQuery = query(collection(db, 'pickups'), where('userId', '==', user.uid));
        const donationQuery = query(collection(db, 'donations'), where('userId', '==', user.uid));

        const [userSnapshot, pickupSnapshot, donationSnapshot] = await Promise.all([
          getDoc(userDocRef),
          getDocs(pickupQuery),
          getDocs(donationQuery),
        ]);

        const nextPickups = pickupSnapshot.docs
          .map((entry) => ({ id: entry.id, ...entry.data() }) as PickupRecord)
          .sort((a, b) => new Date(b.createdAt || b.scheduledTime || 0).getTime() - new Date(a.createdAt || a.scheduledTime || 0).getTime());

        const nextDonations = donationSnapshot.docs
          .map((entry) => ({ id: entry.id, ...entry.data() }) as DonationRecord)
          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        setPickupOrders(nextPickups);
        setDonationOrders(nextDonations);

        if (userSnapshot.exists()) {
          const dbData = userSnapshot.data();
          setUserData({
            displayName: dbData.displayName || user.displayName || 'ScrapKart User',
            email: dbData.email || user.email || 'No email found',
          });
        } else {
          setUserData({
            displayName: user.displayName || 'ScrapKart User',
            email: user.email || 'No email found',
          });
        }

        const activePickups = nextPickups.filter((item) => ['Scheduled', 'Confirmed', 'Completed'].includes(item.status || '')).length;
        const completedDonations = nextDonations.filter((item) => ['Pending', 'Completed'].includes(item.status || '')).length;
        const totalScrapKg = activePickups * 25 + completedDonations * 10;
        const totalEarningsValue = nextPickups.filter((item) => item.status === 'Completed').length * 180 + nextDonations.filter((item) => item.status === 'Completed').length * 60;
        const treesSaved = Math.floor(totalScrapKg / 40);
        const badges = ['Eco Starter'];

        if (activePickups + completedDonations >= 3) {
          badges.push('Recycling Hero');
        }
        if (activePickups + completedDonations >= 6) {
          badges.push('Green Earth');
        }

        setStats({
          totalScrap: `${totalScrapKg} kg`,
          totalEarnings: `Rs ${totalEarningsValue}`,
          treesSaved: `${treesSaved} Trees Saved`,
          badges,
        });
      } catch (error) {
        console.error('Error fetching user dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, isGuest]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[var(--color-mint)] mb-4" />
        <p className="text-lg font-medium animate-pulse opacity-70">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-8 rounded-[30px] flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-24 h-24 rounded-full neu-pressed flex items-center justify-center border-4 border-white/20 overflow-hidden shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-[var(--color-mint)] opacity-80" />
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-navy)] mb-1">{userData.displayName}</h1>
            <p className="text-sm font-medium opacity-70">{userData.email}</p>
            {isGuest && (
              <span className="inline-block mt-2 px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold uppercase rounded-full tracking-wider">
                Guest Account
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="neu-flat p-6 rounded-[30px] flex flex-col items-center text-center gap-3">
          <div className="p-4 rounded-full neu-convex text-[var(--color-mint)]">
            <Scale size={28} />
          </div>
          <p className="text-sm font-semibold opacity-70 uppercase tracking-wider">Total Scrap Recycled</p>
          <p className="text-3xl font-bold text-[var(--color-navy)]">{stats.totalScrap}</p>
        </div>

        <div className="neu-flat p-6 rounded-[30px] flex flex-col items-center text-center gap-3">
          <div className="p-4 rounded-full neu-convex text-[var(--color-mint)]">
            <DollarSign size={28} />
          </div>
          <p className="text-sm font-semibold opacity-70 uppercase tracking-wider">Total Earnings</p>
          <p className="text-3xl font-bold text-[var(--color-navy)]">{stats.totalEarnings}</p>
        </div>

        <div className="neu-flat p-6 rounded-[30px] flex flex-col items-center text-center gap-3">
          <div className="p-4 rounded-full neu-convex text-[var(--color-mint)]">
            <Leaf size={28} />
          </div>
          <p className="text-sm font-semibold opacity-70 uppercase tracking-wider">Environmental Impact</p>
          <p className="text-3xl font-bold text-[var(--color-navy)]">{stats.treesSaved}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-8 rounded-[30px]"
      >
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Award className="text-[var(--color-mint)]" />
          Recycling Hero Badges
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          {stats.badges.map((badge) => (
            <div key={badge} className="neu-convex px-6 py-3 rounded-full flex items-center gap-2 font-semibold text-sm">
              <Award size={16} className="text-[var(--color-mint)]" />
              {badge}
            </div>
          ))}
        </div>
      </motion.div>

      {(pickupOrders.length > 0 || donationOrders.length > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-panel p-8 rounded-[30px]"
        >
          <h3 className="text-xl font-bold mb-6">Account Activity</h3>

          {pickupOrders.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold mb-4 text-[var(--color-mint)]">Pickup Requests</h4>
              <div className="space-y-3">
                {pickupOrders.map((order) => (
                  <div key={order.id} className="neu-pressed p-4 rounded-[15px]">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <div>
                        <p className="font-semibold">{order.categories?.join(', ') || 'Scheduled Pickup'}</p>
                        <p className="text-sm opacity-70">{order.scheduledTime ? new Date(order.scheduledTime).toLocaleString() : 'No time available'}</p>
                      </div>
                      <span className="px-3 py-1 bg-[var(--color-mint)]/20 text-[var(--color-mint)] text-xs font-bold rounded-full">
                        {order.status || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm opacity-80">{order.address || 'No address provided'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {donationOrders.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-4 text-[var(--color-mint)]">Donations</h4>
              <div className="space-y-3">
                {donationOrders.map((order) => (
                  <div key={order.id} className="neu-pressed p-4 rounded-[15px]">
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <div>
                        <p className="font-semibold">{order.categories?.join(', ') || order.category || 'Donation'}</p>
                        <p className="text-sm opacity-70">{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'No date available'}</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-400/20 text-yellow-700 text-xs font-bold rounded-full">
                        {order.status || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-sm opacity-80">{order.details || 'No details provided'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <button className="w-full neu-flat p-6 rounded-[20px] flex items-center justify-between hover:neu-pressed transition-all group">
          <div className="flex items-center gap-4 font-semibold text-lg">
            <div className="p-3 rounded-full neu-convex group-hover:text-[var(--color-mint)] transition-colors">
              <Settings size={20} />
            </div>
            Account Settings
          </div>
        </button>

        <button
          onClick={() => navigate('/history')}
          className="w-full neu-flat p-6 rounded-[20px] flex items-center justify-between hover:neu-pressed transition-all group"
        >
          <div className="flex items-center gap-4 font-semibold text-lg">
            <div className="p-3 rounded-full neu-convex group-hover:text-[var(--color-mint)] transition-colors">
              <History size={20} />
            </div>
            Donation History
          </div>
        </button>

        <button
          onClick={handleLogout}
          className="w-full neu-flat p-6 rounded-[20px] flex items-center justify-between hover:neu-pressed transition-all group text-red-500"
        >
          <div className="flex items-center gap-4 font-semibold text-lg">
            <div className="p-3 rounded-full neu-convex group-hover:bg-red-50 transition-colors">
              <LogOut size={20} />
            </div>
            Logout
          </div>
        </button>
      </motion.div>
    </div>
  );
}
