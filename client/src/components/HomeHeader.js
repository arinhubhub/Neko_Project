import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import styles from "../styles/homeStyles";

export default function HomeHeader({ onProfile, onNotify, onSetting }) {
  return (
    <View style={styles.headerBg}>
      {/* ซ้าย: โปรไฟล์ */}
      <TouchableOpacity onPress={onProfile}>
        <Image
          source={require("../../assets/makky.jpg")}
          style={styles.avatar}
        />
      </TouchableOpacity>

      {/* กลาง */}
      <Text style={styles.title}>NEKO CARE</Text>

      {/* ขวา */}
      <View style={styles.iconGroup}>
        <TouchableOpacity style={styles.iconBtn} onPress={onNotify}>
          <Text>🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onSetting}>
          <Text>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
