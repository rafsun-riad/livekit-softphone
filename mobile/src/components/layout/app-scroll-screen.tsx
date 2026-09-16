import { PropsWithChildren } from "react";
import {
  Platform,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { appColors } from "@/src/theme/app-theme";

type AppScrollScreenProps = PropsWithChildren<{
  centerContent?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
}>;

export function AppScrollScreen({
  children,
  centerContent = false,
  contentContainerStyle,
  keyboardVerticalOffset = 0,
}: AppScrollScreenProps) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={keyboardVerticalOffset}
      contentContainerStyle={[
        styles.scrollContent,
        centerContent && styles.centerContent,
        contentContainerStyle,
      ]}
      extraKeyboardSpace={Platform.OS === "android" ? 28 : 20}
      keyboardDismissMode="none"
      keyboardShouldPersistTaps="always"
      mode="layout"
      showsVerticalScrollIndicator={false}
      style={styles.screen}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  centerContent: {
    justifyContent: "center",
  },
});
