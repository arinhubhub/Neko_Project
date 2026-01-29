import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import styles from "../styles/calendarStyles";

const WEEK_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function CalendarScreen() {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(today);

  /* ===== mock data (ผูกวันที่จริงได้ทันที) ===== */
  const dailyData = {
    "2026-01-17": {
      weight: "4.5 kg",
      mood: "Playful",
      photos: ["🐱", "🐈"],
    },
  };

  const formatKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;

  const daysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();

  const startDay = currentMonth.getDay();
  const totalDays = daysInMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  const changeMonth = (offset) => {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + offset,
        1
      )
    );
  };

  const renderCalendar = () => {
    const cells = [];

    for (let i = 0; i < startDay; i++) {
      cells.push(<View key={`e-${i}`} style={styles.dayCell} />);
    }

    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        d
      );

      const isToday = formatKey(date) === formatKey(today);
      const isSelected = formatKey(date) === formatKey(selectedDate);

      cells.push(
        <TouchableOpacity
          key={d}
          style={[
            styles.dayCell,
            isSelected && styles.selectedDay,
          ]}
          onPress={() => setSelectedDate(date)}
        >
          <Text
            style={[
              styles.dayText,
              isToday && styles.todayText,
              isSelected && styles.selectedText,
            ]}
          >
            {d}
          </Text>
        </TouchableOpacity>
      );
    }
    return cells;
  };

  const data = dailyData[formatKey(selectedDate)];

  return (
    <ScrollView style={styles.container}>
      {/* ===== Month Header ===== */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.monthText}>
          {currentMonth.toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </Text>

        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ===== Week Row ===== */}
      <View style={styles.weekRow}>
        {WEEK_DAYS.map((d) => (
          <Text key={d} style={styles.weekText}>
            {d}
          </Text>
        ))}
      </View>

      {/* ===== Calendar ===== */}
      <View style={styles.calendarGrid}>
        {renderCalendar()}
      </View>

      {/* ===== Info Card ===== */}
      <View style={styles.infoCard}>
        <Text style={styles.infoDate}>
          {selectedDate.toDateString()}
        </Text>

        {data ? (
          <>
            <View style={styles.infoRow}>
              <Text>WEIGHT</Text>
              <Text>{data.weight}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text>MOOD</Text>
              <Text>{data.mood}</Text>
            </View>

            <View style={styles.photoRow}>
              {data.photos.map((p, i) => (
                <View key={i} style={styles.photoBox}>
                  <Text style={{ fontSize: 26 }}>{p}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>
            There is no record for this date.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}
