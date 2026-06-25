import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2, Clock, MapPin, Users, Save, Loader2, AlertCircle, Calendar as CalendarIcon } from 'lucide-angular';
import { MockDataService } from '../../core/services/mock-data.service';
import { EmployeePickerComponent } from '../../shared/employee-picker/employee-picker.component';
import { TutorialButtonComponent } from '../../shared/tutorial/tutorial-button.component';
import { Api } from '../../services/api-services/api';
import { apiEventsByCreatorEmployeeIdMonthYearGet$Json } from '../../services/api-services/fn/events/api-events-by-creator-employee-id-month-year-get-json';
import { apiEventsByInvitedEmployeeIdMonthYearGet$Json } from '../../services/api-services/fn/events/api-events-by-invited-employee-id-month-year-get-json';
import { apiEventsPost$Json } from '../../services/api-services/fn/events/api-events-post-json';
import { apiEventsPut$Json } from '../../services/api-services/fn/events/api-events-put-json';
import { apiEventsIdDelete$Json } from '../../services/api-services/fn/events/api-events-id-delete-json';
import { apiEmployeesMeGet$Json } from '../../services/api-services/fn/employees/api-employees-me-get-json';
import { apiEventParticipantsUpdateParticipantsByEventPut$Json } from '../../services/api-services/fn/event-participants/api-event-participants-update-participants-by-event-put-json';
import { apiEventParticipantsParticipantsByEventEventIdGet$Json } from '../../services/api-services/fn/event-participants/api-event-participants-participants-by-event-event-id-get-json';
import { EventDto, UpdateParticipantsByEventDto } from '../../services/api-services/models';

const TYPE_COLORS: Record<string, string> = {
  Meeting: 'bg-blue-500',
  Deadline: 'bg-red-500',
  Task: 'bg-amber-500',
  Reminder: 'bg-purple-500',
  Event: 'bg-emerald-500',
};

