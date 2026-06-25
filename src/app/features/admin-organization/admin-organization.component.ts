import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Plus, Edit2, Trash2, Users, Search, MoreHorizontal, Mail, Phone, X, ShieldCheck, Building, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-angular';
import { MockDataService } from '../../core/services/mock-data.service';
import { Api } from '../../services/api-services/api';
import { apiDepartmentsPost$Json } from '../../services/api-services/fn/departments/api-departments-post-json';
import { apiDepartmentsPut$Json } from '../../services/api-services/fn/departments/api-departments-put-json';
import { apiDepartmentsGet$Json } from '../../services/api-services/fn/departments/api-departments-get-json';
import { DepartmentDto } from '../../services/api-services/models/department-dto';
import { apiEmployeesGet$Json } from '../../services/api-services/fn/employees/api-employees-get-json';

@Component({
  selector: 'app-admin-organization',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-8 animate-in slide-in-from-right-4 duration-700">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Cơ cấu tổ chức</h1>
           <p class="text-slate-500 mt-2">Quản lý phòng ban, nhóm và hệ thống phân cấp.</p>
        </div>
        <button 
          (click)="openAddModal()"
          class="flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-2xl font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20"
        >
          <lucide-icon name="plus" class="w-5 h-5"></lucide-icon>
           Thêm phòng ban
        </button>
      </div>

      <!-- Stats Bar -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (stat of stats(); track stat.label) {
          <div class="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 flex items-center gap-5">
             <div [class]="'w-12 h-12 rounded-xl flex items-center justify-center ' + stat.bg">
                <lucide-icon [name]="stat.icon" [class]="'w-6 h-6 ' + stat.color"></lucide-icon>
             </div>
             <div>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">{{ stat.label }}</p>
                <p class="text-2xl font-black text-slate-900 mt-0.5">{{ stat.value }}</p>
             </div>
          </div>
        }
      </div>

      <!-- Loading -->
      @if (deptLoading()) {
        <div class="flex items-center justify-center py-24">
          <lucide-icon name="loader2" class="w-8 h-8 text-emerald-700 animate-spin"></lucide-icon>
          <span class="ml-3 text-slate-500 font-semibold">Đang tải dữ liệu...</span>
        </div>
      }

      <!-- Error -->
      @if (deptError()) {
        <div class="flex items-start gap-3 p-5 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm">
          <lucide-icon name="alert-circle" class="w-5 h-5 flex-shrink-0 mt-0.5"></lucide-icon>
          <div>
            <p class="font-bold">Không thể tải danh sách phòng ban</p>
            <p class="mt-1">{{ deptError() }}</p>
          </div>
        </div>
      }

      <!-- Departments List -->
      @if (!deptLoading() && !deptError()) {
      <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
        @for (dept of departments(); track dept.id) {
          <div class="group bg-white rounded-[24px] p-6 shadow-soft border border-slate-100 hover:border-emerald-100 transition-all duration-300 relative overflow-hidden h-[340px] flex flex-col">
            <div class="flex justify-between items-start flex-shrink-0">
              <div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-all flex-shrink-0">
                <lucide-icon name="building" class="w-7 h-7"></lucide-icon>
              </div>
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                <button (click)="openEditModal(dept)" class="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all">
                  <lucide-icon name="edit2" class="w-4 h-4"></lucide-icon>
                </button>
                <button class="p-2 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all">
                  <lucide-icon name="trash2" class="w-4 h-4"></lucide-icon>
                </button>
              </div>
            </div>

            <h3 class="text-xl font-black text-slate-900 mt-5 flex-shrink-0">{{ dept.name }}</h3>
            <div class="flex-1 min-h-0 overflow-hidden">
              <p class="text-slate-500 text-sm mt-2 line-clamp-2 leading-relaxed">
                {{ dept.description }}
              </p>
            </div>

            <!-- Department Head Badge -->
            <div class="flex-shrink-0 relative z-10 mt-auto mb-2">
              <div class="inline-flex items-center gap-2 bg-emerald-50 rounded-xl py-1.5 px-3 border border-emerald-100 shadow-sm">
                <div class="w-6 h-6 rounded-lg overflow-hidden ring-2 ring-white flex-shrink-0">
                  <img [src]="'https://ui-avatars.com/api/?name=' + getDeptHeadName(dept.managerId) + '&background=0f766e&color=fff'" alt="Avatar">
                </div>
                <div class="text-[10px] leading-tight">
                  <p class="font-bold text-emerald-700">Trưởng phòng</p>
                  <p class="font-semibold text-slate-900 truncate max-w-[100px]">{{ getDeptHeadName(dept.managerId) }}</p>
                </div>
                <lucide-icon name="shield-check" class="w-3.5 h-3.5 text-emerald-600 flex-shrink-0"></lucide-icon>
              </div>
            </div>

            <div class="pt-5 border-t border-slate-50 flex items-center justify-between flex-shrink-0">
               <div class="flex items-center gap-2">
                  <div class="flex -space-x-2">
                    @for (emp of getDeptEmployees(dept.id).slice(0, 3); track emp.id) {
                      <div class="w-7 h-7 rounded-full border-2 border-white overflow-hidden bg-slate-200">
                        <img [src]="'https://ui-avatars.com/api/?name=' + emp.fullName + '&background=f1f5f9&color=64748b'" alt="Avatar">
                      </div>
                    }
                  </div>
                  <span class="text-xs font-bold text-slate-400">{{ deptEmployeeCount(dept.id) }} thành viên</span>
               </div>
                <button (click)="openTeamModal(dept)" class="text-xs font-bold text-emerald-700 hover:underline">Xem nhóm</button>
             </div>
           </div>
         }
       </div>

        <!-- Pagination -->
        @if (deptTotalPages() > 1) {
          <div class="flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-soft border border-slate-100 mt-6">
            <div class="text-sm text-slate-500 font-medium">
              Trang {{ deptCurrentPage() }} / {{ deptTotalPages() }} ({{ deptTotalItems() }} phòng ban)
            </div>
            <div class="flex items-center gap-2">
              <button
                (click)="goToDeptPage(deptCurrentPage() - 1)"
                [disabled]="deptCurrentPage() <= 1"
                class="p-2 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <lucide-icon name="chevron-left" class="w-5 h-5"></lucide-icon>
              </button>
              @for (p of deptPageNumbers(); track p) {
                <button
                  (click)="goToDeptPage(p)"
                  [class.bg-emerald-700]="p === deptCurrentPage()"
                  [class.text-white]="p === deptCurrentPage()"
                  [class.bg-slate-50]="p !== deptCurrentPage()"
                  [class.text-slate-600]="p !== deptCurrentPage()"
                  class="w-10 h-10 rounded-xl text-sm font-bold transition-all hover:bg-emerald-50"
                >{{ p }}</button>
              }
              <button
                (click)="goToDeptPage(deptCurrentPage() + 1)"
                [disabled]="deptCurrentPage() >= deptTotalPages()"
                class="p-2 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <lucide-icon name="chevron-right" class="w-5 h-5"></lucide-icon>
              </button>
            </div>
          </div>
        }
      }

     </div>

     <!-- Team Members Modal -->
     @if (showTeamModal()) {
       <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
         <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
           <div class="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
             <div>
               <h2 class="text-xl font-black text-slate-900">{{ selectedDept()?.name }}</h2>
               <p class="text-slate-400 text-sm font-medium mt-0.5">{{ teamMembersList().length }} thành viên</p>
             </div>
             <button (click)="showTeamModal.set(false)" class="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
               <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
             </button>
           </div>
           @if (teamSaving()) {
             <div class="flex items-center justify-center py-12">
               <lucide-icon name="loader2" class="w-6 h-6 text-emerald-700 animate-spin"></lucide-icon>
               <span class="ml-2 text-slate-500 font-semibold">Đang lưu...</span>
             </div>
           }
           @if (teamError()) {
             <div class="mx-6 mb-2 flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm">
               <lucide-icon name="alert-circle" class="w-5 h-5 flex-shrink-0 mt-0.5"></lucide-icon>
               <span class="font-semibold">{{ teamError() }}</span>
             </div>
           }
            <div class="p-6 max-h-[480px] overflow-y-auto space-y-3">
              @for (member of teamMembersList(); track member.id) {
                <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all">
                  <div class="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white shadow-sm flex-shrink-0">
                    <img [src]="'https://ui-avatars.com/api/?name=' + member.fullName + '&background=0f766e&color=fff'" alt="Avatar">
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="font-bold text-slate-900 text-sm truncate">{{ member.fullName }}</p>
                      @if (selectedDept()?.managerId == member.id) {
                        <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 flex-shrink-0">Trưởng phòng</span>
                      } @else {
                        <span class="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg flex-shrink-0">Thành viên</span>
                      }
                    </div>
                    <p class="text-xs font-medium text-emerald-700 truncate">{{ member.position }}</p>
                    <div class="flex items-center gap-3 text-slate-400 text-xs mt-1">
                      <div class="flex items-center gap-1">
                        <lucide-icon name="mail" class="w-3 h-3"></lucide-icon>
                        <span class="text-slate-500 truncate max-w-[140px]">{{ member.email }}</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <lucide-icon name="phone" class="w-3 h-3"></lucide-icon>
                        <span class="text-slate-500 truncate max-w-[100px]">{{ member.phone }}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    (click)="setDepartmentHead(member)"
                    [disabled]="teamSaving()"
                    [class.bg-emerald-100]="selectedDept()?.managerId == member.id"
                    [class.text-emerald-700]="selectedDept()?.managerId == member.id"
                    class="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100 transition-all flex-shrink-0 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    @if (selectedDept()?.managerId == member.id) {
                      Đang là TP
                    } @else {
                      Đặt TP
                    }
                  </button>
                </div>
              } @empty {
                <div class="text-center py-16">
                  <div class="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <lucide-icon name="users" class="w-8 h-8 text-slate-200"></lucide-icon>
                  </div>
                  <p class="text-slate-400 font-medium">Chưa có thành viên trong phòng ban này.</p>
                </div>
              }
            </div>
         </div>
       </div>
     }

     <!-- Add Department Modal -->
    @if (showModal()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div class="bg-white w-full max-w-lg rounded-3xl p-10 shadow-2xl animate-in zoom-in-95 duration-200">
           <h2 class="text-2xl font-black text-slate-900 mb-6">Phòng ban mới</h2>
           @if (modalError()) {
             <div class="mb-4 flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm">
               <lucide-icon name="alert-circle" class="w-5 h-5 flex-shrink-0 mt-0.5"></lucide-icon>
               <span class="font-semibold">{{ modalError() }}</span>
             </div>
           }
           <div class="space-y-5 text-sm">
              <div class="space-y-2">
                  <label class="font-bold text-slate-700 ml-1">Tên phòng ban</label>
                  <input type="text" [(ngModel)]="newDept.name" placeholder="VD: Phát triển sản phẩm" class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-700/20">
              </div>
              <div class="space-y-2">
                  <label class="font-bold text-slate-700 ml-1">Mô tả</label>
                  <textarea rows="4" [(ngModel)]="newDept.description" placeholder="Sứ mệnh ngắn gọn của nhóm..." class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-700/20 resize-none"></textarea>
              </div>
              <div class="flex gap-4 pt-4">
                <button (click)="showModal.set(false); modalError.set('')" class="flex-1 py-4 font-bold text-slate-400 hover:text-slate-900">Hủy</button>
                <button (click)="createDepartment()" [disabled]="saving()"
                  class="flex-1 py-4 flex items-center justify-center gap-2 bg-emerald-700 text-white rounded-2xl font-bold hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  @if (saving()) {
                    <lucide-icon name="loader2" class="w-4 h-4 animate-spin"></lucide-icon>
                    Đang lưu...
                  } @else {
                    Tạo nhóm
                  }
                </button>
              </div>
           </div>
        </div>
      </div>
    }

    <!-- Edit Department Modal -->
    @if (showEditModal()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
        <div class="bg-white w-full max-w-lg rounded-3xl p-10 shadow-2xl animate-in zoom-in-95 duration-200">
           <h2 class="text-2xl font-black text-slate-900 mb-6">Chỉnh sửa phòng ban</h2>
           @if (modalError()) {
             <div class="mb-4 flex items-start gap-3 p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm">
               <lucide-icon name="alert-circle" class="w-5 h-5 flex-shrink-0 mt-0.5"></lucide-icon>
               <span class="font-semibold">{{ modalError() }}</span>
             </div>
           }
           <div class="space-y-5 text-sm">
              <div class="space-y-2">
                  <label class="font-bold text-slate-700 ml-1">Tên phòng ban</label>
                  <input type="text" [(ngModel)]="editDeptData.name" placeholder="VD: Phát triển sản phẩm" class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-700/20">
              </div>
              <div class="space-y-2">
                  <label class="font-bold text-slate-700 ml-1">Mô tả</label>
                  <textarea rows="4" [(ngModel)]="editDeptData.description" placeholder="Sứ mệnh ngắn gọn của nhóm..." class="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-700/20 resize-none"></textarea>
              </div>
              <div class="flex gap-4 pt-4">
                <button (click)="showEditModal.set(false); modalError.set('')" class="flex-1 py-4 font-bold text-slate-400 hover:text-slate-900">Hủy</button>
                <button (click)="updateDepartment()" [disabled]="saving()"
                  class="flex-1 py-4 flex items-center justify-center gap-2 bg-emerald-700 text-white rounded-2xl font-bold hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  @if (saving()) {
                    <lucide-icon name="loader2" class="w-4 h-4 animate-spin"></lucide-icon>
                    Đang lưu...
                  } @else {
                    Lưu thay đổi
                  }
                </button>
              </div>
           </div>
        </div>
      </div>
    }
  `
})
export class AdminOrganizationComponent implements OnInit {
  mockService = inject(MockDataService);
  api = inject(Api);
  showModal = signal(false);
  showEditModal = signal(false);
  showTeamModal = signal(false);
  saving = signal(false);
  teamSaving = signal(false);
  modalError = signal('');
  teamError = signal('');

  selectedDept = signal<any>(null);

  // Pre-fetched caches
  employeesCache = signal<any[]>([]);
  deptMemberIds = signal<Record<string, (number | string)[]>>({});
  employeeCacheLoading = signal(false);
  memberIdLoading = signal(false);

  // Team modal
  teamMembersList = signal<any[]>([]);
  teamModalOpen = signal(false);

  newDept = { name: '', description: '' };
  editDeptData: any = { id: 0, name: '', description: '', managerId: null };

  // API pagination
  departments = signal<any[]>([]);
  deptLoading = signal(false);
  deptError = signal('');
  deptCurrentPage = signal(1);
  deptPageSize = 6;
  deptTotalItems = signal(0);
  deptTotalPages = signal(0);

  deptPageNumbers = computed(() => {
    const total = this.deptTotalPages();
    const current = this.deptCurrentPage();
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

  ngOnInit() {
    this.loadDepartments(1).then(() => {
      this.loadAllEmployees().then(() => {
        this.loadAllDeptMemberIds();
      });
    });
  }

  async loadDepartments(page: number) {
    this.deptLoading.set(true);
    this.deptError.set('');

    try {
      const resp = await this.api.invoke$Response(apiDepartmentsGet$Json, {
        PageNumber: page,
        PageSize: this.deptPageSize
      });

      const paginationHeader = resp.headers.get('Pagination');
      if (paginationHeader) {
        try {
          const pagination = JSON.parse(paginationHeader);
          this.deptTotalItems.set(pagination.totalItems || 0);
          this.deptTotalPages.set(pagination.totalPages || 0);
          this.deptCurrentPage.set(pagination.currentPage || page);
        } catch {
          this.deptTotalItems.set(0);
          this.deptTotalPages.set(0);
        }
      }

      const body = resp.body;
      if (body.isSuccess) {
        const list = Array.isArray(body.result) ? body.result : [];
        this.departments.set(list);
        this.mockService.departments.set(list);
      } else {
        this.deptError.set(body.message || 'Không thể tải danh sách phòng ban');
        this.departments.set([]);
      }
    } catch (err: any) {
      this.deptError.set(err?.message || err?.error?.message || 'Lỗi kết nối đến máy chủ');
      this.departments.set([]);
    } finally {
      this.deptLoading.set(false);
    }
  }

  goToDeptPage(page: number) {
    if (page < 1 || page > this.deptTotalPages()) return;
    this.loadDepartments(page);
  }

  async loadAllEmployees() {
    this.employeeCacheLoading.set(true);
    const all: any[] = [];
    try {
      let page = 1;
      let totalPages = 1;
      while (page <= totalPages) {
        const resp = await this.api.invoke$Response(apiEmployeesGet$Json, {
          PageNumber: page,
          PageSize: 50
        });
        const paginationHeader = resp.headers.get('Pagination');
        if (paginationHeader) {
          try {
            const pagination = JSON.parse(paginationHeader);
            totalPages = pagination.totalPages || 1;
          } catch {}
        }
        const body = resp.body;
        if (body.isSuccess) {
          const items: any[] = Array.isArray(body.result) ? body.result : [];
          all.push(...items);
        }
        page++;
      }
      this.employeesCache.set(all);
    } catch {
      this.employeesCache.set(this.mockService.employees());
    } finally {
      this.employeeCacheLoading.set(false);
    }
  }

  async loadAllDeptMemberIds() {
    this.memberIdLoading.set(true);
    const depts = this.departments();
    const employees = this.employeesCache();
    const map: Record<string, (number | string)[]> = {};
    for (const dept of depts) {
      map[dept.id] = employees.filter(e => e.departmentId == dept.id).map(e => e.id);
    }
    this.deptMemberIds.set(map);
    this.memberIdLoading.set(false);
  }

  getDeptEmployees(deptId: any): any[] {
    const ids = this.deptMemberIds()[deptId] || [];
    return this.employeesCache().filter(e => ids.includes(e.id));
  }

  stats = computed(() => [
    { label: 'Tổng phòng ban', value: String(this.departments().length), icon: 'grid', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Tổng nhân sự', value: String(this.employeesCache().length), icon: 'users', color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Đang hoạt động', value: String(this.employeesCache().filter(e => e.status === 'Active').length), icon: 'users', color: 'text-purple-700', bg: 'bg-purple-50' },
  ]);

  openAddModal() {
    this.newDept = { name: '', description: '' };
    this.modalError.set('');
    this.showModal.set(true);
  }

  openEditModal(dept: any) {
    this.editDeptData = { ...dept };
    this.modalError.set('');
    this.showEditModal.set(true);
  }

  async openTeamModal(dept: any) {
    this.selectedDept.set(dept);
    this.teamError.set('');
    this.teamSaving.set(true);
    this.showTeamModal.set(true);
    try {
      const resp = await this.api.invoke$Response(apiEmployeesGet$Json, {
        DepartmentId: dept.id,
        PageNumber: 1,
        PageSize: 100
      });
      const body = resp.body;
      if (body.isSuccess) {
        this.teamMembersList.set(Array.isArray(body.result) ? body.result : []);
      } else {
        this.teamMembersList.set([]);
      }
    } catch {
      this.teamMembersList.set([]);
    } finally {
      this.teamSaving.set(false);
    }
  }

  async createDepartment() {
    if (!this.newDept.name.trim()) {
      this.modalError.set('Vui lòng nhập tên phòng ban');
      return;
    }
    this.saving.set(true);
    this.modalError.set('');

    try {
      const body: DepartmentDto = {
        name: this.newDept.name,
        description: this.newDept.description || undefined,
        managerId: undefined,
        id: 0
      };
      const res = await this.api.invoke(apiDepartmentsPost$Json, { body });

      if (res.isSuccess) {
        const newDept = { ...body, id: res.result?.id || Date.now() };
        this.mockService.departments.update(list => [...list, newDept]);
        this.showModal.set(false);
      } else {
        this.modalError.set(res.message || 'Không thể tạo phòng ban');
      }
    } catch (err: any) {
      this.modalError.set(err?.message || err?.error?.message || 'Lỗi kết nối đến máy chủ');
    } finally {
      this.saving.set(false);
    }
  }

  async updateDepartment() {
    if (!this.editDeptData.name.trim()) {
      this.modalError.set('Vui lòng nhập tên phòng ban');
      return;
    }
    this.saving.set(true);
    this.modalError.set('');

    try {
      const body: DepartmentDto = {
        id: this.editDeptData.id,
        name: this.editDeptData.name,
        description: this.editDeptData.description || undefined,
        managerId: this.editDeptData.managerId || undefined
      };
      const res = await this.api.invoke(apiDepartmentsPut$Json, { body });

      if (res.isSuccess) {
        this.mockService.departments.update(list =>
          list.map(d => d.id === body.id ? { ...d, ...body } : d)
        );
        this.showEditModal.set(false);
      } else {
        this.modalError.set(res.message || 'Không thể cập nhật phòng ban');
      }
    } catch (err: any) {
      this.modalError.set(err?.message || err?.error?.message || 'Lỗi kết nối đến máy chủ');
    } finally {
      this.saving.set(false);
    }
  }

  deptEmployeeCount(deptId: any) {
    const ids = this.deptMemberIds()[deptId] || [];
    return ids.length;
  }

  getDeptHeadName(managerId: any) {
    const emp = this.employeesCache().find(e => e.id == managerId);
    return emp ? emp.fullName : 'Chưa có';
  }

  async setDepartmentHead(emp: any) {
    const dept = this.selectedDept();
    if (!dept) return;
    this.teamSaving.set(true);
    this.teamError.set('');

    try {
      const body: DepartmentDto = {
        id: dept.id,
        name: dept.name,
        description: dept.description || undefined,
        managerId: emp.id
      };
      const res = await this.api.invoke(apiDepartmentsPut$Json, { body });

      if (res.isSuccess) {
        this.mockService.departments.update(list =>
          list.map(d => d.id === dept.id ? { ...d, managerId: emp.id } : d)
        );
        this.selectedDept.set({ ...dept, managerId: emp.id });
        this.mockService.employees.update(list =>
          list.map(e => e.id === emp.id ? { ...e, position: 'Trưởng phòng ' + dept.name } : e)
        );
      } else {
        this.teamError.set(res.message || 'Không thể cập nhật trưởng phòng');
      }
    } catch (err: any) {
      this.teamError.set(err?.message || err?.error?.message || 'Lỗi kết nối đến máy chủ');
    } finally {
      this.teamSaving.set(false);
    }
  }
}
