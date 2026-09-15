import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.eyebrow}>LiveKit Softphone</Text>
      <Text style={styles.title}>Android-first MVP bootstrap</Text>
      <Text style={styles.body}>
        Mobile and backend scaffolds are in place. Next steps are router setup,
        auth foundation, and native calling integrations.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  eyebrow: {
    color: "#38bdf8",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  title: {
    color: "#f8fafc",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
    marginBottom: 16,
  },
  body: {
    color: "#cbd5e1",
    fontSize: 16,
    lineHeight: 24,
  },
});