const TYPE_BG: Record<string, string> = {
  Meeting: 'bg-blue-50 text-blue-700 border-blue-100',
  Deadline: 'bg-red-50 text-red-700 border-red-100',
  Task: 'bg-amber-50 text-amber-700 border-amber-100',
  Reminder: 'bg-purple-50 text-purple-700 border-purple-100',
  Event: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, EmployeePickerComponent, TutorialButtonComponent],
  template: `
    <div class="space-y-6 animate-in fade-in duration-700">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 class="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
          <lucide-icon name="calendar" class="w-8 h-8 text-indigo-600"></lucide-icon>
          Sự kiện
        </h1>
        <div class="flex items-center gap-3">
          <app-tutorial-button tutorialId="employee-calendar"></app-tutorial-button>
          <button data-tutorial="add-event" (click)="openAddModal()" class="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 text-sm">
          <lucide-icon name="plus" class="w-4 h-4"></lucide-icon>
            Thêm sự kiện
          </button>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div data-tutorial="calendar-nav" class="flex items-center gap-3">
          <button (click)="prevMonth()" class="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-soft">
            <lucide-icon name="chevron-left" class="w-4 h-4"></lucide-icon>
          </button>
          <h2 class="text-xl font-bold text-slate-900 min-w-[180px] text-center">{{ currentMonthLabel() }}</h2>
          <button (click)="nextMonth()" class="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-soft">
            <lucide-icon name="chevron-right" class="w-4 h-4"></lucide-icon>
          </button>
          <button (click)="goToday()" class="px-4 py-2 bg-slate-50 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-all">Hôm nay</button>
        </div>

        <div class="flex items-center gap-3 text-xs font-medium text-slate-500">
          @for (item of legendItems; track item.label) {
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full {{ item.color }}"></span>
              {{ item.label }}
            </span>
          }
        </div>
      </div>

      <div data-tutorial="event-toggles" class="flex items-center gap-2">
        <button (click)="showCreated.set(!showCreated())"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          [ngClass]="showCreated() ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-400 hover:text-slate-600'">
          <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
          Đã tạo
        </button>
        <button (click)="showInvited.set(!showInvited())"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
          [ngClass]="showInvited() ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400 hover:text-slate-600'">
          <span class="w-2 h-2 rounded-full bg-amber-500"></span>
          Được mời
        </button>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-16">
          <lucide-icon name="loader2" class="w-6 h-6 text-indigo-700 animate-spin"></lucide-icon>
          <span class="ml-2 text-slate-500 font-semibold">Đang tải...</span>
        </div>
      }

      @if (!loading()) {
        <div data-tutorial="calendar-grid" class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div class="grid grid-cols-7 border-b border-slate-50">
            @for (day of dayNames; track day) {
              <div class="px-3 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{{ day }}</div>
            }
          </div>

          @for (week of weeks(); track $index) {
            <div class="grid grid-cols-7 border-b border-slate-50 last:border-b-0">
              @for (day of week; track day.date) {
                <div class="min-h-[100px] p-2 border-r border-slate-50 last:border-r-0 cursor-pointer hover:bg-slate-50/50 transition-all"
                  [class.text-slate-300]="!day.isCurrentMonth"
                  [ngClass]="{'bg-slate-50/30': day.isToday}"
                  (click)="selectDate(day)">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-bold"
                      [ngClass]="{'text-indigo-600': day.isToday, 'text-slate-400': !day.isToday && day.isCurrentMonth, 'text-slate-300': !day.isCurrentMonth}">
                      {{ day.dayNum }}
                    </span>
                    @if (day.events.length > 0) {
                      <span class="text-[10px] font-bold text-slate-400">{{ day.events.length }}</span>
                    }
                  </div>
                  <div class="space-y-1">
                    @for (evt of day.events.slice(0, 3); track evt.id) {
                      <div (click)="$event.stopPropagation(); openEditModal(evt)"
                        class="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white truncate {{ getTypeColor(evt.eventType || evt.type) }} hover:opacity-80 transition-all cursor-pointer">
                        <span class="truncate">{{ evt.title }}</span>
                      </div>
                    }
                    @if (day.events.length > 3) {
                      <div class="text-[10px] font-bold text-slate-400 pl-1">+{{ day.events.length - 3 }} thêm</div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      @if (selectedDay()) {
        <div class="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-slate-900">Sự kiện ngày {{ selectedDay()!.dayNum }}/{{ currentMonth() + 1 }}/{{ currentYear() }}</h3>
            <button (click)="openAddModal(selectedDay()!)" class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
              <lucide-icon name="plus" class="w-3.5 h-3.5"></lucide-icon>
              Thêm
            </button>
          </div>
          @if (selectedDayEvents().length === 0) {
            <p class="text-sm text-slate-400 py-4 text-center">Không có sự kiện nào trong ngày này.</p>
          }
          <div class="space-y-2">
            @for (evt of selectedDayEvents(); track evt.id) {
              <div class="flex items-start gap-4 p-4 rounded-2xl border border-slate-50 hover:bg-slate-50/50 transition-all group">
                <div class="w-1 h-12 rounded-full flex-shrink-0 mt-0.5 {{ getTypeColor(evt.eventType || evt.type) }}"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <h4 class="font-bold text-sm text-slate-900">{{ evt.title }}</h4>
                      <span class="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-md border {{ getTypeBg(evt.eventType || evt.type) }}">{{ evt.eventType || evt.type }}</span>
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button (click)="openEditModal(evt)" class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <lucide-icon name="edit-2" class="w-3.5 h-3.5"></lucide-icon>
                      </button>
                      <button (click)="confirmDelete(evt)" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <lucide-icon name="trash-2" class="w-3.5 h-3.5"></lucide-icon>
                      </button>
                    </div>
                  </div>
                  <div class="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400">
                    @if (!evt.allDay) {
                      <span class="flex items-center gap-1">
                        <lucide-icon name="clock" class="w-3 h-3"></lucide-icon>
                        {{ evt.startTime || (evt.startDate | date:'HH:mm') }} - {{ evt.endTime || (evt.endDate | date:'HH:mm') }}
                      </span>
                    } @else {
                      <span class="text-xs font-medium text-slate-400">Cả ngày</span>
                    }
                    @if (evt.location) {
                      <span class="flex items-center gap-1">
                        <lucide-icon name="map-pin" class="w-3 h-3"></lucide-icon>
                        {{ evt.location }}
                      </span>
                    }
                    <span class="flex items-center gap-1">
                      <lucide-icon name="users" class="w-3 h-3"></lucide-icon>
                      {{ evt.participantIds?.length || 0 }} người
                    </span>
                  </div>
                  @if (evt.description) {
                    <p class="text-xs text-slate-500 mt-2">{{ evt.description }}</p>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (showModal()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div (click)="closeModal()" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
          <div class="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between p-6 pb-4 border-b border-slate-50">
              <h2 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                <lucide-icon name="calendar" class="w-5 h-5 text-indigo-600"></lucide-icon>
                {{ editId() ? 'Sửa sự kiện' : 'Thêm sự kiện' }}
              </h2>
              <button (click)="closeModal()" class="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                <lucide-icon name="x" class="w-5 h-5"></lucide-icon>
              </button>
            </div>
            <div class="p-6 space-y-4">
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Tiêu đề *</label>
                <input [(ngModel)]="form.title" type="text" placeholder="Nhập tiêu đề sự kiện..."
                  class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all outline-none">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="relative">
                  <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Loại</label>
                  <button (click)="showTypePicker.set(!showTypePicker())" type="button"
                    class="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 rounded-xl text-sm text-left transition-all">
                    <span>{{ typeLabels[form.eventType] || form.eventType }}</span>
                    <svg class="w-4 h-4 text-slate-400 transition-transform" [class.rotate-180]="showTypePicker()" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                  </button>
                  @if (showTypePicker()) {
                    <div class="absolute z-50 mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-100 py-1 overflow-hidden">
                      @for (item of typeOptions; track item.value) {
                        <button (click)="form.eventType = item.value; showTypePicker.set(false)"
                          class="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 transition-all"
                          [class.font-bold]="form.eventType === item.value"
                          [class.text-slate-900]="form.eventType === item.value"
                          [class.text-slate-500]="form.eventType !== item.value">
                          <span class="w-2 h-2 rounded-full {{ item.color }}"></span>
                          {{ item.label }}
                        </button>
                      }
                    </div>
                  }
                </div>
                <div>
                  <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Cả ngày</label>
                  <div class="flex items-center h-full pt-1">
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" [(ngModel)]="form.allDay" class="sr-only peer">
                      <div class="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Ngày *</label>
                <input [(ngModel)]="form.eventDate" type="date"
                  class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all outline-none">
              </div>
              @if (!form.allDay) {
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Giờ bắt đầu</label>
                    <input [(ngModel)]="form.startTime" type="time"
                      class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all outline-none">
                  </div>
                  <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Giờ kết thúc</label>
                    <input [(ngModel)]="form.endTime" type="time"
                      class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all outline-none">
                  </div>
                </div>
              }
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Địa điểm</label>
                <input [(ngModel)]="form.location" type="text" placeholder="Phòng họp, địa chỉ..."
                  class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all outline-none">
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Mô tả</label>
                <textarea [(ngModel)]="form.description" rows="3" placeholder="Mô tả chi tiết..."
                  class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-600/20 transition-all outline-none resize-none"></textarea>
              </div>
              <div>
                <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Người tham gia</label>
                <div class="flex flex-wrap gap-2 mb-2">
                  @for (pid of form.participantIds; track pid) {
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">
                      {{ getEmployeeName(pid) }}
                      <button (click)="removeParticipant(pid)" class="hover:text-red-500 transition-all">
                        <lucide-icon name="x" class="w-3 h-3"></lucide-icon>
                      </button>
                    </span>
                  }
                </div>
                <button (click)="showEmployeePicker.set(true)"
                  class="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm text-left flex items-center gap-2 hover:bg-slate-100 transition-all">
                  <lucide-icon name="users" class="w-4 h-4 text-slate-400"></lucide-icon>
                  <span class="text-slate-400">+ Thêm người tham gia...</span>
                </button>
                <app-employee-picker [(visible)]="showEmployeePicker" [multiple]="true"
                  [preSelectedIds]="form.participantIds"
                  (selectionConfirmed)="onParticipantsPicked($event)"></app-employee-picker>
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-50">
              <button (click)="closeModal()" class="px-6 py-2.5 font-bold text-slate-400 hover:text-slate-900 rounded-xl transition-all text-sm">Hủy</button>
              <button (click)="saveEvent()" [disabled]="saving() || !form.title"
                class="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 text-sm">
                @if (saving()) {
                  <lucide-icon name="loader2" class="w-4 h-4 animate-spin"></lucide-icon>
                } @else {
                  <lucide-icon name="save" class="w-4 h-4"></lucide-icon>
                }
                {{ editId() ? 'Lưu' : 'Thêm' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (deleteTarget()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div (click)="deleteTarget.set(null)" class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>
          <div class="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 p-6 animate-in zoom-in-95 duration-200">
            <div class="text-center">
              <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <lucide-icon name="alert-circle" class="w-7 h-7 text-red-500"></lucide-icon>
              </div>
              <h3 class="text-lg font-bold text-slate-900">Xóa sự kiện</h3>
              <p class="text-sm text-slate-500 mt-2">Bạn có chắc muốn xóa <strong>{{ deleteTarget()?.title }}</strong>?</p>
            </div>
            <div class="flex gap-3 mt-6">
              <button (click)="deleteTarget.set(null)" class="flex-1 px-4 py-2.5 font-bold text-slate-400 hover:text-slate-900 rounded-xl transition-all text-sm">Hủy</button>
              <button (click)="doDelete()" class="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 text-sm">Xóa</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CalendarComponent implements OnInit {
  mockService = inject(MockDataService);
  api = inject(Api);

  dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  legendItems = [
    { label: 'Họp', color: 'bg-blue-500' },
    { label: 'Deadline', color: 'bg-red-500' },
    { label: 'Công việc', color: 'bg-amber-500' },
    { label: 'Nhắc nhở', color: 'bg-purple-500' },
    { label: 'Sự kiện', color: 'bg-emerald-500' },
  ];

  events = computed(() => {
    const list: any[] = [];
    if (this.showCreated()) list.push(...this.createdEvents());
    if (this.showInvited()) list.push(...this.invitedEvents());
    return list.filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i);
  });
  createdEvents = signal<any[]>([]);
  invitedEvents = signal<any[]>([]);
  showCreated = signal(true);
  showInvited = signal(true);
  showTypePicker = signal(false);
  currentEmpId = signal(1);

  typeOptions = [
    { value: 'Meeting', label: 'Họp', color: 'bg-blue-500' },
    { value: 'Deadline', label: 'Deadline', color: 'bg-red-500' },
    { value: 'Task', label: 'Công việc', color: 'bg-amber-500' },
    { value: 'Reminder', label: 'Nhắc nhở', color: 'bg-purple-500' },
    { value: 'Event', label: 'Sự kiện', color: 'bg-emerald-500' },
  ];
  typeLabels: Record<string, string> = {
    Meeting: 'Họp',
    Deadline: 'Deadline',
    Task: 'Công việc',
    Reminder: 'Nhắc nhở',
    Event: 'Sự kiện',
  };
  participantNames: Record<number, string> = {};
  loading = signal(false);

  currentYear = signal(new Date().getFullYear());
  currentMonth = signal(new Date().getMonth());
  selectedDay = signal<any>(null);
  showModal = signal(false);
  showEmployeePicker = signal(false);
  editId = signal<number | null>(null);
  deleteTarget = signal<any>(null);
  saving = signal(false);

  form: any = {
    title: '',
    eventType: 'Meeting',
    eventDate: '',
    startTime: '08:00',
    endTime: '09:00',
    allDay: false,
    location: '',
    description: '',
    participantIds: [],
  };

  currentMonthLabel = computed(() => {
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    return `${months[this.currentMonth()]} ${this.currentYear()}`;
  });

  weeks = computed(() => {
    const year = this.currentYear();
    const month = this.currentMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const totalDays = lastDay.getDate();
    const todayStr = new Date().toISOString().substring(0, 10);

    const allDays: any[] = [];
    const prevMonthLast = new Date(year, month, 0).getDate();

    for (let i = startPad - 1; i >= 0; i--) {
      const d = prevMonthLast - i;
      allDays.push(this.makeDay(year, month - 1, d, false, todayStr));
    }
    for (let d = 1; d <= totalDays; d++) {
      allDays.push(this.makeDay(year, month, d, true, todayStr));
    }
    const remaining = 7 - (allDays.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        allDays.push(this.makeDay(year, month + 1, d, false, todayStr));
      }
    }

    const weeks: any[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }
    return weeks;
  });

  selectedDayEvents = computed(() => {
    const sel = this.selectedDay();
    if (!sel) return [];
    return this.events().filter((e: any) => {
      const eDate = (e.eventDate?.substring(0, 10)) || (e.startDate?.substring(0, 10));
      return eDate === sel.date;
    });
  });

  ngOnInit() {
    this.loadEvents();
  }

  async loadEvents() {
    this.loading.set(true);

    let empId = 1;
    try {
      const empResp = await this.api.invoke(apiEmployeesMeGet$Json, {});
      empId = (empResp as any)?.result?.id || 1;
    } catch {
      empId = this.mockService.employees().find(e => e.userId)?.id || 1;
    }
    this.currentEmpId.set(empId);

    try {
      const creatorResp = await this.api.invoke(apiEventsByCreatorEmployeeIdMonthYearGet$Json, { employeeId: empId, month: this.currentMonth() + 1, year: this.currentYear() });
      const invitedResp = await this.api.invoke(apiEventsByInvitedEmployeeIdMonthYearGet$Json, { employeeId: empId, month: this.currentMonth() + 1, year: this.currentYear() });

      let creatorList: any[] = [];
      let invitedList: any[] = [];

      if ((creatorResp as any)?.isSuccess && Array.isArray((creatorResp as any).result)) {
        creatorList = (creatorResp as any).result;
      }
      if ((invitedResp as any)?.isSuccess && Array.isArray((invitedResp as any).result)) {
        invitedList = (invitedResp as any).result;
      }

      this.createdEvents.set(creatorList);
      this.invitedEvents.set(invitedList);
    } catch {
      this.createdEvents.set(this.mockService.calendarEvents());
      this.invitedEvents.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private makeDay(year: number, month: number, day: number, isCurrentMonth: boolean, todayStr: string) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = this.events().filter((e: any) => {
      const eDate = (e.eventDate?.substring(0, 10)) || (e.startDate?.substring(0, 10));
      return eDate === dateStr;
    });
    return {
      date: dateStr,
      dayNum: day,
      isToday: dateStr === todayStr,
      isCurrentMonth,
      events: dayEvents,
    };
  }

  getTypeColor(type: string): string {
    return TYPE_COLORS[type] || 'bg-slate-500';
  }

  getTypeBg(type: string): string {
    return TYPE_BG[type] || 'bg-slate-50 text-slate-700 border-slate-100';
  }

  getEmployeeName(id: number): string {
    if (this.participantNames[id]) return this.participantNames[id];
    const emp = this.mockService.employees().find(e => e.id === id);
    return emp?.fullName || '#' + id;
  }

  prevMonth() {
    if (this.currentMonth() === 0) {
      this.currentMonth.set(11);
      this.currentYear.update(y => y - 1);
    } else {
      this.currentMonth.update(m => m - 1);
    }
    this.selectedDay.set(null);
    this.loadEvents();
  }

  nextMonth() {
    if (this.currentMonth() === 11) {
      this.currentMonth.set(0);
      this.currentYear.update(y => y + 1);
    } else {
      this.currentMonth.update(m => m + 1);
    }
    this.selectedDay.set(null);
    this.loadEvents();
  }

  goToday() {
    const now = new Date();
    this.currentYear.set(now.getFullYear());
    this.currentMonth.set(now.getMonth());
    this.selectedDay.set(null);
    this.loadEvents();
  }

  selectDate(day: any) {
    this.selectedDay.set(day);
  }

  openAddModal(day?: any) {
    this.editId.set(null);
    const dateObj = day ? new Date(day.date) : new Date();
    const dateStr = dateObj.toISOString().substring(0, 10);
    this.form = {
      title: '',
      eventType: 'Meeting',
      eventDate: dateStr,
      startTime: '08:00',
      endTime: '09:00',
      allDay: false,
      location: '',
      description: '',
      participantIds: [],
    };
    this.showModal.set(true);
  }

  async openEditModal(evt: any) {
    this.editId.set(evt.id);
    this.form = {
      title: evt.title,
      eventType: evt.eventType || evt.type,
      eventDate: evt.eventDate || evt.startDate?.substring(0, 10) || '',
      startTime: evt.allDay ? '08:00' : (evt.startTime || evt.startDate?.substring(11, 16) || '08:00'),
      endTime: evt.allDay ? '17:00' : (evt.endTime || evt.endDate?.substring(11, 16) || '17:00'),
      allDay: evt.allDay,
      location: evt.location || '',
      description: evt.description || '',
      participantIds: [],
    };
    this.showModal.set(true);

    try {
      const resp = await this.api.invoke(apiEventParticipantsParticipantsByEventEventIdGet$Json, { eventId: evt.id });
      if ((resp as any)?.isSuccess && Array.isArray((resp as any).result)) {
        this.form.participantIds = (resp as any).result.map((p: any) => p.id);
      }
    } catch {
      this.form.participantIds = evt.participantIds ? [...evt.participantIds] : [];
    }
  }

  closeModal() {
    this.showModal.set(false);
    this.showEmployeePicker.set(false);
    this.showTypePicker.set(false);
    this.editId.set(null);
  }

  onParticipantsPicked(ids: number[]) {
    this.form.participantIds = ids;
  }

  removeParticipant(empId: number) {
    this.form.participantIds = this.form.participantIds.filter((id: number) => id !== empId);
  }

  async saveEvent() {
    if (!this.form.title || !this.form.eventDate) return;
    this.saving.set(true);

    const body: EventDto = {
      title: this.form.title,
      eventType: this.form.eventType,
      eventDate: this.form.eventDate,
      description: this.form.description || null,
      creatorId: this.currentEmpId(),
    };

    if (!this.form.allDay) {
      body.startTime = this.form.startTime;
      body.endTime = this.form.endTime;
    }

    try {
      let eventId = this.editId();

      if (eventId) {
        body.id = eventId;
        await this.api.invoke(apiEventsPut$Json, { body });
      } else {
        const resp = await this.api.invoke(apiEventsPost$Json, { body });
        if (!(resp as any)?.isSuccess) {
          this.saving.set(false);
          return;
        }
        eventId = (resp as any).result?.id;
      }

      if (eventId && this.form.participantIds?.length) {
        const participantsBody: UpdateParticipantsByEventDto = {
          eventId,
          participantIds: this.form.participantIds,
        };
        await this.api.invoke(apiEventParticipantsUpdateParticipantsByEventPut$Json, { body: participantsBody });
      }

      this.closeModal();
      await this.loadEvents();
    } catch {
      this.closeModal();
    } finally {
      this.saving.set(false);
    }
  }

  confirmDelete(evt: any) {
    this.deleteTarget.set(evt);
  }

  async doDelete() {
    const target = this.deleteTarget();
    if (!target) return;

    try {
      await this.api.invoke(apiEventsIdDelete$Json, { id: target.id });
      this.deleteTarget.set(null);
      await this.loadEvents();
    } catch {
      this.deleteTarget.set(null);
    }
  }
}
