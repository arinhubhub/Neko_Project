import { StyleSheet } from "react-native";

export default StyleSheet.create({
  /* ===== Container ===== */
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

  circleBg: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#F0F3F5",
    justifyContent: "center",
    alignItems: "center",
  },

  circleProgress: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 16,
    borderColor: "#FFA86E",
    borderLeftColor: "transparent",
    borderBottomColor: "transparent",
    transform: [{ rotate: "45deg" }],
  },

  riskText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF8A3D",
  },

  recommendText: {
    marginTop: 12,
    fontSize: 12,
    color: "#FF8A3D",
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

  /* ===== Section Title ===== */
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 20,
    fontSize: 14,
    fontWeight: "600",
    color: "#0C5A58",
  },

  /* ===== Risk Breakdown ===== */
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

  /* ================================================= */
  /* ===== NEW : Disease Dropdown Box ===== */
  centerWrapper: {
  alignItems: "center",   // 👈 จัดกลางแนวนอน
  marginTop: 8,
},
  diseaseBox: {
    width: 343,
    minHeight: 204,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginTop: 12,
    alignSelf: "center",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
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
    overflow: "hidden",
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

  /* ===== NEW : Counseling Box ===== */
  counselingBox: {
    width: 343,
    minHeight: 204,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    alignSelf: "center",

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
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
