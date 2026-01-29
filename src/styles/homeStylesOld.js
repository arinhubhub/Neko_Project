import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  /* ====== หน้า HOME ====== */
  container: {
    flex: 1,
    backgroundColor: "#B2E1DB", // พื้นหลังหน้า HOME
  },

  /* ====== HEADER ====== */
  headerBg: {
    height: 77,
    width: "100%",
    backgroundColor: "rgba(225, 246, 243, 0.45)", // B0DDD7 45%
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#677684", // Nekocare
  },

  iconGroup: {
    flexDirection: "row",
    gap: 12,
  },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ====== PROFILE SECTION ====== */
  profileSection: {
    alignItems: "center",
    marginTop: 20,
  },

  profileOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#329A61",
    justifyContent: "center",
    alignItems: "center",
  },

  profileInner: {
    width: 171.43,
    height: 171.43,
    borderRadius: 85.715,
    resizeMode: "cover",
  },
  

  /* ====== TEXT SECTION ====== */
  textSection: {
    alignItems: "center",
    marginTop: 24,
    paddingHorizontal: 24,
  },

  welcomeTitle: {
    fontFamily: "Inter-Bold",
    fontSize: 26,
    color: "#000000",
    textAlign: "center",
  },

  welcomeDesc: {
    marginTop: 8,
    fontFamily: "Inter-Light",
    fontSize: 14,
    color: "#000000",
    textAlign: "center",
    lineHeight: 20,
  },

  statusText: {
    marginTop: 8,
    fontFamily: "Inter-Medium",
    fontSize: 12,
    color: "#B4B4B4",
  },

  /* ====== ASSESS BUTTON ====== */
  assessButton: {
    width: 360,
    height: 52,
    marginTop: 32,
    alignSelf: "center",
    backgroundColor: "rgba(63,168,164,0.8)", // 3FA8A4 80%
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },

  assessButtonText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 18,
    color: "#FFFFFF",
  },
  /* ====== PHOTO CARD ====== *//* ===== Photo Health Check Card ===== */
photoCard: {
  width: 368,
  height: 83,
  marginTop: 24,
  alignSelf: "center",
  backgroundColor: "rgba(154,208,206,0.7)", // 9AD0CE 70%
  borderRadius: 20,
  paddingHorizontal: 16,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",

  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 4,
  elevation: 3,
},

photoLeft: {
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
},

photoIcon: {
  fontSize: 28,
  marginRight: 10,
},

photoTextGroup: {
  flexShrink: 1,
},

photoTitle: {
  fontFamily: "Inter-SemiBold",
  fontSize: 14,
  color: "rgba(12,90,88,0.93)", // 0C5A58 93%
},

photoDesc: {
  marginTop: 4,
  fontFamily: "Inter-Regular",
  fontSize: 10,
  color: "#565619",
},

photoBtn: {
  width: 101,
  height: 38,
  backgroundColor: "#0C5A58",
  borderRadius: 12,
  justifyContent: "center",
  alignItems: "center",
},

photoBtnText: {
  fontFamily: "Inter-Bold",
  fontSize: 10,
  color: "#FFFFFF",
},
/* ===== HORIZONTAL INFO CARDS ===== */
infoScroll: {
  marginTop: 24,
},

infoCard: {
  width: 353, // ปรับให้เหมาะกับจอ แต่ layout เหมือน Figma
  height: 186,
  backgroundColor: "#FFFFFF",
  borderRadius: 20,
  marginLeft: 16,
  marginRight: 8,
  overflow: "hidden",

  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 4,
  elevation: 3,
},

infoImage: {
  width: "100%",
  height: "100%",
  resizeMode: "cover",
},

infoOverlay: {
  position: "absolute",
  bottom: 0,
  width: "100%",
  padding: 12,
  backgroundColor: "rgba(0,0,0,0.35)",
},

infoTitle: {
  fontFamily: "Inter-SemiBold",
  fontSize: 14,
  color: "#FFFFFF",
},



});

export default styles;
