import { Component, inject, signal, computed, HostListener, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService, UserRole } from '../services/auth.service';
import { MockDataService, SearchFeature } from '../services/mock-data.service';
import { Router, RouterModule } from '@angular/router';
import { ChatBubbleService } from '../../shared/components/chat-bubble/chat-bubble.service';
import { Api } from '../../services/api-services/api';
import { apiNotificationsGet$Json } from '../../services/api-services/fn/notifications/api-notifications-get-json';
import { apiNotificationsIdReadPut$Json } from '../../services/api-services/fn/notifications/api-notifications-id-read-put-json';
import { apiNotificationsReadAllPut$Json } from '../../services/api-services/fn/notifications/api-notifications-read-all-put-json';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterModule],
  template: `
<header class="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 transition-all duration-300">
  <div class="h-14 sm:h-16 flex items-center justify-between px-4 md:px-8">
    <div class="flex items-center gap-2">
      <button (click)="auth.toggleSidebar()" class="xl:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl">
        <lucide-icon name="menu" class="w-6 h-6"></lucide-icon>
      </button>
      @if (auth.canAccessAdmin()) {
      <div class="flex items-center bg-slate-50 p-1 rounded-xl">
        <button 
          (click)="switchView('employee')"
          [class]="auth.currentRole() === 'employee' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'"
          class="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all"
        >
          <lucide-icon name="users" class="w-3.5 h-3.5"></lucide-icon>
          <span class="hidden sm:inline">Nhân viên</span>
        </button>
        <button 
          (click)="switchView('admin')"
          [class]="auth.currentRole() === 'admin' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'"
          class="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all"
        >
          <lucide-icon name="shield-check" class="w-3.5 h-3.5"></lucide-icon>
          <span class="hidden sm:inline">Quản trị</span>
        </button>
      </div>
      }
    </div>

    <div class="relative w-full max-w-xs md:max-w-96 hidden sm:block">
      <lucide-icon name="search" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
      <input (input)="onSearchInput($any($event.target).value)" type="text" placeholder="Tìm kiếm nhanh..." class="w-full pl-14 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
      @if (searchQuery() && filteredFeatures().length > 0) {
        <div class="absolute left-0 top-full mt-2 w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 z-[60] animate-in zoom-in-95 slide-in-from-top-2 duration-200">
          @for (f of filteredFeatures(); track f.route) {
            <a [routerLink]="f.route === '#ai-chat' ? null : f.route" (click)="onSearchClick(f); searchQuery.set('')" class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-all">
              <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                <lucide-icon [name]="f.icon" class="w-4 h-4"></lucide-icon>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-slate-900">{{ f.name }}</p>
                <p class="text-[11px] text-slate-400 truncate">{{ f.description }}</p>
              </div>
              <span class="text-[10px] font-semibold text-slate-400 uppercase px-2 py-0.5 rounded-md bg-slate-50">{{ f.module }}</span>
            </a>
          }
        </div>
      }
      @if (searchQuery() && filteredFeatures().length === 0) {
        <div class="absolute left-0 top-full mt-2 w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 py-6 z-[60] animate-in zoom-in-95 slide-in-from-top-2 duration-200 text-center">
          <p class="text-sm text-slate-400 font-semibold">Không tìm thấy kết quả</p>
          <p class="text-xs text-slate-300 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      }
    </div>

    <div class="flex items-center gap-1">
      <button (click)="isNotifOpen.set(!isNotifOpen())" class="hidden sm:flex relative w-10 h-10 items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all">
        <lucide-icon name="bell" class="w-5 h-5"></lucide-icon>
        @if (unreadCount() > 0) {
          <span class="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-white">{{ unreadCount() }}</span>
        }
      </button>

      <div class="relative">
        <div (click)="isProfileMenuOpen.set(!isProfileMenuOpen())" class="flex items-center gap-3 pl-3 border-l border-slate-100 cursor-pointer group">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-bold text-slate-900 leading-none">{{ auth.currentUser()?.fullName }}</p>
            <p class="text-[11px] font-medium text-slate-400 mt-1">{{ auth.isAdmin() ? 'Quản trị hệ thống' : 'Nhân viên' }}</p>
          </div>
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 border-white ring-1 ring-slate-100 group-hover:ring-emerald-200 transition-all">
            <img [src]="'https://ui-avatars.com/api/?name=' + auth.currentUser()?.fullName + '&background=0f766e&color=fff'" alt="Avatar">
          </div>
          <lucide-icon name="chevron-down" class="hidden sm:block w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" [class.rotate-180]="isProfileMenuOpen()"></lucide-icon>
        </div>

        @if (isProfileMenuOpen()) {
          <div class="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 z-[60] animate-in zoom-in-95 slide-in-from-top-2 duration-200">
          <div class="px-4 py-3 border-b border-slate-50 mb-1">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Tài khoản</p>
          </div>
          <a routerLink="/profile" (click)="isProfileMenuOpen.set(false)" class="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-emerald-700 transition-all">
            <lucide-icon name="user" class="w-4 h-4"></lucide-icon> Hồ sơ cá nhân
          </a>
          <a routerLink="/settings" (click)="isProfileMenuOpen.set(false)" class="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-emerald-700 transition-all">
            <lucide-icon name="settings" class="w-4 h-4"></lucide-icon> Cài đặt
          </a>
          <div class="h-px bg-slate-50 my-2"></div>
          <button (click)="auth.logout()" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-all">
            <lucide-icon name="log-out" class="w-4 h-4"></lucide-icon> Đăng xuất
          </button>
        </div>
      }
    </div>
    </div>
  </div>

  <div class="sm:hidden px-4 pb-3 flex items-center gap-3">
    <div class="relative flex-1">
      <lucide-icon name="search" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
      <input (input)="onSearchInput($any($event.target).value)" type="text" placeholder="Tìm kiếm nhanh..." class="w-full pl-14 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
      @if (searchQuery() && filteredFeatures().length > 0) {
        <div class="absolute left-0 top-full mt-2 w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 py-2 z-[60] animate-in zoom-in-95 slide-in-from-top-2 duration-200">
          @for (f of filteredFeatures(); track f.route) {
            <a [routerLink]="f.route === '#ai-chat' ? null : f.route" (click)="onSearchClick(f); searchQuery.set('')" class="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-all">
              <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                <lucide-icon [name]="f.icon" class="w-4 h-4"></lucide-icon>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-slate-900">{{ f.name }}</p>
                <p class="text-[11px] text-slate-400 truncate">{{ f.description }}</p>
              </div>
              <span class="text-[10px] font-semibold text-slate-400 uppercase px-2 py-0.5 rounded-md bg-slate-50">{{ f.module }}</span>
            </a>
          }
        </div>
      }
      @if (searchQuery() && filteredFeatures().length === 0) {
        <div class="absolute left-0 top-full mt-2 w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 py-6 z-[60] animate-in zoom-in-95 slide-in-from-top-2 duration-200 text-center">
          <p class="text-sm text-slate-400 font-semibold">Không tìm thấy kết quả</p>
          <p class="text-xs text-slate-300 mt-1">Thử tìm kiếm với từ khóa khác</p>
        </div>
      }
    </div>
    <button (click)="isNotifOpen.set(!isNotifOpen())" class="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all flex-shrink-0 sm:hidden">
      <lucide-icon name="bell" class="w-4 h-4"></lucide-icon>
      @if (unreadCount() > 0) {
        <span class="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-white">{{ unreadCount() }}</span>
      }
    </button>
  </div>

  <!-- Shared Notification Dropdown -->
  @if (isNotifOpen()) {
    <div class="fixed right-4 top-16 sm:right-8 sm:top-20 w-80 sm:w-96 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 z-[60] animate-in zoom-in-95 slide-in-from-top-2 duration-200">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <h3 class="text-sm font-black text-slate-900">Thông báo</h3>
        @if (unreadCount() > 0) {
          <button (click)="markAllAsRead()" class="text-[11px] font-bold text-emerald-700 hover:underline">Đánh dấu đã đọc</button>
        }
      </div>
      <div class="max-h-80 overflow-y-auto">
        @for (notif of notifications(); track notif.id) {
          <div (click)="markAsRead(notif.id)" class="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50 transition-all border-b border-slate-50 last:border-b-0" [class.bg-emerald-50]="!notif.isRead">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50 text-emerald-600">
              <lucide-icon name="bell" class="w-4 h-4"></lucide-icon>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-sm font-bold text-slate-900 truncate">{{ notif.title }}</p>
                @if (!notif.isRead) {
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                }
              </div>
              <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">{{ notif.message }}</p>
              <p class="text-[10px] text-slate-400 mt-1 font-medium">{{ notif.createdAt }}</p>
            </div>
          </div>
        } @empty {
          <div class="text-center py-12">
            <p class="text-slate-400 font-semibold">Không có thông báo</p>
          </div>
        }
      </div>
    </div>
  }
</header>
  `
})
export class HeaderComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  private eRef = inject(ElementRef);
  mock = inject(MockDataService);
  private chatBubble = inject(ChatBubbleService);
  private api = inject(Api);

  isProfileMenuOpen = signal(false);
  isNotifOpen = signal(false);
  searchQuery = signal('');

  notifications = signal<any[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);
  notifLoading = signal(false);

  async ngOnInit() {
    await this.loadNotifications();
  }

  async loadNotifications() {
    this.notifLoading.set(true);
    try {
      const resp = await this.api.invoke$Response(apiNotificationsGet$Json, {});
      if (resp.body.isSuccess && Array.isArray(resp.body.result)) {
        this.notifications.set(resp.body.result);
      }
    } catch {}
    this.notifLoading.set(false);
  }

  async markAsRead(id: number) {
    try {
      await this.api.invoke(apiNotificationsIdReadPut$Json, { id });
      this.notifications.update(list =>
        list.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch {}
  }

  async markAllAsRead() {
    try {
      await this.api.invoke(apiNotificationsReadAllPut$Json, {});
      this.notifications.update(list =>
        list.map(n => ({ ...n, isRead: true }))
      );
    } catch {}
  }

  filteredFeatures = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return [];
    const isAdmin = this.auth.isAdmin();
    return this.mock.features.filter(f =>
      (isAdmin || f.module === 'employee') &&
      (f.name.toLowerCase().includes(q) ||
       f.description.toLowerCase().includes(q) ||
       f.keywords.some(k => k.includes(q)))
    ).slice(0, 8);
  });

  onSearchInput(value: string) {
    this.searchQuery.set(value);
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isProfileMenuOpen.set(false);
      this.isNotifOpen.set(false);
      this.searchQuery.set('');
    }
  }

  switchView(role: UserRole) {
    this.auth.switchView(role);
  }

  onSearchClick(feature: SearchFeature) {
    if (feature.route === '#ai-chat') {
      this.chatBubble.open();
      this.searchQuery.set('');
    }
  }
}
