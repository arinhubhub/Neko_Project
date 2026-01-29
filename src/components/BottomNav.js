import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";

export default function BottomNav({ current, onNavigate }) {
  return (
    <View style={styles.container}>
      
      {/* Home */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => onNavigate("Home")}
      >
        <Ionicons name="home-outline" size={30} color="#484C52" />
        <Text style={styles.label}>Home</Text>
      </TouchableOpacity>

      {/* Calendar */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => onNavigate("Calendar")}
      >
        <Feather name="calendar" size={30} color="#484C52" />
        <Text style={styles.label}>Calendar</Text>
      </TouchableOpacity>

      {/* Camera */}
      <TouchableOpacity
        style={styles.cameraWrapper}
        onPress={() => onNavigate("Camera")}
      >
        <View style={styles.cameraButton}>
          <Ionicons name="camera" size={30} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* Overview */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => onNavigate("Overview")}
      >
        <MaterialIcons name="bar-chart" size={33} color="#484C52" />
        <Text style={styles.label}>Overview</Text>
      </TouchableOpacity>

      {/* Community */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => onNavigate("Community")}
      >
        <Ionicons name="people-outline" size={30} color="#484C52" />
        <Text style={styles.label}>Community</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
   height: 90,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    
    position: "absolute",
    bottom: 0,
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
  },

  label: {
    marginTop: 4,
    fontFamily: "Poppins-Regular",
    fontSize: 12,
    color: "#484C52",
  },

  cameraWrapper: {
    marginTop: -10,
  },

  cameraButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#147C78",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});
