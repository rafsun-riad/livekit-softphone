import { useDeferredValue, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import {
  PhoneCall,
  Search as SearchIcon,
  Trash2,
  UserRoundSearch,
  Video,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppScrollScreen } from "@/src/components/layout/app-scroll-screen";
import { buildPendingOutgoingCallRoute } from "@/src/features/calls/routes";
import { deleteContact, getContacts } from "@/src/features/contacts/api";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { useCallStore } from "@/src/stores/call-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

function getInitials(name: string | null | undefined, phone: string) {
  const source = name?.trim() || phone;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export default function ContactsScreen() {
  const queryClient = useQueryClient();
  const onlineUsers = useCallStore((state) => state.onlineUsers);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const contactsQuery = useQuery({
    queryFn: ({ signal }) => getContacts({ signal }),
    queryKey: ["contacts"],
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const filteredContacts = (contactsQuery.data ?? []).filter((contact) => {
    if (!deferredQuery) {
      return true;
    }

    return [
      contact.contact_user.display_name,
      contact.contact_user.phone_number_normalized,
    ]
      .join(" ")
      .toLowerCase()
      .includes(deferredQuery);
  });

  return (
    <AppScrollScreen contentContainerStyle={styles.scrollContent}>
      <View style={styles.searchField}>
        <SearchIcon
          color={appColors.textSecondary}
          size={18}
          strokeWidth={2.2}
        />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search contacts"
          placeholderTextColor={appColors.textSecondary}
          style={styles.searchInput}
          value={query}
        />
      </View>

      <Link href="./search" asChild>
        <Pressable style={styles.directoryLink}>
          <UserRoundSearch
            color={appColors.primarySoft}
            size={18}
            strokeWidth={2.2}
          />
          <Text style={styles.directoryLinkLabel}>Add from directory</Text>
        </Pressable>
      </Link>

      {contactsQuery.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(contactsQuery.error)}
        </Text>
      ) : null}

      {deleteMutation.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(deleteMutation.error)}
        </Text>
      ) : null}

      {contactsQuery.isLoading ? (
        <Text style={styles.helperText}>Loading contacts...</Text>
      ) : null}

      {!contactsQuery.isLoading && !contactsQuery.data?.length ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No contacts yet</Text>
          <Text style={styles.emptyBody}>
            Search for a registered user and add them to unlock calling.
          </Text>
          <Link href="./search" asChild>
            <Pressable style={styles.primaryAction}>
              <Text style={styles.primaryActionLabel}>Find people</Text>
            </Pressable>
          </Link>
        </View>
      ) : null}

      {!contactsQuery.isLoading && Boolean(contactsQuery.data?.length) ? (
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Saved contacts</Text>
          <Text style={styles.sectionMeta}>{filteredContacts.length}</Text>
        </View>
      ) : null}

      {!contactsQuery.isLoading &&
      Boolean(contactsQuery.data?.length) &&
      !filteredContacts.length ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No matching contacts</Text>
          <Text style={styles.emptyBody}>
            Try a different name fragment or clear the filter.
          </Text>
        </View>
      ) : null}

      {filteredContacts.map((contact, index) => (
        <View
          key={contact.id}
          style={[
            styles.contactRow,
            index === filteredContacts.length - 1 && styles.lastContactRow,
          ]}
        >
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarLabel}>
              {getInitials(
                contact.contact_user.display_name,
                contact.contact_user.phone_number_normalized,
              )}
            </Text>
          </View>

          <View style={styles.contactCopy}>
            <View style={styles.nameRow}>
              <Text style={styles.contactName}>
                {contact.contact_user.display_name || "Unnamed user"}
              </Text>
              <Text
                style={[
                  styles.contactStatus,
                  onlineUsers[contact.contact_user.id]
                    ? styles.contactStatusOnline
                    : undefined,
                ]}
              >
                {onlineUsers[contact.contact_user.id] ? "online" : "saved"}
              </Text>
            </View>
            <Text style={styles.contactMeta}>
              {contact.contact_user.phone_number_normalized}
            </Text>
          </View>

          <View style={styles.actionsColumn}>
            <Pressable
              onPress={() => {
                router.push(
                  buildPendingOutgoingCallRoute({
                    recipientUserId: contact.contact_user.id,
                    callType: "audio",
                    recipientName: contact.contact_user.display_name,
                    recipientPhone:
                      contact.contact_user.phone_number_normalized,
                  }),
                );
              }}
              style={styles.callButton}
            >
              <PhoneCall
                color={appColors.primarySoft}
                size={16}
                strokeWidth={2.2}
              />
            </Pressable>
            <Pressable
              onPress={() => {
                router.push(
                  buildPendingOutgoingCallRoute({
                    recipientUserId: contact.contact_user.id,
                    callType: "video",
                    recipientName: contact.contact_user.display_name,
                    recipientPhone:
                      contact.contact_user.phone_number_normalized,
                  }),
                );
              }}
              style={styles.callButton}
            >
              <Video
                color={appColors.primarySoft}
                size={16}
                strokeWidth={2.2}
              />
            </Pressable>
            <Pressable
              disabled={deleteMutation.isPending}
              onPress={() => {
                deleteMutation.mutate(contact.id);
              }}
              style={styles.deleteButton}
            >
              <Trash2 color="#fca5a5" size={16} strokeWidth={2.2} />
            </Pressable>
          </View>
        </View>
      ))}
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    backgroundColor: appColors.background,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  searchField: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
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
  directoryLink: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: appColors.surface,
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  directoryLinkLabel: {
    color: appColors.primarySoft,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    fontWeight: "700",
  },
  helperText: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
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
    borderRadius: 22,
    marginBottom: 18,
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
    marginBottom: 12,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 18,
    alignSelf: "flex-start",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryActionLabel: {
    color: appColors.primarySoft,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    fontWeight: "700",
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 22,
    fontWeight: "700",
  },
  sectionMeta: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    fontWeight: "600",
  },
  contactRow: {
    alignItems: "center",
    borderBottomColor: appColors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingVertical: 14,
  },
  lastContactRow: {
    borderBottomWidth: 0,
  },
  avatarWrap: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  avatarLabel: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 15,
    fontWeight: "700",
  },
  contactCopy: {
    flex: 1,
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  contactName: {
    color: appColors.textPrimary,
    flex: 1,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
    marginRight: 10,
  },
  contactMeta: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
  },
  contactStatus: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 12,
    fontWeight: "600",
  },
  contactStatusOnline: {
    color: "#86efac",
  },
  actionsColumn: {
    gap: 8,
  },
  callButton: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 14,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 14,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
});
