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
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const riskData = [
    { label: "Kidney Disease", value: "Low Risk" },
    { label: "Diabetes", value: "No Risk" },
    { label: "Urolithiasis", value: "Low Risk" },
    { label: "Gum Disease", value: "Low Risk" },
    { label: "Feline Panleukopenia", value: "Low Risk" },
  ];

  const diseases = [
  "Chronic Kidney Disease (CKD)",
  "FLUTD / Urolithiasis",
  "Diabetes Mellitus",
  "Feline Panleukopenia",
  "Gum Disease",
];


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
      {/* ===== Disease & Counseling ===== */}
<View style={{ gap: 16 }}>
<View style={styles.centerWrapper}>
  {/* ===== Disease Box ===== */}
  <View
    style={{
      width: 343,
      minHeight: 204,
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      padding: 16,
    }}
  >
    <Text style={styles.cardTitle}>Disease</Text>

    {/* Dropdown Header */}
    <TouchableOpacity
      onPress={() => setShowDropdown(!showDropdown)}
      style={{
        marginTop: 12,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#DADADA",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text style={{ color: selectedDisease ? "#000" : "#9CA3AF" }}>
        {selectedDisease || "Select disease"}
      </Text>
      <Text>⌄</Text>
    </TouchableOpacity>

    {/* Dropdown List */}
    {showDropdown && (
      <View
        style={{
          marginTop: 8,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          overflow: "hidden",
        }}
      >
        {diseases.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => {
              setSelectedDisease(item);
              setShowDropdown(false);
            }}
            style={{
              padding: 14,
              backgroundColor:
                selectedDisease === item ? "#E6F4F1" : "#FFFFFF",
            }}
          >
            <Text>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>


  {/* ===== Counseling Box ===== */}
  <View
    style={{
      width: 343,
      minHeight: 204,
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      padding: 16,
      marginTop: 20 
    }}
  >
    <Text style={styles.cardTitle}>Counseling</Text>

    <Text style={styles.cardDesc}>
      {selectedDisease
        ? `Guidance and preventive care advice for ${selectedDisease} will appear here.`
        : "Please select a disease to receive counseling guidance."}
    </Text>
  </View>
</View>
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
