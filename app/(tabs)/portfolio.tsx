/**
 * Portfolio Screen — Bulk IPO Apply Nepal
 * Shows holdings summary, individual stock cards, WACC bars, and dividends.
 */

import { useState } from 'react';
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
} from '@blinkdotnew/mobile-ui';
import { useAccountStore } from '@/store';

// ─── Design tokens ───────────────────────────────────────────────────────────
const BG = '#0A0E1A';
const CARD_BG = '#0D1221';
const SURFACE = '#1A2744';
const GOLD = '#FFD700';
const POSITIVE = '#22C55E';
const NEGATIVE = '#EF4444';
const MUTED = '#8B9AB1';

// ─── Mock holdings ────────────────────────────────────────────────────────────
const MOCK_HOLDINGS = [
  { symbol: 'NABIL', name: 'Nabil Bank Limited',         qty: 120, wacc: 1198, ltp: 1245 },
  { symbol: 'NICA',  name: 'NIC Asia Bank Limited',      qty: 500, wacc:  485, ltp:  512 },
  { symbol: 'NTC',   name: 'Nepal Telecom',               qty: 200, wacc:  845, ltp:  790 },
  { symbol: 'NLIC',  name: 'Nepal Life Insurance',        qty: 300, wacc: 1820, ltp: 1950 },
  { symbol: 'HIDCL', name: 'Hydro Investment Dev. Co.',   qty: 450, wacc:  178, ltp:  192 },
];

