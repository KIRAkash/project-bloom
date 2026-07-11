'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Mic, MicOff, Settings } from 'lucide-react';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { useEffect, useState, useCallback } from 'react';
import { BusinessCardReveal } from '@/components/onboarding/BusinessCardReveal';
import { LogoSelector } from '@/components/onboarding/LogoSelector';
import { ThemeSelector } from '@/components/onboarding/ThemeSelector';

// Progress steps
const STEPS = ['GREETING', 'CONTEXT_GATHERING', 'LOGO_ACQUISITION', 'THEME_SELECTION', 'COMPLETE'];
const STEP_LABELS = ['Welcome', 'Your Business', 'Logo', 'Brand Style', 'Done!'];

function ProgressBar({ currentState }: { currentState: string }) {
  const currentIndex = STEPS.indexOf(currentState);
  const progress = currentIndex / (STEPS.length - 1);

  return (
    <div className="w-full px-2">
      <div className="flex justify-between mb-1.5">
        {STEPS.map((step, i) => (
          <div
            key={step}
            className={`text-[10px] font-semibold transition-colors ${
              i <= currentIndex ? 'text-indigo-600' : 'text-slate-300'
            }`}
          >
            {STEP_LABELS[i]}
          </div>
        ))}
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// Bloom logo animation
function BloomLogo({ pulse }: { pulse: boolean }) {
  return (
    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
      <motion.div
        className="absolute inset-0 rounded-[2rem] border border-slate-100"
        style={{ background: 'linear-gradient(135deg, #fff 0%, #f1f5ff 100%)' }}
        animate={{ boxShadow: pulse
          ? ['0 0 0 0px rgba(99,102,241,0.3)', '0 0 0 16px rgba(99,102,241,0)', '0 0 0 0px rgba(99,102,241,0)']
          : '0 8px 30px -8px rgba(0,0,0,0.10)'
        }}
        transition={{ repeat: pulse ? Infinity : 0, duration: 2, ease: 'easeOut' }}
      />
      <motion.div
        className="z-10 text-3xl font-extrabold flex items-center"
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
      >
        <span className="mr-1">📣</span>
        <span className="text-rose-500">B</span>
        <span className="text-emerald-500">l</span>
        <span className="text-teal-600">o</span>
        <span className="text-amber-400">o</span>
        <span className="text-sky-400">m</span>
      </motion.div>
    </div>
  );
}

// Waveform visualizer
function Waveform({ active }: { active: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-1 h-10 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-25'}`}>
      {[0.6, 1, 0.7, 0.9, 0.5, 0.8, 0.6].map((h, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-indigo-500"
          animate={{ scaleY: active ? [h * 0.3, h, h * 0.3] : 0.2 }}
          transition={{
            repeat: Infinity,
            duration: 0.7 + i * 0.05,
            delay: i * 0.08,
            ease: 'easeInOut'
          }}
          style={{ height: 32, originY: 0.5 }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const {
    currentState,
    initializeFromDB,
    businessContext,
    generatedLogos,
    generatedThemes,
    selectedLogo,
    selectedTheme,
    isGeneratingLogos,
    isGeneratingThemes,
    setSelectedLogo,
    setSelectedTheme,
    setCurrentState,
  } = useOnboardingStore();

  const { isRecording, toggleRecording, sendText } = useVoiceAgent();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    initializeFromDB().catch(console.error);
  }, [initializeFromDB]);

  const handleLogoSelect = useCallback((logo: string, index: number) => {
    setSelectedLogo(logo);
    sendText(`The user has selected logo option number ${index + 1}. Please acknowledge and move to the theme selection step.`);
    setTimeout(() => setCurrentState('THEME_SELECTION'), 800);
  }, [setSelectedLogo, sendText, setCurrentState]);

  const handleThemeSelect = useCallback((theme: string, index: number) => {
    setSelectedTheme(theme);
    sendText(`The user has selected brand style number ${index + 1}. Please congratulate them and complete the onboarding.`);
    setTimeout(() => setCurrentState('COMPLETE'), 800);
  }, [setSelectedTheme, sendText, setCurrentState]);

  if (!isClient) return null;

  const isContextStage = ['CONTEXT_GATHERING', 'LOGO_ACQUISITION', 'THEME_SELECTION', 'COMPLETE'].includes(currentState);
  const showLogo = currentState === 'LOGO_ACQUISITION';
  const showTheme = currentState === 'THEME_SELECTION';
  const isComplete = currentState === 'COMPLETE';

  return (
    <main className="flex min-h-[100dvh] flex-col items-center p-5 bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="w-full flex justify-between items-center py-3 mb-2 max-w-md">
        <div className="w-9 h-9 rounded-full overflow-hidden shadow-sm bg-slate-200">
          <div className="w-full h-full bg-cover" style={{ backgroundImage: "url('https://api.dicebear.com/7.x/avataaars/svg?seed=Bloom')" }} />
        </div>
        <h1 className="text-xl font-bold text-indigo-950 tracking-tight">Bloom</h1>
        <button className="p-2 rounded-full text-slate-400 hover:bg-slate-200 transition-colors">
          <Settings size={20} />
        </button>
      </header>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-5">
        <ProgressBar currentState={currentState} />
      </div>

      {/* Scrollable center stage */}
      <div className="flex-1 w-full max-w-md flex flex-col items-center gap-5 overflow-y-auto pb-4">

        {/* Bloom logo — shrinks when context is visible */}
        <AnimatePresence mode="popLayout">
          {!isComplete && (
            <motion.div
              key="bloom-logo"
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <BloomLogo pulse={isRecording} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Business card — appears once we have a name */}
        <AnimatePresence>
          {isContextStage && businessContext.businessName && (
            <BusinessCardReveal
              businessName={businessContext.businessName}
              businessLocation={businessContext.businessLocation}
              businessCategory={businessContext.businessCategory}
              primaryProducts={businessContext.primaryProducts}
            />
          )}
        </AnimatePresence>

        {/* Greeting / prompt card */}
        <AnimatePresence mode="wait">
          {currentState === 'GREETING' && (
            <motion.div
              key="greeting"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center"
            >
              <p className="text-lg font-semibold text-slate-700">👋 Let's set up your business</p>
              <p className="text-sm text-slate-400 mt-1">
                {isRecording ? 'Bloom is listening…' : 'Tap the microphone to start'}
              </p>
            </motion.div>
          )}

          {currentState === 'CONTEXT_GATHERING' && !businessContext.businessName && (
            <motion.div
              key="gathering"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center"
            >
              <p className="text-sm text-slate-400">
                {isRecording ? '🎙️ Listening to you…' : 'Tell Bloom about your business'}
              </p>
            </motion.div>
          )}

          {isComplete && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-full rounded-2xl overflow-hidden shadow-lg border border-indigo-100"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}
            >
              <div className="p-6 text-center text-white">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-5xl mb-3"
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl font-extrabold mb-1">{businessContext.businessName}</h2>
                <p className="text-indigo-200 text-sm">Your Bloom profile is ready!</p>
                {selectedLogo && (
                  <div className="mt-4 w-16 h-16 mx-auto rounded-xl overflow-hidden border-2 border-white/40">
                    <img src={selectedLogo} alt="Selected logo" className="w-full h-full object-contain bg-white p-1" />
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-5 px-6 py-3 bg-white text-indigo-600 font-bold rounded-full shadow-md text-sm"
                >
                  Launch First Campaign 🚀
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logo Selector */}
        <AnimatePresence>
          {showLogo && (isGeneratingLogos || generatedLogos.length > 0) && (
            <LogoSelector
              logos={generatedLogos}
              isGenerating={isGeneratingLogos}
              selectedLogo={selectedLogo}
              onSelect={handleLogoSelect}
            />
          )}
        </AnimatePresence>

        {/* Theme Selector */}
        <AnimatePresence>
          {showTheme && (isGeneratingThemes || generatedThemes.length > 0) && (
            <ThemeSelector
              themes={generatedThemes}
              isGenerating={isGeneratingThemes}
              selectedTheme={selectedTheme}
              onSelect={handleThemeSelect}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom mic button + waveform */}
      <div className="w-full max-w-md flex flex-col items-center gap-3 pt-4 pb-6">
        <Waveform active={isRecording} />
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={toggleRecording}
          className={`w-20 h-20 rounded-full shadow-lg flex items-center justify-center relative transition-colors ${
            isRecording
              ? 'bg-rose-500 text-white'
              : 'bg-white text-indigo-600 border border-slate-100'
          }`}
        >
          {isRecording && (
            <motion.div
              className="absolute inset-0 rounded-full bg-rose-500"
              animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
            />
          )}
          {isRecording ? (
            <MicOff size={30} className="z-10" />
          ) : (
            <Mic size={30} className="z-10" />
          )}
        </motion.button>
        <p className="text-xs text-slate-400 font-medium">
          {isRecording ? 'Tap to stop' : 'Tap to talk to Bloom'}
        </p>
      </div>
    </main>
  );
}
