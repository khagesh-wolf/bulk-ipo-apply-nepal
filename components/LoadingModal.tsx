/**
 * Loading Modal — Bulk IPO Apply Nepal
 *
 * Full-screen loading overlay with spinner and optional message.
 *
 * Usage:
 *   const { showLoading, hideLoading } = useLoading();
 *   showLoading('Saving account…');
 *   await doWork();
 *   hideLoading();
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import { Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { YStack, SizableText } from '@blinkdotnew/mobile-ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LoadingContextValue {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  isVisible: boolean;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useLoading(): LoadingContextValue {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('Loading…');

  const showLoading = useCallback((msg?: string) => {
    setMessage(msg ?? 'Loading…');
    setVisible(true);
  }, []);

  const hideLoading = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, isVisible: visible }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <YStack
          flex={1}
          backgroundColor="rgba(0, 0, 0, 0.6)"
          justifyContent="center"
          alignItems="center"
          gap="$4"
        >
          <YStack
            backgroundColor="#1e293b"
            borderRadius={16}
            borderWidth={1}
            borderColor="#475569"
            padding="$6"
            alignItems="center"
            gap="$4"
            style={styles.card}
          >
            <ActivityIndicator size="large" color="#0ea5e9" />
            <SizableText size="$3" color="#94a3b8" fontWeight="600">
              {message}
            </SizableText>
          </YStack>
        </YStack>
      </Modal>
    </LoadingContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    minWidth: 180,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
});
