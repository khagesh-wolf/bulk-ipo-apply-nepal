/**
 * Toast Notification System — Bulk IPO Apply Nepal
 *
 * Provides app-wide toast notifications with support for
 * success, error, warning, and info types.
 *
 * Usage:
 *   const { showSuccess, showError } = useToast();
 *   showSuccess('Account added!');
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  Animated,
  Platform,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { YStack, XStack, SizableText } from '@blinkdotnew/mobile-ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastContextValue {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ---------------------------------------------------------------------------
// useToast hook
// ---------------------------------------------------------------------------

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: '#064e3b', border: '#10b98140', text: '#10b981', icon: '✓' },
  error:   { bg: '#450a0a', border: '#ef444440', text: '#ef4444', icon: '✕' },
  warning: { bg: '#451a03', border: '#f59e0b40', text: '#f59e0b', icon: '⚠' },
  info:    { bg: '#0c2d48', border: '#0ea5e940', text: '#0ea5e9', icon: 'ℹ' },
};

const TOP_OFFSET = Platform.OS === 'ios' ? 54 : Platform.OS === 'android' ? 34 : 24;

// ---------------------------------------------------------------------------
// Single Toast View
// ---------------------------------------------------------------------------

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // Fade in
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: USE_NATIVE_DRIVER }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: USE_NATIVE_DRIVER }),
    ]).start();

    // Auto-dismiss
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: USE_NATIVE_DRIVER }),
        Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: USE_NATIVE_DRIVER }),
      ]).start(() => onDismiss(item.id));
    }, item.duration);

    return () => clearTimeout(timer);
  }, [item.id, item.duration, onDismiss, opacity, translateY]);

  const colors = TOAST_COLORS[item.type];

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity,
          transform: [{ translateY }],
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => onDismiss(item.id)}
        activeOpacity={0.8}
        style={styles.toastTouchable}
      >
        <XStack alignItems="center" gap="$2" flex={1}>
          <YStack
            width={24}
            height={24}
            borderRadius={12}
            backgroundColor={colors.text + '20'}
            alignItems="center"
            justifyContent="center"
          >
            <SizableText size="$2" color={colors.text} fontWeight="900">
              {colors.icon}
            </SizableText>
          </YStack>
          <SizableText
            size="$3"
            color="#FFFFFF"
            fontWeight="600"
            flex={1}
            numberOfLines={2}
          >
            {item.message}
          </SizableText>
        </XStack>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Toast Provider
// ---------------------------------------------------------------------------

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idCounter = useRef(0);

  const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = String(++idCounter.current);
    setToasts((prev) => [...prev.slice(-2), { id, type, message, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message: string, duration?: number) => addToast('success', message, duration),
    [addToast],
  );
  const showError = useCallback(
    (message: string, duration?: number) => addToast('error', message, duration ?? 4000),
    [addToast],
  );
  const showWarning = useCallback(
    (message: string, duration?: number) => addToast('warning', message, duration),
    [addToast],
  );
  const showInfo = useCallback(
    (message: string, duration?: number) => addToast('info', message, duration),
    [addToast],
  );

  return (
    <ToastContext.Provider value={{ showSuccess, showError, showWarning, showInfo }}>
      {children}
      {/* Toast overlay */}
      {toasts.length > 0 && (
        <YStack
          position="absolute"
          top={TOP_OFFSET}
          left={0}
          right={0}
          zIndex={9999}
          alignItems="center"
          gap="$2"
          style={styles.overlay}
        >
          {toasts.map((toast) => (
            <ToastView key={toast.id} item={toast} onDismiss={dismissToast} />
          ))}
        </YStack>
      )}
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    pointerEvents: 'box-none',
  },
  toastContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    maxWidth: 500,
    width: '92%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastTouchable: {
    padding: 14,
  },
});
