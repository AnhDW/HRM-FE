import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex flex-col lg:flex-row animate-in fade-in duration-1000">
      
      <!-- Left side: Login Form -->
      <div class="w-full lg:w-[45%] flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12 bg-white relative z-10">
        <!-- Logo -->
        <div class="flex items-center gap-3 mb-16">
          <div class="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-slate-50 border border-slate-100 shadow-sm">
            <img src="/assets/logo.png" alt="Logo" class="w-full h-full object-cover">
          </div>
          <span class="text-xl font-bold tracking-tight text-slate-900">HRM Portal</span>
        </div>

        <div class="max-w-md w-full mx-auto lg:mx-0">
          <h1 class="text-4xl font-black text-slate-900 tracking-tight leading-tight">Chào mừng trở lại</h1>
          <p class="text-slate-500 mt-3 font-medium">Vui lòng nhập thông tin để truy cập hệ thống.</p>

          @if (errorMessage()) {
            <div class="mt-6 flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-100 rounded-2xl text-sm font-semibold text-red-700 animate-in zoom-in-95 duration-200">
              <lucide-icon name="alert-circle" class="w-5 h-5 flex-shrink-0"></lucide-icon>
              {{ errorMessage() }}
            </div>
          }

          <form (submit)="onLogin($event)" class="mt-8 space-y-6">
            <div class="space-y-2">
              <label class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email công việc</label>
              <div class="relative group">
                <lucide-icon name="mail" class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-700 transition-colors"></lucide-icon>
                <input 
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  placeholder="ten@congty.com" 
                  class="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-emerald-700/10 focus:bg-white focus:ring-4 focus:ring-emerald-700/5 transition-all font-medium text-slate-900"
                >
              </div>
            </div>

            <div class="space-y-2">
               <div class="flex items-center justify-between ml-1">
                 <label class="text-xs font-bold text-slate-400 uppercase tracking-widest">Mật khẩu</label>
                 <a href="#" class="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors">Quên mật khẩu?</a>
               </div>
               <div class="relative group">
                <lucide-icon name="lock" class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-700 transition-colors"></lucide-icon>
                <input 
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  required
                  placeholder="••••••••" 
                  class="w-full pl-14 pr-12 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:border-emerald-700/10 focus:bg-white focus:ring-4 focus:ring-emerald-700/5 transition-all font-medium text-slate-900"
                >
                <button 
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                >
                   <lucide-icon [name]="showPassword() ? 'eye-off' : 'eye'" class="w-5 h-5"></lucide-icon>
                </button>
              </div>
            </div>

            <button 
              type="submit"
              [disabled]="isLoading()"
              class="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              @if (isLoading()) {
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Đang xử lý...
              } @else {
                Đăng nhập
                <lucide-icon name="arrow-right" class="w-5 h-5"></lucide-icon>
              }
            </button>

            <div class="text-center text-xs text-slate-400 font-medium space-y-1">
              <p>Tài khoản đã seed từ backend:</p>
              <p><span class="font-bold text-slate-600">admin&#64;example.com</span> / <span class="font-bold text-slate-600">Admin&#64;123</span> (Quản trị)</p>
            </div>
          </form>

          <footer class="mt-8 pt-8 border-t border-slate-50 text-center lg:text-left">
             <p class="text-sm text-slate-400 font-medium">Chưa có tài khoản? <a href="#" class="text-slate-900 font-bold hover:underline">Liên hệ quản trị viên</a></p>
          </footer>
        </div>
      </div>

      <!-- Right side: Visual Branding -->
      <div class="hidden lg:flex w-[55%] bg-slate-900 relative overflow-hidden items-center justify-center p-20">
         <div class="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
            <div class="absolute -top-[20%] -right-[10%] w-[80%] h-[80%] bg-emerald-600/40 rounded-full blur-[140px] animate-pulse duration-[5000ms]"></div>
            <div class="absolute -bottom-[10%] -left-[10%] w-[60%] h-[60%] bg-blue-600/30 rounded-full blur-[120px]"></div>
         </div>

         <div class="relative z-10 max-w-lg text-center lg:text-left space-y-12 animate-in slide-in-from-bottom-10 duration-1000 delay-300">
            <div class="space-y-6">
              <div class="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-emerald-400 shadow-2xl">
                 <lucide-icon name="shield-check" class="w-8 h-8"></lucide-icon>
              </div>
              <h2 class="text-5xl font-black text-white leading-tight">Nâng tầm trải nghiệm quản trị nhân sự của bạn</h2>
              <p class="text-xl text-slate-400 font-medium leading-relaxed">
                Khám phá thế hệ quản lý nhân sự mới. Đơn giản, mạnh mẽ và được xây dựng cho các đội ngũ hiện đại.
              </p>
            </div>

            <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 shadow-2xl">
                <div class="flex items-center justify-between mb-8">
                   <div class="flex gap-2">
                     <div class="w-3 h-3 rounded-full bg-red-400/50"></div>
                     <div class="w-3 h-3 rounded-full bg-amber-400/50"></div>
                     <div class="w-3 h-3 rounded-full bg-emerald-400/50"></div>
                   </div>
                   <div class="h-1 w-20 bg-white/10 rounded-full"></div>
                </div>
                <div class="space-y-4">
                   <div class="h-10 bg-white/5 rounded-xl flex items-center px-4 justify-between">
                     <div class="w-32 h-2 bg-white/10 rounded-full"></div>
                     <div class="w-12 h-4 bg-emerald-500/20 rounded-lg"></div>
                   </div>
                   <div class="h-10 bg-white/5 rounded-xl flex items-center px-4 justify-between">
                     <div class="w-40 h-2 bg-white/10 rounded-full"></div>
                     <div class="w-12 h-4 bg-white/10 rounded-lg"></div>
                   </div>
                   <div class="h-10 bg-white/5 rounded-xl flex items-center px-4 justify-between">
                     <div class="w-24 h-2 bg-white/10 rounded-full"></div>
                     <div class="w-12 h-4 bg-white/10 rounded-lg"></div>
                   </div>
                </div>
            </div>
         </div>

         <div class="absolute bottom-10 left-10 text-white/40 text-xs font-bold uppercase tracking-widest">
            © 2026 HRM PORTAL SYSTEM • TOÀN BỘ BẢN QUYỀN ĐƯỢC BẢO LƯU
         </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = signal('');
  password = signal('');
  showPassword = signal(false);
  errorMessage = signal('');
  isLoading = signal(false);

  async onLogin(event: Event) {
    event.preventDefault();
    this.errorMessage.set('');

    if (!this.email() || !this.password()) {
      this.errorMessage.set('Vui lòng nhập email và mật khẩu.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const result = await this.auth.login(this.email(), this.password());
    this.isLoading.set(false);

    if (result.success) {
      const target = this.auth.isAdmin() ? '/admin/leave' : '/dashboard';
      this.router.navigateByUrl(target);
    } else {
      this.errorMessage.set(result.error!);
    }
  }
}
