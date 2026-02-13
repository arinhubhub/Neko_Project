import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Screens
import CommunityScreen from "./CommunityScreen";
import RankingScreen from "./RankingScreen";

const { width, height } = Dimensions.get("window");

export default function MainTabNavigator({ session, onBack, onNavigate }) {
  const [currentView, setCurrentView] = useState("Menu");

  if (currentView === "Community") {
    return (
      <CommunityScreen
        session={session}
        onBack={() => setCurrentView("Menu")}
        onNavigate={onNavigate}
      />
    );
  }

  if (currentView === "Ranking") {
    return (
      <RankingScreen
        session={session}
        onBack={() => setCurrentView("Menu")}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Background Gradient */}
      <LinearGradient
        colors={["#F0FAF9", "#FFFFFF", "#FDF2F8"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      {/* Decorative Circles */}
      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      <SafeAreaView style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#546E7A" />
          </TouchableOpacity>
        </View>

        {/* Content Container (Centered) */}
        <View style={styles.content}>

          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.superTitle}>COMMUNITY</Text>
            <Text style={styles.mainTitle}>Explore the{"\n"}World of Cats</Text>
          </View>

          {/* Grid Menu System */}
          <View style={styles.gridContainer}>

            {/* Left Card: Community */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setCurrentView("Community")}
              style={[styles.gridCardContainer, { marginRight: 15 }]}
            >
              <LinearGradient
                colors={["#E0F2F1", "#B2DFDB"]}
                style={styles.gridCard}
              >
                <View style={styles.iconBadge}>
                  <Ionicons name="chatbubbles" size={32} color="#00695C" />
                </View>
                <Text style={styles.gridTitle}>Community</Text>
                <Text style={styles.gridSub}>Join the Talk</Text>
                <View style={styles.actionArrow}>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Right Card: Ranking */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setCurrentView("Ranking")}
              style={styles.gridCardContainer}
            >
              <LinearGradient
                colors={["#FFF3E0", "#FFE0B2"]}
                style={styles.gridCard}
              >
                <View style={[styles.iconBadge, { backgroundColor: "rgba(255,255,255,0.6)" }]}>
                  <Ionicons name="trophy" size={32} color="#E65100" />
                </View>
                <Text style={[styles.gridTitle, { color: "#E65100" }]}>Ranking</Text>
                <Text style={[styles.gridSub, { color: "#BF360C" }]}>Top Cats</Text>
                <View style={[styles.actionArrow, { backgroundColor: "#FFB74D" }]}>
                  <Ionicons name="arrow-forward" size={16} color="#FFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

          </View>

          {/* Bottom Decoration / Quote */}
          <View style={styles.footerQuote}>
            <MaterialCommunityIcons name="format-quote-open" size={24} color="#CFD8DC" />
            <Text style={styles.quoteText}>
              "Time spent with cats is never wasted."
            </Text>
          </View>

        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  circleTop: {
    position: "absolute",
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#E0F2F1",
    opacity: 0.5,
  },
  circleBottom: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "#FCE4EC",
    opacity: 0.4,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 10,
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center', // Center Vertically!
  },

  titleSection: {
    marginBottom: 40,
  },
  superTitle: {
    fontSize: 12,
    fontFamily: "Inter-Bold",
    color: "#90A4AE",
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  mainTitle: {
    fontSize: 32,
    fontFamily: "Inter-Bold",
    color: "#546E7A", // Softer color
    lineHeight: 40,
  },

  // Grid
  gridContainer: {
    flexDirection: "row",
    height: 220, // Fixed height for cards
    marginBottom: 50,
  },
  gridCardContainer: {
    flex: 1,
    borderRadius: 24,
    elevation: 4,
    shadowColor: "#546E7A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  gridCard: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    justifyContent: "space-between",
  },
  iconBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  gridTitle: {
    fontSize: 20,
    fontFamily: "Inter-Bold",
    color: "#00695C",
    marginTop: 10,
  },
  gridSub: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#004D40",
    opacity: 0.7,
  },
  actionArrow: {
    alignSelf: "flex-end",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#4DB6AC",
    justifyContent: "center",
    alignItems: "center",
  },

  // Footer
  footerQuote: {
    alignItems: "center",
    opacity: 0.7,
  },
  quoteText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: "#78909C",
    fontStyle: "italic",
  },
});
