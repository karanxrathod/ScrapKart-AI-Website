import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, Phone, MessageSquare, Star, BadgeCheck, Truck, MapPin } from 'lucide-react';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const collectorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const START_POS: [number, number] = [20.0059, 73.7601]; // College Road
const END_POS: [number, number] = [20.0110, 73.7911]; // Panchvati
const TOTAL_STEPS = 300; // 30 seconds at 100ms per step
const INTERVAL_MS = 100;
const TOTAL_DISTANCE_KM = 3.5;
const TOTAL_ETA_MINS = 15;

export default function TrackingScreen() {
  const [isAssigning, setIsAssigning] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Simulate finding a collector
    const assignTimer = setTimeout(() => {
      setIsAssigning(false);
    }, 3000);

    return () => clearTimeout(assignTimer);
  }, []);

  useEffect(() => {
    if (isAssigning) return;

    const moveTimer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= TOTAL_STEPS) {
          clearInterval(moveTimer);
          return prev;
        }
        return prev + 1;
      });
    }, INTERVAL_MS);

    return () => clearInterval(moveTimer);
  }, [isAssigning]);

  // Calculate current position based on interpolation
  const progressRatio = currentStep / TOTAL_STEPS;
  const currentLat = START_POS[0] + (END_POS[0] - START_POS[0]) * progressRatio;
  const currentLng = START_POS[1] + (END_POS[1] - START_POS[1]) * progressRatio;
  const collectorPos: [number, number] = [currentLat, currentLng];

  // Calculate dynamic ETA and Distance
  const remainingRatio = 1 - progressRatio;
  const currentDist = (TOTAL_DISTANCE_KM * remainingRatio).toFixed(1);
  const currentEta = Math.ceil(TOTAL_ETA_MINS * remainingRatio);

  const handleCall = () => alert("Calling Rahul Sharma...");
  const handleMessage = () => alert("Opening messages with Rahul Sharma...");

  return (
    <div className="relative w-full h-[calc(100vh-100px)] -mt-4 sm:-mt-6 rounded-[30px] overflow-hidden">
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {isAssigning && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[2000] flex flex-col items-center justify-center bg-[var(--color-soft-white)]/80 backdrop-blur-md"
          >
            <Loader2 size={64} className="animate-spin text-[var(--color-mint)] mb-6" />
            <h2 className="text-2xl font-bold text-[var(--color-navy)] text-center px-4">
              Searching for Nearest Collector in Nashik...
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <MapContainer 
        center={[20.0085, 73.7756]} // Center of Nashik route
        zoom={14} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Route Polyline */}
        <Polyline positions={[START_POS, END_POS]} color="#1A2A6C" weight={4} dashArray="10, 10" opacity={0.5} />
        
        {/* User Pickup Location */}
        <Marker position={END_POS} icon={userIcon}>
          <Popup>Your Pickup Location (Panchvati)</Popup>
        </Marker>

        {/* Collector Location */}
        {!isAssigning && (
          <Marker position={collectorPos} icon={collectorIcon}>
            <Popup>Collector is on the way!</Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Glassmorphic Collector Info Card */}
      <AnimatePresence>
        {!isAssigning && (
          <motion.div 
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
            className="absolute bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] z-[1000]"
          >
            <div className="bg-white/40 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] rounded-[30px] p-6">
              
              {/* Status Header */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/30">
                <div>
                  <p className="text-sm font-semibold opacity-70 uppercase tracking-wider">Arriving in</p>
                  <p className="text-3xl font-bold text-[var(--color-mint)]">{currentEta} min</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold opacity-70 uppercase tracking-wider">Distance</p>
                  <p className="text-xl font-bold">{currentDist} km</p>
                </div>
              </div>

              {/* Collector Details */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
                  <img src="https://i.pravatar.cc/150?img=11" alt="Collector" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <h3 className="text-xl font-bold">Rahul Sharma</h3>
                    <BadgeCheck size={18} className="text-[var(--color-mint)]" />
                  </div>
                  <div className="flex items-center gap-3 text-sm font-medium opacity-80 mt-1">
                    <span className="flex items-center gap-1"><Star size={14} className="text-yellow-500 fill-yellow-500" /> 4.8</span>
                    <span className="flex items-center gap-1"><Truck size={14} /> MH-15-AB-1234</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button 
                  onClick={handleCall}
                  className="flex-1 neu-convex py-3 rounded-full flex items-center justify-center gap-2 font-semibold hover:neu-pressed transition-all text-[var(--color-navy)]"
                >
                  <Phone size={18} /> Call
                </button>
                <button 
                  onClick={handleMessage}
                  className="flex-1 neu-convex py-3 rounded-full flex items-center justify-center gap-2 font-semibold hover:neu-pressed transition-all text-[var(--color-navy)]"
                >
                  <MessageSquare size={18} /> Message
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
