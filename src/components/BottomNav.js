import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function BottomNav({ current, onNavigate }) {
  const isActive = (name) => current === name;

  return (
    <View style={styles.container}>
      {/* Home */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => onNavigate("Home")}
      >
        <Ionicons
          name="home-outline"
          size={22}
          color={isActive("Home") ? "#147C78" : "#484C52"}
        />
        <Text
          style={[
            styles.label,
            isActive("Home") && styles.activeLabel,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* Calendar */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => onNavigate("Calendar")}
      >
        <Feather
          name="calendar"
          size={22}
          color={isActive("Calendar") ? "#147C78" : "#484C52"}
        />
        <Text
          style={[
            styles.label,
            isActive("Calendar") && styles.activeLabel,
          ]}
        >
          Calendar
        </Text>
      </TouchableOpacity>

      {/* Camera */}
      <TouchableOpacity
        style={styles.cameraWrapper}
        onPress={() => onNavigate("Camera")}
        activeOpacity={0.85}
      >
        <View style={styles.cameraButton}>
          <Ionicons name="camera" size={26} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Overview */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => onNavigate("Overview")}
      >
        <MaterialIcons
          name="bar-chart"
          size={22}
          color={isActive("Overview") ? "#147C78" : "#484C52"}
        />
        <Text
          style={[
            styles.label,
            isActive("Overview") && styles.activeLabel,
          ]}
        >
          Overview
        </Text>
      </TouchableOpacity>

      {/* Community */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => onNavigate("Community")}
      >
        <Ionicons
          name="people-outline"
          size={22}
          color={isActive("Community") ? "#147C78" : "#484C52"}
        />
        <Text
          style={[
            styles.label,
            isActive("Community") && styles.activeLabel,
          ]}
        >
          Community
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 24, // ✅ responsive
    height: 74,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",

    position: "absolute",
    bottom: 12,
    alignSelf: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 6,
  },

  item: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },

  label: {
    marginTop: 4,
    fontSize: 12,
    color: "#484C52",
  },

  activeLabel: {
    color: "#147C78",
    fontWeight: "600",
  },

  cameraWrapper: {
    marginTop: -24,
  },

  cameraButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#147C78",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});
