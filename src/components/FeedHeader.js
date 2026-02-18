import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function FeedHeader({
  title = "Community",
  onBack,
  onProfile,
  onSettings,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
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

          {/* Right - Profile & Dropdown */}
          <View>
            <TouchableOpacity
              onPress={() => setShowDropdown(true)}
              style={styles.iconBtn}
            >
              <Ionicons name="person-circle-outline" size={26} color="#37474F" />
            </TouchableOpacity>

            <Modal
              visible={showDropdown}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowDropdown(false)}
            >
              <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
                <View style={styles.dropdownOverlay}>
                  <View style={styles.dropdownMenu}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setShowDropdown(false);
                        onProfile && onProfile();
                      }}
                    >
                      <Ionicons name="person-outline" size={20} color="#37474F" />
                      <Text style={styles.dropdownText}>Profile</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setShowDropdown(false);
                        onSettings && onSettings();
                      }}
                    >
                      <Ionicons name="settings-outline" size={20} color="#37474F" />
                      <Text style={styles.dropdownText}>Settings</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          </View>
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
  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  dropdownMenu: {
    marginTop: Platform.OS === "ios" ? 100 : 70, // Position below header
    marginRight: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 8,
    width: 160,
    // Premium Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dropdownText: {
    fontSize: 15,
    fontFamily: "Inter-Medium",
    color: "#37474F",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 8,
  },
});
