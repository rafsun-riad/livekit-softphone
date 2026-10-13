import { useDeferredValue, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import {
  BadgePlus,
  ChevronRight,
  PhoneCall,
  Search,
  ShieldCheck,
  Video,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppScrollScreen } from "@/src/components/layout/app-scroll-screen";
import {
  buildActiveCallRoute,
  buildPendingOutgoingCallRoute,
} from "@/src/features/calls/routes";
import { getContacts } from "@/src/features/contacts/api";
import type { Contact } from "@/src/features/contacts/types";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { useAuthStore } from "@/src/stores/auth-store";
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

function matchesContact(contact: Contact, query: string) {
  if (!query) {
    return true;
  }

  return [
    contact.contact_user.display_name,
    contact.contact_user.phone_number_normalized,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export default function MessagesHomeScreen() {
  const session = useAuthStore((state) => state.session);
  const activeCall = useCallStore((state) => state.activeCall);
  const onlineUsers = useCallStore((state) => state.onlineUsers);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const activeCallCounterpart =
    activeCall && session
      ? activeCall.initiator.id === session.user.id
        ? activeCall.recipient
        : activeCall.initiator
      : null;

  const contactsQuery = useQuery({
    queryFn: ({ signal }) => getContacts({ signal }),
    queryKey: ["contacts"],
  });
  const filteredContacts = (contactsQuery.data ?? []).filter((contact) =>
    matchesContact(contact, deferredQuery),
  );

  return (
    <AppScrollScreen contentContainerStyle={styles.content}>
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Search color={appColors.textSecondary} size={18} strokeWidth={2.2} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search saved contacts"
            placeholderTextColor={appColors.textSecondary}
            style={styles.searchInput}
            value={query}
          />
        </View>

        <Link href="./search" asChild>
          <Pressable style={styles.newConversationButton}>
            <BadgePlus
              color={appColors.primarySoft}
              size={18}
              strokeWidth={2.2}
            />
          </Pressable>
        </Link>
      </View>

      {activeCall ? (
        <Link href={buildActiveCallRoute(activeCall)} asChild>
          <Pressable style={styles.activeCallLink}>
            <View style={styles.activeCallCopy}>
              <Text style={styles.activeCallTitle}>Return to active call</Text>
              <Text style={styles.activeCallBody}>
                {activeCall.call_type} call with{" "}
                {activeCallCounterpart?.display_name ||
                  activeCallCounterpart?.phone_number_normalized}
              </Text>
            </View>
            <ChevronRight
              color={appColors.textSecondary}
              size={18}
              strokeWidth={2.2}
            />
          </Pressable>
        </Link>
      ) : null}

      {contactsQuery.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(contactsQuery.error)}
        </Text>
      ) : null}

      {contactsQuery.isLoading ? (
        <Text style={styles.helperText}>Loading saved contacts...</Text>
      ) : null}

      {!contactsQuery.isLoading && !contactsQuery.data?.length ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <ShieldCheck
              color={appColors.actionDarkText}
              size={22}
              strokeWidth={2.2}
            />
          </View>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyBody}>
            Add a contact first. When messaging backend work lands, your thread
            list will appear here.
          </Text>
          <Link href="./search" asChild>
            <Pressable style={styles.primaryAction}>
              <Text style={styles.primaryActionLabel}>Choose a contact</Text>
            </Pressable>
          </Link>
        </View>
      ) : null}

      {!contactsQuery.isLoading && Boolean(contactsQuery.data?.length) ? (
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionKicker}>Ready contacts</Text>
            <Text style={styles.sectionTitle}>People you can reach next</Text>
          </View>
          <Link href="./contacts" asChild>
            <Pressable style={styles.sectionLink}>
              <Text style={styles.sectionLinkLabel}>All contacts</Text>
            </Pressable>
          </Link>
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

      {filteredContacts.map((contact) => {
        const counterpart = contact.contact_user;
        const isOnline = Boolean(onlineUsers[counterpart.id]);

        return (
          <View key={contact.id} style={styles.contactCard}>
            <View style={styles.contactAvatar}>
              <Text style={styles.contactAvatarLabel}>
                {getInitials(
                  counterpart.display_name,
                  counterpart.phone_number_normalized,
                )}
              </Text>
            </View>

            <View style={styles.contactCopy}>
              <View style={styles.nameRow}>
                <Text style={styles.contactName}>
                  {counterpart.display_name || "Unnamed user"}
                </Text>
                <View
                  style={[
                    styles.presenceDot,
                    isOnline ? styles.presenceOnline : styles.presenceOffline,
                  ]}
                />
              </View>
              <Text style={styles.contactMeta}>
                {counterpart.phone_number_normalized}
              </Text>
              <Text style={styles.contactHint}>
                Thread history will appear here once messaging delivery is
                wired.
              </Text>
            </View>

            <Pressable
              onPress={() => {
                router.push(
                  buildPendingOutgoingCallRoute({
                    recipientUserId: counterpart.id,
                    callType: "audio",
                    recipientName: counterpart.display_name,
                    recipientPhone: counterpart.phone_number_normalized,
                  }),
                );
              }}
              style={styles.callButton}
            >
              <PhoneCall
                color={appColors.primarySoft}
                size={18}
                strokeWidth={2.2}
              />
            </Pressable>

            <Pressable
              onPress={() => {
                router.push(
                  buildPendingOutgoingCallRoute({
                    recipientUserId: counterpart.id,
                    callType: "video",
                    recipientName: counterpart.display_name,
                    recipientPhone: counterpart.phone_number_normalized,
                  }),
                );
              }}
              style={styles.callButton}
            >
              <Video
                color={appColors.primarySoft}
                size={18}
                strokeWidth={2.2}
              />
            </Pressable>
          </View>
        );
      })}
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: appColors.background,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  searchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  searchField: {
    alignItems: "center",
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: 10,
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
  newConversationButton: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 18,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  activeCallLink: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  activeCallCopy: {
    flex: 1,
  },
  activeCallTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  activeCallBody: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
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
    alignItems: "center",
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingVertical: 22,
  },
  emptyIconWrap: {
    alignItems: "center",
    backgroundColor: appColors.actionDark,
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    marginBottom: 14,
    width: 52,
  },
  emptyTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 19,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyBody: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
    maxWidth: 320,
    textAlign: "center",
  },
  primaryAction: {
    backgroundColor: appColors.primary,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryActionLabel: {
    color: appColors.primarySoft,
    fontFamily: appTypography.fontFamily,
    fontSize: 15,
    fontWeight: "700",
  },
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderCopy: {
    flex: 1,
  },
  sectionKicker: {
    color: appColors.amber,
    fontFamily: appTypography.fontFamily,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 20,
    fontWeight: "700",
  },
  sectionLink: {
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sectionLinkLabel: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    fontWeight: "700",
  },
  contactCard: {
    alignItems: "center",
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  contactAvatar: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  contactAvatarLabel: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    fontWeight: "700",
  },
  contactCopy: {
    flex: 1,
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
  },
  contactName: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
  },
  presenceDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  presenceOnline: {
    backgroundColor: "#4ade80",
  },
  presenceOffline: {
    backgroundColor: appColors.textMuted,
  },
  contactMeta: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  contactHint: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 12,
    lineHeight: 17,
  },
  callButton: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
});
