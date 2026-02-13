from flask import Flask, request, jsonify
from flask_cors import CORS
from google import genai
from google.genai import types
import os
import json
from dotenv import load_dotenv

from pathlib import Path

# โหลดค่า API Key
# Load .env from parent directory
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
CORS(app) # อนุญาตให้ App เชื่อมต่อเข้ามาได้

# ตั้งค่า Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# --- ฟังก์ชันสร้าง Prompt (ปรับปรุงให้รองรับ 5 โรค) ---
def build_disease_prompt(disease_name, cat_profile):
    name = cat_profile.get("name", "น้องแมว")
    breed = cat_profile.get("breed", "ไม่ระบุสายพันธุ์")
    age = cat_profile.get("age", "ไม่ระบุ")
    weight = cat_profile.get("weight", "ไม่ระบุ")
    
    # Prompt สั่ง AI
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

# --- API Endpoint สำหรับ Frontend เรียกใช้ ---
@app.route('/api/guidance', methods=['POST'])
def get_guidance():
    try:
        data = request.json
        condition = data.get('condition') # รับชื่อโรค (English Value)
        cat_id = data.get('catId')       # รับ ID แมว (เพื่อไปดึงข้อมูลจริงใน DB)
        
        # TODO: ตรงนี้คุณควรใช้ cat_id ไป query ข้อมูลแมวจาก Database จริง
        # ตอนนี้ใช้ Mock Profile ไปก่อน
        mock_cat_profile = {
            "name": "เจ้าเหมียว",
            "breed": "Scottish Fold",
            "age": 4,
            "weight": 5.5
        }

        # แปลง Value ภาษาอังกฤษ เป็นชื่อไทยสำหรับส่งให้ AI (Optional)
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
        response = client.models.generate_content(
            model="gemini-3-flash-preview", # เปลี่ยนเป็น 1.5-flash ชั่วคราวเนื่องจาก 2.0 อาจจะเต็ม Quota
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        # 3. ส่ง JSON กลับไปที่ Frontend
        result_json = json.loads(response.text)
        return jsonify(result_json)

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # รัน Server ที่ Port 3000
    app.run(host='0.0.0.0', port=3000, debug=True)