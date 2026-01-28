import React from "react";
import { View, StyleSheet } from "react-native";

export default function LogDailyNormal() {
  return (
    <View style={styles.container} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#B2E1DB", // สีเดียวกับ Home
  },
});
