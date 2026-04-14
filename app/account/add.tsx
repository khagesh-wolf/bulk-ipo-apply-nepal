/**
 * Add MeroShare Account Screen — Bulk IPO Apply Nepal
 * Full form to add a new DP account with searchable DP dropdown,
 * proper validation, test login, and secure local storage.
 */
import { useEffect, useState, useMemo } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
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
  User,
  Hash,
  CreditCard,
  Shield,
  Search,
  CheckCircle2,
  ChevronDown,
} from '@blinkdotnew/mobile-ui';
import { useAccountStore, useDPStore } from '@/store';
import { meroshareApi } from '@/lib/meroshareApi';
import type { DPEntity } from '@/lib/dpService';
import { useToast } from '@/components/Toast';
import { useConfirmation } from '@/components/ConfirmationModal';

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

const inputBase: any = {
  backgroundColor: '#334155',
  borderColor: '#475569',
  borderWidth: 1,
  borderRadius: 12,
  padding: 14,
  color: '#f1f5f9',
  fontSize: 15,
  ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
};

const webOutline: any =
  Platform.OS === 'web' ? { outlineStyle: 'none' } : {};

const MAX_DROPDOWN_ITEMS = 50;

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
  const { dpList, isLoading: dpLoading, fetchDPList, searchDP } = useDPStore();
  const { showSuccess, showError, showWarning } = useToast();
  const { confirm } = useConfirmation();

  // Form state
  const [nickname, setNickname] = useState('');
  const [selectedDP, setSelectedDP] = useState<DPEntity | null>(null);
  const [dpSearch, setDpSearch] = useState('');
  const [dpDropdownOpen, setDpDropdownOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [crn, setCrn] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch DP list on mount
  useEffect(() => {
    fetchDPList();
  }, [fetchDPList]);

  // Filtered DP list for search
  const filteredDPList = useMemo(() => {
    return searchDP(dpSearch);
  }, [dpSearch, searchDP, dpList]);

  const validate = () => {
    const e: Record<string, string> = {};

    if (!nickname.trim()) {
      e.nickname = 'Nickname is required';
    } else if (nickname.trim().length < 3) {
      e.nickname = 'Nickname must be at least 3 characters';
    } else if (nickname.trim().length > 50) {
      e.nickname = 'Nickname must be 50 characters or less';
    }

    if (!selectedDP) {
      e.dpId = 'Please select a DP';
    }

    if (!username.trim()) {
      e.username = 'Username is required';
    }

    if (!password.trim()) {
      e.password = 'Password is required';
    }

    if (!crn.trim()) {
      e.crn = 'CRN Number is required';
    } else if (!/^\d{8}$/.test(crn.trim())) {
      e.crn = 'CRN must be exactly 8 digits';
    }

    if (!pin.trim()) {
      e.pin = 'PIN is required';
    } else if (!/^\d{4}$/.test(pin.trim())) {
      e.pin = 'PIN must be exactly 4 digits';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleTestLogin = async () => {
    if (!selectedDP || !username.trim() || !password.trim()) {
      showWarning('Please fill DP ID, Username, and Password before testing.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      await meroshareApi.login(
        String(selectedDP.id),
        username.trim(),
        password.trim(),
      );
      setTestResult('success');
      showSuccess('Login credentials are valid! ✓');
    } catch (err) {
      setTestResult('error');
      const message =
        err instanceof Error ? err.message : 'Login failed';
      showError(message);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;

    // Check for duplicate accounts
    const existingAccounts = useAccountStore.getState().accounts;
    const duplicate = existingAccounts.find(
      (a) =>
        a.dpId === String(selectedDP!.id) &&
        a.username.toLowerCase() === username.trim().toLowerCase(),
    );
    if (duplicate) {
      showWarning(
        `An account with this DP and username already exists ("${duplicate.nickname}").`,
      );
      return;
    }

    // Show confirmation modal before saving
    const confirmed = await confirm({
      title: 'Save Account?',
      message: 'Your credentials will be encrypted and stored securely on this device.',
      confirmText: 'Save',
      cancelText: 'Cancel',
    });
    if (!confirmed) return;

    setIsSaving(true);
    try {
      await addAccount({
        nickname: nickname.trim(),
        dpId: String(selectedDP!.id),
        username: username.trim(),
        password: password.trim(),
        crn: crn.trim(),
        pin: pin.trim(),
        bankName: selectedDP!.name,
        bankId: String(selectedDP!.id),
        isActive: true,
        lastUsed: null,
      });
      showSuccess('Account added successfully! 🎉');
      // Navigate back after a short delay so users can read the success toast.
      // 800ms is intentionally brief — the toast persists for 3s after navigation.
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(tabs)/settings');
        }
      }, 800);
    } catch {
      showError('Failed to save account. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectDP = (dp: DPEntity) => {
    setSelectedDP(dp);
    setDpSearch('');
    setDpDropdownOpen(false);
    // Clear DP error if set
    if (errors.dpId) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.dpId;
        return next;
      });
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
          <FormField
            label="Account Nickname"
            required
            error={errors.nickname}
            helper="Min 3, max 50 characters"
          >
            <XStack
              alignItems="center"
              style={{
                ...inputBase,
                padding: 0,
                overflow: 'hidden',
              }}
            >
              <YStack paddingLeft={14} paddingRight={10} paddingVertical={14}>
                <User size={16} color={C.muted} />
              </YStack>
              <TextInput
                style={{
                  flex: 1,
                  color: C.white,
                  fontSize: 15,
                  paddingRight: 14,
                  paddingVertical: 14,
                  ...webOutline,
                }}
                placeholder="e.g. My Laxmi Bank DP"
                placeholderTextColor={C.muted}
                value={nickname}
                onChangeText={setNickname}
                maxLength={50}
              />
            </XStack>
          </FormField>

          {/* DP ID - Searchable Dropdown */}
          <FormField
            label="DP ID"
            required
            error={errors.dpId}
            helper="Select your Depository Participant"
          >
            {/* Selected DP or trigger */}
            <TouchableOpacity
              onPress={() => setDpDropdownOpen(!dpDropdownOpen)}
              activeOpacity={0.7}
            >
              <XStack
                alignItems="center"
                style={{
                  ...inputBase,
                  padding: 0,
                  overflow: 'hidden',
                  borderColor: dpDropdownOpen ? C.gold : C.border,
                }}
              >
                <YStack paddingLeft={14} paddingRight={10} paddingVertical={14}>
                  <Hash size={16} color={C.muted} />
                </YStack>
                <YStack flex={1} paddingVertical={14}>
                  {selectedDP ? (
                    <SizableText size="$3" color={C.white}>
                      [{selectedDP.id}] - {selectedDP.name}
                    </SizableText>
                  ) : (
                    <SizableText size="$3" color={C.muted}>
                      Select a Depository Participant
                    </SizableText>
                  )}
                </YStack>
                <YStack paddingHorizontal={14}>
                  {dpLoading ? (
                    <ActivityIndicator size="small" color={C.gold} />
                  ) : (
                    <ChevronDown size={16} color={C.muted} />
                  )}
                </YStack>
              </XStack>
            </TouchableOpacity>

            {/* Dropdown panel */}
            {dpDropdownOpen && (
              <YStack
                backgroundColor={C.surface}
                borderRadius={12}
                borderWidth={1}
                borderColor={C.gold + '40'}
                marginTop="$1"
                maxHeight={250}
                overflow="hidden"
              >
                {/* Search input */}
                <XStack
                  alignItems="center"
                  paddingHorizontal="$3"
                  paddingVertical="$2"
                  borderBottomWidth={1}
                  borderBottomColor={C.border}
                  gap="$2"
                >
                  <Search size={14} color={C.muted} />
                  <TextInput
                    style={{
                      flex: 1,
                      color: C.white,
                      fontSize: 14,
                      paddingVertical: Platform.OS === 'ios' ? 6 : 4,
                      ...webOutline,
                    }}
                    placeholder="Search by ID or name..."
                    placeholderTextColor={C.muted}
                    value={dpSearch}
                    onChangeText={setDpSearch}
                    autoFocus
                  />
                </XStack>

                {/* DP list */}
                {dpLoading ? (
                  <YStack padding="$4" alignItems="center">
                    <ActivityIndicator size="small" color={C.gold} />
                    <SizableText
                      size="$2"
                      color={C.muted}
                      marginTop="$2"
                    >
                      Loading DP list...
                    </SizableText>
                  </YStack>
                ) : filteredDPList.length === 0 ? (
                  <YStack padding="$4" alignItems="center">
                    <SizableText size="$3" color={C.muted}>
                      {dpList.length === 0
                        ? 'Could not load DP list'
                        : 'No matching DPs found'}
                    </SizableText>
                    {dpList.length === 0 && (
                      <TouchableOpacity
                        onPress={() => fetchDPList(true)}
                        style={{ marginTop: 8 }}
                        activeOpacity={0.7}
                      >
                        <SizableText
                          size="$2"
                          color={C.gold}
                          fontWeight="700"
                        >
                          Retry
                        </SizableText>
                      </TouchableOpacity>
                    )}
                  </YStack>
                ) : (
                  <FlatList
                    data={filteredDPList.slice(0, MAX_DROPDOWN_ITEMS)}
                    keyExtractor={(item) => String(item.id)}
                    keyboardShouldPersistTaps="handled"
                    style={{ maxHeight: 180 }}
                    renderItem={({ item }) => {
                      const isSelected = selectedDP?.id === item.id;
                      return (
                        <TouchableOpacity
                          onPress={() => handleSelectDP(item)}
                          activeOpacity={0.7}
                          style={{
                            paddingHorizontal: 14,
                            paddingVertical: 10,
                            backgroundColor: isSelected
                              ? C.gold + '15'
                              : 'transparent',
                            borderBottomWidth: 1,
                            borderBottomColor: C.border + '60',
                          }}
                        >
                          <XStack
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <YStack flex={1}>
                              <SizableText
                                size="$3"
                                color={isSelected ? C.gold : C.white}
                                fontWeight={isSelected ? '700' : '500'}
                                numberOfLines={1}
                              >
                                [{item.id}] - {item.name}
                              </SizableText>
                            </YStack>
                            {isSelected && (
                              <CheckCircle2 size={16} color={C.gold} />
                            )}
                          </XStack>
                        </TouchableOpacity>
                      );
                    }}
                  />
                )}
              </YStack>
            )}
          </FormField>

          {/* Username */}
          <FormField
            label="MeroShare Username"
            required
            error={errors.username}
          >
            <XStack
              alignItems="center"
              style={{ ...inputBase, padding: 0, overflow: 'hidden' }}
            >
              <YStack paddingLeft={14} paddingRight={10} paddingVertical={14}>
                <User size={16} color={C.muted} />
              </YStack>
              <TextInput
                style={{
                  flex: 1,
                  color: C.white,
                  fontSize: 15,
                  paddingRight: 14,
                  paddingVertical: 14,
                  ...webOutline,
                }}
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
                style={{
                  flex: 1,
                  color: C.white,
                  fontSize: 15,
                  paddingVertical: 14,
                  ...webOutline,
                }}
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
          <FormField
            label="CRN Number"
            required
            error={errors.crn}
            helper="8-digit Capital Registration Number"
          >
            <XStack
              alignItems="center"
              style={{ ...inputBase, padding: 0, overflow: 'hidden' }}
            >
              <YStack paddingLeft={14} paddingRight={10} paddingVertical={14}>
                <CreditCard size={16} color={C.muted} />
              </YStack>
              <TextInput
                style={{
                  flex: 1,
                  color: C.white,
                  fontSize: 15,
                  paddingRight: 14,
                  paddingVertical: 14,
                  ...webOutline,
                }}
                placeholder="Capital Registration Number"
                placeholderTextColor={C.muted}
                value={crn}
                onChangeText={setCrn}
                keyboardType="number-pad"
                maxLength={8}
              />
            </XStack>
          </FormField>

          {/* PIN */}
          <FormField
            label="PIN"
            required
            error={errors.pin}
            helper="4-digit transaction PIN"
          >
            <XStack
              alignItems="center"
              style={{ ...inputBase, padding: 0, overflow: 'hidden' }}
            >
              <YStack paddingLeft={14} paddingRight={10} paddingVertical={14}>
                <Shield size={16} color={C.muted} />
              </YStack>
              <TextInput
                style={{
                  flex: 1,
                  color: C.white,
                  fontSize: 15,
                  paddingRight: 14,
                  paddingVertical: 14,
                  letterSpacing: 8,
                  ...webOutline,
                }}
                placeholder="Transaction PIN"
                placeholderTextColor={C.muted}
                value={pin}
                onChangeText={setPin}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry={!showPin}
              />
              <TouchableOpacity
                onPress={() => setShowPin(!showPin)}
                style={{ paddingHorizontal: 14, paddingVertical: 14 }}
                activeOpacity={0.7}
              >
                {showPin ? (
                  <EyeOff size={16} color={C.muted} />
                ) : (
                  <Eye size={16} color={C.muted} />
                )}
              </TouchableOpacity>
            </XStack>
          </FormField>
        </Card>

        {/* ════ Test Login Button ════ */}
        <TouchableOpacity
          onPress={handleTestLogin}
          disabled={isTesting || !selectedDP || !username.trim() || !password.trim()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 16,
            backgroundColor:
              testResult === 'success'
                ? C.positive + '20'
                : testResult === 'error'
                  ? C.negative + '20'
                  : C.surface,
            borderRadius: 14,
            paddingVertical: 14,
            borderWidth: 1,
            borderColor:
              testResult === 'success'
                ? C.positive + '60'
                : testResult === 'error'
                  ? C.negative + '60'
                  : C.gold + '40',
            opacity:
              isTesting || !selectedDP || !username.trim() || !password.trim()
                ? 0.5
                : 1,
          }}
          activeOpacity={0.7}
        >
          {isTesting ? (
            <ActivityIndicator size="small" color={C.gold} />
          ) : testResult === 'success' ? (
            <CheckCircle2 size={16} color={C.positive} />
          ) : (
            <Shield size={16} color={C.gold} />
          )}
          <SizableText
            size="$3"
            fontWeight="700"
            color={
              testResult === 'success'
                ? C.positive
                : testResult === 'error'
                  ? C.negative
                  : C.gold
            }
          >
            {isTesting
              ? 'Testing Login...'
              : testResult === 'success'
                ? 'Credentials Verified ✓'
                : testResult === 'error'
                  ? 'Test Failed — Try Again'
                  : 'Test Login'}
          </SizableText>
        </TouchableOpacity>

        {/* ════ Save Button ════ */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 12,
            backgroundColor: isSaving ? C.gold + '60' : C.gold,
            borderRadius: 14,
            paddingVertical: 16,
            opacity: isSaving ? 0.8 : 1,
          }}
          activeOpacity={0.85}
        >
          <Lock size={18} color="#0f172a" />
          <SizableText size="$4" fontWeight="800" color="#0f172a">
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
