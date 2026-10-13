import { useDeferredValue, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, router } from "expo-router";
import {
  ChevronRight,
  PhoneCall,
  Search as SearchIcon,
  Video,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppScrollScreen } from "@/src/components/layout/app-scroll-screen";
import { listCalls } from "@/src/features/calls/api";
import {
  buildActiveCallRoute,
  buildPendingOutgoingCallRoute,
} from "@/src/features/calls/routes";
import type { CallRecord } from "@/src/features/calls/types";
import { getAPIErrorMessage } from "@/src/lib/api/client";
import type { AuthState } from "@/src/stores/auth-store";
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

function getCounterpart(call: CallRecord, viewerUserId: string) {
  return call.initiator.id === viewerUserId ? call.recipient : call.initiator;
}

function getDirectionLabel(call: CallRecord, viewerUserId: string) {
  return call.initiator.id === viewerUserId ? "Outgoing" : "Incoming";
}

function getDisplayTimestamp(call: CallRecord) {
  return (
    call.ended_at ??
    call.connected_at ??
    call.accepted_at ??
    call.ringing_at ??
    call.initiated_at ??
    call.created_at
  );
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString(undefined, {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

function formatStateLabel(value: string) {
  return value.replace(/_/g, " ");
}

export default function CallsHistoryScreen() {
  const session = useAuthStore((state: AuthState) => state.session);
  const activeCall = useCallStore((state) => state.activeCall);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const callsQuery = useQuery({
    queryFn: ({ signal }) => listCalls({ signal }),
    queryKey: ["calls", "history"],
  });

  const filteredCalls = useMemo(() => {
    const userId = session?.user.id;
    if (!userId || !callsQuery.data) {
      return [];
    }

    return callsQuery.data.filter((call) => {
      if (!deferredQuery) {
        return true;
      }

      const counterpart = getCounterpart(call, userId);
      const haystack = [
        counterpart.display_name,
        counterpart.phone_number_normalized,
        call.call_type,
        call.state,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(deferredQuery);
    });
  }, [callsQuery.data, deferredQuery, session?.user.id]);

  const activeCallCounterpart =
    activeCall && session ? getCounterpart(activeCall, session.user.id) : null;

  return (
    <AppScrollScreen contentContainerStyle={styles.content}>
      {activeCall ? (
        <Link href={buildActiveCallRoute(activeCall)} asChild>
          <Pressable style={styles.activeCallCard}>
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
          placeholder="Filter by name, number, or state"
          placeholderTextColor={appColors.textSecondary}
          style={styles.searchInput}
          value={query}
        />
      </View>

      {callsQuery.isError ? (
        <Text style={styles.errorText}>
          {getAPIErrorMessage(callsQuery.error)}
        </Text>
      ) : null}

      {callsQuery.isLoading ? (
        <Text style={styles.helperText}>Loading call history...</Text>
      ) : null}

      {!callsQuery.isLoading && !callsQuery.data?.length ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No calls yet</Text>
          <Text style={styles.emptyBody}>
            Start a call from Contacts to build the first history entries.
          </Text>
          <Link href="../contacts" asChild>
            <Pressable style={styles.primaryAction}>
              <Text style={styles.primaryActionLabel}>Open contacts</Text>
            </Pressable>
          </Link>
        </View>
      ) : null}

      {!callsQuery.isLoading && Boolean(callsQuery.data?.length) ? (
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent calls</Text>
          <Text style={styles.sectionMeta}>{filteredCalls.length}</Text>
        </View>
      ) : null}

      {!callsQuery.isLoading &&
      Boolean(callsQuery.data?.length) &&
      !filteredCalls.length ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No matching calls</Text>
          <Text style={styles.emptyBody}>
            Clear the filter or try a different contact name or state.
          </Text>
        </View>
      ) : null}

      {filteredCalls.map((call) => {
        const counterpart = session
          ? getCounterpart(call, session.user.id)
          : call.recipient;

        return (
          <View key={call.id} style={styles.callRow}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarLabel}>
                {getInitials(
                  counterpart.display_name,
                  counterpart.phone_number_normalized,
                )}
              </Text>
            </View>

            <View style={styles.callCopy}>
              <View style={styles.rowTop}>
                <Text style={styles.callName} numberOfLines={1}>
                  {counterpart.display_name ||
                    counterpart.phone_number_normalized}
                </Text>
                <Text style={styles.rowTrailing}>
                  {formatTimestamp(getDisplayTimestamp(call))}
                </Text>
              </View>
              <Text style={styles.callMeta}>
                {getDirectionLabel(call, session?.user.id ?? counterpart.id)}{" "}
                {call.call_type} call
              </Text>
              <Text style={styles.callSubmeta}>
                {formatStateLabel(call.state)}
              </Text>
            </View>

            <View style={styles.actionsColumn}>
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
                style={styles.iconButton}
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
                      recipientUserId: counterpart.id,
                      callType: "video",
                      recipientName: counterpart.display_name,
                      recipientPhone: counterpart.phone_number_normalized,
                    }),
                  );
                }}
                style={styles.iconButton}
              >
                <Video
                  color={appColors.primarySoft}
                  size={16}
                  strokeWidth={2.2}
                />
              </Pressable>
            </View>
          </View>
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
  activeCallCard: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 18,
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
  primaryAction: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 18,
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryActionLabel: {
    color: appColors.primarySoft,
    fontFamily: appTypography.fontFamily,
    fontSize: 15,
    fontWeight: "700",
  },
  helperText: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
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
  callRow: {
    alignItems: "center",
    borderBottomColor: appColors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingVertical: 14,
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
  callCopy: {
    flex: 1,
  },
  rowTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  rowTrailing: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 12,
    marginLeft: 12,
  },
  callName: {
    color: appColors.textPrimary,
    flex: 1,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    fontWeight: "700",
  },
  callMeta: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
    textTransform: "capitalize",
  },
  callSubmeta: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    textTransform: "capitalize",
  },
  actionsColumn: {
    gap: 8,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 14,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
});
