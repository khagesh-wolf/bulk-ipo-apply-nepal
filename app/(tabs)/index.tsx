/**
 * Dashboard Screen — Bulk IPO Apply Nepal
 * Shows NEPSE index, quick stats, active IPOs, market movers, accounts preview.
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
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
  Bell,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Plus,
  Activity,
  Users,
  Layers,
  DollarSign,
  Zap,
} from '@blinkdotnew/mobile-ui';
import { useShallow } from 'zustand/react/shallow';
import { useMarketStore, useAccountStore, useIPOStore, selectTopNGainers, selectOpenIssues, selectUpcomingIssues } from '@/store';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_00_00_00_000) return `${(n / 1_00_00_00_000).toFixed(2)} B`;
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(2)} L`;
  return n.toLocaleString();
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatTime(isoString: string | null): string {
  if (!isoString) return 'Just now';
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── Pulsing Live Dot ────────────────────────────────────────────────────────

function LiveDot() {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#22C55E',
        opacity,
      }}
    />
  );
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
      paddingVertical="$1"
      borderRadius="$10"
      borderWidth={1}
      borderColor={color}
    >
      <SizableText size="$1" color={color} fontWeight="700">
        {type}
      </SizableText>
    </YStack>
  );
}

// ─── IPO Horizontal Card ─────────────────────────────────────────────────────

function IPOCard({ issue, onApply }: { issue: any; onApply: () => void }) {
  const days = daysUntil(issue.closeDate);
  return (
    <Card
      backgroundColor="#1A2744"
      borderRadius="$4"
      padding="$4"
      marginRight="$3"
      width={220}
      borderWidth={1}
      borderColor="#2A3A5C"
      elevation={4}
    >
      <YStack gap="$2" flex={1}>
        <XStack alignItems="center" justifyContent="space-between">
          <ShareTypeBadge type={issue.shareType} />
          {days <= 3 && (
            <YStack paddingHorizontal="$2" paddingVertical="$1" borderRadius="$10" backgroundColor="#EF444420">
              <SizableText size="$1" color="#EF4444" fontWeight="700">Closing soon</SizableText>
            </YStack>
          )}
        </XStack>

        <SizableText size="$3" fontWeight="800" color="#FFFFFF" numberOfLines={2}>
          {issue.companyName}
        </SizableText>

        <XStack alignItems="center" gap="$1">
          <SizableText size="$2" color="#8B9AB1">{issue.symbol}</SizableText>
        </XStack>

        <Separator borderColor="#2A3A5C" />

        <XStack justifyContent="space-between" alignItems="center">
          <YStack>
            <SizableText size="$1" color="#8B9AB1">Closes in</SizableText>
            <SizableText size="$2" color={days <= 3 ? '#EF4444' : '#FFD700'} fontWeight="700">
              {days} day{days !== 1 ? 's' : ''}
            </SizableText>
          </YStack>
          <YStack alignItems="flex-end">
            <SizableText size="$1" color="#8B9AB1">Per unit</SizableText>
            <SizableText size="$2" color="#FFFFFF" fontWeight="700">Rs. {issue.pricePerUnit}</SizableText>
          </YStack>
        </XStack>

        <Button
          size="$3"
          backgroundColor="#FFD700"
          color="#0A0E1A"
          fontWeight="800"
          borderRadius="$3"
          pressStyle={{ opacity: 0.8, scale: 0.97 }}
          onPress={onApply}
        >
          Apply Now
        </Button>
      </YStack>
    </Card>
  );
}

// ─── Market Mover Row ────────────────────────────────────────────────────────

function MoverRow({ stock }: { stock: any }) {
  const isPositive = stock.changePercent >= 0;
  return (
    <XStack
      paddingVertical="$3"
      paddingHorizontal="$3"
      alignItems="center"
      justifyContent="space-between"
      backgroundColor="#0D1221"
      borderRadius="$3"
      borderWidth={1}
      borderColor="#1A2744"
    >
      <XStack alignItems="center" gap="$3" flex={1}>
        <YStack
          width={40}
          height={40}
          borderRadius="$3"
          backgroundColor="#1A2744"
          alignItems="center"
          justifyContent="center"
        >
          <SizableText size="$2" fontWeight="800" color="#FFD700">
            {stock.symbol.slice(0, 3)}
          </SizableText>
        </YStack>
        <YStack flex={1}>
          <SizableText size="$3" fontWeight="700" color="#FFFFFF">{stock.symbol}</SizableText>
          <SizableText size="$1" color="#8B9AB1" numberOfLines={1}>{stock.companyName}</SizableText>
        </YStack>
      </XStack>

      <YStack alignItems="flex-end" gap="$1">
        <SizableText size="$3" fontWeight="700" color="#FFFFFF">
          Rs. {stock.ltp?.toLocaleString()}
        </SizableText>
        <XStack
          paddingHorizontal="$2"
          paddingVertical="$0.5"
          borderRadius="$10"
          backgroundColor={isPositive ? '#22C55E20' : '#EF444420'}
          alignItems="center"
          gap="$1"
        >
          {isPositive
            ? <TrendingUp size={10} color="#22C55E" />
            : <TrendingDown size={10} color="#EF4444" />
          }
          <SizableText
            size="$1"
            fontWeight="700"
            color={isPositive ? '#22C55E' : '#EF4444'}
          >
            {isPositive ? '+' : ''}{stock.changePercent?.toFixed(2)}%
          </SizableText>
        </XStack>
      </YStack>
    </XStack>
  );
}

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function SkeletonBox({ width, height, borderRadius = 6 }: { width: number | string; height: number; borderRadius?: number }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#1A2744',
        opacity,
      }}
    />
  );
}

// ─── Main Dashboard Screen ───────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const topPad = Platform.OS === 'ios' ? 50 : 30;

  // Subscribe to specific state slices instead of entire stores to prevent
  // unnecessary re-renders (fixes "Maximum update depth exceeded" error).
  const { nepseIndex: nepse, isLoading: isMarketLoading, lastUpdated } = useMarketStore(
    useShallow((s) => ({
      nepseIndex: s.nepseIndex,
      isLoading: s.isLoading,
      lastUpdated: s.lastUpdated,
    })),
  );
  const accounts = useAccountStore((s) => s.accounts);

  // Memoize parameterized selectors so a new function isn't created each render.
  const topGainersSelector = useMemo(() => selectTopNGainers(3), []);
  const topGainers = useMarketStore(useShallow(topGainersSelector));
  const openIssues = useIPOStore(useShallow(selectOpenIssues));

  // Use ref to ensure data is fetched only once on mount.
  const dataFetched = useRef(false);
  useEffect(() => {
    if (dataFetched.current) return;
    dataFetched.current = true;

    // Call store methods via getState() so the component doesn't need to
    // subscribe to the methods (which are stable but cause whole-object
    // subscriptions when obtained from the hook return value).
    useMarketStore.getState().fetchMarketData();
    useAccountStore.getState().loadAccounts();
  }, []);

  const isMarketUp = (nepse?.change ?? 0) >= 0;
  const changeColor = isMarketUp ? '#22C55E' : '#EF4444';
  const changeSign = isMarketUp ? '+' : '';

  return (
    <YStack flex={1} backgroundColor="#0A0E1A">
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack style={{ paddingTop: topPad }} paddingBottom="$8">

          {/* ── Header ── */}
          <XStack
            paddingHorizontal="$4"
            paddingVertical="$3"
            alignItems="center"
            justifyContent="space-between"
          >
            <YStack>
              <SizableText size="$6" fontWeight="900" color="#FFD700" letterSpacing={-0.5}>
                IPO Nepal
              </SizableText>
              <SizableText size="$2" color="#8B9AB1" fontWeight="500">
                NEPSE Investor Hub
              </SizableText>
            </YStack>

            <Button
              size="$4"
              circular
              chromeless
              pressStyle={{ opacity: 0.7 }}
              onPress={() => {}}
            >
              <Bell size={22} color="#8B9AB1" />
            </Button>
          </XStack>

          {/* ── NEPSE Index Card ── */}
          <YStack paddingHorizontal="$4" marginBottom="$4">
            <Card
              backgroundColor="#1A2744"
              borderRadius="$5"
              padding="$5"
              borderWidth={1}
              borderColor="#2A3A5C"
              elevation={4}
            >
              {isMarketLoading ? (
                <YStack gap="$3">
                  <SkeletonBox width={120} height={14} />
                  <SkeletonBox width={200} height={42} />
                  <SkeletonBox width={160} height={18} />
                </YStack>
              ) : (
                <YStack gap="$3">
                  {/* Label + Live */}
                  <XStack alignItems="center" justifyContent="space-between">
                    <SizableText size="$2" color="#8B9AB1" fontWeight="600" letterSpacing={1}>
                      NEPSE INDEX
                    </SizableText>
                    <XStack alignItems="center" gap="$2">
                      <LiveDot />
                      <SizableText size="$1" color="#22C55E" fontWeight="700">LIVE</SizableText>
                    </XStack>
                  </XStack>

                  {/* Big value */}
                  <H2
                    color="#FFFFFF"
                    fontWeight="900"
                    style={{ fontSize: 40, lineHeight: 44, letterSpacing: -1 }}
                  >
                    {(nepse?.currentValue ?? 2847.16).toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </H2>

                  {/* Change row */}
                  <XStack alignItems="center" gap="$3">
                    <XStack
                      paddingHorizontal="$3"
                      paddingVertical="$1"
                      borderRadius="$10"
                      backgroundColor={isMarketUp ? '#22C55E20' : '#EF444420'}
                      alignItems="center"
                      gap="$2"
                    >
                      {isMarketUp
                        ? <TrendingUp size={14} color={changeColor} />
                        : <TrendingDown size={14} color={changeColor} />
                      }
                      <SizableText size="$3" fontWeight="800" color={changeColor}>
                        {changeSign}{(nepse?.change ?? 18.42).toFixed(2)}
                      </SizableText>
                      <SizableText size="$2" fontWeight="700" color={changeColor}>
                        ({changeSign}{(nepse?.changePercent ?? 0.65).toFixed(2)}%)
                      </SizableText>
                    </XStack>
                  </XStack>

                  <Separator borderColor="#2A3A5C" />

                  {/* Sub stats */}
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack>
                      <SizableText size="$1" color="#8B9AB1">Turnover</SizableText>
                      <SizableText size="$2" color="#FFFFFF" fontWeight="700">
                        Rs. {formatNumber((nepse?.turnover ?? 4.82) * 1_00_00_000)} 
                      </SizableText>
                    </YStack>
                    <YStack alignItems="center">
                      <SizableText size="$1" color="#8B9AB1">High</SizableText>
                      <SizableText size="$2" color="#22C55E" fontWeight="700">
                        {(nepse?.high ?? 2855.0).toFixed(2)}
                      </SizableText>
                    </YStack>
                    <YStack alignItems="flex-end">
                      <SizableText size="$1" color="#8B9AB1">Updated</SizableText>
                      <SizableText size="$2" color="#FFFFFF" fontWeight="700">
                        {formatTime(lastUpdated)}
                      </SizableText>
                    </YStack>
                  </XStack>
                </YStack>
              )}
            </Card>
          </YStack>

          {/* ── Quick Stats Row ── */}
          <XStack paddingHorizontal="$4" gap="$3" marginBottom="$5">
            {/* Accounts */}
            <Card
              flex={1}
              backgroundColor="#0D1221"
              borderRadius="$4"
              padding="$3"
              borderWidth={1}
              borderColor="#1A2744"
              elevation={4}
              pressStyle={{ opacity: 0.85 }}
              onPress={() => router.push('/(tabs)/settings')}
            >
              <YStack alignItems="center" gap="$1">
                <YStack
                  width={36}
                  height={36}
                  borderRadius="$3"
                  backgroundColor="#1A2744"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Users size={18} color="#FFD700" />
                </YStack>
                <SizableText size="$5" fontWeight="900" color="#FFFFFF">
                  {accounts.length}
                </SizableText>
                <SizableText size="$1" color="#8B9AB1" textAlign="center">Accounts</SizableText>
              </YStack>
            </Card>

            {/* Active IPOs */}
            <Card
              flex={1}
              backgroundColor="#0D1221"
              borderRadius="$4"
              padding="$3"
              borderWidth={1}
              borderColor="#1A2744"
              elevation={4}
              pressStyle={{ opacity: 0.85 }}
              onPress={() => router.push('/(tabs)/ipo')}
            >
              <YStack alignItems="center" gap="$1">
                <YStack
                  width={36}
                  height={36}
                  borderRadius="$3"
                  backgroundColor="#1A2744"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Layers size={18} color="#22C55E" />
                </YStack>
                <SizableText size="$5" fontWeight="900" color="#FFFFFF">
                  {openIssues.length}
                </SizableText>
                <SizableText size="$1" color="#8B9AB1" textAlign="center">Active IPOs</SizableText>
              </YStack>
            </Card>

            {/* Portfolio */}
            <Card
              flex={1}
              backgroundColor="#0D1221"
              borderRadius="$4"
              padding="$3"
              borderWidth={1}
              borderColor="#1A2744"
              elevation={4}
              pressStyle={{ opacity: 0.85 }}
              onPress={() => router.push('/(tabs)/portfolio')}
            >
              <YStack alignItems="center" gap="$1">
                <YStack
                  width={36}
                  height={36}
                  borderRadius="$3"
                  backgroundColor="#1A2744"
                  alignItems="center"
                  justifyContent="center"
                >
                  <DollarSign size={18} color="#3B82F6" />
                </YStack>
                <SizableText size="$3" fontWeight="900" color="#FFFFFF">Rs.0</SizableText>
                <SizableText size="$1" color="#8B9AB1" textAlign="center">Portfolio</SizableText>
              </YStack>
            </Card>
          </XStack>

          {/* ── Active IPOs Horizontal Scroll ── */}
          <YStack marginBottom="$5">
            <XStack
              paddingHorizontal="$4"
              alignItems="center"
              justifyContent="space-between"
              marginBottom="$3"
            >
              <XStack alignItems="center" gap="$2">
                <Zap size={16} color="#FFD700" />
                <H3 color="#FFFFFF" fontWeight="800">Active IPOs</H3>
              </XStack>
              <Button
                chromeless
                size="$3"
                pressStyle={{ opacity: 0.7 }}
                onPress={() => router.push('/(tabs)/ipo')}
              >
                <XStack alignItems="center" gap="$1">
                  <SizableText size="$2" color="#FFD700">View All</SizableText>
                  <ChevronRight size={14} color="#FFD700" />
                </XStack>
              </Button>
            </XStack>

            {openIssues.length === 0 ? (
              <YStack
                marginHorizontal="$4"
                padding="$6"
                backgroundColor="#0D1221"
                borderRadius="$4"
                borderWidth={1}
                borderColor="#1A2744"
                alignItems="center"
                gap="$2"
              >
                <TrendingUp size={32} color="#8B9AB1" />
                <SizableText size="$3" color="#8B9AB1" textAlign="center">
                  No active IPOs right now
                </SizableText>
              </YStack>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                paddingLeft="$4"
                paddingRight="$2"
              >
                {openIssues.map((issue) => (
                  <IPOCard
                    key={issue.id}
                    issue={issue}
                    onApply={() => router.push('/(tabs)/ipo')}
                  />
                ))}
              </ScrollView>
            )}
          </YStack>

          {/* ── Top Gainers ── */}
          <YStack paddingHorizontal="$4" marginBottom="$5">
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
              <XStack alignItems="center" gap="$2">
                <TrendingUp size={16} color="#22C55E" />
                <H3 color="#FFFFFF" fontWeight="800">Top Gainers Today</H3>
              </XStack>
              <Button
                chromeless
                size="$3"
                pressStyle={{ opacity: 0.7 }}
                onPress={() => router.push('/(tabs)/market')}
              >
                <XStack alignItems="center" gap="$1">
                  <SizableText size="$2" color="#FFD700">See more</SizableText>
                  <ChevronRight size={14} color="#FFD700" />
                </XStack>
              </Button>
            </XStack>

            {isMarketLoading ? (
              <YStack gap="$2">
                {[0, 1, 2].map((i) => (
                  <SkeletonBox key={i} width="100%" height={64} borderRadius={12} />
                ))}
              </YStack>
            ) : (
              <YStack gap="$2">
                {topGainers.map((stock) => (
                  <MoverRow key={stock.symbol} stock={stock} />
                ))}
              </YStack>
            )}
          </YStack>

          {/* ── My Accounts Preview ── */}
          <YStack paddingHorizontal="$4" marginBottom="$4">
            <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
              <XStack alignItems="center" gap="$2">
                <Users size={16} color="#FFD700" />
                <H3 color="#FFFFFF" fontWeight="800">My Accounts</H3>
              </XStack>
              <Button
                chromeless
                size="$3"
                pressStyle={{ opacity: 0.7 }}
                onPress={() => router.push('/(tabs)/settings')}
              >
                <XStack alignItems="center" gap="$1">
                  <SizableText size="$2" color="#FFD700">Manage</SizableText>
                  <ChevronRight size={14} color="#FFD700" />
                </XStack>
              </Button>
            </XStack>

            {accounts.length === 0 ? (
              <Card
                backgroundColor="#0D1221"
                borderRadius="$4"
                padding="$5"
                borderWidth={1}
                borderColor="#1A2744"
                elevation={4}
              >
                <YStack alignItems="center" gap="$3">
                  <YStack
                    width={56}
                    height={56}
                    borderRadius="$10"
                    backgroundColor="#1A2744"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Users size={28} color="#8B9AB1" />
                  </YStack>
                  <YStack alignItems="center" gap="$1">
                    <SizableText size="$4" fontWeight="700" color="#FFFFFF" textAlign="center">
                      No accounts added yet
                    </SizableText>
                    <Paragraph size="$2" color="#8B9AB1" textAlign="center">
                      Add your first MeroShare account to start applying for IPOs
                    </Paragraph>
                  </YStack>
                  <Button
                    size="$4"
                    backgroundColor="#FFD700"
                    color="#0A0E1A"
                    fontWeight="800"
                    borderRadius="$3"
                    pressStyle={{ opacity: 0.8 }}
                    onPress={() => router.push('/(tabs)/settings')}
                    iconAfter={<Plus size={16} color="#0A0E1A" />}
                  >
                    Add Account
                  </Button>
                </YStack>
              </Card>
            ) : (
              <YStack gap="$2">
                {accounts.slice(0, 3).map((acc) => (
                  <Card
                    key={acc.id}
                    backgroundColor="#0D1221"
                    borderRadius="$4"
                    padding="$4"
                    borderWidth={1}
                    borderColor="#1A2744"
                    elevation={4}
                    pressStyle={{ opacity: 0.85 }}
                  >
                    <XStack alignItems="center" gap="$3">
                      <YStack
                        width={44}
                        height={44}
                        borderRadius="$10"
                        backgroundColor="#1A2744"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <SizableText size="$4" fontWeight="900" color="#FFD700">
                          {acc.nickname?.charAt(0)?.toUpperCase() ?? 'A'}
                        </SizableText>
                      </YStack>
                      <YStack flex={1}>
                        <SizableText size="$3" fontWeight="700" color="#FFFFFF">
                          {acc.nickname}
                        </SizableText>
                        <SizableText size="$2" color="#8B9AB1">
                          DP: {'*'.repeat(7)}{acc.dpId?.slice(-4) ?? '****'}
                        </SizableText>
                      </YStack>
                      <YStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$10"
                        backgroundColor={acc.isActive ? '#22C55E20' : '#8B9AB120'}
                      >
                        <SizableText size="$1" color={acc.isActive ? '#22C55E' : '#8B9AB1'} fontWeight="700">
                          {acc.isActive ? 'Active' : 'Inactive'}
                        </SizableText>
                      </YStack>
                    </XStack>
                  </Card>
                ))}
                {accounts.length > 3 && (
                  <Button
                    size="$3"
                    chromeless
                    onPress={() => router.push('/(tabs)/settings')}
                  >
                    <SizableText size="$2" color="#8B9AB1">
                      +{accounts.length - 3} more accounts
                    </SizableText>
                  </Button>
                )}
              </YStack>
            )}
          </YStack>

        </YStack>
      </ScrollView>
    </YStack>
  );
}
