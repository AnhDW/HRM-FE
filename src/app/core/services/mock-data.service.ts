export interface SearchFeature {
  name: string;
  route: string;
  icon: string;
  module: string;
  description: string;
  keywords: string[];
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'leave' | 'attendance' | 'payroll' | 'system' | 'employee';
  isRead: boolean;
  createdAt: string;
  employeeName?: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  type: 'Meeting' | 'Deadline' | 'Task' | 'Reminder' | 'Event';
  startDate: string;
  endDate: string;
  description?: string;
  location?: string;
  createdBy: number;
  participantIds: number[];
  allDay: boolean;
}

import { Injectable, signal, computed, inject } from '@angular/core';
import { 
  AttendanceDto, 
  AttendanceStatus, 
  LeaveType,
  EmployeeDto,
  DepartmentDto,
  PayslipDto,
  PayslipStatus,
} from '../../services/api-services/models';
import { Api } from '../../services/api-services/api';
import { apiDepartmentsGet$Json } from '../../services/api-services/fn/departments/api-departments-get-json';

interface SalaryConfigDto {
  id?: number;
  employeeId: number;
  baseSalary: number;
  allowances: number;
  bankAccount: string;
  bankName: string;
  taxCode: string;
}

interface EmployeeDepartmentHistoryDto {
  id?: number;
  employeeId: number;
  departmentId: number;
  isPrimary: boolean;
  startDate: string;
  endDate?: string;
}

type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected';

interface LeaveRequestDto {
  id?: number;
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveRequestStatus;
  approvedBy?: number;
  rejectionReason?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  private api = inject(Api);

  workDaysThisMonth = signal(18);
  totalWorkDays = signal(22);

  apiDepartmentsLoading = signal(false);
  apiDepartmentsLoaded = false;

  departments = signal<DepartmentDto[]>([
    {
      id: 1,
      managerId: 1,
      name: 'Phòng Kỹ thuật',
      description: 'Phụ trách phát triển và bảo trì hệ thống phần mềm nội bộ'
    },
    {
      id: 2,
      managerId: 2,
      name: 'Phòng Nhân sự',
      description: 'Quản lý tuyển dụng, đào tạo và các chế độ phúc lợi cho nhân viên'
    },
    {
      id: 3,
      managerId: 4,
      name: 'Phòng Kế toán',
      description: 'Phụ trách hạch toán, báo cáo tài chính và quyết toán thuế'
    },
    {
      id: 4,
      managerId: 5,
      name: 'Phòng Kinh doanh',
      description: 'Tìm kiếm khách hàng và phát triển thị trường'
    }
  ]);

