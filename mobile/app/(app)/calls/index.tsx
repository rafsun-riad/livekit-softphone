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
      <View style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.heroIcon}>
            <PhoneCall
              color={appColors.actionDarkText}
              size={22}
              strokeWidth={2.2}
            />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>Calls</Text>
            <Text style={styles.title}>Recent audio and video activity</Text>
          </View>
        </View>
        <Text style={styles.body}>
          Review recent call history, filter by name or number, and start the
          next call from an existing contact.
        </Text>
      </View>

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

      <Link href="../contacts" asChild>
        <Pressable style={styles.primaryAction}>
          <Text style={styles.primaryActionLabel}>Start a new call</Text>
        </Pressable>
      </Link>

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
          <View key={call.id} style={styles.callCard}>
            <View style={styles.callCopy}>
              <Text style={styles.callName}>
                {counterpart.display_name ||
                  counterpart.phone_number_normalized}
              </Text>
              <Text style={styles.callMeta}>
                {getDirectionLabel(call, session?.user.id ?? counterpart.id)}{" "}
                {call.call_type} call
              </Text>
              <Text style={styles.callSubmeta}>
                {formatStateLabel(call.state)} •{" "}
                {formatTimestamp(getDisplayTimestamp(call))}
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
              style={styles.iconButton}
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
              style={styles.iconButton}
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
  heroIcon: {
    alignItems: "center",
    backgroundColor: appColors.actionDark,
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
  activeCallCard: {
    alignItems: "center",
    backgroundColor: appColors.surfaceStrong,
    borderColor: appColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
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
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
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
    marginBottom: 18,
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
  callCard: {
    alignItems: "center",
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    marginTop: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  callCopy: {
    flex: 1,
  },
  callName: {
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  callMeta: {
    color: appColors.textSecondary,
    fontFamily: appTypography.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  callSubmeta: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    textTransform: "capitalize",
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: appColors.primary,
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
});
