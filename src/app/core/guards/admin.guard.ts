import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const STORAGE_KEY = 'hrm_auth_user';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return router.parseUrl('/auth/login');
  }

  try {
    const user = JSON.parse(stored);
    const hasAdminRole = user.roles?.includes('Admin') ?? false;
    if (!hasAdminRole) {
      return router.parseUrl('/dashboard');
    }
  } catch {
    return router.parseUrl('/auth/login');
  }

  return true;
};