  employees = signal<any[]>([
    { id: 1, userId: null, fullName: 'Nguyễn Văn An', email: 'an.nguyen@company.com', phone: '0901234567', dateOfBirth: '1990-05-15', hireDate: '2023-03-15', position: 'Trưởng phòng Kỹ thuật', departmentId: 1, status: 'Active', transferHistory: [{ date: '2023-03-15', from: 'None', to: 'Phòng Kỹ thuật', reason: 'Tuyển dụng mới' }, { date: '2024-06-01', from: 'Phòng Kỹ thuật', to: 'Phòng Kỹ thuật', reason: 'Thăng chức Trưởng phòng' }] },
    { id: 2, userId: null, fullName: 'Trần Thị Bình', email: 'binh.tran@company.com', phone: '0902345678', dateOfBirth: '1993-08-22', hireDate: '2024-01-10', position: 'Trưởng phòng Nhân sự', departmentId: 2, status: 'Active', transferHistory: [{ date: '2024-01-10', from: 'None', to: 'Phòng Nhân sự', reason: 'Tuyển dụng mới' }] },
    { id: 3, userId: null, fullName: 'Lê Hoàng Cường', email: 'cuong.le@company.com', phone: '0903456789', dateOfBirth: '1991-11-10', hireDate: '2023-08-01', position: 'Kỹ sư phần mềm', departmentId: 1, status: 'Active', transferHistory: [{ date: '2023-08-01', from: 'None', to: 'Phòng Kỹ thuật', reason: 'Tuyển dụng mới' }] },
    { id: 4, userId: null, fullName: 'Phạm Minh Dung', email: 'dung.pham@company.com', phone: '0904567890', dateOfBirth: '1995-02-28', hireDate: '2025-05-20', position: 'Trưởng phòng Kế toán', departmentId: 3, status: 'Active', transferHistory: [{ date: '2025-05-20', from: 'None', to: 'Phòng Kế toán', reason: 'Tuyển dụng mới' }] },
    { id: 5, userId: null, fullName: 'Huỳnh Ngọc Em', email: 'em.huynh@company.com', phone: '0905678901', dateOfBirth: '1996-07-14', hireDate: '2024-10-01', position: 'Trưởng phòng Kinh doanh', departmentId: 4, status: 'Active', transferHistory: [{ date: '2024-10-01', from: 'None', to: 'Phòng Kinh doanh', reason: 'Tuyển dụng mới' }] },
    { id: 6, userId: null, fullName: 'Đặng Thị Mai', email: 'mai.dang@company.com', phone: '0906789012', dateOfBirth: '1992-03-18', hireDate: '2024-06-01', position: 'Chuyên viên nhân sự', departmentId: 2, status: 'Active', transferHistory: [{ date: '2024-06-01', from: 'None', to: 'Phòng Nhân sự', reason: 'Tuyển dụng mới' }] },
    { id: 7, userId: null, fullName: 'Võ Hoàng Nam', email: 'nam.vo@company.com', phone: '0907890123', dateOfBirth: '1988-09-05', hireDate: '2022-11-01', position: 'Kỹ sư phần mềm cao cấp', departmentId: 1, status: 'Active', transferHistory: [{ date: '2022-11-01', from: 'None', to: 'Phòng Kỹ thuật', reason: 'Tuyển dụng mới' }, { date: '2024-03-01', from: 'Phòng Kỹ thuật', to: 'Phòng Kỹ thuật', reason: 'Thăng chức Kỹ sư cao cấp' }] },
    { id: 8, userId: null, fullName: 'Bùi Thanh Thảo', email: 'thao.bui@company.com', phone: '0908901234', dateOfBirth: '1994-12-20', hireDate: '2025-02-15', position: 'Chuyên viên kế toán', departmentId: 3, status: 'Active', transferHistory: [{ date: '2025-02-15', from: 'None', to: 'Phòng Kế toán', reason: 'Tuyển dụng mới' }] },
    { id: 9, userId: null, fullName: 'Lý Minh Tuấn', email: 'tuan.ly@company.com', phone: '0909012345', dateOfBirth: '1991-07-30', hireDate: '2024-08-01', position: 'Chuyên viên kinh doanh', departmentId: 4, status: 'Active', transferHistory: [{ date: '2024-08-01', from: 'None', to: 'Phòng Kinh doanh', reason: 'Tuyển dụng mới' }] },
    { id: 10, userId: null, fullName: 'Dương Thị Lan', email: 'lan.duong@company.com', phone: '0910123456', dateOfBirth: '1995-04-12', hireDate: '2025-01-10', position: 'Nhân viên hành chính', departmentId: 2, status: 'Active', transferHistory: [{ date: '2025-01-10', from: 'None', to: 'Phòng Nhân sự', reason: 'Tuyển dụng mới' }] },
    { id: 11, userId: null, fullName: 'Mai Văn Phúc', email: 'phuc.mai@company.com', phone: '0911234567', dateOfBirth: '1993-11-08', hireDate: '2024-04-15', position: 'Kỹ sư DevOps', departmentId: 1, status: 'Active', transferHistory: [{ date: '2024-04-15', from: 'None', to: 'Phòng Kỹ thuật', reason: 'Tuyển dụng mới' }] },
    { id: 12, userId: null, fullName: 'Hoàng Thị Hạnh', email: 'hanh.hoang@company.com', phone: '0912345678', dateOfBirth: '1990-06-25', hireDate: '2023-05-20', position: 'Kế toán trưởng', departmentId: 3, status: 'Active', transferHistory: [{ date: '2023-05-20', from: 'None', to: 'Phòng Kế toán', reason: 'Tuyển dụng mới' }] },
    { id: 13, userId: null, fullName: 'Ngô Văn Hùng', email: 'hung.ngo@company.com', phone: '0913456789', dateOfBirth: '1987-02-14', hireDate: '2022-06-01', position: 'Trưởng nhóm kinh doanh', departmentId: 4, status: 'Active', transferHistory: [{ date: '2022-06-01', from: 'None', to: 'Phòng Kinh doanh', reason: 'Tuyển dụng mới' }, { date: '2024-01-15', from: 'Phòng Kinh doanh', to: 'Phòng Kinh doanh', reason: 'Thăng chức Trưởng nhóm' }] },
    { id: 14, userId: null, fullName: 'Lâm Thị Kiều', email: 'kieu.lam@company.com', phone: '0914567890', dateOfBirth: '1996-09-30', hireDate: '2025-03-01', position: 'Chuyên viên nhân sự', departmentId: 2, status: 'Active', transferHistory: [{ date: '2025-03-01', from: 'None', to: 'Phòng Nhân sự', reason: 'Tuyển dụng mới' }] },
    { id: 15, userId: null, fullName: 'Trịnh Quốc Bảo', email: 'bao.trinh@company.com', phone: '0915678901', dateOfBirth: '1989-08-19', hireDate: '2023-10-01', position: 'Kỹ sư QA', departmentId: 1, status: 'Active', transferHistory: [{ date: '2023-10-01', from: 'None', to: 'Phòng Kỹ thuật', reason: 'Tuyển dụng mới' }] },
    { id: 16, userId: null, fullName: 'Phan Thị Hồng', email: 'hong.phan@company.com', phone: '0916789012', dateOfBirth: '1992-12-05', hireDate: '2024-09-01', position: 'Chuyên viên kinh doanh', departmentId: 4, status: 'Active', transferHistory: [{ date: '2024-09-01', from: 'None', to: 'Phòng Kinh doanh', reason: 'Tuyển dụng mới' }] },
    { id: 17, userId: null, fullName: 'Tạ Minh Quân', email: 'quan.ta@company.com', phone: '0917890123', dateOfBirth: '1994-01-22', hireDate: '2025-06-01', position: 'Trợ lý kế toán', departmentId: 3, status: 'Active', transferHistory: [{ date: '2025-06-01', from: 'None', to: 'Phòng Kế toán', reason: 'Tuyển dụng mới' }] },
    { id: 18, userId: null, fullName: 'Đỗ Thị Ngọc', email: 'ngoc.do@company.com', phone: '0918901234', dateOfBirth: '1997-05-10', hireDate: '2025-04-15', position: 'Nhân viên hành chính', departmentId: 2, status: 'Active', transferHistory: [{ date: '2025-04-15', from: 'None', to: 'Phòng Nhân sự', reason: 'Tuyển dụng mới' }] },
    { id: 19, userId: null, fullName: 'Hồ Văn Đạt', email: 'dat.ho@company.com', phone: '0919012345', dateOfBirth: '1993-10-15', hireDate: '2024-11-01', position: 'Chuyên viên kinh doanh', departmentId: 4, status: 'Active', transferHistory: [{ date: '2024-11-01', from: 'None', to: 'Phòng Kinh doanh', reason: 'Tuyển dụng mới' }] },
    { id: 20, userId: null, fullName: 'Cao Thị Tuyết', email: 'tuyet.cao@company.com', phone: '0920123456', dateOfBirth: '1991-01-05', hireDate: '2023-09-01', position: 'Kỹ sư phần mềm', departmentId: 1, status: 'Active', transferHistory: [{ date: '2023-09-01', from: 'None', to: 'Phòng Kỹ thuật', reason: 'Tuyển dụng mới' }] },
    { id: 21, userId: null, fullName: 'Lương Thị Mai', email: 'mai.luong@company.com', phone: '0921234567', dateOfBirth: '1995-07-18', hireDate: '2025-05-05', position: 'Chuyên viên kế toán', departmentId: 3, status: 'Active', transferHistory: [{ date: '2025-05-05', from: 'None', to: 'Phòng Kế toán', reason: 'Tuyển dụng mới' }] },
    { id: 22, userId: null, fullName: 'Trương Văn Hải', email: 'hai.truong@company.com', phone: '0922345678', dateOfBirth: '1990-04-25', hireDate: '2024-02-01', position: 'Chuyên viên nhân sự', departmentId: 2, status: 'Active', transferHistory: [{ date: '2024-02-01', from: 'None', to: 'Phòng Nhân sự', reason: 'Tuyển dụng mới' }] },
    { id: 23, userId: null, fullName: 'Kiều Thị Thu', email: 'thu.kieu@company.com', phone: '0923456789', dateOfBirth: '1996-11-30', hireDate: '2025-06-15', position: 'Chuyên viên kinh doanh', departmentId: 4, status: 'Active', transferHistory: [{ date: '2025-06-15', from: 'None', to: 'Phòng Kinh doanh', reason: 'Tuyển dụng mới' }] },
    { id: 24, userId: null, fullName: 'Đinh Văn Long', email: 'long.dinh@company.com', phone: '0924567890', dateOfBirth: '1992-08-12', hireDate: '2024-07-01', position: 'Kỹ sư phần mềm', departmentId: 1, status: 'Active', transferHistory: [{ date: '2024-07-01', from: 'None', to: 'Phòng Kỹ thuật', reason: 'Tuyển dụng mới' }] },
    { id: 25, userId: null, fullName: 'Vương Thị Kim', email: 'kim.vuong@company.com', phone: '0925678901', dateOfBirth: '1993-03-28', hireDate: '2025-01-20', position: 'Trợ lý kế toán', departmentId: 3, status: 'Active', transferHistory: [{ date: '2025-01-20', from: 'None', to: 'Phòng Kế toán', reason: 'Tuyển dụng mới' }] }
  ]);

