import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { TutorialButtonComponent } from '../../shared/tutorial/tutorial-button.component';
import { Api } from '../../services/api-services/api';
import { apiDepartmentsGet$Json } from '../../services/api-services/fn/departments/api-departments-get-json';
import { apiEmployeesGet$Json } from '../../services/api-services/fn/employees/api-employees-get-json';
import { apiEmployeesIdGet$Json } from '../../services/api-services/fn/employees/api-employees-id-get-json';
import { EmployeeDto, DepartmentDto } from '../../services/api-services/models';

@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, TutorialButtonComponent],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <div data-tutorial="org-header" class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Tổ chức</h1>
          <p class="text-slate-500 mt-2">Quản lý phòng ban và khám phá thành viên trong nhóm.</p>
        </div>

        <div class="flex items-center gap-3">
          <app-tutorial-button tutorialId="employee-organization"></app-tutorial-button>
          <div data-tutorial="org-tabs" class="bg-slate-100/50 p-1 rounded-2xl flex w-fit">
            <button
              [class]="activeTab() === 'dept' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'"
              (click)="switchTab('dept')"
              class="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
            >
              Phòng ban
            </button>
            <button
              [class]="activeTab() === 'empl' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'"
              (click)="switchTab('empl')"
              class="px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
            >
              Nhân viên
            </button>
          </div>
        </div>
      </div>

      <!-- Search Bar -->
      <div data-tutorial="org-search" class="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div class="relative w-full md:w-80">
          <lucide-icon name="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></lucide-icon>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onSearch()"
            [placeholder]="activeTab() === 'dept' ? 'Tìm phòng ban...' : 'Tìm nhân viên...'"
            class="w-full pl-12 pr-12 py-3 bg-white border border-slate-100 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none"
          />
          @if (searchQuery()) {
            <button (click)="clearSearch()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
            </button>
          }
        </div>

        <!-- Active Department Filter -->
        @if (selectedDepartment()) {
          <div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold">
            <lucide-icon name="building-2" class="w-4 h-4"></lucide-icon>
            <span>{{ selectedDepartment()!.name }}</span>
            <button (click)="clearDepartmentFilter()" class="ml-1 p-0.5 rounded-lg hover:bg-emerald-100 transition-all">
              <lucide-icon name="x" class="w-3.5 h-3.5"></lucide-icon>
            </button>
          </div>
        }
      </div>

      <div class="min-h-[400px]">
        <!-- Loading -->
        @if (loading()) {
          <div class="flex items-center justify-center py-24">
            <div class="w-12 h-12 rounded-2xl border-4 border-emerald-700/30 border-t-emerald-700 animate-spin"></div>
            <span class="ml-4 text-slate-500 font-semibold">Đang tải dữ liệu...</span>
          </div>
        }

        <!-- Error -->
        @if (loadError()) {
          <div class="flex items-start gap-4 p-6 bg-red-50 text-red-700 rounded-3xl border border-red-100">
            <div class="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <span class="text-lg font-bold">!</span>
            </div>
            <div>
              <p class="font-bold text-sm">Không thể tải dữ liệu</p>
              <p class="mt-1 text-sm opacity-80">{{ loadError() }}</p>
              <button (click)="loadPage(currentPage())" class="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-xl text-xs font-bold transition-all">
                Thử lại
              </button>
            </div>
          </div>
        }

        <!-- Departments Grid -->
        @if (!loading() && !loadError() && activeTab() === 'dept') {
          <div data-tutorial="org-dept-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in zoom-in-95 duration-300">
            @for (dept of departments(); track dept.id) {
              <div class="bg-white p-8 rounded-3xl shadow-soft border border-slate-100 hover:border-emerald-200 transition-all group">
                <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-6 group-hover:bg-emerald-700 group-hover:text-white transition-all duration-500">
                  <span class="text-xl font-bold">{{ dept.name.charAt(0) }}</span>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-2">{{ dept.name }}</h3>
                <p class="text-slate-500 text-sm leading-relaxed min-h-[48px] line-clamp-2">
                  {{ dept.description }}
                </p>

                <div class="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mã phòng ban</p>
                    <p class="text-sm font-bold text-slate-900 mt-1">#{{ dept.id }}</p>
                  </div>
                  <button (click)="viewDepartment(dept)" class="text-emerald-700 hover:text-emerald-800 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-all text-xs font-bold">
                    <lucide-icon name="users" class="w-3.5 h-3.5 inline mr-1"></lucide-icon>
                    Xem thành viên
                  </button>
                </div>
              </div>
            } @empty {
              <div class="col-span-full text-center py-24">
                <div class="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                  <span class="text-2xl font-bold text-slate-300">P</span>
                </div>
                <p class="text-slate-400 font-semibold">Không có phòng ban nào.</p>
              </div>
            }
          </div>
        }

        <!-- Employees Table -->
        @if (!loading() && !loadError() && activeTab() === 'empl') {
          <div data-tutorial="org-emp-list" class="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden animate-in slide-in-from-right-4 duration-300">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50/50">
                    <th class="px-8 py-5 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Nhân viên</th>
                    <th class="px-8 py-5 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Liên hệ</th>
                    <th class="px-8 py-5 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Ngày sinh</th>
                    <th class="px-8 py-5 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Ngày vào làm</th>
                    <th class="px-8 py-5 text-[13px] font-bold text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                  @for (emp of employees(); track emp.id) {
                    <tr (click)="openEmployeeModal(emp)" class="hover:bg-slate-50/30 transition-all group cursor-pointer">
                      <td class="px-8 py-5">
                        <div class="flex items-center gap-4">
                          <div class="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-slate-100 group-hover:ring-emerald-100 transition-all">
                            <img [src]="'https://ui-avatars.com/api/?name=' + emp.fullName + '&background=f1f5f9&color=64748b'" alt="Avatar">
                          </div>
                          <div>
                            <p class="font-bold text-slate-900">{{ emp.fullName }}</p>
                            <p class="text-xs font-semibold text-slate-400 mt-0.5">Mã: NV-{{ emp.id }}</p>
                          </div>
                        </div>
                      </td>
                      <td class="px-8 py-5">
                        <div class="space-y-1.5">
                          <div class="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-60"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            {{ emp.email }}
                          </div>
                          <div class="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="opacity-60"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            {{ emp.phone }}
                          </div>
                        </div>
                      </td>
                      <td class="px-8 py-5">
                        <span class="text-sm font-semibold text-slate-600">{{ emp.dateOfBirth | date:'dd/MM/yyyy' }}</span>
                      </td>
                      <td class="px-8 py-5">
                        <span class="text-sm font-semibold text-slate-600">{{ emp.hireDate | date:'dd/MM/yyyy' }}</span>
                      </td>
                      <td class="px-8 py-5 text-right">
                        <button (click)="$event.stopPropagation(); openEmployeeModal(emp)" class="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-all" title="Xem chi tiết">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                        </button>
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="5" class="px-8 py-24 text-center">
                        <div class="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <p class="text-slate-400 font-semibold">{{ selectedDepartment() ? 'Phòng ban này chưa có nhân viên.' : 'Không có nhân viên nào.' }}</p>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Pagination -->
        @if (!loading() && !loadError() && totalPages() > 1) {
          <div class="flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-soft border border-slate-100 mt-6">
            <div class="text-sm text-slate-500 font-medium">
              Trang {{ currentPage() }} / {{ totalPages() }} ({{ totalItems() }} {{ activeTab() === 'dept' ? 'phòng ban' : 'nhân viên' }})
            </div>
            <div class="flex items-center gap-2">
              <button
                (click)="goToPage(currentPage() - 1)"
                [disabled]="currentPage() <= 1"
                class="p-2 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              @for (p of pageNumbers(); track p) {
                <button
                  (click)="goToPage(p)"
                  [class.bg-emerald-700]="p === currentPage()"
                  [class.text-white]="p === currentPage()"
                  [class.bg-slate-50]="p !== currentPage()"
                  [class.text-slate-600]="p !== currentPage()"
                  class="w-10 h-10 rounded-xl text-sm font-bold transition-all hover:bg-emerald-50"
                >{{ p }}</button>
              }
              <button
                (click)="goToPage(currentPage() + 1)"
                [disabled]="currentPage() >= totalPages()"
                class="p-2 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Employee Quick View Modal -->
    @if (showEmployeeModal() && selectedEmployee()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" (click)="closeEmployeeModal()">
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" (click)="$event.stopPropagation()">
          <!-- Close button -->
          <button (click)="closeEmployeeModal()" class="absolute top-4 right-4 z-10 w-8 h-8 rounded-xl bg-white/80 backdrop-blur text-slate-400 hover:text-slate-600 hover:bg-slate-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>

          <!-- Header -->
          <div class="bg-gradient-to-r from-emerald-800 to-slate-900 p-8 text-center">
            <div class="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white/30 mx-auto shadow-xl">
              <img [src]="'https://ui-avatars.com/api/?name=' + selectedEmployee()!.fullName + '&background=0f766e&color=fff&size=128'" alt="Avatar" class="w-full h-full object-cover">
            </div>
            <h2 class="text-xl font-bold text-white mt-4">{{ selectedEmployee()!.fullName }}</h2>
            <p class="text-emerald-200 text-sm font-medium">Mã nhân viên: NV-{{ selectedEmployee()!.id }}</p>
          </div>

          <!-- Info -->
          <div class="p-6 space-y-5">
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                <p class="text-sm font-bold text-slate-900">{{ selectedEmployee()!.email }}</p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </div>
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số điện thoại</p>
                <p class="text-sm font-bold text-slate-900">{{ selectedEmployee()!.phone }}</p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày sinh</p>
                <p class="text-sm font-bold text-slate-900">{{ selectedEmployee()!.dateOfBirth | date:'dd/MM/yyyy' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phòng ban</p>
                <p class="text-sm font-bold text-slate-900">{{ employeeDepartmentName() || 'Chưa xác định' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ngày vào làm</p>
                <p class="text-sm font-bold text-slate-900">{{ selectedEmployee()!.dateOfBirth | date:'dd/MM/yyyy' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class OrganizationComponent implements OnInit {
  api = inject(Api);

  activeTab = signal<'dept' | 'empl'>('dept');

  departments = signal<any[]>([]);
  employees = signal<any[]>([]);

  loading = signal(false);
  loadError = signal('');

  currentPage = signal(1);
  pageSize = 10;
  totalItems = signal(0);
  totalPages = signal(0);

  searchQuery = signal('');
  searchTimeout: any = null;

  selectedDepartment = signal<DepartmentDto | null>(null);

  selectedEmployee = signal<EmployeeDto | null>(null);
  showEmployeeModal = signal(false);
  employeeDepartmentName = signal('');

  ngOnInit() {
    this.loadPage(1);
  }

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    let start = Math.max(1, current - 2);
    let end = Math.min(total, start + 4);
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  switchTab(tab: 'dept' | 'empl') {
    this.activeTab.set(tab);
    this.selectedDepartment.set(null);
    this.searchQuery.set('');
    this.loadPage(1);
  }

  onSearch() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadPage(1), 300);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.loadPage(1);
  }

  async viewDepartment(dept: DepartmentDto) {
    this.selectedDepartment.set(dept);
    this.activeTab.set('empl');
    this.searchQuery.set('');
    await this.loadPage(1);
  }

  clearDepartmentFilter() {
    this.selectedDepartment.set(null);
    this.loadPage(1);
  }

  async openEmployeeModal(emp: EmployeeDto) {
    this.selectedEmployee.set(emp);
    this.showEmployeeModal.set(true);
    this.employeeDepartmentName.set(emp.departmentName || 'Chưa xác định');
  }

  closeEmployeeModal() {
    this.showEmployeeModal.set(false);
    this.selectedEmployee.set(null);
    this.employeeDepartmentName.set('');
  }

  async loadPage(page: number) {
    this.loading.set(true);
    this.loadError.set('');

    try {
      const params: any = { PageNumber: page, PageSize: this.pageSize };

      if (this.activeTab() === 'dept') {
        const resp = await this.api.invoke$Response(apiDepartmentsGet$Json, params);
        this.handlePaginationHeader(resp.headers);
        if (resp.body.isSuccess) {
          this.departments.set(resp.body.result || []);
        } else {
          this.loadError.set(resp.body.message || 'Không thể tải dữ liệu');
        }
      } else {
        if (this.searchQuery()) {
          params.FullNameAndEmail = this.searchQuery();
        }
        if (this.selectedDepartment()) {
          params.DepartmentId = this.selectedDepartment()!.id;
        }
        const resp = await this.api.invoke$Response(apiEmployeesGet$Json, params);
        this.handlePaginationHeader(resp.headers);
        if (resp.body.isSuccess) {
          this.employees.set(resp.body.result || []);
        } else {
          this.loadError.set(resp.body.message || 'Không thể tải dữ liệu');
        }
      }
    } catch (err: any) {
      this.loadError.set(err?.message || err?.error?.message || 'Lỗi kết nối đến máy chủ');
    } finally {
      this.loading.set(false);
    }
  }

  private handlePaginationHeader(headers: any) {
    const paginationHeader = headers.get('Pagination');
    if (paginationHeader) {
      try {
        const pagination = JSON.parse(paginationHeader);
        this.totalItems.set(pagination.totalItems || 0);
        this.totalPages.set(pagination.totalPages || 0);
        this.currentPage.set(pagination.currentPage || this.currentPage());
      } catch {
        this.totalItems.set(0);
        this.totalPages.set(0);
      }
    }
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.loadPage(page);
  }
}
