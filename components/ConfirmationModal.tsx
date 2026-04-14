/**
 * Confirmation Modal — Bulk IPO Apply Nepal
 *
 * Reusable confirmation dialog for destructive or important actions.
 *
 * Usage:
 *   const { confirm } = useConfirmation();
 *   const ok = await confirm({
 *     title: 'Delete Account?',
 *     message: 'This cannot be undone.',
 *     confirmText: 'Delete',
 *     destructive: true,
 *   });
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Modal, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { YStack, XStack, SizableText } from '@blinkdotnew/mobile-ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

interface ConfirmationContextValue {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useConfirmation(): ConfirmationContextValue {
  const ctx = useContext(ConfirmationContext);
  if (!ctx) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const C = {
  bg: '#0f172a',
  card: '#1e293b',
  surface: '#334155',
  border: '#475569',
  gold: '#fbbf24',
  negative: '#ef4444',
  muted: '#94a3b8',
  white: '#f1f5f9',
};

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ConfirmationProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ConfirmationOptions>({
    title: '',
    message: '',
  });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setOptions(opts);
      setVisible(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setVisible(false);
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setVisible(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleCancel}
          style={styles.backdrop}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <YStack
              backgroundColor={C.card}
              borderRadius={16}
              borderWidth={1}
              borderColor={C.border}
              padding="$5"
              gap="$4"
              maxWidth={400}
              width="100%"
            >
              {/* Title */}
              <SizableText size="$5" fontWeight="800" color={C.white}>
                {options.title}
              </SizableText>

              {/* Message */}
              <SizableText size="$3" color={C.muted} lineHeight={22}>
                {options.message}
              </SizableText>

              {/* Actions */}
              <XStack gap="$3" justifyContent="flex-end" marginTop="$2">
                <TouchableOpacity
                  onPress={handleCancel}
                  style={styles.cancelButton}
                  activeOpacity={0.7}
                >
                  <SizableText size="$3" fontWeight="700" color={C.muted}>
                    {options.cancelText || 'Cancel'}
                  </SizableText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirm}
                  style={[
                    styles.confirmButton,
                    {
                      backgroundColor: options.destructive
                        ? C.negative
                        : C.gold,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <SizableText
                    size="$3"
                    fontWeight="800"
                    color={options.destructive ? C.white : '#0f172a'}
                  >
                    {options.confirmText || 'Confirm'}
                  </SizableText>
                </TouchableOpacity>
              </XStack>
            </YStack>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ConfirmationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  confirmButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
});
