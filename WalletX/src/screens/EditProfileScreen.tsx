// ─── Edit Profile Screen ─────────────────────────────────────────────────────

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StackScreenProps } from "@react-navigation/stack";
import Colors from "../constants/colors";
import { Spacing, Radius, FontSize, FontWeight } from "../constants/theme";
import GradientButton from "../components/GradientButton";
import ErrorMessage from "../components/ErrorMessage";
import { useAuth } from "../context/AuthContext";
import {
  reauthenticateUser,
  updateUserName,
  updateUserPassword,
} from "../services/auth";
import { updateUserDoc } from "../services/firestore";
import type { AppStackParamList } from "../types";

type Props = StackScreenProps<AppStackParamList, "EditProfile">;

export default function EditProfileScreen({ navigation }: Props) {
  const { user, userProfile } = useAuth();
  const originalName = useMemo(
    () => (userProfile?.name ?? user?.displayName ?? "").trim(),
    [userProfile?.name, user?.displayName],
  );

  const [name, setName] = useState(originalName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>(
    {},
  );
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateProfile = () => {
    const e: Record<string, string> = {};
    const nameTrim = name.trim();
    const wantsName = nameTrim !== originalName;

    if (!nameTrim) e.name = "Name is required";

    if (!wantsName) {
      setProfileError("No profile changes to save.");
    } else {
      setProfileError("");
    }

    setProfileErrors(e);
    return Object.keys(e).length === 0 && wantsName;
  };

  const validatePassword = () => {
    const e: Record<string, string> = {};
    const wantsPassword = newPassword.length > 0;

    if (!wantsPassword) {
      setPasswordError("No password changes to save.");
      setPasswordErrors({});
      return false;
    }

    if (!currentPassword) e.currentPassword = "Current password is required";
    if (newPassword.length < 6) e.newPassword = "At least 6 characters";
    if (confirmPassword !== newPassword)
      e.confirmPassword = "Passwords do not match";

    setPasswordError("");
    setPasswordErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!user) {
      setProfileError("No authenticated user found.");
      return;
    }
    if (!validateProfile()) return;

    const nameTrim = name.trim();
    const wantsName = nameTrim !== originalName;

    setProfileLoading(true);
    setProfileError("");

    try {
      if (wantsName) {
        await updateUserName(user, nameTrim);
        await updateUserDoc(user.uid, { name: nameTrim });
      }

      Alert.alert("Profile Updated", "Your profile changes have been saved.");
    } catch (err: any) {
      setProfileError(err.message ?? "Update failed. Try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) {
      setPasswordError("No authenticated user found.");
      return;
    }
    if (!validatePassword()) return;

    setPasswordLoading(true);
    setPasswordError("");

    try {
      await reauthenticateUser(user, currentPassword);
      await updateUserPassword(user, newPassword);

      Alert.alert("Password Updated", "Your password has been changed.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message ?? "Update failed. Try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={26}
                color={Colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Profile</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Profile Info</Text>
            <InputField
              label="Full Name"
              icon="account-outline"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              error={profileErrors.name}
            />
            <Text style={styles.sectionHint}>
              Name updates do not require your current password.
            </Text>

            <ErrorMessage message={profileError} />

            <GradientButton
              label="Save Profile"
              onPress={handleSaveProfile}
              loading={profileLoading}
              style={styles.saveBtn}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Change Password</Text>
            <InputField
              label="Current Password"
              icon="lock-outline"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPwd}
              error={passwordErrors.currentPassword}
              rightIcon={showCurrentPwd ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowCurrentPwd(!showCurrentPwd)}
            />
            <InputField
              label="New Password"
              icon="lock-reset"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPwd}
              error={passwordErrors.newPassword}
              rightIcon={showNewPwd ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowNewPwd(!showNewPwd)}
            />
            <InputField
              label="Confirm New Password"
              icon="lock-check-outline"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showNewPwd}
              error={passwordErrors.confirmPassword}
            />
            <Text style={styles.hint}>
              Leave new password blank to keep your current password.
            </Text>

            <ErrorMessage message={passwordError} />

            <GradientButton
              label="Save Password"
              onPress={handleChangePassword}
              loading={passwordLoading}
              style={styles.saveBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface InputFieldProps extends TextInputProps {
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  error?: string;
  rightIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  onRightIconPress?: () => void;
}

function InputField({
  label,
  icon,
  error,
  rightIcon,
  onRightIconPress,
  ...props
}: InputFieldProps) {
  return (
    <View style={inputStyles.wrapper}>
      <Text style={inputStyles.label}>{label}</Text>
      <View style={[inputStyles.row, error && inputStyles.rowError]}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={Colors.textMuted}
          style={inputStyles.icon}
        />
        <TextInput
          style={inputStyles.input}
          placeholderTextColor={Colors.textDim}
          selectionColor={Colors.accent1}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress}>
            <MaterialCommunityIcons
              name={rightIcon}
              size={20}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={inputStyles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  scroll: { padding: Spacing.lg, paddingBottom: 60 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: Spacing.xs,
  },
  sectionHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  saveBtn: { marginTop: Spacing.md },
});

const inputStyles = StyleSheet.create({
  wrapper: { marginBottom: Spacing.sm },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  rowError: { borderColor: Colors.expense },
  icon: { marginRight: 2 },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSize.md,
  },
  error: {
    color: Colors.expense,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
});
