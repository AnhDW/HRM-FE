import { Component, inject, signal, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorialService } from './tutorial.service';
import { LucideAngularModule, X, ChevronLeft, ChevronRight, Check } from 'lucide-angular';

@Component({
  selector: 'app-tutorial-overlay',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (service.isActive() && step()) {
      <div class="fixed inset-0 z-[9999]">
        <div class="absolute inset-0 bg-black/60"></div>
        <div class="absolute" [style]="highlightStyle()"></div>
        <div class="absolute" [style]="tooltipStyle()">
          <div class="bg-white rounded-xl shadow-2xl border border-slate-100 w-80">
            <div class="flex items-center justify-between px-4 pt-4 pb-2">
              <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                {{ service.currentStepIndex() + 1 }} / {{ service.currentTutorial()?.steps?.length }}
              </span>
              <button (click)="service.skip()" class="p-1 text-slate-300 hover:text-slate-500 transition-all">
                <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
            <div class="px-4 pb-3">
              <h3 class="font-bold text-slate-900 mb-1">{{ step()?.title }}</h3>
              <p class="text-sm text-slate-500 leading-relaxed">{{ step()?.content }}</p>
            </div>
            <div class="flex items-center justify-between px-4 pb-4 pt-2 border-t border-slate-50">
              <button (click)="service.prev()" [disabled]="service.currentStepIndex() === 0"
                class="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-slate-400 hover:text-slate-900 rounded-lg disabled:opacity-30 transition-all">
                <lucide-icon name="chevron-left" class="w-4 h-4"></lucide-icon>
                Quay lại
              </button>
              @if (service.isLastStep()) {
                <button (click)="service.complete()"
                  class="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all">
                  <lucide-icon name="check" class="w-4 h-4"></lucide-icon>
                  Xong
                </button>
              } @else {
                <button (click)="service.next()"
                  class="px-4 py-1.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all">
                  Tiếp theo
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class TutorialOverlayComponent {
  service = inject(TutorialService);

  step = this.service.currentStep;

  highlightStyle = signal<Record<string, string>>({});
  tooltipStyle = signal<Record<string, string>>({});

  private resizeHandler = () => this.reposition();
  private scrollHandler = () => this.reposition();

  constructor() {
    effect(() => {
      this.step();
      setTimeout(() => this.reposition(), 100);
    });
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  private reposition() {
    const s = this.step();
    if (!s) return;
    const el = document.querySelector(s.targetSelector) as HTMLElement;
    if (!el) return;
    el.scrollIntoView({ behavior: 'auto', block: 'center' });
    const rect = el.getBoundingClientRect();
    const gap = 6;

    const hPad = 20;
    const vPad = 12;

    this.highlightStyle.set({
      top: rect.top - vPad + 'px',
      left: rect.left - hPad + 'px',
      width: rect.width + hPad * 2 + 'px',
      height: rect.height + vPad * 2 + 'px',
      'border-radius': '12px',
      'box-shadow': '0 0 0 4px white, 0 0 0 8px rgba(79, 70, 229, 0.3)',
      transition: 'all 0.2s ease',
    });

    const tooltipWidth = 320;
    const tooltipGap = 12;

    let top = 0;
    let left = 0;

    switch (s.placement) {
      case 'top':
        top = rect.top - vPad - tooltipGap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        top -= 200;
        break;
      case 'bottom':
        top = rect.bottom + vPad + tooltipGap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - 100;
        left = rect.left - hPad - tooltipGap - tooltipWidth;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - 100;
        left = rect.right + hPad + tooltipGap;
        break;
    }

    const maxLeft = window.innerWidth - tooltipWidth - 16;
    if (left < 16) left = 16;
    if (left > maxLeft) left = maxLeft;
    if (top < 16) top = 16;
    if (top + 200 > window.innerHeight) top = window.innerHeight - 216;

    this.tooltipStyle.set({
      position: 'fixed',
      top: top + 'px',
      left: left + 'px',
      'z-index': '10000',
    });
  }
}