  salaryConfigs = signal<SalaryConfigDto[]>([
    { id: 1, employeeId: 1, baseSalary: 25000000, allowances: 5000000, bankAccount: '1234567890', bankName: 'Vietcombank', taxCode: 'TAX001' },
    { id: 2, employeeId: 2, baseSalary: 15000000, allowances: 3000000, bankAccount: '1234567891', bankName: 'Techcombank', taxCode: 'TAX002' },
    { id: 3, employeeId: 3, baseSalary: 20000000, allowances: 4000000, bankAccount: '1234567892', bankName: 'BIDV', taxCode: 'TAX003' },
    { id: 4, employeeId: 4, baseSalary: 12000000, allowances: 2000000, bankAccount: '1234567893', bankName: 'Agribank', taxCode: 'TAX004' },
    { id: 5, employeeId: 5, baseSalary: 18000000, allowances: 3500000, bankAccount: '1234567894', bankName: 'Vietinbank', taxCode: 'TAX005' },
    { id: 6, employeeId: 6, baseSalary: 11000000, allowances: 2000000, bankAccount: '1234567895', bankName: 'MB Bank', taxCode: 'TAX006' },
    { id: 7, employeeId: 7, baseSalary: 22000000, allowances: 5000000, bankAccount: '1234567896', bankName: 'ACB', taxCode: 'TAX007' },
    { id: 8, employeeId: 8, baseSalary: 10000000, allowances: 1500000, bankAccount: '1234567897', bankName: 'Sacombank', taxCode: 'TAX008' },
    { id: 9, employeeId: 9, baseSalary: 12000000, allowances: 2000000, bankAccount: '1234567898', bankName: 'Vietcombank', taxCode: 'TAX009' },
    { id: 10, employeeId: 10, baseSalary: 9000000, allowances: 1000000, bankAccount: '1234567899', bankName: 'TPBank', taxCode: 'TAX010' },
    { id: 11, employeeId: 11, baseSalary: 18000000, allowances: 4000000, bankAccount: '1234567801', bankName: 'VIB', taxCode: 'TAX011' },
    { id: 12, employeeId: 12, baseSalary: 16000000, allowances: 3000000, bankAccount: '1234567802', bankName: 'BIDV', taxCode: 'TAX012' },
    { id: 13, employeeId: 13, baseSalary: 15000000, allowances: 3000000, bankAccount: '1234567803', bankName: 'Techcombank', taxCode: 'TAX013' },
    { id: 14, employeeId: 14, baseSalary: 9500000, allowances: 1500000, bankAccount: '1234567804', bankName: 'Agribank', taxCode: 'TAX014' },
    { id: 15, employeeId: 15, baseSalary: 14000000, allowances: 2500000, bankAccount: '1234567805', bankName: 'Vietinbank', taxCode: 'TAX015' },
    { id: 16, employeeId: 16, baseSalary: 11000000, allowances: 2000000, bankAccount: '1234567806', bankName: 'MB Bank', taxCode: 'TAX016' },
    { id: 17, employeeId: 17, baseSalary: 8500000, allowances: 1000000, bankAccount: '1234567807', bankName: 'ACB', taxCode: 'TAX017' },
    { id: 18, employeeId: 18, baseSalary: 9000000, allowances: 1000000, bankAccount: '1234567808', bankName: 'Sacombank', taxCode: 'TAX018' },
    { id: 19, employeeId: 19, baseSalary: 12000000, allowances: 2000000, bankAccount: '1234567809', bankName: 'Vietcombank', taxCode: 'TAX019' },
    { id: 20, employeeId: 20, baseSalary: 15000000, allowances: 3000000, bankAccount: '1234567810', bankName: 'TPBank', taxCode: 'TAX020' },
    { id: 21, employeeId: 21, baseSalary: 10000000, allowances: 1500000, bankAccount: '1234567811', bankName: 'VIB', taxCode: 'TAX021' },
    { id: 22, employeeId: 22, baseSalary: 11000000, allowances: 2000000, bankAccount: '1234567812', bankName: 'BIDV', taxCode: 'TAX022' },
    { id: 23, employeeId: 23, baseSalary: 9500000, allowances: 1500000, bankAccount: '1234567813', bankName: 'Techcombank', taxCode: 'TAX023' },
    { id: 24, employeeId: 24, baseSalary: 14000000, allowances: 2500000, bankAccount: '1234567814', bankName: 'Agribank', taxCode: 'TAX024' },
    { id: 25, employeeId: 25, baseSalary: 8500000, allowances: 1000000, bankAccount: '1234567815', bankName: 'Vietinbank', taxCode: 'TAX025' }
  ]);

