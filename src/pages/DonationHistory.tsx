import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { 
  History, Shirt, Book, Monitor, Sofa, Package, 
  Clock, CheckCircle, Loader2, ArrowLeft 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DonationRecord {
  id: string;
  category: string;
  details: string;
  status: string;
  createdAt: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Clothes': return Shirt;
    case 'Books': return Book;
    case 'E-Waste': return Monitor;
    case 'Furniture': return Sofa;
    default: return Package;
  }
};

export default function DonationHistory() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      if (isGuest || !user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'donations'),
          where('userId', '==', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DonationRecord[];

        // Sort client-side by createdAt descending to avoid needing a composite index
        docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setDonations(docs);
      } catch (error) {
        console.error("Error fetching donations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [user, isGuest]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 size={48} className="animate-spin text-[var(--color-mint)] mb-4" />
        <p className="text-lg font-medium animate-pulse opacity-70">Loading History...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="neu-flat p-3 rounded-full hover:neu-pressed transition-all text-[var(--color-navy)]"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <History className="text-[var(--color-mint)]" size={32} />
            Donation History
          </h1>
          <p className="opacity-70 mt-1">Track your past contributions and their status.</p>
        </div>
      </div>

      {/* List of Donations */}
      {isGuest ? (
        <div className="glass-panel p-12 rounded-[30px] text-center">
          <Package size={48} className="mx-auto text-[var(--color-navy)] opacity-30 mb-4" />
          <h3 className="text-xl font-bold mb-2">Guest Account</h3>
          <p className="opacity-70">Please log in to view and track your donation history.</p>
        </div>
      ) : donations.length === 0 ? (
        <div className="glass-panel p-12 rounded-[30px] text-center">
          <Package size={48} className="mx-auto text-[var(--color-navy)] opacity-30 mb-4" />
          <h3 className="text-xl font-bold mb-2">No Donations Yet</h3>
          <p className="opacity-70">You haven't made any donations yet. Head over to the Donate section to get started!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {donations.map((donation, index) => {
            const Icon = getCategoryIcon(donation.category);
            const isCompleted = donation.status.toLowerCase() === 'completed';
            const formattedDate = new Date(donation.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            return (
              <motion.div
                key={donation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-panel p-6 rounded-[24px] flex flex-col sm:flex-row gap-6 items-start sm:items-center relative overflow-hidden"
              >
                {/* Category Icon */}
                <div className="neu-convex p-4 rounded-[20px] text-[var(--color-mint)] shrink-0">
                  <Icon size={32} />
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <h3 className="text-xl font-bold text-[var(--color-navy)]">
                      {donation.category} Donation
                    </h3>
                    <span className="text-sm font-semibold opacity-60 flex items-center gap-1">
                      <Clock size={14} /> {formattedDate}
                    </span>
                  </div>
                  <p className="text-sm opacity-80 mb-4 line-clamp-2">
                    {donation.details}
                  </p>
                  
                  {/* Status Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isCompleted 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-orange-100 text-orange-700 border border-orange-200'
                  }`}>
                    {isCompleted ? <CheckCircle size={14} /> : <Clock size={14} />}
                    {donation.status}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
