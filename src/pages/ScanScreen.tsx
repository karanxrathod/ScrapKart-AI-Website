import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, Loader2, CheckCircle, Truck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export default function ScanScreen() {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const scanImage = async () => {
    if (!image) {
      setResult({ error: "Please select an image first." });
      return;
    }

    setIsScanning(true);
    setResult(null);

    // Simulate scanning with setTimeout (2 seconds)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Dummy scan results
      const dummyResults = [
        { 
          material: 'Plastic', 
          confidence: 92, 
          pricePrediction: '₹50/kg', 
          recyclability: 'Highly recyclable' 
        },
        { 
          material: 'Metal', 
          confidence: 88, 
          pricePrediction: '₹120/kg', 
          recyclability: 'Fully recyclable' 
        },
        { 
          material: 'E-Waste', 
          confidence: 85, 
          pricePrediction: '₹250/kg', 
          recyclability: 'Complex recycling process' 
        },
        { 
          material: 'Paper', 
          confidence: 95, 
          pricePrediction: '₹15/kg', 
          recyclability: 'Fully recyclable' 
        },
      ];

      // Select a random result
      const randomResult = dummyResults[Math.floor(Math.random() * dummyResults.length)];
      setResult(randomResult);
    } catch (error) {
      console.error("Error scanning image:", error);
      setResult({ error: "Failed to analyze image. Please try again." });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">AI Vision Scanner</h2>
        <p className="opacity-70">Upload a photo of your scrap to get an instant analysis and price estimate.</p>
      </div>

      <div 
        className={`glass-panel p-8 rounded-[30px] border-2 border-dashed transition-all ${isDragging ? 'border-[var(--color-mint)] bg-[var(--color-mint)]/10' : 'border-gray-300'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {!image ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="neu-convex p-6 rounded-full mb-6 text-[var(--color-mint)]">
              <Upload size={48} />
            </div>
            <h3 className="text-xl font-semibold mb-2">Drag & Drop your image here</h3>
            <p className="opacity-70 mb-6">or click to browse from your device</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="neu-flat py-3 px-8 rounded-full font-semibold hover:neu-pressed transition-all"
            >
              Select Image
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        ) : (
          <div className="relative">
            <img src={image} alt="Scrap" className="w-full max-h-[400px] object-contain rounded-[20px]" />
            <button 
              onClick={() => { setImage(null); setResult(null); }}
              className="absolute top-4 right-4 neu-flat p-2 rounded-full text-red-500 hover:neu-pressed"
            >
              <X size={24} />
            </button>
          </div>
        )}
      </div>

      {image && !result && !isScanning && (
        <div className="flex justify-center">
          <button 
            onClick={scanImage}
            className="neu-convex py-4 px-12 rounded-full font-bold text-lg text-[var(--color-mint)] hover:neu-pressed transition-all"
          >
            Scan Material
          </button>
        </div>
      )}

      {isScanning && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 size={48} className="animate-spin text-[var(--color-mint)] mb-4" />
          <p className="text-lg font-medium animate-pulse">Scanning material...</p>
        </div>
      )}

      <AnimatePresence>
        {result && !result.error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neu-flat p-8 rounded-[30px]"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-full bg-[var(--color-mint)]/20 text-[var(--color-mint)]">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold">Analysis Complete</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="neu-pressed p-6 rounded-[20px]">
                <p className="text-sm opacity-70 mb-1">Detected Material</p>
                <p className="text-xl font-bold">{result.material}</p>
              </div>
              <div className="neu-pressed p-6 rounded-[20px]">
                <p className="text-sm opacity-70 mb-1">Confidence Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--color-mint)]" 
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                  </div>
                  <span className="font-bold">{result.confidence}%</span>
                </div>
              </div>
              <div className="neu-pressed p-6 rounded-[20px]">
                <p className="text-sm opacity-70 mb-1">Price Prediction</p>
                <p className="text-2xl font-bold text-[var(--color-mint)]">{result.pricePrediction}</p>
              </div>
              <div className="neu-pressed p-6 rounded-[20px]">
                <p className="text-sm opacity-70 mb-1">Recyclability</p>
                <p className="font-medium">{result.recyclability}</p>
              </div>
            </div>

            <div className="mt-8 bg-[var(--color-navy)]/5 p-6 rounded-[20px] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-lg text-[var(--color-navy)] flex items-center gap-2">
                  <Truck className="text-[var(--color-mint)]" size={24} />
                  Ready to sell this scrap?
                </h4>
                <p className="opacity-70 text-sm">Schedule a pickup and a trusted collector will come to you.</p>
              </div>
              <button 
                onClick={() => navigate('/book')}
                className="neu-convex w-full sm:w-auto px-8 py-3 rounded-full font-bold text-[var(--color-mint)] hover:neu-pressed transition-all flex items-center justify-center gap-2"
              >
                Schedule Pickup <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
        
        {result && result.error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="neu-flat p-6 rounded-[20px] text-red-500 text-center font-medium"
          >
            {result.error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
