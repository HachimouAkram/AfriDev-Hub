import { Injectable, signal } from '@angular/core';

export interface Language {
  code: string;
  label: string;
  flag: string;
  voiceVoice?: string;
  greeting: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', greeting: 'Bienvenue sur AfriDev Hub !' },
  { code: 'en', label: 'English', flag: '🇬🇧', greeting: 'Welcome to AfriDev Hub!' },
  { code: 'wo', label: 'Wolof', flag: '🇸🇳', greeting: 'Dalal ak jàmm ci AfriDev Hub !' },
  { code: 'sw', label: 'Kiswahili', flag: '🇹🇿', greeting: 'Karibu kwenye AfriDev Hub!' },
  { code: 'es', label: 'Español', flag: '🇪🇸', greeting: '¡Bienvenido a AfriDev Hub!' }
];

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly STORAGE_KEY = 'afridev_lang';
  
  currentLang = signal<Language>(SUPPORTED_LANGUAGES[0]);
  languages = SUPPORTED_LANGUAGES;

  constructor() {
    this.initLanguage();
  }

  private initLanguage(): void {
    if (typeof window === 'undefined') return;
    const savedCode = localStorage.getItem(this.STORAGE_KEY);
    if (savedCode) {
      const match = this.languages.find(l => l.code === savedCode);
      if (match) {
        this.currentLang.set(match);
      }
    }
  }

  setLanguage(lang: Language): void {
    this.currentLang.set(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, lang.code);
    }
  }

  /**
   * Synthèse vocale de la langue (Prononciation africaine & internationale)
   */
  speakGreeting(lang?: Language): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const targetLang = lang || this.currentLang();
    window.speechSynthesis.cancel(); // Stoppe toute voix en cours

    const utterance = new SpeechSynthesisUtterance(targetLang.greeting);
    
    // Configurer le code voix correspondant
    switch (targetLang.code) {
      case 'fr':
        utterance.lang = 'fr-FR';
        break;
      case 'en':
        utterance.lang = 'en-US';
        break;
      case 'es':
        utterance.lang = 'es-ES';
        break;
      case 'sw':
        utterance.lang = 'sw';
        break;
      case 'wo':
        // Pour le wolof, fallback avec prononciation phonétique claire
        utterance.lang = 'fr-SN';
        break;
      default:
        utterance.lang = 'fr-FR';
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}
