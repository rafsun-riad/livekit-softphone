import { useLifecycleDebugStore } from "@/src/stores/lifecycle-debug-store";

function redactValue(key: string, value: unknown) {
  const normalizedKey = key.toLowerCase();
  if (
    normalizedKey.includes("token") ||
    normalizedKey.includes("authorization") ||
    normalizedKey.includes("access")
  ) {
    if (typeof value !== "string" || value.length <= 8) {
      return "[redacted]";
    }

    return `${value.slice(0, 4)}...[redacted]...${value.slice(-4)}`;
  }

  return value;
}

function formatDetails(details: unknown) {
  if (details == null) {
    return null;
  }

  if (typeof details === "string") {
    return details;
  }

  try {
    return JSON.stringify(details, (key, value) => redactValue(key, value));
  } catch {
    return "[unserializable details]";
  }
}

export function logLifecycleEvent(
  scope: string,
  event: string,
  details?: unknown,
) {
  const formattedDetails = formatDetails(details);
  useLifecycleDebugStore.getState().pushEntry({
    scope,
    event,
    details: formattedDetails,
  });

  if (formattedDetails) {
    console.info(`[lifecycle] ${scope}:${event}`, formattedDetails);
    return;
  }

  console.info(`[lifecycle] ${scope}:${event}`);
}
