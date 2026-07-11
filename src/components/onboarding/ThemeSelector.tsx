'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

import { ThemeItem } from '@/store/useOnboardingStore';

interface ThemeSelectorProps {
  themes: ThemeItem[];
  isGenerating: boolean;
  selectedTheme: ThemeItem | null;
  onSelect: (theme: ThemeItem, index: number) => void;
}

function ThemeSkeleton({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="relative w-full aspect-[9/16] rounded-xl overflow-hidden bg-slate-100 border border-slate-200"
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
        <div className="w-16 h-2 rounded-full bg-slate-200 animate-pulse" />
      </div>
    </motion.div>
  );
}

export function ThemeSelector({ themes, isGenerating, selectedTheme, onSelect }: ThemeSelectorProps) {
  const showSkeletons = isGenerating && themes.length === 0;

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
          {isGenerating && themes.length === 0 ? '✨ Designing your themes...' : 'Choose your brand style'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <AnimatePresence>
          {showSkeletons
            ? [0, 1, 2, 3].map(i => <ThemeSkeleton key={`skel-${i}`} delay={i * 0.1} />)
            : themes.map((theme, i) => {
                const isSelected = theme === selectedTheme;
                return (
                  <motion.button
                    key={`theme-${i}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.12, type: 'spring', damping: 14 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onSelect(theme, i)}
                    className={`relative w-full aspect-[9/16] rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-brand-primary shadow-[0_0_0_4px_rgba(31,84,92,0.2)]'
                        : 'border-slate-200 hover:border-brand-primary/50'
                    }`}
                  >
                    <img
                      src={theme.image}
                      alt={`Theme option: ${theme.name}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Overlay label */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent pt-8 pb-3 px-3">
                      <p className="text-white text-sm font-bold">{theme.name}</p>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-2 right-2 bg-brand-primary rounded-full p-0.5"
                      >
                        <CheckCircle size={16} className="text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