  employeeDepartmentHistories = signal<EmployeeDepartmentHistoryDto[]>([
    { id: 1, employeeId: 1, departmentId: 1, isPrimary: true, startDate: '2023-03-15', endDate: undefined },
    { id: 2, employeeId: 2, departmentId: 2, isPrimary: true, startDate: '2024-01-10', endDate: undefined },
    { id: 3, employeeId: 3, departmentId: 1, isPrimary: true, startDate: '2023-08-01', endDate: undefined },
    { id: 4, employeeId: 4, departmentId: 3, isPrimary: true, startDate: '2025-05-20', endDate: undefined },
    { id: 5, employeeId: 5, departmentId: 4, isPrimary: true, startDate: '2024-10-01', endDate: undefined }
  ]);

  leaveRequests = signal<LeaveRequestDto[]>([
    {
      id: 1,
      employeeId: 2,
      leaveType: 'Annual',
      startDate: '2026-06-15',
      endDate: '2026-06-17',
      reason: 'Nghỉ phép đi du lịch cùng gia đình',
      status: 'Pending',
      createdAt: '2026-06-01T09:30:00Z'
    },
    {
      id: 2,
      employeeId: 3,
      leaveType: 'Sick',
      startDate: '2026-05-10',
      endDate: '2026-05-11',
      reason: 'Bị sốt xuất huyết cần nghỉ điều trị',
      status: 'Approved',
      approvedBy: 1,
      createdAt: '2026-05-09T08:15:00Z'
    },
    {
      id: 3,
      employeeId: 5,
      leaveType: 'Unpaid',
      startDate: '2026-04-20',
      endDate: '2026-04-22',
      reason: 'Cần nghỉ để giải quyết việc gia đình',
      status: 'Rejected',
      rejectionReason: 'Lý do nghỉ không chính đáng, thiếu giấy tờ xác nhận từ chính quyền địa phương',
      createdAt: '2026-04-16T14:00:00Z'
    }
  ]);

