/**
 * Bulk IPO Allotment Check Modal — Bulk IPO Apply Nepal
 *
 * Allows users to check IPO allotment results for all accounts simultaneously.
 * Shows progress per account and displays results with status icons.
 */

import React, { useState, useEffect } from 'react';
import { Modal, TouchableOpacity, Platform, ActivityIndicator, StyleSheet } from 'react-native';
import {
  YStack,
  XStack,
  SizableText,
  ScrollView,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
} from '@blinkdotnew/mobile-ui';
import type { MeroShareAccount, BulkCheckResult } from '@/types';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#0A0E1A',
  card: '#0D1221',
  surface: '#1A2744',
  border: '#2D3B55',
  gold: '#FFD700',
  positive: '#22C55E',
  negative: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  muted: '#8B9AB1',
  white: '#FFFFFF',
};

// ─── Status Icon ────────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: BulkCheckResult['status'] }) {
  switch (status) {
    case 'allotted':
      return <CheckCircle2 size={22} color={C.positive} />;
    case 'not_allotted':
      return <AlertCircle size={22} color={C.muted} />;
    case 'error':
      return <AlertCircle size={22} color={C.negative} />;
    case 'pending':
    default:
      return <Clock size={22} color={C.warning} />;
  }
}

function statusLabel(status: BulkCheckResult['status']): string {
  switch (status) {
    case 'allotted':
      return 'Allotted';
    case 'not_allotted':
      return 'Not Allotted';
    case 'error':
      return 'Error';
    case 'pending':
    default:
      return 'Pending';
  }
}

