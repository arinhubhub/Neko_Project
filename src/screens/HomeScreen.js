import React from "react";
import BottomNav from "../components/BottomNav";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import HomeHeader from "../components/HomeHeader";
import styles from "../styles/homeStyles";

export default function HomeScreen({ onAssess }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#B2E1DB" }}>
      
      {/* ===== Header (ปล่อยว่าง รอ backend) ===== */}
      <HomeHeader
        profileImage={null}
        profileName={null}
      />

      {/* Content  */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ===== Profile Section (ว่าง) ===== */}
        <View style={styles.profileSection}>
          <View style={styles.profileOuter}>
            {/* 🔸 ว่างไว้ ไม่ใส่ Image */}
            <View style={styles.profilePlaceholder} />
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

        {/* ===== Assess Button ===== */}
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

        {/* ===== Getting Started ===== */}
        <View style={styles.gettingStartedSection}>
          <Text style={styles.gettingStartedTitle}>
            Getting Started
          </Text>

          <View style={styles.statusItem}>
            <View style={[styles.checkCircle, styles.checkDone]}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
            <Text style={styles.statusItemText}>
              Cat profile completed
            </Text>
          </View>

          <View style={styles.statusItem}>
            <View style={styles.checkCircle} />
            <Text style={styles.statusItemText}>
              First health assessment
            </Text>
          </View>

          <View style={styles.statusItem}>
            <View style={styles.checkCircle} />
            <Text style={styles.statusItemText}>
              Daily monitoring
            </Text>
          </View>
        </View>

        {/* ===== Smart Monitoring ===== */}
        <View style={styles.smartCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.smartTitle}>
              Smart Monitoring
            </Text>

            <Text style={styles.smartDesc}>
              Connect your camera to track daily activity and litter behavior
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.setupBtn}
          >
            <Text style={styles.setupBtnText}>
              Set up camera
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ===== Bottom Nav (ไม่ทับ) ===== */}
      <BottomNav
        current="Home"
        onNavigate={(screen) => {
          console.log("Go to", screen);
        }}
      />
    </SafeAreaView>
  );
}
