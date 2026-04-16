import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Calendar, Clock, MapPin, CheckCircle, Search, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useNavigate } from 'react-router-dom';

const aiRef: { current: any } = { current: null };

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Pickup Location</Popup>
    </Marker>
  );
}

export default function Booking() {
  const { user, isGuest } = useAuth();
  const navigate = useNavigate();
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isSearchingCenters, setIsSearchingCenters] = useState(false);
  const [nearbyCenters, setNearbyCenters] = useState<string>('');

  useEffect(() => {
    if (!aiRef.current && import.meta.env.VITE_GEMINI_API_KEY) {
      try {
        aiRef.current = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      } catch (error) {
        console.warn("AI initialization warning:", error);
      }
    }
  }, []);

  // Default to a central location (e.g., San Francisco)
  const defaultCenter: L.LatLngExpression = [37.7749, -122.4194];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !date || !time) return;

    setIsSubmitting(true);
    try {
      if (!isGuest && user) {
        const scheduledTime = new Date(`${date}T${time}`).toISOString();
        await addDoc(collection(db, 'pickups'), {
          userId: user.uid,
          address,
          scheduledTime,
          status: 'Scheduled',
          createdAt: new Date().toISOString()
        });
      }
      // Navigate to tracking screen instead of showing inline success
      navigate('/tracking');
    } catch (error) {
      console.error("Error booking pickup", error);
      alert("Failed to book pickup.");
      setIsSubmitting(false);
    }
  };

  const findNearbyCenters = async () => {
    if (!address) {
      alert("Please enter an address first to find nearby centers.");
      return;
    }
    setIsSearchingCenters(true);
    setNearbyCenters('');
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find recycling centers or scrap yards near this address: ${address}. Provide a short list of 2-3 places with their names and approximate distance or location.`,
        config: {
          tools: [{ googleMaps: {} }]
        }
      });
      setNearbyCenters(response.text || "No centers found nearby.");
    } catch (error) {
      console.error("Error finding centers:", error);
      setNearbyCenters("Failed to find nearby centers. Please try again.");
    } finally {
      setIsSearchingCenters(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Book a Pickup</h2>
        <p className="opacity-70">Select your location and preferred time for scrap collection.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-4 rounded-[30px] overflow-hidden h-[400px] lg:h-auto relative z-0">
          <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '20px' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg text-sm font-medium z-[1000]">
            Click on map to set location
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-[30px] space-y-6">
            <div>
              <label className="flex items-center gap-2 font-semibold mb-2">
                <MapPin size={18} /> Complete Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Apt 4B..."
                className="w-full neu-pressed rounded-full px-6 py-3 bg-transparent outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 font-semibold mb-2">
                  <Calendar size={18} /> Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full neu-pressed rounded-full px-6 py-3 bg-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="flex items-center gap-2 font-semibold mb-2">
                  <Clock size={18} /> Time
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full neu-pressed rounded-full px-6 py-3 bg-transparent outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!address || !date || !time || isSubmitting}
              className="w-full neu-convex py-4 rounded-full font-bold text-lg text-[var(--color-mint)] hover:neu-pressed transition-all disabled:opacity-50 mt-4"
            >
              {isSubmitting ? 'Scheduling...' : 'Confirm Booking'}
            </button>
          </form>

          {/* AI Maps Grounding Feature */}
          <div className="glass-panel p-6 rounded-[30px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Search size={18} className="text-[var(--color-mint)]" />
                Find Nearby Centers
              </h3>
              <button 
                onClick={findNearbyCenters}
                disabled={isSearchingCenters || !address}
                className="neu-flat px-4 py-2 rounded-full text-sm font-semibold hover:neu-pressed disabled:opacity-50 transition-all"
              >
                {isSearchingCenters ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
              </button>
            </div>
            
            {nearbyCenters && (
              <div className="neu-pressed p-4 rounded-[20px] text-sm opacity-80 whitespace-pre-wrap">
                {nearbyCenters}
              </div>
            )}
            {!nearbyCenters && !isSearchingCenters && (
              <p className="text-sm opacity-60">Enter an address and click search to find recycling centers near you using AI.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
