/**
 * Jest Test Setup — mocks for React Native, Expo modules, etc.
 */

// Mock react-native Platform
jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: jest.fn() },
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2, 10),
  getRandomBytesAsync: async (length: number) => {
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  },
  digestStringAsync: async (_algo: string, input: string) => {
    // Simple deterministic hash for testing
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  },
  CryptoDigestAlgorithm: {
    SHA256: 'SHA-256',
  },
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: async (key: string) => store.get(key) ?? null,
    setItemAsync: async (key: string, value: string) => { store.set(key, value); },
    deleteItemAsync: async (key: string) => { store.delete(key); },
  };
});

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: async () => ({
    execAsync: async () => {},
    getAllAsync: async () => [],
    getFirstAsync: async () => null,
    runAsync: async () => ({ changes: 0, lastInsertRowId: 0 }),
    closeAsync: async () => {},
  }),
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    default: {
      getItem: async (key: string) => store.get(key) ?? null,
      setItem: async (key: string, value: string) => { store.set(key, value); },
      removeItem: async (key: string) => { store.delete(key); },
    },
  };
});

// Global __DEV__
(global as any).__DEV__ = true;
