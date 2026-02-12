import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet
} from "react-native";
import styles from "../styles/resultStyles";

// ===== รายชื่อโรค =====
const DISEASE_OPTIONS = [
  { label: "โรคนิ่ว", value: "Urolithiasis" },
  { label: "โรคไต", value: "Kidney Disease" },
  { label: "โรคตับและฟัน", value: "Gum Disease" },
  { label: "โรคหัด", value: "Feline Panleukopenia" },
  { label: "โรคเบาหวาน", value: "Diabetes" },
];

// ===== Helper function: จัดรูปแบบ JSON ให้เป็น String สวยๆ =====
const formatPreventionData = (data) => {
  if (!data) return "";
  let text = `${data.intro}\n\n`;
  if (data.points && Array.isArray(data.points)) {
    data.points.forEach((p) => {
      text += `• ${p.title}:\n   ${p.desc}\n\n`;
    });
  }
  return text.trim();
};

const formatCounselingData = (data) => {
  if (!data) return "";
  let text = `${data.intro}\n\n`;
  if (data.red_flags && Array.isArray(data.red_flags)) {
    data.red_flags.forEach((f) => {
      text += `⚠️ ${f.symptom}:\n    ${f.meaning}\n\n`;
    });
  }
  return text.trim();
};

// ===== Factory Methods =====
const ResultScreenFactory = {
  // 1. Fetch Assessment
  async fetchAssessment(catId) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      riskData: [
        { label: "Kidney Disease", value: "Low Risk", score: 30 },
        { label: "Diabetes", value: "No Risk", score: 5 },
        { label: "Urolithiasis", value: "Low Risk", score: 25 },
        { label: "Gum Disease", value: "Low Risk", score: 40 },
        { label: "Feline Panleukopenia", value: "Low Risk", score: 20 },
      ],
      overallRisk: "Moderate Risk",
      summaryTitle: "Moderate health risk detected",
      summaryDesc: "Some changes were observed, but no serious health risks are detected at this time.",
    };
  },

  // 2. Fetch Guidance
  async fetchGuidance(condition, catId) {
    try {
      // ⚠️ เปลี่ยน IP เป็น IP ของเครื่องคอมฯ คุณ
      const API_URL = "http://10.0.2.2:3000/api/guidance";

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition, catId }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        preventionData: data.prevention,
        counselingData: data.counseling
      };

    } catch (error) {
      console.error("❌ fetchGuidance error:", error.message);
      return { success: false, error: error.message };
    }
  },

  validateBeforeSave(selectedCondition, preventionText, counselingText) {
    const errors = [];
    if (!selectedCondition) errors.push("Please select a condition");
    return { isValid: errors.length === 0, errors };
  },

  async saveAssessment(payload) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, assessmentId: "mock-id-123" };
  }
};

