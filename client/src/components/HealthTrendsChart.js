import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Circle, Path, Text as SvgText, G } from 'react-native-svg';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 80; // 20px padding on each side + margins
const CHART_HEIGHT = 180;
const PADDING = 30;

export default function HealthTrendsChart({ data }) {
  if (!data || data.labels.length === 0) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>ไม่มีข้อมูล</Text>
      </View>
    );
  }

  const { labels, foodData, waterData } = data;

  // Calculate scales
  const maxFood = Math.max(...foodData, 1);
  const maxWater = Math.max(...waterData, 1);
  const maxValue = Math.max(maxFood, maxWater);
  
  const chartWidth = CHART_WIDTH - PADDING * 2;
  const chartHeight = CHART_HEIGHT - PADDING * 2;
  
  const xStep = chartWidth / (labels.length - 1 || 1);
  
  // Create path strings for smooth curves
  const createSmoothPath = (dataPoints) => {
    if (dataPoints.length === 0) return '';
    
    let path = '';
    const points = dataPoints.map((value, index) => ({
      x: PADDING + index * xStep,
      y: PADDING + chartHeight - (value / maxValue) * chartHeight
    }));
    
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y}`;
    }
    
    path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlPointX = (current.x + next.x) / 2;
      
      path += ` Q ${controlPointX} ${current.y}, ${controlPointX} ${(current.y + next.y) / 2}`;
      path += ` Q ${controlPointX} ${next.y}, ${next.x} ${next.y}`;
    }
    
    return path;
  };

  const foodPath = createSmoothPath(foodData);
  const waterPath = createSmoothPath(waterData);

  return (
    <View style={styles.container}>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => {
          const y = PADDING + (chartHeight / 4) * i;
          return (
            <Line
              key={`grid-${i}`}
              x1={PADDING}
              y1={y}
              x2={CHART_WIDTH - PADDING}
              y2={y}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Food line (Purple) */}
        <Path
          d={foodPath}
          stroke="rgba(134, 65, 244, 1)"
          strokeWidth="2"
          fill="none"
        />

        {/* Water line (Cyan) */}
        <Path
          d={waterPath}
          stroke="rgba(31, 179, 168, 1)"
          strokeWidth="2"
          fill="none"
        />

        {/* Data points for Food */}
        {foodData.map((value, index) => {
          const x = PADDING + index * xStep;
          const y = PADDING + chartHeight - (value / maxValue) * chartHeight;
          return (
            <Circle
              key={`food-dot-${index}`}
              cx={x}
              cy={y}
              r="4"
              fill="rgba(134, 65, 244, 1)"
              stroke="#2D4A47"
              strokeWidth="2"
            />
          );
        })}

        {/* Data points for Water */}
        {waterData.map((value, index) => {
          const x = PADDING + index * xStep;
          const y = PADDING + chartHeight - (value / maxValue) * chartHeight;
          return (
            <Circle
              key={`water-dot-${index}`}
              cx={x}
              cy={y}
              r="4"
              fill="rgba(31, 179, 168, 1)"
              stroke="#2D4A47"
              strokeWidth="2"
            />
          );
        })}

        {/* X-axis labels */}
        {labels.map((label, index) => {
          const x = PADDING + index * xStep;
          return (
            <SvgText
              key={`label-${index}`}
              x={x}
              y={CHART_HEIGHT - 5}
              fontSize="10"
              fill="rgba(255, 255, 255, 0.7)"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
});
