import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Mail, Phone, MapPin, Briefcase, Calendar, Edit2, Shield, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { Api } from '../../services/api-services/api';
import { apiAuthChangePasswordPost$Json } from '../../services/api-services/fn/auth/api-auth-change-password-post-json';
import { apiEmployeesMeGet$Json } from '../../services/api-services/fn/employees/api-employees-me-get-json';
import { ChangePasswordDto, EmployeeDto } from '../../services/api-services/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <!-- Cover & Profile Header -->
      <div class="relative">
        <div class="h-48 md:h-64 bg-gradient-to-r from-emerald-800 to-slate-900 rounded-[32px] overflow-hidden relative">
           <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
           <div class="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
        </div>
        
        <div class="px-8 -mt-20 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div class="flex flex-col md:flex-row md:items-end gap-6">
            <div class="w-40 h-40 rounded-[40px] border-[6px] border-white overflow-hidden shadow-2xl bg-white">
              <img [src]="avatarUrl()" alt="Profile" class="w-full h-full object-cover">
            </div>
            <div class="mb-2">
              <h1 class="text-3xl font-black text-slate-900 tracking-tight">{{ employee()?.fullName || authService.currentUser()?.fullName }}</h1>
              <p class="text-emerald-700 font-bold flex items-center gap-2">
                <lucide-icon name="briefcase" class="w-4 h-4"></lucide-icon>
                Chuyên viên thiết kế UI/UX cao cấp
              </p>
            </div>
          </div>
          
          <div class="flex gap-3 mb-2">
            <button class="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
              <lucide-icon name="edit-2" class="w-4 h-4"></lucide-icon>
              Chỉnh sửa hồ sơ
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Sidebar Info -->
        <div class="space-y-6">
          <div class="bg-white p-8 rounded-3xl shadow-soft border border-slate-100">
            <h3 class="text-lg font-bold text-slate-900 mb-6">Thông tin cá nhân</h3>
            <div class="space-y-5">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <lucide-icon name="mail" class="w-5 h-5"></lucide-icon>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Địa chỉ Email</p>
                  <p class="text-sm font-bold text-slate-900">{{ employee()?.email || authService.currentUser()?.email }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <lucide-icon name="phone" class="w-5 h-5"></lucide-icon>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số điện thoại</p>
                  <p class="text-sm font-bold text-slate-900">{{ employee()?.phone || '+84 987 654 321' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <lucide-icon name="map-pin" class="w-5 h-5"></lucide-icon>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Địa điểm</p>
                  <p class="text-sm font-bold text-slate-900">TP. Hồ Chí Minh, VN</p>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <lucide-icon name="calendar" class="w-5 h-5"></lucide-icon>
                </div>
                <div>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày gia nhập</p>
                  <p class="text-sm font-bold text-slate-900">{{ formatDate(employee()?.dateOfBirth || '') }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden group">
            <lucide-icon name="shield" class="w-12 h-12 text-emerald-500 mb-6"></lucide-icon>
            <h3 class="text-xl font-bold mb-2">Trạng thái bảo mật</h3>
            <p class="text-slate-400 text-sm mb-6">Tài khoản của bạn đang được bảo vệ bằng xác thực 2 lớp.</p>
            <button class="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-all underline">Quản lý bảo mật</button>
          </div>

          <!-- Change Password -->
          <div class="bg-white p-8 rounded-3xl shadow-soft border border-slate-100">
            <h3 class="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <lucide-icon name="lock" class="w-5 h-5 text-emerald-600"></lucide-icon>
              Đổi mật khẩu
            </h3>

            @if (passwordChanged()) {
              <div class="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
                <lucide-icon name="check-circle-2" class="w-10 h-10 text-emerald-600 mx-auto mb-3"></lucide-icon>
                <p class="font-bold text-emerald-800">Mật khẩu đã được thay đổi thành công!</p>
              </div>
            } @else {
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">Mật khẩu hiện tại</label>
                  <div class="relative">
                    <input [type]="showCurrent ? 'text' : 'password'" [(ngModel)]="currentPassword" placeholder="••••••••" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none pr-12">
                    <button (click)="showCurrent = !showCurrent" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <lucide-icon [name]="showCurrent ? 'eye-off' : 'eye'" class="w-4 h-4"></lucide-icon>
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">Mật khẩu mới</label>
                  <div class="relative">
                    <input [type]="showNew ? 'text' : 'password'" [(ngModel)]="newPassword" placeholder="••••••••" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none pr-12">
                    <button (click)="showNew = !showNew" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <lucide-icon [name]="showNew ? 'eye-off' : 'eye'" class="w-4 h-4"></lucide-icon>
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">Xác nhận mật khẩu mới</label>
                  <div class="relative">
                    <input [type]="showConfirm ? 'text' : 'password'" [(ngModel)]="confirmPassword" placeholder="••••••••" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none pr-12">
                    <button (click)="showConfirm = !showConfirm" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <lucide-icon [name]="showConfirm ? 'eye-off' : 'eye'" class="w-4 h-4"></lucide-icon>
                    </button>
                  </div>
                </div>
                @if (errorMsg()) {
                  <p class="text-xs font-bold text-red-500">{{ errorMsg() }}</p>
                }
                <button (click)="changePassword()" [disabled]="saving()" class="w-full py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all text-sm shadow-lg shadow-emerald-700/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  @if (saving()) {
                    <lucide-icon name="loader2" class="w-4 h-4 animate-spin"></lucide-icon>
                  }
                  Cập nhật mật khẩu
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
           <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft">
                 <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Dự án hoàn thành</p>
                 <p class="text-2xl font-black text-slate-900 mt-2">12</p>
                 <div class="w-full h-1.5 bg-slate-50 rounded-full mt-4 overflow-hidden">
                    <div class="w-[75%] h-full bg-emerald-500 rounded-full"></div>
                 </div>
              </div>
              <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft">
                 <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Tỉ lệ thành công</p>
                 <p class="text-2xl font-black text-slate-900 mt-2">94%</p>
                 <div class="w-full h-1.5 bg-slate-50 rounded-full mt-4 overflow-hidden">
                    <div class="w-[94%] h-full bg-blue-500 rounded-full"></div>
                 </div>
              </div>
              <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft">
                 <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Kinh nghiệm</p>
                 <p class="text-2xl font-black text-slate-900 mt-2">6.5 Năm</p>
                 <div class="w-full h-1.5 bg-slate-50 rounded-full mt-4 overflow-hidden">
                    <div class="w-[60%] h-full bg-amber-500 rounded-full"></div>
                 </div>
              </div>
           </div>

           <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-soft space-y-8">
              <h3 class="text-lg font-bold text-slate-900">Kinh nghiệm làm việc</h3>
              <div class="space-y-8 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                 <div class="relative pl-12">
                    <div class="absolute left-0 top-1 w-10 h-10 rounded-full bg-emerald-50 border-4 border-white shadow-sm flex items-center justify-center z-10 text-emerald-700">
                       <lucide-icon name="briefcase" class="w-4 h-4"></lucide-icon>
                    </div>
                    <div>
                       <div class="flex items-center justify-between">
                          <h4 class="font-bold text-slate-900">Chuyên viên thiết kế UI/UX cao cấp</h4>
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-widest">Hiện tại</span>
                       </div>
                       <p class="text-sm text-slate-500 font-medium mt-1">Hệ thống HRM Portal • 2024 - Hiện tại</p>
                    </div>
                 </div>
                 <div class="relative pl-12">
                    <div class="absolute left-0 top-1 w-10 h-10 rounded-full bg-slate-50 border-4 border-white shadow-sm flex items-center justify-center z-10 text-slate-400">
                       <lucide-icon name="briefcase" class="w-4 h-4"></lucide-icon>
                    </div>
                    <div>
                       <h4 class="font-bold text-slate-900">Thiết kế sản phẩm</h4>
                       <p class="text-sm text-slate-500 font-medium mt-1">Creative Agency Inc. • 2021 - 2023</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  mockService = inject(MockDataService);
  api = inject(Api);

  employee = signal<EmployeeDto | null>(null);
  loadingProfile = signal(false);

  avatarUrl = computed(() => {
    const name = this.employee()?.fullName || this.authService.currentUser()?.fullName || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f766e&color=fff&size=256`;
  });

  async ngOnInit() {
    this.loadingProfile.set(true);
    try {
      const resp: any = await this.api.invoke(apiEmployeesMeGet$Json, {});
      if (resp?.isSuccess && resp?.result) {
        this.employee.set(resp.result as EmployeeDto);
      }
    } catch {
      // fallback — auth user info already available
    } finally {
      this.loadingProfile.set(false);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6',
                    'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  }

  showCurrent = false;
  showNew = false;
  showConfirm = false;

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  errorMsg = signal('');
  passwordChanged = signal(false);
  saving = signal(false);

  async changePassword() {
    this.errorMsg.set('');
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMsg.set('Vui lòng điền đầy đủ các trường.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.errorMsg.set('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.errorMsg.set('Mật khẩu xác nhận không khớp.');
      return;
    }

    this.saving.set(true);
    try {
      const body: ChangePasswordDto = {
        currentPassword: this.currentPassword,
        newPassword: this.newPassword
      };
      await this.api.invoke(apiAuthChangePasswordPost$Json, { body });
      this.passwordChanged.set(true);
    } catch (err: any) {
      this.errorMsg.set(err.error?.message || err.message || 'Đổi mật khẩu thất bại.');
    } finally {
      this.saving.set(false);
    }
  }
}
