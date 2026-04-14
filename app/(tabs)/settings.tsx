/**
 * Settings Screen — Bulk IPO Apply Nepal
 * MeroShare accounts management + app preferences + about section
 */
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import {
  YStack,
  XStack,
  SizableText,
  Card,
  Separator,
  Slider,
} from '@blinkdotnew/mobile-ui';
import {
  Plus,
  Pencil,
  Trash2,
  User,
  Shield,
  Bell,
  TrendingUp,
  Lock,
  Info,
  ChevronRight,
  AlertTriangle,
} from '@blinkdotnew/mobile-ui';
import { useShallow } from 'zustand/react/shallow';
import { useAccountStore } from '@/store';
import { useToast } from '@/components/Toast';
import { useConfirmation } from '@/components/ConfirmationModal';

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

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal="$4"
      paddingTop="$5"
      paddingBottom="$2"
    >
      <SizableText
        size="$3"
        fontWeight="700"
        color={C.muted}
        style={{ textTransform: 'uppercase', letterSpacing: 1 }}
      >
        {title}
      </SizableText>
      {action}
    </XStack>
  );
}

// ─── Account Avatar ────────────────────────────────────────────────────────────
function AccountAvatar({ nickname }: { nickname: string }) {
  const initials = nickname
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <YStack
      width={44}
      height={44}
      borderRadius={22}
      backgroundColor={C.gold}
      alignItems="center"
      justifyContent="center"
    >
      <SizableText size="$4" fontWeight="800" color="#0A0E1A">
        {initials}
      </SizableText>
    </YStack>
  );
}

// ─── Account Card ─────────────────────────────────────────────────────────────
function AccountCard({
  account,
  onEdit,
  onDelete,
  onToggle,
}: {
  account: any;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  return (
    <Card
      marginHorizontal="$4"
      marginBottom="$3"
      padding="$4"
      backgroundColor={C.surface}
      borderRadius={14}
      borderWidth={1}
      borderColor={account.isActive ? C.gold + '40' : C.border}
    >
      {/* Top row: avatar + info + toggle */}
      <XStack alignItems="center" gap="$3">
        <AccountAvatar nickname={account.nickname} />
        <YStack flex={1}>
          <SizableText size="$4" fontWeight="700" color={C.white}>
            {account.nickname}
          </SizableText>
          <SizableText size="$2" color={C.muted} marginTop="$1">
            DP: {account.dpId}
          </SizableText>
          <SizableText size="$2" color={C.muted}>
            {account.bankName}
          </SizableText>
        </YStack>
        <Switch
          value={account.isActive}
          onValueChange={onToggle}
          trackColor={{ false: C.border, true: C.gold + '80' }}
          thumbColor={account.isActive ? C.gold : C.muted}
          ios_backgroundColor={C.border}
        />
      </XStack>

      {/* Separator */}
      <YStack
        height={1}
        backgroundColor={C.border}
        marginVertical="$3"
        opacity={0.5}
      />

      {/* Bottom row: edit + delete */}
      <XStack gap="$3" justifyContent="flex-end">
        <TouchableOpacity
          onPress={onEdit}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: C.surface,
            borderWidth: 1,
            borderColor: C.gold + '50',
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
          activeOpacity={0.7}
        >
          <Pencil size={14} color={C.gold} />
          <SizableText size="$2" color={C.gold} fontWeight="600">
            Edit
          </SizableText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onDelete}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: C.negative + '15',
            borderWidth: 1,
            borderColor: C.negative + '40',
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
          activeOpacity={0.7}
        >
          <Trash2 size={14} color={C.negative} />
          <SizableText size="$2" color={C.negative} fontWeight="600">
            Delete
          </SizableText>
        </TouchableOpacity>
      </XStack>
    </Card>
  );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────
function ToggleRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$3"
      alignItems="center"
      gap="$3"
    >
      <YStack
        width={36}
        height={36}
        borderRadius={10}
        backgroundColor={C.surface}
        alignItems="center"
        justifyContent="center"
      >
        {icon}
      </YStack>
      <SizableText flex={1} size="$3" color={C.text}>
        {label}
      </SizableText>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.border, true: C.gold + '80' }}
        thumbColor={value ? C.gold : C.muted}
        ios_backgroundColor={C.border}
      />
    </XStack>
  );
}

