export interface Address {
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  branch: string;
  accountType: 'checking' | 'savings';
}

export interface Client {
  id: string;
  name: string;
  cpf: string;
  bankInfo: BankInfo;
  warehouseAddress: Address;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string;
  address: Address;
  bankInfo: BankInfo;
}

export interface Contract {
  id: string;
  seller: Client;
  buyer: Client;
  deliveryAddress: Address;
  quantity: number;
  price: number;
  date: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
}

export interface UserSession {
  startTime: Date;
  loginAttempts: number;
  lastActivity: Date;
  ipAddress?: string;
  inactivityTime?: number;
  geolocation?: {
    latitude: number;
    longitude: number;
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface SystemLog {
  id: string;
  timestamp: Date;
  userName: string;
  userId: string;
  accessLevel: 'admin' | 'user' | 'guest' | 'system';
  action: string;
  details: string;
  origin: {
    module: string;
    device: string;
    browser: string;
    ipAddress?: string;
    geolocation?: {
      latitude: number;
      longitude: number;
      city?: string;
      state?: string;
      country?: string;
    };
    network: {
      type: string;
      speed: string;
      latency: number;
    };
  };
  session: UserSession;
  result: 'success' | 'error';
  interactionType?: 'click' | 'navigation' | 'configuration' | 'system';
  elementInfo?: {
    id?: string;
    className?: string;
    text?: string;
    type?: string;
  };
}