// ===== Main Component =====
export default function ResultScreen({ onBack, onSave, route }) {
  const [loadingData, setLoadingData] = useState(true);
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const [savingAssessment, setSavingAssessment] = useState(false);

  // Dropdown State
  const [selectedConditionValue, setSelectedConditionValue] = useState(null);
  const [selectedConditionLabel, setSelectedConditionLabel] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Data State
  const [preventionData, setPreventionData] = useState(null);
  const [counselingData, setCounselingData] = useState(null);

  // API Data
  const [riskData, setRiskData] = useState([]);
  const [overallRisk, setOverallRisk] = useState("Moderate Risk");
  const [summaryTitle, setSummaryTitle] = useState("");
  const [summaryDesc, setSummaryDesc] = useState("");

  const catId = route?.params?.catId;

  // Load Initial Data
  useEffect(() => {
    const loadInitialData = async () => {
      setLoadingData(true);
      try {
        const result = await ResultScreenFactory.fetchAssessment(catId);
        if (result.success) {
          setRiskData(result.riskData);
          setOverallRisk(result.overallRisk);
          setSummaryTitle(result.summaryTitle);
          setSummaryDesc(result.summaryDesc);
        }
      } catch (error) { console.error(error); }
      finally { setLoadingData(false); }
    };
    loadInitialData();
  }, [catId]);

  // Fetch Guidance
  useEffect(() => {
    if (!selectedConditionValue) {
      setPreventionData(null);
      setCounselingData(null);
      return;
    }

    const loadGuidance = async () => {
      setLoadingGuidance(true);
      try {
        const result = await ResultScreenFactory.fetchGuidance(
          selectedConditionValue,
          catId
        );

        if (result.success) {
          setPreventionData(result.preventionData);
          setCounselingData(result.counselingData);
        } else {
          Alert.alert("Connection Error", "ไม่สามารถเชื่อมต่อ Server ได้");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to load guidance");
      } finally {
        setLoadingGuidance(false);
      }
    };

    loadGuidance();
  }, [selectedConditionValue, catId]);

  const handleSave = async () => {
    Alert.alert("Success", "บันทึกเรียบร้อย (Mock)");
  };

  if (loadingData) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#1abc9c" />
        <Text style={{ marginTop: 10 }}>Loading assessment...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={styles.backArrow}>‹</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Assessment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 150 }} nestedScrollEnabled={true}>
        {/* Risk Circle */}
        <View style={styles.circleWrapper}>
          <View style={styles.circleBg}>
            <View style={styles.circleProgress} /><Text style={styles.riskText}>{overallRisk}</Text>
          </View>
          <Text style={styles.recommendText}>Closer monitoring recommended</Text>
          <Text style={styles.subText}>Overall Health Risk</Text>
        </View>

        {/* ===== [ADDED] Summary (ส่วนที่หายไป) ===== */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>{summaryTitle}</Text>
          <Text style={styles.summaryDesc}>{summaryDesc}</Text>
        </View>

        {/* ===== [ADDED] Risk Breakdown (ส่วนกราฟแท่งที่หายไป) ===== */}
        <Text style={styles.sectionTitle}>Risk Breakdown</Text>
        {riskData.map((item, index) => (
          <View key={index} style={styles.riskItem}>
            <View style={styles.riskRow}>
              <Text style={styles.riskLabel}>{item.label}</Text>
              <Text style={styles.riskValue}>{item.value}</Text>
            </View>
            <View style={styles.riskBarBg}>
              {item.value !== "No Risk" && (
                <View style={[styles.riskBarFill, { width: `${item.score || 25}%` }]} />
              )}
            </View>
          </View>
        ))}
        {/* ======================================================= */}

        <Text style={styles.sectionTitle}>Recommended Approach</Text>

        {/* ===== CARD 1: Disease Prevention ===== */}
        <View style={[styles.card, { zIndex: 2000 }]}>
          <Text style={styles.cardTitle}>Disease Prevention</Text>

          {/* Dropdown */}
          <View style={{ marginBottom: 15, zIndex: 3000 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              style={customStyles.dropdownHeader}
            >
              <Text style={{ fontSize: 16, color: selectedConditionLabel ? '#000' : '#888' }}>
                {selectedConditionLabel || "เลือกโรคเพื่อดูคำแนะนำ..."}
              </Text>
              <Text style={{ fontSize: 14, color: '#666' }}>{isDropdownOpen ? "▲" : "▼"}</Text>
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={customStyles.dropdownList}>
                {DISEASE_OPTIONS.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[customStyles.dropdownItem, selectedConditionValue === item.value && customStyles.dropdownItemActive]}
                    onPress={() => {
                      setSelectedConditionValue(item.value);
                      setSelectedConditionLabel(item.label);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text style={{ fontSize: 16, color: selectedConditionValue === item.value ? '#1abc9c' : '#333' }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Content: Prevention */}
          {loadingGuidance ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1abc9c" />
              <Text style={styles.loadingText}>กำลังขอคำแนะนำจาก AI...</Text>
            </View>
          ) : (
            <View>
              {preventionData ? (
                <>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#333' }}>
                    {preventionData.title}
                  </Text>
                  <Text style={styles.cardDesc}>
                    {formatPreventionData(preventionData)}
                  </Text>
                </>
              ) : (
                <Text style={styles.cardDesc}>กรุณาเลือกโรคด้านบนเพื่อดูคำแนะนำ</Text>
              )}
            </View>
          )}
        </View>

        {/* ===== CARD 2: Counseling ===== */}
        <View style={[styles.card, { zIndex: 1000 }]}>
          <Text style={styles.cardTitle}>Counseling</Text>

          {loadingGuidance ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1abc9c" />
            </View>
          ) : (
            <View>
              {counselingData ? (
                <>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#D32F2F' }}>
                    {counselingData.title}
                  </Text>
                  <Text style={styles.cardDesc}>
                    {formatCounselingData(counselingData)}
                  </Text>
                </>
              ) : (
                <Text style={styles.cardDesc}>ข้อมูลจะแสดงหลังจากเลือกโรคแล้ว</Text>
              )}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Assessment</Text>
      </TouchableOpacity>
    </View>
  );
}


const customStyles = StyleSheet.create({
  dropdownHeader: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50 },
  dropdownList: { marginTop: 5, borderWidth: 1, borderColor: '#eee', borderRadius: 8, backgroundColor: '#fff', position: 'absolute', top: 50, left: 0, right: 0, zIndex: 9999, elevation: 5 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dropdownItemActive: { backgroundColor: '#e6fffa' }
});