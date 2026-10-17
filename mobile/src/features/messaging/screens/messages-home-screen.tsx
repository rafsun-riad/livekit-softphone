import { useDeferredValue, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { ChevronRight, Search, ShieldCheck } from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppScrollScreen } from "@/src/components/layout/app-scroll-screen";
import { buildActiveCallRoute } from "@/src/features/calls/routes";
import { getContacts } from "@/src/features/contacts/api";
import { listConversations } from "@/src/features/messaging/api";
import { buildMessageThreadRoute } from "@/src/features/messaging/routes";
import type { ConversationRecord } from "@/src/features/messaging/types";
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

function formatConversationPreview(conversation: ConversationRecord) {
  if (!conversation.latest_message) {
    return "Conversation ready";
  }

  switch (conversation.latest_message.message_type) {
    case "text":
      return "Encrypted text message";
    case "image":
      return "Encrypted image";
    case "video":
      return "Encrypted video";
    case "voice":
      return "Encrypted voice message";
    default:
      return "System message";
  }
}

function formatConversationTimestamp(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

function getConversationCounterpart(
  conversation: ConversationRecord,
  currentUserId: string,
) {
  return (
    conversation.participants.find(
      (participant) => participant.user.id !== currentUserId,
    )?.user ??
    conversation.participants[0]?.user ??
    null
  );
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

  const conversationsQuery = useQuery({
    enabled: Boolean(session),
    queryFn: ({ signal }) => listConversations({ signal }),
    queryKey: ["messaging", "conversations"],
  });

  const contactsQuery = useQuery({
    queryFn: ({ signal }) => getContacts({ signal }),
    queryKey: ["contacts"],
  });

  const filteredConversations = useMemo(() => {
    const currentUserId = session?.user.id;
    if (!currentUserId) {
      return [];
    }

    return (conversationsQuery.data ?? []).filter((conversation) => {
      const counterpart = getConversationCounterpart(
        conversation,
        currentUserId,
      );
      const haystack = [
        counterpart?.display_name,
        counterpart?.phone_number_normalized,
        formatConversationPreview(conversation),
      ]
        .join(" ")
        .toLowerCase();

      return !deferredQuery || haystack.includes(deferredQuery);
    });
  }, [conversationsQuery.data, deferredQuery, session?.user.id]);

  return (
    <AppScrollScreen contentContainerStyle={styles.content}>
      <View style={styles.searchField}>
        <Search color={appColors.textSecondary} size={18} strokeWidth={2.2} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search conversations"
          placeholderTextColor={appColors.textSecondary}
          style={styles.searchInput}
          value={query}
        />
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

      {conversationsQuery.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(conversationsQuery.error)}
        </Text>
      ) : null}

      {conversationsQuery.isLoading ? (
        <Text style={styles.helperText}>Loading conversations...</Text>
      ) : null}

      {!conversationsQuery.isLoading &&
      !(conversationsQuery.data?.length ?? 0) ? (
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
            {contactsQuery.data?.length
              ? "Open a saved contact to bootstrap your first direct conversation."
              : "Add a contact first. Your first conversation list will appear here."}
          </Text>
          <Link
            href={contactsQuery.data?.length ? "./contacts" : "./search"}
            asChild
          >
            <Pressable style={styles.primaryAction}>
              <Text style={styles.primaryActionLabel}>
                {contactsQuery.data?.length
                  ? "Open contacts"
                  : "Find a contact"}
              </Text>
            </Pressable>
          </Link>
        </View>
      ) : null}

      {!conversationsQuery.isLoading &&
      Boolean(conversationsQuery.data?.length) ? (
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Conversations</Text>
          <Text style={styles.sectionMeta}>{filteredConversations.length}</Text>
        </View>
      ) : null}

      {!conversationsQuery.isLoading &&
      Boolean(conversationsQuery.data?.length) &&
      !filteredConversations.length ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No matching conversations</Text>
          <Text style={styles.emptyBody}>
            Try a different name or number from your existing conversations.
          </Text>
        </View>
      ) : null}

      {filteredConversations.map((conversation, index) => {
        const counterpart = session
          ? getConversationCounterpart(conversation, session.user.id)
          : null;
        const isOnline = Boolean(
          counterpart?.id && onlineUsers[counterpart.id],
        );

        return (
          <Pressable
            key={conversation.id}
            onPress={() => {
              if (!counterpart) {
                return;
              }

              router.push(
                buildMessageThreadRoute({
                  contactUserId: counterpart.id,
                  contactName: counterpart.display_name,
                  contactPhone: counterpart.phone_number_normalized,
                }),
              );
            }}
            style={[
              styles.conversationRow,
              index === filteredConversations.length - 1 &&
                styles.lastConversationRow,
            ]}
          >
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarLabel}>
                {getInitials(
                  counterpart?.display_name,
                  counterpart?.phone_number_normalized ?? "",
                )}
              </Text>
            </View>

            <View style={styles.rowCopy}>
              <View style={styles.rowTop}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {counterpart?.display_name ||
                    counterpart?.phone_number_normalized ||
                    "Conversation"}
                </Text>
                <Text
                  style={[
                    styles.rowTrailing,
                    isOnline && styles.rowTrailingOnline,
                  ]}
                >
                  {formatConversationTimestamp(
                    conversation.latest_message_at ||
                      conversation.latest_message?.created_at ||
                      conversation.updated_at,
                  ) || (isOnline ? "online" : "ready")}
                </Text>
              </View>
              <Text style={styles.rowSubtitle} numberOfLines={1}>
                {formatConversationPreview(conversation)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </AppScrollScreen>
  );
}

const styles = StyleSheet.create({
  content: {
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
  activeCallLink: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 18,
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
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
    marginBottom: 4,
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
    borderRadius: 22,
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
  conversationRow: {
    alignItems: "center",
    borderBottomColor: appColors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingVertical: 14,
  },
  lastConversationRow: {
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
  rowCopy: {
    flex: 1,
  },
  rowTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  rowTitle: {
    color: appColors.textPrimary,
    flex: 1,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
    marginRight: 10,
  },
  rowTrailing: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 12,
    fontWeight: "600",
  },
  rowTrailingOnline: {
    color: "#86efac",
  },
  rowSubtitle: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
  },
});
