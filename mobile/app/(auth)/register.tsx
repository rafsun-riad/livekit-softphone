import { useMutation } from "@tanstack/react-query";
import { Link } from "expo-router";
import { ChevronLeft, UserRound } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthField } from "@/src/components/auth/auth-field";
import { register } from "@/src/features/auth/api";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { appColors, appTypography } from "@/src/theme/app-theme";

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const registerMutation = useMutation({
    mutationFn: register,
    onSuccess: () => {
      setSuccessMessage("Account created. You can sign in now.");
    },
  });

  return (
    <View style={styles.screen}>
      <View style={styles.iconBadge}>
        <UserRound color={appColors.textPrimary} size={22} strokeWidth={2.2} />
      </View>
      <Text style={styles.eyebrow}>Account Setup</Text>
      <Text style={styles.title}>Create your softphone account</Text>
      <Text style={styles.body}>
        Register with phone number, email, and password. The backend stores the
        account, then sign-in creates the durable device session.
      </Text>

      <AuthField
        autoCapitalize="words"
        autoCorrect={false}
        label="Display name"
        onChangeText={setDisplayName}
        placeholder="Rafsun"
        value={displayName}
      />
      <AuthField
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="phone-pad"
        label="Phone number"
        onChangeText={setPhoneNumber}
        placeholder="+1 415 555 2671"
        value={phoneNumber}
      />
      <AuthField
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        label="Email"
        onChangeText={setEmail}
        placeholder="you@example.com"
        value={email}
      />
      <AuthField
        autoCapitalize="none"
        autoCorrect={false}
        label="Password"
        onChangeText={setPassword}
        placeholder="Choose a strong password"
        secureTextEntry
        value={password}
      />

      {registerMutation.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(registerMutation.error)}
        </Text>
      ) : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      <Pressable
        disabled={registerMutation.isPending}
        onPress={() => {
          setSuccessMessage("");
          registerMutation.mutate({
            displayName,
            email,
            password,
            phoneNumber,
          });
        }}
        style={[
          styles.primaryAction,
          registerMutation.isPending && styles.disabledAction,
        ]}
      >
        <Text style={styles.primaryLabel}>
          {registerMutation.isPending
            ? "Creating account..."
            : "Create account"}
        </Text>
      </Pressable>

      <Link href="/(auth)/login" asChild>
        <Pressable style={styles.action}>
          <ChevronLeft
            color={appColors.textMuted}
            size={18}
            strokeWidth={2.2}
          />
          <Text style={styles.actionLabel}>Back to sign in</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: appColors.background,
  },
  iconBadge: {
    alignItems: "center",
    backgroundColor: appColors.surface,
    borderRadius: 18,
    height: 54,
    justifyContent: "center",
    marginBottom: 20,
    width: 54,
  },
  eyebrow: {
    color: appColors.cyanSoft,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  title: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 38,
    marginBottom: 16,
  },
  body: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    maxWidth: 340,
  },
  errorText: {
    color: "#fca5a5",
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  successText: {
    color: "#86efac",
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 18,
    marginBottom: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  primaryLabel: {
    color: appColors.primarySoft,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  disabledAction: {
    opacity: 0.65,
  },
  action: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionLabel: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
