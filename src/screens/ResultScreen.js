import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import styles from "../styles/resultStyles";

// ===== Risk Helper =====
const getRiskMeta = (score = 0) => {
  if (score <= 20)
    return { label: "Healthy", color: "#6FCF97", text: "No significant risk" };
  if (score <= 40)
    return { label: "Low Risk", color: "#F2C94C", text: "Minor changes" };
  if (score <= 60)
    return {
      label: "Moderate Risk",
      color: "#F2994A",
      text: "Closer monitoring recommended",
    };
  if (score <= 80)
    return {
      label: "High Risk",
      color: "#EB5757",
      text: "Vet consultation advised",
    };
  return {
    label: "Critical",
    color: "#D32F2F",
    text: "Immediate attention",
  };
};

export default function ResultScreen({ onBack, onSave }) {
  const [selectedCondition, setSelectedCondition] = useState(null);

  const riskData = [
    { label: "Kidney Disease", score: 0 },
    { label: "Diabetes", score: 0 },
    { label: "Urolithiasis", score: 0 },
    { label: "Gum Disease", score: 0 },
    { label: "Feline Panleukopenia", score: 0 },
  ];

  // ===== Overall Score =====
  const overallScore =
    riskData.length > 0
      ? Math.round(
          riskData.reduce((sum, r) => sum + (r.score || 0), 0) / riskData.length
        )
      : 0;

  const overallMeta = getRiskMeta(overallScore);

  const conditions = ["Vomiting", "Diarrhea", "Lethargy"];

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

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
     {/* ===== Risk Circle ===== */}
<View style={styles.circleWrapper}>
  <View style={styles.circleBg}>
    <View
      style={[
        styles.circleProgress,
        {
          borderColor: overallMeta.color,
          transform: [{ rotate: `${(overallScore / 100) * 360}deg` }],
        },
      ]}
    />
    <Text style={[styles.riskText, { color: overallMeta.color }]}>
      {overallMeta.label}
    </Text>
  </View>

  <Text style={[styles.recommendText, { color: overallMeta.color }]}>
    {overallMeta.text}
  </Text>
  <Text style={styles.subText}>Overall Health Risk ({overallScore}%)</Text>
</View>


        {/* ===== Summary ===== */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>
            Moderate health risk detected
          </Text>
          <Text style={styles.summaryDesc}>
            Some changes were observed, but no serious health risks are detected
            at this time.
          </Text>
        </View>

        {/* ===== Risk Breakdown ===== */}
<Text style={styles.sectionTitle}>Risk Breakdown</Text>

{riskData.map((item, index) => {
  const meta = getRiskMeta(item.score || 0);

  return (
    <View key={index} style={styles.riskItem}>
      <View style={styles.riskRow}>
        <Text style={styles.riskLabel}>{item.label}</Text>
        <Text style={[styles.riskValue, { color: meta.color }]}>
          {item.score}% · {meta.label}
        </Text>
      </View>

      <View style={styles.riskBarBg}>
        <View
          style={[
            styles.riskBarFill,
            {
              width: `${item.score || 0}%`,
              backgroundColor: meta.color,
            },
          ]}
        />
      </View>
    </View>
  );
})}



        {/* ===== Recommended Approach ===== */}
        <Text style={styles.sectionTitle}>Recommended Approach</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Disease Prevention</Text>

          {/* ===== Selectable Condition ===== */}
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

          <Text style={styles.cardDesc}>
            {selectedCondition
              ? `Guidance for ${selectedCondition.toLowerCase()} will be shown here.`
              : "Please select a condition to see preventive advice."}
          </Text>
        </View>
      </ScrollView>
{/* ===== Save Button ===== */}
<TouchableOpacity
  style={styles.saveButton}
  onPress={() => onSave && onSave()}
>
  <Text style={styles.saveButtonText}>Save Assessment</Text>
</TouchableOpacity>
    </View>
  );
}
