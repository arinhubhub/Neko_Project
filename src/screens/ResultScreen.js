import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import styles from "../styles/resultStyles";

export default function ResultScreen({ onBack, onSave }) {
  const [selectedCondition, setSelectedCondition] = useState(null);

  const riskData = [
    { label: "Kidney Disease", value: "Low Risk" },
    { label: "Diabetes", value: "No Risk" },
    { label: "Urolithiasis", value: "Low Risk" },
    { label: "Gum Disease", value: "Low Risk" },
    { label: "Feline Panleukopenia", value: "Low Risk" },
  ];

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
            <View style={styles.circleProgress} />
            <Text style={styles.riskText}>Moderate Risk</Text>
          </View>
          <Text style={styles.recommendText}>
            Closer monitoring recommended
          </Text>
          <Text style={styles.subText}>Overall Health Risk</Text>
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

{[
  { label: "Kidney Disease", value: "Low Risk" },
  { label: "Diabetes", value: "No Risk" },
  { label: "Urolithiasis", value: "Low Risk" },
  { label: "Gum Disease", value: "Low Risk" },
  { label: "Feline Panleukopenia", value: "Low Risk" },
].map((item, index) => (
  <View key={index} style={styles.riskItem}>
    <View style={styles.riskRow}>
      <Text style={styles.riskLabel}>{item.label}</Text>
      <Text style={styles.riskValue}>{item.value}</Text>
    </View>

    {/* หลอดพื้นหลัง (ยังอยู่ทุกกรณี) */}
    <View style={styles.riskBarBg}>
      {/* เติมสี เฉพาะกรณีที่ไม่ใช่ No Risk */}
      {item.value !== "No Risk" && (
        <View style={styles.riskBarFill} />
      )}
    </View>
  </View>
))}

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
