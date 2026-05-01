// ─── Login Screen ─────────────────────────────────────────────────────────────

import React, { useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../constants/colors";
import { Spacing, Radius, FontSize, FontWeight } from "../constants/theme";
import GradientButton from "../components/GradientButton";
import ErrorMessage from "../components/ErrorMessage";
import { loginUser, resetPassword } from "../services/auth";
import { StackScreenProps } from "@react-navigation/stack";
import type { AuthStackParamList } from "../types";

type Props = StackScreenProps<AuthStackParamList, "Login">;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6)
      e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setGeneralError("");
    try {
      await loginUser(email.trim(), password);
      // Navigation handled by AppNavigator via auth state change
    } catch (err: any) {
      setGeneralError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email.trim()) {
      setGeneralError("Enter your email address first.");
      return;
    }
    setGeneralError("");
    try {
      await resetPassword(email.trim());
      Alert.alert("Email Sent", "Check your inbox for the reset link.");
    } catch (err: any) {
      setGeneralError(err.message);
    }
  };

  return (
    <LinearGradient colors={Colors.gradientDark} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.kav}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <LinearGradient
                colors={Colors.gradientPrimary}
                style={styles.logoCircle}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons
                  name="wallet"
                  size={36}
                  color={Colors.white}
                />
              </LinearGradient>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in to your WalletX account
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <InputField
                label="Email"
                icon="email-outline"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />
              <InputField
                label="Password"
                icon="lock-outline"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                error={errors.password}
                rightIcon={showPwd ? "eye-off-outline" : "eye-outline"}
                onRightIconPress={() => setShowPwd(!showPwd)}
              />

              <TouchableOpacity onPress={handleForgot} style={styles.forgot}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

              <ErrorMessage message={generalError} />

              <GradientButton
                label="Sign In"
                onPress={handleLogin}
                loading={loading}
                style={styles.btn}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
                  <Text style={styles.footerLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ── Reusable input field ───────────────────────────────────────────────────────
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
  container: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: "center",
    paddingTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    shadowColor: Colors.accent1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    marginBottom: Spacing.xs,
  },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm },
  form: { gap: Spacing.sm },
  forgot: { alignSelf: "flex-end" },
  forgotText: {
    color: Colors.accent1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  btn: { marginTop: Spacing.md },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.md,
  },
  footerText: { color: Colors.textMuted, fontSize: FontSize.sm },
  footerLink: {
    color: Colors.accent1,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
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
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  rowError: { borderColor: Colors.expense },
  icon: { marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.text, fontSize: FontSize.md },
  error: { color: Colors.expense, fontSize: FontSize.xs, marginTop: 4 },
});
