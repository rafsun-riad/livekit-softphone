import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  MessageSquare,
  PhoneCall,
  Send,
  Video,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { buildPendingOutgoingCallRoute } from "@/src/features/calls/routes";
import { getContacts } from "@/src/features/contacts/api";
import { buildContactDetailRoute } from "@/src/features/contacts/routes";
import {
  ensureDirectConversation,
  getConversationMessages,
} from "@/src/features/messaging/api";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { appColors, appTypography } from "@/src/theme/app-theme";

function getInitials(name: string | null | undefined, phone: string) {
  const source = name?.trim() || phone;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export default function MessageThreadScreen() {
  const params = useLocalSearchParams<{
    contactUserId?: string | string[];
    contactName?: string | string[];
    contactPhone?: string | string[];
  }>();
  const [draft, setDraft] = useState("");

  const contactUserId = Array.isArray(params.contactUserId)
    ? (params.contactUserId[0] ?? "")
    : (params.contactUserId ?? "");
  const fallbackName = Array.isArray(params.contactName)
    ? (params.contactName[0] ?? "")
    : (params.contactName ?? "");
  const fallbackPhone = Array.isArray(params.contactPhone)
    ? (params.contactPhone[0] ?? "")
    : (params.contactPhone ?? "");

  const contactsQuery = useQuery({
    queryFn: ({ signal }) => getContacts({ signal }),
    queryKey: ["contacts"],
  });

  const conversationQuery = useQuery({
    enabled: Boolean(contactUserId),
    queryFn: () => ensureDirectConversation(contactUserId),
    queryKey: ["messaging", "conversation", "direct", contactUserId],
  });

  const messagesQuery = useQuery({
    enabled: Boolean(conversationQuery.data?.id),
    queryFn: ({ signal }) =>
      getConversationMessages(conversationQuery.data!.id, { signal }),
    queryKey: [
      "messaging",
      "messages",
      { conversationId: conversationQuery.data?.id ?? "" },
    ],
  });

  const contact = useMemo(() => {
    return (contactsQuery.data ?? []).find(
      (item) => item.contact_user.id === contactUserId,
    );
  }, [contactUserId, contactsQuery.data]);

  const displayName =
    contact?.contact_user.display_name ||
    fallbackName ||
    contact?.contact_user.phone_number_normalized ||
    fallbackPhone ||
    "Unknown user";
  const phoneNumber =
    contact?.contact_user.phone_number_normalized || fallbackPhone || "";

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          onPress={() => {
            router.back();
          }}
          style={styles.headerButton}
        >
          <ArrowLeft
            color={appColors.textPrimary}
            size={20}
            strokeWidth={2.2}
          />
        </Pressable>

        <Pressable
          disabled={!contact}
          onPress={() => {
            if (!contact) {
              return;
            }

            router.push(
              buildContactDetailRoute({
                contactId: contact.id,
                contactUserId: contact.contact_user.id,
                contactName: contact.contact_user.display_name,
                contactPhone: contact.contact_user.phone_number_normalized,
              }),
            );
          }}
          style={styles.contactHeaderLink}
        >
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarLabel}>
              {getInitials(displayName, phoneNumber)}
            </Text>
          </View>

          <View style={styles.headerCopy}>
            <Text numberOfLines={1} style={styles.headerTitle}>
              {displayName}
            </Text>
            <Text numberOfLines={1} style={styles.headerSubtitle}>
              {phoneNumber || "Conversation"}
            </Text>
          </View>
        </Pressable>

        <Pressable
          accessibilityLabel="Start audio call"
          accessibilityRole="button"
          onPress={() => {
            if (!contact) {
              return;
            }

            router.push(
              buildPendingOutgoingCallRoute({
                recipientUserId: contact.contact_user.id,
                callType: "audio",
                recipientName: contact.contact_user.display_name,
                recipientPhone: contact.contact_user.phone_number_normalized,
              }),
            );
          }}
          style={styles.headerButton}
        >
          <PhoneCall
            color={appColors.textPrimary}
            size={18}
            strokeWidth={2.2}
          />
        </Pressable>

        <Pressable
          accessibilityLabel="Start video call"
          accessibilityRole="button"
          onPress={() => {
            if (!contact) {
              return;
            }

            router.push(
              buildPendingOutgoingCallRoute({
                recipientUserId: contact.contact_user.id,
                callType: "video",
                recipientName: contact.contact_user.display_name,
                recipientPhone: contact.contact_user.phone_number_normalized,
              }),
            );
          }}
          style={styles.headerButton}
        >
          <Video color={appColors.textPrimary} size={18} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {contactsQuery.isError ? (
          <Text style={styles.errorText}>
            {getAPIErrorMessage(contactsQuery.error)}
          </Text>
        ) : null}

        {conversationQuery.isError ? (
          <Text style={styles.errorText}>
            {getAPIErrorMessage(conversationQuery.error)}
          </Text>
        ) : null}

        {messagesQuery.isError ? (
          <Text style={styles.errorText}>
            {getAPIErrorMessage(messagesQuery.error)}
          </Text>
        ) : null}

        {conversationQuery.isLoading || messagesQuery.isLoading ? (
          <Text style={styles.helperText}>Loading conversation...</Text>
        ) : null}

        <View style={styles.placeholderCard}>
          <View style={styles.placeholderIconWrap}>
            <MessageSquare
              color={appColors.actionDarkText}
              size={22}
              strokeWidth={2.2}
            />
          </View>
          <Text style={styles.placeholderTitle}>
            {messagesQuery.data?.length ? "Thread loaded" : "Thread ready"}
          </Text>
          <Text style={styles.placeholderBody}>
            {messagesQuery.data?.length
              ? `This direct conversation is now backed by the messaging API. ${messagesQuery.data.length} encrypted message record${messagesQuery.data.length === 1 ? " is" : "s are"} available in the thread.`
              : "This conversation surface now bootstraps a direct conversation and can read stored encrypted message records. Composer send behavior still depends on the next messaging step."}
          </Text>
          {conversationQuery.data ? (
            <Text style={styles.placeholderMeta}>
              Conversation ID: {conversationQuery.data.id}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.composerWrap}>
        <View style={styles.composerField}>
          <TextInput
            autoCorrect
            editable={false}
            onChangeText={setDraft}
            placeholder="Message sending will unlock after backend messaging lands"
            placeholderTextColor={appColors.textSecondary}
            style={styles.composerInput}
            value={draft}
          />
        </View>
        <View style={styles.sendButton}>
          <Send color={appColors.primarySoft} size={18} strokeWidth={2.2} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: appColors.background,
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomColor: appColors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  contactHeaderLink: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    marginRight: 4,
  },
  headerButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  avatarWrap: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  avatarLabel: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    fontWeight: "700",
  },
  headerCopy: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 12,
    marginTop: 2,
  },
  body: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  placeholderCard: {
    alignItems: "center",
    backgroundColor: appColors.surface,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 26,
  },
  placeholderIconWrap: {
    alignItems: "center",
    backgroundColor: appColors.actionDark,
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    marginBottom: 14,
    width: 52,
  },
  placeholderTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  placeholderBody: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  placeholderMeta: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    textAlign: "center",
  },
  errorText: {
    color: "#fca5a5",
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
    textAlign: "center",
  },
  helperText: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
    textAlign: "center",
  },
  composerWrap: {
    alignItems: "center",
    borderTopColor: appColors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  composerField: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 20,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  composerInput: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    minHeight: 42,
  },
  sendButton: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
});
