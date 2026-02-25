import { create } from "zustand";

const STORAGE_KEY = "raa_user";

export type UserRole = "superadmin" | "user";

export interface AuthUser {
  userId: string;
  userName: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  hydrate: () => void;
}

const FIXED_USERS: Array<{
  username: string;
  password: string;
  user: AuthUser;
}> = [
  {
    username: "superadmin",
    password: "admin123",
    user: { userId: "SuperAdmin", userName: "SuperAdmin", role: "superadmin" },
  },
  {
    username: "user1",
    password: "user123",
    user: { userId: "user1", userName: "user1", role: "user" },
  },
  {
    username: "user2",
    password: "user123",
    user: { userId: "user2", userName: "user2", role: "user" },
  },
];

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (
      parsed?.userId &&
      parsed?.userName &&
      (parsed?.role === "superadmin" || parsed?.role === "user")
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: typeof window !== "undefined" ? loadStoredUser() : null,
  isAuthenticated: typeof window !== "undefined" ? !!loadStoredUser() : false,

  login(username: string, password: string) {
    const normalized = username.trim().toLowerCase();
    const entry = FIXED_USERS.find(
      (u) => u.username.toLowerCase() === normalized && u.password === password,
    );
    if (!entry) return false;
    const user = entry.user;
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
    set({ user, isAuthenticated: true });
    return true;
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      import("./useBlockStore").then((m) =>
        m.useBlockStore.getState().clearBlocked(),
      );
    }
    set({ user: null, isAuthenticated: false });
  },

  hydrate() {
    if (typeof window === "undefined") return;
    const user = loadStoredUser();
    set({ user, isAuthenticated: !!user });
  },
}));
