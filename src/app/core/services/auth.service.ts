import { Injectable, signal, computed, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LoginRequestDto } from '../../services/api-services/models/login-request-dto';
import { ResponseDto } from '../../services/api-services/models/response-dto';
import { environment } from '../../../environments/environment';

export type UserRole = 'employee' | 'admin';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  token: string;
  phoneNumber?: string;
  avatarUrl?: string;
  roles?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly STORAGE_KEY = 'hrm_auth_user';
  private readonly API_URL = environment.apiUrl;

  isLoggedIn = signal(false);
  currentUser = signal<AuthUser | null>(null);
  isSidebarOpen = signal(false);

  currentRole = computed<UserRole>(() => this.currentUser()?.role ?? 'employee');
  isAdmin = computed(() => this.currentRole() === 'admin');
  isEmployee = computed(() => this.currentRole() === 'employee');
  
  // Capability check: Can the user access admin features?
  canAccessAdmin = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    return user.roles?.includes('Admin') || user.role === 'admin';
  });

  constructor() {
    this.restoreSession();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.syncRoleFromRoute(event.urlAfterRedirects || event.url);
    });
  }

  private restoreSession() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored) as AuthUser;
        this.currentUser.set(user);
        this.isLoggedIn.set(true);
      } catch {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  private syncRoleFromRoute(url: string) {
    const current = this.currentUser();
    if (!current) return;

    if (url.startsWith('/admin')) {
      if (current.role !== 'admin' && current.roles?.includes('Admin')) {
        const updated: AuthUser = { ...current, role: 'admin' };
        this.currentUser.set(updated);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      }
    } else if (!url.startsWith('/auth')) {
      if (current.role !== 'employee') {
        const updated: AuthUser = { ...current, role: 'employee' };
        this.currentUser.set(updated);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      }
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!email || !password) {
      return { success: false, error: 'Vui lòng nhập email và mật khẩu.' };
    }

    try {
      const body: LoginRequestDto = { userName: email, password };
      const response = await firstValueFrom(
        this.http.post<ResponseDto>(`${this.API_URL}/api/Auth/login`, body)
      );

      if (!response.isSuccess) {
        return { success: false, error: response.message || 'Đăng nhập thất bại.' };
      }

      const result = response.result as { user?: { id: string; email: string; fullName: string; phoneNumber?: string; avatarUrl?: string; roles?: string[] }; token: string } | any;
      const userInfo = result?.user || result || {};
      const token = result?.token || '';

      const roles: string[] = userInfo?.roles || [];
      const role: UserRole = roles.includes('Admin') ? 'admin' : 'employee';

      const user: AuthUser = {
        id: userInfo.id || userInfo.userId || '',
        fullName: userInfo.fullName || userInfo.email || email,
        email: userInfo.email || email,
        role,
        token,
        phoneNumber: userInfo.phoneNumber,
        avatarUrl: userInfo.avatarUrl,
        roles,
      };

      this.currentUser.set(user);
      this.isLoggedIn.set(true);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));

      return { success: true };
    } catch (err: any) {
      const message = err.error?.message || err.message || 'Không thể kết nối đến máy chủ.';
      return { success: false, error: message };
    }
  }

  logout() {
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    localStorage.removeItem(this.STORAGE_KEY);
    this.router.navigateByUrl('/auth/login');
  }

  switchView(role: UserRole) {
    const current = this.currentUser();
    if (!current) return;

    const updated: AuthUser = { ...current, role };
    this.currentUser.set(updated);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));

    const target = role === 'admin' ? '/admin/leave' : '/dashboard';
    this.router.navigateByUrl(target);
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }
}
