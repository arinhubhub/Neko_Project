import React from "react";
import BottomNav from "../components/BottomNav";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ImageBackground
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HomeHeader from "../components/HomeHeader";
import styles from "../styles/homeStyles";

export default function HomeScreen({ onAssess, onLogDaily, onSetting, onNavigate }) {
  return (
    <SafeAreaView style={styles.container}>

      {/* ===== Header ===== */}
      <HomeHeader
        profileImage={null}
        profileName={null}
        onSetting={onSetting} // Link setting
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }} // Space for bottom nav
        showsVerticalScrollIndicator={false}
      >

        {/* 1. ส่วนรูปแมว (แยกออกมาแล้ว) */}
        <View style={{ alignItems: 'center', marginTop: 20, marginBottom: 10 }}>
          <View style={styles.circleCatContainer}>
            <Image
              source={require('../../assets/makky.jpg')}
              style={styles.circleCat}
            />
            <View style={styles.loveIcon}>
              <Ionicons name="heart" size={20} color="#FFF" />
            </View>
          </View>
        </View>

        {/* 2. ส่วนข้อความ (Hero Section เดิม เหลือแค่ Text) */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Everything looks great todays!
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <Ionicons name="time-outline" size={14} color="#A0AEC0" />
            <Text style={styles.lastCheckText}> Last check 2 day ago</Text>
          </View>
        </View>

        {/* ===== Action Buttons ===== */}
        <View style={styles.actionContainer}>

          {/* 1. Assess Health Risk */}
          <TouchableOpacity
            style={styles.assessButton}
            onPress={onAssess}
            activeOpacity={0.85}
          >
            <Ionicons name="medical-outline" size={24} color="#FFF" />
            <Text style={styles.assessButtonText}>Assess Health Risk</Text>
          </TouchableOpacity>

          {/* 2. Photo Health Check */}
          <View style={styles.photoCard}>
            <View style={styles.photoLeft}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <Ionicons name="camera-outline" size={20} color="#2D6A64" style={{ marginRight: 8 }} />
                <Text style={styles.photoTitle}>Photo Health Check</Text>
              </View>
              <Text style={styles.photoDesc}>Take a photo to screen your cat's health risk</Text>
            </View>
            <TouchableOpacity style={styles.photoBtn}>
              <Text style={styles.photoBtnText}>Start Assessment 🐾</Text>
            </TouchableOpacity>
          </View>

          {/* 3. Log Daily (Image Background) */}
          <TouchableOpacity
            style={styles.dailyLogCard}
            onPress={onLogDaily}
            activeOpacity={0.9}
          >
            <ImageBackground
              source={require('../../assets/info1.png')}
              style={styles.dailyLogBg}
              imageStyle={{ borderRadius: 20 }}
            >
              <Text style={styles.dailyLogTitle}>ช่วยกรอก Log วันนี้</Text>
              <Text style={styles.dailyLogDesc}>เพื่อให้การติดตามแม่นยำขึ้น</Text>
            </ImageBackground>
          </TouchableOpacity>

        </View>

      </ScrollView>

      {/* ===== Bottom Nav ===== */}
      <BottomNav
        current="Home"
        onNavigate={onNavigate}
      />
    </SafeAreaView>
  );
}
