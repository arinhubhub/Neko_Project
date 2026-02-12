import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import styles from "../styles/homeStyles";

export default function HomeHeader({ onProfile, onNotify, onSetting }) {
  return (
    <View style={styles.headerBg}>
      {/* ซ้าย: โปรไฟล์ */}
      <TouchableOpacity onPress={onProfile}>
        <View style={[styles.avatar, { backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="person" size={20} color="#718096" />
        </View>
      </TouchableOpacity>

      {/* กลาง */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>NEK</Text>
        <Ionicons name="paw" size={18} color="#4FD1C5" />
        <Text style={styles.title}>CARE</Text>
      </View>

      {/* ขวา */}
      <View style={styles.iconGroup}>
        <TouchableOpacity style={styles.iconBtn} onPress={onNotify}>
          <Ionicons name="notifications-outline" size={24} color="#718096" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onSetting}>
          <Ionicons name="settings-outline" size={24} color="#718096" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
