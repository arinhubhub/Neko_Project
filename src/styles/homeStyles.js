import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  /* ====== หน้า HOME ====== */
  container: {
    flex: 1,
    backgroundColor: "transparent", // ✅ Remove solid bg to see main texture
  },

  /* ====== HEADER ====== */
  headerBg: {
    height: 60,
    width: "100%",
    backgroundColor: "transparent", 
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  titleContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 5
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4A5568", // Dark Gray
    letterSpacing: 1,
  },

  iconGroup: {
    flexDirection: "row",
    gap: 15,
  },

  iconBtn: {
    padding: 5,
  },

  /* ====== HERO SECTION (Circle Cat) ====== */
  heroSection: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 20,
  },
  
  circleCatContainer: {
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: 'rgba(153, 213, 207, 0.4)', // Slightly transparent green
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
      position: 'relative',
  },
  
  circleCat: {
      width: 190,
      height: 190,
      borderRadius: 95,
      borderWidth: 4,
      borderColor: '#FFF',
  },

  loveIcon: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      backgroundColor: '#4AA99C',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#FFF',
  },

  heroTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000',
      textAlign: 'center',
      width: 250,
      lineHeight: 32,
  },

  lastCheckText: {
      fontSize: 12,
      color: '#A0AEC0',
      marginTop: 5,
  },

  /* ====== ACTION BUTTONS ====== */
  actionContainer: {
      paddingHorizontal: 20,
      alignItems: 'center',
  },

  assessButton: {
    width: '100%',
    height: 55,
    backgroundColor: "#64B5B0", // Teal color
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    // Remove shadow box effect
  },

  assessButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10,
  },

  /* ====== PHOTO CARD ====== */
  photoCard: {
    width: '100%',
    height: 90,
    backgroundColor: "rgba(178, 223, 219, 0.3)", // More transparent
    borderRadius: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  

  photoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D6A64",
    marginBottom: 5,
  },

  photoDesc: {
    fontSize: 11,
    color: "#565619",
  },
  
  photoBtn: {
    backgroundColor: "#00796B",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  
  photoBtnText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#FFF",
  },

  /* ====== LOG DAILY CARD (Image Background) ====== */
  dailyLogCard: {
      width: '90%',
      height: 140,
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 30, // Reduced from 100 to keep it closer to other elements
      alignSelf: 'center',
  },
  
  dailyLogBg: {
      width: '100%',
      height: '100%',
      justifyContent: 'center', 
      alignItems: 'center',    
      padding: 20,
  },
  
  dailyLogTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFF',
      textAlign: 'center', 
      textShadowColor: 'rgba(0,0,0,0.7)',
      textShadowOffset: {width: 0, height: 1},
      textShadowRadius: 5,
      marginBottom: 5,
  },
  
  dailyLogDesc: {
     fontSize: 14,
     color: '#F1F8E9',
     textAlign: 'center',
     textShadowColor: 'rgba(0,0,0,0.7)',
     textShadowOffset: {width: 0, height: 1},
     textShadowRadius: 5,
  }

});

export default styles;
