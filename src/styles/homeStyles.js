import { StyleSheet } from "react-native";

export default StyleSheet.create({
  /* ===== Screen ===== */
  container: {
    flex: 1,
    backgroundColor: "#B2E1DB",
  },

  /* ===== Header ===== */
  headerBg: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#B2E1DB",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#194d4a",
    letterSpacing: 1,
  },

  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E3F4F2",
  },

  iconGroup: {
    flexDirection: "row",
    gap: 8,
  },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E3F4F2",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ===== Profile Section ===== */
  profileSection: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: "center",
  },

  profileOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },

  profileInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8F6F4", // placeholder
  },

  /* ===== Text Section ===== */
  textSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },

  welcomeDesc: {
    fontSize: 15,
    color: "#444",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },

  statusText: {
    fontSize: 13,
    color: "#888",
  },

  /* ===== Assess Button ===== */
  assessButton: {
    width: "85%",
    alignSelf: "center",
    backgroundColor: "#147C78",
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    marginBottom: 20,
  },

  assessButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  /* ===== Photo Health Card ===== */
  photoCard: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  photoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  photoIcon: {
    fontSize: 28,
    marginRight: 12,
  },

  photoTextGroup: {
    flexShrink: 1,
  },

  photoTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },

  photoDesc: {
    fontSize: 12,
    color: "#666",
  },

  photoBtn: {
    backgroundColor: "#E3F4F2",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  photoBtnText: {
    fontSize: 12,
    color: "#147C78",
    fontWeight: "600",
  },

  /* ===== Getting Started ===== */
  gettingStartedSection: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },

  gettingStartedTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#147C78",
    marginRight: 10,
  },

  checkDone: {
    backgroundColor: "#147C78",
    alignItems: "center",
    justifyContent: "center",
  },

  checkIcon: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  statusItemText: {
    fontSize: 13,
    color: "#333",
  },

  /* ===== Smart Monitoring ===== */
  smartCard: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 140, // ⭐ กัน BottomNav
  },

  smartTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },

  smartDesc: {
    fontSize: 12,
    color: "#666",
  },

  setupBtn: {
    backgroundColor: "#147C78",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 12,
  },

  setupBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
