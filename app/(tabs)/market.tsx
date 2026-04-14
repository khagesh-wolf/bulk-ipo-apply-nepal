/**
 * Market Screen — Bulk IPO Apply Nepal
 * NEPSE index, sub-indices, market movers tabs, broker list.
 */

import { useState, useCallback } from 'react';
import { Platform, Pressable, TextInput } from 'react-native';
import {
  YStack,
  XStack,
  Card,
  Button,
  SizableText,
  H2,
  ScrollView,
  Separator,
} from '@blinkdotnew/mobile-ui';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
} from '@blinkdotnew/mobile-ui';
import { useShallow } from 'zustand/react/shallow';
import { useMarketStore } from '@/store';

// ─── Design tokens ───────────────────────────────────────────────────────────
const BG      = '#0f172a';
const CARD_BG = '#1e293b';
const SURFACE = '#334155';
const GOLD    = '#fbbf24';
const POSITIVE = '#10b981';
const NEGATIVE  = '#ef4444';
const MUTED   = '#94a3b8';

// ─── Market open detection ─────────────────────────────────────────────────
function isMarketOpen(): boolean {
  const now = new Date();
  // Nepal time offset: UTC+5:45
  const nepalOffset = 5 * 60 + 45;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const nepalMinutes = (utcMinutes + nepalOffset) % (24 * 60);
  const day = new Date(now.getTime() + nepalOffset * 60000).getUTCDay();
  // Market open Sun–Thu 11:00–15:00 Nepal time
  if (day === 5 || day === 6) return false; // Fri, Sat
  return nepalMinutes >= 11 * 60 && nepalMinutes < 15 * 60;
}

