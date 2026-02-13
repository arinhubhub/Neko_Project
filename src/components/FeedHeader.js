// components/FeedHeader.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function FeedHeader({
  title = "Community",
  onBack,
  onProfile,
}) {
  return (
    <View style={styles.container}>
      <SafeAreaView>
        <View style={styles.inner}>
          {/* Left */}
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="chevron-back" size={24} color="#37474F" />
          </TouchableOpacity>

          {/* Center */}
          <Text style={styles.title}>{title}</Text>

          {/* Right */}
          <TouchableOpacity onPress={onProfile} style={styles.iconBtn}>
            <Ionicons name="person-circle-outline" size={26} color="#37474F" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F7FA", // Matches screen bg
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    paddingBottom: 4,
    zIndex: 1,
    // Add shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inner: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: Platform.OS === "ios" ? 0 : 8,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter-Bold",
    color: "#37474F",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00695C", // Primary Green
    justifyContent: "center",
    alignItems: "center",
    // Shadow
    shadowColor: "#00695C",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});