// ─── About Row ────────────────────────────────────────────────────────────────
function AboutRow({
  label,
  value,
  isLink,
}: {
  label: string;
  value?: string;
  isLink?: boolean;
}) {
  return (
    <XStack
      paddingHorizontal="$4"
      paddingVertical="$3"
      alignItems="center"
      justifyContent="space-between"
    >
      <SizableText size="$3" color={isLink ? C.gold : C.text}>
        {label}
      </SizableText>
      {value ? (
        <SizableText size="$3" color={C.muted}>
          {value}
        </SizableText>
      ) : isLink ? (
        <ChevronRight size={16} color={C.gold} />
      ) : null}
    </XStack>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const accounts = useAccountStore((s) => s.accounts);
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirmation();

  // App settings toggles
  const [biometric, setBiometric] = useState(false);
  const [autoCheck, setAutoCheck] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(false);
  const [ipoNotifs, setIpoNotifs] = useState(true);
  const [autoDelay, setAutoDelay] = useState(2);

  const dataFetched = useRef(false);
  useEffect(() => {
    if (dataFetched.current) return;
    dataFetched.current = true;
    useAccountStore.getState().loadAccounts();
  }, []);

  const handleDelete = async (id: string, nickname: string) => {
    const confirmed = await confirm({
      title: 'Delete Account',
      message: `Remove "${nickname}" from your accounts? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (confirmed) {
      try {
        await useAccountStore.getState().deleteAccount(id);
        showSuccess(`"${nickname}" removed successfully`);
      } catch {
        showError('Failed to delete account. Please try again.');
      }
    }
  };

  return (
    <YStack flex={1} backgroundColor={C.bg}>
      {/* ── Custom Header ── */}
      <YStack
        paddingTop={topPad}
        paddingHorizontal="$4"
        paddingBottom="$4"
        backgroundColor={C.card}
        borderBottomWidth={1}
        borderBottomColor={C.border}
      >
        <SizableText size="$7" fontWeight="800" color={C.white}>
          Settings
        </SizableText>
        <SizableText size="$2" color={C.gold} marginTop="$1">
          v1.0.0
        </SizableText>
      </YStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ════════ MeroShare Accounts ════════ */}
        <SectionHeader
          title="MeroShare Accounts"
          action={
            <TouchableOpacity
              onPress={() => router.push('/account/add')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: C.gold + '20',
                borderWidth: 1,
                borderColor: C.gold + '60',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}
              activeOpacity={0.7}
            >
              <Plus size={13} color={C.gold} />
              <SizableText size="$2" color={C.gold} fontWeight="700">
                Add
              </SizableText>
            </TouchableOpacity>
          }
        />

        {accounts.length === 0 ? (
          /* Empty state */
          <YStack
            marginHorizontal="$4"
            marginBottom="$3"
            padding="$6"
            backgroundColor={C.card}
            borderRadius={14}
            borderWidth={1}
            borderColor={C.border}
            alignItems="center"
            gap="$3"
          >
            <YStack
              width={56}
              height={56}
              borderRadius={28}
              backgroundColor={C.surface}
              alignItems="center"
              justifyContent="center"
            >
              <User size={26} color={C.muted} />
            </YStack>
            <SizableText size="$4" color={C.muted} textAlign="center">
              No accounts added yet
            </SizableText>
            <SizableText size="$2" color={C.muted} textAlign="center" opacity={0.7}>
              Add your MeroShare DP accounts to start applying for IPOs
            </SizableText>
            <TouchableOpacity
              onPress={() => router.push('/account/add')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: C.gold,
                borderRadius: 10,
                paddingHorizontal: 20,
                paddingVertical: 12,
                marginTop: 4,
              }}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#0A0E1A" />
              <SizableText size="$3" fontWeight="800" color="#0A0E1A">
                Add Account
              </SizableText>
            </TouchableOpacity>
          </YStack>
        ) : (
          <>
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={() => router.push(`/account/${account.id}`)}
                onDelete={() => handleDelete(account.id, account.nickname)}
                onToggle={() => useAccountStore.getState().toggleAccountActive(account.id)}
              />
            ))}

            {/* Add Account button below list */}
            <TouchableOpacity
              onPress={() => router.push('/account/add')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginHorizontal: 16,
                marginBottom: 8,
                backgroundColor: C.gold + '15',
                borderWidth: 1,
                borderColor: C.gold + '50',
                borderRadius: 12,
                paddingVertical: 14,
              }}
              activeOpacity={0.7}
            >
              <Plus size={16} color={C.gold} />
              <SizableText size="$3" fontWeight="700" color={C.gold}>
                Add Another Account
              </SizableText>
            </TouchableOpacity>
          </>
        )}

        {/* ════════ App Settings ════════ */}
        <SectionHeader title="App Settings" />

        <Card
          marginHorizontal="$4"
          backgroundColor={C.card}
          borderRadius={14}
          borderWidth={1}
          borderColor={C.border}
          overflow="hidden"
        >
          <ToggleRow
            icon={<Lock size={16} color={C.gold} />}
            label="Enable Biometric Lock"
            value={biometric}
            onChange={setBiometric}
          />
          <Separator backgroundColor={C.border} opacity={0.4} />
          <ToggleRow
            icon={<TrendingUp size={16} color={C.positive} />}
            label="Auto-check IPO Results"
            value={autoCheck}
            onChange={setAutoCheck}
          />
          <Separator backgroundColor={C.border} opacity={0.4} />
          <ToggleRow
            icon={<TrendingUp size={16} color="#F59E0B" />}
            label="Price Target Alerts"
            value={priceAlerts}
            onChange={setPriceAlerts}
          />
          <Separator backgroundColor={C.border} opacity={0.4} />
          <ToggleRow
            icon={<Bell size={16} color="#60A5FA" />}
            label="IPO Open Notifications"
            value={ipoNotifs}
            onChange={setIpoNotifs}
          />
          <Separator backgroundColor={C.border} opacity={0.4} />

          {/* Delay slider */}
          <YStack paddingHorizontal="$4" paddingVertical="$3" gap="$2">
            <XStack alignItems="center" gap="$3">
              <YStack
                width={36}
                height={36}
                borderRadius={10}
                backgroundColor={C.surface}
                alignItems="center"
                justifyContent="center"
              >
                <Shield size={16} color="#A78BFA" />
              </YStack>
              <YStack flex={1}>
                <XStack justifyContent="space-between" alignItems="center">
                  <SizableText size="$3" color={C.text}>
                    Auto-apply delay
                  </SizableText>
                  <SizableText size="$3" color={C.gold} fontWeight="700">
                    {autoDelay}s
                  </SizableText>
                </XStack>
                <SizableText size="$1" color={C.muted} marginTop="$1">
                  Delay between applying accounts
                </SizableText>
              </YStack>
            </XStack>
            <YStack paddingHorizontal="$2" paddingTop="$1">
              <Slider
                value={[autoDelay]}
                min={1}
                max={5}
                step={1}
                onValueChange={(val) => setAutoDelay(val[0])}
              >
                <Slider.Track backgroundColor={C.surface}>
                  <Slider.TrackActive backgroundColor={C.gold} />
                </Slider.Track>
                <Slider.Thumb
                  size="$2"
                  index={0}
                  circular
                  backgroundColor={C.gold}
                  borderColor={C.bg}
                  borderWidth={2}
                />
              </Slider>
              <XStack justifyContent="space-between" marginTop="$1">
                {[1, 2, 3, 4, 5].map((v) => (
                  <SizableText key={v} size="$1" color={C.muted}>
                    {v}s
                  </SizableText>
                ))}
              </XStack>
            </YStack>
          </YStack>
        </Card>

        {/* ════════ About ════════ */}
        <SectionHeader title="About" />

        <Card
          marginHorizontal="$4"
          backgroundColor={C.card}
          borderRadius={14}
          borderWidth={1}
          borderColor={C.border}
          overflow="hidden"
        >
          <AboutRow label="About Bulk IPO Apply" isLink />
          <Separator backgroundColor={C.border} opacity={0.4} />
          <AboutRow label="Version" value="1.0.0 (Build 100)" />
          <Separator backgroundColor={C.border} opacity={0.4} />
          <AboutRow label="Built for" value="NEPSE Investors" />
          <Separator backgroundColor={C.border} opacity={0.4} />
          <TouchableOpacity activeOpacity={0.7}>
            <AboutRow label="Privacy Policy" isLink />
          </TouchableOpacity>
          <Separator backgroundColor={C.border} opacity={0.4} />
          <TouchableOpacity activeOpacity={0.7}>
            <AboutRow label="Terms of Service" isLink />
          </TouchableOpacity>
        </Card>

        {/* Security warning */}
        <XStack
          marginHorizontal="$4"
          marginTop="$4"
          padding="$3"
          backgroundColor={C.negative + '10'}
          borderRadius={10}
          borderWidth={1}
          borderColor={C.negative + '30'}
          gap="$2"
          alignItems="flex-start"
        >
          <AlertTriangle size={14} color={C.negative} style={{ marginTop: 2 }} />
          <SizableText
            flex={1}
            size="$1"
            color={C.negative}
            lineHeight={18}
          >
            ⚠️ All credentials are stored locally on your device. We never
            transmit your passwords to any server.
          </SizableText>
        </XStack>

        {/* App info footer */}
        <YStack alignItems="center" marginTop="$5" gap="$1">
          <SizableText size="$2" color={C.muted}>
            Bulk IPO Apply Nepal
          </SizableText>
          <SizableText size="$1" color={C.muted} opacity={0.5}>
            Made with ♥ for NEPSE Investors
          </SizableText>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
