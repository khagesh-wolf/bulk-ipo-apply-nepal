/**
 * Share Calculator Screen — Bulk IPO Apply Nepal
 * NEPSE profit/loss calculator with broker commission, SEBON fee, DP fee, and CGT
 */
import { useState } from 'react';
import {
  Platform,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import {
  YStack,
  XStack,
  SizableText,
  Card,
  Separator,
} from '@blinkdotnew/mobile-ui';
import {
  ChevronLeft,
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  BarChart2,
  AlertCircle,
  CheckCircle2,
} from '@blinkdotnew/mobile-ui';
import { calculateShareProfitLoss, breakEvenPrice } from '@/lib/calculator';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#0A0E1A',
  card: '#0D1221',
  surface: '#1A2744',
  border: '#2D3B55',
  gold: '#FFD700',
  positive: '#22C55E',
  negative: '#EF4444',
  muted: '#8B9AB1',
  white: '#FFFFFF',
  text: '#E2E8F0',
};

const topPad = Platform.OS === 'ios' ? 54 : Platform.OS === 'android' ? 34 : 24;

const inputBase: any = {
  backgroundColor: '#1A2744',
  borderColor: '#2D3B55',
  borderWidth: 1,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 14,
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600' as any,
  ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatNPR(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10_000_000) {
    return `Rs. ${(value / 10_000_000).toFixed(2)} Cr`;
  }
  if (abs >= 100_000) {
    return `Rs. ${(value / 100_000).toFixed(2)} L`;
  }
  // Nepali number formatting with commas
  const parts = Math.abs(value).toFixed(2).split('.');
  const intPart = parts[0];
  const decPart = parts[1];
  let result = '';
  const len = intPart.length;
  for (let i = 0; i < len; i++) {
    if (i > 0) {
      const fromRight = len - i;
      if (fromRight === 3 || (fromRight > 3 && (fromRight - 3) % 2 === 0)) {
        result += ',';
      }
    }
    result += intPart[i];
  }
  return `${value < 0 ? '-' : ''}Rs. ${result}.${decPart}`;
}

