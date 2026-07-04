import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ChevronLeft, ChevronRight, Calendar, Plus, Clock, CheckCircle2, AlertCircle } from 'lucide-angular';
import { TutorialButtonComponent } from '../../shared/tutorial/tutorial-button.component';
import { Api } from '../../services/api-services/api';
import { AuthService } from '../../core/services/auth.service';
import { apiAttendancesGet$Json } from '../../services/api-services/fn/attendances/api-attendances-get-json';
import { apiEmployeesMeGet$Json } from '../../services/api-services/fn/employees/api-employees-me-get-json';

interface AttendanceEvent {
  date: string;
  checkIn?: string;
  checkOut?: string;
  label?: string;
  status: 'on-time' | 'late' | 'absent' | 'leave' | 'holiday';
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TutorialButtonComponent],
  template: `
    <div class="space-y-6 animate-in fade-in duration-700">
      <!-- Header Section -->
      <div data-tutorial="att-header" class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 md:gap-3">
             <lucide-icon name="calendar" class="w-6 h-6 md:w-8 md:h-8 text-emerald-600"></lucide-icon>
             Lịch làm việc
          </h1>
          <p class="text-slate-500 mt-1 font-medium text-xs md:text-base">Quản lý chấm công — Nhấn vào một ngày để xem chi tiết.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <app-tutorial-button tutorialId="employee-attendance"></app-tutorial-button>
           <div data-tutorial="att-nav" class="flex items-center gap-1 lg:gap-3 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
            <button 
              (click)="goToToday()"
             class="hidden sm:block px-3 lg:px-4 py-2 text-xs lg:text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
           >
             Hôm nay
           </button>
           <div class="hidden sm:block w-px h-6 bg-slate-100"></div>
           <div class="flex items-center gap-0 lg:gap-1">
              <button (click)="changeMonth(-1)" class="p-1.5 lg:p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                <lucide-icon name="chevron-left" class="w-4 h-4 lg:w-5 lg:h-5"></lucide-icon>
              </button>
              <span class="px-2 lg:px-4 text-[11px] lg:text-sm font-black text-slate-900 min-w-[100px] lg:min-w-[140px] text-center capitalize">
                {{ viewDate() | date:'MMMM, yyyy' }}
              </span>
              <button (click)="changeMonth(1)" class="p-1.5 lg:p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all">
                <lucide-icon name="chevron-right" class="w-4 h-4 lg:w-5 lg:h-5"></lucide-icon>
              </button>
            </div>
         </div>
      </div>
      </div>

      <!-- Calendar Stats Summary -->
      <div data-tutorial="att-stats" class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
         <div class="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-soft">
            <p class="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng công</p>
            <p class="text-base md:text-xl font-black text-emerald-600 mt-1">{{ workDays() }} Ngày</p>
         </div>
         <div class="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-soft">
            <p class="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đi muộn</p>
            <p class="text-base md:text-xl font-black text-amber-500 mt-1">{{ lateDays() }} Ngày</p>
         </div>
         <div class="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-soft">
            <p class="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nghỉ phép</p>
            <p class="text-base md:text-xl font-black text-blue-500 mt-1">{{ leaveDays() }} Ngày</p>
         </div>
         <div class="bg-white p-3 md:p-4 rounded-2xl border border-slate-100 shadow-soft">
            <p class="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Giờ làm việc</p>
            <p class="text-base md:text-xl font-black text-slate-900 mt-1">{{ workDays() * 8 }}h</p>
         </div>
      </div>

      <!-- Main Calendar Grid -->
      <div data-tutorial="att-calendar" class="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <!-- Weekdays Header -->
         <div class="grid grid-cols-7 bg-slate-50/50 border-b border-slate-100">
            @for (day of weekDays; track day) {
              <div class="py-2 md:py-4 text-center">
                 <span class="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] md:tracking-[0.2em]">{{ day }}</span>
              </div>
            }
         </div>

        <!-- Days Grid -->
        <div class="grid grid-cols-7 divide-x divide-y divide-slate-50 border-collapse">
           @for (dayInfo of calendarDays(); track dayInfo.date) {
              <div 
                [class]="dayInfo.isCurrentMonth ? 'bg-white' : 'bg-slate-50/30'"
                class="min-h-[80px] md:min-h-[120px] p-1 md:p-2 hover:bg-slate-50/80 transition-all cursor-pointer relative group"
             >
                <!-- Day Number -->
                <div class="flex items-center justify-between mb-2">
                    <span 
                      [class]="dayInfo.isToday ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : (dayInfo.isCurrentMonth ? 'text-slate-900' : 'text-slate-300')"
                      class="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-lg text-[10px] md:text-xs font-bold transition-all"
                    >
                       {{ dayInfo.day }}
                    </span>
                </div>

                <!-- Day Events -->
                <div class="space-y-1">
                   @for (event of getEventForDate(dayInfo.date); track $index) {
                      <div 
                        [class.bg-emerald-50]="event.status === 'on-time'"
                        [class.text-emerald-700]="event.status === 'on-time'"
                        [class.border-emerald-100]="event.status === 'on-time'"
                        
                        [class.bg-amber-50]="event.status === 'late'"
                        [class.text-amber-700]="event.status === 'late'"
                        [class.border-amber-100]="event.status === 'late'"
                        
                        [class.bg-blue-50]="event.status === 'leave'"
                        [class.text-blue-700]="event.status === 'leave'"
                        [class.border-blue-100]="event.status === 'leave'"

                        [class.bg-red-50]="event.status === 'absent'"
                        [class.text-red-700]="event.status === 'absent'"
                        [class.border-red-100]="event.status === 'absent'"

                        [class.bg-indigo-50]="event.status === 'holiday'"
                        [class.text-indigo-700]="event.status === 'holiday'"
                        [class.border-indigo-100]="event.status === 'holiday'"
                        
                        class="p-2 rounded-xl border text-[10px] font-bold shadow-sm animate-in slide-in-from-left-2 duration-300"
                      >
                         @if (event.checkIn) {
                            <div class="flex items-center gap-1.5 mb-1">
                                <lucide-icon name="clock" class="w-3 h-3 opacity-70"></lucide-icon>
                                <span>{{ event.checkIn }} - {{ event.checkOut }}</span>
                            </div>
                         }
                         <div class="flex items-center gap-1">
                            @if (event.status === 'on-time') { <lucide-icon name="check-circle-2" class="w-3 h-3"></lucide-icon> }
                            @if (event.status === 'late') { <lucide-icon name="alert-circle" class="w-3 h-3"></lucide-icon> }
                            @if (event.status === 'leave') { <lucide-icon name="calendar" class="w-3 h-3"></lucide-icon> }
                            @if (event.status === 'absent') { <lucide-icon name="x" class="w-3 h-3"></lucide-icon> }
                            @if (event.status === 'holiday') { <lucide-icon name="info" class="w-3 h-3"></lucide-icon> }
                            <span class="capitalize">{{ event.label || getVietnameseStatus(event.status) }}</span>
                         </div>
                      </div>
                   }
                </div>

                <!-- Add Event Hover Button -->
                <button class="absolute bottom-2 right-2 p-1.5 bg-white rounded-lg border border-slate-100 shadow-sm opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50">
                   <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>
                </button>
             </div>
           }
        </div>
      </div>

      <!-- Legend -->
      <div data-tutorial="att-legend" class="flex flex-wrap items-center gap-3 md:gap-6 px-2 md:px-4">
         <div class="flex items-center gap-1.5 md:gap-2">
           <div class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-500 shadow-sm"></div>
           <span class="text-[10px] md:text-xs font-bold text-slate-500">Đúng giờ</span>
         </div>
         <div class="flex items-center gap-1.5 md:gap-2">
           <div class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-amber-500 shadow-sm"></div>
           <span class="text-[10px] md:text-xs font-bold text-slate-500">Đi muộn</span>
         </div>
         <div class="flex items-center gap-1.5 md:gap-2">
           <div class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 shadow-sm"></div>
           <span class="text-[10px] md:text-xs font-bold text-slate-500">Vắng mặt</span>
         </div>
         <div class="flex items-center gap-1.5 md:gap-2">
           <div class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-blue-500 shadow-sm"></div>
           <span class="text-[10px] md:text-xs font-bold text-slate-500">Nghỉ phép</span>
         </div>
         <div class="flex items-center gap-1.5 md:gap-2">
           <div class="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-indigo-500 shadow-sm"></div>
           <span class="text-[10px] md:text-xs font-bold text-slate-500">Ngày lễ</span>
         </div>
      </div>
    </div>
  `
})
export class AttendanceComponent {
  api = inject(Api);
  auth = inject(AuthService);
  viewDate = signal(new Date());
  weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  employeeId = signal<number | string | undefined>(undefined);
  attendanceRecords = signal<any[]>([]);
  loadingAttendance = signal(false);

