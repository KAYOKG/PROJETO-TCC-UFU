import { create } from 'zustand';
import { SystemLog, UserSession } from '../types';
import { useGeolocated } from 'react-geolocated';
import { useIp } from 'react-ip';

interface LogState {
  logs: SystemLog[];
  currentSession: UserSession;
  addLog: (log: Omit<SystemLog, 'id' | 'timestamp' | 'session'>) => void;
  updateSession: (sessionData: Partial<UserSession>) => void;
  trackUserInteraction: (element: HTMLElement, interactionType: 'click' | 'navigation' | 'configuration') => void;
  updateGeolocation: (coords: { latitude: number; longitude: number }) => void;
  updateIpAddress: (ip: string) => void;
}

const INACTIVITY_THRESHOLD = 5 * 60 * 1000; // 5 minutes in milliseconds

const getCurrentNetworkInfo = (): SystemLog['origin']['network'] => {
  const connection = (navigator as any).connection;
  
  if (!connection) {
    return {
      type: 'Não disponível',
      speed: 'Não disponível',
      latency: 0
    };
  }

  return {
    type: connection.type || 'Não disponível',
    speed: connection.downlink ? `${connection.downlink} Mbps` : 'Não disponível',
    latency: connection.rtt || 0
  };
};

export const useLogStore = create<LogState>((set, get) => {
  // Initialize inactivity tracking
  let lastActivityTime = new Date();
  const updateLastActivity = () => {
    const currentTime = new Date();
    const inactivityTime = currentTime.getTime() - lastActivityTime.getTime();
    lastActivityTime = currentTime;
    
    if (inactivityTime >= INACTIVITY_THRESHOLD) {
      const state = get();
      state.addLog({
        userName: state.currentSession.userName || 'Sistema',
        userId: state.currentSession.userId || 'system',
        accessLevel: 'system',
        action: 'Inatividade Detectada',
        details: `Usuário inativo por ${Math.floor(inactivityTime / 1000 / 60)} minutos`,
        origin: {
          module: 'Sistema',
          device: navigator.platform,
          browser: navigator.userAgent,
          network: getCurrentNetworkInfo(),
        },
        result: 'success',
        interactionType: 'system',
      });
    }

    set(state => ({
      currentSession: {
        ...state.currentSession,
        lastActivity: currentTime,
        inactivityTime
      }
    }));
  };

  // Set up activity listeners
  if (typeof window !== 'undefined') {
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(eventType => {
      window.addEventListener(eventType, updateLastActivity);
    });
  }

  return {
    logs: [],
    currentSession: {
      startTime: new Date(),
      loginAttempts: 0,
      lastActivity: new Date(),
      inactivityTime: 0
    },
    updateGeolocation: (coords) => {
      set(state => ({
        currentSession: {
          ...state.currentSession,
          geolocation: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            city: 'Localização capturada',
            country: 'Localização capturada'
          }
        }
      }));
    },
    updateIpAddress: (ip) => {
      set(state => ({
        currentSession: {
          ...state.currentSession,
          ipAddress: ip
        }
      }));
    },
    addLog: async (logData) => {
      const networkInfo = getCurrentNetworkInfo();
      const state = get();

      set((state) => ({
        logs: [
          {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            session: state.currentSession,
            origin: {
              ...logData.origin,
              network: networkInfo,
              geolocation: state.currentSession.geolocation,
              ipAddress: state.currentSession.ipAddress
            },
            ...logData,
          },
          ...state.logs,
        ],
        currentSession: {
          ...state.currentSession,
          lastActivity: new Date()
        }
      }));
    },
    updateSession: (sessionData) => set((state) => ({
      currentSession: {
        ...state.currentSession,
        ...sessionData
      }
    })),
    trackUserInteraction: (element: HTMLElement, interactionType: 'click' | 'navigation' | 'configuration') => {
      const state = get();
      state.addLog({
        userName: state.currentSession.userName || 'Sistema',
        userId: state.currentSession.userId || 'system',
        accessLevel: 'system',
        action: `Interação do Usuário - ${interactionType}`,
        details: `Interação com elemento: ${element.tagName.toLowerCase()}`,
        origin: {
          module: 'Interface do Usuário',
          device: navigator.platform,
          browser: navigator.userAgent,
          network: getCurrentNetworkInfo(),
        },
        result: 'success',
        interactionType,
        elementInfo: {
          id: element.id,
          className: element.className,
          text: element.textContent?.trim(),
          type: element.getAttribute('type') || undefined
        }
      });
    }
  };
});

// Add click tracking to the entire document
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const element = e.target as HTMLElement;
    if (element) {
      useLogStore.getState().trackUserInteraction(element, 'click');
    }
  });
}