import { useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  MessageSquare,
  PhoneCall,
  Send,
  Video,
} from "lucide-react-native";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { buildPendingOutgoingCallRoute } from "@/src/features/calls/routes";
import { getContacts } from "@/src/features/contacts/api";
import { buildContactDetailRoute } from "@/src/features/contacts/routes";
import {
  createMessage,
  ensureDirectConversation,
  getConversationMessages,
} from "@/src/features/messaging/api";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { useAuthStore } from "@/src/stores/auth-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

function getInitials(name: string | null | undefined, phone: string) {
  const source = name?.trim() || phone;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function getMessagePreview(message: {
  message_type: string;
  ciphertext: Record<string, unknown>;
}) {
  const body = message.ciphertext.body;
  if (typeof body === "string" && body.trim().length > 0) {
    return body;
  }

  switch (message.message_type) {
    case "image":
      return "Encrypted image";
    case "video":
      return "Encrypted video";
    case "voice":
      return "Encrypted voice message";
    case "system":
      return "System message";
    default:
      return "Encrypted message";
  }
}

function buildClientMessageId() {
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function MessageThreadScreen() {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
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

  const sendMessageMutation = useMutation({
    mutationFn: async (body: string) => {
      if (!conversationQuery.data?.id) {
        throw new Error("Conversation is not ready yet.");
      }

      return createMessage({
        conversationId: conversationQuery.data.id,
        messageType: "text",
        ciphertext: {
          body,
        },
        clientMessageId: buildClientMessageId(),
      });
    },
    onSuccess: async () => {
      setDraft("");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "messaging",
            "messages",
            { conversationId: conversationQuery.data?.id ?? "" },
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ["messaging", "conversations"],
        }),
      ]);
    },
  });

  const canSend = Boolean(
    draft.trim().length &&
    conversationQuery.data?.id &&
    !sendMessageMutation.isPending,
  );

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

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
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

        {sendMessageMutation.isError ? (
          <Text style={styles.errorText}>
            {getAPIErrorMessage(sendMessageMutation.error)}
          </Text>
        ) : null}

        {conversationQuery.isLoading || messagesQuery.isLoading ? (
          <Text style={styles.helperText}>Loading conversation...</Text>
        ) : null}

        {!messagesQuery.isLoading && !(messagesQuery.data?.length ?? 0) ? (
          <View style={styles.placeholderCard}>
            <View style={styles.placeholderIconWrap}>
              <MessageSquare
                color={appColors.actionDarkText}
                size={22}
                strokeWidth={2.2}
              />
            </View>
            <Text style={styles.placeholderTitle}>Thread ready</Text>
            <Text style={styles.placeholderBody}>
              This direct conversation is now backed by the messaging API. Send
              the first encrypted message to populate the timeline.
            </Text>
            {conversationQuery.data ? (
              <Text style={styles.placeholderMeta}>
                Conversation ID: {conversationQuery.data.id}
              </Text>
            ) : null}
          </View>
        ) : null}

        {messagesQuery.data?.map((message) => {
          const isMine = Boolean(
            session?.user.id && message.sender?.id === session.user.id,
          );

          return (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                isMine ? styles.messageRowOutgoing : styles.messageRowIncoming,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  isMine
                    ? styles.messageBubbleOutgoing
                    : styles.messageBubbleIncoming,
                ]}
              >
                <Text style={styles.messageBody}>
                  {getMessagePreview(message)}
                </Text>
                <Text style={styles.messageMeta}>
                  {new Date(message.created_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.composerWrap}>
        <View style={styles.composerField}>
          <TextInput
            autoCorrect
            editable={!sendMessageMutation.isPending}
            onChangeText={setDraft}
            placeholder="Write a message"
            placeholderTextColor={appColors.textSecondary}
            style={styles.composerInput}
            value={draft}
          />
        </View>
        <Pressable
          disabled={!canSend}
          onPress={() => {
            const body = draft.trim();
            if (!body) {
              return;
            }

            sendMessageMutation.mutate(body);
          }}
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
        >
          <Send color={appColors.primarySoft} size={18} strokeWidth={2.2} />
        </Pressable>
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
  messageRow: {
    flexDirection: "row",
    marginBottom: 10,
  },
  messageRowIncoming: {
    justifyContent: "flex-start",
  },
  messageRowOutgoing: {
    justifyContent: "flex-end",
  },
  messageBubble: {
    borderRadius: 18,
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleIncoming: {
    backgroundColor: appColors.surface,
  },
  messageBubbleOutgoing: {
    backgroundColor: appColors.primary,
  },
  messageBody: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  messageMeta: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 11,
    marginTop: 6,
    textAlign: "right",
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
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
