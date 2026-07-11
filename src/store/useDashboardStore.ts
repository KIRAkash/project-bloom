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
  campaignVideos: Record<string, string[]>; // Map event title to videos
  isGeneratingCampaign: boolean;
  isGeneratingVideoCampaign: boolean;
  themeDesignPrompt: string | null;
  logoImage: string | null;

  activeTab: 'images' | 'videos';
  
  // Data load
  fetchCalendar: () => Promise<void>;
  generateCampaignForEvent: (event: CalendarEvent) => Promise<void>;
  generateVideoCampaignForEvent: (event: CalendarEvent) => Promise<void>;
  setActiveTab: (tab: 'images' | 'videos') => void;
  setSelectedEvent: (event: CalendarEvent) => void;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  events: [],
  isGeneratingEvents: false,
  selectedEvent: null,
  campaignImages: {},
  campaignVideos: {},
  isGeneratingCampaign: false,
  isGeneratingVideoCampaign: false,
  themeDesignPrompt: null,
  logoImage: null,
  activeTab: 'images',

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedEvent: (event) => set({ selectedEvent: event }),

  fetchCalendar: async () => {
    // Prevent fetching if already generating
    if (get().isGeneratingEvents) return;
    set({ isGeneratingEvents: true });
    try {
      const themePromptAsset = await getAsset('theme_design_prompt');
      if (themePromptAsset && themePromptAsset.data) {
        set({ themeDesignPrompt: themePromptAsset.data as string });
        console.log('%c[Bloom Debug] %cExtracted Brand Theme:', 'color: #ea580c; font-weight: bold;', 'color: #92400e;');
        console.log(themePromptAsset.data as string);
      }
      
      const logoAsset = await getAsset('logo');
      if (logoAsset && logoAsset.data) {
        set({ logoImage: logoAsset.data as string });
      }

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
      const logoAsset = await getAsset('logo');
      const context = await getAllContext();

      if (!themePromptAsset) throw new Error('No theme prompt found');

      const res = await fetch('/api/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessContext: context,
          event: event,
          themeDesignPrompt: themePromptAsset.data as string,
          referenceImage: logoAsset?.data || undefined
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
  },

  generateVideoCampaignForEvent: async (event) => {
    const { campaignVideos } = get();
    if (campaignVideos[event.title]) return; // Already generated

    set({ isGeneratingVideoCampaign: true });
    try {
      const themePromptAsset = await getAsset('theme_design_prompt');
      const logoAsset = await getAsset('logo');
      const context = await getAllContext();

      if (!themePromptAsset) throw new Error('No theme prompt found');

      const res = await fetch('/api/generate-video-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessContext: context,
          event: event,
          themeDesignPrompt: themePromptAsset.data as string,
          referenceImage: logoAsset?.data || undefined
        })
      });
      const data = await res.json();
      
      if (data.videos) {
        set(state => ({
          campaignVideos: {
            ...state.campaignVideos,
            [event.title]: data.videos
          }
        }));
      }
    } catch (err) {
      console.error('Failed to generate video campaign:', err);
    } finally {
      set({ isGeneratingVideoCampaign: false });
    }
  }
}));
