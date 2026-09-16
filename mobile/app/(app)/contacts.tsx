import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import { PhoneCall, Trash2, UserRoundSearch, Video } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppScrollScreen } from "@/src/components/layout/app-scroll-screen";
import { createCall } from "@/src/features/calls/api";
import { buildCallRoute } from "@/src/features/calls/routes";
import { deleteContact, getContacts } from "@/src/features/contacts/api";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import { useCallStore } from "@/src/stores/call-store";
import { appColors, appTypography } from "@/src/theme/app-theme";

export default function ContactsScreen() {
  const queryClient = useQueryClient();
  const onlineUsers = useCallStore((state) => state.onlineUsers);
  const upsertCall = useCallStore((state) => state.upsertCall);
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

  const callMutation = useMutation({
    mutationFn: createCall,
    onSuccess: (call) => {
      upsertCall(call);
      router.push(buildCallRoute("outgoing", call.id));
    },
  });

  return (
    <AppScrollScreen contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Contacts</Text>
          <Text style={styles.title}>Callable contacts</Text>
          <Text style={styles.body}>
            These users are currently allowed targets for the next call flow.
          </Text>
        </View>
        <Link href="./search" asChild>
          <Pressable style={styles.searchLink}>
            <UserRoundSearch
              color={appColors.primarySoft}
              size={18}
              strokeWidth={2.2}
            />
            <Text style={styles.searchLinkLabel}>Add</Text>
          </Pressable>
        </Link>
      </View>

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

      {callMutation.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(callMutation.error)}
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
        </View>
      ) : null}

      {contactsQuery.data?.map((contact) => (
        <View key={contact.id} style={styles.contactCard}>
          <View style={styles.contactCopy}>
            <View style={styles.nameRow}>
              <Text style={styles.contactName}>
                {contact.contact_user.display_name || "Unnamed user"}
              </Text>
              <View
                style={[
                  styles.presenceDot,
                  onlineUsers[contact.contact_user.id]
                    ? styles.presenceOnline
                    : styles.presenceOffline,
                ]}
              />
            </View>
            <Text style={styles.contactMeta}>
              {contact.contact_user.phone_number_normalized}
            </Text>
          </View>
          <Pressable
            disabled={callMutation.isPending}
            onPress={() => {
              callMutation.mutate({
                recipientUserId: contact.contact_user.id,
                callType: "audio",
              });
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
            disabled={callMutation.isPending}
            onPress={() => {
              callMutation.mutate({
                recipientUserId: contact.contact_user.id,
                callType: "video",
              });
            }}
            style={styles.callButton}
          >
            <Video color={appColors.primarySoft} size={18} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            disabled={deleteMutation.isPending || callMutation.isPending}
            onPress={() => {
              deleteMutation.mutate(contact.id);
            }}
            style={styles.deleteButton}
          >
            <Trash2 color="#fca5a5" size={18} strokeWidth={2.2} />
          </Pressable>
        </View>
      ))}
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
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    color: appColors.cyan,
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
  },
  searchLink: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 16,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchLinkLabel: {
    color: appColors.primarySoft,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    fontWeight: "700",
  },
  helperText: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
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
  contactCard: {
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
  contactCopy: {
    flex: 1,
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
  },
  contactName: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 17,
    fontWeight: "700",
  },
  contactMeta: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
  },
  presenceDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  presenceOnline: {
    backgroundColor: "#86efac",
  },
  presenceOffline: {
    backgroundColor: appColors.textSecondary,
  },
  callButton: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
});
