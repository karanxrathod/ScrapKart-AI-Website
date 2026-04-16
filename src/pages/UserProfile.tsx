import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, logout } from '../firebase';
import { useAuth } from '../AuthContext';
import { 
  User, Edit2, Award, Settings, History, LogOut, 
  Leaf, DollarSign, Scale, Loader2 
} from 'lucide-react';

export default function UserProfile() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  
  // State for loading, user data, and edit mode
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [pickupOrders, setPickupOrders] = useState<any[]>([]);
  const [donationOrders, setDonationOrders] = useState<any[]>([]);
  
  // Mock data fallback used while fetching or if data is missing
  const [userData, setUserData] = useState({
    displayName: 'Karan Rathod',
    email: 'karan@example.com',
    totalScrap: '125 kg',
    totalEarnings: '₹2,350',
    treesSaved: '3 Trees Saved',
    badges: ['Eco Starter', 'Recycling Hero', 'Green Earth']
  });

  // Fetch current logged-in user's data from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      // Load order history from localStorage
      const pickupHistory = localStorage.getItem('pickupOrderHistory');
      const donationHistory = localStorage.getItem('donationOrderHistory');
      
      if (pickupHistory) {
        try {
          setPickupOrders(JSON.parse(pickupHistory));
        } catch (e) {
          console.error("Error parsing pickup history:", e);
        }
      }
      
      if (donationHistory) {
        try {
          setDonationOrders(JSON.parse(donationHistory));
        } catch (e) {
          console.error("Error parsing donation history:", e);
        }
      }

      // If user is a guest, we just use the mock data and stop loading
      if (isGuest || !user) {
        setLoading(false);
        return;
      }

      try {
        // 1. Create a reference to the specific user's document in the 'users' collection
        const userDocRef = doc(db, 'users', user.uid);
        
        // 2. Fetch the document snapshot from Firestore
        const userSnapshot = await getDoc(userDocRef);
        
        // 3. If the document exists, update our local state with the real data
        if (userSnapshot.exists()) {
          const dbData = userSnapshot.data();
          setUserData(prev => ({
            ...prev,
            displayName: dbData.displayName || user.displayName || prev.displayName,
            email: dbData.email || user.email || prev.email,
            // Note: In a production app, totalScrap, totalEarnings, etc. 
            // would be aggregated from the 'donations' and 'pickups' collections.
          }));
        }
      } catch (error) {
        console.error("Error fetching user profile from Firestore:", error);
      } finally {
        // 4. Ensure loading state is cleared regardless of success or failure
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, isGuest]);

  // Handle Logout Logic
  const handleLogout = async () => {
    try {
      // Calls the signOut() function from our firebase.ts utility
      await logout();
      // Redirect the user back to the login screen
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[var(--color-mint)] mb-4" />
        <p className="text-lg font-medium animate-pulse opacity-70">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* 1. Profile Header (Glassmorphic Card) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-8 rounded-[30px] flex flex-col sm:flex-row items-center justify-between gap-6 relative"
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          {/* Circular avatar with inset neumorphic shadow */}
          <div className="w-24 h-24 rounded-full neu-pressed flex items-center justify-center border-4 border-white/20 overflow-hidden shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-[var(--color-mint)] opacity-80" />
            )}
          </div>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-navy)] mb-1">
              {userData.displayName}
            </h1>
            <p className="text-sm font-medium opacity-70">
              {userData.email}
            </p>
            {isGuest && (
              <span className="inline-block mt-2 px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold uppercase rounded-full tracking-wider">
                Guest Account
              </span>
            )}
          </div>
        </div>

        {/* Edit Profile Button aligned to the right */}
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="neu-convex px-6 py-3 rounded-full flex items-center justify-center gap-2 font-semibold hover:neu-pressed transition-all text-[var(--color-navy)] w-full sm:w-auto"
        >
          <Edit2 size={16} />
          {isEditing ? 'Save Profile' : 'Edit Profile'}
        </button>
      </motion.div>

      {/* 2. Impact Stats (CSS Grid) */}
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
          <p className="text-3xl font-bold text-[var(--color-navy)]">{userData.totalScrap}</p>
        </div>

        <div className="neu-flat p-6 rounded-[30px] flex flex-col items-center text-center gap-3">
          <div className="p-4 rounded-full neu-convex text-[var(--color-mint)]">
            <DollarSign size={28} />
          </div>
          <p className="text-sm font-semibold opacity-70 uppercase tracking-wider">Total Earnings</p>
          <p className="text-3xl font-bold text-[var(--color-navy)]">{userData.totalEarnings}</p>
        </div>

        <div className="neu-flat p-6 rounded-[30px] flex flex-col items-center text-center gap-3">
          <div className="p-4 rounded-full neu-convex text-[var(--color-mint)]">
            <Leaf size={28} />
          </div>
          <p className="text-sm font-semibold opacity-70 uppercase tracking-wider">Environmental Impact</p>
          <p className="text-3xl font-bold text-[var(--color-navy)]">{userData.treesSaved}</p>
        </div>
      </motion.div>

      {/* 3. Badges & Gamification */}
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
          {userData.badges.map((badge, index) => (
            <div 
              key={index} 
              className="neu-convex px-6 py-3 rounded-full flex items-center gap-2 font-semibold text-sm"
            >
              <Award size={16} className="text-[var(--color-mint)]" />
              {badge}
            </div>
          ))}
        </div>
      </motion.div>

      {/* 4. Session Order History */}
      {(pickupOrders.length > 0 || donationOrders.length > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-panel p-8 rounded-[30px]"
        >
          <h3 className="text-xl font-bold mb-6">Session Order History</h3>
          
          {/* Pickup Orders */}
          {pickupOrders.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold mb-4 text-[var(--color-mint)]">Pickup Requests</h4>
              <div className="space-y-3">
                {pickupOrders.map(order => (
                  <div key={order.id} className="neu-pressed p-4 rounded-[15px]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{order.categories.join(', ')}</p>
                        <p className="text-sm opacity-70">{order.date} at {order.time}</p>
                      </div>
                      <span className="px-3 py-1 bg-[var(--color-mint)]/20 text-[var(--color-mint)] text-xs font-bold rounded-full">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm opacity-80">{order.address}</p>
                    {order.collectorName && (
                      <p className="text-xs mt-2 text-[var(--color-mint)]">
                        Collector: {order.collectorName}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Donation Orders */}
          {donationOrders.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-4 text-[var(--color-mint)]">Donations</h4>
              <div className="space-y-3">
                {donationOrders.map(order => (
                  <div key={order.id} className="neu-pressed p-4 rounded-[15px]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{order.categories.join(', ')}</p>
                        <p className="text-sm opacity-70">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-400/20 text-yellow-700 text-xs font-bold rounded-full">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm opacity-80">{order.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 5. Settings & Actions */}
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
