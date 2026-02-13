import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import BottomNav from "../components/BottomNav";
import supabase from "./config/supabaseClient";

const { width } = Dimensions.get("window");

const DAYS_OF_WEEK = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CalendarScreen({ onNavigate, session }) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1)); // Start at Jan 2026 as per design
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 0, 17)); // Default selection
  const [dailyLog, setDailyLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [catId, setCatId] = useState(null);

  // Fetch Cat ID first
  useEffect(() => {
    const fetchCat = async () => {
      if (!session?.user?.id) return;
      const { data, error } = await supabase
        .from('cats')
        .select('id')
        .eq('owner_id', session.user.id)
        .limit(1)
        .single();
      
      if (data) setCatId(data.id);
    };
    fetchCat();
  }, [session]);

  // Fetch Log on date change
  useEffect(() => {
    const fetchLog = async () => {
      if (!catId || !selectedDate) return;
      
      setLoading(true);
      const dateString = selectedDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('cat_id', catId)
        .eq('log_date', dateString)
        .single();
      
      setDailyLog(data || null);
      setLoading(false);
    };
    fetchLog();
  }, [selectedDate, catId]);

  // Helper to change month
  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Helper to get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper to get first day of week
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const isSelected = selectedDate.getDate() === d &&
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;

      days.push(
        <TouchableOpacity
          key={`day-${d}`}
          style={[styles.dayCell, isSelected && styles.selectedDay]}
          onPress={() => setSelectedDate(date)}
        >
          <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{d}</Text>
          {/* Green dash removed as requested */}
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      {/* Calendar Card */}
      <View style={styles.calendarCard}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => changeMonth(-1)}>
            <Feather name="chevron-left" size={24} color="#147C78" />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => changeMonth(1)}>
            <Feather name="chevron-right" size={24} color="#147C78" />
          </TouchableOpacity>
        </View>

        {/* Days Header */}
        <View style={styles.weekHeader}>
          {DAYS_OF_WEEK.map((day, index) => (
            <Text key={index} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {renderCalendar()}
        </View>
      </View>

      {/* Details Section */}
      <ScrollView 
        style={styles.detailsContainer}
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Date Header */}
        <View style={styles.detailsHeader}>
          <Text style={styles.dateTitle}>
            {DAYS_OF_WEEK[selectedDate.getDay()]}, {MONTHS[selectedDate.getMonth()].substring(0, 3)} {selectedDate.getDate()}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#147C78" style={{ marginTop: 20 }} />
        ) : dailyLog ? (
          <View style={styles.textLogContainer}>
             <View style={styles.textLogRow}>
                <MaterialCommunityIcons name="food-apple" size={18} color="#147C78" />
                <Text style={styles.textLogLabel}>Food Intake: </Text>
                <Text style={styles.textLogValue}>{dailyLog.food_intake || '-'} g</Text>
             </View>

             <View style={styles.textLogRow}>
                <MaterialCommunityIcons name="water" size={18} color="#147C78" />
                <Text style={styles.textLogLabel}>Water Intake: </Text>
                <Text style={styles.textLogValue}>{dailyLog.water_level || '-'} ml</Text>
             </View>

             <View style={styles.textLogRow}>
                <MaterialCommunityIcons name="water-percent" size={18} color="#147C78" />
                <Text style={styles.textLogLabel}>Urine: </Text>
                <Text style={styles.textLogValue}>
                   {dailyLog.urine_level_enum?.replace(/_/g, ' ') || '-'}
                   {dailyLog.urine_color_enum ? ` (${dailyLog.urine_color_enum.replace(/_/g, ' ')})` : ''}
                </Text>
             </View>

             <View style={styles.textLogRow}>
                <MaterialCommunityIcons name="poop" size={18} color="#147C78" />
                <Text style={styles.textLogLabel}>Stool: </Text>
                <Text style={styles.textLogValue}>
                   {dailyLog.stool_level_enum?.replace(/_/g, ' ') || '-'}
                   {dailyLog.stool_color_enum ? ` (${dailyLog.stool_color_enum.replace(/_/g, ' ')})` : ''}
                </Text>
             </View>

             {(dailyLog.vomit_level_enum || dailyLog.vomit_color_enum) && (
                <View style={styles.textLogRow}>
                   <MaterialCommunityIcons name="alert-circle" size={18} color="#D32F2F" />
                   <Text style={[styles.textLogLabel, {color: '#D32F2F'}]}>Vomit: </Text>
                   <Text style={styles.textLogValue}>
                      {dailyLog.vomit_level_enum?.replace(/_/g, ' ') || '-'}
                      {dailyLog.vomit_color_enum ? ` (${dailyLog.vomit_color_enum.replace(/_/g, ' ')})` : ''}
                   </Text>
                </View>
             )}

             {dailyLog.behavior_enum && (
                <View style={styles.textLogRow}>
                   <MaterialCommunityIcons name="cat" size={18} color="#147C78" />
                   <Text style={styles.textLogLabel}>Behavior: </Text>
                   <Text style={styles.textLogValue}>{dailyLog.behavior_enum.replace(/_/g, ' ')}</Text>
                </View>
             )}

             {dailyLog.notes && (
                <View style={[styles.textLogRow, {alignItems: 'flex-start'}]}>
                   <MaterialCommunityIcons name="note-text" size={18} color="#147C78" />
                   <Text style={styles.textLogLabel}>Notes: </Text>
                   <Text style={[styles.textLogValue, {flex: 1}]}>{dailyLog.notes}</Text>
                </View>
             )}
          </View>
        ) : (
          <Text style={styles.noRecordText}>There is no record for this day.</Text>
        )}

        <Text style={styles.photosLabel}>Photos</Text>
        <TouchableOpacity style={styles.photoPlaceholder}>
          <Ionicons name="camera" size={32} color="#147C78" />
        </TouchableOpacity>

        {/* Backdated Edit Button */}
        <TouchableOpacity style={styles.editButton} onPress={() => onNavigate('LogDaily')}>
          <Feather name="plus-circle" size={18} color="#147C78" style={{ marginRight: 8 }} />
          <Text style={styles.editButtonText}>Add Log Today</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav current="Calendar" onNavigate={onNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#B2E1DB", // Teal background
    alignItems: "center",
  },
  calendarCard: {
    marginTop: 60,
    width: width * 0.9,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    paddingBottom: 24,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: "#8A2BE2", // Purple border from mockup
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 20,
    fontFamily: "Poppins-SemiBold", // Assuming font exists
    color: "#147C78",
    fontWeight: "600",
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weekDayText: {
    width: (width * 0.9 - 32) / 7,
    textAlign: "center",
    fontSize: 10,
    color: "#147C78",
    fontWeight: "600",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: (width * 0.9 - 32) / 7,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dayText: {
    fontSize: 14,
    color: "#147C78",
    fontFamily: "Poppins-Regular",
  },
  selectedDay: {
    borderBottomWidth: 2,
    borderColor: "#1FB3A8",
  },
  selectedDayText: {
    color: "#147C78",
    fontWeight: "bold",
  },
  indicator: {
    width: 6,
    height: 2,
    backgroundColor: "#1FB3A8",
    marginTop: 2,
  },

  // Details Section
  detailsContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#B2E1DB",
    marginTop: -20,
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  detailsHeader: {
    marginBottom: 16, // Increased
  },
  dateTitle: {
    fontSize: 24, // Larger
    color: "#147C78",
    fontWeight: "bold",
  },
  noRecordText: {
    fontSize: 14,
    color: "#8FA3A0",
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row",
    marginBottom: 30, // Increased
    justifyContent: 'flex-start', // Keep start but with specific margins
  },
  statItem: {
    marginRight: 60, // Increased spacing
  },
  statLabel: {
    fontSize: 14, // Larger
    color: "#147C78",
    fontWeight: "bold",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24, // Much larger
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  divider: {
    width: 2,
    height: "100%",
    backgroundColor: "#147C78",
    marginRight: 60, // Match statItem
    opacity: 0.3,
  },
  // Text-based Log Display
  textLogContainer: {
    backgroundColor: "rgba(255,255,255,0.4)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  textLogRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  textLogLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#147C78',
    marginLeft: 8,
  },
  textLogValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // Photos
  photosLabel: {
    fontSize: 16, // Larger
    color: "#147C78",
    fontWeight: "bold",
    marginBottom: 12,
  },
  photoPlaceholder: {
    width: "100%", // Full width
    height: 140, // Taller
    backgroundColor: "#9ACBC7",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2, // Thicker border
    borderColor: "#88BDB9",
    borderStyle: "dashed",
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: "rgba(255,255,255,0.4)", // Slightly more opaque
    paddingVertical: 16,
    width: "100%", // Full width
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: "auto",
    marginBottom: 110,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold", // Bolder
    fontSize: 18, // Larger
  },
});