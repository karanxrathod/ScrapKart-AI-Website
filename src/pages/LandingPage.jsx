import React from 'react';
import { motion } from 'motion/react';
import { Camera, Sparkles, Truck, ScanSearch, MapPinned, BadgeDollarSign, Recycle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    title: 'Snap a Photo',
    description: 'Upload a quick picture of paper, plastic, metal, or e-waste straight from your phone.',
    icon: Camera,
  },
  {
    title: 'Get AI Valuation',
    description: 'Our AI identifies the material mix and estimates a fair live value in seconds.',
    icon: Sparkles,
  },
  {
    title: 'Schedule Pickup',
    description: 'Choose a convenient slot and let a verified collector handle the rest.',
    icon: Truck,
  },
];

const features = [
  {
    title: 'AI Scrap Scanning',
    description: 'Turn messy mixed scrap into a clear material breakdown with confidence scores and pricing hints.',
    icon: ScanSearch,
  },
  {
    title: 'Live Collector Tracking',
    description: 'Follow your assigned collector in real time and stay updated from confirmation to doorstep pickup.',
    icon: MapPinned,
  },
  {
    title: 'Instant Pricing',
    description: 'See transparent, AI-assisted rates before you commit so every pickup feels predictable.',
    icon: BadgeDollarSign,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="ambient-blob blob-1"></div>
      <div className="ambient-blob blob-2"></div>

      <div className="relative z-10 px-4 py-6 sm:px-6 lg:px-8">
        <header className="glass-panel mx-auto flex max-w-7xl items-center justify-between rounded-[28px] px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="neu-convex rounded-full p-3 text-[var(--color-mint)]">
              <Recycle size={24} />
            </div>
            <div>
              <p className="text-lg font-bold">ScrapKart AI</p>
              <p className="text-xs opacity-60">Smart waste management</p>
            </div>
          </div>

          <nav className="hidden items-center gap-3 sm:flex">
            <button
              onClick={() => navigate('/login')}
              className="neu-flat rounded-full px-5 py-2.5 text-sm font-semibold hover:neu-pressed transition-all"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="neu-convex rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--color-mint)] hover:neu-pressed transition-all"
            >
              Sign Up
            </button>
          </nav>
        </header>

        <main className="mx-auto flex max-w-7xl flex-col gap-10 py-10 sm:py-14">
          <section className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-[36px] p-8 sm:p-10 lg:p-12"
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full neu-flat px-4 py-2 text-sm font-medium text-[var(--color-mint)]">
                <Sparkles size={16} />
                AI-powered recycling companion
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                Turn Waste into Value with AI
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 opacity-75 sm:text-lg">
                ScrapKart AI helps households and communities identify recyclable materials, estimate value instantly,
                and book seamless pickups with trusted local collectors.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => navigate('/login')}
                  className="neu-convex rounded-full px-8 py-4 text-base font-bold text-[var(--color-mint)] hover:neu-pressed transition-all"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="neu-flat rounded-full px-8 py-4 text-base font-bold hover:neu-pressed transition-all"
                >
                  Sign Up
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1"
            >
              <div className="neu-convex rounded-[32px] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] opacity-50">Smart Sorting</p>
                <p className="mt-4 text-2xl font-bold">From camera to collector in a few taps.</p>
              </div>
              <div className="glass-panel rounded-[32px] p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="neu-flat rounded-[24px] p-5">
                    <p className="text-sm opacity-60">Avg. pickup setup</p>
                    <p className="mt-2 text-3xl font-black text-[var(--color-mint)]">2 min</p>
                  </div>
                  <div className="neu-flat rounded-[24px] p-5">
                    <p className="text-sm opacity-60">Material visibility</p>
                    <p className="mt-2 text-3xl font-black text-[var(--color-navy)]">AI</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="space-y-6">
            <div className="px-2">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-mint)]">How It Works</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Three soft steps to smarter recycling</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + index * 0.08 }}
                    className="neu-convex rounded-[32px] p-7"
                  >
                    <div className="flex items-center justify-between">
                      <div className="neu-flat rounded-full p-4 text-[var(--color-mint)]">
                        <Icon size={28} />
                      </div>
                      <span className="text-sm font-bold opacity-40">0{index + 1}</span>
                    </div>
                    <h3 className="mt-6 text-2xl font-bold">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 opacity-70">{step.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>

          <section className="space-y-6">
            <div className="px-2">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--color-mint)]">Key Features</p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Built for fast, transparent collection</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.08 }}
                    className="glass-panel rounded-[32px] p-7"
                  >
                    <div className="inline-flex rounded-full neu-convex p-4 text-[var(--color-mint)]">
                      <Icon size={26} />
                    </div>
                    <h3 className="mt-5 text-2xl font-bold">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 opacity-70">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </main>

        <footer className="mx-auto mt-4 max-w-7xl pb-6">
          <div className="neu-flat flex flex-col items-center justify-between gap-4 rounded-[28px] px-6 py-5 text-sm sm:flex-row sm:px-8">
            <p className="opacity-70">(c) 2026 ScrapKart AI. Turning circular habits into daily action.</p>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/login')} className="hover:text-[var(--color-mint)] transition-colors">
                Login
              </button>
              <button onClick={() => navigate('/signup')} className="hover:text-[var(--color-mint)] transition-colors">
                Sign Up
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
