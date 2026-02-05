import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function AssessmentScreen({ onBack, onResult }) {
  return (
    <View style={styles.container}>

      {/* ปุ่มย้อนกลับ */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => onBack && onBack()}
      >
        <Text style={styles.backText}>‹</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Assessment</Text>

      <View style={styles.riskCircle}>
        <Text style={styles.riskText}>
          Moderate{'\n'}Risk
        </Text>
      </View>

      <TouchableOpacity
        style={styles.mainBtn}
        onPress={() => onResult && onResult()}
      >
        <Text style={styles.mainBtnText}>View Result</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backText: {
    fontSize: 30,
    fontWeight: 'bold',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  riskCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 14,
    borderColor: '#FFA96B',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },

  riskText: {
    color: '#FFA96B',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  mainBtn: {
    backgroundColor: '#4FB9AF',
    padding: 16,
    borderRadius: 14,
  },

  mainBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
