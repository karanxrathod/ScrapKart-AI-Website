import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ScanScreen from './pages/ScanScreen';
import Donation from './pages/Donation';
import Booking from './pages/Booking';
import SchedulePickup from './pages/SchedulePickup';
import TrackingScreen from './pages/TrackingScreen';
import UserProfile from './pages/UserProfile';
import DonationHistory from './pages/DonationHistory';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isGuest } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user && !isGuest) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

export default function App() {
  // Auto-clear localStorage on window unload (refresh or close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('pickupOrderHistory');
      localStorage.removeItem('donationOrderHistory');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="scan" element={<ScanScreen />} />
            <Route path="donate" element={<Donation />} />
            <Route path="book" element={<Booking />} />
            <Route path="schedule-pickup" element={<SchedulePickup />} />
            <Route path="tracking" element={<TrackingScreen />} />
            <Route path="profile" element={<UserProfile />} />
            <Route path="history" element={<DonationHistory />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
