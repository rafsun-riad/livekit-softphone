import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { Settings, UserRound } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AuthField } from "@/src/components/auth/auth-field";
import { AppScrollScreen } from "@/src/components/layout/app-scroll-screen";
import { getCurrentUser, updateCurrentUser } from "@/src/features/auth/api";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import type { AuthState } from "@/src/stores/auth-store";
import { useAuthStore } from "@/src/stores/auth-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state: AuthState) => state.setUser);
  const session = useAuthStore((state: AuthState) => state.session);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const meQuery = useQuery({
    queryFn: ({ signal }) => getCurrentUser({ signal }),
    queryKey: ["me"],
  });

  useEffect(() => {
    if (!meQuery.data) {
      return;
    }

    setDisplayName(meQuery.data.display_name ?? "");
    setEmail(meQuery.data.email ?? "");
    setFirstName(meQuery.data.first_name ?? "");
    setLastName(meQuery.data.last_name ?? "");
  }, [meQuery.data]);

  const updateMutation = useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: async (user) => {
      await setUser(user);
      queryClient.setQueryData(["me"], user);
      setSuccessMessage("Profile updated successfully.");
    },
  });

  return (
    <AppScrollScreen contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.iconBadge}>
            <UserRound
              color={appColors.primarySoft}
              size={22}
              strokeWidth={2.2}
            />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>Profile</Text>
            <Text style={styles.title}>
              Keep your caller identity up to date
            </Text>
          </View>
        </View>
        <Text style={styles.body}>
          Your phone number stays server-controlled. Display details can be
          edited here and are persisted to the Django account.
        </Text>
      </View>

      <View style={styles.metaCard}>
        <Text style={styles.metaLabel}>Phone number</Text>
        <Text style={styles.metaValue}>
          {meQuery.data?.phone_number_normalized ||
            session?.user.phone_number_normalized ||
            "Not available"}
        </Text>
      </View>

      <AuthField
        autoCapitalize="words"
        autoCorrect={false}
        label="Display name"
        onChangeText={(value) => {
          setDisplayName(value);
          setSuccessMessage("");
        }}
        placeholder="How contacts should see you"
        value={displayName}
      />
      <AuthField
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        label="Email"
        onChangeText={(value) => {
          setEmail(value);
          setSuccessMessage("");
        }}
        placeholder="you@example.com"
        value={email}
      />
      <AuthField
        autoCapitalize="words"
        autoCorrect={false}
        label="First name"
        onChangeText={(value) => {
          setFirstName(value);
          setSuccessMessage("");
        }}
        placeholder="First name"
        value={firstName}
      />
      <AuthField
        autoCapitalize="words"
        autoCorrect={false}
        label="Last name"
        onChangeText={(value) => {
          setLastName(value);
          setSuccessMessage("");
        }}
        placeholder="Last name"
        value={lastName}
      />

      {meQuery.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(meQuery.error)}
        </Text>
      ) : null}
      {updateMutation.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(updateMutation.error)}
        </Text>
      ) : null}
      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      <Pressable
        disabled={meQuery.isLoading || updateMutation.isPending}
        onPress={() => {
          updateMutation.mutate({
            displayName,
            email,
            firstName,
            lastName,
          });
        }}
        style={[
          styles.primaryAction,
          (meQuery.isLoading || updateMutation.isPending) &&
            styles.disabledAction,
        ]}
      >
        <Text style={styles.primaryLabel}>
          {updateMutation.isPending ? "Saving profile..." : "Save profile"}
        </Text>
      </Pressable>

      <Link href="./settings" asChild>
        <Pressable style={styles.secondaryAction}>
          <Settings color={appColors.textMuted} size={18} strokeWidth={2.2} />
          <Text style={styles.secondaryLabel}>Open settings</Text>
        </Pressable>
      </Link>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: appColors.background,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  heroCard: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 18,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  heroRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
    marginBottom: 14,
  },
  iconBadge: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  heroCopy: {
    flex: 1,
  },
  kicker: {
    color: appColors.cyan,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  title: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
  },
  body: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 15,
    lineHeight: 22,
  },
  metaCard: {
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  metaLabel: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    marginBottom: 8,
  },
  metaValue: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
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
  secondaryAction: {
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
  secondaryLabel: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "600",
  },
  disabledAction: {
    opacity: 0.65,
  },
});
