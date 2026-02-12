/**
 * Cat Health Scoring Logic (Revised for Grams/ML and Slider Levels)
 */

export const getHealthStatus = (score) => {
  if (score >= 80) return { label: "Excellent", color: "#6FCF97", text: "Excellent health condition" };
  if (score >= 60) return { label: "Good", color: "#2D9CDB", text: "Generally good health" };
  if (score >= 40) return { label: "Fair", color: "#F2C94C", text: "Requires close monitoring" };
  return { label: "Attention", color: "#EB5757", text: "Consult a veterinarian" };
};

export const analyzeHealthLog = (log) => {
  // 1. ถ้าไม่มี log เลย ให้ส่งค่าว่างหรือ 0
  if (!log) return { score: 0, redFlags: 0, alerts: [], status: getHealthStatus(0) };

  let score = 100;
  let alerts = [];
  let redFlags = 0;

  // ==========================================
  // 1. Food Intake (อาหาร)
  // ==========================================
  // Logic: ถ้ากินเยอะ (110g) คือดี, ถ้ากินน้อยมาก (<10g) หรือเป็น 0 ถึงจะหัก
  const foodAmount = parseFloat(log.food_intake) || 0;
  const hasFoodType = !!log.food_type_enum; // เช็คว่ามีการระบุประเภทอาหารไหม

  if (foodAmount === 0 && !hasFoodType) {
      // ไม่กินเลย และไม่ระบุประเภท = หักหนัก
      score -= 20;
      redFlags++;
      alerts.push("ไม่กินอาหาร");
  } else if (foodAmount > 0 && foodAmount < 15) {
      // กินน้อยมากๆ (น้อยกว่า 15g/ml) ถือว่าเบื่ออาหาร
      score -= 10;
      alerts.push("กินน้อยกว่าปกติ");
  } 
  // กรณีใส่ 110g จะไม่เข้าเงื่อนไขลบคะแนน (Score เต็ม)

  // ==========================================
  // 2. Water Intake (น้ำ)
  // ==========================================
  // Logic: แมวบางตัวกินอาหารเปียก อาจกินน้ำน้อยได้ จึงหักคะแนนแค่กรณี 0 เลย
  const waterAmount = parseFloat(log.water_intake) || 0;
  
  if (waterAmount === 0 && log.food_type_enum === 'dry') {
      // กินอาหารเม็ดแต่ไม่กินน้ำเลย = อันตราย
      score -= 10;
      alerts.push("ไม่ดื่มน้ำ (เสี่ยงโรคไต)");
  }
  // กรณีใส่ 60ml คือปกติ ไม่หักคะแนน

  // ==========================================
  // 3. Urine (ปัสสาวะ) - Mapping from Slider 1-5
  // ==========================================
  // Levels: very_low(1), low(2), normal(3), high(4), very_high(5)
  
  // เช็คสี (สำคัญมาก)
  if (['red', 'pink', 'bloody'].includes(log.urine_color_enum)) {
      score -= 30;
      redFlags++;
      alerts.push("ปัสสาวะมีเลือดปน");
  } else if (['dark_yellow', 'brown'].includes(log.urine_color_enum)) {
      score -= 10;
      alerts.push("ปัสสาวะสีเข้ม (ขาดน้ำ)");
  }

  // เช็คปริมาณ
  if (log.urine_level_enum === 'very_low') { 
      // เยี่ยวไม่ออก/น้อยมาก (อันตรายสุดๆ ในแมวตัวผู้)
      score -= 25;
      redFlags++;
      alerts.push("ปัสสาวะไม่ออก/น้อยผิดปกติ");
  } else if (log.urine_level_enum === 'very_high') {
       score -= 5; // เยี่ยวเยอะไปอาจเป็นเบาหวาน/ไต แต่ไม่ฉุกเฉินเท่าไม่ออก
  }

  // ==========================================
  // 4. Stool (อุจจาระ) - Mapping from Slider 1-5
  // ==========================================
  // Levels: very_low(Constipation), normal, very_high(Diarrhea)
  
  if (['black', 'bloody', 'red', 'mucus'].includes(log.stool_color_enum)) {
      score -= 20;
      redFlags++;
      alerts.push("สีอุจจาระผิดปกติ");
  }

  if (log.stool_level_enum === 'very_low') { 
      score -= 10;
      alerts.push("ท้องผูก (ถ่ายน้อย/แข็ง)");
  } else if (log.stool_level_enum === 'very_high') {
      score -= 10;
      alerts.push("ท้องเสีย (ถ่ายเหลว/บ่อย)");
  }

  // ==========================================
  // 5. Vomit (อาเจียน)
  // ==========================================
  
  if (log.vomit_level_enum === 'high' || log.vomit_level_enum === 'very_high') {
      score -= 20;
      redFlags++;
      alerts.push("อาเจียนบ่อย");
  } else if (log.vomit_level_enum === 'low') {
      // อาเจียนนิดหน่อย/ครั้งเดียว
      score -= 5; 
  }

  if (['bloody', 'red', 'coffee_ground'].includes(log.vomit_color_enum)) {
      score -= 30;
      redFlags++;
      alerts.push("อาเจียนมีเลือด/สีอันตราย");
  }

  // ==========================================
  // 6. Behavior (พฤติกรรม)
  // ==========================================
  if (['lethargic', 'hiding', 'hunched'].includes(log.behavior_enum)) {
      score -= 15;
      alerts.push("ซึม/หลบซ่อน");
  } else if (['aggressive', 'painful_vocal'].includes(log.behavior_enum)) {
      score -= 15;
      alerts.push("ดุร้าย/ร้องเจ็บปวด");
  }

  // Clamp score ให้อยู่ระหว่าง 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    redFlags,
    alerts,
    status: getHealthStatus(score)
  };
};