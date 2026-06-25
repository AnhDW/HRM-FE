import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Check, X, User, Loader2 } from 'lucide-angular';
import { Api } from '../../services/api-services/api';
import { AuthService } from '../../core/services/auth.service';
import { apiEmployeesMeGet$Json } from '../../services/api-services/fn/employees/api-employees-me-get-json';
import { apiEmployeesGet$Json } from '../../services/api-services/fn/employees/api-employees-get-json';
import { apiLeaveRequestsGet$Json } from '../../services/api-services/fn/leave-requests/api-leave-requests-get-json';
import { apiLeaveRequestsApprovePut$Json } from '../../services/api-services/fn/leave-requests/api-leave-requests-approve-put-json';
import { EmployeePickerComponent } from '../../shared/components/employee-picker.component';

@Component({
  selector: 'app-admin-leave',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, EmployeePickerComponent],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Duyệt đơn nghỉ phép</h1>
           <div class="flex gap-4 mt-3">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                {{ pendingCount() }} đơn chờ duyệt
              </span>
              <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                {{ processedCount() }} đã xử lý
              </span>
          </div>
        </div>
      </div>

      @if (error()) {
        <div class="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm font-semibold">{{ error() }}</div>
      }

      @if (successMsg()) {
        <div class="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 text-sm font-semibold">{{ successMsg() }}</div>
      }

      <!-- Filter & Tab Bar -->
      <div class="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <!-- Employee Picker -->
        <app-employee-picker
          [selectedIds]="selectedEmployeeIds()"
          (confirmed)="onEmployeesSelected($event)"
        />

        <!-- Status Tabs -->
        <div class="bg-slate-100/50 p-1 rounded-xl flex">
          <button
            (click)="filterStatus.set('Pending')"
            [class]="filterStatus() === 'Pending' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'"
            class="px-5 py-2 rounded-lg text-sm font-bold transition-all"
          >
             Chờ duyệt
           </button>
           <button
            (click)="filterStatus.set('Approved')"
            [class]="filterStatus() === 'Approved' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'"
             class="px-5 py-2 rounded-lg text-sm font-bold transition-all"
           >
             Đã duyệt
           </button>
           <button
            (click)="filterStatus.set('Rejected')"
            [class]="filterStatus() === 'Rejected' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'"
             class="px-5 py-2 rounded-lg text-sm font-bold transition-all"
           >
             Từ chối
           </button>
        </div>
      </div>

      <!-- Data Table -->
      <div class="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Nhân viên</th>
                <th class="px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Loại</th>
                <th class="px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Thời gian</th>
                <th class="px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Ngày</th>
                <th class="px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider">Lý do</th>
                <th class="px-6 py-4 text-[13px] font-bold text-slate-400 uppercase tracking-wider text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              @if (loading()) {
                <tr>
                  <td colspan="6" class="px-8 py-20 text-center">
                    <div class="flex items-center justify-center gap-3">
                      <lucide-icon name="loader2" class="w-5 h-5 text-emerald-700 animate-spin"></lucide-icon>
                      <span class="text-slate-500 text-sm font-semibold">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              } @else {
                @for (req of filteredRequests(); track req.id) {
                    <tr class="hover:bg-slate-50/30 transition-all group">
                     <td class="px-6 py-4">
                       <div class="flex items-center gap-3">
                         <div class="w-9 h-9 rounded-full overflow-hidden bg-slate-100 border-2 border-white shadow-sm">
                           <img [src]="'https://ui-avatars.com/api/?name=' + (employeeName(req.employeeId) || '') + '&background=f1f5f9&color=64748b'" alt="Avatar">
                         </div>
                         <div>
                           <p class="font-bold text-slate-900 leading-none text-sm">{{ employeeName(req.employeeId) }}</p>
                         </div>
                       </div>
                     </td>
                    <td class="px-6 py-4">
                      <span class="text-sm font-semibold text-slate-600">
                        {{ req.leaveType === 'Annual' ? 'Phép năm' : req.leaveType === 'Sick' ? 'Ốm' : 'Không lương' }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <p class="text-sm font-bold text-slate-700 leading-tight">{{ req.startDate | date:'MMM d' }} - {{ req.endDate | date:'MMM d' }}</p>
                    </td>
                    <td class="px-6 py-4 font-bold text-slate-900 text-sm">{{ calcDays(req.startDate, req.endDate) }}</td>
                    <td class="px-6 py-4 max-w-xs">
                      <p class="text-xs text-slate-500 truncate" [title]="req.reason">{{ req.reason }}</p>
                    </td>
                    <td class="px-6 py-4 text-right">
                      @if (req.status === 'Pending') {
                        <div class="flex items-center justify-end gap-2">
                          <button
                            (click)="approve(req)"
                            [disabled]="processingId() === req.id"
                            class="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all disabled:opacity-50"
                          >
                            <lucide-icon name="check" class="w-4 h-4"></lucide-icon>
                          </button>
                          <button
                            (click)="openRejectModal(req)"
                            [disabled]="processingId() === req.id"
                            class="p-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50"
                          >
                            <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
                          </button>
                        </div>
                      } @else if (req.status === 'Approved') {
                        <span class="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-widest">Đã duyệt</span>
                       } @else {
                        <span class="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100 uppercase tracking-widest">Đã từ chối</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                     <td colspan="6" class="px-8 py-20 text-center">
                       <div class="flex flex-col items-center gap-3">
                          <div class="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
                            <lucide-icon name="user" class="w-8 h-8"></lucide-icon>
                          </div>
                           <p class="text-slate-400 font-medium italic">Không tìm thấy đơn nghỉ phép nào.</p>
                       </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Rejection Modal -->
    @if (showRejectModal()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
        <div class="bg-white w-full max-w-md rounded-3xl shadow-2xl p-10 animate-in zoom-in-95 duration-200">
           <h2 class="text-2xl font-black text-slate-900 mb-2">Từ chối đơn</h2>
            <p class="text-slate-500 text-sm mb-8 font-medium">Vui lòng cung cấp lý do từ chối đơn nghỉ phép này.</p>

           <div class="space-y-6">
              <div class="space-y-2">
                 <label class="text-sm font-bold text-slate-700 ml-1">Lý do từ chối</label>
                <textarea
                  [(ngModel)]="rejectReason"
                  rows="4"
                  placeholder="VD: Quá nhiều yêu cầu trong kỳ này..."
                  class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-red-700/20 transition-all outline-none resize-none"
                ></textarea>
              </div>

              <div class="flex gap-4">
                <button
                  (click)="showRejectModal.set(false)"
                  class="flex-1 py-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl font-bold transition-all"
                >
                   Hủy
                 </button>
                 <button
                   (click)="confirmReject()"
                   class="flex-1 py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                 >
                   Xác nhận từ chối
                 </button>
              </div>
           </div>
        </div>
      </div>
    }
  `
})
export class AdminLeaveComponent implements OnInit {
  api = inject(Api);
  auth = inject(AuthService);

  leaveRequests = signal<any[]>([]);
  employeeId = signal<number | undefined>(undefined);
  loading = signal(false);
  processingId = signal<number | string | null | undefined>(null);
  error = signal('');
  successMsg = signal('');

  filterStatus = signal<string>('Pending');
  showRejectModal = signal(false);
  rejectReason = signal('');
  activeReq = signal<any>(null);
  selectedEmployeeIds = signal<(number | string)[]>([]);

  pendingCount = computed(() => this.leaveRequests().filter(r => r.status === 'Pending').length);
  processedCount = computed(() => this.leaveRequests().filter(r => r.status !== 'Pending').length);

  filteredRequests = computed(() => {
    return this.leaveRequests().filter(r => r.status === this.filterStatus());
  });

  employeesMap = signal<Map<number | string, any>>(new Map());

  async ngOnInit() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this.loading.set(true);
    try {
      const resp = await this.api.invoke$Response(apiEmployeesMeGet$Json, {});
      const body = resp.body as any;
      if (body.isSuccess && body.result) {
        this.employeeId.set(body.result.id);
        await this.loadLeaveRequests();
      }
    } catch {
      this.error.set('Không thể tải thông tin người dùng.');
    } finally {
      this.loading.set(false);
    }
    this.loadEmployees();
  }

  async loadEmployees() {
    try {
      const resp = await this.api.invoke$Response(apiEmployeesGet$Json, {
        PageNumber: 1,
        PageSize: 200
      });
      const body = resp.body as any;
      if (body.isSuccess && Array.isArray(body.result)) {
        const map = new Map<number | string, any>();
        for (const emp of body.result) {
          map.set(emp.id, emp);
        }
        this.employeesMap.set(map);
      }
    } catch {}
  }

  employeeName(employeeId?: number | string): string {
    if (!employeeId) return '';
    return this.employeesMap().get(employeeId)?.fullName || '';
  }

  async loadLeaveRequests() {
    const empId = this.employeeId();
    if (!empId) return;
    try {
      const params: any = {
        ApprovedBy: empId,
        PageNumber: 1,
        PageSize: 50
      };
      if (this.selectedEmployeeIds().length > 0) {
        params.EmployeeIds = this.selectedEmployeeIds();
      }
      const resp = await this.api.invoke$Response(apiLeaveRequestsGet$Json, params);
      const body = resp.body as any;
      if (body.isSuccess && Array.isArray(body.result)) {
        this.leaveRequests.set(body.result);
      }
    } catch {
      this.leaveRequests.set([]);
    }
  }

  onEmployeesSelected(ids: (number | string)[]) {
    this.selectedEmployeeIds.set(ids);
    this.loadLeaveRequests();
  }

  async approve(req: any) {
    this.processingId.set(req.id);
    this.error.set('');
    this.successMsg.set('');
    try {
      const body: any = {
        id: req.id,
        employeeId: req.employeeId,
        leaveType: req.leaveType,
        startDate: req.startDate,
        endDate: req.endDate,
        reason: req.reason,
        status: 'Approved'
      };
      const resp = await this.api.invoke$Response(apiLeaveRequestsApprovePut$Json, { body });
      if ((resp.body as any).isSuccess) {
        this.successMsg.set('Đã duyệt đơn thành công.');
        await this.loadLeaveRequests();
      } else {
        this.error.set((resp.body as any).message || 'Không thể duyệt đơn.');
      }
    } catch {
      this.error.set('Lỗi kết nối đến máy chủ.');
    } finally {
      this.processingId.set(null);
    }
  }

  openRejectModal(req: any) {
    this.activeReq.set(req);
    this.rejectReason.set('');
    this.showRejectModal.set(true);
  }

  async confirmReject() {
    const req = this.activeReq();
    if (!req) return;
    this.processingId.set(req.id);
    this.error.set('');
    this.successMsg.set('');
    this.showRejectModal.set(false);
    try {
      const body: any = {
        id: req.id,
        employeeId: req.employeeId,
        leaveType: req.leaveType,
        startDate: req.startDate,
        endDate: req.endDate,
        reason: req.reason,
        approvedBy: req.approvedBy,
        status: 'Rejected',
        rejectionReason: this.rejectReason() || undefined
      };
      const resp = await this.api.invoke$Response(apiLeaveRequestsApprovePut$Json, { body });
      if ((resp.body as any).isSuccess) {
        this.successMsg.set('Đã từ chối đơn.');
        await this.loadLeaveRequests();
      } else {
        this.error.set((resp.body as any).message || 'Không thể từ chối đơn.');
      }
    } catch {
      this.error.set('Lỗi kết nối đến máy chủ.');
    } finally {
      this.processingId.set(null);
    }
  }

  calcDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
  }
}
