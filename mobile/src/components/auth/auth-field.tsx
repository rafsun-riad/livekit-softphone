import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { appColors, appTypography } from "@/src/theme/app-theme";

type AuthFieldProps = TextInputProps & {
  label: string;
};

export function AuthField({ label, style, ...props }: AuthFieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={appColors.textSecondary}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    color: appColors.textMuted,
    fontFamily: appTypography.fontFamily,
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    backgroundColor: appColors.surface,
    borderColor: appColors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: appColors.textPrimary,
    fontFamily: appTypography.fontFamily,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
