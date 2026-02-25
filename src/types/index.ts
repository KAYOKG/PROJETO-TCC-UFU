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
  userName?: string;
  userId?: string;
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

// --- ML Types ---

export interface FeatureVector {
  hourOfDay: number;
  dayOfWeek: number;
  accessLevelEncoded: number;
  actionTypeCreate: number;
  actionTypeRead: number;
  actionTypeUpdate: number;
  actionTypeDelete: number;
  actionTypeLogin: number;
  actionTypeConfig: number;
  moduleClientes: number;
  moduleEmpresa: number;
  moduleContratos: number;
  moduleGestao: number;
  moduleSistema: number;
  resultEncoded: number;
  sessionDurationMinutes: number;
  actionFrequency: number;
  actionVariety: number;
  actionSequenceEntropy: number;
  moduleAccessCount: number;
  sensitiveDataAccessCount: number;
  errorRate: number;
  avgTimeBetweenActions: number;
  burstScore: number;
  networkLatency: number;
  geoDistanceFromUsual: number;
  ipChangeFlag: number;
  loginAttempts: number;
  inactivitySeconds: number;
  isNewDevice: number;
}

export const FEATURE_NAMES: (keyof FeatureVector)[] = [
  'hourOfDay', 'dayOfWeek', 'accessLevelEncoded',
  'actionTypeCreate', 'actionTypeRead', 'actionTypeUpdate',
  'actionTypeDelete', 'actionTypeLogin', 'actionTypeConfig',
  'moduleClientes', 'moduleEmpresa', 'moduleContratos',
  'moduleGestao', 'moduleSistema', 'resultEncoded',
  'sessionDurationMinutes', 'actionFrequency', 'actionVariety',
  'actionSequenceEntropy', 'moduleAccessCount', 'sensitiveDataAccessCount',
  'errorRate', 'avgTimeBetweenActions', 'burstScore',
  'networkLatency', 'geoDistanceFromUsual', 'ipChangeFlag',
  'loginAttempts', 'inactivitySeconds', 'isNewDevice',
];

export const NUM_FEATURES = FEATURE_NAMES.length;

export interface MLPrediction {
  logId: string;
  userId: string;
  riskScore: number;
  isSuspicious: boolean;
  alertType?: string;
  featureVector: number[];
  timestamp: Date;
}

export interface RiskAlert {
  id: number;
  logId: string;
  userId: string;
  userName: string;
  riskScore: number;
  alertType: string;
  description: string;
  modelVersion?: string;
  isMlDetection: boolean;
  createdAt: string;
}

export interface TrainingMetrics {
  id: number;
  modelVersion: string;
  accuracy: number;
  precisionScore: number;
  recallScore: number;
  f1Score: number;
  aucRoc: number;
  loss: number;
  valAccuracy: number;
  valLoss: number;
  epochs: number;
  datasetSize: number;
  trainingTimeMs: number;
  createdAt: string;
}

export interface FeatureStats {
  featureName: string;
  min: number;
  max: number;
  mean: number;
  std: number;
}

export interface ModelConfig {
  threshold: number;
  modelVersion: string;
  featureStats: FeatureStats[];
}