// ─── Mock dividends ───────────────────────────────────────────────────────────
const MOCK_DIVIDENDS = [
  { symbol: 'NABIL', type: 'Cash Dividend', rate: '30%',    amount: 'Rs. 30/share', date: '2081-03-15' },
  { symbol: 'NICA',  type: 'Bonus Share',   rate: '10%',    amount: '10% Shares',   date: '2081-01-20' },
  { symbol: 'NTC',   type: 'Cash Dividend', rate: '55%',    amount: 'Rs. 55/share', date: '2080-11-10' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtNum(n: number) {
  return n.toLocaleString('en-IN');
}

function fmtCurrency(n: number) {
  return `Rs. ${fmtNum(Math.abs(Math.round(n)))}`;
}

function getHoldingStats(h: typeof MOCK_HOLDINGS[0]) {
  const invested = h.qty * h.wacc;
  const current  = h.qty * h.ltp;
  const pl       = current - invested;
  const plPct    = ((pl / invested) * 100);
  return { invested, current, pl, plPct };
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

function HoldingCard({ holding }: { holding: typeof MOCK_HOLDINGS[0] }) {
  const { invested, current, pl, plPct } = getHoldingStats(holding);
  const isGain = pl >= 0;
  const plColor = isGain ? POSITIVE : NEGATIVE;

  return (
    <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
      <Card
        backgroundColor={CARD_BG}
        borderColor={SURFACE}
        borderWidth={1}
        borderRadius="$4"
        padding="$4"
        marginBottom="$3"
      >
        {/* Top row */}
        <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$2">
          <XStack alignItems="center" gap="$3" flex={1}>
            {/* Symbol badge */}
            <XStack
              backgroundColor={SURFACE}
              paddingHorizontal="$2.5"
              paddingVertical="$1.5"
              borderRadius="$3"
              borderLeftWidth={3}
              borderLeftColor={GOLD}
            >
              <SizableText size="$3" fontWeight="800" color={GOLD}>
                {holding.symbol}
              </SizableText>
            </XStack>
            <YStack flex={1}>
              <SizableText size="$4" fontWeight="700" color="white" numberOfLines={1}>
                {holding.name}
              </SizableText>
              <SizableText size="$3" color={MUTED}>
                {holding.qty} shares · WACC Rs. {fmtNum(holding.wacc)}
              </SizableText>
            </YStack>
          </XStack>
          {/* LTP */}
          <YStack alignItems="flex-end">
            <SizableText size="$4" fontWeight="700" color="white">
              Rs. {fmtNum(holding.ltp)}
            </SizableText>
            <XStack alignItems="center" gap="$1">
              {isGain
                ? <ArrowUpRight size={13} color={POSITIVE} />
                : <ArrowDownRight size={13} color={NEGATIVE} />}
              <SizableText size="$3" color={plColor} fontWeight="600">
                {isGain ? '+' : ''}{plPct.toFixed(2)}%
              </SizableText>
            </XStack>
          </YStack>
        </XStack>

        <Separator borderColor={SURFACE} />

        {/* Bottom row */}
        <XStack justifyContent="space-between" alignItems="center" marginTop="$2">
          <YStack>
            <SizableText size="$2" color={MUTED}>Invested</SizableText>
            <SizableText size="$3" fontWeight="600" color="white">
              {fmtCurrency(invested)}
            </SizableText>
          </YStack>
          <YStack alignItems="center">
            <SizableText size="$2" color={MUTED}>Current</SizableText>
            <SizableText size="$3" fontWeight="600" color="white">
              {fmtCurrency(current)}
            </SizableText>
          </YStack>
          <YStack alignItems="flex-end">
            <SizableText size="$2" color={MUTED}>P&amp;L</SizableText>
            <SizableText size="$3" fontWeight="700" color={plColor}>
              {isGain ? '+' : '-'}{fmtCurrency(pl)}
            </SizableText>
          </YStack>
        </XStack>
      </Card>
    </Pressable>
  );
}

function WACCBar({ symbol, invested, total }: { symbol: string; invested: number; total: number }) {
  const pct = total > 0 ? (invested / total) * 100 : 0;
  return (
    <XStack alignItems="center" gap="$3" marginBottom="$2.5">
      <SizableText size="$3" fontWeight="700" color={GOLD} width={52}>
        {symbol}
      </SizableText>
      <YStack flex={1} backgroundColor={SURFACE} borderRadius="$10" height={8} overflow="hidden">
        <YStack
          height={8}
          borderRadius="$10"
          backgroundColor={GOLD}
          width={`${Math.max(pct, 2)}%` as any}
        />
      </YStack>
      <SizableText size="$3" color={MUTED} width={40} textAlign="right">
        {pct.toFixed(1)}%
      </SizableText>
    </XStack>
  );
}

function DividendRow({ div }: { div: typeof MOCK_DIVIDENDS[0] }) {
  const isCash = div.type === 'Cash Dividend';
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      paddingVertical="$3"
      borderBottomWidth={1}
      borderBottomColor={SURFACE}
    >
      <XStack alignItems="center" gap="$3">
        <XStack
          width={40}
          height={40}
          borderRadius="$10"
          backgroundColor={isCash ? '#1A3A2A' : '#2A1A3A'}
          alignItems="center"
          justifyContent="center"
        >
          <Gift size={18} color={isCash ? POSITIVE : '#A855F7'} />
        </XStack>
        <YStack>
          <XStack alignItems="center" gap="$2">
            <SizableText size="$4" fontWeight="700" color="white">
              {div.symbol}
            </SizableText>
            <XStack
              backgroundColor={isCash ? '#1A3A2A' : '#2A1A3A'}
              paddingHorizontal="$2"
              paddingVertical="$0.5"
              borderRadius="$10"
            >
              <SizableText size="$1" color={isCash ? POSITIVE : '#A855F7'} fontWeight="600">
                {div.type}
              </SizableText>
            </XStack>
          </XStack>
          <SizableText size="$3" color={MUTED}>{div.date}</SizableText>
        </YStack>
      </XStack>
      <YStack alignItems="flex-end">
        <SizableText size="$4" fontWeight="700" color="white">{div.rate}</SizableText>
        <SizableText size="$3" color={MUTED}>{div.amount}</SizableText>
      </YStack>
    </XStack>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PortfolioScreen() {
  const accounts = useAccountStore((s) => s.accounts);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const activeAccount = selectedAccount
    ? accounts.find((a) => a.id === selectedAccount)
    : null;
  const accountLabel = activeAccount?.nickname ?? 'All Accounts';

  // Portfolio totals
  const totals = MOCK_HOLDINGS.reduce(
    (acc, h) => {
      const { invested, current, pl } = getHoldingStats(h);
      return {
        invested: acc.invested + invested,
        current:  acc.current  + current,
        pl:       acc.pl       + pl,
      };
    },
    { invested: 0, current: 0, pl: 0 },
  );
  const plPct = ((totals.pl / totals.invested) * 100);
  const totalAllInvested = MOCK_HOLDINGS.reduce((s, h) => s + h.qty * h.wacc, 0);

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
              Total Portfolio Value
            </SizableText>
            <SizableText size="$8" fontWeight="800" color="white" marginBottom="$1">
              Rs. {fmtNum(Math.round(totals.current))}
            </SizableText>
            <XStack alignItems="center" gap="$1.5" marginBottom="$4">
              <ArrowUpRight size={16} color={POSITIVE} />
              <SizableText size="$4" color={POSITIVE} fontWeight="700">
                +{fmtCurrency(totals.pl)} (+{plPct.toFixed(2)}%)
              </SizableText>
            </XStack>

            <Separator borderColor={GOLD + '22'} />

            <XStack justifyContent="space-between" marginTop="$4">
              <YStack flex={1} alignItems="flex-start">
                <SizableText size="$2" color={MUTED} marginBottom="$1">Invested</SizableText>
                <SizableText size="$4" fontWeight="700" color="white">
                  {fmtCurrency(totals.invested)}
                </SizableText>
              </YStack>
              <YStack flex={1} alignItems="center">
                <SizableText size="$2" color={MUTED} marginBottom="$1">Current</SizableText>
                <SizableText size="$4" fontWeight="700" color={GOLD}>
                  {fmtCurrency(totals.current)}
                </SizableText>
              </YStack>
              <YStack flex={1} alignItems="flex-end">
                <SizableText size="$2" color={MUTED} marginBottom="$1">P&amp;L</SizableText>
                <SizableText size="$4" fontWeight="700" color={POSITIVE}>
                  +{fmtCurrency(totals.pl)}
                </SizableText>
              </YStack>
            </XStack>
          </Card>

          {/* ── Holdings List ── */}
          <SectionTitle badge={MOCK_HOLDINGS.length}>My Holdings</SectionTitle>
          {MOCK_HOLDINGS.map((h) => (
            <HoldingCard key={h.symbol} holding={h} />
          ))}

          {/* ── WACC Allocation ── */}
          <Card
            backgroundColor={CARD_BG}
            borderColor={SURFACE}
            borderWidth={1}
            borderRadius="$4"
            padding="$4"
            marginTop="$2"
            marginBottom="$5"
          >
            <XStack alignItems="center" gap="$2" marginBottom="$4">
              <TrendingUp size={16} color={GOLD} />
              <SizableText size="$4" fontWeight="700" color="white">
                Portfolio Allocation (by Invested Value)
              </SizableText>
            </XStack>
            {MOCK_HOLDINGS.map((h) => (
              <WACCBar
                key={h.symbol}
                symbol={h.symbol}
                invested={h.qty * h.wacc}
                total={totalAllInvested}
              />
            ))}
          </Card>

          {/* ── Dividend Tracker ── */}
          <SectionTitle>Recent Dividends</SectionTitle>
          <Card
            backgroundColor={CARD_BG}
            borderColor={SURFACE}
            borderWidth={1}
            borderRadius="$4"
            paddingHorizontal="$4"
            paddingTop="$2"
            paddingBottom="$1"
            marginBottom="$8"
          >
            {MOCK_DIVIDENDS.map((div) => (
              <DividendRow key={`${div.symbol}-${div.date}`} div={div} />
            ))}
          </Card>

        </YStack>
      </ScrollView>
    </YStack>
  );
}
