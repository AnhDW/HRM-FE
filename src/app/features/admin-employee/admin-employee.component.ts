import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { LucideAngularModule, Search, Filter, MoreVertical, Eye, UserPlus, Mail, Phone, X, User, Briefcase, Calendar, Building, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-angular';
import { MockDataService } from '../../core/services/mock-data.service';
import { Api } from '../../services/api-services/api';
import { TutorialButtonComponent } from '../../shared/tutorial/tutorial-button.component';
import { apiEmployeesPost$Json } from '../../services/api-services/fn/employees/api-employees-post-json';
import { apiEmployeesGet$Json } from '../../services/api-services/fn/employees/api-employees-get-json';


@Component({
  selector: 'app-admin-employee',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule, TutorialButtonComponent],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Danh sách nhân viên</h1>
           <p class="text-slate-500 mt-2">Quản lý nhân sự, vị trí và lịch sử công tác.</p>
        </div>
        <div class="flex items-center gap-3">
          <app-tutorial-button tutorialId="admin-employees"></app-tutorial-button>
          <button (click)="showAddPopup.set(true)" data-tutorial="employee-add" class="flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-2xl font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20">
            <lucide-icon name="user-plus" class="w-5 h-5"></lucide-icon>
            Thêm nhân viên
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div data-tutorial="employee-filter" class="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-4 flex-1">
            <div class="relative flex-1 min-w-[200px]">
            <lucide-icon name="search" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
            <input 
              type="text" 
              (input)="onSearchInput($any($event.target).value)"
              [value]="searchQuery()"
              placeholder="Tìm kiếm theo tên, email hoặc chức vụ..." 
              class="w-full pl-14 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none"
            >
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-2">PB:</span>
            <select 
              (change)="onDeptChange($any($event.target).value)"
              [value]="selectedDept()"
              class="px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium text-slate-600 focus:ring-2 focus:ring-emerald-700/20 outline-none cursor-pointer"
            >
              <option value="">Tất cả phòng ban</option>
              @for (dept of mockService.departments(); track dept.id) {
                <option [value]="dept.id">{{ dept.name }}</option>
              }
            </select>
          </div>
        </div>
        <div class="text-sm font-semibold text-slate-400">
            {{ totalItems() }} nhân viên
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex items-center justify-center py-24">
          <lucide-icon name="loader2" class="w-8 h-8 text-emerald-700 animate-spin"></lucide-icon>
          <span class="ml-3 text-slate-500 font-semibold">Đang tải dữ liệu...</span>
        </div>
      }

      <!-- Error -->
      @if (loadError()) {
        <div class="flex items-start gap-3 p-5 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm">
          <lucide-icon name="alert-circle" class="w-5 h-5 flex-shrink-0 mt-0.5"></lucide-icon>
          <div>
            <p class="font-bold">Không thể tải danh sách nhân viên</p>
            <p class="mt-1">{{ loadError() }}</p>
          </div>
        </div>
      }

      <!-- Employee List -->
      @if (!loading() && !loadError()) {
        <div data-tutorial="employee-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (emp of employees(); track emp.id) {
            <div class="group bg-white rounded-[24px] p-6 shadow-soft border border-slate-100 hover:border-emerald-100 transition-all duration-300 relative">
              <div class="flex justify-between items-start mb-5">
                <div class="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm transition-transform group-hover:scale-105">
                  <img [src]="'https://ui-avatars.com/api/?name=' + emp.fullName + '&background=0f766e&color=fff'" alt="Avatar">
                </div>
                <div class="flex gap-2">
                    <span [class]="(emp.status ?? 'Active') === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'" 
                      class="px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider">
                      {{ (emp.status ?? 'Active') === 'Active' ? 'Đang làm' : 'Đã nghỉ' }}
                    </span>
                </div>
              </div>

              <div class="space-y-1">
                <h3 class="text-xl font-bold text-slate-900">{{ emp.fullName }}</h3>
                <p class="text-sm font-medium text-emerald-700">{{ emp.position }}</p>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">{{ getDeptName(emp.departmentId) }}</p>
              </div>

              <div class="mt-8 space-y-3">
                <div class="flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors cursor-default text-sm">
                  <lucide-icon name="mail" class="w-4 h-4 opacity-60"></lucide-icon>
                  {{ emp.email }}
                </div>
                <div class="flex items-center gap-3 text-slate-500 hover:text-slate-900 transition-colors cursor-default text-sm">
                  <lucide-icon name="phone" class="w-4 h-4 opacity-60"></lucide-icon>
                  {{ emp.phone }}
                </div>
              </div>

              <div class="mt-8 pt-6 border-t border-slate-50 flex gap-3">
                  <a 
                    [routerLink]="[emp.id]"
                    data-tutorial="employee-view-profile"
                    class="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold hover:bg-slate-900 hover:text-white transition-all text-sm"
                  >
                   <lucide-icon name="eye" class="w-4 h-4"></lucide-icon>
                      Xem hồ sơ
                 </a>
                 <button class="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 transition-all">
                   <lucide-icon name="more-vertical" class="w-5 h-5"></lucide-icon>
                 </button>
              </div>
            </div>
          } @empty {
            <div class="col-span-full text-center py-24">
              <div class="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <lucide-icon name="users" class="w-8 h-8 text-slate-200"></lucide-icon>
              </div>
              <p class="text-slate-400 font-semibold">Không tìm thấy nhân viên nào.</p>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-soft border border-slate-100 mt-6">
            <div class="text-sm text-slate-500 font-medium">
              Trang {{ currentPage() }} / {{ totalPages() }} ({{ totalItems() }} nhân viên)
            </div>
            <div class="flex items-center gap-2">
              <button
                (click)="goToPage(currentPage() - 1)"
                [disabled]="currentPage() <= 1"
                class="p-2 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <lucide-icon name="chevron-left" class="w-5 h-5"></lucide-icon>
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
                <lucide-icon name="chevron-right" class="w-5 h-5"></lucide-icon>
              </button>
            </div>
          </div>
        }
      }
    </div>

    <!-- Add Employee Popup -->
    @if (showAddPopup()) {
      <div class="fixed inset-0 z-[100] flex items-start justify-center pt-[5vh] animate-in fade-in duration-200">
        <div (click)="showAddPopup.set(false)" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div class="relative bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 pb-4 border-b border-slate-50">
            <h2 class="text-xl font-bold text-slate-900 flex items-center gap-2">
              <lucide-icon name="user-plus" class="w-6 h-6 text-emerald-600"></lucide-icon>
              Thêm nhân viên mới
            </h2>
            <button (click)="showAddPopup.set(false)" class="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
              <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
            </button>
          </div>

          <!-- Form -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Personal Info -->
            <div>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Thông tin cá nhân</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">Họ và tên</label>
                  <div class="relative">
                    <lucide-icon name="user" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
                    <input type="text" [(ngModel)]="newEmployee.fullName" placeholder="Nguyễn Văn A" class="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">Email</label>
                  <div class="relative">
                    <lucide-icon name="mail" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
                    <input type="email" [(ngModel)]="newEmployee.email" placeholder="a.nguyen@company.com" class="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">Số điện thoại</label>
                  <div class="relative">
                    <lucide-icon name="phone" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
                    <input type="text" [(ngModel)]="newEmployee.phone" placeholder="090xxxxxxx" class="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">Ngày sinh</label>
                  <div class="relative">
                    <lucide-icon name="calendar" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
                    <input type="date" [(ngModel)]="newEmployee.dateOfBirth" class="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
                  </div>
                </div>
              </div>
            </div>

            <!-- Work Info -->
            <div>
              <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Thông tin công việc</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">Chức vụ</label>
                  <div class="relative">
                    <lucide-icon name="briefcase" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
                    <input type="text" [(ngModel)]="newEmployee.position" placeholder="Nhân viên" class="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">Phòng ban</label>
                  <div class="relative">
                    <lucide-icon name="building" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
                    <select [(ngModel)]="newEmployee.departmentId" class="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none appearance-none cursor-pointer">
                      <option value="">Chọn phòng ban</option>
                      @for (dept of mockService.departments(); track dept.id) {
                        <option [value]="dept.id">{{ dept.name }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1.5">Ngày vào làm</label>
                  <div class="relative">
                    <lucide-icon name="calendar" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
                    <input type="date" [(ngModel)]="newEmployee.hireDate" class="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Error -->
          @if (errorMsg()) {
            <div class="mx-6 mb-2 flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm">
              <lucide-icon name="alert-circle" class="w-5 h-5 flex-shrink-0 mt-0.5"></lucide-icon>
              <span class="font-semibold">{{ errorMsg() }}</span>
            </div>
          }

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-50">
            <button (click)="showAddPopup.set(false); resetForm()" class="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Hủy</button>
            <button (click)="addEmployee()" [disabled]="saving()"
              class="px-6 py-2.5 flex items-center gap-2 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              @if (saving()) {
                <lucide-icon name="loader2" class="w-4 h-4 animate-spin"></lucide-icon>
                Đang lưu...
              } @else {
                Tạo nhân viên
              }
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminEmployeeComponent implements OnInit {
  mockService = inject(MockDataService);
  api = inject(Api);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  searchQuery = signal('');
  selectedDept = signal('');
  private deptEmployeeIds = signal<(number | string)[]>([]);
  private searchTimeout: any;

  showAddPopup = signal(false);
  saving = signal(false);
  errorMsg = signal('');

  // API data
  employees = signal<any[]>([]);
  loading = signal(false);
  loadError = signal('');

  // Pagination
  currentPage = signal(1);
  pageSize = 12;
  totalItems = signal(0);
  totalPages = signal(0);

  newEmployee: any = {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    position: '',
    departmentId: '',
    hireDate: ''
  };

  ngOnInit() {
    this.mockService.loadAllDepartments();
    
    // Read page from query params
    const pageParam = this.route.snapshot.queryParamMap.get('page');
    const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
    this.loadPage(isNaN(initialPage) ? 1 : initialPage);
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

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.reloadPage1(), 300);
  }

  onDeptChange(deptId: string) {
    this.selectedDept.set(deptId);
    if (!deptId) {
      this.deptEmployeeIds.set([]);
      this.reloadPage1();
      return;
    }
    this.deptEmployeeIds.set(this.mockService.employees().filter(e => e.departmentId == deptId).map(e => e.id));
    this.reloadPage1();
  }

  private reloadPage1() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: 1 },
      queryParamsHandling: 'merge'
    });
    this.loadPage(1);
  }

  async loadPage(page: number) {
    this.loading.set(true);
    this.loadError.set('');

    try {
      const params: any = {
        PageNumber: page,
        PageSize: this.pageSize
      };

      const ids = this.deptEmployeeIds();
      if (ids.length > 0) {
        params.EmployeeIds = ids;
      }

      const q = this.searchQuery().trim();
      if (q) {
        params.FullNameAndEmail = q;
      }

      const resp = await this.api.invoke$Response(apiEmployeesGet$Json, params);

      const paginationHeader = resp.headers.get('Pagination');
      if (paginationHeader) {
        try {
          const pagination = JSON.parse(paginationHeader);
          this.totalItems.set(pagination.totalItems || 0);
          this.totalPages.set(pagination.totalPages || 0);
          this.currentPage.set(pagination.currentPage || page);
        } catch {
          this.totalItems.set(0);
          this.totalPages.set(0);
        }
      }

      const body = resp.body;
      if (body.isSuccess) {
        this.employees.set(body.result || []);
      } else {
        this.loadError.set(body.message || 'Không thể tải danh sách nhân viên');
        this.employees.set([]);
      }
    } catch (err: any) {
      this.loadError.set(err?.message || err?.error?.message || 'Lỗi kết nối đến máy chủ');
      this.employees.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    
    // Update URL with page parameter
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page },
      queryParamsHandling: 'merge'
    });
    
    this.loadPage(page);
  }

  resetForm() {
    this.newEmployee = {
      fullName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      position: '',
      departmentId: '',
      hireDate: ''
    };
    this.errorMsg.set('');
  }

  async addEmployee() {
    this.saving.set(true);
    this.errorMsg.set('');

    try {
      const body = {
        fullName: this.newEmployee.fullName,
        email: this.newEmployee.email,
        phone: this.newEmployee.phone,
        dateOfBirth: this.newEmployee.dateOfBirth,
        hireDate: this.newEmployee.hireDate,
        userId: null,
        id: 0
      };

      const res = await this.api.invoke(apiEmployeesPost$Json, { body });

      if (res.isSuccess) {
        const apiId = res.result?.id || Date.now();
        const hireDate = this.newEmployee.hireDate || new Date().toISOString().substring(0, 10);

        const emp = {
          id: apiId,
          userId: null,
          fullName: this.newEmployee.fullName,
          email: this.newEmployee.email,
          phone: this.newEmployee.phone,
          dateOfBirth: this.newEmployee.dateOfBirth,
          hireDate,
          position: this.newEmployee.position || 'Nhân viên',
          departmentId: this.newEmployee.departmentId,
          status: 'Active',
          transferHistory: []
        };

        this.mockService.employees.update(list => [...list, emp]);
        this.showAddPopup.set(false);
        this.resetForm();
        this.loadPage(this.currentPage());
      } else {
        this.errorMsg.set(res.message || 'Không thể tạo nhân viên');
      }
    } catch (err: any) {
      this.errorMsg.set(err?.message || err?.error?.message || 'Lỗi kết nối đến máy chủ');
    } finally {
      this.saving.set(false);
    }
  }

  getDeptName(id: any) {
    return this.mockService.departments().find(d => d.id == id)?.name || 'Không xác định';
  }
}
