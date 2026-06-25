import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Clock, Calendar, CheckCircle2, TrendingUp, Loader2 } from 'lucide-angular';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Api } from '../../services/api-services/api';
import { apiEmployeesMeGet$Json } from '../../services/api-services/fn/employees/api-employees-me-get-json';
import { apiAttendancesGet$Json } from '../../services/api-services/fn/attendances/api-attendances-get-json';
import { apiAttendancesTimekeepingPut$Json } from '../../services/api-services/fn/attendances/api-attendances-timekeeping-put-json';
import { apiLeaveRequestsGet$Json } from '../../services/api-services/fn/leave-requests/api-leave-requests-get-json';
import { apiEventsByCreatorEmployeeIdMonthYearGet$Json } from '../../services/api-services/fn/events/api-events-by-creator-employee-id-month-year-get-json';
import { apiEventsByInvitedEmployeeIdMonthYearGet$Json } from '../../services/api-services/fn/events/api-events-by-invited-employee-id-month-year-get-json';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="space-y-10 animate-in fade-in duration-700">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 tracking-tight">{{ greeting() }}</h1>
        <p class="text-slate-500 mt-2">Tổng quan hoạt động của bạn trong ngày hôm nay.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 bg-white rounded-2xl p-4 sm:p-8 shadow-soft border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
           <div class="flex items-center gap-4 sm:gap-6">
             <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-4 ring-slate-50 flex-shrink-0">
               <img [src]="'https://ui-avatars.com/api/?name=' + (employee()?.fullName || auth.currentUser()?.fullName || 'User') + '&background=0f766e&color=fff&size=128'" alt="Profile">
             </div>
             <div class="min-w-0">
               <h2 class="text-lg sm:text-xl font-bold text-slate-900 truncate">{{ employee()?.fullName || auth.currentUser()?.fullName }}</h2>
                <p class="text-sm sm:text-base text-slate-500 font-medium truncate">{{ employee()?.position || 'Nhân viên' }}</p>
             </div>
           </div>

           <div class="text-right flex-shrink-0">
             <p class="text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider">Tỷ lệ chấm công</p>
             <p class="text-2xl sm:text-4xl font-bold text-emerald-700 mt-1">{{ attendanceRate() }}%</p>
           </div>
         </div>

        <div class="bg-emerald-700 rounded-2xl p-8 shadow-lg shadow-emerald-700/20 text-white relative overflow-hidden group cursor-pointer transition-all-300 hover:scale-[1.02]" (click)="doTimekeeping()">
          <div class="relative z-10">
            <h3 class="text-xl font-bold">Chấm công nhanh</h3>
             <p class="text-emerald-100/80 mt-1">Ghi nhận sự có mặt của bạn</p>
            <div class="mt-8 flex items-center gap-3">
              <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <lucide-icon name="clock" class="w-6 h-6"></lucide-icon>
              </div>
              <span class="text-2xl font-bold">{{ timekeepingText() }}</span>
            </div>
          </div>
          <div class="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500"></div>
        </div>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-16">
          <lucide-icon name="loader2" class="w-6 h-6 text-emerald-700 animate-spin"></lucide-icon>
          <span class="ml-2 text-slate-500 font-semibold">Đang tải...</span>
        </div>
      }

      @if (!loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (stat of stats(); track stat.label) {
            <div class="bg-white p-6 rounded-2xl shadow-soft border border-slate-100 transition-all-300 hover:border-emerald-100">
              <div class="w-10 h-10 rounded-lg bg-slate-50 text-slate-700 flex items-center justify-center mb-4">
                <lucide-icon [name]="stat.icon" class="w-5 h-5"></lucide-icon>
              </div>
              <p class="text-sm font-medium text-slate-400">{{ stat.label }}</p>
              <p class="text-2xl font-bold text-slate-900 mt-1">{{ stat.value }}</p>
            </div>
          }
        </div>
      }

       <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="bg-white rounded-2xl p-4 sm:p-8 shadow-soft border border-slate-100">
            <div class="flex items-center justify-between mb-6">
               <h3 class="font-bold text-slate-900 text-base sm:text-lg">Sự kiện sắp tới</h3>
               <button routerLink="/calendar" class="text-emerald-700 text-sm font-semibold hover:underline flex-shrink-0">Xem tất cả</button>
            </div>
            <div class="space-y-4">
              @for (evt of upcomingEvents(); track evt.id) {
                <div class="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                  <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-white flex flex-col items-center justify-center shadow-sm flex-shrink-0">
                    <span class="text-[10px] sm:text-xs font-bold text-slate-400 uppercase leading-none">{{ getMonthAbbr(evt.eventDate) }}</span>
                    <span class="text-base sm:text-lg font-bold text-emerald-700 leading-none mt-1">{{ getDay(evt.eventDate) }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="font-bold text-slate-900 text-sm sm:text-base truncate">{{ evt.title }}</p>
                    <p class="text-xs sm:text-sm text-slate-400">{{ evt.startTime || 'Cả ngày' }} - {{ evt.endTime || '' }}</p>
                  </div>
                </div>
              } @empty {
                <p class="text-slate-400 text-sm text-center py-4">Không có sự kiện sắp tới</p>
              }
            </div>
          </div>

          <div class="bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden group">
            <div class="relative z-10 h-full flex flex-col justify-between">
               <div>
                 <span class="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">Tính năng mới</span>
                 <h3 class="text-xl sm:text-2xl font-bold mt-4 sm:mt-6 mb-2">Bảng lương tự động đã có mặt</h3>
                 <p class="text-slate-400 leading-relaxed text-sm sm:text-base">Chúng tôi đã tích hợp AI để xử lý các khoản khấu trừ của bạn chính xác hơn bao giờ hết.</p>
               </div>
               <button routerLink="/payroll" class="w-fit bg-emerald-700 hover:bg-emerald-600 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold transition-all mt-6 sm:mt-8 text-sm sm:text-base">Khám phá ngay</button>
            </div>
            <div class="absolute top-0 right-0 w-full h-full opacity-30 pointer-events-none">
               <div class="absolute -top-1/2 -right-1/2 w-full h-full bg-emerald-900 rounded-full blur-[120px]"></div>
               <div class="absolute -bottom-1/2 -left-1/2 w-full h-full bg-slate-800 rounded-full blur-[100px]"></div>
            </div>
          </div>
       </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  api = inject(Api);

  employee = signal<any>(null);
  loading = signal(true);
  employeeId = signal<number | undefined>(undefined);
  attendanceRecords = signal<any[]>([]);
  upcomingEvents = signal<any[]>([]);
  approvedLeaveDays = signal(0);

  greeting = computed(() => {
    const hour = new Date().getHours();
    const name = this.employee()?.fullName || this.auth.currentUser()?.fullName || 'bạn';
    const prefix = hour < 12 ? 'Chào buổi sáng' : hour < 17 ? 'Chào buổi chiều' : 'Chào buổi tối';
    return `${prefix}, ${name} 👋`;
  });

  timekeepingText = computed(() => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  });

  attendanceRate = computed(() => {
    const records = this.attendanceRecords();
    if (!records.length) return 0;
    const now = new Date();
    const totalWorkDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const present = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
    return totalWorkDays > 0 ? Math.round((present / totalWorkDays) * 100) : 0;
  });

  stats = computed(() => {
    const records = this.attendanceRecords();
    const lateMin = records.reduce((sum: number, r: any) => sum + (r.lateMinutes || 0), 0);
    const now = new Date();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const presentDays = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
    return [
      { label: 'Ngày công', value: `${presentDays}/${totalDays}`, icon: 'calendar' },
      { label: 'Phút đi muộn', value: `${lateMin}m`, icon: 'clock' },
      { label: 'Nghỉ đã duyệt', value: `${this.approvedLeaveDays()} Ngày`, icon: 'check-circle-2' },
      { label: 'Tăng trưởng', value: '+12.5%', icon: 'trending-up' },
    ];
  });


  async ngOnInit() {
    await this.loadEmployeeByUserId();
    await this.loadDashboardData();
  }

  private async loadEmployeeByUserId() {
    try {
      const resp = await this.api.invoke(apiEmployeesMeGet$Json, {});
      if ((resp as any)?.isSuccess && (resp as any)?.result) {
        const emp = (resp as any).result;
        this.employee.set(emp);
        this.employeeId.set(emp.id);
      }
    } catch {}
  }

  private async loadDashboardData() {
    const empId = this.employeeId();
    if (!empId) { this.loading.set(false); return; }

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fromDate = firstDay.toISOString().substring(0, 10);
    const toDate = lastDay.toISOString().substring(0, 10);

    try {
      const [attResp, leaveResp, creatorResp, invitedResp] = await Promise.all([
        this.api.invoke(apiAttendancesGet$Json, {
          EmployeeId: empId, FromDate: fromDate, ToDate: toDate, PageNumber: 1, PageSize: 31
        }),
        this.api.invoke(apiLeaveRequestsGet$Json, {
          EmployeeId: empId, Status: 'Approved', PageNumber: 1, PageSize: 50
        }),
        this.api.invoke(apiEventsByCreatorEmployeeIdMonthYearGet$Json, {
          employeeId: empId, month: now.getMonth() + 1, year: now.getFullYear()
        }),
        this.api.invoke(apiEventsByInvitedEmployeeIdMonthYearGet$Json, {
          employeeId: empId, month: now.getMonth() + 1, year: now.getFullYear()
        })
      ]);

      if ((attResp as any)?.isSuccess && Array.isArray((attResp as any).result)) {
        this.attendanceRecords.set((attResp as any).result);
      }

      if ((leaveResp as any)?.isSuccess && Array.isArray((leaveResp as any).result)) {
        const approved = (leaveResp as any).result as any[];
        const totalDays = approved.reduce((sum: number, r: any) => {
          const start = new Date(r.startDate);
          const end = new Date(r.endDate);
          return sum + Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
        }, 0);
        this.approvedLeaveDays.set(totalDays);
      }

      const allEvents: any[] = [];
      if ((creatorResp as any)?.isSuccess && Array.isArray((creatorResp as any).result)) {
        allEvents.push(...(creatorResp as any).result);
      }
      if ((invitedResp as any)?.isSuccess && Array.isArray((invitedResp as any).result)) {
        allEvents.push(...(invitedResp as any).result);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const future = allEvents
        .filter((e: any) => new Date(e.eventDate) >= today)
        .sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
        .slice(0, 5);
      this.upcomingEvents.set(future);

    } catch {} finally {
      this.loading.set(false);
    }
  }

  async doTimekeeping() {
    const empId = this.employeeId();
    if (!empId) return;
    try {
      await this.api.invoke(apiAttendancesTimekeepingPut$Json, {
        body: { employeeId: empId, dateTime: new Date().toISOString() }
      });
    } catch {}
  }

  getMonthAbbr(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'short' });
  }

  getDay(dateStr: string): string {
    return new Date(dateStr).getDate().toString();
  }
}
