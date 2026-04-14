/**
 * Portfolio Screen — Bulk IPO Apply Nepal
 * Shows holdings summary, individual stock cards, WACC bars, and dividends.
 * Displays real portfolio data from accounts; shows empty state when no data.
 */

import { useState, useEffect, useRef } from 'react';
import { Platform, Pressable } from 'react-native';
import {
  YStack,
  XStack,
  Card,
  Button,
  SizableText,
  H2,
  H3,
  ScrollView,
  Separator,
  Theme,
} from '@blinkdotnew/mobile-ui';
import {
  Briefcase,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Gift,
  Plus,
} from '@blinkdotnew/mobile-ui';
import { useRouter } from 'expo-router';
import { useAccountStore } from '@/store';

// ─── Design tokens ───────────────────────────────────────────────────────────
const BG = '#0A0E1A';
const CARD_BG = '#0D1221';
const SURFACE = '#1A2744';
const GOLD = '#FFD700';
const POSITIVE = '#22C55E';
const NEGATIVE = '#EF4444';
const MUTED = '#8B9AB1';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: number) {
  return n.toLocaleString('en-IN');
}

function fmtCurrency(n: number) {
  return `Rs. ${fmtNum(Math.abs(Math.round(n)))}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children, badge }: { children: string; badge?: number }) {
  return (
    <XStack alignItems="center" gap="$2" marginBottom="$3">
      <SizableText size="$5" fontWeight="700" color="white">
        {children}
      </SizableText>
      {badge !== undefined && (
        <XStack
          backgroundColor={SURFACE}
          paddingHorizontal="$2"
          paddingVertical="$0.5"
          borderRadius="$10"
        >
          <SizableText size="$2" color={GOLD} fontWeight="700">
            {badge}
          </SizableText>
        </XStack>
      )}
    </XStack>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PortfolioScreen() {
  const accounts = useAccountStore((s) => s.accounts);
  const router = useRouter();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const activeAccount = selectedAccount
    ? accounts.find((a) => a.id === selectedAccount)
    : null;
  const accountLabel = activeAccount?.nickname ?? 'All Accounts';

  const topPad = Platform.OS === 'ios' ? 50 : Platform.OS === 'web' ? 20 : 30;

  return (
    <YStack flex={1} backgroundColor={BG}>
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$0" style={{ paddingTop: topPad }}>

          {/* ── Header ── */}
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
            <XStack alignItems="center" gap="$2">
              <Briefcase size={22} color={GOLD} />
              <H2 color="white" fontWeight="800">Portfolio</H2>
            </XStack>
            <Pressable
              onPress={() => setSelectedAccount(null)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <XStack
                backgroundColor={SURFACE}
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$4"
                alignItems="center"
                gap="$1.5"
                borderWidth={1}
                borderColor={GOLD + '33'}
              >
                <SizableText size="$3" color={GOLD} fontWeight="600" numberOfLines={1} maxWidth={120}>
                  {accountLabel}
                </SizableText>
                <ChevronRight size={14} color={GOLD} />
              </XStack>
            </Pressable>
          </XStack>

          {/* ── Empty State ── */}
          {accounts.length === 0 ? (
            <Card
              backgroundColor={SURFACE}
              borderRadius="$5"
              padding="$6"
              marginBottom="$5"
              borderWidth={1}
              borderColor={GOLD + '22'}
              alignItems="center"
            >
              <Briefcase size={48} color={MUTED} />
              <SizableText
                size="$5"
                fontWeight="700"
                color="white"
                marginTop="$3"
                textAlign="center"
              >
                No Portfolio Data
              </SizableText>
              <SizableText
                size="$3"
                color={MUTED}
                marginTop="$2"
                textAlign="center"
                lineHeight={22}
              >
                Add your MeroShare accounts to view your portfolio holdings, P&amp;L, and dividends.
              </SizableText>
              <Pressable
                onPress={() => router.push('/account/add')}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: GOLD,
                  borderRadius: 12,
                  paddingHorizontal: 24,
                  paddingVertical: 14,
                  marginTop: 16,
                })}
              >
                <Plus size={16} color="#0A0E1A" />
                <SizableText size="$3" fontWeight="800" color="#0A0E1A">
                  Add Account
                </SizableText>
              </Pressable>
            </Card>
          ) : (
            <>
              {/* ── Summary Card ── */}
              <Card
                backgroundColor={SURFACE}
                borderRadius="$5"
                padding="$5"
                marginBottom="$5"
                borderWidth={1}
                borderColor={GOLD + '22'}
              >
                <SizableText size="$3" color={MUTED} marginBottom="$1">
                  Portfolio
                </SizableText>
                <SizableText size="$5" fontWeight="700" color="white" marginBottom="$2">
                  {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
                </SizableText>
                <SizableText size="$3" color={MUTED} lineHeight={22}>
                  Your real portfolio data will be synced from MeroShare when you
                  log in. Holdings, P&amp;L, and dividends will appear here.
                </SizableText>

                <Separator borderColor={GOLD + '22'} marginTop="$4" />

                <XStack justifyContent="space-between" marginTop="$4">
                  <YStack flex={1} alignItems="flex-start">
                    <SizableText size="$2" color={MUTED} marginBottom="$1">Active</SizableText>
                    <SizableText size="$4" fontWeight="700" color={POSITIVE}>
                      {accounts.filter((a) => a.isActive).length}
                    </SizableText>
                  </YStack>
                  <YStack flex={1} alignItems="center">
                    <SizableText size="$2" color={MUTED} marginBottom="$1">Inactive</SizableText>
                    <SizableText size="$4" fontWeight="700" color={MUTED}>
                      {accounts.filter((a) => !a.isActive).length}
                    </SizableText>
                  </YStack>
                  <YStack flex={1} alignItems="flex-end">
                    <SizableText size="$2" color={MUTED} marginBottom="$1">Total</SizableText>
                    <SizableText size="$4" fontWeight="700" color={GOLD}>
                      {accounts.length}
                    </SizableText>
                  </YStack>
                </XStack>
              </Card>

              {/* ── Account List ── */}
              <SectionTitle badge={accounts.length}>Linked Accounts</SectionTitle>
              {accounts.map((account) => (
                <Card
                  key={account.id}
                  backgroundColor={CARD_BG}
                  borderColor={account.isActive ? GOLD + '30' : SURFACE}
                  borderWidth={1}
                  borderRadius="$4"
                  padding="$4"
                  marginBottom="$3"
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack alignItems="center" gap="$3" flex={1}>
                      <XStack
                        backgroundColor={SURFACE}
                        paddingHorizontal="$2.5"
                        paddingVertical="$1.5"
                        borderRadius="$3"
                        borderLeftWidth={3}
                        borderLeftColor={account.isActive ? GOLD : MUTED}
                      >
                        <SizableText size="$2" fontWeight="800" color={account.isActive ? GOLD : MUTED}>
                          {account.nickname.slice(0, 3).toUpperCase()}
                        </SizableText>
                      </XStack>
                      <YStack flex={1}>
                        <SizableText size="$4" fontWeight="700" color="white" numberOfLines={1}>
                          {account.nickname}
                        </SizableText>
                        <SizableText size="$2" color={MUTED}>
                          DP: {account.dpId} · {account.isActive ? 'Active' : 'Inactive'}
                        </SizableText>
                      </YStack>
                    </XStack>
                    <XStack
                      width={10}
                      height={10}
                      borderRadius={5}
                      backgroundColor={account.isActive ? POSITIVE : MUTED}
                    />
                  </XStack>
                </Card>
              ))}
            </>
          )}

        </YStack>
      </ScrollView>
    </YStack>
  );
}
