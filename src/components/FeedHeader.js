// components/FeedHeader.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function FeedHeader({
  title = "Community",
  onBack,
  onAddPost,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {/* ซ้าย */}
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color="#0C5A58" />
        </TouchableOpacity>

        {/* กลาง */}
        <Text style={styles.title}>{title}</Text>

        {/* ขวา */}
        <TouchableOpacity onPress={onAddPost} style={styles.iconBtn}>
          <Ionicons
            name="add-circle-outline"
            size={24}
            color="#0C5A58"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#E6F4F3",
    borderBottomWidth: 1,
    borderBottomColor: "#CFE5E3",
    paddingTop:
      Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  inner: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#0C5A58",
  },
  iconBtn: {
    padding: 6,
  },
});
