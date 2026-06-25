import { Component, inject, input } from '@angular/core';
import { LucideAngularModule, BookOpen } from 'lucide-angular';
import { TutorialService } from './tutorial.service';

@Component({
  selector: 'app-tutorial-button',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <button (click)="tutorial.startById(tutorialId())"
      class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-100 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-xl font-bold transition-all shadow-soft text-sm">
      <lucide-icon name="book-open" class="w-4 h-4"></lucide-icon>
      Xem hướng dẫn
    </button>
  `,
})
export class TutorialButtonComponent {
  tutorial = inject(TutorialService);
  tutorialId = input.required<string>();
}
