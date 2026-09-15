import { useMutation } from "@tanstack/react-query";
import { Link, useRouter } from "expo-router";
import { Phone, UserRoundPlus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthField } from "@/src/components/auth/auth-field";
import { login } from "@/src/features/auth/api";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

export default function LoginScreen() {
  const router = useRouter();
  const persistSession = useAuthStore((state: AuthState) => state.setSession);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (session) => {
      await persistSession(session);
      router.replace("/(app)");
    },
  });

  return (
    <View style={styles.screen}>
      <View style={styles.iconBadge}>
        <Phone color={appColors.primarySoft} size={22} strokeWidth={2.2} />
      </View>
      <Text style={styles.kicker}>LiveKit Softphone</Text>
      <Text style={styles.title}>Sign in on your Android device</Text>
      <Text style={styles.body}>
        Use the Django auth API with a durable device session stored in secure
        storage.
      </Text>

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
        label="Password"
        onChangeText={setPassword}
        placeholder="Enter your password"
        secureTextEntry
        value={password}
      />

      {loginMutation.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(loginMutation.error)}
        </Text>
      ) : null}

      <Pressable
        disabled={loginMutation.isPending}
        onPress={() => {
          loginMutation.mutate({ password, phoneNumber });
        }}
        style={[
          styles.primaryAction,
          loginMutation.isPending && styles.disabledAction,
        ]}
      >
        <Text style={styles.primaryLabel}>
          {loginMutation.isPending ? "Signing in..." : "Sign in"}
        </Text>
      </Pressable>

      <Link href="/(auth)/register" asChild>
        <Pressable style={styles.secondaryAction}>
          <UserRoundPlus
            color={appColors.textMuted}
            size={18}
            strokeWidth={2.2}
          />
          <Text style={styles.secondaryLabel}>Create an account</Text>
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
    backgroundColor: appColors.primary,
    borderRadius: 18,
    height: 54,
    justifyContent: "center",
    marginBottom: 20,
    width: 54,
  },
  kicker: {
    color: appColors.cyan,
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
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 40,
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
    marginBottom: 16,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 14,
  },
  disabledAction: {
    opacity: 0.65,
  },
  primaryLabel: {
    color: appColors.primarySoft,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryAction: {
    alignItems: "center",
    borderColor: appColors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  secondaryLabel: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
