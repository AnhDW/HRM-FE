import { Component, inject, signal, computed, Input, Output, EventEmitter, ViewChild, ElementRef, OnChanges, SimpleChanges, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Search, Loader2, X, Check, Users, CheckSquare } from 'lucide-angular';
import { MockDataService } from '../../core/services/mock-data.service';
import { Api } from '../../services/api-services/api';
import { apiEmployeesGet$Json } from '../../services/api-services/fn/employees/api-employees-get-json';

@Component({
  selector: 'app-employee-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    @if (visible) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div (click)="close()" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
        <div class="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
          
          <!-- Header -->
          <div class="flex items-center justify-between p-6 pb-4 border-b border-slate-50 flex-shrink-0">
            <h2 class="text-xl font-black text-slate-900 flex items-center gap-2">
              <lucide-icon name="users" class="w-6 h-6 text-emerald-600"></lucide-icon>
              Chọn nhân viên
            </h2>
            <button (click)="close()" class="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all flex-shrink-0">
              <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
            </button>
          </div>

          <!-- Search + Select All (multi only) -->
          <div class="px-6 py-4 border-b border-slate-50 flex items-center gap-4 flex-shrink-0">
            <div class="relative flex-1">
              <lucide-icon name="search" class="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></lucide-icon>
              <input (input)="onSearchInput($any($event.target).value)" type="text" placeholder="Tìm kiếm nhân viên..."
                class="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none">
            </div>
            @if (multiple) {
              <button (click)="toggleSelectAll()" class="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all whitespace-nowrap">
                <lucide-icon [name]="allSelected() ? 'x' : 'check-square'" class="w-4 h-4"></lucide-icon>
                {{ allSelected() ? 'Bỏ chọn tất cả' : 'Chọn tất cả' }}
              </button>
            }
          </div>

          <!-- Loading -->
          @if (loading() && employeeList().length === 0) {
            <div class="flex items-center justify-center py-12">
              <lucide-icon name="loader2" class="w-5 h-5 text-emerald-700 animate-spin"></lucide-icon>
              <span class="ml-2 text-slate-500 text-sm font-semibold">Đang tải...</span>
            </div>
          }

          <!-- Employee list -->
          <div #listContainer class="flex-1 overflow-y-auto p-6 space-y-1">
            @for (emp of filteredEmployees(); track emp.id) {
              <button (click)="toggleEmployee(emp.id)"
                class="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent text-left"
                [class.bg-slate-50]="isSelected(emp.id)"
                [class.border-slate-100]="isSelected(emp.id)">
                @if (multiple) {
                  <div [class]="'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ' + (isSelected(emp.id) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300')">
                    @if (isSelected(emp.id)) {
                      <lucide-icon name="check" class="w-3.5 h-3.5 text-white"></lucide-icon>
                    }
                  </div>
                } @else {
                  <div [class]="'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ' + (isSelected(emp.id) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300')">
                    @if (isSelected(emp.id)) {
                      <lucide-icon name="check" class="w-3.5 h-3.5 text-white"></lucide-icon>
                    }
                  </div>
                }
                <img [src]="'https://ui-avatars.com/api/?name=' + emp.fullName + '&size=64&background=0f766e&color=fff'" class="w-10 h-10 rounded-xl flex-shrink-0" alt="avatar">
                <div class="min-w-0 flex-1">
                  <p class="font-bold text-slate-900 text-sm truncate">{{ emp.fullName }}</p>
                  <p class="text-[11px] font-medium text-slate-400 truncate">{{ emp.position }}</p>
                </div>
                <span class="text-xs font-medium text-slate-400 flex-shrink-0">{{ emp.departmentName || '' }}</span>
              </button>
            } @empty {
              @if (!loading()) {
                <div class="text-center py-12">
                  <lucide-icon name="users" class="w-12 h-12 text-slate-200 mx-auto mb-3"></lucide-icon>
                  <p class="text-slate-400 font-medium">Không có nhân viên nào</p>
                </div>
              }
            }

            @if (loading() && employeeList().length > 0) {
              <div class="flex items-center justify-center py-3">
                <lucide-icon name="loader2" class="w-4 h-4 text-emerald-700 animate-spin"></lucide-icon>
              </div>
            }

            <div id="empPickerSentinel" class="h-1"></div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-slate-50/50 flex-shrink-0 rounded-b-3xl">
            <div class="text-sm font-medium text-slate-500">
              @if (multiple) {
                Đã chọn: <span class="font-bold text-emerald-700">{{ selectedIds().size }}</span> nhân viên
              }
            </div>
            <div class="flex gap-3">
              <button (click)="close()" class="px-6 py-2.5 font-bold text-slate-400 hover:text-slate-900 rounded-xl transition-all">
                Hủy
              </button>
              <button (click)="confirm()" [disabled]="selectedIds().size === 0"
                class="flex items-center gap-2 px-8 py-2.5 bg-emerald-700 text-white rounded-xl font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20 disabled:opacity-50 disabled:cursor-not-allowed">
                <lucide-icon name="check" class="w-4 h-4"></lucide-icon>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class EmployeePickerComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() visible = false;
  @Input() multiple = false;
  @Input() preSelectedIds: number[] = [];
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() selectionConfirmed = new EventEmitter<number[]>();
  @Output() selectionWithData = new EventEmitter<{id: number, fullName: string, position: string, departmentName?: string}[]>();

  @ViewChild('listContainer') listContainer!: ElementRef<HTMLElement>;

  private api = inject(Api);
  mockService = inject(MockDataService);
  private eRef = inject(ElementRef);

  selectedIds = signal<Set<number>>(new Set());
  searchQuery = signal('');
  employeeList = signal<any[]>([]);
  page = signal(1);
  totalPages = signal(0);
  loading = signal(false);
  private observer: IntersectionObserver | null = null;
  private searchTimeout: any;
  private initialised = false;

  filteredEmployees = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.employeeList();
    if (!q) return list;
    return list.filter(e =>
      e.fullName?.toLowerCase().includes(q) || e.position?.toLowerCase().includes(q)
    );
  });

  allSelected = computed(() =>
    this.filteredEmployees().length > 0 &&
    this.filteredEmployees().every(e => this.selectedIds().has(e.id))
  );

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && changes['visible'].currentValue) {
      setTimeout(() => this.init());
    }
  }

  ngAfterViewInit() {
    if (this.visible) {
      setTimeout(() => this.init());
    }
  }

  private init() {
    if (this.initialised) return;
    this.initialised = true;
    this.selectedIds.set(new Set(this.preSelectedIds));
    this.searchQuery.set('');
    this.employeeList.set([]);
    this.page.set(1);
    this.totalPages.set(0);
    this.loadPage(1, false, '');
    setTimeout(() => this.initObserver());
  }

  private cleanup() {
    this.observer?.disconnect();
    this.observer = null;
    clearTimeout(this.searchTimeout);
    this.initialised = false;
  }

  ngOnDestroy() {
    this.cleanup();
  }

  close() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cleanup();
  }

  confirm() {
    const ids = Array.from(this.selectedIds());
    const allLoaded = this.employeeList();
    const selectedItems = ids.map(id => allLoaded.find(e => e.id === id)).filter(Boolean)
      .map(e => ({ id: e.id, fullName: e.fullName, position: e.position, departmentName: e.departmentName }));
    this.selectionConfirmed.emit(ids);
    this.selectionWithData.emit(selectedItems);
    this.close();
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.employeeList.set([]);
      this.page.set(1);
      this.totalPages.set(0);
      this.loadPage(1, false, value);
    }, 300);
  }

  toggleEmployee(empId: number) {
    if (this.multiple) {
      this.selectedIds.update(set => {
        const newSet = new Set(set);
        if (newSet.has(empId)) newSet.delete(empId);
        else newSet.add(empId);
        return newSet;
      });
    } else {
      this.selectedIds.set(new Set([empId]));
    }
  }

  isSelected(empId: number): boolean {
    return this.selectedIds().has(empId);
  }

  toggleSelectAll() {
    if (this.allSelected()) {
      this.selectedIds.set(new Set());
    } else {
      this.selectedIds.set(new Set(this.filteredEmployees().map(e => e.id)));
    }
  }

  private async loadPage(page: number, append: boolean, query: string) {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      const resp = await this.api.invoke$Response(apiEmployeesGet$Json, {
        FullNameAndEmail: query || undefined,
        PageNumber: page,
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
        const items: any[] = Array.isArray(body.result) ? body.result : [];
        if (append) this.employeeList.update(prev => [...prev, ...items]);
        else this.employeeList.set(items);
        this.page.set(page);
      } else {
        if (!append) this.employeeList.set([]);
      }
    } catch {
      const fallback = this.mockService.employees().filter(e =>
        !query || (e.fullName?.toLowerCase() || '').includes(query.toLowerCase()) || (e.email?.toLowerCase() || '').includes(query.toLowerCase())
      );
      if (append) this.employeeList.update(prev => [...prev, ...fallback]);
      else this.employeeList.set(fallback);
      this.totalPages.set(1);
    } finally {
      this.loading.set(false);
    }
  }

  private initObserver() {
    this.observer?.disconnect();
    const sentinel = (this.eRef.nativeElement as HTMLElement).querySelector('#empPickerSentinel');
    const container = this.listContainer?.nativeElement;
    if (!sentinel) return;
    this.observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && this.page() < this.totalPages()) {
        this.loadPage(this.page() + 1, true, this.searchQuery());
      }
    }, { root: container, threshold: 0.1 });
    this.observer.observe(sentinel);
  }
}