  payslips = signal<PayslipDto[]>([
    {
      id: 1,
      employeeId: 1,
      month: 5,
      year: 2026,
      payDate: '2026-06-01',
      baseSalary: 25000000,
      allowances: 5000000,
      deductions: 4500000,
      totalPaid: 25500000,
      payslipStatus: 'Paid',
    },
    {
      id: 2,
      employeeId: 2,
      month: 5,
      year: 2026,
      payDate: '2026-06-01',
      baseSalary: 15000000,
      allowances: 3000000,
      deductions: 2700000,
      totalPaid: 15300000,
      payslipStatus: 'Paid',
    },
    {
      id: 3,
      employeeId: 3,
      month: 5,
      year: 2026,
      payDate: '2026-06-01',
      baseSalary: 20000000,
      allowances: 4000000,
      deductions: 3600000,
      totalPaid: 20400000,
      payslipStatus: 'Paid',
    },
    {
      id: 4,
      employeeId: 4,
      month: 5,
      year: 2026,
      payDate: '2026-06-01',
      baseSalary: 12000000,
      allowances: 2000000,
      deductions: 2100000,
      totalPaid: 11900000,
      payslipStatus: 'Paid',
    },
    {
      id: 5,
      employeeId: 5,
      month: 5,
      year: 2026,
      payDate: '2026-06-01',
      baseSalary: 18000000,
      allowances: 3500000,
      deductions: 3225000,
      totalPaid: 18275000,
      payslipStatus: 'Paid',
    }
  ]);