function statusColor(status: BulkCheckResult['status']): string {
  switch (status) {
    case 'allotted':
      return C.positive;
    case 'not_allotted':
      return C.muted;
    case 'error':
      return C.negative;
    case 'pending':
    default:
      return C.warning;
  }
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
interface BulkCheckModalProps {
  visible: boolean;
  accounts: MeroShareAccount[];
  onClose: () => void;
  onCheck: (accountIds: string[]) => Promise<BulkCheckResult[]>;
  isChecking: boolean;
}

export function BulkCheckModal({
  visible,
  accounts,
  onClose,
  onCheck,
  isChecking,
}: BulkCheckModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [results, setResults] = useState<BulkCheckResult[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  const activeAccounts = accounts.filter((a) => a.isActive);
  const allSelected = activeAccounts.length > 0 && selectedIds.length === activeAccounts.length;

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedIds(activeAccounts.map((a) => a.id));
      setResults([]);
      setHasChecked(false);
    }
  }, [visible]);

  function toggleAccount(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activeAccounts.map((a) => a.id));
    }
  }

  async function handleCheck() {
    if (selectedIds.length === 0) return;
    const res = await onCheck(selectedIds);
    setResults(res);
    setHasChecked(true);
  }

  const allottedCount = results.filter((r) => r.status === 'allotted').length;
  const totalUnits = results.reduce((sum, r) => sum + r.allottedUnits, 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <YStack flex={1} backgroundColor="rgba(0,0,0,0.75)" justifyContent="flex-end">
        <YStack
          backgroundColor={C.card}
          borderTopLeftRadius={24}
          borderTopRightRadius={24}
          maxHeight="90%"
          borderWidth={1}
          borderColor={C.border}
        >
          {/* Modal Header */}
          <XStack
            padding="$5"
            paddingBottom="$4"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderColor={C.border}
          >
            <YStack flex={1} paddingRight="$3">
              <SizableText size="$2" color={C.info} fontWeight="600">
                IPO ALLOTMENT CHECK
              </SizableText>
              <SizableText size="$5" fontWeight="900" color={C.white}>
                Check Results
              </SizableText>
            </YStack>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={22} color={C.muted} />
            </TouchableOpacity>
          </XStack>

          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack padding="$5" gap="$4">
              {!hasChecked ? (
                <>
                  {/* Account Selection */}
                  <YStack gap="$2">
                    <XStack alignItems="center" justifyContent="space-between">
                      <SizableText size="$3" color={C.white} fontWeight="700">
                        Select Accounts ({selectedIds.length}/{activeAccounts.length})
                      </SizableText>
                      <TouchableOpacity onPress={toggleAll}>
                        <SizableText size="$2" color={C.gold} fontWeight="700">
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </SizableText>
                      </TouchableOpacity>
                    </XStack>

                    {activeAccounts.length === 0 ? (
                      <YStack
                        padding="$5"
                        backgroundColor={C.surface}
                        borderRadius={12}
                        alignItems="center"
                        gap="$3"
                      >
                        <Users size={32} color={C.muted} />
                        <SizableText size="$3" color={C.muted} textAlign="center">
                          No active accounts found.{'\n'}Add accounts in Settings to check results.
                        </SizableText>
                      </YStack>
                    ) : (
                      <YStack gap="$2">
                        {activeAccounts.map((acc) => {
                          const isChecked = selectedIds.includes(acc.id);
                          const initials = acc.nickname
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                          return (
                            <TouchableOpacity
                              key={acc.id}
                              onPress={() => toggleAccount(acc.id)}
                              style={[
                                styles.accountRow,
                                {
                                  backgroundColor: isChecked ? C.surface : C.bg,
                                  borderColor: isChecked ? C.info : C.border,
                                },
                              ]}
                            >
                              {/* Checkbox */}
                              <YStack
                                width={22}
                                height={22}
                                borderRadius={6}
                                borderWidth={2}
                                borderColor={isChecked ? C.info : '#4A5568'}
                                backgroundColor={isChecked ? C.info : 'transparent'}
                                alignItems="center"
                                justifyContent="center"
                              >
                                {isChecked && (
                                  <SizableText size="$1" color={C.white} fontWeight="900">✓</SizableText>
                                )}
                              </YStack>

                              {/* Avatar */}
                              <YStack
                                width={40}
                                height={40}
                                borderRadius={20}
                                backgroundColor={C.info + '30'}
                                alignItems="center"
                                justifyContent="center"
                              >
                                <SizableText size="$3" fontWeight="900" color={C.info}>
                                  {initials}
                                </SizableText>
                              </YStack>

                              {/* Info */}
                              <YStack flex={1}>
                                <SizableText size="$3" fontWeight="700" color={C.white}>
                                  {acc.nickname}
                                </SizableText>
                                <SizableText size="$2" color={C.muted}>
                                  DP: {'*'.repeat(6)}{acc.dpId?.slice(-4) ?? '****'}
                                </SizableText>
                              </YStack>
                            </TouchableOpacity>
                          );
                        })}
                      </YStack>
                    )}
                  </YStack>

                  {/* Info banner */}
                  <XStack
                    backgroundColor={C.info + '15'}
                    borderRadius={10}
                    padding="$3"
                    gap="$2"
                    alignItems="center"
                    borderWidth={1}
                    borderColor={C.info + '30'}
                  >
                    <AlertCircle size={16} color={C.info} />
                    <SizableText size="$2" color={C.info} flex={1}>
                      Results are fetched from CDSC's public allotment check service.
                    </SizableText>
                  </XStack>
                </>
              ) : (
                /* Results view */
                <YStack gap="$4">
                  {/* Summary */}
                  <YStack alignItems="center" gap="$2" paddingVertical="$3">
                    {allottedCount > 0 ? (
                      <CheckCircle2 size={48} color={C.positive} />
                    ) : (
                      <AlertCircle size={48} color={C.muted} />
                    )}
                    <SizableText size="$5" fontWeight="900" color={C.white}>
                      {allottedCount > 0 ? 'Congratulations!' : 'Results Checked'}
                    </SizableText>
                    <SizableText size="$3" color={C.muted} textAlign="center">
                      {allottedCount > 0
                        ? `${allottedCount} account${allottedCount > 1 ? 's' : ''} allotted — ${totalUnits} total units`
                        : `Checked ${results.length} account${results.length !== 1 ? 's' : ''}`}
                    </SizableText>
                  </YStack>

                  {/* Individual results */}
                  <YStack gap="$2">
                    {results.map((res) => (
                      <XStack
                        key={res.accountId}
                        backgroundColor={C.surface}
                        borderRadius={12}
                        padding="$3"
                        alignItems="center"
                        gap="$3"
                        borderWidth={1}
                        borderColor={
                          res.status === 'allotted'
                            ? C.positive + '40'
                            : res.status === 'error'
                            ? C.negative + '40'
                            : C.border
                        }
                      >
                        <StatusIcon status={res.status} />
                        <YStack flex={1}>
                          <SizableText size="$3" fontWeight="700" color={C.white}>
                            {res.accountNickname}
                          </SizableText>
                          <SizableText size="$2" color={statusColor(res.status)}>
                            {res.status === 'allotted'
                              ? `✅ Allotted ${res.allottedUnits} units`
                              : res.status === 'not_allotted'
                              ? '❌ Not Allotted'
                              : res.status === 'error'
                              ? `⚠️ ${res.message}`
                              : '⏳ Pending'}
                          </SizableText>
                        </YStack>
                        <YStack
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          borderRadius={8}
                          backgroundColor={statusColor(res.status) + '20'}
                        >
                          <SizableText size="$1" color={statusColor(res.status)} fontWeight="800">
                            {statusLabel(res.status)}
                          </SizableText>
                        </YStack>
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              )}
            </YStack>
          </ScrollView>

          {/* Bottom action */}
          <YStack
            padding="$4"
            paddingBottom={Platform.OS === 'ios' ? 34 : 16}
            borderTopWidth={1}
            borderColor={C.border}
            gap="$3"
          >
            {!hasChecked ? (
              <TouchableOpacity
                onPress={handleCheck}
                disabled={selectedIds.length === 0 || isChecking}
                style={[
                  styles.primaryButton,
                  {
                    backgroundColor: selectedIds.length === 0 ? '#4A5568' : C.info,
                    opacity: isChecking ? 0.7 : 1,
                  },
                ]}
                activeOpacity={0.8}
              >
                {isChecking ? (
                  <XStack alignItems="center" gap={8}>
                    <ActivityIndicator size="small" color={C.white} />
                    <SizableText color={C.white} fontWeight="900" size="$4">
                      Checking…
                    </SizableText>
                  </XStack>
                ) : (
                  <SizableText color={C.white} fontWeight="900" size="$4">
                    Check Allotment for {selectedIds.length} Account{selectedIds.length !== 1 ? 's' : ''}
                  </SizableText>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={onClose}
                style={[styles.primaryButton, { backgroundColor: C.surface }]}
                activeOpacity={0.8}
              >
                <SizableText color={C.white} fontWeight="800" size="$4">
                  Done
                </SizableText>
              </TouchableOpacity>
            )}
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#1A2744',
  },
  accountRow: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
