import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            sessionId: null,
            isAuthenticated: false,
            rememberMe: false,
            inactivityTimeout: 30, // minutes
            lastActivity: null,

            login: (token, user, sessionId, rememberMe = false, inactivityTimeout = 30) => {
                set({
                    token,
                    user,
                    sessionId,
                    isAuthenticated: true,
                    rememberMe,
                    inactivityTimeout,
                    lastActivity: Date.now(),
                });
            },

            logout: () => {
                set({
                    token: null,
                    user: null,
                    sessionId: null,
                    isAuthenticated: false,
                    rememberMe: false,
                    lastActivity: null,
                });
            },

            updateActivity: () => {
                set({ lastActivity: Date.now() });
            },

            getToken: () => get().token,

            isAdmin: () => get().user?.role === 'admin',

            isInactive: () => {
                const { lastActivity, inactivityTimeout, rememberMe } = get();
                if (rememberMe) return false; // No timeout for remember me
                if (!lastActivity) return false;
                const elapsed = (Date.now() - lastActivity) / 1000 / 60; // minutes
                return elapsed >= inactivityTimeout;
            },

            getTimeUntilTimeout: () => {
                const { lastActivity, inactivityTimeout, rememberMe } = get();
                if (rememberMe) return Infinity;
                if (!lastActivity) return inactivityTimeout;
                const elapsed = (Date.now() - lastActivity) / 1000 / 60;
                return Math.max(0, inactivityTimeout - elapsed);
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);
