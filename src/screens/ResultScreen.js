import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import styles from "../styles/resultStyles";

export default function ResultScreen({ onBack, onSave }) {
  const [selectedDisease, setSelectedDisease] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  /* ===== Mock risk (รองรับ backend ในอนาคต) ===== */
  const riskLevel = "moderate"; // low | moderate | high

  const riskConfig = {
    low: {
      text: "Low Risk",
      color: "#6BD3C6",
      rotate: "45deg",
      desc: "Stable condition",
    },
    moderate: {
      text: "Moderate Risk",
      color: "#FFA86E",
      rotate: "135deg",
      desc: "Closer monitoring recommended",
    },
    high: {
      text: "High Risk",
      color: "#FF6B6B",
      rotate: "225deg",
      desc: "Veterinary consultation advised",
    },
  };

  const currentRisk = riskConfig[riskLevel];

  const diseases = [
    "Chronic Kidney Disease (CKD)",
    "FLUTD / Urolithiasis",
    "Diabetes Mellitus",
    "Feline Panleukopenia",
    "Gum Disease",
  ];

  const riskBreakdown = [
    { label: "Kidney Disease", value: "Low Risk" },
    { label: "Diabetes", value: "No Risk" },
    { label: "Urolithiasis", value: "Low Risk" },
    { label: "Gum Disease", value: "Low Risk" },
    { label: "Feline Panleukopenia", value: "Low Risk" },
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

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        {/* ===== Risk Circle (Pure View) ===== */}
        <View style={styles.circleWrapper}>
          <View style={styles.circleBase}>
            <View
              style={[
                styles.circleProgress,
                {
                  borderColor: currentRisk.color,
                  transform: [{ rotate: currentRisk.rotate }],
                },
              ]}
            />
            <Text style={[styles.riskText, { color: currentRisk.color }]}>
              {currentRisk.text}
            </Text>
          </View>

          <Text style={[styles.recommendText, { color: currentRisk.color }]}>
            {currentRisk.desc}
          </Text>
          <Text style={styles.subText}>Overall Health Risk</Text>
        </View>

        {/* ===== Summary ===== */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>
            {currentRisk.text} detected
          </Text>
          <Text style={styles.summaryDesc}>
            Health indicators show changes that require monitoring, but no
            immediate emergency is detected at this time.
          </Text>
        </View>

        {/* ===== Risk Breakdown ===== */}
        <Text style={styles.sectionTitle}>Risk Breakdown</Text>

        {riskBreakdown.map((item, index) => (
          <View key={index} style={styles.riskItem}>
            <View style={styles.riskRow}>
              <Text style={styles.riskLabel}>{item.label}</Text>
              <Text style={styles.riskValue}>{item.value}</Text>
            </View>

            <View style={styles.riskBarBg}>
              {item.value !== "No Risk" && (
                <View style={styles.riskBarFill} />
              )}
            </View>
          </View>
        ))}

        {/* ===== Disease & Counseling ===== */}
        <View style={styles.centerWrapper}>
          {/* Disease Box */}
          <View style={styles.diseaseBox}>
            <Text style={styles.boxTitle}>Disease</Text>

            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Text style={styles.dropdownText}>
                {selectedDisease || "Select disease"}
              </Text>
              <Text>⌄</Text>
            </TouchableOpacity>

            {showDropdown && (
              <View style={styles.dropdownList}>
                {diseases.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedDisease(item);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Counseling Box */}
          <View style={styles.counselingBox}>
            <Text style={styles.boxTitle}>Counseling</Text>
            <Text style={styles.counselingText}>
              {selectedDisease
                ? `Care guidance and monitoring advice for ${selectedDisease} will be shown here once connected to the backend.`
                : "Please select a disease to view counseling guidance."}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ===== Save Button ===== */}
      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <Text style={styles.saveButtonText}>Save Assessment</Text>
      </TouchableOpacity>
    </View>
  );
}
