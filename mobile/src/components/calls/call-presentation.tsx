import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

type CallControlVariant = "neutral" | "accept" | "danger";

type CallControlProps = PropsWithChildren<{
  label: string;
  onPress: () => void;
  variant?: CallControlVariant;
  disabled?: boolean;
}>;

const controlStyles: Record<CallControlVariant, string> = {
  neutral: "bg-slate-800 text-white",
  accept: "bg-emerald-400 text-slate-950",
  danger: "bg-rose-600 text-white",
};

export function CallScreenShell({ children }: PropsWithChildren) {
  return <View className="flex-1 bg-slate-950 px-6 py-8">{children}</View>;
}

export function CallAvatar({
  name,
  size = "large",
}: {
  name: string;
  size?: "large" | "small";
}) {
  const sizeStyles = size === "large" ? "h-36 w-36" : "h-12 w-12";
  const textStyles = size === "large" ? "text-5xl" : "text-lg";
  const initial = name.trim().charAt(0).toLocaleUpperCase() || "?";

  return (
    <View
      className={`${sizeStyles} items-center justify-center rounded-full border border-white/10 bg-slate-800`}
    >
      <Text className={`${textStyles} font-bold text-sky-100`}>{initial}</Text>
    </View>
  );
}

export function CallStatus({ children }: PropsWithChildren) {
  return (
    <View className="rounded-full border border-white/10 bg-slate-900/90 px-4 py-2">
      <Text className="text-center text-sm font-medium text-slate-200">
        {children}
      </Text>
    </View>
  );
}

export function CallControl({
  children,
  disabled = false,
  label,
  onPress,
  variant = "neutral",
}: CallControlProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={`h-16 min-w-16 items-center justify-center rounded-full px-4 ${controlStyles[variant]} ${disabled ? "opacity-50" : ""}`}
      disabled={disabled}
      onPress={onPress}
    >
      {children}
      <Text
        className={`mt-1 text-xs font-semibold ${variant === "accept" ? "text-slate-950" : "text-white"}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function CallError({ children }: { children: ReactNode }) {
  return (
    <Text className="mx-2 text-center text-sm leading-5 text-rose-300">
      {children}
    </Text>
  );
}
