'use client';

import { create } from 'zustand';
import { api } from '@/lib/api/client';
import type { SessionUser } from '@/types/domain';

/**
 * Auth store. The access token lives in memory only (never localStorage) to
 * limit XSS token theft. The refresh token is stored in an httpOnly cookie
 * set by the backend — the browser sends it automatically on /auth/refresh
 * and /auth/logout requests. We never read or write it from JS.
 */
interface AuthState {
  user: SessionUser | null;
  accessToken: string | null;
  status: 'idle' | 'authenticating' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
  bootstrap: () => Promise<void>;
}

interface AccessTokenResponse {
  accessToken: string;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  status: 'idle',

  login: async (email, password) => {
    set({ status: 'authenticating' });
    // Backend sets the httpOnly refresh cookie; we only receive the access token.
    const { data } = await api.post<AccessTokenResponse>('/auth/login', { email, password });
    set({ accessToken: data.accessToken, status: 'authenticated' });
    const { data: me } = await api.get<SessionUser>('/users/me');
    set({ user: me });
  },

  logout: async () => {
    try {
      // Backend clears the httpOnly cookie via Set-Cookie on this request.
      await api.post('/auth/logout');
    } finally {
      set({ user: null, accessToken: null, status: 'unauthenticated' });
    }
  },

  /**
   * Exchanges the httpOnly refresh cookie for a new access token.
   * The browser sends the cookie automatically; no JS token handling needed.
   * Returns false on failure so the API client can surface the original 401.
   */
  refresh: async () => {
    try {
      const { data } = await api.post<AccessTokenResponse>('/auth/refresh');
      set({ accessToken: data.accessToken, status: 'authenticated' });
      return true;
    } catch {
      set({ user: null, accessToken: null, status: 'unauthenticated' });
      return false;
    }
  },

  bootstrap: async () => {
    const ok = await get().refresh();
    if (ok) {
      const { data: me } = await api.get<SessionUser>('/users/me');
      set({ user: me });
    } else {
      set({ status: 'unauthenticated' });
    }
  },
}));

/** Wire the API client's token getter + refresh to this store (call once). */
export function bindAuthToClient(): void {
  void import('@/lib/api/client').then(({ configureClient }) => {
    configureClient({
      getAccessToken: () => useAuth.getState().accessToken,
      refresh: () => useAuth.getState().refresh(),
    });
  });
}
