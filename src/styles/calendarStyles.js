import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FBFA",
  },

  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },

  monthText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0C5A58",
  },

  arrow: {
    fontSize: 22,
    color: "#0C5A58",
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },

  weekText: {
    width: 40,
    textAlign: "center",
    fontSize: 11,
    color: "#6C7A79",
  },

  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
  },

  dayCell: {
    width: "14.28%",
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  dayText: {
    fontSize: 12,
    color: "#0C5A58",
  },

  todayText: {
    fontWeight: "700",
    color: "#2FBF9E",
  },

  selectedDay: {
    backgroundColor: "#DFF3EF",
    borderRadius: 22,
  },

  selectedText: {
    fontWeight: "700",
  },

  infoCard: {
    margin: 20,
    padding: 16,
    backgroundColor: "#BFE2DE",
    borderRadius: 16,
  },

  infoDate: {
    fontWeight: "600",
    marginBottom: 10,
    color: "#0C5A58",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  photoRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  photoBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#EAF5F3",
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    marginTop: 8,
    color: "#6C7A79",
  },
});
