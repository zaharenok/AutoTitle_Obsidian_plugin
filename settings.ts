export interface AutoTitleSettings {
  apiKey: string;
  model: string;
  temperature: number;
  autoTrigger: boolean;
  language: string;
  replaceMode: boolean;
  timeout: number;
  minContentLength: number;
  triggerMode: 'manual' | 'auto' | 'semi-auto';
  showIndicator: boolean;
  generationCount: number;
  maxTitleLength: number;
  includeExistingTitle: boolean;
  excludedNotes: string[];
}

export const DEFAULT_SETTINGS: AutoTitleSettings = {
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.3,
  autoTrigger: false,
  language: 'auto',
  replaceMode: false,
  timeout: 5000,
  minContentLength: 100,
  triggerMode: 'manual',
  showIndicator: true,
  generationCount: 1,
  maxTitleLength: 100,
  includeExistingTitle: false,
  excludedNotes: []
};
