from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, date

# =====================================================
# 1. SETUP & CONFIGURATION
# =====================================================

# Load Environment Variables from Root
current_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(current_dir, '..', '.env')
load_dotenv(dotenv_path)

# Retrieve Keys
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("REACT_APP_SUPABASE_URL")
SUPABASE_KEY = os.getenv("REACT_APP_ANON_KEY")

# Validate Keys
if not GEMINI_API_KEY:
    print("❌ Error: Missing GEMINI_API_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing SUPABASE credentials")

# Initialize App
app = Flask(__name__)
CORS(app)

# Initialize Clients
try:
    client = genai.Client(api_key=GEMINI_API_KEY)
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Gemini & Supabase initialized successfully")
except Exception as e:
    print(f"❌ Error initializing services: {e}")


# =====================================================
# 2. HELPER FUNCTIONS
# =====================================================

def calculate_age(birthdate_str):
    """คำนวณอายุจากวันเกิด (อ้างอิงจากหน้า CatProfile)"""
    if not birthdate_str:
        return "ไม่ระบุ"
    try:
        birthdate = datetime.strptime(birthdate_str, "%Y-%m-%d").date()
        today = date.today()
        years = today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))
        return f"{years} ปี"
    except:
        return "ไม่ระบุ"

def assign_risk_label(score):
    """แปลงคะแนน 0-100 เป็นระดับความเสี่ยง"""
    if score <= 10: return "Normal"
    elif score < 30: return "Low"
    elif score <= 50: return "Moderate"
    elif score <= 80: return "High"
    else: return "Extreme"

def format_log_data(logs):
    """
    แปลงข้อมูล Log จาก LogDailyNormal.js เป็นข้อความสรุป
    ดึง field สำคัญ: food_type, water_level, urine_color, behavior ฯลฯ
    """
    if not logs:
        return "ไม่พบข้อมูลบันทึกสุขภาพย้อนหลังในช่วง 7 วันนี้"
    
    summary = ""
    for log in logs:
        date_str = log.get('log_date', '-')
        
        # แปลงข้อมูล Enum ให้เป็นข้อความที่อ่านง่าย
        status = "ผิดปกติ (Something off)" if log.get('status') == 'Something off' else "ปกติ"
        food = f"{log.get('food_type_enum', 'N/A')} ({log.get('food_intake', 0)}g)"
        water = f"{log.get('water_level', 0)} ml"
        
        # ข้อมูลขับถ่ายและพฤติกรรม (สำคัญมากสำหรับการวิเคราะห์โรค)
        urine = f"ระดับ: {log.get('urine_level_enum')}, สี: {log.get('urine_color_enum')}"
        stool = f"ระดับ: {log.get('stool_level_enum')}, สี: {log.get('stool_color_enum')}"
        behavior = log.get('behavior_enum', 'Normal')
        note = log.get('notes', '-')
        
        summary += f"- วันที่ {date_str}: อาการ={status}, อาหาร={food}, น้ำ={water}, ปัสสาวะ=[{urine}], อุจจาระ=[{stool}], พฤติกรรม={behavior}, โน้ต={note}\n"
    
    return summary

# =====================================================
# 3. PROMPT BUILDERS
# =====================================================

