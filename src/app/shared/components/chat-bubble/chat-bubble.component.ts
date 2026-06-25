import { Component, inject, signal, viewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Send, Trash2, Square, Bot, User, Loader2, AlertCircle, Sparkles, X } from 'lucide-angular';
import { Marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AiChatService } from '../../../features/ai-chat/ai-chat.service';
import { ChatBubbleService } from './chat-bubble.service';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <!-- Floating button (hidden when panel is open) -->
    @if (!isOpen()) {
      <button
        (click)="open()"
        class="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-700/30 hover:shadow-emerald-700/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center"
      >
        <lucide-icon name="sparkles" class="w-6 h-6 text-white"></lucide-icon>
        @if (hasUnread()) {
          <span class="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-md">
            {{ unreadCount() }}
          </span>
        }
      </button>
    }

    <!-- Chat panel -->
    @if (isOpen()) {
      <!-- Mobile backdrop -->
      <div
        (click)="close()"
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] md:hidden animate-in fade-in duration-200"
      ></div>

      <div
        class="fixed z-[70] flex flex-col bg-white dark:bg-slate-900 shadow-2xl shadow-slate-900/20 border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-200
               inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[600px] md:rounded-2xl"
      >
        <!-- Header -->
        <div class="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <lucide-icon name="sparkles" class="w-4 h-4 text-white"></lucide-icon>
            </div>
            <div>
              <h2 class="text-sm font-bold text-slate-900 dark:text-white">Trợ lý AI</h2>
              <p class="text-[10px] text-slate-400 dark:text-slate-500">
                {{ service.loading() ? 'Đang trả lời...' : (service.messages().length > 0 ? service.messages().length + ' tin nhắn' : 'Sẵn sàng') }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1">
            @if (service.loading()) {
              <button (click)="service.stopStreaming()" class="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all" title="Dừng">
                <lucide-icon name="square" class="w-4 h-4"></lucide-icon>
              </button>
            }
            <button (click)="service.clearMessages()" class="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all" title="Xóa hội thoại">
              <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
            </button>
            <button (click)="close()" class="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all" title="Đóng">
              <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div #scrollContainer class="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth min-h-0 bg-slate-50/50 dark:bg-slate-950/50">
          @if (service.messages().length === 0) {
            <div class="h-full flex flex-col items-center justify-center text-center px-4">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 flex items-center justify-center mb-3">
                <lucide-icon name="bot" class="w-6 h-6 text-emerald-600 dark:text-emerald-400"></lucide-icon>
              </div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-1">Tôi có thể giúp gì cho bạn?</h3>
              <p class="text-xs text-slate-400 dark:text-slate-500 max-w-xs">Hỏi tôi về quy trình nhân sự, hướng dẫn sử dụng phần mềm, hoặc bất kỳ câu hỏi nào về hệ thống HRM.</p>
            </div>
          }

          @for (msg of service.messages(); track msg.timestamp || $index) {
            <div class="flex gap-2 {{ msg.role === 'user' ? 'flex-row-reverse' : '' }}">
              @if (msg.role !== 'system') {
                <div class="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center {{ msg.role === 'user' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500' }}">
                  <lucide-icon [name]="msg.role === 'user' ? 'user' : 'bot'" class="w-3.5 h-3.5"></lucide-icon>
                </div>
              }
              <div
                class="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap {{ msg.role === 'user' ? 'bg-emerald-500 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-200 rounded-tl-sm shadow-sm' }}"
                [innerHTML]="renderMarkdown(msg.content || '')"
              >
              </div>
            </div>
          }

          @if (service.error(); as error) {
            <div class="flex justify-center">
              <div class="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
                <lucide-icon name="alert-circle" class="w-3.5 h-3.5 shrink-0"></lucide-icon>
                <span>{{ error }}</span>
              </div>
            </div>
          }

          @if (service.loading()) {
            <div class="flex gap-2">
              <div class="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                <lucide-icon name="bot" class="w-3.5 h-3.5"></lucide-icon>
              </div>
              <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm">
                @if (service.usingTools()) {
                  <div class="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                    <lucide-icon name="loader-2" class="w-3.5 h-3.5 animate-spin"></lucide-icon>
                    <span class="text-xs">Đang truy vấn dữ liệu...</span>
                  </div>
                } @else {
                  <div class="flex items-center gap-1.5 py-0.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style="animation-delay:0ms;animation-duration:1.2s"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style="animation-delay:200ms;animation-duration:1.2s"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" style="animation-delay:400ms;animation-duration:1.2s"></span>
                  </div>
                }
              </div>
            </div>
          }

          <div #scrollAnchor></div>
        </div>

        <!-- Input -->
        <div class="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 py-3 shrink-0">
          <form (ngSubmit)="sendMessage()" class="flex gap-2">
            <input
              [(ngModel)]="inputText"
              name="chatInput"
              placeholder="Nhập câu hỏi..."
              [disabled]="service.loading()"
              class="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            />
            <button
              type="submit"
              [disabled]="!inputText.trim() || service.loading()"
              class="px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shrink-0"
            >
              @if (service.loading()) {
                <lucide-icon name="loader-2" class="w-4 h-4 animate-spin"></lucide-icon>
              } @else {
                <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
              }
            </button>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    :host ::ng-deep .chat-msg p { margin: 0; }
    :host ::ng-deep .chat-msg code {
      background-color: rgba(0,0,0,0.08);
      padding: 1px 4px;
      border-radius: 4px;
      font-size: 10px;
      font-family: monospace;
    }
    :host ::ng-deep .chat-msg pre {
      background: #0f172a;
      color: #e2e8f0;
      border-radius: 8px;
      padding: 8px;
      margin: 4px 0;
      overflow-x: auto;
      font-size: 10px;
    }
    :host ::ng-deep .chat-msg pre code {
      background: transparent;
      padding: 0;
    }
    :host ::ng-deep .chat-msg ul, :host ::ng-deep .chat-msg ol {
      margin-left: 16px;
      margin-top: 4px;
      margin-bottom: 4px;
    }
    :host ::ng-deep .chat-msg ul { list-style-type: disc; }
    :host ::ng-deep .chat-msg ol { list-style-type: decimal; }
    :host ::ng-deep .chat-msg li { margin-bottom: 2px; }
    :host ::ng-deep .chat-msg h3 { font-size: 13px; font-weight: 600; margin-top: 8px; margin-bottom: 4px; }
    :host ::ng-deep .chat-msg strong { font-weight: 600; }
    :host ::ng-deep .chat-msg a { color: #059669; text-decoration: underline; }
    :host ::ng-deep .chat-msg table { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 10px; }
    :host ::ng-deep .chat-msg th {
      background: #f1f5f9;
      font-weight: 600;
      padding: 4px 8px;
      border: 1px solid #e2e8f0;
      text-align: left;
    }
    :host ::ng-deep .chat-msg td {
      padding: 4px 8px;
      border: 1px solid #e2e8f0;
    }
    :host ::ng-deep .bg-emerald-500 .chat-msg code {
      background: rgba(255,255,255,0.2);
      color: white;
    }
    :host ::ng-deep .bg-emerald-500 .chat-msg pre {
      background: rgba(0,0,0,0.3);
    }
    :host ::ng-deep .bg-emerald-500 .chat-msg pre code {
      background: transparent;
    }
    .dark :host ::ng-deep .chat-msg th {
      background: #1e293b;
      border-color: #334155;
    }
    .dark :host ::ng-deep .chat-msg td {
      border-color: #334155;
    }
    .dark :host ::ng-deep .chat-msg code {
      background: #1e293b;
      color: #e2e8f0;
    }
  `]
})
export class ChatBubbleComponent implements AfterViewInit {
  service = inject(AiChatService);
  private bubbleService = inject(ChatBubbleService);
  private sanitizer = inject(DomSanitizer);
  private marked = new Marked({ breaks: true, gfm: true });

  isOpen = signal(false);

  inputText = '';

  scrollContainer = viewChild<ElementRef>('scrollContainer');
  scrollAnchor = viewChild<ElementRef>('scrollAnchor');

  unreadCount = signal(0);
  private prevMessageCount = 0;

  constructor() {
    effect(() => {
      if (this.bubbleService.openSignal()) {
        this.open();
        this.bubbleService.openSignal.set(false);
      }
    });
    effect(() => {
      this.service.messages();
      if (this.isOpen()) {
        setTimeout(() => this.scrollToBottom(), 50);
      }
    });
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  hasUnread(): boolean {
    return this.unreadCount() > 0;
  }

  open() {
    this.isOpen.set(true);
    this.unreadCount.set(0);
    this.prevMessageCount = this.service.messages().length;
    setTimeout(() => this.scrollToBottom(), 100);
  }

  close() {
    this.isOpen.set(false);
    const current = this.service.messages().length;
    if (current > this.prevMessageCount) {
      this.unreadCount.set(current - this.prevMessageCount);
    }
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
    return this.sanitizer.bypassSecurityTrustHtml(
      `<div class="chat-msg">${html}</div>`
    );
  }

  private scrollToBottom() {
    try {
      this.scrollAnchor()?.nativeElement.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }
}
