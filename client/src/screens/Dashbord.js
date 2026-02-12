import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BottomNav from "../components/BottomNav";
import HealthTrendsChart from "../components/HealthTrendsChart";
import HomeHeader from "../components/HomeHeader";
import supabase from "./config/supabaseClient";
import { analyzeHealthLog, getHealthStatus } from "../utils/healthLogic";




export default function Dashboard({ onBack, onNavigate, session }) {
  // สมมติคะแนนรวม (ในอนาคตอาจจะดึงมาจาก Database)
  const [currentScore, setCurrentScore] = useState(null); 
  const status = getHealthStatus(currentScore || 100);

  // Chart data state
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("7 DAY");

  useEffect(() => {
    if (session?.user) {
      fetchLast7DaysLogs();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchLast7DaysLogs = async () => {
    try {
      setLoading(true);

      // 1. หา ID แมวของ User
      const { data: catData, error: catError } = await supabase
        .from("cats")
        .select("id")
        .eq("owner_id", session.user.id)
        .limit(1)
        .single();

      if (catError || !catData) {
        console.log("No cat found");
        setLoading(false);
        setCurrentScore(100); // ถ้าไม่มีแมว ให้เต็ม 100 ไปก่อน
        return;
      }

      // 2. ดึง Log ย้อนหลัง 7 วัน (เรียงจากล่าสุดไปเก่าสุด)
      const { data: logsData, error: logsError } = await supabase
        .from("daily_logs")
        .select("*") 
        .eq("cat_id", catData.id)
        .order("log_date", { ascending: false }) 
        .limit(7);

      if (logsError) throw logsError;

      // ====================================================
      // 🎯 ส่วนคำนวณคะแนนเฉลี่ย 7 วัน (หัวใจสำคัญ)
      // ====================================================
      if (logsData && logsData.length > 0) {
        let totalScore = 0;

        // วนลูปทุก Log ที่เจอในช่วง 7 วัน
        logsData.forEach(log => {
           // ส่ง Log ไปให้ healthLogic ตรวจร่างกายรายวัน
           const analysis = analyzeHealthLog(log);
           
           // เอาคะแนนมารวมกัน (เช่น วันแรก 80 + วันสอง 100 + ...)
           totalScore += analysis.score;
        });
        
        // สูตร: คะแนนรวม / จำนวนวันที่จดบันทึก = คะแนนเฉลี่ย (เต็ม 100)
        const averageScore = Math.round(totalScore / logsData.length);
        
        // อัปเดตตัวเลขขึ้นหน้าจอ
        setCurrentScore(averageScore);
      } else {
        // ถ้า 7 วันที่ผ่านมาไม่ได้จดเลย ให้คะแนนเต็ม 100 (ถือว่าปกติ)
        setCurrentScore(100); 
      }

      // 3. เตรียมข้อมูลกราฟ (ส่วนนี้เหมือนเดิม)
      // กลับด้านข้อมูล (ให้กราฟโชว์จาก อดีต -> ปัจจุบัน)
      const chartLogs = [...(logsData || [])].reverse(); 
      
      const labels = chartLogs.map((log) => {
        const date = new Date(log.log_date);
        return `${date.getDate()}/${date.getMonth() + 1}`;
      });

      const foodData = chartLogs.map((log) => log.food_intake || 0);
      const waterData = chartLogs.map((log) => log.water_level || 0); // หรือ water_intake ตาม DB คุณ

      setChartData({
        labels: labels,
        foodData: foodData,
        waterData: waterData,
      });

    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const periods = ["7 DAY"];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Header */}
        <HomeHeader 
            onProfile={() => onNavigate && onNavigate('Profile')} 
            onNotify={() => console.log("Notify")}
            onSetting={() => onNavigate && onNavigate('UserInfo')} 
        />

        {/* ===== ส่วนแสดงผลคะแนน (คล้าย AssessmentScreen) ===== */}
        {/* ===== ส่วนแสดงผลคะแนน (คล้าย AssessmentScreen) ===== */}
       <View style={[styles.scoreContainer, { marginTop: 40 }]}>
            {loading || currentScore === null ? (
                <ActivityIndicator size="large" color="#4FD1C5" style={{ marginBottom: 20 }} />
            ) : (
                <>
                    <View style={[styles.scoreCircleLarge, { borderColor: status.color }]}>
                        <Text style={[styles.statusLabelLarge, { color: status.color }]}>{status.label}</Text>
                        <Text style={{ fontSize: 40, fontWeight: 'bold', color: status.color }}>{currentScore}</Text>
                    </View>
                    <Text style={[styles.statusDescBelow, { color: status.color }]}>{status.text}</Text>
                </>
            )}
            
        </View>

  {/* ===== Latest Health Assessment ===== */}
        <View style={styles.assessmentCard}>
          <Text style={styles.assessmentTitle}>Latest Health Assessment</Text>
          <View style={styles.assessmentContent}>
            <View style={styles.assessmentInfo}>
              <Text style={styles.assessmentDate}>Oct 22 • <Text style={styles.assessmentRisk}>Moderate Risk</Text></Text>
            </View>
            <View style={styles.assessmentButtons}>
              <TouchableOpacity 
                style={styles.viewResultButton}
                onPress={() => onNavigate?.('Result')}
              >
                <Text style={styles.viewResultButtonText}>View Result</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.viewHistoryButton}
                onPress={() => console.log('View History pressed')}
              >
                <Text style={styles.viewHistoryButtonText}>View History</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ===== System Risk Analysis ===== */}
        <View style={styles.riskAnalysisContainer}>
          <View style={styles.riskAnalysisHeader}>
            <Text style={styles.riskAnalysisTitle}>SYSTEM RISK ANALYSIS</Text>
            <TouchableOpacity onPress={() => console.log('View Detail pressed')}>
              <Text style={styles.viewDetailText}>View Detail</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.riskAnalysisCard}>
            {/* Activity Level */}
            <View style={styles.riskItem}>
              <Text style={styles.riskItemLabel}>Activity Level</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: '45%', backgroundColor: '#2D4A47' }]} />
              </View>
            </View>

            {/* Litter Box Usage */}
            <View style={styles.riskItem}>
              <Text style={styles.riskItemLabel}>Litter Box Usage</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: '85%', backgroundColor: '#2D4A47' }]} />
              </View>
            </View>

            {/* Abnormal Posture Detection */}
            <View style={styles.riskItem}>
              <Text style={styles.riskItemLabel}>Abnormal Posture Detection</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: '5%', backgroundColor: '#2D4A47' }]} />
              </View>
            </View>

            <Text style={styles.riskAnalysisFooter}>Based on the last 7 days of activity</Text>
          </View>
        </View>



        {/* ===== Health Trends Chart ===== */}
        <Text style={styles.sectionTitle}>Health Trends</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View style={styles.tagsContainer}>
              <View style={[styles.tag, styles.tagFood]}>
                <Text style={styles.tagText}>Food</Text>
              </View>
              <View style={[styles.tag, styles.tagWater]}>
                <Text style={styles.tagText}>Water</Text>
              </View>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#1FB3A8" style={{ marginVertical: 40 }} />
          ) : (
            <HealthTrendsChart data={chartData} />
          )}

          {/* Period Selector */}
          <View style={styles.periodContainer}>
            {periods.map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
                disabled={period !== "7 DAY"}
              >
                <Text
                  style={[
                    styles.periodText,
                    selectedPeriod === period && styles.periodTextActive,
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ===== Timeline & Export Buttons ===== */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
          <TouchableOpacity 
            style={{ 
              flex: 1, 
              backgroundColor: '#B8D8D4', 
              borderRadius: 24, 
              paddingVertical: 14, 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}
            onPress={() => onNavigate && onNavigate('Timeline')}
          >
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#2D4A47', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
               <MaterialCommunityIcons name="chart-timeline-variant" size={20} color="#fff" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#2D4A47' }}>Timeline</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ 
              flex: 1, 
              backgroundColor: '#B8D8D4', 
              borderRadius: 24, 
              paddingVertical: 14, 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3
            }}
            onPress={() => console.log('Export pressed')}
          >
            <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#2D4A47', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
               <MaterialCommunityIcons name="export-variant" size={20} color="#fff" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#2D4A47' }}>Export</Text>
          </TouchableOpacity>
        </View>

      

      </ScrollView>

      {/* ===== Bottom Nav ===== */}
      <BottomNav
        current="Overview"
        onNavigate={onNavigate}
      />
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
    paddingBottom: 100, // Increased for BottomNav
  },
  // Style ส่วนคะแนนใหม่ (New Circular Design)
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  scoreCircleLarge: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // พื้นหลังวงกลมเป็นสีขาว
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusLabelLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusDescBelow: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
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
  },
  // Chart card styles
  chartCard: {
    backgroundColor: '#334e4bff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagFood: {
    backgroundColor: 'rgba(134, 65, 244, 0.8)',
  },
  tagWater: {
    backgroundColor: 'rgba(31, 179, 168, 0.8)',
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  periodContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 12,
    gap: 4,
  },
  periodButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    minWidth: 80,
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  periodText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  periodTextActive: {
    color: '#2D4A47',
    fontWeight: '700',
  },
  // Latest Health Assessment styles
  assessmentCard: {
    backgroundColor: '#5F7671',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  assessmentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  assessmentContent: {
    flexDirection: 'column',
    gap: 12,
  },
  assessmentInfo: {
    marginBottom: 8,
  },
  assessmentDate: {
    fontSize: 16,
    color: '#B8D8D4',
    fontWeight: '600',
  },
  assessmentRisk: {
    color: '#E0E0E0',
    fontWeight: '400',
  },
  assessmentButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  viewResultButton: {
    flex: 1,
    backgroundColor: '#B8D8D4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewResultButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D4A47',
  },
  viewHistoryButton: {
    flex: 1,
    backgroundColor: '#2D4A47',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewHistoryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffffff',
  },
  // System Risk Analysis styles
  riskAnalysisContainer: {
    marginBottom: 24,
  },
  riskAnalysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskAnalysisTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D4A47',
  },
  viewDetailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D4A47',
  },
  riskAnalysisCard: {
    backgroundColor: '#B8D8D4',
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  riskItem: {
    marginBottom: 16,
  },
  riskItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D4A47',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 24,
    backgroundColor: '#D8E8E5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 12,
  },
  riskAnalysisFooter: {
    fontSize: 14,
    color: '#5F7671',
    marginTop: 8,
    fontStyle: 'italic',
  },
});