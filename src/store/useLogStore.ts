import { create } from "zustand";
import { persistLog } from "../services/api";
import { SystemLog, UserSession } from "../types";
import { useApiErrorStore } from "./useApiErrorStore";
import { useMLStore } from "./useMLStore";

interface LogState {
  logs: SystemLog[];
  currentSession: UserSession;
  addLog: (log: Omit<SystemLog, "id" | "timestamp" | "session">) => void;
  updateSession: (sessionData: Partial<UserSession>) => void;
  trackUserInteraction: (
    element: HTMLElement,
    interactionType: "click" | "navigation" | "configuration",
  ) => void;
  updateGeolocation: (coords: {
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    country?: string;
  }) => void;
  updateIpAddress: (ip: string) => void;
  updateIpAddresses: (ips: { ipv4?: string; ipv6?: string }) => void;
}

const INACTIVITY_THRESHOLD = 5 * 60 * 1000;

const getCurrentNetworkInfo = (): SystemLog["origin"]["network"] => {
  const connection = (
    navigator as unknown as {
      connection?: { type?: string; downlink?: number; rtt?: number };
    }
  ).connection;

  if (!connection) {
    return { type: "Não disponível", speed: "Não disponível", latency: 0 };
  }

  return {
    type: connection.type || "Não disponível",
    speed: connection.downlink
      ? `${connection.downlink} Mbps`
      : "Não disponível",
    latency: connection.rtt || 0,
  };
};

export const useLogStore = create<LogState>((set, get) => {
  let lastActivityTime = new Date();

  const updateLastActivity = () => {
    const currentTime = new Date();
    const inactivityTime = currentTime.getTime() - lastActivityTime.getTime();
    lastActivityTime = currentTime;

    if (inactivityTime >= INACTIVITY_THRESHOLD) {
      const state = get();
      state.addLog({
        userName: state.currentSession.userName || "Sistema",
        userId: state.currentSession.userId || "system",
        accessLevel: "system",
        action: "Inatividade Detectada",
        details: `Usuário inativo por ${Math.floor(inactivityTime / 1000 / 60)} minutos`,
        origin: {
          module: "Sistema",
          device: navigator.platform,
          browser: navigator.userAgent,
          network: getCurrentNetworkInfo(),
        },
        result: "success",
        interactionType: "system",
      });
    }

    set((state) => ({
      currentSession: {
        ...state.currentSession,
        lastActivity: currentTime,
        inactivityTime,
      },
    }));
  };

  if (typeof window !== "undefined") {
    ["mousedown", "keydown", "scroll", "touchstart"].forEach((eventType) => {
      window.addEventListener(eventType, updateLastActivity);
    });
  }

  return {
    logs: [],
    currentSession: {
      startTime: new Date(),
      loginAttempts: 0,
      lastActivity: new Date(),
      inactivityTime: 0,
    },
    updateGeolocation: (coords) => {
      set((state) => ({
        currentSession: {
          ...state.currentSession,
          geolocation: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            city: coords.city,
            state: coords.state,
            country: coords.country,
          },
        },
      }));
    },
    updateIpAddress: (ip) => {
      set((state) => ({
        currentSession: {
          ...state.currentSession,
          ipAddress: ip,
        },
      }));
    },
    updateIpAddresses: ({ ipv4, ipv6 }) => {
      set((state) => ({
        currentSession: {
          ...state.currentSession,
          ipAddress: ipv4 ?? ipv6 ?? state.currentSession.ipAddress,
          ipv4Address: ipv4,
          ipv6Address: ipv6,
        },
      }));
    },
    addLog: (logData) => {
      const networkInfo = getCurrentNetworkInfo();
      const state = get();

      // Capture logs BEFORE inserting newLog to match training semantics
      // (training excludes the current log from the recentLogs window)
      const previousLogs = state.logs.slice(0, 50);

      const newLog: SystemLog = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        session: state.currentSession,
        ...logData,
        origin: {
          ...logData.origin,
          network: networkInfo,
          geolocation: state.currentSession.geolocation,
          ipAddress: state.currentSession.ipAddress,
          ipv4Address: state.currentSession.ipv4Address,
          ipv6Address: state.currentSession.ipv6Address,
        },
      };

      set((s) => ({
        logs: [newLog, ...s.logs],
        currentSession: {
          ...s.currentSession,
          lastActivity: new Date(),
        },
      }));

      persistLog(newLog)
        .then(() => useApiErrorStore.getState().resetApiErrorCount())
        .catch(() => useApiErrorStore.getState().incrementApiError());

      useMLStore.getState().analyzeLog(newLog, previousLogs);
    },
    updateSession: (sessionData) =>
      set((state) => ({
        currentSession: {
          ...state.currentSession,
          ...sessionData,
        },
      })),
    trackUserInteraction: (
      element: HTMLElement,
      interactionType: "click" | "navigation" | "configuration",
    ) => {
      const state = get();
      state.addLog({
        userName: state.currentSession.userName || "Sistema",
        userId: state.currentSession.userId || "system",
        accessLevel: "system",
        action: `Interação do Usuário - ${interactionType}`,
        details: `Interação com elemento: ${element.tagName.toLowerCase()}`,
        origin: {
          module: "Interface do Usuário",
          device: navigator.platform,
          browser: navigator.userAgent,
          network: getCurrentNetworkInfo(),
        },
        result: "success",
        interactionType,
        elementInfo: {
          id: element.id,
          className: element.className,
          text: element.textContent?.trim(),
          type: element.getAttribute("type") || undefined,
        },
      });
    },
  };
});

if (typeof document !== "undefined") {
  document.addEventListener("click", (e) => {
    const element = e.target as HTMLElement;
    if (element) {
      useLogStore.getState().trackUserInteraction(element, "click");
    }
  });
}
