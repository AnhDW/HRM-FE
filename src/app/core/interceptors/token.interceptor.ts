import { HttpInterceptorFn } from '@angular/common/http';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const stored = localStorage.getItem('hrm_auth_user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      if (user.token) {
        const cloned = req.clone({
          setHeaders: { Authorization: `Bearer ${user.token}` }
        });
        return next(cloned);
      }
    } catch {
      // ignore
    }
  }
  return next(req);
};
