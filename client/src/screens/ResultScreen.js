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
import styles from "../styles/resultStyles"; // ตรวจสอบ path

// ===== รายชื่อโรคสำหรับ Dropdown (Label ไทย -> Value ที่ส่งไป API) =====
const DISEASE_OPTIONS = [
  { label: "โรคนิ่ว", value: "Urolithiasis" },
  { label: "โรคไต", value: "Kidney Disease" },
  { label: "โรคตับและฟัน", value: "Gum Disease" },
  { label: "โรคหัด", value: "Feline Panleukopenia" },
  { label: "โรคเบาหวาน", value: "Diabetes" },
];

// ===== Factory Methods (ตัดส่วน Localhost ออกแล้ว) =====
const ResultScreenFactory = {
  // 1. ดึงข้อมูล Assessment (Risk Score)
  async fetchAssessment(catId) {
    try {
      // TODO: เชื่อมต่อ API ใหม่ของคุณตรงนี้ เพื่อดึงค่า Risk Breakdown
      // ตัวอย่าง: const response = await fetch(`YOUR_NEW_API_URL/${catId}`);

      // --- จำลองการโหลดข้อมูล (Mock Data) ---
      await new Promise(resolve => setTimeout(resolve, 1000)); // Delay 1 วิ

      return {
        success: true,
        // ข้อมูลจำลองสำหรับแสดงผลกราฟ
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
    } catch (error) {
      console.error("❌ fetchAssessment error:", error.message);
      return { success: false, error: error.message };
    }
  },

  // 2. ดึง Guidance (Prevention & Counseling)
  async fetchGuidance(condition, catId) {
    try {
      // TODO: เชื่อมต่อ API ใหม่ของคุณตรงนี้ เพื่อดึงข้อความ Prevention/Counseling
      // const response = await fetch('YOUR_NEW_API_URL/guidance', ...);

      // --- จำลองการโหลดข้อมูล (Mock Data) ---
      await new Promise(resolve => setTimeout(resolve, 1500)); // Delay 1.5 วิ

      return {
        success: true,
        // ข้อมูลจำลองที่จะแสดงใน Card
        prevention: `[Mock Data] วิธีป้องกันสำหรับโรค ${condition}\n\nรอเชื่อมต่อข้อมูลจริงจาก Server...`,
        counseling: `[Mock Data] คำแนะนำสำหรับโรค ${condition}\n\nรอเชื่อมต่อข้อมูลจริงจาก Server...`,
      };
    } catch (error) {
      console.error("❌ fetchGuidance error:", error.message);
      return { success: false, error: error.message };
    }
  },

  // 3. บันทึกผล
  async saveAssessment(payload) {
    try {
      // TODO: เชื่อมต่อ API ใหม่ของคุณตรงนี้ เพื่อบันทึกข้อมูล

      // --- จำลองการบันทึกสำเร็จ ---
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true, assessmentId: "mock-id-123" };
    } catch (error) {
      console.error("❌ saveAssessment error:", error.message);
      return { success: false, error: error.message };
    }
  },

  validateBeforeSave(selectedCondition, preventionText, counselingText) {
    const errors = [];
    if (!selectedCondition) errors.push("Please select a condition");
    // ปรับ validation ตามความเหมาะสม
    return { isValid: errors.length === 0, errors };
  },
};

