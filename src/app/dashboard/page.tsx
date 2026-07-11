'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Mic, Camera, CalendarDays, ImageIcon, Film, Play, Loader2, X, Sparkles } from 'lucide-react';
import { useDashboardStore, CalendarEvent } from '@/store/useDashboardStore';

export default function Dashboard() {
  const {
    events,
    isGeneratingEvents,
    selectedEvent,
    campaignImages,
    isGeneratingCampaign,
    activeTab,
    fetchCalendar,
    generateCampaignForEvent,
    setActiveTab,
    setSelectedEvent
  } = useDashboardStore();

  const [showEventModal, setShowEventModal] = useState(false);
  const [modalEvent, setModalEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  // Auto-generate for the very first event on initial load
  useEffect(() => {
    if (events.length > 0 && selectedEvent && !isGeneratingCampaign) {
      if (!campaignImages[selectedEvent.title]) {
        generateCampaignForEvent(selectedEvent);
      }
    }
  }, [events, selectedEvent, campaignImages, generateCampaignForEvent]);

  const handleEventClick = (ev: CalendarEvent) => {
    setSelectedEvent(ev);
    // If we already have images for this event, or it's currently generating, just switch views
    if (campaignImages[ev.title] || (isGeneratingCampaign && selectedEvent?.title === ev.title)) {
      setShowEventModal(false);
      return;
    }
    // Otherwise, show the generation modal
    setModalEvent(ev);
    setShowEventModal(true);
  };

  const startGeneration = () => {
    if (modalEvent) {
      generateCampaignForEvent(modalEvent);
      setShowEventModal(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 flex items-center justify-between px-4 md:px-8 shrink-0">
        <img src="/logo.png" alt="Bloom Logo" className="h-6 object-contain" />
        <button className="p-2 rounded-full text-slate-400 hover:bg-slate-200 transition-colors">
          <Settings size={20} />
        </button>
      </header>

      {/* Compact Calendar Strip */}
      <div className="w-full bg-white border-b border-slate-100 py-3 shrink-0 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] z-30 relative">
        <div className="px-4 mb-2 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <CalendarDays size={14} className="text-brand-primary" />
          <span>Marketing Calendar</span>
        </div>
        
        <div className="flex overflow-x-auto px-4 pb-2 gap-3 snap-x no-scrollbar">
          {isGeneratingEvents ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="min-w-[60px] h-[70px] bg-slate-100 rounded-xl animate-pulse flex-shrink-0" />
            ))
          ) : (
            events.map((ev, i) => {
              const isSelected = selectedEvent?.title === ev.title;
              const hasContent = !!campaignImages[ev.title];
              return (
                <button
                  key={i}
                  onClick={() => handleEventClick(ev)}
                  className={`min-w-[64px] flex flex-col items-center flex-shrink-0 snap-start rounded-xl p-2 transition-all border-2 relative ${
                    isSelected
                      ? 'border-brand-primary bg-brand-primary/5 shadow-md scale-105'
                      : 'border-slate-100 bg-white hover:border-brand-primary/30'
                  }`}
                >
                  {hasContent && !isSelected && (
                     <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                  <span className={`text-[10px] font-bold uppercase mb-1 ${isSelected ? 'text-brand-primary' : 'text-slate-400'}`}>
                    {ev.date.month}
                  </span>
                  <span className={`text-xl font-extrabold leading-none ${isSelected ? 'text-brand-secondary' : 'text-slate-700'}`}>
                    {ev.date.day}
                  </span>
                  {/* Small dot if not generated yet */}
                  {!hasContent && (
                    <div className="mt-1.5 w-1 h-1 rounded-full bg-slate-300" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Tabs & Active Event Title */}
      <div className="px-4 mt-5 mb-4 shrink-0 flex flex-col gap-4">
        {selectedEvent && (
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-800">{selectedEvent.title}</h2>
            <p className="text-xs text-slate-500 line-clamp-1">{selectedEvent.description}</p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('images')}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'images' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-200 text-slate-600'
            }`}
          >
            <ImageIcon size={16} /> Posters
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'videos' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-200 text-slate-600'
            }`}
          >
            <Film size={16} /> Videos
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'images' ? (
            <motion.div
              key="images"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="grid grid-cols-2 gap-4"
            >
              {isGeneratingCampaign && selectedEvent && !campaignImages[selectedEvent.title] ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="w-full aspect-[9/16] bg-slate-200 rounded-xl animate-pulse flex flex-col items-center justify-center gap-2">
                    <Loader2 className="animate-spin text-slate-400" />
                    <span className="text-[10px] text-slate-400 font-medium">Designing...</span>
                  </div>
                ))
              ) : selectedEvent && campaignImages[selectedEvent.title] ? (
                campaignImages[selectedEvent.title].map((img, i) => (
                  <div key={i} className="w-full aspect-[9/16] bg-slate-100 rounded-xl overflow-hidden shadow-sm border border-slate-200 relative group">
                    <img src={img} alt="Generated Campaign" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="px-4 py-2 bg-white text-slate-900 rounded-full text-xs font-bold shadow-lg scale-90 group-hover:scale-100 transition-transform">
                        Share
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-slate-400 py-10 text-sm">
                  No images generated for this event yet.
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="videos"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="grid grid-cols-2 gap-4"
            >
              {[1, 2].map((i) => (
                <div key={i} className="w-full aspect-[9/16] bg-slate-900 rounded-xl overflow-hidden shadow-sm relative group">
                  <div className="absolute inset-0 opacity-40 bg-gradient-to-tr from-brand-primary to-brand-secondary" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 group-hover:scale-110 transition-transform cursor-pointer">
                      <Play className="text-white fill-white ml-1" size={20} />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 text-white text-[10px] font-bold bg-black/40 px-2 py-1 rounded-md">
                    0:15
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 pb-6 pt-10 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent flex justify-center items-center pointer-events-none z-40">
        <div className="bg-white/90 backdrop-blur-xl p-2 rounded-full shadow-2xl border border-slate-200/50 flex items-center gap-2 pointer-events-auto">
          <button className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
            <Camera size={20} />
          </button>
          
          <button className="w-16 h-16 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-[0_0_20px_rgba(31,84,92,0.4)] hover:scale-105 active:scale-95 transition-transform">
            <Mic size={28} />
          </button>
          
          <button className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Generation Modal */}
      <AnimatePresence>
        {showEventModal && modalEvent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
              onClick={() => setShowEventModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 p-6 pb-12"
            >
              <button 
                onClick={() => setShowEventModal(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold uppercase text-brand-primary leading-none mb-0.5">{modalEvent.date.month}</span>
                  <span className="text-lg font-extrabold text-brand-primary leading-none">{modalEvent.date.day}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{modalEvent.title}</h3>
                  <p className="text-xs text-brand-secondary font-semibold">Upcoming Opportunity</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                {modalEvent.description}
              </p>

              <button 
                onClick={startGeneration}
                className="w-full py-4 bg-brand-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/30 hover:bg-brand-primary/90 transition-colors"
              >
                <Sparkles size={18} />
                Generate Campaign
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
