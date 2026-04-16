import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { addDoc, collection } from 'firebase/firestore';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  MapPin,
  Phone,
  Search,
  Trash2,
  User,
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface PickupBooking {
  id: string;
  date: string;
  time: string;
  categories: string[];
  address: string;
  collectorName?: string;
  collectorPhone?: string;
  latitude?: number;
  longitude?: number;
  destinationLatitude?: number;
  destinationLongitude?: number;
  status: string;
  createdAt: string;
}

const aiRef: { current: GoogleGenAI | null } = { current: null };

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const categories = ['Plastic', 'E-waste', 'Metal', 'Paper'];
const timeSlots = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

function MapUpdater({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([latitude, longitude], map.getZoom(), {
      animate: true,
      duration: 1.2,
    });
  }, [latitude, longitude, map]);

  return null;
}

export default function SchedulePickup() {
  const { user, isGuest } = useAuth();
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    categories: [] as string[],
    locationQuery: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<PickupBooking | null>(null);
  const [orderHistory, setOrderHistory] = useState<PickupBooking[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [isSearchingCenters, setIsSearchingCenters] = useState(false);
  const [nearbyCenters, setNearbyCenters] = useState('');

  useEffect(() => {
    const cachedHistory = localStorage.getItem('pickupOrderHistory');
    if (!cachedHistory) {
      return;
    }

    try {
      const parsed = JSON.parse(cachedHistory);
      if (Array.isArray(parsed)) {
        setOrderHistory(parsed);
      }
    } catch (error) {
      console.error('Error loading cached history:', error);
    }
  }, []);

  useEffect(() => {
    if (!aiRef.current && import.meta.env.VITE_GEMINI_API_KEY) {
      try {
        aiRef.current = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      } catch (error) {
        console.warn('AI initialization warning:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!showMap || !confirmedBooking?.destinationLatitude || !confirmedBooking.destinationLongitude) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setConfirmedBooking((current) => {
        if (!current?.latitude || !current.longitude || !current.destinationLatitude || !current.destinationLongitude) {
          return current;
        }

        const latDelta = current.destinationLatitude - current.latitude;
        const lngDelta = current.destinationLongitude - current.longitude;

        if (Math.abs(latDelta) < 0.00025 && Math.abs(lngDelta) < 0.00025) {
          window.clearInterval(intervalId);
          return {
            ...current,
            latitude: current.destinationLatitude,
            longitude: current.destinationLongitude,
          };
        }

        return {
          ...current,
          latitude: current.latitude + latDelta * 0.18,
          longitude: current.longitude + lngDelta * 0.18,
        };
      });
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, [showMap, confirmedBooking?.destinationLatitude, confirmedBooking?.destinationLongitude]);

  const mapCenter = useMemo<[number, number]>(() => {
    if (confirmedBooking?.latitude && confirmedBooking?.longitude) {
      return [confirmedBooking.latitude, confirmedBooking.longitude];
    }
    return [37.7749, -122.4194];
  }, [confirmedBooking?.latitude, confirmedBooking?.longitude]);

  const assignCollector = (booking: PickupBooking): PickupBooking => {
    const collectors = [
      { name: 'Rajesh Kumar', phone: '+91-9876543210', lat: 37.7749, lng: -122.4194 },
      { name: 'Priya Singh', phone: '+91-9876543211', lat: 37.7849, lng: -122.4094 },
      { name: 'Amit Patel', phone: '+91-9876543212', lat: 37.7649, lng: -122.4294 },
    ];
    const collector = collectors[Math.floor(Math.random() * collectors.length)];

    return {
      ...booking,
      collectorName: collector.name,
      collectorPhone: collector.phone,
      latitude: collector.lat,
      longitude: collector.lng,
      destinationLatitude: collector.lat + 0.012,
      destinationLongitude: collector.lng + 0.012,
    };
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((item) => item !== category)
        : [...prev.categories, category],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.date || !formData.time || formData.categories.length === 0 || !formData.address) {
      alert('Please fill all fields and select at least one category');
      return;
    }

    setIsSubmitting(true);

    try {
      let booking: PickupBooking = {
        id: '',
        date: formData.date,
        time: formData.time,
        categories: formData.categories,
        address: formData.address,
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
      };

      booking = assignCollector(booking);

      const guestId = isGuest ? `guest_${Date.now()}_${Math.random().toString(36).slice(2, 11)}` : null;

      if (!isGuest && user?.uid) {
        const docRef = await addDoc(collection(db, 'pickups'), {
          userId: user.uid,
          email: user.email,
          ...booking,
        });
        booking.id = docRef.id;
      } else if (isGuest) {
        booking.id = guestId || `guest_${Date.now()}`;
      }

      const updatedHistory = [booking, ...orderHistory];
      localStorage.setItem('pickupOrderHistory', JSON.stringify(updatedHistory));
      setOrderHistory(updatedHistory);
      setConfirmedBooking(booking);
      setShowMap(true);
      setNearbyCenters('');
      setFormData({
        date: '',
        time: '',
        categories: [],
        locationQuery: '',
        address: '',
      });
    } catch (error) {
      console.error('Error scheduling pickup:', error);
      alert('Failed to schedule pickup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteOrder = (id: string) => {
    const updatedHistory = orderHistory.filter((order) => order.id !== id);
    setOrderHistory(updatedHistory);
    localStorage.setItem('pickupOrderHistory', JSON.stringify(updatedHistory));
  };

  const findNearbyCenters = async () => {
    const queryText = formData.locationQuery.trim() || formData.address.trim();
    if (!queryText) {
      alert('Please enter a quick location first to find nearby centers.');
      return;
    }

    if (!aiRef.current) {
      alert('AI search is not configured right now.');
      return;
    }

    setIsSearchingCenters(true);
    setNearbyCenters('');

    try {
      const response = await aiRef.current.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find 2-3 recycling centers or scrap yards near this location: ${queryText}. Respond with the place name, a short one-line note, and approximate area/distance.`,
      });
      setNearbyCenters(response.text || 'No nearby centers found.');
    } catch (error) {
      console.error('Error finding centers:', error);
      setNearbyCenters('Failed to find nearby centers. Please try again.');
    } finally {
      setIsSearchingCenters(false);
    }
  };

  if (showMap && confirmedBooking) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <button
          onClick={() => setShowMap(false)}
          className="flex items-center gap-2 text-[var(--color-mint)] hover:opacity-80 transition-opacity font-semibold"
        >
          <ArrowLeft size={20} />
          Back to Booking
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="neu-flat p-8 rounded-[30px]"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-full bg-[var(--color-mint)]/20 text-[var(--color-mint)]">
              <CheckCircle size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Pickup Confirmed!</h2>
              <p className="text-sm opacity-70">Live tracker active. Your collector is moving toward the pickup destination.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="neu-pressed p-6 rounded-[20px]">
                <p className="text-sm opacity-70 mb-1">Scheduled Date & Time</p>
                <p className="text-lg font-semibold">{confirmedBooking.date} at {confirmedBooking.time}</p>
              </div>
              <div className="neu-pressed p-6 rounded-[20px]">
                <p className="text-sm opacity-70 mb-1">Scrap Categories</p>
                <p className="text-lg font-semibold text-[var(--color-mint)]">{confirmedBooking.categories.join(', ')}</p>
              </div>
              <div className="neu-pressed p-6 rounded-[20px]">
                <p className="text-sm opacity-70 mb-1">Pickup Address</p>
                <p className="font-semibold">{confirmedBooking.address}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="neu-convex p-6 rounded-[20px] border-2 border-[var(--color-mint)]/30">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <User className="text-[var(--color-mint)]" size={24} />
                  Assigned Collector
                </h3>
                <p className="text-xl font-bold text-[var(--color-mint)] mb-2">{confirmedBooking.collectorName}</p>
                <p className="flex items-center gap-2 opacity-80 mb-4">
                  <Phone size={18} />
                  {confirmedBooking.collectorPhone}
                </p>
                <p className="text-sm opacity-70">Tracker updates every few seconds to simulate live movement.</p>
              </div>

              <div className="neu-pressed p-4 rounded-[20px] bg-[var(--color-mint)]/10 border border-[var(--color-mint)]/20">
                <p className="text-sm font-semibold text-[var(--color-mint)]">Order placed successfully</p>
              </div>
            </div>
          </div>

          {confirmedBooking.latitude && confirmedBooking.longitude && (
            <div className="mt-8 glass-panel p-4 rounded-[20px] overflow-hidden h-[400px]">
              <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', borderRadius: '20px' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapUpdater latitude={confirmedBooking.latitude} longitude={confirmedBooking.longitude} />
                <Marker position={[confirmedBooking.latitude, confirmedBooking.longitude]}>
                  <Popup>
                    <div className="text-center">
                      <p className="font-bold">{confirmedBooking.collectorName}</p>
                      <p className="text-sm">{confirmedBooking.collectorPhone}</p>
                    </div>
                  </Popup>
                </Marker>
                {confirmedBooking.destinationLatitude && confirmedBooking.destinationLongitude && (
                  <Marker position={[confirmedBooking.destinationLatitude, confirmedBooking.destinationLongitude]}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-bold">Pickup Destination</p>
                        <p className="text-sm">{confirmedBooking.address}</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="neu-flat p-8 rounded-[30px]"
      >
        <h2 className="text-3xl font-bold mb-2">Schedule Scrap Pickup</h2>
        <p className="opacity-70 mb-8">Fill in the details, get nearby center suggestions, and we&apos;ll assign a collector.</p>

        <div className="glass-panel p-6 rounded-[24px] mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                <Search size={18} className="text-[var(--color-mint)]" />
                Find Nearby Centers
              </h3>
              <p className="text-sm opacity-65 mt-1">Use your quick location to get AI suggestions for nearby recycling centers.</p>
            </div>
            <button
              onClick={findNearbyCenters}
              disabled={isSearchingCenters || (!formData.locationQuery.trim() && !formData.address.trim())}
              className="neu-flat px-4 py-2 rounded-full text-sm font-semibold hover:neu-pressed disabled:opacity-50 transition-all"
            >
              {isSearchingCenters ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
            </button>
          </div>

          {nearbyCenters ? (
            <div className="neu-pressed p-4 rounded-[20px] text-sm opacity-85 whitespace-pre-wrap">{nearbyCenters}</div>
          ) : (
            <p className="text-sm opacity-60">Enter a quick location below and click search to get AI-suggested nearby centers.</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                <Calendar size={18} className="text-[var(--color-mint)]" />
                Pickup Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full neu-pressed px-4 py-3 rounded-[15px] outline-none bg-transparent font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock size={18} className="text-[var(--color-mint)]" />
                Time Slot
              </label>
              <select
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className="w-full neu-pressed px-4 py-3 rounded-[15px] outline-none bg-transparent font-medium cursor-pointer"
              >
                <option value="">Select a time</option>
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                <Trash2 size={18} className="text-[var(--color-mint)]" />
                Scrap Categories (Select Multiple)
              </label>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label key={category} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="w-5 h-5 rounded neu-flat cursor-pointer accent-[var(--color-mint)]"
                    />
                    <span
                      className={`py-2 px-4 rounded-lg transition-all ${
                        formData.categories.includes(category) ? 'neu-pressed text-[var(--color-mint)] font-semibold' : 'neu-flat'
                      }`}
                    >
                      {category}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-[var(--color-mint)]" />
                Quick Location
              </label>
              <input
                type="text"
                name="locationQuery"
                placeholder="e.g., Nashik College Road"
                value={formData.locationQuery}
                onChange={handleInputChange}
                className="w-full neu-pressed px-4 py-3 rounded-[15px] outline-none bg-transparent font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-3">Full Pickup Address</label>
            <textarea
              name="address"
              placeholder="Enter complete pickup address with landmarks..."
              value={formData.address}
              onChange={handleInputChange}
              rows={4}
              className="w-full neu-pressed px-4 py-3 rounded-[15px] outline-none bg-transparent font-medium resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full neu-convex py-4 rounded-full font-bold text-lg text-[var(--color-mint)] hover:neu-pressed transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Confirm Schedule
              </>
            )}
          </button>
        </form>
      </motion.div>

      {orderHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="neu-flat p-8 rounded-[30px]"
        >
          <h3 className="text-2xl font-bold mb-6">Recent Pickups</h3>
          <div className="space-y-4">
            {orderHistory.map((order) => (
              <div key={order.id} className="neu-pressed p-6 rounded-[20px] flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-bold text-lg">{order.categories.join(', ')}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        order.status === 'Confirmed' ? 'bg-[var(--color-mint)]/20 text-[var(--color-mint)]' : 'bg-gray-300/20 text-gray-600'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="opacity-70 text-sm mb-2">
                    {order.date} at {order.time}
                  </p>
                  <p className="text-sm opacity-80">{order.address}</p>
                  {order.collectorName && <p className="text-sm mt-2 text-[var(--color-mint)] font-semibold">Collector: {order.collectorName}</p>}
                </div>
                <button
                  onClick={() => deleteOrder(order.id)}
                  className="p-3 rounded-full neu-flat hover:neu-pressed transition-all text-red-500 ml-4"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
