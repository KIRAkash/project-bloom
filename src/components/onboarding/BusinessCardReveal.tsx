'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function TypewriterText({ text, onDone, className }: { text: string; onDone?: () => void; className?: string }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;

    if (!text) return;

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(interval);
        onDone?.();
      }
    }, 45);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.7 }}
          className="inline-block w-0.5 h-[1em] bg-current align-middle ml-0.5"
        />
      )}
    </span>
  );
}

interface BusinessCardRevealProps {
  businessName?: string;
  businessLocation?: string;
  businessCategory?: string;
  primaryProducts?: string[];
}

export function BusinessCardReveal({
  businessName,
  businessLocation,
  businessCategory,
  primaryProducts,
}: BusinessCardRevealProps) {
  const [nameTyped, setNameTyped] = useState(false);
  const [locationTyped, setLocationTyped] = useState(false);
  const prevName = useRef<string | undefined>(undefined);

  // Reset when name changes (new session)
  useEffect(() => {
    if (businessName !== prevName.current) {
      setNameTyped(false);
      setLocationTyped(false);
      prevName.current = businessName;
    }
  }, [businessName]);

  if (!businessName) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full"
    >
      {/* Glassmorphic business card */}
      <div className="relative rounded-2xl overflow-hidden border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(241,245,255,0.9) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Decorative gradient orb */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 blur-2xl"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, #a855f7 100%)' }}
        />

        <div className="relative p-6">
          {/* Category badge */}
          <AnimatePresence>
            {businessCategory && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                {businessCategory}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Business Name */}
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 leading-tight mb-1">
            <TypewriterText
              text={businessName}
              onDone={() => setNameTyped(true)}
            />
          </h2>

          {/* Location — reveals after name is done */}
          <AnimatePresence>
            {nameTyped && businessLocation && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-base text-slate-500 flex items-center gap-1.5 mt-2"
              >
                <span>📍</span>
                <TypewriterText
                  text={businessLocation}
                  onDone={() => setLocationTyped(true)}
                  className="font-medium text-slate-600"
                />
              </motion.p>
            )}
          </AnimatePresence>

          {/* Products — reveals after location */}
          <AnimatePresence>
            {locationTyped && primaryProducts && primaryProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-2 mt-3"
              >
                {primaryProducts.map((product, i) => (
                  <motion.span
                    key={product}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                  >
                    {product}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom shimmer bar */}
        <div className="h-0.5 w-full"
          style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899, #6366f1)', backgroundSize: '200% 100%' }}
        />
      </div>
    </motion.div>
  );
}