  attendances = signal<any[]>([
    { id: 1, employeeId: 1, payslipId: 1, workDate: '2026-05-18', checkInTime: '07:55:00', checkOutTime: '17:30:00', status: 'Present', lateMinutes: 0, earlyLeaveMinutes: 0, isOvertime: false, notes: undefined },
    { id: 2, employeeId: 1, payslipId: 1, workDate: '2026-05-19', checkInTime: '08:02:00', checkOutTime: '17:45:00', status: 'Present', lateMinutes: 0, earlyLeaveMinutes: 0, isOvertime: false, notes: undefined },
    { id: 3, employeeId: 1, payslipId: 1, workDate: '2026-05-20', checkInTime: '07:50:00', checkOutTime: '18:00:00', status: 'Present', lateMinutes: 0, earlyLeaveMinutes: 0, isOvertime: true, notes: 'Làm thêm giờ để hoàn thành dự án cấp bách' },
    { id: 4, employeeId: 2, payslipId: 2, workDate: '2026-05-18', checkInTime: '08:15:00', checkOutTime: '17:00:00', status: 'Present', lateMinutes: 0, earlyLeaveMinutes: 0, isOvertime: false, notes: undefined },
    { id: 5, employeeId: 2, payslipId: 2, workDate: '2026-05-19', checkInTime: '08:10:00', checkOutTime: '17:15:00', status: 'Present', lateMinutes: 0, earlyLeaveMinutes: 0, isOvertime: false, notes: undefined },
    { id: 6, employeeId: 2, payslipId: 2, workDate: '2026-05-20', checkInTime: '08:45:00', checkOutTime: '17:00:00', status: 'Late', lateMinutes: 15, earlyLeaveMinutes: 0, isOvertime: false, notes: 'Đi muộn do kẹt xe trên đường đi làm' },
    { id: 7, employeeId: 3, payslipId: 3, workDate: '2026-05-12', checkInTime: '08:00:00', checkOutTime: '17:30:00', status: 'Present', lateMinutes: 0, earlyLeaveMinutes: 0, isOvertime: false, notes: undefined },
    { id: 8, employeeId: 3, payslipId: 3, workDate: '2026-05-13', checkInTime: '07:55:00', checkOutTime: '17:00:00', status: 'Present', lateMinutes: 0, earlyLeaveMinutes: 0, isOvertime: false, notes: undefined },
    { id: 9, employeeId: 3, payslipId: 3, workDate: '2026-05-14', checkInTime: '08:05:00', checkOutTime: '18:30:00', status: 'Present', lateMinutes: 0, earlyLeaveMinutes: 0, isOvertime: true, notes: 'Xử lý sự cố hệ thống khẩn cấp' },
    { id: 10, employeeId: 4, payslipId: 4, workDate: '2026-05-18', checkInTime: '08:20:00', checkOutTime: '17:10:00', status: 'Present', lateMinutes: 0, earlyLeaveMinutes: 0, isOvertime: false, notes: undefined },
    { id: 11, employeeId: 4, payslipId: 4, workDate: '2026-05-19', checkInTime: '08:05:00', checkOutTime: '17:00:00', status: 'Present', lateMinutes: 0, earlyLeaveMinutes: 0, isOvertime: false, notes: undefined },
    { id: 12, employeeId: 4, payslipId: 4, workDate: '2026-05-20', checkInTime: '08:35:00', checkOutTime: '17:00:00', status: 'Late', lateMinutes: 5, earlyLeaveMinutes: 0, isOvertime: false, notes: 'Đi muộn 5 phút do tàu điện đến trễ' },
    { id: 13, employeeId: 5, payslipId: 5, workDate: '2026-05-18', checkInTime: '07:45:00', checkOutTime: '17:20:00', status: 'Present', lateMinutes: 0, earlyLeaveMinutes: 0, isOvertime: false, notes: undefined },
    { id: 14, employeeId: 5, payslipId: 5, workDate: '2026-05-19', checkInTime: '08:00:00', checkOutTime: '17:30:00', status: 'Present', lateMinutes: 0, earlyLeaveMinutes: 0, isOvertime: false, notes: undefined },
    { id: 15, employeeId: 5, payslipId: 5, workDate: '2026-05-20', checkInTime: '09:00:00', checkOutTime: '17:15:00', status: 'Late', lateMinutes: 30, earlyLeaveMinutes: 0, isOvertime: false, notes: 'Đi muộn do đưa con đi bệnh viện' }
  ]);

  timekeeping() {
    console.log('Timekeeping triggered');
  }

  async loadAllDepartments() {
    if (this.apiDepartmentsLoaded) return;
    this.apiDepartmentsLoading.set(true);
    try {
      let page = 1;
      let allItems: DepartmentDto[] = [];
      while (true) {
        const resp = await this.api.invoke$Response(apiDepartmentsGet$Json, {
          PageNumber: page,
          PageSize: 20
        });
        const paginationHeader = resp.headers.get('Pagination');
        let totalPages = 1;
        if (paginationHeader) {
          try { totalPages = JSON.parse(paginationHeader).totalPages || 1; } catch {}
        }
        const body = resp.body;
        if (body.isSuccess) {
          allItems = [...allItems, ...(body.result || [])];
        }
        if (page >= totalPages) break;
        page++;
      }
      if (allItems.length > 0) {
        this.departments.set(allItems);
      }
      this.apiDepartmentsLoaded = true;
    } catch {
      this.apiDepartmentsLoaded = false;
    } finally {
      this.apiDepartmentsLoading.set(false);
    }
  }