// ===== Main Component =====
export default function ResultScreen({ onBack, onSave, route }) {
  const [loadingData, setLoadingData] = useState(true);
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const [savingAssessment, setSavingAssessment] = useState(false);

  // State สำหรับ Dropdown
  const [selectedConditionValue, setSelectedConditionValue] = useState(null);
  const [selectedConditionLabel, setSelectedConditionLabel] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Text Data
  const [preventionText, setPreventionText] = useState("");
  const [counselingText, setCounselingText] = useState("");

  // API Data
  const [riskData, setRiskData] = useState([]);
  const [overallRisk, setOverallRisk] = useState("Moderate Risk");
  const [summaryTitle, setSummaryTitle] = useState("");
  const [summaryDesc, setSummaryDesc] = useState("");

  const catId = route?.params?.catId;

  // 1. Load Initial Assessment Data
  useEffect(() => {
    const loadInitialData = async () => {
      // ถ้าไม่มี catId อาจจะข้ามไปหรือแจ้งเตือน (ขึ้นอยู่กับ flow ของคุณ)
      setLoadingData(true);
      try {
        const result = await ResultScreenFactory.fetchAssessment(catId);
        if (result.success) {
          setRiskData(result.riskData);
          setOverallRisk(result.overallRisk);
          setSummaryTitle(result.summaryTitle);
          setSummaryDesc(result.summaryDesc);
        } else {
          Alert.alert("Error", "Failed to load data");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingData(false);
      }
    };
    loadInitialData();
  }, [catId]);

  // 2. Fetch Guidance เมื่อเลือกโรค
  useEffect(() => {
    if (!selectedConditionValue) {
      setPreventionText("");
      setCounselingText("");
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
          setPreventionText(result.prevention);
          setCounselingText(result.counseling);
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
    try {
      const validation = ResultScreenFactory.validateBeforeSave(
        selectedConditionValue,
        preventionText,
        counselingText
      );

      if (!validation.isValid) {
        Alert.alert("Validation Error", validation.errors.join("\n"));
        return;
      }

      setSavingAssessment(true);
      const payload = {
        catId,
        selectedCondition: selectedConditionValue,
        riskData,
        prevention: preventionText,
        counseling: counselingText,
        overallRisk,
        timestamp: new Date().toISOString(),
      };

      const result = await ResultScreenFactory.saveAssessment(payload);
      if (result.success) {
        Alert.alert("Success", "Assessment saved!", [
          { text: "OK", onPress: () => onSave && onSave(result.assessmentId) },
        ]);
      }
    } catch (error) {
      Alert.alert("Save Failed", error.message);
    } finally {
      setSavingAssessment(false);
    }
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
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assessment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 150 }} nestedScrollEnabled={true}>
        {/* Risk Circle */}
        <View style={styles.circleWrapper}>
          <View style={styles.circleBg}>
            <View style={styles.circleProgress} />
            <Text style={styles.riskText}>{overallRisk}</Text>
          </View>
          <Text style={styles.recommendText}>Closer monitoring recommended</Text>
          <Text style={styles.subText}>Overall Health Risk</Text>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>{summaryTitle}</Text>
          <Text style={styles.summaryDesc}>{summaryDesc}</Text>
        </View>

        {/* Risk Breakdown */}
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

        <Text style={styles.sectionTitle}>Recommended Approach</Text>

        {/* ===== CARD 1: Disease Prevention + Dropdown ===== */}
        <View style={[styles.card, { zIndex: 2000 }]}>
          <Text style={styles.cardTitle}>Disease Prevention</Text>

          {/* Dropdown Container */}
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

            {/* Dropdown List */}
            {isDropdownOpen && (
              <View style={customStyles.dropdownList}>
                {DISEASE_OPTIONS.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      customStyles.dropdownItem,
                      selectedConditionValue === item.value && customStyles.dropdownItemActive
                    ]}
                    onPress={() => {
                      setSelectedConditionValue(item.value);
                      setSelectedConditionLabel(item.label);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <Text style={{
                      fontSize: 16,
                      color: selectedConditionValue === item.value ? '#1abc9c' : '#333'
                    }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Content: Prevention Text */}
          {loadingGuidance ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1abc9c" />
              <Text style={styles.loadingText}>Waiting for prevention script...</Text>
            </View>
          ) : (
            <Text style={styles.cardDesc}>
              {preventionText || "Please select a condition above to see preventive advice."}
            </Text>
          )}
        </View>

        {/* ===== CARD 2: Counseling ===== */}
        <View style={[styles.card, { zIndex: 1000 }]}>
          <Text style={styles.cardTitle}>Counseling</Text>

          {loadingGuidance ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1abc9c" />
              <Text style={styles.loadingText}>Waiting for counseling script...</Text>
            </View>
          ) : (
            <Text style={styles.cardDesc}>
              {counselingText || "Please select an option from the dropdown above first."}
            </Text>
          )}
        </View>

      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, savingAssessment && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={savingAssessment}
      >
        {savingAssessment ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Assessment</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// Custom styles สำหรับ Dropdown
const customStyles = StyleSheet.create({
  dropdownHeader: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50
  },
  dropdownList: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    backgroundColor: '#fff',
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemActive: {
    backgroundColor: '#e6fffa',
  }
});