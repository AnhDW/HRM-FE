import { Component, inject, signal, viewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Send, Trash2, Square, Bot, User, Loader2, AlertCircle, Sparkles } from 'lucide-angular';
import { Marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AiChatService } from './ai-chat.service';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="flex flex-col bg-slate-50 chat-container" style="height: calc(100vh - 64px - 64px);">
      <!-- Header -->
      <div class="chat-header bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <lucide-icon name="sparkles" class="w-5 h-5 text-white"></lucide-icon>
          </div>
          <div>
            <h1 class="text-lg font-semibold text-slate-900">Trợ lý AI</h1>
            <p class="text-xs text-slate-400">{{ service.loading() ? 'Đang trả lời...' : (service.messages().length > 0 ? service.messages().length + ' tin nhắn' : 'Sẵn sàng') }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          @if (service.loading()) {
            <button (click)="service.stopStreaming()" class="btn-icon text-red-500 hover:bg-red-50" title="Dừng">
              <lucide-icon name="square" class="w-4 h-4"></lucide-icon>
            </button>
          }
          <button (click)="service.clearMessages()" class="btn-icon text-slate-400 hover:text-red-500 hover:bg-red-50" title="Xóa hội thoại">
            <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div #scrollContainer class="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth min-h-0">
        @if (service.messages().length === 0) {
          <div class="h-full flex flex-col items-center justify-center text-center px-4">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mb-4">
              <lucide-icon name="bot" class="w-8 h-8 text-emerald-600"></lucide-icon>
            </div>
            <h2 class="text-lg font-semibold text-slate-900 mb-2">Tôi có thể giúp gì cho bạn?</h2>
            <p class="text-sm text-slate-400 max-w-md">Hỏi tôi về quy trình nhân sự, hướng dẫn sử dụng phần mềm, hoặc bất kỳ câu hỏi nào về hệ thống HRM.</p>
          </div>
        }

        @for (msg of service.messages(); track msg.timestamp || $index) {
          <div class="flex gap-3 {{ msg.role === 'user' ? 'flex-row-reverse' : '' }}">
            @if (msg.role !== 'system') {
              <div class="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center {{ msg.role === 'user' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400' }}">
                <lucide-icon [name]="msg.role === 'user' ? 'user' : 'bot'" class="w-4 h-4"></lucide-icon>
              </div>
            }
            <div
              class="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap {{ msg.role === 'user' ? 'bg-emerald-500 text-white rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-900 rounded-tl-sm shadow-sm' }}"
              [innerHTML]="renderMarkdown(msg.content || '')"
            >
            </div>
          </div>
        }

        @if (service.error(); as error) {
          <div class="flex justify-center">
            <div class="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              <lucide-icon name="alert-circle" class="w-4 h-4 shrink-0"></lucide-icon>
              <span>{{ error }}</span>
            </div>
          </div>
        }

        @if (service.loading()) {
          <div class="flex gap-3">
            <div class="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-slate-200 text-slate-400">
              <lucide-icon name="bot" class="w-4 h-4"></lucide-icon>
            </div>
            <div class="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              @if (service.usingTools()) {
                <div class="flex items-center gap-2 text-slate-400">
                  <lucide-icon name="loader-2" class="w-4 h-4 animate-spin"></lucide-icon>
                  <span class="text-sm">Đang truy vấn dữ liệu...</span>
                </div>
              } @else {
                <div class="flex items-center gap-1.5 py-0.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style="animation-delay:0ms;animation-duration:1.2s"></span>
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style="animation-delay:200ms;animation-duration:1.2s"></span>
                  <span class="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" style="animation-delay:400ms;animation-duration:1.2s"></span>
                </div>
              }
            </div>
          </div>
        }

        <div #scrollAnchor></div>
      </div>

      <!-- Input -->
      <div class="bg-white border-t border-slate-100 px-4 py-4 shrink-0">
        <form (ngSubmit)="sendMessage()" class="flex gap-3 max-w-4xl mx-auto">
          <input
            [(ngModel)]="inputText"
            name="chatInput"
            placeholder="Nhập câu hỏi..."
            [disabled]="service.loading()"
            class="flex-1 px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            [disabled]="!inputText.trim() || service.loading()"
            class="px-5 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            @if (service.loading()) {
              <lucide-icon name="loader-2" class="w-4 h-4 animate-spin"></lucide-icon>
            } @else {
              <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
            }
            <span class="hidden sm:inline">Gửi</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .btn-icon { @apply p-2 rounded-lg transition-all duration-200; }
    :host ::ng-deep p { margin: 0; }
    :host ::ng-deep code {
      @apply bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono;
    }
    :host ::ng-deep pre {
      @apply bg-slate-900 text-slate-100 rounded-xl p-4 my-2 overflow-x-auto text-xs;
    }
    :host ::ng-deep pre code {
      @apply bg-transparent text-inherit px-0 py-0;
    }
    :host ::ng-deep ul, :host ::ng-deep ol {
      @apply ml-5 my-1;
    }
    :host ::ng-deep ul { @apply list-disc; }
    :host ::ng-deep ol { @apply list-decimal; }
    :host ::ng-deep li { @apply mb-0.5; }
    :host ::ng-deep h3 { @apply text-base font-semibold mt-3 mb-1; }
    :host ::ng-deep strong { @apply font-semibold; }
    :host ::ng-deep table {
      @apply w-full border-collapse my-2 text-xs;
    }
    :host ::ng-deep th {
      @apply bg-slate-100 text-slate-700 font-semibold px-3 py-2 border border-slate-200 text-left;
    }
    :host ::ng-deep td {
      @apply px-3 py-2 border border-slate-200;
    }
    :host ::ng-deep .bg-emerald-500 code {
      @apply bg-emerald-400 text-white;
    }
    :host ::ng-deep .bg-emerald-500 pre {
      @apply bg-emerald-700;
    }
    :host ::ng-deep .bg-emerald-500 pre code {
      @apply bg-transparent;
    }
    :host ::ng-deep a {
      @apply text-emerald-600 underline;
    }

    /* Dark mode overrides for chat-specific elements */
    :host-context(.dark) .chat-container {
      background-color: #0f172a;
    }
    :host-context(.dark) .chat-header {
      background-color: #1e293b;
      border-color: #334155;
    }
    :host-context(.dark) :host ::ng-deep th {
      background-color: #1e293b;
      border-color: #334155;
    }
    :host-context(.dark) :host ::ng-deep td {
      border-color: #334155;
    }
    :host-context(.dark) :host ::ng-deep code {
      background-color: #1e293b;
      color: #e2e8f0;
    }
    :host-context(.dark) :host ::ng-deep .border-red-200 {
      border-color: #7f1d1d;
    }
    :host-context(.dark) :host ::ng-deep .bg-emerald-100 {
      background-color: #064e3b;
    }
    :host-context(.dark) :host ::ng-deep .from-emerald-100 {
      --tw-gradient-from: #064e3b;
    }
    :host-context(.dark) :host ::ng-deep .to-emerald-200 {
      --tw-gradient-to: #065f46;
    }
  `]
})
export class AiChatComponent implements AfterViewInit {
  service = inject(AiChatService);
  private sanitizer = inject(DomSanitizer);
  private marked = new Marked({ breaks: true, gfm: true });

  inputText = '';

  scrollContainer = viewChild<ElementRef>('scrollContainer');
  scrollAnchor = viewChild<ElementRef>('scrollAnchor');

  constructor() {
    effect(() => {
      this.service.messages();
      setTimeout(() => this.scrollToBottom(), 50);
    });
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  sendMessage() {
    const text = this.inputText.trim();
    if (!text || this.service.loading()) return;
    this.inputText = '';
    this.service.sendMessage(text);
  }

  renderMarkdown(content: string): SafeHtml {
    if (!content) return '';
    const html = this.marked.parse(content) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private scrollToBottom() {
    try {
      this.scrollAnchor()?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }
}