  constructor() {
    effect(() => {
      this.auth.currentUser();
      this.loadEmployeeByUserId();
    });
    effect(() => {
      this.employeeId();
      this.viewDate();
      this.loadAttendanceData();
    });
  }

  async loadEmployeeByUserId() {
    const user = this.auth.currentUser();
    if (!user) return;
    try {
      const resp = await this.api.invoke$Response(apiEmployeesMeGet$Json, {});
      const body = resp.body as any;
      if (body.isSuccess && body.result) {
        this.employeeId.set(body.result.id);
      }
    } catch {}
  }

  async loadAttendanceData() {
    const empId = this.employeeId();
    if (!empId) return;
    this.loadingAttendance.set(true);
    const date = this.viewDate();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const fromDate = firstDay.toISOString().substring(0, 10);
    const toDate = lastDay.toISOString().substring(0, 10);
    try {
      const resp = await this.api.invoke$Response(
        apiAttendancesGet$Json,
        { EmployeeId: Number(empId), FromDate: fromDate, ToDate: toDate, PageNumber: 1, PageSize: 100 }
      );
      const body = resp.body as any;
      if (body.isSuccess && Array.isArray(body.result)) {
        this.attendanceRecords.set(body.result);
      } else {
        this.attendanceRecords.set([]);
      }
    } catch {
      this.attendanceRecords.set([]);
    } finally {
      this.loadingAttendance.set(false);
    }
  }

