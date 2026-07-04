import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system' | 'forest' | 'ocean' | 'rose';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private document = inject(DOCUMENT);
  private readonly STORAGE_KEY = 'hrm_theme';

  mode = signal<ThemeMode>('light');
  private mediaQuery: MediaQueryList;

  constructor() {
    this.mediaQuery = this.document.defaultView!.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', () => {
      if (this.mode() === 'system') {
        this.applyTheme('system');
      }
    });
    this.restore();
    effect(() => this.applyTheme(this.mode()));
  }

  private restore() {
    const stored = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
    const mode = stored || 'light';
    this.mode.set(mode);
    this.applyTheme(mode);
  }

  private applyTheme(mode: ThemeMode) {
    const el = this.document.documentElement;
    el.classList.remove('dark', 'forest', 'ocean', 'rose');
    if (mode === 'dark') {
      el.classList.add('dark');
    } else if (mode === 'system') {
      if (this.mediaQuery.matches) el.classList.add('dark');
    } else if (mode === 'forest') {
      el.classList.add('forest');
    } else if (mode === 'ocean') {
      el.classList.add('ocean');
    } else if (mode === 'rose') {
      el.classList.add('rose');
    }
    localStorage.setItem(this.STORAGE_KEY, mode);
  }
}
