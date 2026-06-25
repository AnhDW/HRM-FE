import { Injectable, inject, signal, computed } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Tutorial, TutorialState, TutorialStep, TUTORIALS, STORAGE_KEY } from './tutorial.types';

@Injectable({ providedIn: 'root' })
export class TutorialService {
  private auth = inject(AuthService);

  tutorials = signal<Tutorial[]>([]);
  currentTutorial = signal<Tutorial | null>(null);
  currentStepIndex = signal(0);
  isActive = signal(false);
  state = signal<TutorialState>({ completed: [], dismissed: false });

  currentStep = computed<TutorialStep | null>(() => {
    const t = this.currentTutorial();
    if (!t) return null;
    return t.steps[this.currentStepIndex()] ?? null;
  });

  isLastStep = computed(() => {
    const t = this.currentTutorial();
    return t ? this.currentStepIndex() >= t.steps.length - 1 : false;
  });

  init() {
    this.restoreState();
    this.tutorials.set(TUTORIALS);
  }

  start(tutorial: Tutorial) {
    this.currentTutorial.set(tutorial);
    this.currentStepIndex.set(0);
    this.isActive.set(true);
  }

  startById(tutorialId: string) {
    const t = this.tutorials().find(x => x.tutorialId === tutorialId);
    if (t) this.start(t);
  }

  next() {
    const t = this.currentTutorial();
    if (!t) return;
    if (this.currentStepIndex() < t.steps.length - 1) {
      this.currentStepIndex.update(i => i + 1);
    }
  }

  prev() {
    if (this.currentStepIndex() > 0) {
      this.currentStepIndex.update(i => i - 1);
    }
  }

  complete() {
    const t = this.currentTutorial();
    if (!t) return;
    const s = this.state();
    if (!s.completed.includes(t.tutorialId)) {
      s.completed.push(t.tutorialId);
    }
    this.state.set({ ...s });
    this.saveState();
    this.finish();
  }

  skip() {
    this.finish();
  }

  dismissAll() {
    this.state.set({ completed: [...this.state().completed], dismissed: true });
    this.saveState();
  }

  shouldShow(tutorialId: string): boolean {
    const s = this.state();
    if (s.dismissed) return false;
    const t = this.tutorials().find(x => x.tutorialId === tutorialId);
    if (!t) return false;
    return t.role === this.auth.currentRole() && !s.completed.includes(tutorialId);
  }

  private finish() {
    this.isActive.set(false);
    this.currentTutorial.set(null);
    this.currentStepIndex.set(0);
  }

  private restoreState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TutorialState;
        this.state.set({
          completed: Array.isArray(parsed.completed) ? parsed.completed : [],
          dismissed: !!parsed.dismissed,
        });
      }
    } catch {
      this.state.set({ completed: [], dismissed: false });
    }
  }

  private saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
  }
}
