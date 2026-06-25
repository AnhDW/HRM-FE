import { Component, inject, signal, input, output, OutputEmitterRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, ChevronDown, Loader2 } from 'lucide-angular';
import { Api } from '../../services/api-services/api';
import { apiEmployeesGet$Json } from '../../services/api-services/fn/employees/api-employees-get-json';
import { EmployeeDto } from '../../services/api-services/models/employee-dto';

@Component({
  selector: 'app-employee-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="relative">
      <button
        (click)="open()"
        class="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
      >
        <lucide-icon name="search" class="w-4 h-4 text-slate-400"></lucide-icon>
        @if (internalIds().length === 0) {
          <span>Toàn bộ</span>
        } @else {
          <span>{{ internalIds().length }} nhân viên</span>
        }
        <lucide-icon name="chevron-down" class="w-4 h-4 text-slate-400"></lucide-icon>
      </button>
      @if (internalIds().length > 0) {
        <div class="flex flex-wrap gap-1.5 mt-2">
          @for (id of internalIds(); track id) {
            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-semibold">
              {{ getEmployeeName(id) }}
              <button (click)="remove(id); $event.stopPropagation()" class="hover:text-emerald-900">&times;</button>
            </span>
          }
        </div>
      }
    </div>

    @if (showModal()) {
      <div class="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[70vh]">
          <div class="p-6 pb-0">
            <h2 class="text-xl font-black text-slate-900 mb-4">Chọn nhân viên</h2>
            <div class="relative">
              <lucide-icon name="search" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearch($event)"
                placeholder="Tìm kiếm..."
                class="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none"
              >
            </div>
          </div>
          <div
            class="p-6 overflow-y-auto flex-1 space-y-1"
            #scrollEl
            (scroll)="onScroll(scrollEl)"
          >
            @for (emp of employees(); track emp.id) {
              <label class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all">
                <input
                  type="checkbox"
                  [checked]="emp.id != null && internalIds().includes(emp.id)"
                  (change)="toggle(emp.id!)"
                  class="w-4 h-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-700/20"
                >
                <div class="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex-shrink-0">
                  <img [src]="'https://ui-avatars.com/api/?name=' + emp.fullName + '&background=f1f5f9&color=64748b'" alt="">
                </div>
                <span class="text-sm font-semibold text-slate-900">{{ emp.fullName }}</span>
              </label>
            }
            @if (loading()) {
              <div class="flex items-center justify-center py-4">
                <lucide-icon name="loader2" class="w-5 h-5 text-emerald-700 animate-spin"></lucide-icon>
              </div>
            }
            @if (!hasMore() && employees().length > 0) {
              <p class="text-center text-slate-400 text-xs py-3 font-medium">Đã hiển thị tất cả</p>
            }
            @if (!loading() && employees().length === 0) {
              <p class="text-center text-slate-400 py-10 text-sm">Không tìm thấy nhân viên.</p>
            }
          </div>
          <div class="p-6 pt-4 border-t border-slate-100 flex gap-3">
            <button
              (click)="clearAndClose()"
              class="flex-1 py-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl font-bold text-sm transition-all"
            >
              Bỏ chọn tất cả
            </button>
            <button
              (click)="confirm()"
              class="flex-1 py-3 bg-emerald-700 text-white rounded-2xl font-bold text-sm hover:bg-emerald-800 transition-all"
            >
              Xác nhận ({{ internalIds().length }})
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class EmployeePickerComponent {
  private api = inject(Api);

  selectedIds = input<(number | string)[]>([]);
  confirmed = output<(number | string)[]>();

  internalIds = signal<(number | string)[]>([]);
  showModal = signal(false);
  searchQuery = signal('');
  employees = signal<EmployeeDto[]>([]);
  page = signal(1);
  hasMore = signal(true);
  loading = signal(false);
  private searchTimer: any;

  open() {
    this.internalIds.set([...this.selectedIds()]);
    this.employees.set([]);
    this.page.set(1);
    this.hasMore.set(true);
    this.showModal.set(true);
    this.loadPage();
  }

  close() {
    this.showModal.set(false);
  }

  confirm() {
    this.showModal.set(false);
    this.confirmed.emit(this.internalIds());
  }

  clearAndClose() {
    this.internalIds.set([]);
    this.showModal.set(false);
    this.confirmed.emit([]);
  }

  onSearch(value: string) {
    this.searchQuery.set(value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.employees.set([]);
      this.page.set(1);
      this.hasMore.set(true);
      this.loadPage();
    }, 300);
  }

  onScroll(el: HTMLElement) {
    if (this.loading() || !this.hasMore()) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      this.page.update(p => p + 1);
      this.loadPage();
    }
  }

  toggle(id: number | string) {
    this.internalIds.update(ids =>
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
  }

  remove(id: number | string) {
    this.internalIds.update(ids => ids.filter(i => i !== id));
    this.confirmed.emit(this.internalIds());
  }

  getEmployeeName(id: number | string): string {
    const emp = this.employees().find(e => e.id == id);
    return emp?.fullName ?? String(id);
  }

  private async loadPage() {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      const params: any = { PageNumber: this.page(), PageSize: 20 };
      const q = this.searchQuery().trim();
      if (q) params.FullName = q;
      const resp = await this.api.invoke$Response(apiEmployeesGet$Json, params);
      const body = resp.body;
      if (body.isSuccess && Array.isArray(body.result)) {
        if (body.result.length < 20) this.hasMore.set(false);
        this.employees.update(list => [...list, ...body.result]);
      } else {
        this.hasMore.set(false);
      }
    } catch {
      this.hasMore.set(false);
    } finally {
      this.loading.set(false);
    }
  }
}
