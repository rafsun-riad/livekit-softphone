import { useDeferredValue, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "expo-router";
import { ContactRound, Search as SearchIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppScrollScreen } from "@/src/components/layout/app-scroll-screen";
import { createContact, searchUsers } from "@/src/features/contacts/api";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { appColors, appTypography } from "@/src/theme/app-theme";

export default function SearchScreen() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const deferredQuery = useDeferredValue(query.trim());

  const searchQuery = useQuery({
    enabled: deferredQuery.length >= 2,
    queryFn: () => searchUsers(deferredQuery),
    queryKey: ["users", "search", { q: deferredQuery }],
  });

  const addContactMutation = useMutation({
    mutationFn: createContact,
    onSuccess: async (_, userId) => {
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });

      const matchedUser = searchQuery.data?.find((user) => user.id === userId);
      setSuccessMessage(
        matchedUser?.display_name
          ? `${matchedUser.display_name} added to your contacts.`
          : "Contact added to your list.",
      );
    },
  });

  return (
    <AppScrollScreen contentContainerStyle={styles.scrollContent}>
      <Text style={styles.kicker}>Directory</Text>
      <Text style={styles.title}>Search registered users</Text>
      <Text style={styles.body}>
        Search by display name or phone number, then add accepted contacts for
        the upcoming call flow.
      </Text>

      <View style={styles.searchField}>
        <SearchIcon
          color={appColors.textSecondary}
          size={18}
          strokeWidth={2.2}
        />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={(value) => {
            setQuery(value);
            setSuccessMessage("");
          }}
          placeholder="Search by name or phone"
          placeholderTextColor={appColors.textSecondary}
          style={styles.searchInput}
          value={query}
        />
      </View>

      {successMessage ? (
        <Text style={styles.successText}>{successMessage}</Text>
      ) : null}

      {searchQuery.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(searchQuery.error)}
        </Text>
      ) : null}

      {addContactMutation.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(addContactMutation.error)}
        </Text>
      ) : null}

      {deferredQuery.length < 2 ? (
        <Text style={styles.helperText}>
          Type at least 2 characters to search.
        </Text>
      ) : null}

      {searchQuery.isLoading ? (
        <Text style={styles.helperText}>Searching users...</Text>
      ) : null}

      {!searchQuery.isLoading &&
      deferredQuery.length >= 2 &&
      !searchQuery.data?.length ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No matches found</Text>
          <Text style={styles.emptyBody}>
            Try a different name fragment or a longer phone number segment.
          </Text>
        </View>
      ) : null}

      {searchQuery.data?.map((user) => (
        <View key={user.id} style={styles.resultCard}>
          <View style={styles.resultCopy}>
            <Text style={styles.resultName}>
              {user.display_name || "Unnamed user"}
            </Text>
            <Text style={styles.resultMeta}>
              {user.phone_number_normalized}
            </Text>
          </View>
          <Pressable
            disabled={addContactMutation.isPending}
            onPress={() => {
              addContactMutation.mutate(user.id);
            }}
            style={styles.addButton}
          >
            <ContactRound
              color={appColors.primarySoft}
              size={18}
              strokeWidth={2.2}
            />
            <Text style={styles.addButtonLabel}>Add</Text>
          </Pressable>
        </View>
      ))}

      <Link href="./contacts" asChild>
        <Pressable style={styles.backLink}>
          <Text style={styles.backLinkLabel}>View contacts</Text>
        </Pressable>
      </Link>
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  kicker: {
    color: appColors.amber,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  title: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    marginBottom: 10,
  },
  body: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  searchField: {
    alignItems: "center",
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  searchInput: {
    color: appColors.textPrimary,
    flex: 1,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    minHeight: 46,
  },
  helperText: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  successText: {
    color: "#86efac",
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  errorText: {
    color: "#fca5a5",
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  emptyCard: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 6,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  emptyTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyBody: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  resultCard: {
    alignItems: "center",
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 16,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  resultCopy: {
    flex: 1,
  },
  resultName: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  resultMeta: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
  },
  addButton: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 16,
    gap: 6,
    justifyContent: "center",
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  addButtonLabel: {
    color: appColors.primarySoft,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    fontWeight: "700",
  },
  backLink: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backLinkLabel: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 15,
    fontWeight: "700",
  },
});