// ─── Input Field ──────────────────────────────────────────────────────────────
function CalcInput({
  label,
  value,
  onChangeText,
  placeholder,
  prefix,
  suffix,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <YStack gap="$2" flex={1}>
      <SizableText size="$2" color={C.muted} fontWeight="600">
        {label}
      </SizableText>
      <XStack
        alignItems="center"
        style={{
          ...inputBase,
          paddingHorizontal: 0,
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {prefix && (
          <YStack
            paddingLeft={12}
            paddingRight={6}
            paddingVertical={14}
          >
            <SizableText size="$3" color={C.muted} fontWeight="700">
              {prefix}
            </SizableText>
          </YStack>
        )}
        <TextInput
          style={{
            flex: 1,
            color: C.white,
            fontSize: 16,
            fontWeight: '600',
            paddingHorizontal: prefix ? 6 : 14,
            paddingVertical: 14,
            ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
          }}
          placeholder={placeholder ?? '0'}
          placeholderTextColor={C.muted}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
        />
        {suffix && (
          <YStack paddingRight={12} paddingVertical={14}>
            <SizableText size="$2" color={C.muted}>
              {suffix}
            </SizableText>
          </YStack>
        )}
      </XStack>
    </YStack>
  );
}

// ─── Result Row ───────────────────────────────────────────────────────────────
function ResultRow({
  label,
  value,
  valueColor,
  isBold,
  isLarge,
  subtext,
}: {
  label: string;
  value: string;
  valueColor?: string;
  isBold?: boolean;
  isLarge?: boolean;
  subtext?: string;
}) {
  return (
    <XStack justifyContent="space-between" alignItems="flex-start" paddingVertical="$2">
      <SizableText
        size={isLarge ? '$3' : '$3'}
        color={C.muted}
        flex={1}
        marginRight="$2"
      >
        {label}
      </SizableText>
      <YStack alignItems="flex-end">
        <SizableText
          size={isLarge ? '$4' : '$3'}
          color={valueColor ?? C.text}
          fontWeight={isBold ? '700' : '500'}
        >
          {value}
        </SizableText>
        {subtext && (
          <SizableText size="$2" color={valueColor ?? C.muted} opacity={0.8}>
            {subtext}
          </SizableText>
        )}
      </YStack>
    </XStack>
  );
}

// ─── Section Divider ─────────────────────────────────────────────────────────
function SectionDivider({ label }: { label: string }) {
  return (
    <XStack alignItems="center" gap="$2" marginVertical="$1">
      <YStack flex={1} height={1} backgroundColor={C.border} />
      <SizableText size="$1" color={C.muted} fontWeight="700" style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
        {label}
      </SizableText>
      <YStack flex={1} height={1} backgroundColor={C.border} />
    </XStack>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CalculatorScreen() {
  const [buyPrice, setBuyPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isLongTerm, setIsLongTerm] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof calculateShareProfitLoss> | null>(null);
  const [breakEven, setBreakEven] = useState<number | null>(null);
  const [hasCalculated, setHasCalculated] = useState(false);

  const handleCalculate = () => {
    const bp = parseFloat(buyPrice);
    const sp = parseFloat(sellPrice);
    const qty = parseFloat(quantity);

    if (!bp || !sp || !qty || bp <= 0 || sp <= 0 || qty <= 0) {
      return;
    }

    const res = calculateShareProfitLoss({
      buyPrice: bp,
      sellPrice: sp,
      quantity: qty,
      cgtType: isLongTerm ? 'long' : 'short',
    });

    const bep = breakEvenPrice(bp, qty, isLongTerm ? 'long' : 'short');

    setResult(res);
    setBreakEven(bep);
    setHasCalculated(true);
  };

  const handleReset = () => {
    setBuyPrice('');
    setSellPrice('');
    setQuantity('');
    setIsLongTerm(false);
    setResult(null);
    setBreakEven(null);
    setHasCalculated(false);
  };

  const isProfit = result ? result.netProfitLoss >= 0 : false;
  const profitColor = isProfit ? C.positive : C.negative;
  const isInputValid =
    buyPrice.length > 0 && sellPrice.length > 0 && quantity.length > 0;

  return (
    <YStack flex={1} backgroundColor={C.bg}>
      {/* ── Header ── */}
      <YStack
        paddingTop={topPad}
        paddingHorizontal="$4"
        paddingBottom="$4"
        backgroundColor={C.card}
        borderBottomWidth={1}
        borderBottomColor={C.border}
      >
        <XStack alignItems="center" gap="$3">
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: C.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <ChevronLeft size={20} color={C.white} />
          </TouchableOpacity>
          <YStack>
            <SizableText size="$6" fontWeight="800" color={C.white}>
              Share Calculator
            </SizableText>
            <SizableText size="$2" color={C.muted} marginTop="$0.5">
              Calculate profit, tax & fees
            </SizableText>
          </YStack>
        </XStack>
      </YStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 50 }}
      >
        {/* ════ Input Form ════ */}
        <Card
          backgroundColor={C.card}
          borderRadius={16}
          borderWidth={1}
          borderColor={C.border}
          padding="$4"
          gap="$4"
        >
          {/* Buy + Sell price row */}
          <XStack gap="$3">
            <CalcInput
              label="Buy Price (Rs.)"
              value={buyPrice}
              onChangeText={setBuyPrice}
              placeholder="e.g. 1000"
              prefix="₨"
            />
            <CalcInput
              label="Sell Price (Rs.)"
              value={sellPrice}
              onChangeText={setSellPrice}
              placeholder="e.g. 1200"
              prefix="₨"
            />
          </XStack>

          {/* Quantity */}
          <CalcInput
            label="Quantity (Shares)"
            value={quantity}
            onChangeText={setQuantity}
            placeholder="e.g. 100"
            suffix="units"
          />

          {/* Long-term toggle */}
          <XStack
            alignItems="center"
            justifyContent="space-between"
            backgroundColor={C.surface}
            padding="$3"
            borderRadius={12}
          >
            <YStack flex={1} marginRight="$3">
              <SizableText size="$3" color={C.text} fontWeight="600">
                Is long-term? (1+ year)
              </SizableText>
              <SizableText size="$2" color={C.muted} marginTop="$0.5">
                CGT rate: {isLongTerm ? '5%' : '7.5%'}
              </SizableText>
            </YStack>
            <Switch
              value={isLongTerm}
              onValueChange={setIsLongTerm}
              trackColor={{ false: C.border, true: C.gold + '80' }}
              thumbColor={isLongTerm ? C.gold : C.muted}
              ios_backgroundColor={C.border}
            />
          </XStack>

          {/* Live price preview */}
          {isInputValid &&
            parseFloat(buyPrice) > 0 &&
            parseFloat(quantity) > 0 && (
              <XStack gap="$3">
                <YStack
                  flex={1}
                  backgroundColor={C.surface}
                  borderRadius={10}
                  padding="$3"
                  alignItems="center"
                >
                  <SizableText size="$1" color={C.muted} fontWeight="600">
                    BUY TOTAL
                  </SizableText>
                  <SizableText size="$3" color={C.text} fontWeight="700" marginTop="$1">
                    {formatNPR(parseFloat(buyPrice) * parseFloat(quantity) || 0)}
                  </SizableText>
                </YStack>
                <YStack
                  flex={1}
                  backgroundColor={C.surface}
                  borderRadius={10}
                  padding="$3"
                  alignItems="center"
                >
                  <SizableText size="$1" color={C.muted} fontWeight="600">
                    SELL TOTAL
                  </SizableText>
                  <SizableText size="$3" color={parseFloat(sellPrice) >= parseFloat(buyPrice) ? C.positive : C.negative} fontWeight="700" marginTop="$1">
                    {formatNPR(parseFloat(sellPrice) * parseFloat(quantity) || 0)}
                  </SizableText>
                </YStack>
              </XStack>
            )}
        </Card>

        {/* ════ Calculate Button ════ */}
        <TouchableOpacity
          onPress={handleCalculate}
          disabled={!isInputValid}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginTop: 16,
            backgroundColor: isInputValid ? C.gold : C.surface,
            borderRadius: 14,
            paddingVertical: 16,
            opacity: isInputValid ? 1 : 0.5,
          }}
          activeOpacity={0.85}
        >
          <Calculator size={20} color={isInputValid ? '#0A0E1A' : C.muted} />
          <SizableText
            size="$4"
            fontWeight="800"
            color={isInputValid ? '#0A0E1A' : C.muted}
          >
            Calculate
          </SizableText>
        </TouchableOpacity>

        {/* ════ Results Card ════ */}
        {hasCalculated && result && (
          <>
            {/* Net result hero */}
            <Card
              marginTop="$4"
              padding="$4"
              backgroundColor={isProfit ? C.positive + '15' : C.negative + '15'}
              borderRadius={16}
              borderWidth={2}
              borderColor={isProfit ? C.positive + '50' : C.negative + '50'}
            >
              <XStack alignItems="center" justifyContent="space-between">
                <YStack>
                  <SizableText size="$2" color={C.muted} fontWeight="600">
                    NET {isProfit ? 'PROFIT' : 'LOSS'}
                  </SizableText>
                  <SizableText
                    size="$8"
                    fontWeight="800"
                    color={profitColor}
                    marginTop="$1"
                  >
                    {formatNPR(result.netProfitLoss)}
                  </SizableText>
                  <SizableText size="$3" color={profitColor} fontWeight="700" marginTop="$1">
                    {isProfit ? '▲' : '▼'}{' '}
                    {Math.abs(result.netProfitLossPercent).toFixed(2)}% return
                  </SizableText>
                </YStack>
                <YStack
                  width={56}
                  height={56}
                  borderRadius={28}
                  backgroundColor={profitColor + '20'}
                  alignItems="center"
                  justifyContent="center"
                >
                  {isProfit ? (
                    <TrendingUp size={28} color={profitColor} />
                  ) : (
                    <TrendingDown size={28} color={profitColor} />
                  )}
                </YStack>
              </XStack>
            </Card>

            {/* Detailed breakdown */}
            <Card
              marginTop="$3"
              padding="$4"
              backgroundColor={C.card}
              borderRadius={16}
              borderWidth={1}
              borderColor={C.border}
              gap="$1"
            >
              {/* Investment Summary */}
              <SectionDivider label="Investment Summary" />
              <ResultRow
                label="Buy Investment"
                value={formatNPR(result.investedAmount)}
              />
              <ResultRow
                label="Sale Proceeds"
                value={formatNPR(result.saleAmount)}
                valueColor={
                  result.saleAmount >= result.investedAmount
                    ? C.positive
                    : C.negative
                }
              />

              <YStack height={8} />

              {/* Deductions */}
              <SectionDivider label="Deductions" />
              <ResultRow
                label="Broker Commission"
                value={formatNPR(result.brokerCommission)}
                subtext="(buy + sell sides)"
                valueColor={C.negative}
              />
              <ResultRow
                label="SEBON Fee"
                value={formatNPR(result.sebon)}
                subtext="(0.015% of turnover)"
                valueColor={C.negative}
              />
              <ResultRow
                label="DP Fee (CDSC)"
                value={formatNPR(result.dpFee)}
                subtext="(per sell transaction)"
                valueColor={C.negative}
              />
              <ResultRow
                label={`Capital Gains Tax`}
                value={formatNPR(result.capitalGainsTax)}
                subtext={`(${isLongTerm ? '5%' : '7.5%'} CGT)`}
                valueColor={result.capitalGainsTax > 0 ? C.negative : C.muted}
              />

              {/* Total deductions */}
              <XStack
                backgroundColor={C.surface}
                borderRadius={8}
                padding="$3"
                marginTop="$1"
                justifyContent="space-between"
                alignItems="center"
              >
                <SizableText size="$3" color={C.muted} fontWeight="600">
                  Total Deductions
                </SizableText>
                <SizableText size="$3" color={C.negative} fontWeight="700">
                  {formatNPR(
                    -(
                      result.brokerCommission +
                      result.sebon +
                      result.dpFee +
                      result.capitalGainsTax
                    ),
                  )}
                </SizableText>
              </XStack>

              <YStack height={8} />

              {/* Net Result */}
              <SectionDivider label="Net Result" />
              <ResultRow
                label="Net Profit / Loss"
                value={formatNPR(result.netProfitLoss)}
                subtext={`(${isProfit ? '+' : ''}${result.netProfitLossPercent.toFixed(2)}%)`}
                valueColor={profitColor}
                isBold
                isLarge
              />
              {breakEven !== null && (
                <ResultRow
                  label="Break-even Price"
                  value={`Rs. ${breakEven.toFixed(2)}`}
                  subtext="minimum sell price"
                  valueColor={C.gold}
                />
              )}
            </Card>

            {/* Tax note */}
            <XStack
              marginTop="$3"
              padding="$3"
              backgroundColor={C.card}
              borderRadius={10}
              borderWidth={1}
              borderColor={C.border}
              gap="$2"
              alignItems="flex-start"
            >
              <AlertCircle size={14} color={C.muted} style={{ marginTop: 2 }} />
              <SizableText flex={1} size="$1" color={C.muted} lineHeight={18}>
                CGT rates: Short-term (&lt;1 yr) = 7.5%, Long-term (≥1 yr) = 5%.
                Broker commission as per SEBON 2023/24 directive. DP fee: Rs. 25
                fixed per sell.
              </SizableText>
            </XStack>

            {/* Reset button */}
            <TouchableOpacity
              onPress={handleReset}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 16,
                backgroundColor: C.surface,
                borderRadius: 14,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor: C.border,
              }}
              activeOpacity={0.7}
            >
              <SizableText size="$3" fontWeight="600" color={C.muted}>
                Reset Calculator
              </SizableText>
            </TouchableOpacity>
          </>
        )}

        {/* ════ Info Card (shown before calculation) ════ */}
        {!hasCalculated && (
          <Card
            marginTop="$4"
            padding="$4"
            backgroundColor={C.card}
            borderRadius={14}
            borderWidth={1}
            borderColor={C.border}
            gap="$3"
          >
            <XStack alignItems="center" gap="$2">
              <BarChart2 size={16} color={C.gold} />
              <SizableText size="$3" fontWeight="700" color={C.white}>
                NEPSE Fee Structure
              </SizableText>
            </XStack>
            <Separator backgroundColor={C.border} opacity={0.5} />
            {[
              ['Broker Commission', '0.40% – 0.60%', 'Slab-based on amount'],
              ['SEBON Regulatory Fee', '0.015%', 'On total turnover'],
              ['DP Fee (CDSC)', 'Rs. 25 fixed', 'Per sell transaction'],
              ['CGT — Short term', '7.5%', 'Holding < 1 year'],
              ['CGT — Long term', '5.0%', 'Holding ≥ 1 year'],
            ].map(([label, rate, note]) => (
              <XStack key={label} justifyContent="space-between" alignItems="flex-start">
                <YStack flex={1}>
                  <SizableText size="$2" color={C.text}>
                    {label}
                  </SizableText>
                  <SizableText size="$1" color={C.muted}>
                    {note}
                  </SizableText>
                </YStack>
                <SizableText size="$3" color={C.gold} fontWeight="700">
                  {rate}
                </SizableText>
              </XStack>
            ))}
          </Card>
        )}
      </ScrollView>
    </YStack>
  );
}
