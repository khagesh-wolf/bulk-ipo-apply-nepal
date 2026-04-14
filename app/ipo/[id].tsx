/**
 * IPO Detail Screen — Bulk IPO Apply Nepal
 * Shows details for a specific IPO issue.
 */
import { Platform, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  YStack,
  XStack,
  SizableText,
  Card,
  ScrollView,
  Separator,
} from '@blinkdotnew/mobile-ui';
import {
  ChevronLeft,
  TrendingUp,
  Clock,
  Calendar,
} from '@blinkdotnew/mobile-ui';
import { useIPOStore } from '@/store';

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#0f172a',
  card: '#1e293b',
  surface: '#334155',
  border: '#475569',
  gold: '#fbbf24',
  positive: '#10b981',
  negative: '#ef4444',
  muted: '#94a3b8',
  white: '#f1f5f9',
  text: '#e2e8f0',
};

const topPad = Platform.OS === 'ios' ? 54 : Platform.OS === 'android' ? 34 : 24;

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function IPODetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const activeIssues = useIPOStore((s) => s.activeIssues);

  const issue = activeIssues.find((i: { id: string }) => i.id === id);

  if (!issue) {
    return (
      <YStack
        flex={1}
        backgroundColor={C.bg}
        alignItems="center"
        justifyContent="center"
        gap="$3"
      >
        <SizableText size="$5" color={C.muted}>
          IPO not found
        </SizableText>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: C.surface,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 10,
          }}
        >
          <SizableText size="$3" color={C.white}>
            Go Back
          </SizableText>
        </TouchableOpacity>
      </YStack>
    );
  }

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
          <YStack flex={1}>
            <SizableText size="$5" fontWeight="800" color={C.white} numberOfLines={1}>
              {issue.companyName}
            </SizableText>
            <XStack alignItems="center" gap="$1.5" marginTop="$0.5">
              <TrendingUp size={12} color={C.gold} />
              <SizableText size="$2" color={C.gold}>
                {issue.symbol} · {issue.shareType}
              </SizableText>
            </XStack>
          </YStack>
        </XStack>
      </YStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Status Badge */}
        <XStack marginBottom="$4">
          <XStack
            backgroundColor={issue.isOpen ? C.positive + '20' : C.muted + '20'}
            paddingHorizontal="$3"
            paddingVertical="$1.5"
            borderRadius="$3"
            borderWidth={1}
            borderColor={issue.isOpen ? C.positive + '50' : C.muted + '30'}
          >
            <SizableText
              size="$3"
              fontWeight="700"
              color={issue.isOpen ? C.positive : C.muted}
            >
              {issue.statusLabel}
            </SizableText>
          </XStack>
        </XStack>

        {/* Details Card */}
        <Card
          backgroundColor={C.card}
          borderRadius={16}
          borderWidth={1}
          borderColor={C.border}
          padding="$4"
          gap="$3"
          marginBottom="$4"
        >
          <DetailRow label="Price per Unit" value={`Rs. ${issue.pricePerUnit}`} />
          <Separator borderColor={C.border} opacity={0.4} />
          <DetailRow label="Min Units" value={String(issue.minUnit)} />
          <Separator borderColor={C.border} opacity={0.4} />
          <DetailRow label="Max Units" value={String(issue.maxUnit)} />
          <Separator borderColor={C.border} opacity={0.4} />
          <DetailRow label="Total Units" value={issue.totalUnits.toLocaleString()} />
        </Card>

        {/* Dates Card */}
        <Card
          backgroundColor={C.card}
          borderRadius={16}
          borderWidth={1}
          borderColor={C.border}
          padding="$4"
          gap="$3"
          marginBottom="$4"
        >
          <XStack alignItems="center" gap="$2" marginBottom="$1">
            <Calendar size={16} color={C.gold} />
            <SizableText size="$4" fontWeight="700" color={C.white}>
              Important Dates
            </SizableText>
          </XStack>

          <DetailRow
            label="Open Date"
            value={new Date(issue.openDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          />
          <Separator borderColor={C.border} opacity={0.4} />
          <DetailRow
            label="Close Date"
            value={new Date(issue.closeDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          />
        </Card>

        {/* Apply Button */}
        {issue.isOpen && (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: C.gold,
              borderRadius: 14,
              paddingVertical: 16,
            }}
            activeOpacity={0.85}
          >
            <Clock size={18} color="#0f172a" />
            <SizableText size="$4" fontWeight="800" color="#0f172a">
              Apply for IPO
            </SizableText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </YStack>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <SizableText size="$3" color={C.muted}>
        {label}
      </SizableText>
      <SizableText size="$3" fontWeight="700" color={C.white}>
        {value}
      </SizableText>
    </XStack>
  );
}
