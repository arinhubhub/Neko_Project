import React from "react";
import BottomNav from "../components/BottomNav";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import HomeHeader from "../components/HomeHeader";
import styles from "../styles/homeStylesOld";

export default function HomeScreen({ onAssess,onLogDaily}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#B2E1DB",
        paddingBottom: 100,
      }}
    >
      <HomeHeader />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== Profile Section ===== */}
        <View style={styles.profileSection}>
  <View style={styles.profileOuter}>
    {/* 🔹 Placeholder โปรไฟล์ (รอ backend / Supabase) */}
    <View style={styles.profileInnerPlaceholder} />
  </View>
</View>

        {/* ===== Text Section ===== */}
        <View style={styles.textSection}>
          <Text style={styles.welcomeTitle}>
            Welcome to NekoCare 🐾
          </Text>

          <Text style={styles.welcomeDesc}>
            Your cat profile is ready.{"\n"}
            Let’s start the first health check.
          </Text>

          <Text style={styles.statusText}>
            Not assessed yet
          </Text>
        </View>

        {/* ===== Assess Health Button ===== */}
        <TouchableOpacity
          style={styles.assessButton}
          activeOpacity={0.85}
          onPress={() => onAssess && onAssess()}
        >
          <Text style={styles.assessButtonText}>
            Assess Health Risk
          </Text>
        </TouchableOpacity>

        {/* ===== Photo Health Check Card ===== */}
        <TouchableOpacity
          style={styles.photoCard}
          activeOpacity={0.9}
        >
          <View style={styles.photoLeft}>
            <Text style={styles.photoIcon}>📷</Text>

            <View style={styles.photoTextGroup}>
              <Text style={styles.photoTitle}>
                Photo Health Check
              </Text>

              <Text style={styles.photoDesc}>
                Take a photo to screen your cat’s health risk
              </Text>
            </View>
          </View>

          <View style={styles.photoBtn}>
            <Text style={styles.photoBtnText}>
              Start Assessment
            </Text>
          </View>
        </TouchableOpacity>

        {/* ===== Horizontal Info Cards (ต้องอยู่ตรงนี้) ===== */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.infoScroll}
        >
          <TouchableOpacity
  style={styles.infoCard}
  activeOpacity={0.9}
  onPress={() => onLogDaily && onLogDaily()}
>
  <Image
    source={require("../../assets/info1.png")}
    style={styles.infoImage}
  />
  <View style={styles.infoOverlay}>
    <Text style={styles.infoTitle}>
      Understand Your Cat’s Health
    </Text>
  </View>
</TouchableOpacity>
<TouchableOpacity
  style={styles.infoCard}
  activeOpacity={0.9}
  onPress={() => {
    console.log("Card 2 pressed");
  }}
>
  <Image
    source={require("../../assets/info2.png")}
    style={styles.infoImage}
  />
  <View style={styles.infoOverlay}>
    <Text style={styles.infoTitle}>
      Cat Health Tips & Insights
    </Text>
  </View>
</TouchableOpacity>
        </ScrollView>

      </ScrollView>

      <BottomNav
        current="Home"
        onNavigate={(screen) => {
            if (screen === "Home") navigateToHomeOld();
            if (screen === "Calendar") navigateToCalendar();
        }}
      />
    </View>
  );
}
