/**
 * IPO Center Screen — Bulk IPO Apply Nepal
 * Active / Upcoming issues with bulk apply modal.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Platform, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import {
  YStack,
  XStack,
  Card,
  Button,
  SizableText,
  H2,
  H3,
  Paragraph,
  ScrollView,
  Separator,
  RefreshCw,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronRight,
  X,
  Zap,
  Search,
} from '@blinkdotnew/mobile-ui';
import { useShallow } from 'zustand/react/shallow';
import {
  useIPOStore,
  useAccountStore,
  selectOpenIssues,
  selectUpcomingIssues,
} from '@/store';
import { BulkCheckModal } from '@/components/BulkCheckModal';
import type { IPOIssue, IPOApplication, MeroShareAccount, BulkApplyResult } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function daysFromNow(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NP', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ─── Share Type Badge ────────────────────────────────────────────────────────

function ShareTypeBadge({ type }: { type: string }) {
  const color =
    type === 'Ordinary' ? '#22C55E' :
    type === 'Right'    ? '#3B82F6' :
    type === 'FPO'      ? '#F59E0B' : '#8B9AB1';
  return (
    <YStack
      paddingHorizontal="$2"
      paddingVertical="$0.5"
      borderRadius="$10"
      borderWidth={1}
      borderColor={color}
    >
      <SizableText size="$1" color={color} fontWeight="800">{type}</SizableText>
    </YStack>
  );
}

// ─── Application Status Badge ────────────────────────────────────────────────

function StatusBadgeCustom({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    APPLIED:      { color: '#3B82F6', bg: '#3B82F620', label: 'Applied' },
    ALLOTTED:     { color: '#22C55E', bg: '#22C55E20', label: 'Allotted ✓' },
    NOT_ALLOTTED: { color: '#8B9AB1', bg: '#8B9AB120', label: 'Not Allotted' },
    FAILED:       { color: '#EF4444', bg: '#EF444420', label: 'Failed' },
    PENDING:      { color: '#F59E0B', bg: '#F59E0B20', label: 'Pending' },
  };
  const cfg = map[status] ?? map['PENDING'];
  return (
    <YStack
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$10"
      backgroundColor={cfg.bg}
    >
      <SizableText size="$1" color={cfg.color} fontWeight="800">{cfg.label}</SizableText>
    </YStack>
  );
}

// ─── Bulk Apply Modal ────────────────────────────────────────────────────────

interface BulkApplyModalProps {
  visible: boolean;
  issue: IPOIssue | null;
  accounts: MeroShareAccount[];
  onClose: () => void;
  onApply: (issueId: string, accountIds: string[], units: number) => Promise<BulkApplyResult[]>;
  isApplying: boolean;
  lastResults: BulkApplyResult[];
}

function BulkApplyModal({
  visible,
  issue,
  accounts,
  onClose,
  onApply,
  isApplying,
  lastResults,
}: BulkApplyModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [units, setUnits] = useState<string>('');
  const [applied, setApplied] = useState(false);
  const [results, setResults] = useState<BulkApplyResult[]>([]);

  // Reset when issue changes
  useEffect(() => {
    if (issue) {
      setSelectedIds(accounts.filter((a) => a.isActive).map((a) => a.id));
      setUnits(String(issue.minUnit));
      setApplied(false);
      setResults([]);
    }
  }, [issue?.id]);

  const activeAccounts = accounts.filter((a) => a.isActive);
  const allSelected = activeAccounts.length > 0 && selectedIds.length === activeAccounts.length;

  function toggleAccount(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activeAccounts.map((a) => a.id));
    }
  }

  async function handleApply() {
    if (!issue || selectedIds.length === 0) return;
    const numUnits = parseInt(units, 10) || issue.minUnit;
    const res = await onApply(issue.id, selectedIds, numUnits);
    setResults(res);
    setApplied(true);
  }

  function handleClose() {
    setApplied(false);
    setResults([]);
    onClose();
  }

  const topPad = Platform.OS === 'ios' ? 50 : 30;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <YStack
        flex={1}
        backgroundColor="rgba(0,0,0,0.75)"
        justifyContent="flex-end"
      >
        <YStack
          backgroundColor="#0D1221"
          borderTopLeftRadius={24}
          borderTopRightRadius={24}
          maxHeight="90%"
          borderWidth={1}
          borderColor="#1A2744"
        >
          {/* Modal Header */}
          <XStack
            padding="$5"
            paddingBottom="$4"
            alignItems="center"
            justifyContent="space-between"
            borderBottomWidth={1}
            borderColor="#1A2744"
          >
            <YStack flex={1} paddingRight="$3">
              <SizableText size="$2" color="#8B9AB1" fontWeight="600">BULK APPLY</SizableText>
              <SizableText size="$4" fontWeight="900" color="#FFFFFF" numberOfLines={2}>
                {issue?.companyName}
              </SizableText>
            </YStack>
            <TouchableOpacity onPress={handleClose} style={{ padding: 8 }}>
              <X size={22} color="#8B9AB1" />
            </TouchableOpacity>
          </XStack>

          {/* Scrollable content */}
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack padding="$5" gap="$4">
              {!applied ? (
                <>
                  {/* Issue details */}
                  <XStack gap="$3">
                    <YStack flex={1} backgroundColor="#1A2744" padding="$3" borderRadius="$3">
                      <SizableText size="$1" color="#8B9AB1">Min Units</SizableText>
                      <SizableText size="$4" fontWeight="800" color="#FFFFFF">{issue?.minUnit}</SizableText>
                    </YStack>
                    <YStack flex={1} backgroundColor="#1A2744" padding="$3" borderRadius="$3">
                      <SizableText size="$1" color="#8B9AB1">Max Units</SizableText>
                      <SizableText size="$4" fontWeight="800" color="#FFFFFF">{issue?.maxUnit}</SizableText>
                    </YStack>
                    <YStack flex={1} backgroundColor="#1A2744" padding="$3" borderRadius="$3">
                      <SizableText size="$1" color="#8B9AB1">Price/Unit</SizableText>
                      <SizableText size="$4" fontWeight="800" color="#FFD700">Rs.{issue?.pricePerUnit}</SizableText>
                    </YStack>
                  </XStack>

                  {/* Units input */}
                  <YStack gap="$2">
                    <SizableText size="$3" color="#FFFFFF" fontWeight="700">Units to Apply</SizableText>
                    <TextInput
                      value={units}
                      onChangeText={(t) => setUnits(t.replace(/[^0-9]/g, ''))}
                      keyboardType="numeric"
                      placeholder={`Min: ${issue?.minUnit}`}
                      placeholderTextColor="#4A5568"
                      style={{
                        backgroundColor: '#1A2744',
                        borderWidth: 1,
                        borderColor: units && parseInt(units) >= (issue?.minUnit ?? 0) ? '#FFD700' : '#2A3A5C',
                        borderRadius: 12,
                        padding: 14,
                        color: '#FFFFFF',
                        fontSize: 16,
                        fontWeight: '700',
                      }}
                    />
                    {units && issue && parseInt(units) > 0 && (
                      <SizableText size="$2" color="#8B9AB1">
                        Total investment: Rs. {(parseInt(units) * (issue.pricePerUnit ?? 100)).toLocaleString()} per account
                      </SizableText>
                    )}
                  </YStack>

                  {/* Account selection */}
                  <YStack gap="$2">
                    <XStack alignItems="center" justifyContent="space-between">
                      <SizableText size="$3" color="#FFFFFF" fontWeight="700">
                        Select Accounts ({selectedIds.length}/{activeAccounts.length})
                      </SizableText>
                      <TouchableOpacity onPress={toggleAll}>
                        <SizableText size="$2" color="#FFD700" fontWeight="700">
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </SizableText>
                      </TouchableOpacity>
                    </XStack>

                    {activeAccounts.length === 0 ? (
                      <YStack
                        padding="$4"
                        backgroundColor="#1A2744"
                        borderRadius="$3"
                        alignItems="center"
                        gap="$2"
                      >
                        <Users size={24} color="#8B9AB1" />
                        <SizableText size="$2" color="#8B9AB1" textAlign="center">
                          No active accounts. Add accounts in Settings.
                        </SizableText>
                      </YStack>
                    ) : (
                      <YStack gap="$2">
                        {activeAccounts.map((acc) => {
                          const isChecked = selectedIds.includes(acc.id);
                          return (
                            <TouchableOpacity
                              key={acc.id}
                              onPress={() => toggleAccount(acc.id)}
                              style={{
                                backgroundColor: isChecked ? '#1A2744' : '#0A0E1A',
                                borderWidth: 1.5,
                                borderColor: isChecked ? '#FFD700' : '#2A3A5C',
                                borderRadius: 12,
                                padding: 14,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                              }}
                            >
                              {/* Checkbox */}
                              <YStack
                                width={22}
                                height={22}
                                borderRadius={6}
                                borderWidth={2}
                                borderColor={isChecked ? '#FFD700' : '#4A5568'}
                                backgroundColor={isChecked ? '#FFD700' : 'transparent'}
                                alignItems="center"
                                justifyContent="center"
                              >
                                {isChecked && (
                                  <SizableText size="$1" color="#0A0E1A" fontWeight="900">✓</SizableText>
                                )}
                              </YStack>

                              {/* Avatar */}
                              <YStack
                                width={40}
                                height={40}
                                borderRadius={20}
                                backgroundColor="#2A3A5C"
                                alignItems="center"
                                justifyContent="center"
                              >
                                <SizableText size="$3" fontWeight="900" color="#FFD700">
                                  {acc.nickname?.charAt(0)?.toUpperCase() ?? 'A'}
                                </SizableText>
                              </YStack>

                              {/* Info */}
                              <YStack flex={1}>
                                <SizableText size="$3" fontWeight="700" color="#FFFFFF">
                                  {acc.nickname}
                                </SizableText>
                                <SizableText size="$2" color="#8B9AB1">
                                  DP: {'*'.repeat(6)}{acc.dpId?.slice(-4) ?? '****'}
                                </SizableText>
                              </YStack>
                            </TouchableOpacity>
                          );
                        })}
                      </YStack>
                    )}
                  </YStack>
                </>
              ) : (
                /* Results view */
                <YStack gap="$3">
                  <YStack alignItems="center" gap="$2" paddingVertical="$3">
                    <CheckCircle2 size={48} color="#22C55E" />
                    <SizableText size="$5" fontWeight="900" color="#FFFFFF">Applications Submitted</SizableText>
                    <SizableText size="$3" color="#8B9AB1">
                      {results.filter((r) => r.success).length} of {results.length} successful
                    </SizableText>
                  </YStack>

                  <YStack gap="$2">
                    {results.map((res) => (
                      <XStack
                        key={res.accountId}
                        backgroundColor="#1A2744"
                        borderRadius="$3"
                        padding="$3"
                        alignItems="center"
                        gap="$3"
                        borderWidth={1}
                        borderColor={res.success ? '#22C55E40' : '#EF444440'}
                      >
                        {res.success
                          ? <CheckCircle2 size={20} color="#22C55E" />
                          : <AlertCircle size={20} color="#EF4444" />
                        }
                        <YStack flex={1}>
                          <SizableText size="$3" fontWeight="700" color="#FFFFFF">
                            {res.accountNickname}
                          </SizableText>
                          {res.errorMessage && (
                            <SizableText size="$1" color="#EF4444">{res.errorMessage}</SizableText>
                          )}
                          {res.success && (
                            <SizableText size="$1" color="#22C55E">Applied successfully</SizableText>
                          )}
                        </YStack>
                        <StatusBadgeCustom status={res.success ? 'APPLIED' : 'FAILED'} />
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
            borderColor="#1A2744"
            gap="$3"
          >
            {!applied ? (
              <>
                <XStack
                  backgroundColor="#1A2744"
                  borderRadius="$3"
                  padding="$3"
                  alignItems="center"
                  gap="$2"
                >
                  <AlertCircle size={14} color="#8B9AB1" />
                  <SizableText size="$1" color="#8B9AB1" flex={1}>
                    Applying to {selectedIds.length} account{selectedIds.length !== 1 ? 's' : ''}.
                    Min investment: Rs. {((parseInt(units) || (issue?.minUnit ?? 10)) * (issue?.pricePerUnit ?? 100) * selectedIds.length).toLocaleString()} total.
                  </SizableText>
                </XStack>
                <Button
                  size="$5"
                  backgroundColor={selectedIds.length === 0 ? '#4A5568' : '#FFD700'}
                  color="#0A0E1A"
                  fontWeight="900"
                  borderRadius="$4"
                  disabled={selectedIds.length === 0 || isApplying}
                  pressStyle={{ opacity: 0.85, scale: 0.98 }}
                  onPress={handleApply}
                >
                  {isApplying ? (
                    <XStack alignItems="center" gap="$2">
                      <ActivityIndicator size="small" color="#0A0E1A" />
                      <SizableText color="#0A0E1A" fontWeight="900">Applying…</SizableText>
                    </XStack>
                  ) : (
                    `Apply to ${selectedIds.length} Account${selectedIds.length !== 1 ? 's' : ''}`
                  )}
                </Button>
              </>
            ) : (
              <Button
                size="$5"
                backgroundColor="#1A2744"
                color="#FFFFFF"
                fontWeight="800"
                borderRadius="$4"
                borderWidth={1}
                borderColor="#2A3A5C"
                pressStyle={{ opacity: 0.8 }}
                onPress={handleClose}
              >
                Done
              </Button>
            )}
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
}

// ─── Active IPO Issue Card ────────────────────────────────────────────────────

interface IssueCardProps {
  issue: IPOIssue;
  onBulkApply: () => void;
  onSingleApply: () => void;
}

function ActiveIssueCard({ issue, onBulkApply, onSingleApply }: IssueCardProps) {
  const days = daysUntil(issue.closeDate);
  const minInvestment = issue.minUnit * issue.pricePerUnit;

  return (
    <Card
      backgroundColor="#0D1221"
      borderRadius="$5"
      padding="$4"
      marginBottom="$3"
      borderWidth={1}
      borderColor="#1A2744"
      elevation={4}
    >
      <YStack gap="$3">
        {/* Top row */}
        <XStack alignItems="flex-start" justifyContent="space-between">
          <YStack flex={1} paddingRight="$3" gap="$1">
            <SizableText size="$4" fontWeight="900" color="#FFFFFF" numberOfLines={2}>
              {issue.companyName}
            </SizableText>
            <XStack alignItems="center" gap="$2">
              <SizableText size="$2" color="#8B9AB1" fontWeight="700">{issue.symbol}</SizableText>
            </XStack>
            <XStack gap="$3" marginTop="$1">
              <YStack>
                <SizableText size="$1" color="#8B9AB1">Opens</SizableText>
                <SizableText size="$2" color="#FFFFFF" fontWeight="700">{formatDate(issue.openDate)}</SizableText>
              </YStack>
              <YStack>
                <SizableText size="$1" color="#8B9AB1">Closes</SizableText>
                <SizableText size="$2" color="#FFFFFF" fontWeight="700">{formatDate(issue.closeDate)}</SizableText>
              </YStack>
            </XStack>
          </YStack>
          <XStack gap="$2" alignItems="center" flexWrap="wrap" justifyContent="flex-end">
            <ShareTypeBadge type={issue.shareType} />
            {days <= 3 && (
              <YStack paddingHorizontal="$2" paddingVertical="$0.5" borderRadius="$10" backgroundColor="#EF444420">
                <SizableText size="$1" color="#EF4444" fontWeight="800">Closing Soon</SizableText>
              </YStack>
            )}
          </XStack>
        </XStack>

        {/* Progress bar placeholder */}
        <YStack
          backgroundColor="#1A2744"
          borderRadius="$2"
          padding="$2"
          paddingHorizontal="$3"
        >
          <XStack alignItems="center" gap="$2">
            <YStack
              width={8}
              height={8}
              borderRadius={4}
              backgroundColor="#22C55E"
            />
            <SizableText size="$2" color="#22C55E" fontWeight="700">Applications Open</SizableText>
            <XStack flex={1} />
            <Clock size={12} color="#8B9AB1" />
            <SizableText size="$1" color={days <= 3 ? '#EF4444' : '#8B9AB1'}>
              Closes in {days} day{days !== 1 ? 's' : ''}
            </SizableText>
          </XStack>
        </YStack>

        {/* Stats row */}
        <XStack gap="$2">
          <YStack
            flex={1}
            backgroundColor="#1A2744"
            borderRadius="$3"
            padding="$2"
            alignItems="center"
          >
            <SizableText size="$1" color="#8B9AB1">Min Units</SizableText>
            <SizableText size="$3" fontWeight="800" color="#FFFFFF">{issue.minUnit}</SizableText>
          </YStack>
          <YStack
            flex={1}
            backgroundColor="#1A2744"
            borderRadius="$3"
            padding="$2"
            alignItems="center"
          >
            <SizableText size="$1" color="#8B9AB1">Max Units</SizableText>
            <SizableText size="$3" fontWeight="800" color="#FFFFFF">{issue.maxUnit}</SizableText>
          </YStack>
          <YStack
            flex={1}
            backgroundColor="#FFD70015"
            borderRadius="$3"
            padding="$2"
            alignItems="center"
            borderWidth={1}
            borderColor="#FFD70030"
          >
            <SizableText size="$1" color="#8B9AB1">Min Invest</SizableText>
            <SizableText size="$2" fontWeight="800" color="#FFD700">
              Rs.{minInvestment.toLocaleString()}
            </SizableText>
          </YStack>
        </XStack>

        {/* Price per unit */}
        <XStack alignItems="center" justifyContent="space-between">
          <SizableText size="$2" color="#8B9AB1">Price per unit</SizableText>
          <SizableText size="$4" fontWeight="900" color="#FFFFFF">Rs. {issue.pricePerUnit.toLocaleString()}</SizableText>
        </XStack>

        <Separator borderColor="#1A2744" />

        {/* Action buttons */}
        <XStack gap="$3">
          <Button
            flex={1}
            size="$4"
            backgroundColor="#FFD700"
            color="#0A0E1A"
            fontWeight="900"
            borderRadius="$3"
            pressStyle={{ opacity: 0.8, scale: 0.97 }}
            onPress={onBulkApply}
          >
            <XStack alignItems="center" gap="$2">
              <Zap size={14} color="#0A0E1A" />
              <SizableText color="#0A0E1A" fontWeight="900" size="$3">Bulk Apply</SizableText>
            </XStack>
          </Button>
          <Button
            flex={1}
            size="$4"
            backgroundColor="transparent"
            color="#FFD700"
            fontWeight="700"
            borderRadius="$3"
            borderWidth={1.5}
            borderColor="#FFD700"
            pressStyle={{ opacity: 0.7, backgroundColor: '#FFD70010' }}
            onPress={onSingleApply}
          >
            Single Apply
          </Button>
        </XStack>
      </YStack>
    </Card>
  );
}

// ─── Upcoming Issue Card ─────────────────────────────────────────────────────

function UpcomingIssueCard({ issue }: { issue: IPOIssue }) {
  const days = daysFromNow(issue.openDate);
  return (
    <Card
      backgroundColor="#0D1221"
      borderRadius="$5"
      padding="$4"
      marginBottom="$3"
      borderWidth={1}
      borderColor="#1A2744"
      elevation={4}
      opacity={0.75}
    >
      <YStack gap="$3">
        <XStack alignItems="flex-start" justifyContent="space-between">
          <YStack flex={1} paddingRight="$3" gap="$1">
            <SizableText size="$4" fontWeight="900" color="#FFFFFF" numberOfLines={2}>
              {issue.companyName}
            </SizableText>
            <XStack alignItems="center" gap="$2">
              <SizableText size="$2" color="#8B9AB1" fontWeight="700">{issue.symbol}</SizableText>
            </XStack>
            <XStack gap="$3" marginTop="$1">
              <YStack>
                <SizableText size="$1" color="#8B9AB1">Opens</SizableText>
                <SizableText size="$2" color="#FFFFFF" fontWeight="700">{formatDate(issue.openDate)}</SizableText>
              </YStack>
              <YStack>
                <SizableText size="$1" color="#8B9AB1">Closes</SizableText>
                <SizableText size="$2" color="#FFFFFF" fontWeight="700">{formatDate(issue.closeDate)}</SizableText>
              </YStack>
            </XStack>
          </YStack>
          <XStack gap="$2" flexWrap="wrap" justifyContent="flex-end">
            <ShareTypeBadge type={issue.shareType} />
            <YStack paddingHorizontal="$2" paddingVertical="$0.5" borderRadius="$10" backgroundColor="#8B9AB120">
              <SizableText size="$1" color="#8B9AB1" fontWeight="800">Upcoming</SizableText>
            </YStack>
          </XStack>
        </XStack>

        <XStack
          backgroundColor="#1A2744"
          borderRadius="$3"
          padding="$3"
          alignItems="center"
          gap="$2"
        >
          <Clock size={14} color="#8B9AB1" />
          <SizableText size="$2" color="#8B9AB1">
            Opens in {days} day{days !== 1 ? 's' : ''} — {formatDate(issue.openDate)}
          </SizableText>
        </XStack>

        <XStack alignItems="center" justifyContent="space-between">
          <YStack>
            <SizableText size="$1" color="#8B9AB1">Price per unit</SizableText>
            <SizableText size="$3" fontWeight="800" color="#FFFFFF">Rs. {issue.pricePerUnit.toLocaleString()}</SizableText>
          </YStack>
          <YStack alignItems="flex-end">
            <SizableText size="$1" color="#8B9AB1">Min / Max Units</SizableText>
            <SizableText size="$3" fontWeight="700" color="#FFFFFF">{issue.minUnit} / {issue.maxUnit}</SizableText>
          </YStack>
        </XStack>
      </YStack>
    </Card>
  );
}

// ─── Application Row ─────────────────────────────────────────────────────────

function ApplicationRow({ app }: { app: IPOApplication }) {
  return (
    <XStack
      backgroundColor="#0D1221"
      borderRadius="$4"
      padding="$3"
      marginBottom="$2"
      borderWidth={1}
      borderColor="#1A2744"
      alignItems="center"
      gap="$3"
    >
      <YStack
        width={44}
        height={44}
        borderRadius={22}
        backgroundColor="#1A2744"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <SizableText size="$3" fontWeight="900" color="#FFD700">
          {app.companyName?.charAt(0) ?? 'I'}
        </SizableText>
      </YStack>

      <YStack flex={1} gap="$1">
        <SizableText size="$3" fontWeight="700" color="#FFFFFF" numberOfLines={1}>
          {app.companyName}
        </SizableText>
        <SizableText size="$1" color="#8B9AB1">
          {app.accountNickname} · {app.appliedUnits} units
        </SizableText>
        <SizableText size="$1" color="#4A5568">
          {new Date(app.appliedDate).toLocaleDateString('en-NP', { month: 'short', day: 'numeric' })}
        </SizableText>
      </YStack>

      <StatusBadgeCustom status={app.status} />
    </XStack>
  );
}

// ─── Main IPO Screen ─────────────────────────────────────────────────────────

export default function IPOScreen() {
  const topPad = Platform.OS === 'ios' ? 50 : 30;

  // Subscribe to specific state slices instead of entire stores
  const {
    isLoadingIssues,
    applications,
    isApplying,
    isCheckingResults,
    lastBulkResults,
    error: ipoError,
  } = useIPOStore(
    useShallow((s) => ({
      isLoadingIssues: s.isLoadingIssues,
      applications: s.applications,
      isApplying: s.isApplying,
      isCheckingResults: s.isCheckingResults,
      lastBulkResults: s.lastBulkResults,
      error: s.error,
    })),
  );
  const accounts = useAccountStore((s) => s.accounts);
  const openIssues = useIPOStore(useShallow(selectOpenIssues));
  const upcomingIssues = useIPOStore(useShallow(selectUpcomingIssues));

  const [activeTab, setActiveTab] = useState<'active' | 'upcoming'>('active');
  const [selectedIssue, setSelectedIssue] = useState<IPOIssue | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [checkModalVisible, setCheckModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use ref to ensure accounts are loaded only once on mount.
  const dataFetched = useRef(false);
  useEffect(() => {
    if (dataFetched.current) return;
    dataFetched.current = true;
    useAccountStore.getState().loadAccounts();
  }, []);

  async function handleRefresh() {
    setIsRefreshing(true);
    await useIPOStore.getState().fetchActiveIssues();
    setIsRefreshing(false);
  }

  function openBulkModal(issue: IPOIssue) {
    setSelectedIssue(issue);
    setModalVisible(true);
  }

  return (
    <YStack flex={1} backgroundColor="#0A0E1A">
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack style={{ paddingTop: topPad }} paddingBottom="$8">

          {/* ── Header ── */}
          <XStack
            paddingHorizontal="$4"
            paddingVertical="$3"
            alignItems="flex-start"
            justifyContent="space-between"
          >
            <YStack>
              <H2
                color="#FFD700"
                fontWeight="900"
                style={{ letterSpacing: -0.5 }}
              >
                IPO Center
              </H2>
              <SizableText size="$2" color="#8B9AB1">Active &amp; Upcoming Issues</SizableText>
            </YStack>

            <XStack gap="$2" alignItems="center">
              {/* Check Allotment Button */}
              <TouchableOpacity
                onPress={() => setCheckModalVisible(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#3B82F620',
                  borderWidth: 1,
                  borderColor: '#3B82F650',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
                activeOpacity={0.7}
              >
                <Search size={14} color="#3B82F6" />
                <SizableText size="$2" color="#3B82F6" fontWeight="700">
                  Check Results
                </SizableText>
              </TouchableOpacity>

              <Button
                size="$4"
                circular
                chromeless
                pressStyle={{ opacity: 0.7 }}
                onPress={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  size={20}
                  color={isRefreshing ? '#FFD700' : '#8B9AB1'}
                  style={isRefreshing ? { transform: [{ rotate: '45deg' }] } : undefined}
                />
              </Button>
            </XStack>
          </XStack>

          {/* ── Pill Tab Bar ── */}
          <XStack
            paddingHorizontal="$4"
            marginBottom="$4"
          >
            <XStack
              backgroundColor="#0D1221"
              borderRadius="$10"
              padding="$1"
              borderWidth={1}
              borderColor="#1A2744"
              gap="$1"
            >
              <TouchableOpacity
                onPress={() => setActiveTab('active')}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: activeTab === 'active' ? '#FFD700' : 'transparent',
                }}
              >
                <SizableText
                  size="$3"
                  fontWeight="800"
                  color={activeTab === 'active' ? '#0A0E1A' : '#8B9AB1'}
                >
                  Active ({openIssues.length})
                </SizableText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('upcoming')}
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: activeTab === 'upcoming' ? '#FFD700' : 'transparent',
                }}
              >
                <SizableText
                  size="$3"
                  fontWeight="800"
                  color={activeTab === 'upcoming' ? '#0A0E1A' : '#8B9AB1'}
                >
                  Upcoming ({upcomingIssues.length})
                </SizableText>
              </TouchableOpacity>
            </XStack>
          </XStack>

          {/* ── Loading state ── */}
          {isLoadingIssues && (
            <YStack alignItems="center" paddingVertical="$6" gap="$3">
              <ActivityIndicator size="large" color="#FFD700" />
              <SizableText size="$3" color="#8B9AB1">Loading issues…</SizableText>
            </YStack>
          )}

          {/* ── Active Issues ── */}
          {activeTab === 'active' && !isLoadingIssues && (
            <YStack paddingHorizontal="$4">
              {openIssues.length === 0 ? (
                <YStack
                  paddingVertical="$8"
                  alignItems="center"
                  gap="$4"
                  backgroundColor="#0D1221"
                  borderRadius="$5"
                  borderWidth={1}
                  borderColor="#1A2744"
                  padding="$6"
                >
                  <YStack
                    width={72}
                    height={72}
                    borderRadius={36}
                    backgroundColor="#1A2744"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <TrendingUp size={36} color="#8B9AB1" />
                  </YStack>
                  <YStack alignItems="center" gap="$2">
                    <SizableText size="$5" fontWeight="800" color="#FFFFFF">No Active IPOs</SizableText>
                    <Paragraph size="$3" color="#8B9AB1" textAlign="center">
                      Check back when new issues open. We'll notify you of new opportunities.
                    </Paragraph>
                  </YStack>
                  <Button
                    size="$4"
                    chromeless
                    borderWidth={1}
                    borderColor="#1A2744"
                    borderRadius="$3"
                    onPress={handleRefresh}
                  >
                    <XStack alignItems="center" gap="$2">
                      <RefreshCw size={14} color="#8B9AB1" />
                      <SizableText size="$3" color="#8B9AB1">Check Again</SizableText>
                    </XStack>
                  </Button>
                </YStack>
              ) : (
                openIssues.map((issue) => (
                  <ActiveIssueCard
                    key={issue.id}
                    issue={issue}
                    onBulkApply={() => openBulkModal(issue)}
                    onSingleApply={() => openBulkModal(issue)}
                  />
                ))
              )}
            </YStack>
          )}

          {/* ── Upcoming Issues ── */}
          {activeTab === 'upcoming' && !isLoadingIssues && (
            <YStack paddingHorizontal="$4">
              {upcomingIssues.length === 0 ? (
                <YStack
                  paddingVertical="$8"
                  alignItems="center"
                  gap="$4"
                  backgroundColor="#0D1221"
                  borderRadius="$5"
                  borderWidth={1}
                  borderColor="#1A2744"
                  padding="$6"
                >
                  <Clock size={48} color="#8B9AB1" />
                  <YStack alignItems="center" gap="$2">
                    <SizableText size="$5" fontWeight="800" color="#FFFFFF">No Upcoming IPOs</SizableText>
                    <Paragraph size="$3" color="#8B9AB1" textAlign="center">
                      No upcoming issues at the moment.
                    </Paragraph>
                  </YStack>
                </YStack>
              ) : (
                upcomingIssues.map((issue) => (
                  <UpcomingIssueCard key={issue.id} issue={issue} />
                ))
              )}
            </YStack>
          )}

          {/* ── My Applications ── */}
          {applications.length > 0 && (
            <YStack paddingHorizontal="$4" marginTop="$5">
              <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
                <XStack alignItems="center" gap="$2">
                  <CheckCircle2 size={16} color="#FFD700" />
                  <H3 color="#FFFFFF" fontWeight="800">My Applications</H3>
                </XStack>
                <Button
                  size="$3"
                  backgroundColor="transparent"
                  color="#FFD700"
                  fontWeight="700"
                  borderRadius="$3"
                  borderWidth={1}
                  borderColor="#FFD700"
                  pressStyle={{ opacity: 0.7, backgroundColor: '#FFD70010' }}
                  onPress={() => useIPOStore.getState().checkResults()}
                >
                  <XStack alignItems="center" gap="$1">
                    <RefreshCw size={12} color="#FFD700" />
                    <SizableText size="$2" color="#FFD700" fontWeight="700">Check Results</SizableText>
                  </XStack>
                </Button>
              </XStack>

              <YStack>
                {applications.slice().reverse().map((app) => (
                  <ApplicationRow key={app.id} app={app} />
                ))}
              </YStack>
            </YStack>
          )}

          {/* ── Error state ── */}
          {ipoError && (
            <XStack
              marginHorizontal="$4"
              marginTop="$3"
              backgroundColor="#EF444420"
              borderRadius="$3"
              padding="$3"
              alignItems="center"
              gap="$2"
              borderWidth={1}
              borderColor="#EF444440"
            >
              <AlertCircle size={16} color="#EF4444" />
              <SizableText size="$2" color="#EF4444" flex={1}>{ipoError}</SizableText>
              <Button
                size="$2"
                chromeless
                onPress={() => useIPOStore.getState().clearError()}
              >
                <X size={14} color="#EF4444" />
              </Button>
            </XStack>
          )}

        </YStack>
      </ScrollView>

      {/* ── Bulk Apply Modal ── */}
      <BulkApplyModal
        visible={modalVisible}
        issue={selectedIssue}
        accounts={accounts}
        onClose={() => setModalVisible(false)}
        onApply={useIPOStore.getState().applyBulk}
        isApplying={isApplying}
        lastResults={lastBulkResults}
      />

      {/* ── Bulk Check Modal ── */}
      <BulkCheckModal
        visible={checkModalVisible}
        accounts={accounts}
        onClose={() => setCheckModalVisible(false)}
        onCheck={useIPOStore.getState().bulkCheckResults}
        isChecking={isCheckingResults}
      />
    </YStack>
  );
}