def build_assessment_prompt(cat_data, logs_summary):
    # ดึงข้อมูลจากตาราง cats (จากหน้า CatProfile)
    name = cat_data.get('name', 'แมว')
    breed = cat_data.get('breed', 'ไม่ระบุ')
    gender = cat_data.get('gender', 'ไม่ระบุ')
    age = calculate_age(cat_data.get('birthdate'))
    
    # หาน้ำหนักล่าสุดจากตาราง cat_weights
    weight = "ไม่ระบุ"
    if cat_data.get('cat_weights') and len(cat_data['cat_weights']) > 0:
        # สมมติว่า query ถูก sort มาแล้ว หรือเลือก index 0
        weight = f"{cat_data['cat_weights'][0].get('weight_kg')} กก."

    return f"""
    คุณเป็นสัตวแพทย์ผู้เชี่ยวชาญ AI (NekoCare Doctor)
    
    จงวิเคราะห์ความเสี่ยงสุขภาพของแมวรายนี้ โดยอ้างอิงจาก "ข้อมูลส่วนตัว" และ "บันทึกประจำวัน" ที่ให้มา:

    [ข้อมูลส่วนตัว (จากหน้า Profile)]
    - ชื่อ: {name}
    - พันธุ์: {breed}
    - เพศ: {gender}
    - อายุ: {age}
    - น้ำหนักปัจจุบัน: {weight}

    [บันทึกสุขภาพย้อนหลัง 7 วันล่าสุด (จากหน้า Daily Log)]
    {logs_summary}

    [ภารกิจ]
    วิเคราะห์ความสัมพันธ์ของ ข้อมูลกายภาพ (พันธุ์, น้ำหนัก, อายุ) และ อาการใน Log เพื่อประเมินความเสี่ยงของ 5 โรคต่อไปนี้ (ให้คะแนน 0-100):
    
    1. **Kidney Disease (โรคไต):** พิจารณาจาก อายุ, ปริมาณการกินน้ำ (ถ้ากินน้ำน้อยเสี่ยงสูง), ปริมาณปัสสาวะ
    2. **Diabetes (เบาหวาน):** พิจารณาจาก น้ำหนักตัว, พฤติกรรมการกินอาหาร, การปัสสาวะบ่อย
    3. **Urolithiasis (โรคนิ่ว):** พิจารณาจาก **สีปัสสาวะ** (bloody/dark_orange), พฤติกรรม (straining/painful), การกินน้ำ
    4. **Gum Disease (โรคเหงือก):** พิจารณาจาก ประเภทอาหาร (เปียก/แห้ง), อายุ, อาการกินลำบาก
    5. **Feline Panleukopenia (หัดแมว):** พิจารณาจาก อาการอาเจียน (vomit), ถ่ายเหลว/เป็นเลือด, ซึม (behavior)

    [รูปแบบการตอบกลับ (JSON เท่านั้น)]
    {{
      "risks": [
        {{ "disease": "Kidney Disease", "score": 45 }},
        {{ "disease": "Diabetes", "score": 10 }},
        ... (ทำให้ครบ 5 โรค)
      ],
      "overallRisk": "Moderate Risk",
      "summaryTitle": "หัวข้อสรุปผลการวิเคราะห์ (ภาษาไทย สั้นๆ กระชับ)",
      "summaryDesc": "คำอธิบายผลลัพธ์แบบเจาะจง อ้างอิงข้อมูลจาก Log ที่พบ เช่น 'เนื่องจากน้อง {name} ดื่มน้ำน้อยเพียง ...ml และมีสีปัสสาวะเข้ม...' (ภาษาไทย ความยาว 2-3 ประโยค)"
    }}
    """

def build_disease_prompt(disease_name, cat_data):
    name = cat_data.get("name", "น้องแมว")
    breed = cat_data.get("breed", "ไม่ระบุ")
    
    return f"""
    คุณเป็นผู้ช่วยสัตวแพทย์อัจฉริยะ
    
    ภารกิจ: ให้คำแนะนำสุขภาพเฉพาะตัวสำหรับแมวชื่อ "{name}" (พันธุ์ {breed})
    ที่กำลังมีความเสี่ยงหรือเป็น: "{disease_name}"

    ตอบกลับเป็น JSON Format เท่านั้น:
    {{
      "prevention": {{
        "title": "5 วิธีป้องกัน{disease_name}ฉบับคนรักแมว",
        "intro": "เกริ่นนำสั้นๆ ให้อุ่นใจ เหมาะกับ{name}",
        "points": [
          {{ "title": "หัวข้อ", "desc": "คำอธิบาย" }}
        ]
      }},
      "counseling": {{
        "title": "สัญญาณเตือนที่ต้องเฝ้าระวัง (Red Flags)",
        "intro": "หากพบอาการเหล่านี้ ให้พา{name}ไปหาหมอทันที",
        "red_flags": [
          {{ "symptom": "ชื่ออาการ", "meaning": "อาการนี้บ่งบอกอะไร" }}
        ]
      }}
    }}
    ใช้ภาษาไทยที่เข้าใจง่าย อบอุ่น และเป็นมืออาชีพ
    """

