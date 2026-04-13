/**
 * Edit MeroShare Account Screen — Bulk IPO Apply Nepal
 * Pre-populated form to edit an existing DP account
 */
import { useState, useEffect } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  YStack,
  XStack,
  SizableText,
  Card,
  Separator,
} from '@blinkdotnew/mobile-ui';
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Building2,
  User,
  Hash,
  CreditCard,
  Shield,
  Trash2,
  Save,
} from '@blinkdotnew/mobile-ui';
import { useAccountStore } from '@/store';

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
  padding: 14,
  color: '#FFFFFF',
  fontSize: 15,
  ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
};

// ─── Form Field ───────────────────────────────────────────────────────────────
function FormField({
  label,
  required,
  helper,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <YStack gap="$1">
      <XStack gap="$1" alignItems="center">
        <SizableText size="$2" color={C.muted} fontWeight="600">
          {label}
        </SizableText>
        {required && (
          <SizableText size="$2" color={C.gold}>
            *
          </SizableText>
        )}
      </XStack>
      {children}
      {helper && !error && (
        <SizableText size="$1" color={C.muted} paddingLeft="$1">
          {helper}
        </SizableText>
      )}
      {error && (
        <SizableText size="$1" color={C.negative} paddingLeft="$1">
          {error}
        </SizableText>
      )}
    </YStack>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EditAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { accounts, updateAccount, deleteAccount } = useAccountStore();

  const account = accounts.find((a) => a.id === id);

  const [nickname, setNickname] = useState('');
  const [dpId, setDpId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [crn, setCrn] = useState('');
  const [pin, setPin] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankId, setBankId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-populate form from existing account
  useEffect(() => {
    if (account) {
      setNickname(account.nickname);
      setDpId(account.dpId);
      setUsername(account.username);
      setPassword(account.password);
      setCrn(account.crn);
      setPin(account.pin);
      setBankName(account.bankName);
      setBankId(account.bankId);
    }
  }, [account]);

  if (!account) {
    return (
      <YStack
        flex={1}
        backgroundColor={C.bg}
        alignItems="center"
        justifyContent="center"
        gap="$3"
      >
        <SizableText size="$5" color={C.muted}>
          Account not found
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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!nickname.trim()) e.nickname = 'Nickname is required';
    if (!dpId.trim()) e.dpId = 'DP ID is required';
    else if (!/^\d+$/.test(dpId)) e.dpId = 'DP ID must be numeric';
    if (!username.trim()) e.username = 'Username is required';
    if (!password.trim()) e.password = 'Password is required';
    if (!crn.trim()) e.crn = 'CRN Number is required';
    if (!pin.trim()) e.pin = 'PIN is required';
    else if (pin.length !== 4) e.pin = 'PIN must be exactly 4 digits';
    if (!bankName.trim()) e.bankName = 'Bank name is required';
    if (!bankId.trim()) e.bankId = 'Bank ID is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await updateAccount({
        ...account,
        nickname: nickname.trim(),
        dpId: dpId.trim(),
        username: username.trim(),
        password: password.trim(),
        crn: crn.trim(),
        pin: pin.trim(),
        bankName: bankName.trim(),
        bankId: bankId.trim(),
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to update account. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      `Remove "${account.nickname}" from your accounts? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount(account.id);
            router.back();
          },
        },
      ],
    );
  };

  // Avatar initials
  const initials = account.nickname
    .split(' ')
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

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

          {/* Avatar + name */}
          <XStack alignItems="center" gap="$3" flex={1}>
            <YStack
              width={42}
              height={42}
              borderRadius={21}
              backgroundColor={C.gold}
              alignItems="center"
              justifyContent="center"
            >
              <SizableText size="$3" fontWeight="800" color="#0A0E1A">
                {initials}
              </SizableText>
            </YStack>
            <YStack>
              <SizableText size="$5" fontWeight="800" color={C.white}>
                Edit Account
              </SizableText>
              <SizableText size="$2" color={C.muted}>
                {account.nickname}
              </SizableText>
            </YStack>
          </XStack>
        </XStack>
      </YStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* ════ Form Card ════ */}
        <Card
          backgroundColor={C.card}
          borderRadius={16}
          borderWidth={1}
          borderColor={C.border}
          padding="$4"
          gap="$4"
        >
          {/* Account Nickname */}
          <FormField label="Account Nickname" required error={errors.nickname}>
            <XStack
              alignItems="center"
              style={{ ...inputBase, padding: 0, overflow: 'hidden' }}
            >
              <YStack paddingLeft={14} paddingRight={10} paddingVertical={14}>
                <User size={16} color={C.muted} />
              </YStack>
              <TextInput
                style={{ flex: 1, color: C.white, fontSize: 15, paddingRight: 14, paddingVertical: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) }}
                placeholder="e.g. My Laxmi Bank DP"
                placeholderTextColor={C.muted}
                value={nickname}
                onChangeText={setNickname}
              />
            </XStack>
          </FormField>

          {/* DP ID */}
          <FormField label="DP ID" required error={errors.dpId}>
            <XStack
              alignItems="center"
              style={{ ...inputBase, padding: 0, overflow: 'hidden' }}
            >
              <YStack paddingLeft={14} paddingRight={10} paddingVertical={14}>
                <Hash size={16} color={C.muted} />
              </YStack>
              <TextInput
                style={{ flex: 1, color: C.white, fontSize: 15, paddingRight: 14, paddingVertical: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) }}
                placeholder="e.g. 13060001234"
                placeholderTextColor={C.muted}
                value={dpId}
                onChangeText={setDpId}
                keyboardType="number-pad"
              />
            </XStack>
          </FormField>

          {/* Username */}
          <FormField label="MeroShare Username" required error={errors.username}>
            <XStack
              alignItems="center"
              style={{ ...inputBase, padding: 0, overflow: 'hidden' }}
            >
              <YStack paddingLeft={14} paddingRight={10} paddingVertical={14}>
                <User size={16} color={C.muted} />
              </YStack>
              <TextInput
                style={{ flex: 1, color: C.white, fontSize: 15, paddingRight: 14, paddingVertical: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) }}
                placeholder="Enter your username"
                placeholderTextColor={C.muted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </XStack>
          </FormField>

          {/* Password */}
          <FormField label="Password" required error={errors.password}>
            <XStack
              alignItems="center"
              style={{ ...inputBase, padding: 0, overflow: 'hidden' }}
            >
              <YStack paddingLeft={14} paddingRight={10} paddingVertical={14}>
                <Lock size={16} color={C.muted} />
              </YStack>
              <TextInput
                style={{ flex: 1, color: C.white, fontSize: 15, paddingVertical: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) }}
                placeholder="Your MeroShare password"
                placeholderTextColor={C.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ paddingHorizontal: 14, paddingVertical: 14 }}
                activeOpacity={0.7}
              >
                {showPassword ? (
                  <EyeOff size={16} color={C.muted} />
                ) : (
                  <Eye size={16} color={C.muted} />
                )}
              </TouchableOpacity>
            </XStack>
          </FormField>

          {/* CRN */}
          <FormField label="CRN Number" required error={errors.crn}>
            <XStack
              alignItems="center"
              style={{ ...inputBase, padding: 0, overflow: 'hidden' }}
            >
              <YStack paddingLeft={14} paddingRight={10} paddingVertical={14}>
                <CreditCard size={16} color={C.muted} />
              </YStack>
              <TextInput
                style={{ flex: 1, color: C.white, fontSize: 15, paddingRight: 14, paddingVertical: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) }}
                placeholder="Capital Registration Number"
                placeholderTextColor={C.muted}
                value={crn}
                onChangeText={setCrn}
                autoCapitalize="characters"
              />
            </XStack>
          </FormField>

          {/* PIN */}
          <FormField label="PIN" required error={errors.pin}>
            <XStack
              alignItems="center"
              style={{ ...inputBase, padding: 0, overflow: 'hidden' }}
            >
              <YStack paddingLeft={14} paddingRight={10} paddingVertical={14}>
                <Shield size={16} color={C.muted} />
              </YStack>
              <TextInput
                style={{ flex: 1, color: C.white, fontSize: 15, paddingRight: 14, paddingVertical: 14, letterSpacing: 8, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) }}
                placeholder="4-digit PIN"
                placeholderTextColor={C.muted}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </XStack>
          </FormField>

          {/* Bank Name */}
          <FormField label="Bank Name" required error={errors.bankName}>
            <XStack
              alignItems="center"
              style={{ ...inputBase, padding: 0, overflow: 'hidden' }}
            >
              <YStack paddingLeft={14} paddingRight={10} paddingVertical={14}>
                <Building2 size={16} color={C.muted} />
              </YStack>
              <TextInput
                style={{ flex: 1, color: C.white, fontSize: 15, paddingRight: 14, paddingVertical: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) }}
                placeholder="e.g. Laxmi Bank"
                placeholderTextColor={C.muted}
                value={bankName}
                onChangeText={setBankName}
              />
            </XStack>
          </FormField>

          {/* Bank ID */}
          <FormField
            label="Bank ID"
            required
            error={errors.bankId}
            helper="Find in MeroShare app settings"
          >
            <XStack
              alignItems="center"
              style={{ ...inputBase, padding: 0, overflow: 'hidden' }}
            >
              <YStack paddingLeft={14} paddingRight={10} paddingVertical={14}>
                <Hash size={16} color={C.muted} />
              </YStack>
              <TextInput
                style={{ flex: 1, color: C.white, fontSize: 15, paddingRight: 14, paddingVertical: 14, ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) }}
                placeholder="Bank ID from MeroShare"
                placeholderTextColor={C.muted}
                value={bankId}
                onChangeText={setBankId}
                keyboardType="number-pad"
              />
            </XStack>
          </FormField>
        </Card>

        {/* ════ Save Button ════ */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 20,
            backgroundColor: isSaving ? C.gold + '60' : C.gold,
            borderRadius: 14,
            paddingVertical: 16,
          }}
          activeOpacity={0.85}
        >
          <Save size={18} color="#0A0E1A" />
          <SizableText size="$4" fontWeight="800" color="#0A0E1A">
            {isSaving ? 'Saving…' : 'Save Changes'}
          </SizableText>
        </TouchableOpacity>

        {/* ════ Metadata ════ */}
        <Card
          marginTop="$4"
          padding="$3"
          backgroundColor={C.card}
          borderRadius={12}
          borderWidth={1}
          borderColor={C.border}
        >
          <XStack justifyContent="space-between" alignItems="center">
            <SizableText size="$2" color={C.muted}>
              Created
            </SizableText>
            <SizableText size="$2" color={C.text}>
              {new Date(account.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </SizableText>
          </XStack>
          {account.lastUsed && (
            <>
              <Separator backgroundColor={C.border} opacity={0.4} marginVertical="$2" />
              <XStack justifyContent="space-between" alignItems="center">
                <SizableText size="$2" color={C.muted}>
                  Last Used
                </SizableText>
                <SizableText size="$2" color={C.text}>
                  {new Date(account.lastUsed).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </SizableText>
              </XStack>
            </>
          )}
        </Card>

        {/* ════ Delete Button ════ */}
        <TouchableOpacity
          onPress={handleDelete}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 12,
            backgroundColor: C.negative + '15',
            borderWidth: 1,
            borderColor: C.negative + '40',
            borderRadius: 14,
            paddingVertical: 16,
          }}
          activeOpacity={0.8}
        >
          <Trash2 size={18} color={C.negative} />
          <SizableText size="$4" fontWeight="700" color={C.negative}>
            Delete Account
          </SizableText>
        </TouchableOpacity>

        <SizableText
          size="$1"
          color={C.muted}
          textAlign="center"
          marginTop="$2"
        >
          This will permanently remove the account and all associated data
        </SizableText>
      </ScrollView>
    </YStack>
  );
}
