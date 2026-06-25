import { Component, inject, signal, computed, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { fromEvent, Subscription } from 'rxjs';
import { Api } from '../../services/api-services/api';
import { apiEmployeesIdGet$Json } from '../../services/api-services/fn/employees/api-employees-id-get-json';
import { apiDepartmentsGet$Json } from '../../services/api-services/fn/departments/api-departments-get-json';
import { apiSalaryConfigsByEmployeeEmployeeIdGet$Json } from '../../services/api-services/fn/salary-configs/api-salary-configs-by-employee-employee-id-get-json';
import { apiSalaryConfigsPost$Json } from '../../services/api-services/fn/salary-configs/api-salary-configs-post-json';
import { apiSalaryConfigsPut$Json } from '../../services/api-services/fn/salary-configs/api-salary-configs-put-json';
import { apiEmployeeDepartmentHistoriesByEmployeeEmployeeIdGet$Json } from '../../services/api-services/fn/employee-department-histories/api-employee-department-histories-by-employee-employee-id-get-json';
import { apiEmployeeDepartmentHistoriesPost$Json } from '../../services/api-services/fn/employee-department-histories/api-employee-department-histories-post-json';
import { SalaryConfigDto } from '../../services/api-services/models/salary-config-dto';
import { EmployeeDepartmentHistoryDto } from '../../services/api-services/models/employee-department-history-dto';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-admin-employee-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  styles: ['.rounded-teardrop { border-radius: 0 35% 35% 0 / 0 45% 45% 0 }'],
  template: `
    <div class="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 pb-20">
      <!-- Back Header -->
      <div class="sticky top-0 z-10 -mx-4 md:-mx-8 pr-4 md:pr-8 transition-all duration-300 py-2.5" [class.py-3]="isScrolled()" [class.px-4]="!isScrolled()" [class.md:px-8]="!isScrolled()" [style.paddingLeft.px]="isScrolled() ? 0 : undefined">
        <div class="flex items-center gap-4 w-full transition-all duration-300">
          <a routerLink=".."
            class="pointer-events-auto w-12 h-14 flex items-center justify-center text-slate-400 hover:text-emerald-700 transition-all flex-shrink-0 bg-white"
            [class.rounded-full]="!isScrolled()"
            [class.border-slate-100]="!isScrolled()"
            [class.shadow-sm]="!isScrolled()"
            [class.hover:border-emerald-200]="!isScrolled()"
            [class.border]="!isScrolled()"
            [class.rounded-teardrop]="isScrolled()"
            [class.shadow-lg]="isScrolled()">
            <lucide-icon name="chevron-left" class="w-5 h-5"></lucide-icon>
          </a>
          <h1 [style.display]="isScrolled() ? 'none' : ''" class="font-bold text-slate-900 text-2xl truncate pointer-events-auto">Chi tiết nhân viên</h1>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-32">
          <div class="w-12 h-12 rounded-2xl border-4 border-emerald-700/30 border-t-emerald-700 animate-spin"></div>
          <span class="ml-4 text-slate-500 font-semibold">Đang tải thông tin...</span>
        </div>
      }

      <!-- Error -->
      @if (loadError()) {
        <div class="flex items-start gap-4 p-6 bg-red-50 text-red-700 rounded-3xl border border-red-100">
          <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <span class="text-lg font-bold">!</span>
          </div>
          <div>
            <p class="font-bold text-sm">Không thể tải thông tin nhân viên</p>
            <p class="mt-1 text-sm opacity-80">{{ loadError() }}</p>
          </div>
        </div>
      }

      <!-- Main Profile Card -->
      @if (!loading() && !loadError()) {
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <!-- Sidebar Info -->
        <div class="lg:col-span-4 space-y-8">
            <div class="bg-white rounded-2xl sm:rounded-[32px] p-6 sm:p-10 shadow-soft border border-slate-100 text-center">
               <div class="w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-2xl sm:rounded-[32px] overflow-hidden border-4 border-slate-50 shadow-lg mb-4 sm:mb-6">
                <img [src]="'https://ui-avatars.com/api/?name=' + employee()?.fullName + '&size=256&background=0f766e&color=fff'" alt="Avatar">
              </div>
               <h2 class="text-xl sm:text-2xl font-black text-slate-900 leading-tight truncate px-2">{{ employee()?.fullName }}</h2>
               <p class="text-emerald-700 font-bold mt-1 text-sm sm:text-base">{{ employee()?.position }}</p>

               <div class="flex justify-center gap-2 mt-4">
                   <span class="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 uppercase tracking-widest">Đang làm</span>
                  <span class="px-3 py-1 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold border border-slate-100 uppercase tracking-widest">Toàn thời gian</span>
               </div>

               <div class="mt-6 sm:mt-10 space-y-3 sm:space-y-4 text-left">
                  <div class="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-slate-500 min-w-0">
                     <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <lucide-icon name="mail" class="w-4 h-4"></lucide-icon>
                     </div>
                     <span class="truncate">{{ employee()?.email }}</span>
                  </div>
                  <div class="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-slate-500">
                     <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <lucide-icon name="phone" class="w-4 h-4"></lucide-icon>
                     </div>
                     {{ employee()?.phone }}
                  </div>
                  <div class="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-slate-500">
                     <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <lucide-icon name="calendar" class="w-4 h-4"></lucide-icon>
                     </div>
                      Ngày vào làm: {{ employee()?.hireDate | date:'dd/MM/yyyy' }}
                  </div>
               </div>
            </div>
        </div>

        <!-- Details Content -->
        <div class="lg:col-span-8 space-y-8">
           <!-- Basic Details -->
            <div class="bg-white rounded-2xl sm:rounded-[32px] p-6 sm:p-10 shadow-soft border border-slate-100">
               <h3 class="text-lg sm:text-xl font-bold text-slate-900 mb-6 sm:mb-8 flex items-center gap-3">
                  <lucide-icon name="briefcase" class="w-5 h-5 text-emerald-700"></lucide-icon>
                  Kinh nghiệm & Chức vụ
               </h3>
               <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                  <div>
                     <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phòng ban</p>
                     <p class="text-base sm:text-lg font-bold text-slate-900">{{ getDeptName(employee()?.departmentId) }}</p>
                  </div>
                  <div>
                     <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Thâm niên</p>
                     <p class="text-base sm:text-lg font-bold text-slate-900">1.5 Năm</p>
                  </div>
                  <div>
                     <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quản lý trực tiếp</p>
                     <p class="text-base sm:text-lg font-bold text-slate-900">Sarah Connor</p>
                  </div>
                  <div>
                     <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Văn phòng</p>
                     <p class="text-base sm:text-lg font-bold text-slate-900">Quận 1, TP. HCM</p>
                  </div>
               </div>
            </div>

           <!-- Salary Config -->
            <div class="bg-white rounded-2xl sm:rounded-[32px] p-6 sm:p-10 shadow-soft border border-slate-100">
               <div class="flex items-center justify-between mb-6 sm:mb-8">
                 <h3 class="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-3">
                    <lucide-icon name="dollar-sign" class="w-5 h-5 text-emerald-700"></lucide-icon>
                    Cấu hình lương
                 </h3>
                 @if (salaryConfig() && !editingSalary()) {
                   <button (click)="toggleEditSalary()" class="p-2 rounded-xl transition-all bg-slate-50 text-slate-500 hover:bg-slate-100">
                     <lucide-icon name="edit-2" class="w-4 h-4"></lucide-icon>
                   </button>
                 }
               </div>

               @if (salarySaving()) {
                 <div class="flex items-center justify-center py-12">
                   <lucide-icon name="loader2" class="w-5 h-5 text-emerald-700 animate-spin"></lucide-icon>
                   <span class="ml-2 text-slate-500 text-sm font-semibold">Đang lưu...</span>
                 </div>
               } @else if (!salaryConfig() && !salaryLoading()) {
                 <div class="text-center py-8">
                   <div class="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                     <lucide-icon name="dollar-sign" class="w-7 h-7 text-slate-300"></lucide-icon>
                   </div>
                   <p class="text-slate-500 font-medium mb-4">Chưa có cấu hình lương cho nhân viên này</p>
                   <button (click)="initializeSalary()" class="px-6 py-2.5 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all text-sm shadow-lg shadow-emerald-700/20">
                     Khởi tạo cấu hình lương
                   </button>
                 </div>
               } @else if (salaryLoading()) {
                 <div class="flex items-center justify-center py-8">
                   <lucide-icon name="loader2" class="w-5 h-5 text-emerald-700 animate-spin"></lucide-icon>
                   <span class="ml-2 text-slate-500 text-sm font-semibold">Đang tải...</span>
                 </div>
               } @else if (salaryConfig()) {
                 @if (editingSalary()) {
                   <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                     <div>
                       <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Lương cơ bản</label>
                       <input type="number" [(ngModel)]="editSalary.baseSalary" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-700/20 outline-none">
                     </div>
                     <div>
                       <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Phụ cấp</label>
                       <input type="number" [(ngModel)]="editSalary.allowances" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-700/20 outline-none">
                     </div>
                     <div>
                       <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ngân hàng</label>
                       <input type="text" [(ngModel)]="editSalary.bankName" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-700/20 outline-none">
                     </div>
                     <div>
                       <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Số tài khoản</label>
                       <input type="text" [(ngModel)]="editSalary.bankAccount" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-700/20 outline-none">
                     </div>
                     <div class="sm:col-span-2">
                       <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mã số thuế</label>
                       <input type="text" [(ngModel)]="editSalary.taxCode" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-700/20 outline-none">
                     </div>
                     <div class="sm:col-span-2 flex gap-3">
                       <button (click)="cancelEditSalary()" class="px-6 py-2.5 font-bold text-slate-400 hover:text-slate-900 rounded-xl transition-all text-sm">Hủy</button>
                       <button (click)="saveSalary()" class="px-6 py-2.5 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20 text-sm">Lưu</button>
                     </div>
                   </div>
                 } @else {
                   <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10">
                     <div class="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 sm:p-5">
                       <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                          <lucide-icon name="dollar-sign" class="w-5 h-5 text-emerald-600"></lucide-icon>
                       </div>
                       <div class="min-w-0">
                          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Lương cơ bản</p>
                          <p class="text-base sm:text-lg font-black text-slate-900">{{ formatSalary(salaryConfig()?.baseSalary) }}</p>
                       </div>
                     </div>
                     <div class="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 sm:p-5">
                       <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                          <lucide-icon name="dollar-sign" class="w-5 h-5 text-emerald-600"></lucide-icon>
                       </div>
                       <div class="min-w-0">
                          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Phụ cấp</p>
                          <p class="text-base sm:text-lg font-black text-slate-900">{{ formatSalary(salaryConfig()?.allowances) }}</p>
                       </div>
                     </div>
                     <div class="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 sm:p-5">
                       <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                          <lucide-icon name="building" class="w-5 h-5 text-emerald-600"></lucide-icon>
                       </div>
                       <div class="min-w-0">
                          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Ngân hàng</p>
                          <p class="text-base sm:text-lg font-black text-slate-900 truncate">{{ salaryConfig()?.bankName }}</p>
                       </div>
                     </div>
                     <div class="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 sm:p-5">
                       <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                          <lucide-icon name="landmark" class="w-5 h-5 text-emerald-600"></lucide-icon>
                       </div>
                       <div class="min-w-0">
                          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Số tài khoản</p>
                          <p class="text-base sm:text-lg font-black text-slate-900 truncate">{{ salaryConfig()?.bankAccount }}</p>
                       </div>
                     </div>
                     <div class="flex items-center gap-4 bg-slate-50 rounded-2xl p-4 sm:p-5 sm:col-span-2">
                       <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                          <lucide-icon name="hash" class="w-5 h-5 text-emerald-600"></lucide-icon>
                       </div>
                       <div class="min-w-0">
                          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Mã số thuế</p>
                          <p class="text-base sm:text-lg font-black text-slate-900">{{ salaryConfig()?.taxCode }}</p>
                       </div>
                     </div>
                   </div>
                 }
               }
            </div>

           <!-- Account Management -->
            <div class="bg-white rounded-2xl sm:rounded-[32px] p-6 sm:p-10 shadow-soft border border-slate-100">
               <h3 class="text-lg sm:text-xl font-bold text-slate-900 mb-6 sm:mb-8 flex items-center gap-3">
                  <lucide-icon name="lock" class="w-5 h-5 text-emerald-700"></lucide-icon>
                  Tài khoản đăng nhập
               </h3>

               @if (employee()?.userId) {
                 <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 rounded-2xl p-5">
                   <div class="flex items-center gap-4">
                     <div class="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <lucide-icon name="shield-check" class="w-6 h-6 text-emerald-700"></lucide-icon>
                     </div>
                     <div>
                        <p class="font-bold text-slate-900">Tài khoản đã được tạo</p>
                        <p class="text-sm text-slate-400">Email: {{ employee()?.email }}</p>
                     </div>
                   </div>
                   <button (click)="resetPassword()" class="px-5 py-2.5 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all text-sm shadow-lg shadow-emerald-700/20">
                     Đặt lại mật khẩu
                   </button>
                 </div>
               } @else {
                 <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-50 rounded-2xl p-5 border border-amber-100">
                   <div class="flex items-center gap-4">
                     <div class="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <lucide-icon name="lock" class="w-6 h-6 text-amber-700"></lucide-icon>
                     </div>
                     <div>
                        <p class="font-bold text-slate-900">Chưa có tài khoản</p>
                        <p class="text-sm text-slate-500">Tạo tài khoản để nhân viên có thể đăng nhập hệ thống.</p>
                     </div>
                   </div>
                   <button (click)="createAccount()" class="px-5 py-2.5 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all text-sm shadow-lg shadow-emerald-700/20">
                     Tạo tài khoản
                   </button>
                 </div>
               }
            </div>

           <!-- Transfer History + Chuyển phòng ban -->
            <div class="bg-white rounded-2xl sm:rounded-[32px] p-6 sm:p-10 shadow-soft border border-slate-100">
               <div class="flex items-center justify-between mb-6 sm:mb-8">
                 <h3 class="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-3">
                    <lucide-icon name="history" class="w-5 h-5 text-emerald-700"></lucide-icon>
                    Lịch sử chuyển phòng
                 </h3>
                  <button (click)="openTransferPopup()" class="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-all text-sm">
                   <lucide-icon name="arrow-left-right" class="w-4 h-4"></lucide-icon>
                   Chuyển phòng ban
                 </button>
               </div>

               @if (sortedTransferHistory().length > 0) {
               <div class="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-slate-50">
                 @for (history of sortedTransferHistory(); track $index) {
                   <div class="relative flex items-center gap-6">
                     <div class="absolute left-0 w-10 h-10 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center flex-shrink-0 z-10">
                        <div class="w-2 h-2 rounded-full bg-emerald-700"></div>
                     </div>
                     <div class="ml-14 flex-1">
                        <div class="flex items-center justify-between mb-1">
                            <span class="text-sm font-black text-slate-900">{{ history.date | date:'dd/MM/yyyy' }}</span>
                           <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-lg">{{ history.reason }}</span>
                        </div>
                        <div class="flex items-center gap-3 text-slate-500 font-medium text-sm">
                           <span [class]="history.from === 'None' ? 'text-slate-300 italic' : ''">{{ history.from }}</span>
                           <lucide-icon name="arrow-right" class="w-3 h-3 opacity-50"></lucide-icon>
                           <span class="text-slate-900 font-bold">{{ history.to }}</span>
                        </div>
                     </div>
                   </div>
                  }
                  <div #transferSentinel class="h-1"></div>
                </div>
                } @else {
                 <p class="text-sm text-slate-400 text-center py-8">Chưa có lịch sử chuyển phòng.</p>
                }
            </div>
        </div>
      </div>
    }
    </div>

    <!-- Reset Password Success Popup -->
    @if (showResetPasswordPopup()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200">
        <div (click)="showResetPasswordPopup.set(false)" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md mx-4 p-8 animate-in zoom-in-95 duration-200 text-center">
          <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <lucide-icon name="shield-check" class="w-8 h-8 text-emerald-700"></lucide-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-900 mb-2">Mật khẩu đã được đặt lại</h2>
          <p class="text-sm text-slate-500 mb-6">Mật khẩu mới đã được gửi đến email <strong>{{ employee()?.email }}</strong></p>
          <div class="bg-slate-50 rounded-2xl p-4 mb-6">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mật khẩu mới</p>
            <p class="text-lg font-black text-emerald-700 tracking-wider">{{ generatedPassword }}</p>
          </div>
          <p class="text-xs text-slate-400 mb-6">Vui lòng sao chép mật khẩu này và gửi đến nhân viên. Chúng tôi cũng đã gửi email thông báo.</p>
          <button (click)="showResetPasswordPopup.set(false)" class="w-full py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all text-sm">Đã sao chép</button>
        </div>
      </div>
    }

    <!-- Transfer Department Popup -->
    @if (showTransferPopup()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200">
        <div (click)="showTransferPopup.set(false)" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md mx-4 p-8 animate-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
              <lucide-icon name="arrow-left-right" class="w-5 h-5 text-emerald-600"></lucide-icon>
              Chuyển phòng ban
            </h2>
            <button (click)="showTransferPopup.set(false)" class="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
              <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
            </button>
          </div>
           <p class="text-sm text-slate-500 mb-5">Chọn phòng ban mới cho <strong>{{ employee()?.fullName }}</strong></p>
           <div class="space-y-2 mb-6 max-h-64 overflow-y-auto">
             @for (dept of departmentsList(); track dept.id) {
               <button (click)="selectedTransferDept = dept" [class.bg-emerald-50]="selectedTransferDept?.id === dept.id" [class.border-emerald-200]="selectedTransferDept?.id === dept.id" class="w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all text-left">
                 <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                   <lucide-icon name="building" class="w-5 h-5 text-slate-400"></lucide-icon>
                 </div>
                 <div>
                   <p class="font-bold text-slate-900 text-sm">{{ dept.name }}</p>
                   <p class="text-xs text-slate-400">{{ getDeptEmployeeCount(dept.id) }} thành viên</p>
                 </div>
               </button>
             }
             <div #deptSentinel class="h-1"></div>
             @if (departmentsLoading()) {
               <div class="flex items-center justify-center py-4">
                 <div class="w-6 h-6 rounded-lg border-2 border-emerald-700/30 border-t-emerald-700 animate-spin"></div>
               </div>
             }
           </div>
          <div class="flex gap-3">
            <button (click)="showTransferPopup.set(false)" class="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Hủy</button>
            <button (click)="confirmTransfer()" [class.opacity-50]="!selectedTransferDept" class="flex-1 py-3 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all text-sm shadow-lg shadow-emerald-700/20">Xác nhận chuyển</button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminEmployeeDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  route = inject(ActivatedRoute);
  api = inject(Api);
  mockService = inject(MockDataService);
  employee = signal<any>(null);
  salaryConfig = signal<SalaryConfigDto | undefined>(undefined);
  salaryLoading = signal(false);
  salarySaving = signal(false);
  isScrolled = signal(false);
  loading = signal(false);
  loadError = signal('');

  showResetPasswordPopup = signal(false);
  generatedPassword = '';

  editingSalary = signal(false);
  editSalary: Partial<SalaryConfigDto> = {};

  showTransferPopup = signal(false);
  selectedTransferDept: any = null;

  transferHistory = signal<any[]>([]);
  transferHistoryPage = signal(1);
  transferHistoryTotalPages = signal(0);
  transferHistoryLoading = signal(false);

  departmentsList = signal<any[]>([]);
  departmentsPage = signal(1);
  departmentsTotalPages = signal(0);
  departmentsLoading = signal(false);

  @ViewChild('transferSentinel', { read: ElementRef }) transferSentinel?: ElementRef;
  @ViewChild('deptSentinel', { read: ElementRef }) deptSentinel?: ElementRef;
  private intersectionObserver?: IntersectionObserver;
  private deptObserver?: IntersectionObserver;

  private scrollSub?: Subscription;

  ngOnInit() {
    this.mockService.loadAllDepartments();
    const main = document.querySelector('main');
    if (main) {
      this.scrollSub = fromEvent(main, 'scroll').subscribe(() => {
        this.isScrolled.set(main.scrollTop > 20);
      });
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmployee(+id);
    }
  }

  ngAfterViewInit() {
    this.intersectionObserver = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && !this.transferHistoryLoading()) {
        const nextPage = this.transferHistoryPage() + 1;
        if (nextPage <= this.transferHistoryTotalPages()) {
          this.loadTransferHistory(nextPage);
        }
      }
    }, { rootMargin: '100px' });
    if (this.transferSentinel) {
      this.intersectionObserver.observe(this.transferSentinel.nativeElement);
    }

    this.deptObserver = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && !this.departmentsLoading()) {
        const nextPage = this.departmentsPage() + 1;
        if (nextPage <= this.departmentsTotalPages()) {
          this.loadDepartments(nextPage);
        }
      }
    }, { rootMargin: '100px' });
    if (this.deptSentinel) {
      this.deptObserver.observe(this.deptSentinel.nativeElement);
    }
  }

  async loadEmployee(id: number) {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const resp = await this.api.invoke$Response(apiEmployeesIdGet$Json, { id });
      const body = resp.body;
      if (body.isSuccess) {
        this.employee.set(body.result);
        this.loadSalaryConfig(id);
        this.loadTransferHistory(1);
      } else {
        this.loadError.set(body.message || 'Không thể tải thông tin nhân viên');
      }
    } catch (err: any) {
      this.loadError.set(err?.message || err?.error?.message || 'Lỗi kết nối đến máy chủ');
    } finally {
      this.loading.set(false);
    }
  }

  async loadSalaryConfig(employeeId: number) {
    this.salaryLoading.set(true);
    try {
      const resp = await this.api.invoke$Response(apiSalaryConfigsByEmployeeEmployeeIdGet$Json, { employeeId });
      const body = resp.body;
      if (body.isSuccess && body.result) {
        const config = body.result as SalaryConfigDto;
        this.salaryConfig.set(config);
        this.editSalary = { ...config };
      } else {
        this.salaryConfig.set(undefined);
      }
    } catch {
      this.salaryConfig.set(undefined);
    } finally {
      this.salaryLoading.set(false);
    }
  }

  async loadTransferHistory(page: number) {
    this.transferHistoryLoading.set(true);
    const emp = this.employee();
    if (!emp) { this.transferHistoryLoading.set(false); return; }
    const empId = emp.id;
    try {
      const resp = await this.api.invoke$Response(apiEmployeeDepartmentHistoriesByEmployeeEmployeeIdGet$Json, { employeeId: empId });
      const body = resp.body;
      if (body.isSuccess && body.result) {
        const items = body.result as EmployeeDepartmentHistoryDto[];
        let prevName: string | null = null;
        const mapped = items.map(item => {
          const deptName = item.departmentName || 'Không xác định';
          const fromName = prevName || 'None';
          prevName = deptName;
          return { date: item.startDate, from: fromName, to: deptName, reason: 'Chuyển phòng ban' };
        });
        this.transferHistory.set(mapped);
        this.transferHistoryTotalPages.set(1);
      }
    } catch {}
    this.transferHistoryLoading.set(false);
  }

  ngOnDestroy() {
    this.scrollSub?.unsubscribe();
    this.intersectionObserver?.disconnect();
    this.deptObserver?.disconnect();
  }

  sortedTransferHistory = computed(() => {
    return [...this.transferHistory()].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  getDeptName(id: any) {
    return this.mockService.departments().find(d => d.id == id)?.name || 'Không xác định';
  }

  getDeptEmployeeCount(deptId: any) {
    return this.mockService.employees().filter(e => e.departmentId == deptId).length;
  }

  formatSalary(val: any) {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  }

  generateRandomPassword(): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%';
    const all = upper + lower + digits + special;
    let pwd = '';
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += digits[Math.floor(Math.random() * digits.length)];
    pwd += special[Math.floor(Math.random() * special.length)];
    for (let i = 0; i < 8; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    return pwd.split('').sort(() => Math.random() - 0.5).join('');
  }

  async createAccount() {
    const pwd = this.generateRandomPassword();
    this.generatedPassword = pwd;
    const emp = this.employee();
    if (!emp) return;

    emp.userId = Date.now() + Math.floor(Math.random() * 1000);
    this.employee.set({ ...emp });
    this.mockService.employees.update(list =>
      list.map(e => e.id === emp.id ? { ...e, userId: emp.userId } : e)
    );
    this.showResetPasswordPopup.set(true);
  }

  async resetPassword() {
    const pwd = this.generateRandomPassword();
    this.generatedPassword = pwd;
    const emp = this.employee();
    if (!emp) { this.showResetPasswordPopup.set(true); return; }

    this.showResetPasswordPopup.set(true);
  }

  async initializeSalary() {
    const emp = this.employee();
    if (!emp) return;
    this.salarySaving.set(true);
    try {
      const dto: SalaryConfigDto = {
        id: 0,
        employeeId: emp.id,
        baseSalary: 0,
        allowances: 0,
        bankName: '',
        bankAccount: '',
        taxCode: ''
      };
      const resp = await this.api.invoke$Response(apiSalaryConfigsPost$Json, { body: dto });
      const body = resp.body;
      if (body.isSuccess && body.result) {
        const config = body.result as SalaryConfigDto;
        this.salaryConfig.set(config);
        this.editSalary = { ...config };
      }
    } catch {}
    this.salarySaving.set(false);
    this.editingSalary.set(false);
  }

  toggleEditSalary() {
    this.editingSalary.set(true);
  }

  cancelEditSalary() {
    if (this.salaryConfig()) {
      this.editSalary = { ...this.salaryConfig() };
    }
    this.editingSalary.set(false);
  }

  async saveSalary() {
    const config = this.salaryConfig();
    if (!config) return;
    this.salarySaving.set(true);
    try {
      const updated: SalaryConfigDto = { ...config, ...this.editSalary };
      const resp = await this.api.invoke$Response(apiSalaryConfigsPut$Json, { body: updated });
      const body = resp.body;
      if (body.isSuccess && body.result) {
        this.salaryConfig.set(body.result as SalaryConfigDto);
        this.editSalary = { ...this.salaryConfig()! };
      }
    } catch {}
    this.editingSalary.set(false);
    this.salarySaving.set(false);
  }

  openTransferPopup() {
    this.selectedTransferDept = null;
    this.departmentsList.set([]);
    this.departmentsPage.set(1);
    this.departmentsTotalPages.set(0);
    this.showTransferPopup.set(true);
    this.loadDepartments(1);
  }

  async loadDepartments(page: number) {
    this.departmentsLoading.set(true);
    try {
      const resp = await this.api.invoke$Response(apiDepartmentsGet$Json, {
        PageNumber: page,
        PageSize: 10
      });
      const paginationHeader = resp.headers.get('Pagination');
      if (paginationHeader) {
        try {
          const pagination = JSON.parse(paginationHeader);
          this.departmentsTotalPages.set(pagination.totalPages || 0);
        } catch {}
      }
      const body = resp.body;
      if (body.isSuccess) {
        const items: any[] = body.result || [];
        if (page === 1) {
          this.departmentsList.set(items);
        } else {
          this.departmentsList.update(prev => [...prev, ...items]);
        }
        this.departmentsPage.set(page);
      }
    } catch {
      if (page === 1) {
        this.departmentsList.set(this.mockService.departments());
        this.departmentsTotalPages.set(1);
      }
    } finally {
      this.departmentsLoading.set(false);
    }
  }

  async confirmTransfer() {
    if (!this.selectedTransferDept || !this.employee()) return;
    const emp = this.employee();
    const today = new Date().toISOString();

    try {
      const dto: EmployeeDepartmentHistoryDto = {
        id: 0,
        employeeId: emp.id,
        departmentId: this.selectedTransferDept.id,
        startDate: today,
        isPrimary: true
      };
      await this.api.invoke(apiEmployeeDepartmentHistoriesPost$Json, { body: dto });
      this.transferHistory.update(prev => [...prev, {
        date: today,
        from: 'None',
        to: this.selectedTransferDept.name,
        reason: 'Chuyển phòng ban'
      }]);
    } catch {}
    emp.departmentId = this.selectedTransferDept.id;
    this.employee.set({ ...emp });
    this.selectedTransferDept = null;
    this.showTransferPopup.set(false);
  }
}
