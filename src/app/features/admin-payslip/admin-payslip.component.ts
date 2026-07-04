import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Wallet, Search, Filter, ChevronLeft, ChevronRight, X, Edit2, Trash2, Save, Loader2, AlertCircle, CheckCircle2, Receipt, CalendarDays, RefreshCw } from 'lucide-angular';
import { Api } from '../../services/api-services/api';
import { apiPayslipsGet$Json } from '../../services/api-services/fn/payslips/api-payslips-get-json';
import { apiPayslipsPut$Json } from '../../services/api-services/fn/payslips/api-payslips-put-json';
import { apiPayslipsIdDelete$Json } from '../../services/api-services/fn/payslips/api-payslips-id-delete-json';
import { apiAttendancesGet$Json } from '../../services/api-services/fn/attendances/api-attendances-get-json';
import { apiPayslipsSynchronizeAttendanceDataIdPut$Json } from '../../services/api-services/fn/payslips/api-payslips-synchronize-attendance-data-id-put-json';
import { MockDataService } from '../../core/services/mock-data.service';
import { EmployeePickerComponent } from '../../shared/employee-picker/employee-picker.component';
import { TutorialButtonComponent } from '../../shared/tutorial/tutorial-button.component';

@Component({
  selector: 'app-admin-payslip',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, EmployeePickerComponent, TutorialButtonComponent],
  template: `
    <div class="space-y-6 animate-in fade-in duration-700">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <lucide-icon name="wallet" class="w-8 h-8 text-emerald-600"></lucide-icon>
            Quản lý phiếu lương
          </h1>
          <p class="text-slate-500 mt-1 font-medium">Xem, sửa và quản lý phiếu lương nhân viên.</p>
        </div>
        <app-tutorial-button tutorialId="admin-payslip"></app-tutorial-button>
      </div>

      <!-- Filters -->
      <div data-tutorial="payslip-filter" class="bg-white rounded-2xl border border-slate-100 shadow-soft p-4 md:p-6">
        <div class="flex flex-col md:flex-row gap-3 md:gap-4 items-end">
          <div class="w-full md:flex-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Nhân viên</label>
            <button (click)="showPicker.set(true)"
              class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm text-left flex items-center gap-2 hover:bg-slate-100 transition-all">
              <lucide-icon name="search" class="w-4 h-4 text-slate-400 flex-shrink-0"></lucide-icon>
              @if (filterEmployeeId()) {
                <span class="font-bold text-slate-900 truncate">{{ filterEmployeeName() }}</span>
              } @else {
                <span class="text-slate-400">Tất cả nhân viên</span>
              }
              @if (filterEmployeeId()) {
                <button (click)="clearEmployeeFilter(); $event.stopPropagation()" class="ml-auto p-1 hover:bg-slate-200 rounded-lg transition-all">
                  <lucide-icon name="x" class="w-3.5 h-3.5 text-slate-400"></lucide-icon>
                </button>
              }
            </button>
          </div>
          <app-employee-picker [(visible)]="showPicker" [multiple]="false"
            (selectionWithData)="onEmployeePicked($event)"></app-employee-picker>
          <div class="flex gap-3 w-full md:w-auto">
            <div class="flex-1 md:w-28">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Tháng</label>
              <select [(ngModel)]="filterMonth"
                class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
                @for (m of months; track m.value) {
                  <option [value]="m.value">{{ m.label }}</option>
                }
              </select>
            </div>
            <div class="flex-1 md:w-28">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Năm</label>
              <select [(ngModel)]="filterYear"
                class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
                @for (y of years; track y) {
                  <option [value]="y">{{ y }}</option>
                }
              </select>
            </div>
          </div>
          <button (click)="loadPayslips()"
            class="w-full md:w-auto px-6 py-2.5 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20 text-sm flex items-center justify-center gap-2">
            <lucide-icon name="search" class="w-4 h-4"></lucide-icon>
            Tra cứu
          </button>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-16">
          <lucide-icon name="loader2" class="w-6 h-6 text-emerald-700 animate-spin"></lucide-icon>
          <span class="ml-2 text-slate-500 font-semibold">Đang tải...</span>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm">
          <lucide-icon name="alert-circle" class="w-5 h-5 flex-shrink-0 mt-0.5"></lucide-icon>
          <span class="font-semibold">{{ error() }}</span>
        </div>
      }

      <!-- Success -->
      @if (successMsg()) {
        <div class="flex items-start gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 text-sm">
          <lucide-icon name="check-circle-2" class="w-5 h-5 flex-shrink-0 mt-0.5"></lucide-icon>
          <span class="font-semibold">{{ successMsg() }}</span>
        </div>
      }

      <!-- Payslips Table (Desktop) / Cards (Mobile) -->
      @if (!loading()) {
        <div data-tutorial="payslip-list" class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <!-- Desktop Table -->
          <div class="hidden sm:block overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="bg-slate-50/50 border-b border-slate-100">
                  <th class="text-left px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nhân viên</th>
                  <th class="text-left px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kỳ lương</th>
                  <th class="text-right px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lương gộp</th>
                  <th class="text-right px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Khấu trừ</th>
                  <th class="text-right px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lương ròng</th>
                  <th class="text-center px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
                  <th class="text-right px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thao tác</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                @for (slip of payslips(); track slip.id) {
                  <tr class="hover:bg-slate-50/50 transition-all">
                    <td class="px-5 py-4">
                      <div class="flex items-center gap-3">
                         <img [src]="'https://ui-avatars.com/api/?name=' + getEmployeeName(slip.employeeId) + '&size=32&background=0f766e&color=fff'" class="w-8 h-8 rounded-lg flex-shrink-0" alt="">
                         <span class="font-bold text-sm text-slate-900 truncate">{{ getEmployeeName(slip.employeeId) }}</span>
                       </div>
                    </td>
                    <td class="px-5 py-4 text-sm font-medium text-slate-600">{{ slip.payPeriod }}</td>
                    <td class="px-5 py-4 text-right text-sm font-bold text-slate-900">{{ slip.grossSalary | number:'1.0-0' }}</td>
                    <td class="px-5 py-4 text-right text-sm font-bold text-red-500">{{ slip.deductions | number:'1.0-0' }}</td>
                    <td class="px-5 py-4 text-right text-base font-black text-emerald-600">{{ slip.netSalary | number:'1.0-0' }}</td>
                    <td class="px-5 py-4 text-center">
                      <span class="inline-block px-2.5 py-1 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {{ slip.payslipStatus }}
                      </span>
                    </td>
                    <td class="px-5 py-4 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button (click)="openDetail(slip)" data-tutorial="payslip-detail" class="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="Xem chi tiết chấm công">
                          <lucide-icon name="calendar-days" class="w-4 h-4"></lucide-icon>
                        </button>
                        <button (click)="openEditModal(slip)" data-tutorial="payslip-edit" class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                          <lucide-icon name="edit-2" class="w-4 h-4"></lucide-icon>
                        </button>
                        <button (click)="confirmDelete(slip)" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                          <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr class="border-b border-dashed border-slate-200 bg-slate-50/30">
                    <td colspan="7" class="px-5 py-2">
                      <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <lucide-icon name="info" class="w-3 h-3"></lucide-icon>
                        Mẫu hướng dẫn
                      </div>
                    </td>
                  </tr>
                  <tr class="border-b border-dashed border-slate-200 bg-slate-50/30 [&_td]:py-3 [&_td]:px-5">
                    <td>
                      <div class="flex items-center gap-3">
                        <img src="https://ui-avatars.com/api/?name=Nguy%E1%BB%85n+V%C4%83n+A&size=32&background=cbd5e1&color=fff" class="w-8 h-8 rounded-lg flex-shrink-0 opacity-60" alt="">
                        <span class="font-bold text-sm text-slate-300">Nguyễn Văn A</span>
                      </div>
                    </td>
                    <td class="text-sm font-medium text-slate-300">01/2026</td>
                    <td class="text-right text-sm font-bold text-slate-300">10,000,000</td>
                    <td class="text-right text-sm font-bold text-slate-300">1,000,000</td>
                    <td class="text-right text-base font-black text-slate-300">9,000,000</td>
                    <td class="text-center">
                      <span class="inline-block px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-300 border border-slate-200">Đã duyệt</span>
                    </td>
                    <td class="text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button data-tutorial="payslip-detail" class="p-2 text-slate-300 rounded-xl cursor-default" title="Xem chi tiết chấm công">
                          <lucide-icon name="calendar-days" class="w-4 h-4"></lucide-icon>
                        </button>
                        <button data-tutorial="payslip-edit" class="p-2 text-slate-300 rounded-xl cursor-default">
                          <lucide-icon name="edit-2" class="w-4 h-4"></lucide-icon>
                        </button>
                        <button class="p-2 text-slate-200 rounded-xl cursor-default">
                          <lucide-icon name="trash-2" class="w-4 h-4"></lucide-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="7" class="px-5 py-10 text-center">
                      <svg class="w-32 h-32 mx-auto mb-4" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="64" cy="64" r="56" fill="#f8fafc"/>
                        <circle cx="64" cy="64" r="44" fill="#f1f5f9"/>
                        <rect x="40" y="34" width="48" height="64" rx="8" fill="white" stroke="#e2e8f0" stroke-width="2"/>
                        <rect x="48" y="44" width="32" height="4" rx="2" fill="#e2e8f0"/>
                        <rect x="48" y="52" width="32" height="4" rx="2" fill="#e2e8f0"/>
                        <rect x="48" y="60" width="22" height="4" rx="2" fill="#e2e8f0"/>
                        <rect x="48" y="70" width="32" height="20" rx="6" fill="#f0fdf4"/>
                        <text x="64" y="84" text-anchor="middle" fill="#22c55e" font-size="14" font-weight="bold" font-family="sans-serif">$</text>
                        <circle cx="30" cy="38" r="3" fill="#e2e8f0"/>
                        <circle cx="98" cy="32" r="4" fill="#e2e8f0"/>
                        <circle cx="96" cy="92" r="3" fill="#e2e8f0"/>
                        <circle cx="40" cy="86" r="6" fill="white" stroke="#cbd5e1" stroke-width="1.5"/>
                        <line x1="44" y1="90" x2="48" y2="94" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                      <p class="text-sm font-semibold text-slate-400">Chưa có phiếu lương nào</p>
                      <p class="text-xs text-slate-300 mt-1.5">Thử điều chỉnh bộ lọc hoặc thêm phiếu lương mới</p>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="sm:hidden divide-y divide-slate-50">
            @for (slip of payslips(); track slip.id) {
              <div class="p-4 space-y-3 hover:bg-slate-50/50 transition-all">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2 min-w-0">
                     <img [src]="'https://ui-avatars.com/api/?name=' + getEmployeeName(slip.employeeId) + '&size=28&background=0f766e&color=fff'" class="w-7 h-7 rounded-lg flex-shrink-0" alt="">
                     <span class="font-bold text-sm text-slate-900 truncate">{{ getEmployeeName(slip.employeeId) }}</span>
                   </div>
                  <span class="inline-block px-2 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex-shrink-0">
                    {{ slip.payslipStatus }}
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span class="text-slate-400">Kỳ lương:</span>
                    <span class="ml-1 font-semibold text-slate-700">{{ slip.payPeriod }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-slate-400">Lương gộp:</span>
                    <span class="ml-1 font-semibold text-slate-900">{{ slip.grossSalary | number:'1.0-0' }}</span>
                  </div>
                  <div>
                    <span class="text-slate-400">Khấu trừ:</span>
                    <span class="ml-1 font-semibold text-red-500">{{ slip.deductions | number:'1.0-0' }}</span>
                  </div>
                  <div class="text-right">
                    <span class="text-slate-400">Lương ròng:</span>
                    <span class="ml-1 font-black text-emerald-600">{{ slip.netSalary | number:'1.0-0' }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-end gap-2 pt-1">
                  <button (click)="openDetail(slip)" class="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-slate-100">
                    <lucide-icon name="calendar-days" class="w-3.5 h-3.5 inline mr-1"></lucide-icon>
                    Chi tiết
                  </button>
                  <button (click)="openEditModal(slip)" class="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-100">
                    <lucide-icon name="edit-2" class="w-3.5 h-3.5 inline mr-1"></lucide-icon>
                    Sửa
                  </button>
                  <button (click)="confirmDelete(slip)" class="flex-1 py-2 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-100">
                    <lucide-icon name="trash-2" class="w-3.5 h-3.5 inline mr-1"></lucide-icon>
                    Xóa
                  </button>
                </div>
              </div>
            } @empty {
              <div class="px-5 py-16 text-center">
                <lucide-icon name="receipt" class="w-12 h-12 text-slate-200 mx-auto mb-3"></lucide-icon>
                <p class="text-slate-400 font-medium">Không tìm thấy phiếu lương nào</p>
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="flex items-center justify-between px-5 py-4 border-t border-slate-50 bg-slate-50/30">
              <span class="text-xs font-medium text-slate-400">Trang {{ page() }}/{{ totalPages() }}</span>
              <div class="flex items-center gap-1">
                <button (click)="changePage(-1)" [disabled]="page() <= 1"
                  class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  <lucide-icon name="chevron-left" class="w-4 h-4"></lucide-icon>
                </button>
                @for (p of pageNumbers(); track p) {
                  @if (p === -1) {
                    <span class="px-2 text-xs text-slate-300">...</span>
                  } @else {
                    <button (click)="page.set(p); loadPayslips()"
                      class="min-w-[32px] px-2 py-1.5 rounded-xl text-xs font-bold transition-all"
                      [class.bg-indigo-600]="p === page()"
                      [class.text-white]="p === page()"
                      [class.text-slate-500]="p !== page()"
                      [class.hover:bg-slate-100]="p !== page()">
                      {{ p }}
                    </button>
                  }
                }
                <button (click)="changePage(1)" [disabled]="page() >= totalPages()"
                  class="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  <lucide-icon name="chevron-right" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Edit Modal -->
    @if (editSlip()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div (click)="closeEditModal()" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div class="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between p-6 pb-4 border-b border-slate-50">
            <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <lucide-icon name="edit-2" class="w-5 h-5 text-blue-600"></lucide-icon>
              Sửa phiếu lương
            </h2>
            <button (click)="closeEditModal()" class="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
              <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Nhân viên</label>
              <p class="text-sm font-bold text-slate-900">{{ getEmployeeName(editSlip()?.employeeId) }}</p>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Kỳ lương</label>
              <p class="text-sm font-bold text-slate-900">{{ editSlip()?.payPeriod }}</p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Lương gộp</label>
                <input type="number" [(ngModel)]="editForm.grossSalary"
                  class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Khấu trừ</label>
                <input type="number" [(ngModel)]="editForm.deductions"
                  class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Số ngày chuẩn</label>
                <input type="number" [(ngModel)]="editForm.standardWorkDays"
                  class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Số ngày thực tế</label>
                <input type="number" [(ngModel)]="editForm.actualWorkDays"
                  class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
              </div>
            </div>
            <div>
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Trạng thái</label>
              <select [(ngModel)]="editForm.payslipStatus"
                class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
                <option value="Draft">Draft</option>
                <option value="PendingApproval">Pending Approval</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
          <div class="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 p-6 pt-4 border-t border-slate-50">
            <button (click)="closeEditModal()" class="w-full sm:w-auto px-6 py-2.5 font-bold text-slate-400 hover:text-slate-900 rounded-xl transition-all text-sm">
              Hủy
            </button>
            <button (click)="saveEdit()" [disabled]="saving()"
              class="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 text-sm">
              @if (saving()) {
                <lucide-icon name="loader2" class="w-4 h-4 animate-spin"></lucide-icon>
              } @else {
                <lucide-icon name="save" class="w-4 h-4"></lucide-icon>
              }
              Lưu
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Attendance Detail Modal -->
    @if (detailSlip()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div (click)="closeDetail()" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div class="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
          <div class="flex items-center justify-between p-6 pb-4 border-b border-slate-50 flex-shrink-0">
            <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
              <lucide-icon name="calendar-days" class="w-5 h-5 text-emerald-600"></lucide-icon>
              Chi tiết chấm công
            </h2>
            <button (click)="closeDetail()" class="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
              <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
            </button>
          </div>
          <div class="px-6 py-3 border-b border-slate-50 bg-slate-50/30 flex-shrink-0">
            <p class="text-sm">
              <span class="font-bold text-slate-900">{{ getEmployeeName(detailSlip()?.employeeId) }}</span>
              <span class="text-slate-400 mx-2">·</span>
              <span class="font-medium text-slate-600">Kỳ lương: {{ detailSlip()?.payPeriod }}</span>
            </p>
          </div>
          <div class="flex-1 overflow-y-auto p-6">
            @if (detailLoading()) {
              <div class="flex items-center justify-center py-12">
                <lucide-icon name="loader2" class="w-5 h-5 text-emerald-700 animate-spin"></lucide-icon>
                <span class="ml-2 text-slate-500 text-sm font-semibold">Đang tải...</span>
              </div>
            } @else if (detailAttendances().length === 0) {
              <div class="text-center py-12">
                <lucide-icon name="calendar-days" class="w-12 h-12 text-slate-200 mx-auto mb-3"></lucide-icon>
                <p class="text-slate-400 font-medium">Không có dữ liệu chấm công trong kỳ này</p>
              </div>
            } @else {
              <div class="hidden sm:block overflow-x-auto">
                <table class="w-full">
                  <thead>
                    <tr class="bg-slate-50/50 border-b border-slate-100">
                      <th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ngày</th>
                      <th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vào</th>
                      <th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ra</th>
                      <th class="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trạng thái</th>
                      <th class="text-right px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Trễ (ph)</th>
                      <th class="text-right px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Về sớm (ph)</th>
                      <th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    @for (a of detailAttendances(); track a.id) {
                      <tr class="hover:bg-slate-50/50 transition-all">
                        <td class="px-4 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">{{ a.workDate }}</td>
                        <td class="px-4 py-3 text-sm text-slate-600">{{ a.checkInTime ? (a.checkInTime | slice:0:5) : '—' }}</td>
                        <td class="px-4 py-3 text-sm text-slate-600">{{ a.checkOutTime ? (a.checkOutTime | slice:0:5) : '—' }}</td>
                        <td class="px-4 py-3 text-center">
                          <span class="inline-block px-2 py-0.5 text-[10px] font-bold rounded-lg whitespace-nowrap"
                            [class.bg-emerald-50]="a.status === 'Present'"
                            [class.text-emerald-700]="a.status === 'Present'"
                            [class.border]="a.status === 'Present'"
                            [class.border-emerald-100]="a.status === 'Present'"
                            [class.bg-amber-50]="a.status === 'Late'"
                            [class.text-amber-700]="a.status === 'Late'"
                            [class.border]="a.status === 'Late'"
                            [class.border-amber-100]="a.status === 'Late'"
                            [class.bg-red-50]="a.status === 'Absent'"
                            [class.text-red-700]="a.status === 'Absent'"
                            [class.border]="a.status === 'Absent'"
                            [class.border-red-100]="a.status === 'Absent'"
                            [class.bg-blue-50]="a.status === 'EarlyLeave' || a.status === 'OnLeave'"
                            [class.text-blue-700]="a.status === 'EarlyLeave' || a.status === 'OnLeave'"
                            [class.border]="a.status === 'EarlyLeave' || a.status === 'OnLeave'"
                            [class.border-blue-100]="a.status === 'EarlyLeave' || a.status === 'OnLeave'">
                            {{ a.status === 'Present' ? 'Đúng giờ' : a.status === 'Late' ? 'Đi muộn' : a.status === 'Absent' ? 'Vắng' : a.status === 'EarlyLeave' ? 'Về sớm' : a.status === 'OnLeave' ? 'Nghỉ phép' : a.status }}
                          </span>
                        </td>
                        <td class="px-4 py-3 text-right text-sm font-medium" [class.text-red-500]="a.lateMinutes > 0" [class.text-slate-500]="!a.lateMinutes || a.lateMinutes === 0">{{ a.lateMinutes ?? '—' }}</td>
                        <td class="px-4 py-3 text-right text-sm font-medium" [class.text-red-500]="a.earlyLeaveMinutes > 0" [class.text-slate-500]="!a.earlyLeaveMinutes || a.earlyLeaveMinutes === 0">{{ a.earlyLeaveMinutes ?? '—' }}</td>
                        <td class="px-4 py-3 text-sm text-slate-500 max-w-[160px] truncate">{{ a.notes || '—' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
              <div class="sm:hidden space-y-2">
                @for (a of detailAttendances(); track a.id) {
                  <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-bold text-slate-900">{{ a.workDate }}</p>
                      <p class="text-xs text-slate-500 mt-0.5">
                        {{ a.checkInTime ? (a.checkInTime | slice:0:5) : '—' }}
                        →
                        {{ a.checkOutTime ? (a.checkOutTime | slice:0:5) : '—' }}
                      </p>
                      @if (a.notes) {
                        <p class="text-xs text-slate-400 mt-0.5 truncate">{{ a.notes }}</p>
                      }
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span class="inline-block px-2 py-0.5 text-[10px] font-bold rounded-lg whitespace-nowrap"
                        [class.bg-emerald-50]="a.status === 'Present'"
                        [class.text-emerald-700]="a.status === 'Present'"
                        [class.bg-amber-50]="a.status === 'Late'"
                        [class.text-amber-700]="a.status === 'Late'"
                        [class.bg-red-50]="a.status === 'Absent'"
                        [class.text-red-700]="a.status === 'Absent'"
                        [class.bg-blue-50]="a.status === 'EarlyLeave' || a.status === 'OnLeave'"
                        [class.text-blue-700]="a.status === 'EarlyLeave' || a.status === 'OnLeave'">
                        {{ a.status === 'Present' ? 'Đúng giờ' : a.status === 'Late' ? 'Đi muộn' : a.status === 'Absent' ? 'Vắng' : a.status === 'EarlyLeave' ? 'Về sớm' : a.status === 'OnLeave' ? 'Nghỉ phép' : a.status }}
                      </span>
                      @if (a.lateMinutes > 0) {
                        <span class="text-[10px] font-bold text-red-500">+{{ a.lateMinutes }}'</span>
                      }
                      @if (a.earlyLeaveMinutes > 0) {
                        <span class="text-[10px] font-bold text-amber-500">-{{ a.earlyLeaveMinutes }}'</span>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
          <div class="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-slate-50/30 flex-shrink-0">
            <span class="text-xs font-medium text-slate-400">{{ detailAttendances().length }} ngày công</span>
            <div class="flex items-center gap-3">
              @if (detailTotalPages() > 1) {
                <div class="flex items-center gap-1 mr-2">
                  <button (click)="detailChangePage(-1)" [disabled]="detailPage() <= 1"
                    class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    <lucide-icon name="chevron-left" class="w-3.5 h-3.5"></lucide-icon>
                  </button>
                  <span class="text-xs font-medium text-slate-400 px-1">{{ detailPage() }}/{{ detailTotalPages() }}</span>
                  <button (click)="detailChangePage(1)" [disabled]="detailPage() >= detailTotalPages()"
                    class="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    <lucide-icon name="chevron-right" class="w-3.5 h-3.5"></lucide-icon>
                  </button>
                </div>
              }
              <button (click)="synchronizeAttendance()" [disabled]="syncing()"
                class="px-5 py-2 text-sm font-bold text-emerald-700 hover:text-emerald-900 rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-2">
                @if (syncing()) {
                  <lucide-icon name="loader2" class="w-4 h-4 animate-spin"></lucide-icon>
                } @else {
                  <lucide-icon name="refresh-cw" class="w-4 h-4"></lucide-icon>
                }
                Đồng bộ chấm công
              </button>
              <button (click)="closeDetail()" class="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all">
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirmation -->
    @if (deleteTarget()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div (click)="deleteTarget.set(null)" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div class="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95 duration-200">
          <div class="text-center">
            <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <lucide-icon name="alert-circle" class="w-7 h-7 text-red-500"></lucide-icon>
            </div>
            <h3 class="text-lg font-bold text-slate-900">Xóa phiếu lương</h3>
            <p class="text-sm text-slate-500 mt-2">Bạn có chắc muốn xóa phiếu lương kỳ <strong>{{ deleteTarget()?.payPeriod }}</strong> của <strong>{{ getEmployeeName(deleteTarget()?.employeeId) }}</strong>?</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-3 mt-6">
            <button (click)="deleteTarget.set(null)" class="flex-1 px-4 py-2.5 font-bold text-slate-400 hover:text-slate-900 rounded-xl transition-all text-sm">
              Hủy
            </button>
            <button (click)="doDelete()" [disabled]="saving()"
              class="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 text-sm flex items-center justify-center">
              @if (saving()) {
                <lucide-icon name="loader2" class="w-4 h-4 animate-spin"></lucide-icon>
              } @else {
                'Xóa'
              }
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminPayslipComponent implements OnInit {
  api = inject(Api);
  mockService = inject(MockDataService);

  getEmployeeName(id: number | string | undefined | null): string {
    if (!id) return '';
    const emp = this.mockService.employees().find(e => e.id == id);
    return emp?.fullName || '#' + id;
  }

  months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
  years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  filterEmployeeId = signal<number | undefined>(undefined);
  filterEmployeeName = signal('');
  filterMonth = signal(new Date().getMonth() + 1);
  filterYear = signal(new Date().getFullYear());
  showPicker = signal(false);

  payslips = signal<any[]>([]);
  page = signal(1);
  totalPages = signal(0);
  pageNumbers = computed(() => {
    const current = this.page();
    const total = this.totalPages();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [];
    pages.push(1);
    if (current > 3) pages.push(-1);
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  });
  loading = signal(false);
  saving = signal(false);
  error = signal('');
  successMsg = signal('');

  editSlip = signal<any | null>(null);
  deleteTarget = signal<any | null>(null);
  detailSlip = signal<any | null>(null);
  detailAttendances = signal<any[]>([]);
  detailPage = signal(1);
  detailTotalPages = signal(0);
  detailLoading = signal(false);
  syncing = signal(false);

  editForm: any = {};

  ngOnInit() {
    this.loadPayslips();
  }

  onEmployeePicked(employees: {id: number, fullName: string}[]) {
    this.filterEmployeeId.set(employees.length > 0 ? employees[0].id : undefined);
    this.filterEmployeeName.set(employees.length > 0 ? employees[0].fullName : '');
  }

  clearEmployeeFilter() {
    this.filterEmployeeId.set(undefined);
    this.filterEmployeeName.set('');
  }

  async loadPayslips() {
    this.loading.set(true);
    this.error.set('');
    this.successMsg.set('');
    try {
      const resp = await this.api.invoke$Response(apiPayslipsGet$Json, {
        EmployeeId: this.filterEmployeeId(),
        Month: this.filterMonth(),
        Year: this.filterYear(),
        PageNumber: this.page(),
        PageSize: 10
      });
      const paginationHeader = resp.headers.get('Pagination');
      if (paginationHeader) {
        try {
          const pagination = JSON.parse(paginationHeader);
          this.totalPages.set(pagination.totalPages || 0);
        } catch {}
      }
      const body = resp.body;
      if (body.isSuccess) {
        this.payslips.set(Array.isArray(body.result) ? body.result : []);
      } else {
        this.error.set(body.message || 'Không thể tải danh sách phiếu lương');
        this.payslips.set([]);
      }
    } catch {
      // fallback to mock data
      let list = this.mockService.payslips();
      if (this.filterEmployeeId()) {
        list = list.filter(s => s.employeeId == this.filterEmployeeId());
      }
      if (this.filterMonth()) {
        list = list.filter(s => {
          return s.month == this.filterMonth();
        });
      }
      this.payslips.set(list);
      this.totalPages.set(1);
    } finally {
      this.loading.set(false);
    }
  }

  changePage(delta: number) {
    const newPage = this.page() + delta;
    if (newPage < 1 || newPage > this.totalPages()) return;
    this.page.set(newPage);
    this.loadPayslips();
  }

  openEditModal(slip: any) {
    this.editForm = {
      grossSalary: slip.grossSalary,
      deductions: slip.deductions,
      standardWorkDays: slip.standardWorkDays,
      actualWorkDays: slip.actualWorkDays,
      payslipStatus: slip.payslipStatus
    };
    this.editSlip.set(slip);
  }

  closeEditModal() {
    this.editSlip.set(null);
    this.editForm = {};
  }

  async saveEdit() {
    const slip = this.editSlip();
    if (!slip) return;
    this.saving.set(true);
    this.error.set('');
    try {
      const body: any = {
        ...slip,
        grossSalary: this.editForm.grossSalary,
        deductions: this.editForm.deductions,
        standardWorkDays: this.editForm.standardWorkDays,
        actualWorkDays: this.editForm.actualWorkDays,
        payslipStatus: this.editForm.payslipStatus
      };
      await this.api.invoke(apiPayslipsPut$Json, { body });
      this.successMsg.set('Cập nhật phiếu lương thành công.');
      this.closeEditModal();
      this.loadPayslips();
    } catch {
      // fallback: update local mock data
      this.mockService.payslips.update(list =>
        list.map(s => s.id === slip.id ? { ...s, ...this.editForm } : s)
      );
      this.successMsg.set('Cập nhật phiếu lương thành công (offline).');
      this.closeEditModal();
    } finally {
      this.saving.set(false);
    }
  }

  openDetail(slip: any) {
    this.detailSlip.set(slip);
    this.detailPage.set(1);
    this.detailTotalPages.set(0);
    this.loadDetailAttendances();
  }

  closeDetail() {
    this.detailSlip.set(null);
    this.detailAttendances.set([]);
  }

  async synchronizeAttendance() {
    const slip = this.detailSlip();
    if (!slip) return;
    this.syncing.set(true);
    this.error.set('');
    this.successMsg.set('');
    try {
      const resp = await this.api.invoke(apiPayslipsSynchronizeAttendanceDataIdPut$Json, { id: slip.id });
      if (resp.isSuccess) {
        this.successMsg.set('Đồng bộ chấm công thành công.');
        this.loadDetailAttendances();
      } else {
        this.error.set(resp.message || 'Đồng bộ chấm công thất bại.');
      }
    } catch {
      this.error.set('Đồng bộ chấm công thất bại.');
    } finally {
      this.syncing.set(false);
    }
  }

  async loadDetailAttendances() {
    const slip = this.detailSlip();
    if (!slip) return;
    this.detailLoading.set(true);
    try {
      const resp = await this.api.invoke$Response(apiAttendancesGet$Json, {
        PayslipId: slip.id,
        PageNumber: this.detailPage(),
        PageSize: 10
      });
      const paginationHeader = resp.headers.get('Pagination');
      if (paginationHeader) {
        try {
          const pagination = JSON.parse(paginationHeader);
          this.detailTotalPages.set(pagination.totalPages || 0);
        } catch {}
      }
      const body = resp.body;
      if (body.isSuccess && Array.isArray(body.result)) {
        this.detailAttendances.set(body.result);
      } else {
        this.detailAttendances.set([]);
      }
    } catch {
      this.detailAttendances.set([]);
    } finally {
      this.detailLoading.set(false);
    }
  }

  detailChangePage(delta: number) {
    const newPage = this.detailPage() + delta;
    if (newPage < 1 || newPage > this.detailTotalPages()) return;
    this.detailPage.set(newPage);
    this.loadDetailAttendances();
  }

  confirmDelete(slip: any) {
    this.deleteTarget.set(slip);
  }

  async doDelete() {
    const slip = this.deleteTarget();
    if (!slip) return;
    this.saving.set(true);
    try {
      await this.api.invoke(apiPayslipsIdDelete$Json, { id: slip.id });
      this.successMsg.set('Xóa phiếu lương thành công.');
      this.deleteTarget.set(null);
      this.loadPayslips();
    } catch {
      // fallback: update local mock data
      this.mockService.payslips.update(list => list.filter(s => s.id !== slip.id));
      this.successMsg.set('Xóa phiếu lương thành công (offline).');
      this.deleteTarget.set(null);
    } finally {
      this.saving.set(false);
    }
  }
}
