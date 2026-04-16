import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, Paperclip, Image as ImageIcon } from 'lucide-react';

const LOCAL_API_BASE = import.meta.env.VITE_LOCAL_API_BASE || 'http://127.0.0.1:8000';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  imagePreview?: string;
}

interface UploadAttachment {
  base64: string;
  mimeType: string;
  previewUrl: string;
}

interface PickupHistoryItem {
  id?: string;
  date?: string;
  time?: string;
  categories?: string[];
  address?: string;
  status?: string;
  createdAt?: string;
}

interface DonationHistoryItem {
  id?: string;
  categories?: string[];
  details?: string;
  status?: string;
  createdAt?: string;
}

const parseLocalStorageArray = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Failed to parse ${key}:`, error);
    return [];
  }
};

const formatPickupHistory = (pickups: PickupHistoryItem[]) => {
  if (pickups.length === 0) {
    return 'No pickup history found.';
  }

  return pickups
    .slice(0, 10)
    .map((pickup, index) => {
      const categories = pickup.categories?.join(', ') || 'No categories provided';
      const schedule = pickup.date && pickup.time ? `${pickup.date} at ${pickup.time}` : pickup.createdAt || 'Unknown date';
      return `${index + 1}. Pickup ${pickup.id || 'unknown'}: ${categories}, ${pickup.status || 'Unknown status'}, scheduled ${schedule}, address: ${pickup.address || 'No address provided'}`;
    })
    .join('\n');
};

const formatDonationHistory = (donations: DonationHistoryItem[]) => {
  if (donations.length === 0) {
    return 'No donation history found.';
  }

  return donations
    .slice(0, 10)
    .map((donation, index) => {
      const categories = donation.categories?.join(', ') || 'No categories provided';
      return `${index + 1}. Donation ${donation.id || 'unknown'}: ${categories}, ${donation.status || 'Unknown status'}, created ${donation.createdAt || 'Unknown date'}, details: ${donation.details || 'No details provided'}`;
    })
    .join('\n');
};

const fileToAttachment = (file: File) =>
  new Promise<UploadAttachment>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file.'));
        return;
      }

      const [, base64 = ''] = result.split(',');
      resolve({
        base64,
        mimeType: file.type || 'image/png',
        previewUrl: result,
      });
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I am ScrapKart AI. Ask me anything about recycling, scrap rates, waste management, pickups, or donations.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<UploadAttachment | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      clearSelectedImage();
      return;
    }

    try {
      const attachment = await fileToAttachment(file);
      setSelectedImage(attachment);
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to read the selected image.');
      clearSelectedImage();
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) {
      return;
    }

    const typedMessage = input.trim();
    const userMessage = typedMessage || 'Please analyze this scrap image and tell me about the material.';
    const outgoingImage = selectedImage;

    setInput('');
    clearSelectedImage();
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: userMessage,
        imagePreview: outgoingImage?.previewUrl,
      },
    ]);
    setIsLoading(true);

    try {
      const pickupHistory = parseLocalStorageArray<PickupHistoryItem>('pickupOrderHistory');
      const donationHistory = parseLocalStorageArray<DonationHistoryItem>('donationOrderHistory');

      const response = await fetch(`${LOCAL_API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages.map((msg) => ({ role: msg.role, text: msg.text })),
          pickup_history: pickupHistory,
          donation_history: donationHistory,
          image_base64: outgoingImage?.base64 || null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.detail || `Local backend error: ${response.status}`);
      }

      const aiResponse = payload.response?.trim() || "Sorry, I'm having trouble connecting right now.";

      setMessages((prev) => [...prev, { role: 'model', text: aiResponse }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: error instanceof Error ? error.message : "Sorry, I'm having trouble connecting right now. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 sm:bottom-6 sm:right-6 p-4 rounded-full neu-convex text-[var(--color-mint)] z-40 transition-transform hover:scale-110 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageSquare size={28} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 w-[350px] h-[540px] max-h-[82vh] glass-panel rounded-[30px] flex flex-col overflow-hidden z-50 shadow-2xl"
          >
            <div className="p-4 border-b border-gray-200/30 flex justify-between items-center bg-[var(--color-soft-white)]/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full neu-flat text-[var(--color-mint)]">
                  <Bot size={20} />
                </div>
                <span className="font-bold">ScrapKart AI</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full neu-flat hover:neu-pressed text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-[20px] ${
                      msg.role === 'user' ? 'bg-[var(--color-mint)] text-white rounded-br-none' : 'neu-flat rounded-bl-none'
                    }`}
                  >
                    {msg.imagePreview && (
                      <img
                        src={msg.imagePreview}
                        alt="Uploaded scrap preview"
                        className="mb-2 h-24 w-full rounded-[14px] object-cover border border-white/30"
                      />
                    )}
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="neu-flat p-3 rounded-[20px] rounded-bl-none flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-[var(--color-soft-white)]/50 border-t border-gray-200/30">
              {selectedImage && (
                <div className="mb-3 neu-flat rounded-[20px] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedImage.previewUrl}
                        alt="Selected preview"
                        className="h-14 w-14 rounded-[14px] object-cover"
                      />
                      <div className="text-xs">
                        <p className="font-semibold">Image ready</p>
                        <p className="opacity-70">Send it for scrap-related help.</p>
                      </div>
                    </div>
                    <button
                      onClick={clearSelectedImage}
                      className="p-2 rounded-full neu-pressed text-gray-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="p-3 rounded-full neu-flat text-[var(--color-mint)] hover:neu-pressed disabled:opacity-50 transition-all"
                >
                  {selectedImage ? <ImageIcon size={18} /> : <Paperclip size={18} />}
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about recycling..."
                  className="flex-1 neu-pressed rounded-full px-4 py-2 text-sm outline-none bg-transparent"
                />
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && !selectedImage) || isLoading}
                  className="p-3 rounded-full neu-convex text-[var(--color-mint)] hover:neu-pressed disabled:opacity-50 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