# =====================================================
# 4. API ENDPOINTS
# =====================================================

@app.route('/api/assessment', methods=['POST'])
def get_assessment():
    try:
        data = request.json
        cat_id = data.get('catId')

        if not cat_id:
            return jsonify({"error": "catId is required"}), 400

        # --- 1. Fetch Real Data from Supabase ---
        
        # 1.1 Cat Info + Latest Weight
        # ดึงข้อมูลจากตาราง cats และ join กับ cat_weights เพื่อเอาน้ำหนักล่าสุด
        cat_response = supabase.table('cats').select(
            '*, cat_weights(weight_kg, measured_at)'
        ).eq('id', cat_id).order('measured_at', desc=True, foreign_table='cat_weights').limit(1, foreign_table='cat_weights').execute()

        if not cat_response.data:
            return jsonify({"error": "Cat not found"}), 404
        
        cat_data = cat_response.data[0]

        # 1.2 Daily Logs (Last 7 days)
        # ดึงข้อมูลจากตาราง daily_logs เพื่อดูประวัติการกิน ขับถ่าย
        logs_response = supabase.table('daily_logs').select('*')\
            .eq('cat_id', cat_id)\
            .order('log_date', desc=True)\
            .limit(7)\
            .execute()
        
        # แปลงข้อมูล Log เป็น Text ให้ AI อ่าน
        logs_text = format_log_data(logs_response.data)

        # --- 2. Generate Content with Gemini ---
        prompt = build_assessment_prompt(cat_data, logs_text)
        
        response = client.models.generate_content(
            model="gemini-1.5-flash", # ใช้ model ที่เร็วและเสถียร
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )

        # --- 3. Process Response ---
        ai_result = json.loads(response.text)
        
        # Transform data to match Frontend Format
        frontend_risk_data = []
        target_order = ["Kidney Disease", "Diabetes", "Urolithiasis", "Gum Disease", "Feline Panleukopenia"]
        
        # Map AI result to Dict for easy lookup
        ai_risks_map = {item['disease']: item.get('score', 0) for item in ai_result.get("risks", [])}

        for disease in target_order:
            score = ai_risks_map.get(disease, 0)
            
            # ถ้าไม่มี log ข้อมูล AI อาจจะให้ 0 หรือประเมินจากพันธุ์
            # ใช้ Logic การแสดงผลตาม Score
            frontend_risk_data.append({
                "label": disease,
                "value": assign_risk_label(score),
                "score": score
            })

        return jsonify({
            "success": True,
            "riskData": frontend_risk_data,
            "overallRisk": ai_result.get("overallRisk", "Unknown"),
            "summaryTitle": ai_result.get("summaryTitle", "Assessment Complete"),
            "summaryDesc": ai_result.get("summaryDesc", "Based on analysis.")
        })

    except Exception as e:
        print(f"❌ Error in assessment: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/api/guidance', methods=['POST'])
def get_guidance():
    try:
        data = request.json
        condition = data.get('condition')
        cat_id = data.get('catId')
        
        # Fetch cat info for personalized guidance name (Optional but recommended)
        cat_data = {}
        if cat_id:
            try:
                res = supabase.table('cats').select('name, breed').eq('id', cat_id).single().execute()
                cat_data = res.data or {}
            except:
                pass 

        # Mapping Disease Name
        disease_map = {
            "Urolithiasis": "โรคนิ่ว",
            "Kidney Disease": "โรคไต",
            "Gum Disease": "โรคตับและฟัน",
            "Feline Panleukopenia": "โรคหัดแมว",
            "Diabetes": "โรคเบาหวาน"
        }
        thai_disease_name = disease_map.get(condition, condition)

        # สร้าง Prompt ขอคำแนะนำ
        prompt = build_disease_prompt(thai_disease_name, cat_data)

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )

        return jsonify(json.loads(response.text))

    except Exception as e:
        print(f"❌ Error in guidance: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Server is running on port 3000...")
    app.run(host='0.0.0.0', port=3000, debug=True)