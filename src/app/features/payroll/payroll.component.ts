import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CreditCard, Receipt, FileText, Download, Wallet, Search, Loader2 } from 'lucide-angular';
import { TutorialButtonComponent } from '../../shared/tutorial/tutorial-button.component';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Api } from '../../services/api-services/api';
import { apiPayslipsGet$Json } from '../../services/api-services/fn/payslips/api-payslips-get-json';
import { apiEmployeesMeGet$Json } from '../../services/api-services/fn/employees/api-employees-me-get-json';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TutorialButtonComponent],
  template: `
    <div class="space-y-10 animate-in slide-in-from-right-4 duration-700">
      <div data-tutorial="pay-header" class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Bảng lương & Phiếu lương</h1>
          <p class="text-slate-500 mt-2">Theo dõi thu nhập hàng tháng và cấu hình lương.</p>
        </div>
        <app-tutorial-button tutorialId="employee-payroll"></app-tutorial-button>
      </div>

      <!-- Financial Overview Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div data-tutorial="pay-income" class="lg:col-span-2 bg-slate-900 rounded-2xl sm:rounded-[32px] p-6 sm:p-10 text-white relative overflow-hidden">
           <div class="relative z-10">
              <p class="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-3 sm:mb-4">Thu nhập ròng tháng này</p>
              <div class="flex flex-wrap items-end gap-2 sm:gap-3 mb-6 sm:mb-10">
                <span class="text-3xl sm:text-5xl font-black tabular-nums tracking-tight">{{ (latestSlip()?.netSalary ?? 0) | number:'1.0-0' }} ₫</span>
                <span class="text-emerald-400 font-bold mb-0.5 sm:mb-2 flex items-center gap-1 text-xs sm:text-sm bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  <lucide-icon name="trending-up" class="w-3 h-3"></lucide-icon>
                  +0%
                </span>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
                 <div>
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lương gộp</p>
                    <p class="text-base sm:text-lg font-bold tabular-nums">{{ (latestSlip()?.grossSalary ?? 0) | number:'1.0-0' }} ₫</p>
                 </div>
                 <div class="sm:border-l sm:border-slate-800 sm:pl-8">
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Khấu trừ</p>
                    <p class="text-base sm:text-lg font-bold tabular-nums text-red-400">{{ (latestSlip()?.deductions ?? 0) | number:'1.0-0' }} ₫</p>
                 </div>
                 <div class="sm:border-l sm:border-slate-800 sm:pl-8">
                    <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Trạng thái</p>
                    <p class="text-base sm:text-lg font-bold">{{ latestSlip()?.payslipStatus || 'N/A' }}</p>
                 </div>
              </div>
           </div>
           <div class="absolute top-6 sm:top-10 right-6 sm:right-10 opacity-20 pointer-events-none">
              <lucide-icon name="wallet" class="w-10 h-10 sm:w-16 sm:h-16"></lucide-icon>
           </div>
        </div>

        <div data-tutorial="pay-bank" class="bg-white rounded-2xl sm:rounded-[32px] p-6 sm:p-10 shadow-soft border border-slate-100 flex flex-col justify-between">
           <div>
              <h3 class="text-lg sm:text-xl font-bold text-slate-800">Thông tin ngân hàng</h3>
              <p class="text-slate-400 text-xs sm:text-sm mt-1">Quản lý bởi phòng Tài chính</p>
           </div>
           <div class="space-y-4 mt-6">
              <div class="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                 <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                    <lucide-icon name="credit-card" class="w-5 h-5 text-slate-400"></lucide-icon>
                 </div>
                 <div class="min-w-0">
                    <p class="text-xs font-bold text-slate-400 uppercase truncate">{{ latestSalary()?.bankName || 'N/A' }}</p>
                    <p class="font-bold text-slate-900 leading-none mt-1 truncate">{{ latestSalary()?.bankAccount || 'N/A' }}</p>
                 </div>
              </div>
              <button class="w-full py-4 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all rounded-2xl font-bold text-sm tracking-tight">
                Yêu cầu cập nhật
              </button>
           </div>
        </div>
      </div>

      <!-- Month/Year Filters -->
      <div data-tutorial="pay-filters" class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <h2 class="text-2xl font-bold text-slate-900 pl-1">Lịch sử thanh toán</h2>
        <div class="flex items-center gap-2 ml-auto">
          <select [(ngModel)]="filterMonth"
            class="px-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
          <select [(ngModel)]="filterYear"
            class="px-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
            @for (y of years; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
          <button (click)="loadPayslips()"
            class="px-5 py-2 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20 text-sm flex items-center gap-2">
            <lucide-icon name="search" class="w-4 h-4"></lucide-icon>
            Xem
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-16">
          <lucide-icon name="loader2" class="w-6 h-6 text-emerald-700 animate-spin"></lucide-icon>
          <span class="ml-2 text-slate-500 font-semibold">Đang tải...</span>
        </div>
      }

      <!-- Payslips List -->
      @if (!loading()) {
        <div data-tutorial="pay-list" class="space-y-6">
          @for (slip of payslips(); track slip.id) {
            <div class="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[24px] shadow-soft border border-slate-100 hover:border-emerald-100 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-8">
              <div class="flex items-center gap-4 sm:gap-6">
                 <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-700 group-hover:text-white transition-all duration-500 flex-shrink-0">
                    <lucide-icon name="receipt" class="w-5 h-5 sm:w-6 sm:h-6"></lucide-icon>
                 </div>
                  <div class="min-w-0">
                     <h3 class="text-base sm:text-lg font-bold text-slate-900 truncate">{{ slip.payPeriod }}</h3>
                     <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                        <span class="text-xs sm:text-sm font-medium text-slate-400">Đã trả ngày {{ slip.payDate | date:'dd/MM/yyyy' }}</span>
                        @if (slip.employeeId) {
                          <span class="text-xs sm:text-sm font-medium text-slate-400">· {{ getEmployeeName(slip.employeeId) }}</span>
                        }
                        <span class="text-xs sm:text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 self-start">{{ slip.payslipStatus }}</span>
                     </div>
                  </div>
              </div>

              <div class="flex items-center gap-4 sm:gap-12">
                 <div class="hidden sm:block text-right">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lương gộp</p>
                    <p class="font-bold text-slate-900 mt-0.5 text-sm">{{ slip.grossSalary | number:'1.0-0' }} ₫</p>
                 </div>
                 <div class="text-right">
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lương ròng</p>
                    <p class="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">{{ slip.netSalary | number:'1.0-0' }} ₫</p>
                 </div>
                 <button class="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 rounded-xl sm:rounded-2xl text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex-shrink-0">
                    <lucide-icon name="download" class="w-4 h-4 sm:w-5 sm:h-5"></lucide-icon>
                 </button>
              </div>
            </div>
          } @empty {
            <div class="text-center py-16">
              <lucide-icon name="receipt" class="w-12 h-12 text-slate-200 mx-auto mb-3"></lucide-icon>
              <p class="text-slate-400 font-medium">Không có phiếu lương nào</p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class PayrollComponent implements OnInit {
  mockService = inject(MockDataService);
  auth = inject(AuthService);
  api = inject(Api);

  months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
  years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  filterMonth = signal(new Date().getMonth() + 1);
  filterYear = signal(new Date().getFullYear());
  payslips = signal<any[]>([]);
  loading = signal(false);
  employeeId = signal<number | undefined>(undefined);

  getEmployeeName(id: number | string): string {
    const emp = this.mockService.employees().find(e => e.id == id);
    return emp?.fullName || '#' + id;
  }

  latestSlip = computed(() => {
    const list = this.payslips();
    return list.length > 0 ? list[0] : null;
  });

  latestSalary = computed(() => {
    const empId = this.latestSlip()?.employeeId;
    if (!empId) return null;
    return this.mockService.salaryConfigs().find(s => s.employeeId == empId) || null;
  });

  async ngOnInit() {
    await this.loadEmployeeByUserId();
    await this.loadPayslips();
  }

  private async loadEmployeeByUserId() {
    try {
      const resp = await this.api.invoke(apiEmployeesMeGet$Json, {});
      if ((resp as any)?.isSuccess && (resp as any)?.result) {
        this.employeeId.set((resp as any).result.id);
      }
    } catch {}
  }

  async loadPayslips() {
    this.loading.set(true);
    const empId = this.employeeId();
    try {
      const resp = await this.api.invoke(apiPayslipsGet$Json, {
        EmployeeId: empId,
        Month: this.filterMonth(),
        Year: this.filterYear(),
        PageNumber: 1,
        PageSize: 50
      });
      if ((resp as any).isSuccess) {
        this.payslips.set(Array.isArray((resp as any).result) ? (resp as any).result : []);
      } else {
        this.payslips.set([]);
      }
    } catch {
      const m = String(this.filterMonth()).padStart(2, '0');
      this.payslips.set(this.mockService.payslips().filter(s => s.month == this.filterMonth()));
    } finally {
      this.loading.set(false);
    }
  }
}
