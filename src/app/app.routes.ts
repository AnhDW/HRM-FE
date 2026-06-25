import { Routes } from '@angular/router';
import { EmployeeLayoutComponent } from './core/layout/employee-layout.component';
import { AdminLayoutComponent } from './core/layout/admin-layout.component';
import { AuthLayoutComponent } from './core/layout/auth-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Auth Routes
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
      }
    ]
  },

  // Employee Routes
  {
    path: '',
    component: EmployeeLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent)
      },
      {
        path: 'leave-requests',
        loadComponent: () => import('./features/leave-requests/leave-requests.component').then(m => m.LeaveRequestsComponent)
      },
      {
        path: 'payroll',
        loadComponent: () => import('./features/payroll/payroll.component').then(m => m.PayrollComponent)
      },
      {
        path: 'calendar',
        loadComponent: () => import('./features/calendar/calendar.component').then(m => m.CalendarComponent)
      },
      {
        path: 'organization',
        loadComponent: () => import('./features/organization/organization.component').then(m => m.OrganizationComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  
  // Admin Routes
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'attendance', pathMatch: 'full' },
      {
        path: 'attendance',
        loadComponent: () => import('./features/admin-attendance/admin-attendance.component').then(m => m.AdminAttendanceComponent)
      },
      {
        path: 'leave',
        loadComponent: () => import('./features/admin-leave/admin-leave.component').then(m => m.AdminLeaveComponent)
      },
      {
        path: 'organization',
        loadComponent: () => import('./features/admin-organization/admin-organization.component').then(m => m.AdminOrganizationComponent)
      },
      {
        path: 'employees',
        loadComponent: () => import('./features/admin-employee/admin-employee.component').then(m => m.AdminEmployeeComponent)
      },
      {
        path: 'employees/:id',
        loadComponent: () => import('./features/admin-employee/admin-employee-detail.component').then(m => m.AdminEmployeeDetailComponent)
      },
      {
        path: 'payroll',
        loadComponent: () => import('./features/admin-payslip/admin-payslip.component').then(m => m.AdminPayslipComponent)
      },
    ]
  },
  
  { path: '**', redirectTo: 'auth/login' }
];
