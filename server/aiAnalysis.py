from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
import os
import json
from dotenv import load_dotenv

# --- แก้ไขจุดที่ 1: โหลด .env จากโฟลเดอร์ Root ---
# หา path ของไฟล์ปัจจุบัน แล้วถอยกลับไป 1 ขั้น (..) เพื่อหา .env
current_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(current_dir, '..', '.env')
load_dotenv(dotenv_path)

# ตรวจสอบว่าเจอ API Key หรือไม่
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ Error: ไม่พบ GEMINI_API_KEY! กรุณาตรวจสอบไฟล์ .env ในโฟลเดอร์ Root")
else:
    print("✅ พบ API Key แล้ว พร้อมทำงาน...")

app = Flask(__name__)
CORS(app) # อนุญาตให้ App เชื่อมต่อเข้ามาได้

# ตั้งค่า Gemini Client
try:
    client = genai.Client(api_key=api_key)
except Exception as e:
    print(f"❌ Error initializing Gemini Client: {e}")

# --- ฟังก์ชันสร้าง Prompt ---
def build_disease_prompt(disease_name, cat_profile):
    name = cat_profile.get("name", "น้องแมว")
    breed = cat_profile.get("breed", "ไม่ระบุสายพันธุ์")
    age = cat_profile.get("age", "ไม่ระบุ")
    weight = cat_profile.get("weight", "ไม่ระบุ")
    
    return f"""
    คุณเป็นผู้ช่วยสัตวแพทย์อัจฉริยะสำหรับแอปพลิเคชันดูแลแมว
    
    ภารกิจ: ให้คำแนะนำสุขภาพเฉพาะตัวสำหรับแมวชื่อ "{name}" (พันธุ์ {breed}, อายุ {age} ปี, น้ำหนัก {weight} กก.)
    ที่กำลังมีความเสี่ยงหรือเป็น: "{disease_name}"

    ตอบกลับเป็น JSON Format เท่านั้น โดยมีโครงสร้างดังนี้:
    {{
      "prevention": {{
        "title": "5 วิธีป้องกัน{disease_name}ฉบับคนรักแมว",
        "intro": "เกริ่นนำสั้นๆ ให้อุ่นใจ เหมาะกับ{name}",
        "points": [
          {{ "title": "หัวข้อ (เช่น การดื่มน้ำ)", "desc": "คำอธิบายสิ่งที่ต้องทำ 1-2 ประโยค" }}
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

# --- API Endpoint ---
@app.route('/api/guidance', methods=['POST'])
def get_guidance():
    try:
        data = request.json
        condition = data.get('condition')
        cat_id = data.get('catId')
        
        # Mock Data (ใช้แทน Database ชั่วคราว)
        mock_cat_profile = {
            "name": "เจ้าเหมียว",
            "breed": "Scottish Fold",
            "age": 4,
            "weight": 5.5
        }

        # Mapping ชื่อโรค
        disease_map = {
            "Urolithiasis": "โรคนิ่ว",
            "Kidney Disease": "โรคไต",
            "Gum Disease": "โรคตับและฟัน",
            "Feline Panleukopenia": "โรคหัดแมว",
            "Diabetes": "โรคเบาหวาน"
        }
        thai_disease_name = disease_map.get(condition, condition)

        # 1. สร้าง Prompt
        prompt = build_disease_prompt(thai_disease_name, mock_cat_profile)

        # 2. เรียก Gemini
        # หมายเหตุ: เช็ค model ว่า account คุณรองรับตัวไหน (gemini-2.0-flash หรือ gemini-1.5-flash)
        response = client.models.generate_content(
            model="gemini-3-flash-preview", 
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        # 3. ส่ง JSON กลับ
        result_json = json.loads(response.text)
        return jsonify(result_json)

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # รัน Server
    print("🚀 Server is running on port 3000...")
    app.run(host='0.0.0.0', port=3000, debug=True)