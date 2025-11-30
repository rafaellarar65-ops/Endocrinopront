import { COOKIE_NAME } from '../shared/const';

export function getSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: false,
    sameSite: 'lax' as const,
    path: '/',
  };
}
