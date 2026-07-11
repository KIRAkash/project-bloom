import { create } from 'zustand';
import { saveContext, getAllContext } from '@/lib/db';

export type OnboardingState = 'GREETING' | 'CONTEXT_GATHERING' | 'LOGO_ACQUISITION' | 'THEME_SELECTION' | 'COMPLETE';

export interface ThemeItem {
  name: string;
  image: string;
}

interface OnboardingStore {
  currentState: OnboardingState;
  businessContext: Record<string, any>;
  isInitialized: boolean;
  // Image generation state
  generatedLogos: string[];
  generatedThemes: ThemeItem[];
  selectedLogo: string | null;
  selectedTheme: ThemeItem | null;
  isGeneratingLogos: boolean;
  isGeneratingThemes: boolean;
  // Actions
  setCurrentState: (state: OnboardingState) => void;
  updateContext: (key: string, value: any) => Promise<void>;
  nextState: () => void;
  initializeFromDB: () => Promise<void>;
  setGeneratedLogos: (logos: string[]) => void;
  setGeneratedThemes: (themes: ThemeItem[]) => void;
  setSelectedLogo: (logo: string) => void;
  setSelectedTheme: (theme: ThemeItem) => void;
  setIsGeneratingLogos: (val: boolean) => void;
  setIsGeneratingThemes: (val: boolean) => void;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  currentState: 'GREETING',
  businessContext: {},
  isInitialized: false,
  generatedLogos: [],
  generatedThemes: [],
  selectedLogo: null,
  selectedTheme: null,
  isGeneratingLogos: false,
  isGeneratingThemes: false,

  setCurrentState: (state) => set({ currentState: state }),

  updateContext: async (key, value) => {
    await saveContext(key, value);
    set((state) => ({
      businessContext: { ...state.businessContext, [key]: value }
    }));
  },

  nextState: () => {
    const { currentState } = get();
    const states: OnboardingState[] = [
      'GREETING',
      'CONTEXT_GATHERING',
      'LOGO_ACQUISITION',
      'THEME_SELECTION',
      'COMPLETE'
    ];
    const currentIndex = states.indexOf(currentState);
    if (currentIndex < states.length - 1) {
      set({ currentState: states[currentIndex + 1] });
    }
  },

  initializeFromDB: async () => {
    const context = await getAllContext();
    set({ businessContext: context, isInitialized: true });
  },

  setGeneratedLogos: (logos) => set({ generatedLogos: logos }),
  setGeneratedThemes: (themes) => set({ generatedThemes: themes }),
  setSelectedLogo: (logo) => set({ selectedLogo: logo }),
  setSelectedTheme: (theme) => set({ selectedTheme: theme }),
  setIsGeneratingLogos: (val) => set({ isGeneratingLogos: val }),
  setIsGeneratingThemes: (val) => set({ isGeneratingThemes: val }),
}));