// ─── Static mock data ─────────────────────────────────────────────────────────
// (removed — now using real store data)

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtTurnover(n: number): string {
  if (n >= 1_000_000_000) return `Rs. ${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `Rs. ${(n / 1_000_000).toFixed(2)}M`;
  return `Rs. ${(n / 1_000).toFixed(1)}K`;
}

function fmtVol(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({
  children,
  right,
}: {
  children: string;
  right?: React.ReactNode;
}) {
  return (
    <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
      <SizableText size="$5" fontWeight="700" color="white">
        {children}
      </SizableText>
      {right}
    </XStack>
  );
}

function SubIndexChip({ item }: { item: { indexName: string; currentValue: number; changePercent: number } }) {
  const up = item.changePercent >= 0;
  const shortName = item.indexName.replace(' Sub-Index', '').replace(' Sub Index', '');
  return (
    <YStack
      backgroundColor={CARD_BG}
      borderColor={SURFACE}
      borderWidth={1}
      borderRadius="$5"
      paddingHorizontal="$4"
      paddingVertical="$3"
      marginRight="$2"
      minWidth={120}
    >
      <SizableText size="$2" color={MUTED} marginBottom="$0.5">
        {shortName}
      </SizableText>
      <SizableText size="$4" fontWeight="800" color="white" marginBottom="$0.5">
        {fmtNum(item.currentValue)}
      </SizableText>
      <XStack alignItems="center" gap="$0.5">
        {up
          ? <ArrowUpRight size={12} color={POSITIVE} />
          : <ArrowDownRight size={12} color={NEGATIVE} />}
        <SizableText size="$2" color={up ? POSITIVE : NEGATIVE} fontWeight="700">
          {up ? '+' : ''}{item.changePercent.toFixed(2)}%
        </SizableText>
      </XStack>
    </YStack>
  );
}

type TabKey = 'gainers' | 'losers' | 'volume' | 'turnover';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'gainers',  label: 'Gainers'  },
  { key: 'losers',   label: 'Losers'   },
  { key: 'volume',   label: 'Volume'   },
  { key: 'turnover', label: 'Turnover' },
];

function TabSwitcher({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <XStack
      backgroundColor={CARD_BG}
      borderRadius="$4"
      padding="$1"
      marginBottom="$3"
      borderWidth={1}
      borderColor={SURFACE}
    >
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            style={{ flex: 1 }}
          >
            <XStack
              backgroundColor={isActive ? SURFACE : 'transparent'}
              borderRadius="$3"
              paddingVertical="$2"
              alignItems="center"
              justifyContent="center"
            >
              <SizableText
                size="$3"
                fontWeight={isActive ? '700' : '500'}
                color={isActive ? GOLD : MUTED}
              >
                {t.label}
              </SizableText>
            </XStack>
          </Pressable>
        );
      })}
    </XStack>
  );
}

function StockRow({
  stock,
  metric,
}: {
  stock: { symbol: string; companyName: string; ltp: number; changePercent: number; volume: number; turnover: number };
  metric: TabKey;
}) {
  const up = stock.changePercent >= 0;
  const plColor = up ? POSITIVE : NEGATIVE;

  const metricLabel =
    metric === 'volume'   ? `Vol: ${fmtVol(stock.volume)}` :
    metric === 'turnover' ? `T/O: ${fmtTurnover(stock.turnover)}` :
    `Vol: ${fmtVol(stock.volume)}`;

  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      paddingVertical="$3"
      borderBottomWidth={1}
      borderBottomColor={SURFACE}
    >
      <XStack alignItems="center" gap="$3" flex={1}>
        <XStack
          backgroundColor={SURFACE}
          paddingHorizontal="$2.5"
          paddingVertical="$1.5"
          borderRadius="$3"
          borderLeftWidth={3}
          borderLeftColor={up ? POSITIVE : NEGATIVE}
          minWidth={56}
          justifyContent="center"
        >
          <SizableText size="$2" fontWeight="800" color="white">
            {stock.symbol}
          </SizableText>
        </XStack>
        <YStack flex={1}>
          <SizableText size="$3" fontWeight="600" color="white" numberOfLines={1}>
            {stock.companyName}
          </SizableText>
          <SizableText size="$2" color={MUTED}>{metricLabel}</SizableText>
        </YStack>
      </XStack>
      <YStack alignItems="flex-end">
        <SizableText size="$4" fontWeight="700" color="white">
          Rs. {fmtNum(stock.ltp)}
        </SizableText>
        <XStack
          backgroundColor={up ? '#1A3A2A' : '#3A1A1A'}
          paddingHorizontal="$2"
          paddingVertical="$0.5"
          borderRadius="$3"
          alignItems="center"
          gap="$0.5"
        >
          {up
            ? <ArrowUpRight size={11} color={POSITIVE} />
            : <ArrowDownRight size={11} color={NEGATIVE} />}
          <SizableText size="$2" color={plColor} fontWeight="700">
            {up ? '+' : ''}{stock.changePercent.toFixed(2)}%
          </SizableText>
        </XStack>
      </YStack>
    </XStack>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MarketScreen() {
  const {
    nepseIndex,
    subIndices,
    topGainers,
    topLosers,
    highestTurnover,
    isLoading,
  } = useMarketStore(
    useShallow((s) => ({
      nepseIndex: s.nepseIndex,
      subIndices: s.subIndices,
      topGainers: s.topGainers,
      topLosers: s.topLosers,
      highestTurnover: s.highestTurnover,
      isLoading: s.isLoading,
    })),
  );

  const [activeTab, setActiveTab]   = useState<TabKey>('gainers');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing]   = useState(false);

  const marketOpen = isMarketOpen();
  const topPad     = Platform.OS === 'ios' ? 50 : Platform.OS === 'web' ? 20 : 30;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await useMarketStore.getState().fetchMarketData();
    setRefreshing(false);
  }, []);

  // Build the list shown for active tab
  const moversData = (() => {
    switch (activeTab) {
      case 'gainers':  return topGainers.slice(0, 5);
      case 'losers':   return topLosers.slice(0, 5);
      case 'volume':   return [...topGainers, ...topLosers]
                         .sort((a, b) => b.volume - a.volume)
                         .slice(0, 5);
      case 'turnover': return highestTurnover.slice(0, 5);
    }
  })();

  // Filter by search
  const filteredMovers = searchQuery.trim()
    ? moversData.filter(
        (s) =>
          s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.companyName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : moversData;

  const changeIsUp = (nepseIndex?.change ?? 0) >= 0;

  return (
    <YStack flex={1} backgroundColor={BG}>
      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$0" style={{ paddingTop: topPad }}>

          {/* ── Header ── */}
          <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$4">
            <YStack>
              <XStack alignItems="center" gap="$2">
                <BarChart2 size={22} color={GOLD} />
                <H2 color="white" fontWeight="800">Market</H2>
              </XStack>
              <XStack alignItems="center" gap="$1.5" marginTop="$1">
                <XStack
                  width={8}
                  height={8}
                  borderRadius="$10"
                  backgroundColor={marketOpen ? POSITIVE : NEGATIVE}
                />
                <SizableText size="$3" color={marketOpen ? POSITIVE : NEGATIVE} fontWeight="600">
                  Market {marketOpen ? 'Open' : 'Closed'}
                </SizableText>
              </XStack>
            </YStack>
            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, marginTop: 6 })}
            >
              <XStack
                backgroundColor={SURFACE}
                width={40}
                height={40}
                borderRadius="$4"
                alignItems="center"
                justifyContent="center"
                borderWidth={1}
                borderColor={GOLD + '33'}
              >
                <RefreshCw
                  size={18}
                  color={GOLD}
                  style={refreshing ? { opacity: 0.5 } : {}}
                />
              </XStack>
            </Pressable>
          </XStack>

          {/* ── NEPSE Index Card ── */}
          <Card
            backgroundColor={SURFACE}
            borderRadius="$5"
            padding="$5"
            marginBottom="$5"
            borderWidth={1}
            borderColor={GOLD + '22'}
          >
            <XStack alignItems="flex-start" justifyContent="space-between" marginBottom="$3">
              <YStack>
                <SizableText size="$3" color={MUTED} marginBottom="$1">
                  NEPSE Index
                </SizableText>
                <SizableText size="$8" fontWeight="800" color="white">
                  {nepseIndex ? fmtNum(nepseIndex.currentValue) : '—'}
                </SizableText>
              </YStack>
              <XStack
                backgroundColor={changeIsUp ? '#1A3A2A' : '#3A1A1A'}
                paddingHorizontal="$3"
                paddingVertical="$2"
                borderRadius="$4"
                alignItems="center"
                gap="$1"
              >
                {changeIsUp
                  ? <TrendingUp size={16} color={POSITIVE} />
                  : <TrendingDown size={16} color={NEGATIVE} />}
                <SizableText size="$4" fontWeight="700" color={changeIsUp ? POSITIVE : NEGATIVE}>
                  {changeIsUp ? '+' : ''}{nepseIndex ? fmtNum(nepseIndex.change) : '0.00'}
                </SizableText>
              </XStack>
            </XStack>

            <XStack alignItems="center" gap="$1" marginBottom="$4">
              <SizableText size="$3" color={changeIsUp ? POSITIVE : NEGATIVE} fontWeight="600">
                ({changeIsUp ? '+' : ''}{nepseIndex?.changePercent?.toFixed(2) ?? '0.00'}%)
              </SizableText>
            </XStack>

            <Separator borderColor={GOLD + '22'} />

            <XStack justifyContent="space-between" marginTop="$4" flexWrap="wrap" gap="$2">
              <YStack>
                <SizableText size="$2" color={MUTED}>Turnover</SizableText>
                <SizableText size="$3" fontWeight="700" color="white">
                  {nepseIndex ? fmtTurnover(nepseIndex.turnover) : '—'}
                </SizableText>
              </YStack>
              <YStack>
                <SizableText size="$2" color={MUTED}>High</SizableText>
                <SizableText size="$3" fontWeight="700" color={POSITIVE}>
                  {nepseIndex ? fmtNum(nepseIndex.high) : '—'}
                </SizableText>
              </YStack>
              <YStack>
                <SizableText size="$2" color={MUTED}>Low</SizableText>
                <SizableText size="$3" fontWeight="700" color={NEGATIVE}>
                  {nepseIndex ? fmtNum(nepseIndex.low) : '—'}
                </SizableText>
              </YStack>
              <YStack>
                <SizableText size="$2" color={MUTED}>Listed</SizableText>
                <SizableText size="$3" fontWeight="700" color="white">228</SizableText>
              </YStack>
              <YStack>
                <SizableText size="$2" color={MUTED}>Traded</SizableText>
                <SizableText size="$3" fontWeight="700" color="white">196</SizableText>
              </YStack>
            </XStack>
          </Card>

          {/* ── Sub-Indices ── */}
          <SectionTitle>Sub-Indices</SectionTitle>
          {subIndices.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 20 }}
            >
              <XStack paddingBottom="$1">
                {subIndices.map((idx) => (
                  <SubIndexChip key={idx.indexName} item={idx} />
                ))}
              </XStack>
            </ScrollView>
          ) : (
            <YStack
              backgroundColor={CARD_BG}
              borderColor={SURFACE}
              borderWidth={1}
              borderRadius="$4"
              paddingVertical="$4"
              alignItems="center"
              marginBottom={20}
            >
              <SizableText size="$3" color={MUTED}>
                {isLoading ? 'Loading sub-indices...' : 'No sub-index data available'}
              </SizableText>
            </YStack>
          )}

          {/* ── Search Bar ── */}
          <XStack
            backgroundColor={SURFACE}
            borderRadius="$4"
            borderWidth={1}
            borderColor={CARD_BG}
            alignItems="center"
            paddingHorizontal="$3"
            paddingVertical="$2"
            gap="$2"
            marginBottom="$3"
          >
            <Search size={16} color={MUTED} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search stocks..."
              placeholderTextColor={MUTED}
              style={[
                {
                  flex: 1,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: '500',
                  paddingVertical: 0,
                },
                Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {},
              ]}
            />
          </XStack>

          {/* ── Market Movers ── */}
          <SectionTitle>Market Movers</SectionTitle>
          <TabSwitcher active={activeTab} onChange={setActiveTab} />

          <Card
            backgroundColor={CARD_BG}
            borderColor={SURFACE}
            borderWidth={1}
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingTop="$2"
            paddingBottom="$2"
            marginBottom="$5"
          >
            {filteredMovers.length === 0 ? (
              <YStack alignItems="center" paddingVertical="$6">
                <Activity size={32} color={MUTED} />
                <SizableText size="$4" color={MUTED} marginTop="$2">
                  No results for "{searchQuery}"
                </SizableText>
              </YStack>
            ) : (
              filteredMovers.map((stock, i) => (
                <StockRow
                  key={`${stock.symbol}-${i}`}
                  stock={stock}
                  metric={activeTab}
                />
              ))
            )}
          </Card>

          {/* ── Market data empty state ── */}
          {topGainers.length === 0 && topLosers.length === 0 && !isLoading && (
            <YStack
              backgroundColor={CARD_BG}
              borderColor={SURFACE}
              borderWidth={1}
              borderRadius="$4"
              padding="$6"
              alignItems="center"
              marginBottom="$5"
            >
              <Activity size={32} color={MUTED} />
              <SizableText size="$4" color={MUTED} marginTop="$2" textAlign="center">
                Market data will appear here once loaded
              </SizableText>
              <Button
                size="$3"
                backgroundColor={GOLD}
                color="#0f172a"
                fontWeight="700"
                borderRadius="$3"
                marginTop="$3"
                onPress={handleRefresh}
              >
                Refresh Data
              </Button>
            </YStack>
          )}

        </YStack>
      </ScrollView>
    </YStack>
  );
}
