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
    print("Error: ไม่พบ GEMINI_API_KEY! กรุณาตรวจสอบไฟล์ .env ในโฟลเดอร์ Root")
else:
    print("พบ API Key แล้ว พร้อมทำงาน...")

app = Flask(__name__)
CORS(app) # อนุญาตให้ App เชื่อมต่อเข้ามาได้

# ตั้งค่า Gemini Client
try:
    client = genai.Client(api_key=api_key)
except Exception as e:
    print(f"Error initializing Gemini Client: {e}")

# --- Helper: Calculate Risk Label ---
def assign_risk_label(score):
    if score <= 10:
        return "Normal"
    elif score < 30:
        return "Low"
    elif score <= 50:
        return "Moderate"
    elif score <= 80:
        return "High"
    else:
        return "Extreme"

# --- ฟังก์ชันสร้าง Prompt สำหรับ Assessment ---
def build_assessment_prompt(cat_profile):
    return f"""
    คุณเป็นสัตวแพทย์ผู้เชี่ยวชาญ
    จงวิเคราะห์ความเสี่ยงสุขภาพของแมวตามข้อมูลนี้:
    พันธุ์: {cat_profile.get('breed')}
    อายุ: {cat_profile.get('age')} ปี
    น้ำหนัก: {cat_profile.get('weight')} กก.

    ให้ประเมินความเสี่ยงของ 5 โรคต่อไปนี้ เป็นคะแนน 0-100 (0=ไม่มีความเสี่ยง, 100=เสี่ยงสูงสุด):
    1. Kidney Disease
    2. Diabetes
    3. Urolithiasis
    4. Gum Disease
    5. Feline Panleukopenia

    และประเมินความเสี่ยงภาพรวม (overallRisk) สรุปผล (summaryTitle, summaryDesc)

    Format JSON Response เท่านั้น:
    {{
      "risks": [
        {{ "disease": "Kidney Disease", "score": 45 }},
        {{ "disease": "Diabetes", "score": 10 }},
        ... (ครบ 5 โรค)
      ],
      "overallRisk": "High Risk",
      "summaryTitle": "สรุปสั้นๆ",
      "summaryDesc": "คำอธิบายรายละเอียด 2-3 ประโยค"
    }}
    """

# --- API Endpoint: Assessment ---
@app.route('/api/assessment', methods=['POST'])
def get_assessment():
    try:
        data = request.json
        cat_id = data.get('catId')
        
        # Mock Profile (ใช้ชั่วคราว)
        mock_cat_profile = {
            "name": "เจ้าเหมียว",
            "breed": "Scottish Fold",
            "age": 4,
            "weight": 5.5
        }

        # 1. สร้าง Prompt
        prompt = build_assessment_prompt(mock_cat_profile)

        # 2. เรียก Gemini
        response = client.models.generate_content(
            model="gemini-3-flash-preview", 
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        # 3. Parse JSON
        ai_result = json.loads(response.text)
        
        # 4. Transform Data ให้ตรงกับ Frontend
        # Frontend expect: riskData = [{ label: "...", value: "...", score: ... }]
        
        frontend_risk_data = []
        # Mapping Display Label (ถ้าต้องการภาษาเดิมตาม Frontend)
        # แต่ Frontend ใช้ label ในการโชว์ชื่อโรคอยู่แล้วใน array
        # เราต้อง map outcome จาก AI ให้ตรงกับ DISEASE_OPTIONS ของ Frontend
        
        valid_diseases = {
            "Kidney Disease", "Diabetes", "Urolithiasis", 
            "Gum Disease", "Feline Panleukopenia"
        }
        
        for risk in ai_result.get("risks", []):
            d_name = risk.get("disease")
            if d_name in valid_diseases:
                score = risk.get("score", 0)
                level = assign_risk_label(score)
                frontend_risk_data.append({
                    "label": d_name,     # ใช้ชื่อภาษาอังกฤษเป็น key ในการ display (หรือจะแก้เป็นไทยก็ได้ถ้า frontend map ไว้)
                    "value": level,      # Normal, Low, ...
                    "score": score
                })

        # Ensure all diseases are present (fill missing with 0/No Data if AI failed)
        final_risk_data = []
        # เรียงลำดับตาม Frontend preference หรือไม่ก็ได้ แต่ควรครบ 5 ตัว
        # Frontend: Kidney, Diabetes, Urolithiasis, Gum, Panleukopenia
        target_order = [
            "Kidney Disease", "Diabetes", "Urolithiasis", 
            "Gum Disease", "Feline Panleukopenia"
        ]
        
        # Create map for easy lookup
        risk_map = {item["label"]: item for item in frontend_risk_data}
        
        for disease in target_order:
            if disease in risk_map:
                final_risk_data.append(risk_map[disease])
            else:
                final_risk_data.append({
                    "label": disease,
                    "value": "No Data",
                    "score": 0
                })

        return jsonify({
            "success": True,
            "riskData": final_risk_data,
            "overallRisk": ai_result.get("overallRisk", "Unknown"),
            "summaryTitle": ai_result.get("summaryTitle", "Analyzed"),
            "summaryDesc": ai_result.get("summaryDesc", "Health status analyzed successfully.")
        })

    except Exception as e:
        print(f"Error processing assessment: {e}")
        return jsonify({"error": str(e)}), 500

# --- ฟังก์ชันสร้าง Prompt (Guidance) ---
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

# --- API Endpoint: Guidance ---
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
    print("Server is running on port 3000...")
    app.run(host='0.0.0.0', port=3000, debug=True)