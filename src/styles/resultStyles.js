import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FBFA",
  },

  /* ===== Header ===== */
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  backArrow: {
    fontSize: 28,
    color: "#0C5A58",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0C5A58",
  },

  /* ===== Risk Circle ===== */
  circleWrapper: {
    alignItems: "center",
    marginTop: 20,
  },

  circleBase: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#EAF2F1",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  circleProgress: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 16,
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
  },

  riskText: {
    fontSize: 16,
    fontWeight: "600",
  },

  recommendText: {
    marginTop: 12,
    fontSize: 12,
  },

  subText: {
    fontSize: 10,
    color: "#9BAEAD",
  },

  /* ===== Summary ===== */
  summary: {
    paddingHorizontal: 20,
    marginTop: 24,
  },

  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0C5A58",
  },

  summaryDesc: {
    marginTop: 8,
    fontSize: 11,
    color: "#6C7A79",
    lineHeight: 16,
  },

  /* ===== Risk Breakdown ===== */
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 20,
    fontSize: 14,
    fontWeight: "600",
    color: "#0C5A58",
  },

  riskItem: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  riskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  riskLabel: {
    fontSize: 12,
    color: "#0C5A58",
  },

  riskValue: {
    fontSize: 12,
    color: "#0C5A58",
  },

  riskBarBg: {
    marginTop: 6,
    height: 8,
    backgroundColor: "#E1ECEB",
    borderRadius: 4,
  },

  riskBarFill: {
    width: "60%",
    height: 8,
    backgroundColor: "#6BD3C6",
    borderRadius: 4,
  },

  /* ===== Disease & Counseling ===== */
  centerWrapper: {
    alignItems: "center",
    marginTop: 16,
  },

  diseaseBox: {
    width: 343,
    minHeight: 204,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },

  counselingBox: {
    width: 343,
    minHeight: 204,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 3,
  },

  boxTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0C5A58",
  },

  dropdownHeader: {
    marginTop: 12,
    height: 40,
    borderWidth: 1,
    borderColor: "#D6E5E3",
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownText: {
    fontSize: 12,
    color: "#6C7A79",
  },

  dropdownList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E1ECEB",
    borderRadius: 10,
  },

  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E1ECEB",
  },

  dropdownItemText: {
    fontSize: 12,
    color: "#0C5A58",
  },

  counselingText: {
    marginTop: 12,
    fontSize: 11,
    color: "#6C7A79",
    lineHeight: 16,
  },

  /* ===== Save Button ===== */
  saveButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 52,
    backgroundColor: "#3FA8A4",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
