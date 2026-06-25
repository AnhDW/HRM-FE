import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Send, Calendar, Info, Loader2 } from 'lucide-angular';
import { Api } from '../../services/api-services/api';
import { AuthService } from '../../core/services/auth.service';
import { apiEmployeesMeGet$Json } from '../../services/api-services/fn/employees/api-employees-me-get-json';
import { apiLeaveRequestsGet$Json } from '../../services/api-services/fn/leave-requests/api-leave-requests-get-json';
import { apiLeaveRequestsPost$Json } from '../../services/api-services/fn/leave-requests/api-leave-requests-post-json';
import { apiEmployeesGet$Json } from '../../services/api-services/fn/employees/api-employees-get-json';
import { EmployeeDto } from '../../services/api-services/models/employee-dto';
import { CreateLeaveRequestDto } from '../../services/api-services/models/create-leave-request-dto';

@Component({
  selector: 'app-leave-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">Yêu cầu nghỉ phép</h1>
        <p class="text-slate-500 mt-2">Gửi yêu cầu nghỉ phép và theo dõi trạng thái.</p>
      </div>

      @if (error()) {
        <div class="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100 text-sm font-semibold">{{ error() }}</div>
      }

      @if (successMsg()) {
        <div class="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 text-sm font-semibold">{{ successMsg() }}</div>
      }

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <!-- Request Form -->
        <div class="xl:col-span-5 bg-white rounded-3xl p-10 shadow-soft border border-slate-100">
          <h2 class="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <lucide-icon name="send" class="w-4 h-4"></lucide-icon>
            </div>
            Yêu cầu mới
          </h2>

          <form (ngSubmit)="submitRequest()" class="space-y-6">
            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700 ml-1">Loại nghỉ phép</label>
              <select
                [(ngModel)]="newRequest.leaveType"
                name="leaveType"
                class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="Annual">Nghỉ phép năm</option>
                <option value="Sick">Nghỉ ốm</option>
                <option value="Unpaid">Nghỉ không lương</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700 ml-1">Ngày bắt đầu</label>
                <div class="relative">
                  <input
                    type="date"
                    [(ngModel)]="newRequest.startDate"
                    name="startDate"
                    class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none"
                  >
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700 ml-1">Ngày kết thúc</label>
                <input
                  type="date"
                  [(ngModel)]="newRequest.endDate"
                  name="endDate"
                  class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none"
                >
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700 ml-1">Lý do</label>
              <textarea
                rows="4"
                [(ngModel)]="newRequest.reason"
                name="reason"
                placeholder="Giải thích ngắn gọn lý do..."
                class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none resize-none"
              ></textarea>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-bold text-slate-700 ml-1">Người duyệt</label>
              <select
                [(ngModel)]="newRequest.approvedBy"
                name="approvedBy"
                class="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-emerald-700/20 transition-all outline-none appearance-none cursor-pointer"
              >
                <option [ngValue]="undefined" disabled>Chọn người duyệt</option>
                @for (emp of employees(); track emp.id) {
                  <option [ngValue]="emp.id">{{ emp.fullName }}</option>
                }
              </select>
            </div>

            <button
              type="submit"
              [disabled]="submitting()"
              class="w-full py-4 bg-emerald-700 text-white rounded-2xl font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-700/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              @if (submitting()) {
                <lucide-icon name="loader2" class="w-5 h-5 animate-spin"></lucide-icon>
              } @else {
                <lucide-icon name="send" class="w-5 h-5"></lucide-icon>
              }
              Gửi đơn
            </button>
          </form>
        </div>

        <!-- History List -->
        <div class="xl:col-span-7 space-y-4">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-xl font-bold text-slate-900">Đơn gần đây</h2>
            <span class="text-sm font-semibold text-slate-400">Hiển thị 5 đơn gần nhất</span>
          </div>

          @if (loading()) {
            <div class="flex items-center justify-center py-16 bg-white rounded-3xl border border-slate-100">
              <lucide-icon name="loader2" class="w-5 h-5 text-emerald-700 animate-spin"></lucide-icon>
              <span class="ml-2 text-slate-500 text-sm font-semibold">Đang tải...</span>
            </div>
          } @else {
            @for (req of leaveRequests(); track req.id) {
              <div class="group bg-white p-6 rounded-2xl shadow-soft border border-slate-100 hover:border-emerald-100 transition-all duration-300">
                <div class="flex justify-between items-start">
                  <div class="flex gap-5">
                    <div class="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                      <lucide-icon name="calendar" class="w-6 h-6"></lucide-icon>
                    </div>
                    <div>
                      <h3 class="font-bold text-slate-900 text-lg">
                        {{ req.leaveType === 'Annual' ? 'Nghỉ phép năm' : req.leaveType === 'Sick' ? 'Nghỉ ốm' : 'Nghỉ không lương' }}
                      </h3>
                      <p class="text-slate-400 font-medium text-sm mt-1">
                        {{ req.startDate | date }} - {{ req.endDate | date }} ({{ req.totalDays }} ngày)
                      </p>
                      <p class="text-slate-500 text-sm mt-3 leading-relaxed">
                        "{{ req.reason || 'Không có lý do.' }}"
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="inline-flex px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider"
                      [ngClass]="{
                        'bg-amber-50 text-amber-700 border-amber-100': req.status === 'Pending',
                        'bg-green-50 text-green-700 border-green-100': req.status === 'Approved',
                        'bg-red-50 text-red-700 border-red-100': req.status === 'Rejected'
                      }"
                    >
                      {{ req.status === 'Pending' ? 'Chờ duyệt' : req.status === 'Approved' ? 'Đã duyệt' : 'Từ chối' }}
                    </span>
                    <p class="text-[10px] text-slate-300 font-bold uppercase mt-3">{{ req.createdAt | date:'shortTime' }}</p>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
                <lucide-icon name="info" class="w-12 h-12 text-slate-200 mx-auto mb-4"></lucide-icon>
                <p class="text-slate-400 font-medium">Không tìm thấy đơn nghỉ phép nào.</p>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class LeaveRequestsComponent implements OnInit {
  api = inject(Api);
  auth = inject(AuthService);

  leaveRequests = signal<any[]>([]);
  employees = signal<EmployeeDto[]>([]);
  loading = signal(false);
  submitting = signal(false);
  error = signal('');
  successMsg = signal('');
  employeeId = signal<number | undefined>(undefined);

  newRequest: any = {
    leaveType: 'Annual',
    startDate: '',
    endDate: '',
    reason: '',
    approvedBy: undefined
  };

  async ngOnInit() {
    await this.loadEmployeeByUserId();
    await this.loadEmployees();
  }

  private async loadEmployeeByUserId() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) {
      this.error.set('Không tìm thấy thông tin người dùng.');
      return;
    }
    this.loading.set(true);
    try {
      const resp = await this.api.invoke$Response(apiEmployeesMeGet$Json, {});
      const body = resp.body as any;
      if (body.isSuccess && body.result) {
        this.employeeId.set(body.result.id);
        this.loadLeaveRequests(body.result.id);
        return;
      }
    } catch {}
    this.loading.set(false);
  }

  private async loadEmployees() {
    try {
      const resp = await this.api.invoke$Response(apiEmployeesGet$Json, {});
      const body = resp.body as any;
      if (body.isSuccess && Array.isArray(body.result)) {
        this.employees.set(body.result);
      }
    } catch {}
  }

  private async loadLeaveRequests(empId: number) {
    try {
      const resp = await this.api.invoke$Response(apiLeaveRequestsGet$Json, {
        PageNumber: 1,
        PageSize: 5
      });
      const body = resp.body as any;
      if (body.isSuccess && Array.isArray(body.result)) {
        this.leaveRequests.set(body.result.filter((r: any) => r.employeeId === empId));
      }
    } catch {
      this.leaveRequests.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async submitRequest() {
    const empId = this.employeeId();
    if (!empId || !this.newRequest.startDate || !this.newRequest.endDate) return;
    this.submitting.set(true);
    this.error.set('');
    this.successMsg.set('');
    try {
      const body: CreateLeaveRequestDto = {
        employeeId: empId,
        leaveType: this.newRequest.leaveType,
        startDate: new Date(this.newRequest.startDate).toISOString(),
        endDate: new Date(this.newRequest.endDate).toISOString(),
        reason: this.newRequest.reason || ''
      };
      const resp = await this.api.invoke$Response(apiLeaveRequestsPost$Json, { body });
      if ((resp.body as any).isSuccess) {
        this.successMsg.set('Gửi đơn nghỉ phép thành công.');
        this.newRequest = { leaveType: 'Annual', startDate: '', endDate: '', reason: '', approvedBy: undefined };
        if (this.employeeId()) {
          this.loadLeaveRequests(this.employeeId()!);
        }
      } else {
        this.error.set((resp.body as any).message || 'Không thể gửi đơn nghỉ phép.');
      }
    } catch {
      this.error.set('Lỗi kết nối đến máy chủ.');
    } finally {
      this.submitting.set(false);
    }
  }
}
