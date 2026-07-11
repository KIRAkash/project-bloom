import { create } from 'zustand';
import { getAsset, getAllContext } from '@/lib/db';

export interface CalendarEvent {
  date: {
    month: string;
    day: string;
  };
  title: string;
  description: string;
}

interface DashboardStore {
  events: CalendarEvent[];
  isGeneratingEvents: boolean;
  selectedEvent: CalendarEvent | null;
  
  campaignImages: Record<string, string[]>; // Map event title to images
  isGeneratingCampaign: boolean;

  activeTab: 'images' | 'videos';
  
  // Data load
  fetchCalendar: () => Promise<void>;
  generateCampaignForEvent: (event: CalendarEvent) => Promise<void>;
  setActiveTab: (tab: 'images' | 'videos') => void;
  setSelectedEvent: (event: CalendarEvent) => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  events: [],
  isGeneratingEvents: false,
  selectedEvent: null,
  campaignImages: {},
  isGeneratingCampaign: false,
  activeTab: 'images',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedEvent: (event) => set({ selectedEvent: event }),

  fetchCalendar: async () => {
    set({ isGeneratingEvents: true });
    try {
      // 1. Check if calendar is in DB already
      const cachedEvents = await getAsset('calendar_events');
      if (cachedEvents && Array.isArray(cachedEvents.data)) {
        set({ events: cachedEvents.data, selectedEvent: cachedEvents.data[0] || null });
        set({ isGeneratingEvents: false });
        return;
      }

      // 2. Fetch context to generate events
      const context = await getAllContext();
      const res = await fetch('/api/generate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessContext: context })
      });
      const data = await res.json();
      
      if (data.events) {
        set({ events: data.events, selectedEvent: data.events[0] || null });
        const { saveAsset } = await import('@/lib/db');
        await saveAsset('calendar_events', data.events, 'json');
      }
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
    } finally {
      set({ isGeneratingEvents: false });
    }
  },

  generateCampaignForEvent: async (event) => {
    const { campaignImages } = get();
    if (campaignImages[event.title]) return; // Already generated

    set({ isGeneratingCampaign: true });
    try {
      const themePromptAsset = await getAsset('theme_design_prompt');
      const context = await getAllContext();

      if (!themePromptAsset) throw new Error('No theme prompt found');

      const res = await fetch('/api/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessContext: context,
          event: event,
          themeDesignPrompt: themePromptAsset.data as string
        })
      });
      const data = await res.json();
      
      if (data.images) {
        set(state => ({
          campaignImages: {
            ...state.campaignImages,
            [event.title]: data.images
          }
        }));
      }
    } catch (err) {
      console.error('Failed to generate campaign:', err);
    } finally {
      set({ isGeneratingCampaign: false });
    }
  }
}));