  attendanceData = computed<AttendanceEvent[]>(() => {
    const records = this.attendanceRecords();
    return records.map((a: any) => {
      let status: AttendanceEvent['status'] = 'on-time';
      if (a.status === 'Late') status = 'late';
      else if (a.status === 'Absent') status = 'absent';
      const checkIn = a.checkInTime ? a.checkInTime.substring(0, 5) : undefined;
      const checkOut = a.checkOutTime ? a.checkOutTime.substring(0, 5) : undefined;
      return { date: a.workDate || '', checkIn, checkOut, status };
    });
  });

  getVietnameseStatus(status: string): string {
    const map: Record<string, string> = {
      'on-time': 'Đúng giờ',
      'late': 'Đi muộn',
      'absent': 'Vắng mặt',
      'leave': 'Nghỉ phép',
      'holiday': 'Ngày lễ'
    };
    return map[status] || status;
  }

  calendarDays = computed(() => {
    const date = this.viewDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const pad = (n: number) => String(n).padStart(2, '0');
    const days: { date: string, day: number, isCurrentMonth: boolean, isToday: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: `${year}-${pad(month)}-${pad(prevMonthLastDay - i)}`,
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: false
      });
    }

    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: `${year}-${pad(month + 1)}-${pad(i)}`,
        day: i,
        isCurrentMonth: true,
        isToday: today.getFullYear() === year && today.getMonth() === month && today.getDate() === i
      });
    }

    const totalSlots = 42;
    const nextMonthDays = totalSlots - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        date: `${year}-${pad(month + 2)}-${pad(i)}`,
        day: i,
        isCurrentMonth: false,
        isToday: false
      });
    }

    return days;
  });

  getEventForDate(dateStr: string): AttendanceEvent[] {
    return this.attendanceData().filter(e => e.date === dateStr);
  }

  workDays = computed(() => this.attendanceData().filter(e => e.status === 'on-time').length);
  lateDays = computed(() => this.attendanceData().filter(e => e.status === 'late').length);
  leaveDays = computed(() => this.attendanceData().filter(e => e.status === 'leave').length);

  changeMonth(delta: number) {
    const current = this.viewDate();
    this.viewDate.set(new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  goToToday() {
    this.viewDate.set(new Date());
  }
}
