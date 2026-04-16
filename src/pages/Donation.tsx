import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shirt, Book, Monitor, Sofa, CheckCircle, X } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const categories = [
  { id: 'Clothes', icon: Shirt },
  { id: 'Books', icon: Book },
  { id: 'E-Waste', icon: Monitor },
  { id: 'Furniture', icon: Sofa },
];

export default function Donation() {
  const { user, isGuest } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategories.length === 0 || !details) {
      alert('Please select at least one category and add details');
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Save to localStorage for session
      const donationRecord = {
        id: `donation_${Date.now()}`,
        categories: selectedCategories,
        details,
        status: 'Pending',
        createdAt: new Date().toISOString(),
        userId: user?.uid || null
      };

      const existingDonations = localStorage.getItem('donationOrderHistory') || '[]';
      const donations = JSON.parse(existingDonations);
      donations.unshift(donationRecord);
      localStorage.setItem('donationOrderHistory', JSON.stringify(donations));

      if (!isGuest && user) {
        await addDoc(collection(db, 'donations'), {
          userId: user.uid,
          categories: selectedCategories,
          details,
          status: 'Pending',
          createdAt: new Date().toISOString()
        });
      }
      // Show success modal
      setShowModal(true);
      setSelectedCategories([]);
      setDetails('');
    } catch (error) {
      console.error("Error submitting donation", error);
      alert("Failed to submit donation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Donate Items</h2>
        <p className="opacity-70">Give your gently used items a second life. We partner with local NGOs.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-[30px] space-y-8">
        <div>
          <label className="block font-semibold mb-4 text-lg">Select Categories (Multiple)</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-4 rounded-[20px] flex flex-col items-center gap-2 transition-all ${
                    isSelected 
                      ? 'neu-pressed text-[var(--color-mint)] border-2 border-[var(--color-mint)]' 
                      : 'neu-flat hover:neu-convex opacity-70 hover:opacity-100'
                  }`}
                >
                  <Icon size={28} />
                  <span className="font-medium text-sm">{cat.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-4 text-lg">Item Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe the items you are donating (e.g., 3 bags of winter clothes, 1 working microwave)..."
            className="w-full neu-pressed rounded-[20px] p-4 min-h-[120px] bg-transparent outline-none resize-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={selectedCategories.length === 0 || !details || isSubmitting}
          className="w-full neu-convex py-4 rounded-full font-bold text-lg text-[var(--color-mint)] hover:neu-pressed transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Donation'}
        </button>
      </form>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-panel p-8 rounded-[30px] max-w-md w-full text-center relative"
            >
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full neu-flat hover:neu-pressed"
              >
                <X size={20} />
              </button>
              
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full neu-convex text-[var(--color-mint)]">
                  <CheckCircle size={48} />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
              <p className="opacity-70 mb-6">Your donation request has been sent to our NGO partners. They will contact you shortly for pickup.</p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full neu-flat py-3 rounded-full font-semibold hover:neu-pressed transition-all"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
