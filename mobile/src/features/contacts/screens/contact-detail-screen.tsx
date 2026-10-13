import { useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  MessageSquare,
  PhoneCall,
  Trash2,
  Video,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { buildPendingOutgoingCallRoute } from "@/src/features/calls/routes";
import { deleteContact, getContacts } from "@/src/features/contacts/api";
import { buildMessageThreadRoute } from "@/src/features/messaging/routes";
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

export default function ContactDetailScreen() {
  const queryClient = useQueryClient();
  const onlineUsers = useCallStore((state) => state.onlineUsers);
  const params = useLocalSearchParams<{
    contactId?: string | string[];
    contactUserId?: string | string[];
    contactName?: string | string[];
    contactPhone?: string | string[];
  }>();

  const contactId = Array.isArray(params.contactId)
    ? (params.contactId[0] ?? "")
    : (params.contactId ?? "");
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

  const contact = useMemo(() => {
    return (contactsQuery.data ?? []).find((item) => item.id === contactId);
  }, [contactId, contactsQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["contacts"] });
      router.back();
    },
  });

  const displayName =
    contact?.contact_user.display_name || fallbackName || "Unknown user";
  const phoneNumber =
    contact?.contact_user.phone_number_normalized || fallbackPhone || "";
  const resolvedUserId = contact?.contact_user.id || contactUserId;
  const isOnline = Boolean(resolvedUserId && onlineUsers[resolvedUserId]);

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
        <Text style={styles.headerTitle}>Contact</Text>
      </View>

      <View style={styles.content}>
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

        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarLabel}>
              {getInitials(displayName, phoneNumber)}
            </Text>
          </View>
          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.phoneText}>{phoneNumber}</Text>
          <Text style={[styles.statusText, isOnline && styles.statusOnline]}>
            {isOnline ? "online now" : "saved contact"}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => {
              router.push(
                buildMessageThreadRoute({
                  contactUserId: resolvedUserId,
                  contactName: displayName,
                  contactPhone: phoneNumber,
                }),
              );
            }}
            style={styles.primaryAction}
          >
            <MessageSquare
              color={appColors.primarySoft}
              size={18}
              strokeWidth={2.2}
            />
            <Text style={styles.primaryActionLabel}>Message</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              router.push(
                buildPendingOutgoingCallRoute({
                  recipientUserId: resolvedUserId,
                  callType: "audio",
                  recipientName: displayName,
                  recipientPhone: phoneNumber,
                }),
              );
            }}
            style={styles.primaryAction}
          >
            <PhoneCall
              color={appColors.primarySoft}
              size={18}
              strokeWidth={2.2}
            />
            <Text style={styles.primaryActionLabel}>Audio</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              router.push(
                buildPendingOutgoingCallRoute({
                  recipientUserId: resolvedUserId,
                  callType: "video",
                  recipientName: displayName,
                  recipientPhone: phoneNumber,
                }),
              );
            }}
            style={styles.primaryAction}
          >
            <Video color={appColors.primarySoft} size={18} strokeWidth={2.2} />
            <Text style={styles.primaryActionLabel}>Video</Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Next policy work</Text>
          <Text style={styles.infoBody}>
            Save, block, and unblock actions still depend on the unknown-user
            policy and contact-policy backend work. This screen now provides the
            person-level message and calling entry points the shell was missing.
          </Text>
        </View>

        <Pressable
          disabled={deleteMutation.isPending || !contactId}
          onPress={() => {
            if (!contactId) {
              return;
            }

            deleteMutation.mutate(contactId);
          }}
          style={styles.deleteAction}
        >
          <Trash2 color="#fca5a5" size={18} strokeWidth={2.2} />
          <Text style={styles.deleteActionLabel}>
            {deleteMutation.isPending ? "Removing..." : "Remove contact"}
          </Text>
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
    gap: 12,
    paddingBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  headerButton: {
    alignItems: "center",
    borderRadius: 16,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  headerTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: appColors.surface,
    borderRadius: 24,
    marginBottom: 18,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  avatarWrap: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    marginBottom: 16,
    width: 68,
  },
  avatarLabel: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 24,
    fontWeight: "700",
  },
  nameText: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  phoneText: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    marginBottom: 8,
  },
  statusText: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  statusOnline: {
    color: "#86efac",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  primaryAction: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 18,
    flex: 1,
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  primaryActionLabel: {
    color: appColors.primarySoft,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 20,
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  infoTitle: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  infoBody: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 21,
  },
  deleteAction: {
    alignItems: "center",
    backgroundColor: appColors.surface,
    borderRadius: 18,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  deleteActionLabel: {
    color: "#fca5a5",
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    fontWeight: "700",
  },
  errorText: {
    color: "#fca5a5",
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
    textAlign: "center",
  },
});
