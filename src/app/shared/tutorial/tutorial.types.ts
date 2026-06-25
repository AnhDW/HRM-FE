import { UserRole } from '../../core/services/auth.service';

export interface TutorialStep {
  stepId: string;
  title: string;
  content: string;
  targetSelector: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  route?: string;
}

export interface Tutorial {
  tutorialId: string;
  title: string;
  role: UserRole;
  route: string;
  steps: TutorialStep[];
}

export interface TutorialState {
  completed: string[];
  dismissed: boolean;
}

export const STORAGE_KEY = 'hrm_tutorials';

export const TUTORIALS: Tutorial[] = [
  {
    tutorialId: 'employee-calendar',
    title: 'Hướng dẫn lịch công tác',
    role: 'employee',
    route: '/calendar',
    steps: [
      {
        stepId: 'add-event',
        title: 'Thêm sự kiện',
        content: 'Nhấn nút này để tạo sự kiện mới. Bạn có thể đặt tiêu đề, chọn loại, thêm người tham gia.',
        targetSelector: '[data-tutorial="add-event"]',
        placement: 'bottom',
      },
      {
        stepId: 'event-toggles',
        title: 'Lọc sự kiện',
        content: 'Dùng 2 nút này để ẩn/hiện sự kiện bạn đã tạo hoặc được mời.',
        targetSelector: '[data-tutorial="event-toggles"]',
        placement: 'bottom',
      },
      {
        stepId: 'calendar-nav',
        title: 'Điều hướng tháng',
        content: 'Chuyển qua lại giữa các tháng hoặc nhấn "Hôm nay" để về tháng hiện tại.',
        targetSelector: '[data-tutorial="calendar-nav"]',
        placement: 'bottom',
      },
      {
        stepId: 'calendar-grid',
        title: 'Xem chi tiết ngày',
        content: 'Click vào một ngày bất kỳ để xem danh sách sự kiện trong ngày đó.',
        targetSelector: '[data-tutorial="calendar-grid"]',
        placement: 'top',
      },
    ],
  },
  {
    tutorialId: 'admin-payslip',
    title: 'Hướng dẫn quản lý phiếu lương',
    role: 'admin',
    route: '/admin/payroll',
    steps: [
      {
        stepId: 'payslip-filter',
        title: 'Tìm kiếm & lọc',
        content: 'Dùng thanh tìm kiếm và bộ lọc tháng/năm/nhân viên để tìm phiếu lương nhanh chóng.',
        targetSelector: '[data-tutorial="payslip-filter"]',
        placement: 'bottom',
      },
      {
        stepId: 'payslip-list',
        title: 'Danh sách phiếu lương',
        content: 'Mỗi dòng là một phiếu lương. Nhấn vào biểu tượng hành động để xem, sửa hoặc xoá.',
        targetSelector: '[data-tutorial="payslip-list"]',
        placement: 'top',
      },
      {
        stepId: 'payslip-detail',
        title: 'Xem chi tiết chấm công',
        content: 'Nhấn vào biểu tượng này để xem chi tiết chấm công của nhân viên trong kỳ lương đó.',
        targetSelector: '[data-tutorial="payslip-detail"]',
        placement: 'left',
      },
      {
        stepId: 'payslip-edit',
        title: 'Chỉnh sửa phiếu lương',
        content: 'Nhấn vào biểu tượng này để chỉnh sửa thông tin phiếu lương.',
        targetSelector: '[data-tutorial="payslip-edit"]',
        placement: 'left',
      },
    ],
  },
];
