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
    tutorialId: 'admin-organization',
    title: 'Hướng dẫn cơ cấu tổ chức',
    role: 'admin',
    route: '/admin/organization',
    steps: [
      {
        stepId: 'org-stats',
        title: 'Thống kê tổng quan',
        content: 'Xem tổng quan số phòng ban, nhân sự và nhân viên đang hoạt động.',
        targetSelector: '[data-tutorial="org-stats"]',
        placement: 'bottom',
      },
      {
        stepId: 'org-list',
        title: 'Danh sách phòng ban',
        content: 'Mỗi thẻ là một phòng ban với thông tin trưởng phòng, mô tả và số thành viên.',
        targetSelector: '[data-tutorial="org-list"]',
        placement: 'top',
      },
      {
        stepId: 'org-team',
        title: 'Xem nhóm',
        content: 'Nhấn để xem danh sách thành viên và quản lý trưởng phòng.',
        targetSelector: '[data-tutorial="org-team"]',
        placement: 'top',
      },
      {
        stepId: 'org-add',
        title: 'Thêm phòng ban mới',
        content: 'Nhấn nút này để tạo phòng ban mới.',
        targetSelector: '[data-tutorial="org-add"]',
        placement: 'left',
      },
    ],
  },
  {
    tutorialId: 'admin-attendance',
    title: 'Hướng dẫn quản lý chấm công',
    role: 'admin',
    route: '/admin/attendance',
    steps: [
      {
        stepId: 'attendance-timekeeping',
        title: 'Chấm công thủ công',
        content: 'Nhấn để mở chức năng chấm công thủ công cho nhiều nhân viên cùng lúc.',
        targetSelector: '[data-tutorial="attendance-timekeeping"]',
        placement: 'bottom',
      },
      {
        stepId: 'attendance-employee-picker',
        title: 'Chọn nhân viên',
        content: 'Nhấn để chọn nhân viên xem lịch chấm công chi tiết.',
        targetSelector: '[data-tutorial="attendance-employee-picker"]',
        placement: 'bottom',
      },
      {
        stepId: 'attendance-stats',
        title: 'Thống kê chấm công',
        content: 'Tổng quan số ngày công, đi muộn, nghỉ phép và vắng mặt trong tháng.',
        targetSelector: '[data-tutorial="attendance-stats"]',
        placement: 'bottom',
      },
      {
        stepId: 'attendance-calendar',
        title: 'Lịch chấm công',
        content: 'Xem chi tiết trạng thái chấm công từng ngày. Nhấn vào ô ngày để chỉnh sửa hoặc thêm bản ghi.',
        targetSelector: '[data-tutorial="attendance-calendar"]',
        placement: 'top',
      },
      {
        stepId: 'attendance-legend',
        title: 'Chú thích màu sắc',
        content: 'Mỗi màu sắc thể hiện một trạng thái chấm công khác nhau trong tháng.',
        targetSelector: '[data-tutorial="attendance-legend"]',
        placement: 'top',
      },
    ],
  },
  {
    tutorialId: 'admin-leave',
    title: 'Hướng dẫn duyệt nghỉ phép',
    role: 'admin',
    route: '/admin/leave',
    steps: [
      {
        stepId: 'leave-filter',
        title: 'Lọc đơn từ & trạng thái',
        content: 'Chọn nhân viên và bộ lọc trạng thái để tìm đơn nghỉ phép nhanh chóng.',
        targetSelector: '[data-tutorial="leave-filter"]',
        placement: 'bottom',
      },
      {
        stepId: 'leave-table',
        title: 'Danh sách đơn nghỉ phép',
        content: 'Xem thông tin chi tiết từng đơn bao gồm loại nghỉ, thời gian và lý do.',
        targetSelector: '[data-tutorial="leave-table"]',
        placement: 'top',
      },
      {
        stepId: 'leave-actions',
        title: 'Duyệt / Từ chối đơn',
        content: 'Nhấn nút tích xanh để duyệt đơn, nút X đỏ để từ chối kèm lý do.',
        targetSelector: '[data-tutorial="leave-actions"]',
        placement: 'left',
      },
    ],
  },
  {
    tutorialId: 'admin-employees',
    title: 'Hướng dẫn danh sách nhân viên',
    role: 'admin',
    route: '/admin/employees',
    steps: [
      {
        stepId: 'employee-filter',
        title: 'Tìm kiếm & lọc',
        content: 'Sử dụng thanh tìm kiếm và bộ lọc phòng ban để tìm nhân viên nhanh chóng.',
        targetSelector: '[data-tutorial="employee-filter"]',
        placement: 'bottom',
      },
      {
        stepId: 'employee-list',
        title: 'Danh sách nhân viên',
        content: 'Xem thông tin tóm tắt của từng nhân viên bao gồm tên, chức vụ, phòng ban, email và số điện thoại.',
        targetSelector: '[data-tutorial="employee-list"]',
        placement: 'top',
      },
      {
        stepId: 'employee-view-profile',
        title: 'Xem hồ sơ chi tiết',
        content: 'Nhấn nút này để xem chi tiết hồ sơ nhân viên, cấu hình lương và lịch sử công tác.',
        targetSelector: '[data-tutorial="employee-view-profile"]',
        placement: 'top',
      },
      {
        stepId: 'employee-add',
        title: 'Thêm nhân viên mới',
        content: 'Nhấn nút này để thêm nhân viên mới vào hệ thống.',
        targetSelector: '[data-tutorial="employee-add"]',
        placement: 'left',
      },
    ],
  },
  {
    tutorialId: 'admin-employee-detail',
    title: 'Hướng dẫn chi tiết nhân viên',
    role: 'admin',
    route: '/admin/employees/',
    steps: [
      {
        stepId: 'employee-detail-profile',
        title: 'Thông tin cá nhân',
        content: 'Xem thông tin cơ bản của nhân viên bao gồm ảnh đại diện, họ tên, chức vụ, email và số điện thoại.',
        targetSelector: '[data-tutorial="employee-detail-profile"]',
        placement: 'bottom',
      },
      {
        stepId: 'employee-detail-experience',
        title: 'Kinh nghiệm & Chức vụ',
        content: 'Xem thông tin phòng ban, thâm niên và các thông tin công việc khác.',
        targetSelector: '[data-tutorial="employee-detail-experience"]',
        placement: 'top',
      },
      {
        stepId: 'employee-detail-salary',
        title: 'Cấu hình lương',
        content: 'Xem và chỉnh sửa cấu hình lương của nhân viên, bao gồm lương cơ bản, phụ cấp và thông tin ngân hàng.',
        targetSelector: '[data-tutorial="employee-detail-salary"]',
        placement: 'top',
      },
      {
        stepId: 'employee-detail-account',
        title: 'Tài khoản đăng nhập',
        content: 'Quản lý tài khoản đăng nhập hệ thống của nhân viên. Tạo mới hoặc đặt lại mật khẩu khi cần.',
        targetSelector: '[data-tutorial="employee-detail-account"]',
        placement: 'top',
      },
      {
        stepId: 'employee-detail-transfer',
        title: 'Lịch sử chuyển phòng',
        content: 'Theo dõi lịch sử chuyển phòng ban của nhân viên và thực hiện chuyển phòng mới.',
        targetSelector: '[data-tutorial="employee-detail-transfer"]',
        placement: 'top',
      },
    ],
  },
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
  {
    tutorialId: 'employee-dashboard',
    title: 'Hướng dẫn bảng điều khiển',
    role: 'employee',
    route: '/dashboard',
    steps: [
      {
        stepId: 'dash-greeting',
        title: 'Lời chào & thông tin',
        content: 'Xem lời chào và thông tin cá nhân cùng tỷ lệ chấm công trong tháng của bạn.',
        targetSelector: '[data-tutorial="dash-greeting"]',
        placement: 'bottom',
      },
      {
        stepId: 'dash-timekeeping',
        title: 'Chấm công nhanh',
        content: 'Nhấn vào đây để chấm công hàng ngày một cách nhanh chóng.',
        targetSelector: '[data-tutorial="dash-timekeeping"]',
        placement: 'left',
      },
      {
        stepId: 'dash-stats',
        title: 'Thống kê',
        content: 'Xem tổng quan các chỉ số chấm công quan trọng như ngày công, phút đi muộn, ngày nghỉ đã duyệt.',
        targetSelector: '[data-tutorial="dash-stats"]',
        placement: 'bottom',
      },
      {
        stepId: 'dash-events',
        title: 'Sự kiện sắp tới',
        content: 'Theo dõi các sự kiện và lịch công tác sắp tới của bạn.',
        targetSelector: '[data-tutorial="dash-events"]',
        placement: 'top',
      },
    ],
  },
  {
    tutorialId: 'employee-attendance',
    title: 'Hướng dẫn chấm công',
    role: 'employee',
    route: '/attendance',
    steps: [
      {
        stepId: 'att-header',
        title: 'Lịch làm việc',
        content: 'Xem lịch chấm công hàng tháng của bạn với trạng thái chi tiết từng ngày.',
        targetSelector: '[data-tutorial="att-header"]',
        placement: 'bottom',
      },
      {
        stepId: 'att-nav',
        title: 'Điều hướng tháng',
        content: 'Chuyển qua lại giữa các tháng hoặc nhấn "Hôm nay" để quay về tháng hiện tại.',
        targetSelector: '[data-tutorial="att-nav"]',
        placement: 'bottom',
      },
      {
        stepId: 'att-stats',
        title: 'Thống kê chấm công',
        content: 'Tổng quan số ngày công, đi muộn, nghỉ phép và giờ làm việc trong tháng.',
        targetSelector: '[data-tutorial="att-stats"]',
        placement: 'bottom',
      },
      {
        stepId: 'att-calendar',
        title: 'Lịch chấm công',
        content: 'Xem chi tiết trạng thái từng ngày. Mỗi màu sắc thể hiện một trạng thái khác nhau.',
        targetSelector: '[data-tutorial="att-calendar"]',
        placement: 'top',
      },
      {
        stepId: 'att-legend',
        title: 'Chú thích',
        content: 'Tìm hiểu ý nghĩa các màu sắc hiển thị trên lịch chấm công.',
        targetSelector: '[data-tutorial="att-legend"]',
        placement: 'top',
      },
    ],
  },
  {
    tutorialId: 'employee-leave-requests',
    title: 'Hướng dẫn nghỉ phép',
    role: 'employee',
    route: '/leave-requests',
    steps: [
      {
        stepId: 'lr-header',
        title: 'Yêu cầu nghỉ phép',
        content: 'Gửi yêu cầu nghỉ phép và theo dõi trạng thái duyệt đơn.',
        targetSelector: '[data-tutorial="lr-header"]',
        placement: 'bottom',
      },
      {
        stepId: 'lr-form',
        title: 'Mẫu đơn nghỉ phép',
        content: 'Điền thông tin vào mẫu đơn để gửi yêu cầu nghỉ phép mới.',
        targetSelector: '[data-tutorial="lr-form"]',
        placement: 'bottom',
      },
      {
        stepId: 'lr-type',
        title: 'Loại nghỉ phép',
        content: 'Chọn loại nghỉ phép phù hợp: nghỉ phép năm, nghỉ ốm hoặc nghỉ không lương.',
        targetSelector: '[data-tutorial="lr-type"]',
        placement: 'bottom',
      },
      {
        stepId: 'lr-dates',
        title: 'Thời gian nghỉ',
        content: 'Chọn ngày bắt đầu và ngày kết thúc cho kỳ nghỉ của bạn.',
        targetSelector: '[data-tutorial="lr-dates"]',
        placement: 'top',
      },
      {
        stepId: 'lr-approver',
        title: 'Người duyệt',
        content: 'Chọn người quản lý sẽ duyệt đơn nghỉ phép của bạn.',
        targetSelector: '[data-tutorial="lr-approver"]',
        placement: 'top',
      },
      {
        stepId: 'lr-submit',
        title: 'Gửi đơn',
        content: 'Nhấn nút để gửi đơn nghỉ phép sau khi đã điền đầy đủ thông tin.',
        targetSelector: '[data-tutorial="lr-submit"]',
        placement: 'top',
      },
      {
        stepId: 'lr-history',
        title: 'Đơn gần đây',
        content: 'Theo dõi trạng thái các đơn nghỉ phép đã gửi tại đây.',
        targetSelector: '[data-tutorial="lr-history"]',
        placement: 'top',
      },
    ],
  },
  {
    tutorialId: 'employee-payroll',
    title: 'Hướng dẫn bảng lương',
    role: 'employee',
    route: '/payroll',
    steps: [
      {
        stepId: 'pay-header',
        title: 'Bảng lương',
        content: 'Theo dõi thu nhập hàng tháng và thông tin phiếu lương của bạn.',
        targetSelector: '[data-tutorial="pay-header"]',
        placement: 'bottom',
      },
      {
        stepId: 'pay-income',
        title: 'Thu nhập ròng',
        content: 'Xem thu nhập ròng, lương gộp và các khoản khấu trừ trong tháng.',
        targetSelector: '[data-tutorial="pay-income"]',
        placement: 'bottom',
      },
      {
        stepId: 'pay-bank',
        title: 'Thông tin ngân hàng',
        content: 'Xem thông tin tài khoản nhận lương do phòng Tài chính quản lý.',
        targetSelector: '[data-tutorial="pay-bank"]',
        placement: 'top',
      },
      {
        stepId: 'pay-filters',
        title: 'Bộ lọc',
        content: 'Dùng bộ lọc tháng và năm để tìm kiếm phiếu lương theo kỳ mong muốn.',
        targetSelector: '[data-tutorial="pay-filters"]',
        placement: 'bottom',
      },
      {
        stepId: 'pay-list',
        title: 'Lịch sử thanh toán',
        content: 'Danh sách phiếu lương các kỳ trước. Xem chi tiết hoặc tải về khi cần.',
        targetSelector: '[data-tutorial="pay-list"]',
        placement: 'top',
      },
    ],
  },
  {
    tutorialId: 'employee-organization',
    title: 'Hướng dẫn tổ chức',
    role: 'employee',
    route: '/organization',
    steps: [
      {
        stepId: 'org-header',
        title: 'Tổ chức',
        content: 'Quản lý phòng ban và khám phá thành viên trong nhóm.',
        targetSelector: '[data-tutorial="org-header"]',
        placement: 'bottom',
      },
      {
        stepId: 'org-tabs',
        title: 'Chuyển tab',
        content: 'Chuyển đổi giữa xem danh sách phòng ban và danh sách nhân viên.',
        targetSelector: '[data-tutorial="org-tabs"]',
        placement: 'bottom',
      },
      {
        stepId: 'org-search',
        title: 'Tìm kiếm',
        content: 'Tìm kiếm phòng ban hoặc nhân viên nhanh chóng bằng thanh tìm kiếm.',
        targetSelector: '[data-tutorial="org-search"]',
        placement: 'bottom',
      },
      {
        stepId: 'org-dept-list',
        title: 'Danh sách phòng ban',
        content: 'Xem thông tin các phòng ban, mã phòng ban và số lượng thành viên.',
        targetSelector: '[data-tutorial="org-dept-list"]',
        placement: 'top',
      },
      {
        stepId: 'org-emp-list',
        title: 'Danh sách nhân viên',
        content: 'Xem thông tin nhân viên bao gồm liên hệ, ngày sinh và ngày vào làm.',
        targetSelector: '[data-tutorial="org-emp-list"]',
        placement: 'top',
      },
    ],
  },
];
