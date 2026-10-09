import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'afridev_theme';
  currentTheme = signal<ThemeMode>('dark');

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    if (typeof window === 'undefined') return;

    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.setTheme(savedTheme);
    } else {
      // Default to dark theme as per AfriDev obsidian design
      this.setTheme('dark');
    }
  }

  toggleTheme(): void {
    const nextTheme: ThemeMode = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  setTheme(mode: ThemeMode): void {
    this.currentTheme.set(mode);
    if (typeof window === 'undefined') return;

    localStorage.setItem(this.STORAGE_KEY, mode);
    if (mode === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }

  isDark(): boolean {
    return this.currentTheme() === 'dark';
  }
}
