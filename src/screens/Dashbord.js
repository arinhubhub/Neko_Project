import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions } from 'react-native';

// ===== 1. Logic การคำนวณ (เหมือน ResultScreen) =====
const getHealthStatus = (score) => {
  if (score >= 80) return { label: "Excellent", color: "#6FCF97", text: "สุขภาพแข็งแรงดีเยี่ยม" };
  if (score >= 60) return { label: "Good", color: "#2D9CDB", text: "สุขภาพดี ปกติ" };
  if (score >= 40) return { label: "Fair", color: "#F2C94C", text: "ควรเริ่มดูแลใกล้ชิด" };
  return { label: "Attention", color: "#EB5757", text: "ควรปรึกษาแพทย์" };
};

export default function Dashboard({ onBack }) {
  // สมมติคะแนนรวม (ในอนาคตอาจจะดึงมาจาก Database)
  const [currentScore, setCurrentScore] = useState(75); 
  const status = getHealthStatus(currentScore);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Header */}
        <View style={styles.header}>
            <Text style={styles.headerTitle}>Dashboard</Text>
        </View>

        {/* ===== ส่วนแสดงผลคะแนน (คล้าย ResultScreen) ===== */}
        <View style={[styles.scoreCard, { backgroundColor: status.color }]}>
            <View style={styles.scoreCircle}>
                <Text style={styles.scoreText}>{currentScore}</Text>
                <Text style={styles.scoreSubText}>/100</Text>
            </View>
            <View style={styles.scoreInfo}>
                <Text style={styles.statusLabel}>{status.label}</Text>
                <Text style={styles.statusDesc}>{status.text}</Text>
            </View>
        </View>

        {/* ===== กล่องเปล่า 1: สำหรับกราฟแนวโน้ม (Trend) ===== */}
        <Text style={styles.sectionTitle}>Weekly Trend</Text>
        <View style={styles.emptyBoxLarge}>
            <Text style={styles.placeholderText}>[ พื้นที่สำหรับกราฟเส้น ]</Text>
            <Text style={styles.placeholderSubText}>แสดงแนวโน้มสุขภาพย้อนหลัง 7 วัน</Text>
        </View>

        {/* ===== กล่องเปล่า 2: สรุปรายการล่าสุด (Recent Logs) ===== */}
        <Text style={styles.sectionTitle}>Recent Logs</Text>
        <View style={styles.emptyBoxContainer}>
            {/* จำลองกล่องย่อยๆ */}
            <View style={styles.emptyBoxSmall}>
                <Text style={styles.placeholderText}>[ Log เมื่อวาน ]</Text>
            </View>
            <View style={styles.emptyBoxSmall}>
                <Text style={styles.placeholderText}>[ Log วันนี้ ]</Text>
            </View>
        </View>

        {/* ===== กล่องเปล่า 3: คำแนะนำเพิ่มเติม (Advice) ===== */}
        <Text style={styles.sectionTitle}>Daily Advice</Text>
        <View style={styles.emptyBoxMedium}>
             <Text style={styles.placeholderText}>[ พื้นที่ข้อความแนะนำ ]</Text>
             <Text style={styles.placeholderSubText}>เช่น: วันนี้ควรดื่มน้ำให้มากขึ้น</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ===== Styles เฉพาะหน้า Dashboard =====
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA', // สีพื้นหลังเทาอ่อนๆ สบายตา
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  // Style ส่วนคะแนน
  scoreCard: {
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)', // สีขาวโปร่งใส
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  scoreText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  scoreSubText: {
    fontSize: 12,
    color: '#fff',
  },
  scoreInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statusDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  // Style หัวข้อ section
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    marginLeft: 4,
  },
  // Style กล่องเปล่าๆ (Placeholder Styles)
  emptyBoxLarge: {
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed', // เส้นประ
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyBoxMedium: {
    height: 120,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyBoxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  emptyBoxSmall: {
    width: '48%', // แบ่งครึ่ง
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#BDBDBD',
    fontWeight: 'bold',
  },
  placeholderSubText: {
    fontSize: 12,
    color: '#BDBDBD',
    marginTop: 8,
  }
});