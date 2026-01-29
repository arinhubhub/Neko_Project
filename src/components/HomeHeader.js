import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "../styles/homeStyles";

export default function HomeHeader({
  onProfile,
  onNotify,
  onSetting,
}) {
  return (
    <View style={styles.headerBg}>
      
      {/* ซ้าย: โปรไฟล์ (placeholder) */}
      <TouchableOpacity
        style={styles.avatarPlaceholder}
        onPress={onProfile}
        activeOpacity={0.7}
      />

      {/* กลาง: Title */}
      <Text style={styles.headerTitle}>
        NEKO CARE
      </Text>

      {/*  แจ้งเตือน + ตั้งค่า */}
      <View style={styles.iconGroup}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onNotify}
          activeOpacity={0.7}
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color="#147C78"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onSetting}
          activeOpacity={0.7}
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color="#147C78"
          />
        </TouchableOpacity>
      </View>

    </View>
  );
}