  features: SearchFeature[] = [
    { name: 'Tổng quan', route: '/dashboard', icon: 'layout-dashboard', module: 'employee', description: 'Dashboard tổng quan hoạt động hàng ngày', keywords: ['dashboard', 'home', 'trang chủ', 'tổng quan'] },
    { name: 'Chấm công', route: '/attendance', icon: 'calendar-check', module: 'employee', description: 'Quản lý chấm công cá nhân, lịch làm việc', keywords: ['chấm công', 'attendance', 'checkin', 'giờ', 'làm'] },
    { name: 'Nghỉ phép', route: '/leave-requests', icon: 'file-text', module: 'employee', description: 'Gửi yêu cầu nghỉ phép và theo dõi trạng thái', keywords: ['nghỉ', 'phép', 'leave', 'đơn', 'xin nghỉ'] },
    { name: 'Bảng lương', route: '/payroll', icon: 'wallet', module: 'employee', description: 'Theo dõi thu nhập tháng, phiếu lương', keywords: ['lương', 'payroll', 'thu nhập', 'lương tháng', 'bảng lương'] },
    { name: 'Tổ chức', route: '/organization', icon: 'users', module: 'employee', description: 'Xem sơ đồ tổ chức, phòng ban', keywords: ['tổ chức', 'organization', 'phòng ban', 'sơ đồ'] },
    { name: 'Hồ sơ cá nhân', route: '/profile', icon: 'user', module: 'employee', description: 'Thông tin cá nhân, kinh nghiệm làm việc', keywords: ['hồ sơ', 'profile', 'cá nhân', 'thông tin'] },
    { name: 'Cài đặt', route: '/settings', icon: 'settings', module: 'employee', description: 'Tùy chọn tài khoản, thông báo, hiển thị', keywords: ['cài đặt', 'settings', 'tùy chỉnh'] },
    { name: 'Quản lý chấm công', route: '/admin/attendance', icon: 'calendar-check', module: 'admin', description: 'Xem chi tiết chấm công theo nhân viên', keywords: ['admin', 'quản lý', 'chấm công', 'attendance'] },
    { name: 'Duyệt nghỉ phép', route: '/admin/leave', icon: 'check-square', module: 'admin', description: 'Duyệt/từ chối đơn nghỉ phép của nhân viên', keywords: ['admin', 'duyệt', 'nghỉ', 'phép', 'leave', 'đơn'] },
    { name: 'Quản lý nhân sự', route: '/admin/employees', icon: 'users', module: 'admin', description: 'Danh sách nhân viên, thêm mới, tìm kiếm', keywords: ['admin', 'nhân sự', 'employees', 'nhân viên'] },
    { name: 'Cơ cấu tổ chức', route: '/admin/organization', icon: 'building', module: 'admin', description: 'Quản lý phòng ban, nhóm, phân cấp', keywords: ['admin', 'tổ chức', 'organization', 'phòng ban'] },
    { name: 'Sự kiện', route: '/calendar', icon: 'calendar', module: 'employee', description: 'Xem lịch họp, sự kiện, deadline công việc', keywords: ['lịch', 'calendar', 'họp', 'sự kiện', 'deadline', 'công tác'] },
    { name: 'Quản lý lương', route: '/admin/payroll', icon: 'wallet', module: 'admin', description: 'Xem, sửa, xóa phiếu lương nhân viên', keywords: ['admin', 'lương', 'payroll', 'phiếu lương', 'quản lý lương'] },
    { name: 'Sự kiện', route: '/admin/calendar', icon: 'calendar', module: 'admin', description: 'Quản lý lịch họp, sự kiện công ty', keywords: ['admin', 'lịch', 'calendar', 'họp', 'sự kiện', 'công tác'] },
    { name: 'Trợ lý AI', route: '#ai-chat', icon: 'sparkles', module: 'employee', description: 'Mở chat bong bóng để được hỗ trợ về HRM', keywords: ['ai', 'chat', 'trợ lý', 'trợ giúp', 'hỏi đáp', 'câu hỏi'] },
    { name: 'Trợ lý AI', route: '#ai-chat', icon: 'sparkles', module: 'admin', description: 'Mở chat bong bóng để được hỗ trợ về HRM', keywords: ['admin', 'ai', 'chat', 'trợ lý', 'trợ giúp'] },
  ];

