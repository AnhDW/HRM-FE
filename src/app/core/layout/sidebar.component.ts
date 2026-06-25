import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  CalendarCheck,
  FileText,
  Users,
  Wallet,
  LogOut,
  CheckSquare,
  ShieldCheck,
  Bot,
  Sparkles
} from 'lucide-angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <!-- Mobile Overlay -->
    @if (auth.isSidebarOpen()) {
      <div 
        (click)="auth.isSidebarOpen.set(false)"
        class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45] xl:hidden animate-in fade-in duration-300">
      </div>
    }

    <aside 
      class="w-[240px] h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 xl:translate-x-0"
      [class.translate-x-0]="auth.isSidebarOpen()"
      [class.-translate-x-full]="!auth.isSidebarOpen()"
    >
      <!-- Logo -->
      <div class="px-6 py-8 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-slate-50 border border-slate-100">
            <img src="/assets/logo.png" alt="Logo" class="w-full h-full object-cover">
          </div>
          <span class="text-xl font-bold tracking-tight text-slate-900">HRM Portal</span>
        </div>
        
        <!-- Mobile Close Button -->
        <button (click)="auth.isSidebarOpen.set(false)" class="xl:hidden p-2 text-slate-400 hover:text-slate-900 transition-all">
          <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
        </button>
      </div>

      <!-- Role Badge -->
      <div class="px-8 mb-6">
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 w-fit">
          <lucide-icon [name]="auth.isAdmin() ? 'shield-check' : 'users'" class="w-3.5 h-3.5 text-slate-400"></lucide-icon>
          <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Vai trò: {{ auth.isAdmin() ? 'Quản trị' : 'Nhân viên' }}
          </span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 space-y-2">
        @for (item of filteredMenuItems(); track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="bg-emerald-50 text-emerald-700"
            [routerLinkActiveOptions]="{ exact: item.path === 'dashboard' }"
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all duration-200 group"
          >
            <lucide-icon [name]="item.icon" class="w-5 h-5 opacity-70 group-hover:opacity-100"></lucide-icon>
            <span class="font-medium">{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- Bottom Profile/Logout -->
      <div class="p-6 border-t border-slate-50">
        <button (click)="auth.logout()" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200">
          <lucide-icon name="log-out" class="w-5 h-5"></lucide-icon>
          <span class="font-medium">Đăng xuất</span>
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  auth = inject(AuthService);

  readonly menuItems = [
    // Employee Items
    { path: 'dashboard', label: 'Tổng quan', icon: 'layout-dashboard', roles: ['employee'] },
    { path: 'attendance', label: 'Chấm công', icon: 'calendar-check', roles: ['employee'] },
    { path: 'leave-requests', label: 'Nghỉ phép', icon: 'file-text', roles: ['employee'] },
    { path: 'payroll', label: 'Bảng lương', icon: 'wallet', roles: ['employee'] },
    { path: 'calendar', label: 'Sự kiện', icon: 'calendar', roles: ['employee'] },

    // Admin Items
    { path: 'attendance', label: 'Chấm công', icon: 'calendar-check', roles: ['admin'] },
    { path: 'leave', label: 'Duyệt nghỉ phép', icon: 'check-square', roles: ['admin'] },
    { path: 'payroll', label: 'Quản lý lương', icon: 'wallet', roles: ['admin'] },
    { path: 'employees', label: 'Quản lý nhân sự', icon: 'users', roles: ['admin'] },
    { path: 'organization', label: 'Sơ đồ tổ chức', icon: 'users', roles: ['admin', 'employee'] },
  ];

  filteredMenuItems = computed(() =>
    this.menuItems.filter(item => item.roles.includes(this.auth.currentRole()))
  );
}
