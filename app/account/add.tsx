/**
 * Add MeroShare Account Screen — Bulk IPO Apply Nepal
 * Full form to add a new DP account with secure local storage
 */
import { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import {
  YStack,
  XStack,
  SizableText,
  Card,
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
  Info,
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
export default function AddAccountScreen() {
  const { addAccount } = useAccountStore();

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

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      await addAccount({
        nickname: nickname.trim(),
        dpId: dpId.trim(),
        username: username.trim(),
        password: password.trim(),
        crn: crn.trim(),
        pin: pin.trim(),
        bankName: bankName.trim(),
        bankId: bankId.trim(),
        isActive: true,
        lastUsed: null,
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save account. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

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
        <XStack alignItems="center" gap="$3" marginBottom="$2">
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
            <SizableText size="$5" fontWeight="800" color={C.white}>
              Add MeroShare Account
            </SizableText>
            <XStack alignItems="center" gap="$1" marginTop="$0.5">
              <Lock size={11} color={C.positive} />
              <SizableText size="$2" color={C.positive}>
                Your credentials stay on this device
              </SizableText>
            </XStack>
          </YStack>
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
              style={{
                ...inputBase,
                padding: 0,
                overflow: 'hidden',
              }}
            >
              <YStack
                paddingLeft={14}
                paddingRight={10}
                paddingVertical={14}
              >
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
            opacity: isSaving ? 0.8 : 1,
          }}
          activeOpacity={0.85}
        >
          <Lock size={18} color="#0A0E1A" />
          <SizableText size="$4" fontWeight="800" color="#0A0E1A">
            {isSaving ? 'Saving…' : 'Save Account Securely'}
          </SizableText>
        </TouchableOpacity>

        {/* ════ Security Note Card ════ */}
        <Card
          marginTop="$4"
          padding="$4"
          backgroundColor={C.surface + 'AA'}
          borderRadius={14}
          borderWidth={1}
          borderColor={C.positive + '30'}
        >
          <XStack gap="$3" alignItems="flex-start">
            <YStack
              width={40}
              height={40}
              borderRadius={20}
              backgroundColor={C.positive + '20'}
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Lock size={18} color={C.positive} />
            </YStack>
            <YStack flex={1} gap="$1">
              <SizableText size="$3" fontWeight="800" color={C.positive}>
                🔒 Zero-Knowledge Security
              </SizableText>
              <SizableText size="$2" color={C.muted} lineHeight={20}>
                Your credentials are encrypted using AES-256 and stored only on
                this device. They are never sent to our servers.
              </SizableText>
            </YStack>
          </XStack>
        </Card>
      </ScrollView>
    </YStack>
  );
}
