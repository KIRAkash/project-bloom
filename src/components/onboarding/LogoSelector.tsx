'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface LogoSelectorProps {
  logos: string[];
  isGenerating: boolean;
  selectedLogo: string | null;
  onSelect: (logo: string, index: number) => void;
}

function LogoSkeleton() {
  return (
    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
      </div>
    </div>
  );
}

export function LogoSelector({ logos, isGenerating, selectedLogo, onSelect }: LogoSelectorProps) {
  const showSkeletons = isGenerating && logos.length === 0;
  const items = showSkeletons ? [0, 1, 2] : logos;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="mb-3 text-center">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          {isGenerating && logos.length === 0 ? '✨ Creating your logos...' : 'Choose your logo'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {showSkeletons
            ? items.map((_, i) => (
                <motion.div key={`skel-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
                  <LogoSkeleton />
                </motion.div>
              ))
            : logos.map((logo, i) => {
                const isSelected = logo === selectedLogo;
                return (
                  <motion.button
                    key={`logo-${i}`}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, type: 'spring', damping: 15 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelect(logo, i)}
                    className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-brand-primary shadow-[0_0_0_4px_rgba(31,84,92,0.2)]'
                        : 'border-slate-200 hover:border-brand-primary/50'
                    }`}
                  >
                    <img
                      src={logo}
                      alt={`Logo option ${i + 1}`}
                      className="w-full h-full object-contain bg-white p-2"
                    />
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-1.5 right-1.5 bg-brand-primary rounded-full p-0.5"
                      >
                        <CheckCircle size={14} className="text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
        </AnimatePresence>
      </div>

      {!isGenerating && logos.length === 0 && (
        <p className="text-center text-sm text-slate-400 mt-4">
          Waiting for logo generation to start…
        </p>
      )}
    </motion.div>
  );
}
