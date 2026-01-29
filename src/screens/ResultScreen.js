import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import styles from "../styles/resultStyles";

// ===== Factory Methods =====
const ResultScreenFactory = {
  // ดึงข้อมูล assessment จาก backend
  async fetchAssessment(catId) {
    try {
      if (!catId) throw new Error("catId is required");

      const response = await fetch(
        `http://localhost:3000/api/assessment/${catId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        riskData: data.riskData || [],
        conditions: data.conditions || [],
        overallRisk: data.overallRisk || "Moderate Risk",
        summaryTitle: data.summaryTitle || "",
        summaryDesc: data.summaryDesc || "",
      };
    } catch (error) {
      console.error("❌ fetchAssessment error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ดึง guidance จาก Gemini API (backend)
  async fetchGuidance(condition, catId) {
    try {
      if (!condition || !catId) {
        throw new Error("Condition and catId are required");
      }

      const response = await fetch(
        `http://localhost:3000/api/guidance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ condition, catId }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        prevention: data.prevention || "",
        counseling: data.counseling || "",
      };
    } catch (error) {
      console.error("❌ fetchGuidance error:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // บันทึกผลประเมินลง database
  async saveAssessment(payload) {
    try {
      const response = await fetch(
        `http://localhost:3000/api/assessment/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        assessmentId: data.assessmentId,
      };
    } catch (error) {
      console.error("❌ saveAssessment error:", error.message);
      return { success: false, error: error.message };
    }
  },

  // Validate ข้อมูล
  validateBeforeSave(selectedCondition, preventionText, counselingText) {
    const errors = [];
    if (!selectedCondition) errors.push("Please select a condition");
    if (!preventionText || preventionText.includes("Unable")) errors.push("Prevention data incomplete");
    if (!counselingText || counselingText.includes("Unable")) errors.push("Counseling data incomplete");
    return { isValid: errors.length === 0, errors };
  },
};

// ===== Main Component =====
export default function ResultScreen({ onBack, onSave, route }) {
  const [loadingData, setLoadingData] = useState(true);
  const [loadingGuidance, setLoadingGuidance] = useState(false);
  const [savingAssessment, setSavingAssessment] = useState(false);
  
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [preventionText, setPreventionText] = useState("");
  const [counselingText, setCounselingText] = useState("");

  // ข้อมูลจาก backend
  const [riskData, setRiskData] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [overallRisk, setOverallRisk] = useState("Moderate Risk");
  const [summaryTitle, setSummaryTitle] = useState("");
  const [summaryDesc, setSummaryDesc] = useState("");

  // ดึง catId จาก route params
  const catId = route?.params?.catId;

  // ===== Effect 1: โหลดข้อมูล assessment =====
  useEffect(() => {
    loadInitialData();
  }, [catId]);

  const loadInitialData = async () => {
    if (!catId) {
      Alert.alert("Error", "Cat ID not found");
      return;
    }

    setLoadingData(true);
    try {
      const result = await ResultScreenFactory.fetchAssessment(catId);
      
      if (result.success) {
        setRiskData(result.riskData);
        setConditions(result.conditions);
        setOverallRisk(result.overallRisk);
        setSummaryTitle(result.summaryTitle);
        setSummaryDesc(result.summaryDesc);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load assessment data");
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  // ===== Effect 2: ดึง guidance เมื่อเลือก condition =====
  useEffect(() => {
    if (!selectedCondition || !catId) {
      setPreventionText("");
      setCounselingText("");
      return;
    }

    const loadGuidance = async () => {
      setLoadingGuidance(true);
      try {
        const result = await ResultScreenFactory.fetchGuidance(
          selectedCondition,
          catId
        );

        if (result.success) {
          setPreventionText(result.prevention);
          setCounselingText(result.counseling);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to load guidance");
        setPreventionText("Unable to load prevention data");
        setCounselingText("Unable to load counseling data");
      } finally {
        setLoadingGuidance(false);
      }
    };

    loadGuidance();
  }, [selectedCondition, catId]);

  // ===== Handle Save =====
  const handleSave = async () => {
    try {
      const validation = ResultScreenFactory.validateBeforeSave(
        selectedCondition,
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
        selectedCondition,
        riskData,
        prevention: preventionText,
        counseling: counselingText,
        overallRisk,
        timestamp: new Date().toISOString(),
      };

      const result = await ResultScreenFactory.saveAssessment(payload);

      if (result.success) {
        Alert.alert("Success", "Assessment saved!", [
          {
            text: "OK",
            onPress: () => onSave && onSave(result.assessmentId),
          },
        ]);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      Alert.alert("Save Failed", error.message);
    } finally {
      setSavingAssessment(false);
    }
  };

  // ===== Loading State =====
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
      {/* ===== Header ===== */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assessment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 150 }}>
        {/* ===== Risk Circle ===== */}
        <View style={styles.circleWrapper}>
          <View style={styles.circleBg}>
            <View style={styles.circleProgress} />
            <Text style={styles.riskText}>{overallRisk}</Text>
          </View>
          <Text style={styles.recommendText}>
            Closer monitoring recommended
          </Text>
          <Text style={styles.subText}>Overall Health Risk</Text>
        </View>

        {/* ===== Summary ===== */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>{summaryTitle}</Text>
          <Text style={styles.summaryDesc}>{summaryDesc}</Text>
        </View>

        {/* ===== Risk Breakdown ===== */}
        <Text style={styles.sectionTitle}>Risk Breakdown</Text>
        {riskData.map((item, index) => (
          <View key={index} style={styles.riskItem}>
            <View style={styles.riskRow}>
              <Text style={styles.riskLabel}>{item.label}</Text>
              <Text style={styles.riskValue}>{item.value}</Text>
            </View>
            <View style={styles.riskBarBg}>
              {item.value !== "No Risk" && (
                <View
                  style={[
                    styles.riskBarFill,
                    { width: `${item.score || 25}%` },
                  ]}
                />
              )}
            </View>
          </View>
        ))}

        {/* ===== Recommended Approach ===== */}
        <Text style={styles.sectionTitle}>Recommended Approach</Text>

        {/* ===== Card 1: Disease Prevention ===== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Disease Prevention</Text>

          {/* Options */}
          <View style={styles.conditionContainer}>
            {conditions.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.optionItem,
                  selectedCondition === item && styles.optionActive,
                ]}
                onPress={() => setSelectedCondition(item)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedCondition === item && styles.optionTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loadingGuidance && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#1abc9c" />
              <Text style={styles.loadingText}>Loading guidance...</Text>
            </View>
          )}

          {!loadingGuidance && selectedCondition && (
            <Text style={styles.cardDesc}>{preventionText}</Text>
          )}

          {!selectedCondition && !loadingGuidance && (
            <Text style={styles.cardDesc}>
              Please select a condition to see preventive advice.
            </Text>
          )}
        </View>

        {/* ===== Card 2: Counseling ===== */}
        {selectedCondition && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Counseling</Text>
            {loadingGuidance ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#1abc9c" />
              </View>
            ) : (
              <Text style={styles.cardDesc}>{counselingText}</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* ===== Save Button (Fixed) ===== */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          savingAssessment && styles.saveButtonDisabled,
        ]}
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