  notifications = signal<Notification[]>([
    { id: 1, title: 'Đơn nghỉ phép mới', message: 'Nguyễn Văn Anh vừa gửi đơn nghỉ phép 3 ngày từ 20/06 đến 22/06.', type: 'leave', isRead: false, createdAt: '2026-06-18T09:30:00', employeeName: 'Nguyễn Văn Anh' },
    { id: 2, title: 'Chấm công trễ', message: 'Trần Thị Bích đã chấm công lúc 09:15 hôm nay, trễ 15 phút.', type: 'attendance', isRead: false, createdAt: '2026-06-18T09:15:00', employeeName: 'Trần Thị Bích' },
    { id: 3, title: 'Bảng lương tháng 6', message: 'Bảng lương tháng 06/2026 đã được phát hành. Vui lòng kiểm tra.', type: 'payroll', isRead: false, createdAt: '2026-06-18T08:00:00' },
    { id: 4, title: 'Nhân viên mới', message: 'Lê Hoàng Cường đã được thêm vào phòng Kỹ thuật.', type: 'employee', isRead: true, createdAt: '2026-06-17T14:20:00', employeeName: 'Lê Hoàng Cường' },
    { id: 5, title: 'Phê duyệt đơn nghỉ', message: 'Đơn nghỉ phép của Phạm Minh Đức đã được phê duyệt.', type: 'leave', isRead: true, createdAt: '2026-06-17T10:00:00', employeeName: 'Phạm Minh Đức' },
    { id: 6, title: 'Cập nhật hệ thống', message: 'Hệ thống HRM sẽ được bảo trì vào lúc 02:00 ngày 20/06.', type: 'system', isRead: false, createdAt: '2026-06-16T16:00:00' },
  ]);

  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  markAsRead(id: number) {
    this.notifications.update(list =>
      list.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  }

  markAllAsRead() {
    this.notifications.update(list =>
      list.map(n => ({ ...n, isRead: true }))
    );
  }

  calendarEvents = signal<CalendarEvent[]>(this.generateMockEvents());

  private generateMockEvents(): CalendarEvent[] {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const day = (d: number, h = 8) => new Date(y, m, d, h, 0, 0).toISOString();
    const empId = 1;
    return [
      { id: 1, title: 'Họp định kỳ phòng Kỹ thuật', type: 'Meeting', startDate: day(2, 9), endDate: day(2, 10), description: 'Cập nhật tiến độ dự án Q2', location: 'Phòng họp A', createdBy: empId, participantIds: [1, 3, 7, 11], allDay: false },
      { id: 2, title: 'Deadline báo cáo tháng', type: 'Deadline', startDate: day(5), endDate: day(5), description: 'Nộp báo cáo tháng cho Ban Giám đốc', createdBy: empId, participantIds: [1, 2, 4, 5], allDay: true },
      { id: 3, title: 'Phỏng vấn ứng viên Backend', type: 'Meeting', startDate: day(7, 14), endDate: day(7, 15), location: 'Phòng họp B', createdBy: 2, participantIds: [2, 3], allDay: false },
      { id: 4, title: 'Training: Angular 19 mới', type: 'Event', startDate: day(10, 8), endDate: day(10, 12), location: 'Hội trường lớn', createdBy: empId, participantIds: [1, 3, 7, 11, 15, 20, 24], allDay: false },
      { id: 5, title: 'Họp với khách hàng', type: 'Meeting', startDate: day(12, 9), endDate: day(12, 11), description: 'Trình diễn phiên bản demo', location: 'VP khách hàng', createdBy: 5, participantIds: [5, 9, 13], allDay: false },
      { id: 6, title: 'Rà soát hợp đồng Q3', type: 'Task', startDate: day(14), endDate: day(16), description: 'Soạn thảo và rà soát hợp đồng quý 3', createdBy: 2, participantIds: [2, 6, 10], allDay: true },
      { id: 7, title: 'Sinh nhật công ty tháng 6', type: 'Event', startDate: day(18, 16), endDate: day(18, 18), location: 'Sảnh chính', createdBy: empId, participantIds: [1, 2, 3, 4, 5, 6, 7, 8], allDay: false },
      { id: 8, title: 'Đánh giá hiệu suất nhân viên', type: 'Task', startDate: day(20), endDate: day(22), createdBy: 2, participantIds: [2, 6, 10, 14, 18], allDay: true },
      { id: 9, title: 'Họp với đối tác', type: 'Meeting', startDate: day(22, 10), endDate: day(22, 11), location: 'Phòng họp C', createdBy: 5, participantIds: [5, 9], allDay: false },
      { id: 10, title: 'Bảo trì hệ thống định kỳ', type: 'Reminder', startDate: day(25, 14), endDate: day(25, 17), description: 'Cập nhật bảo mật và sao lưu dữ liệu', createdBy: empId, participantIds: [1, 3, 7], allDay: false },
      { id: 11, title: 'Họp toàn công ty', type: 'Event', startDate: day(28, 8), endDate: day(28, 10), location: 'Hội trường lớn', description: 'Sơ kết tháng 6 và kế hoạch tháng 7', createdBy: 2, participantIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], allDay: false },
      { id: 12, title: 'Chốt công tháng', type: 'Deadline', startDate: day(30), endDate: day(30), createdBy: empId, participantIds: [1, 2, 4], allDay: true },
    ];
  }

  addLeaveRequest(request: Partial<LeaveRequestDto>) {
    const newRequest: LeaveRequestDto = {
      id: this.leaveRequests().length + 1,
      employeeId: request.employeeId || 1,
      leaveType: request.leaveType || 'Annual',
      startDate: request.startDate || '',
      endDate: request.endDate || '',
      reason: request.reason || '',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      ...request
    } as LeaveRequestDto;

    this.leaveRequests.update(list => [newRequest, ...list]);
  }
}
