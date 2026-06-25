import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Bell, Shield, Eye, Palette, Globe, Smartphone, HelpCircle, Sun, Moon, Monitor, BookOpen, Leaf, Droplets, Check } from 'lucide-angular';
import { ThemeService, ThemeMode } from '../../core/services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Cài đặt hệ thống</h1>
          <p class="text-slate-500 mt-2">Quản lý các tùy chọn tài khoản và thiết lập ứng dụng.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Settings Nav -->
        <div class="lg:col-span-1 space-y-2">
           @for (item of settingsMenu; track item.id) {
             <button 
                [class]="activeTab === item.id ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/20' : 'text-slate-500 hover:bg-slate-50'"
               (click)="activeTab = item.id"
               class="w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all"
             >
               <lucide-icon [name]="item.icon" class="w-4 h-4"></lucide-icon>
               {{ item.label }}
             </button>
           }
        </div>

        <!-- Settings Form -->
        <div class="lg:col-span-3 space-y-8">
           @if (activeTab === 'notifications') {
             <div class="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
               <div class="px-8 py-6 border-b border-slate-50">
                  <h3 class="text-lg font-bold text-slate-900">Cài đặt thông báo</h3>
                  <p class="text-slate-400 text-xs font-medium">Cấu hình cách bạn nhận cập nhật và cảnh báo.</p>
               </div>
               <div class="p-8 space-y-6">
                  <div class="flex items-start justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all">
                     <div class="flex gap-4">
                        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                           <lucide-icon name="bell" class="w-5 h-5"></lucide-icon>
                        </div>
                        <div>
                           <p class="text-sm font-bold text-slate-900">Thông báo qua Email</p>
                           <p class="text-xs text-slate-400 font-medium mt-0.5">Nhận bản tóm tắt hàng ngày và các cảnh báo quan trọng qua email.</p>
                        </div>
                     </div>
                     <div class="flex items-center h-full">
                        <div class="w-11 h-6 bg-emerald-600 rounded-full relative cursor-pointer">
                           <div class="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
                     </div>
                  </div>

                  <div class="flex items-start justify-between p-4 rounded-2xl bg-white border border-transparent hover:bg-slate-50 transition-all">
                     <div class="flex gap-4">
                        <div class="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                           <lucide-icon name="smartphone" class="w-5 h-5"></lucide-icon>
                        </div>
                        <div>
                           <p class="text-sm font-bold text-slate-900">Thông báo đẩy (Push)</p>
                           <p class="text-xs text-slate-400 font-medium mt-0.5">Cảnh báo thời gian thực trên thiết bị di động của bạn.</p>
                        </div>
                     </div>
                     <div class="flex items-center h-full">
                        <div class="w-11 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                           <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                        </div>
                     </div>
                  </div>
               </div>
               <div class="px-8 py-5 bg-slate-50/50 flex justify-end gap-3">
                  <button class="px-6 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-slate-900">Đặt lại</button>
                  <button class="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-900/10">Lưu thay đổi</button>
               </div>
             </div>
           }

            @if (activeTab === 'appearance') {
              <div class="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
                <div class="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 class="text-lg font-bold text-slate-900">Chế độ hiển thị</h3>
                    <p class="text-slate-400 text-xs font-medium">Cá nhân hóa phong cách hình ảnh của ứng dụng.</p>
                  </div>
                  <lucide-icon name="palette" class="w-6 h-6 text-slate-200"></lucide-icon>
                </div>
                <div class="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  @for (option of themeOptions; track option.value) {
                    <div (click)="theme.mode.set(option.value)"
                      class="p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200"
                      [class.border-emerald-600]="theme.mode() === option.value"
                      [class.bg-emerald-50]="theme.mode() === option.value"
                      [class.border-transparent]="theme.mode() !== option.value"
                      [class.bg-slate-50]="theme.mode() !== option.value"
                      [class.hover:bg-slate-100]="theme.mode() !== option.value">
                      <div class="h-28 rounded-xl border mb-4 overflow-hidden p-3 relative"
                        [style.background]="option.value === 'dark' ? '#0f172a' : option.value === 'sepia' ? '#faf0e6' : option.value === 'forest' ? '#1a2e1a' : option.value === 'ocean' ? '#1a2a3e' : '#ffffff'"
                        [style.border-color]="option.value === 'dark' ? '#1e293b' : option.value === 'sepia' ? '#e8d5b8' : option.value === 'forest' ? '#2a3e2a' : option.value === 'ocean' ? '#2a3a4e' : '#e2e8f0'">
                        @if (option.value === 'dark') {
                          <div class="w-10 h-1.5 rounded-full mb-3" style="background:#334155"></div>
                          <div class="space-y-2">
                            <div class="w-full h-6 rounded-lg mb-0.5" style="background:#1e293b"></div>
                            <div class="w-full h-6 rounded-lg" style="background:#1e293b"></div>
                          </div>
                        }
                        @if (option.value === 'system') {
                          <div class="flex h-full items-center justify-center gap-3">
                            <div class="flex-1 p-2 rounded-lg border" style="background:#ffffff;border-color:#e2e8f0">
                              <div class="w-6 h-1 rounded-full mb-2" style="background:#f1f5f9"></div>
                              <div class="w-full h-3 rounded" style="background:#f8fafc"></div>
                            </div>
                            <lucide-icon name="monitor" class="w-5 h-5 flex-shrink-0" style="color:#94a3b8"></lucide-icon>
                            <div class="flex-1 p-2 rounded-lg border" style="background:#0f172a;border-color:#1e293b">
                              <div class="w-6 h-1 rounded-full mb-2" style="background:#334155"></div>
                              <div class="w-full h-3 rounded" style="background:#1e293b"></div>
                            </div>
                          </div>
                        }
                        @if (option.value === 'sepia') {
                          <div class="w-10 h-1.5 rounded-full mb-3" style="background:#e8d5b8"></div>
                          <div class="space-y-2">
                            <div class="w-full h-6 rounded-lg mb-0.5" style="background:#faf0e6"></div>
                            <div class="w-full h-6 rounded-lg" style="background:#faf0e6"></div>
                          </div>
                        }
                        @if (option.value === 'forest') {
                          <div class="w-10 h-1.5 rounded-full mb-3" style="background:#2a3e2a"></div>
                          <div class="space-y-2">
                            <div class="w-full h-6 rounded-lg mb-0.5" style="background:#1a2e1a"></div>
                            <div class="w-full h-6 rounded-lg" style="background:#1a2e1a"></div>
                          </div>
                        }
                        @if (option.value === 'ocean') {
                          <div class="w-10 h-1.5 rounded-full mb-3" style="background:#2a3a4e"></div>
                          <div class="space-y-2">
                            <div class="w-full h-6 rounded-lg mb-0.5" style="background:#1a2a3e"></div>
                            <div class="w-full h-6 rounded-lg" style="background:#1a2a3e"></div>
                          </div>
                        }
                        @if (option.value === 'light') {
                          <div class="w-10 h-1.5 rounded-full mb-3" style="background:#f1f5f9"></div>
                          <div class="space-y-2">
                            <div class="w-full h-6 rounded-lg mb-0.5" style="background:#f8fafc"></div>
                            <div class="w-full h-6 rounded-lg" style="background:#f8fafc"></div>
                          </div>
                        }
                        @if (theme.mode() === option.value) {
                          <div class="absolute top-2 right-2 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center shadow-sm">
                            <lucide-icon name="check" class="w-3 h-3 text-white"></lucide-icon>
                          </div>
                        }
                      </div>
                      <div class="flex items-center gap-2 justify-center">
                        <lucide-icon [name]="option.icon" class="w-4 h-4"></lucide-icon>
                        <p class="text-sm font-bold">{{ option.label }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            @if (activeTab === 'help') {
              <div class="bg-white rounded-3xl border border-slate-100 shadow-soft overflow-hidden">
                <div class="px-8 py-6 border-b border-slate-50">
                  <h3 class="text-lg font-bold text-slate-900">Trợ giúp & Hỗ trợ</h3>
                  <p class="text-slate-400 text-xs font-medium">Hướng dẫn sử dụng và thông tin hỗ trợ.</p>
                </div>
                <div class="p-8 space-y-4 text-sm text-slate-500 leading-relaxed">
                  <p>Để xem hướng dẫn tương tác, hãy truy cập trang bạn muốn được hướng dẫn và tìm nút <strong>"Xem hướng dẫn"</strong> trên trang đó.</p>
                  <p>Hiện tại có hướng dẫn cho các trang sau:</p>
                  <ul class="list-disc pl-5 space-y-1">
                    <li>Sự kiện (/calendar)</li>
                    <li>Quản lý phiếu lương (/admin/payroll) — dành cho admin</li>
                  </ul>
                </div>
              </div>
            }
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent {
  theme = inject(ThemeService);
  activeTab = 'appearance';

  settingsMenu = [
    { id: 'notifications', label: 'Thông báo', icon: 'bell' },
    { id: 'appearance', label: 'Hiển thị & Giao diện', icon: 'palette' },
    { id: 'privacy', label: 'Bảo mật & Quyền riêng tư', icon: 'shield' },
    { id: 'help', label: 'Trợ giúp & Hỗ trợ', icon: 'help-circle' }
  ];

  themeOptions = [
    { value: 'light' as ThemeMode, label: 'Chế độ sáng', icon: 'sun' },
    { value: 'dark' as ThemeMode, label: 'Chế độ tối', icon: 'moon' },
    { value: 'system' as ThemeMode, label: 'Theo hệ thống', icon: 'monitor' },
    { value: 'sepia' as ThemeMode, label: 'Sepia', icon: 'book-open' },
    { value: 'forest' as ThemeMode, label: 'Rừng xanh', icon: 'leaf' },
    { value: 'ocean' as ThemeMode, label: 'Đại dương', icon: 'droplets' },
  ];
}
