from google import genai
from google.genai import types
import os
import json
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# --- 1. ส่วนฟังก์ชันสร้าง Prompt (Template) ---
def build_disease_prompt(disease_name, cat_profile=None):
    if cat_profile is None:
        cat_profile = {}

    name = cat_profile.get("name", "แมว")
    breed = cat_profile.get("breed", "ไม่ระบุสายพันธุ์")
    age = cat_profile.get("age", "ไม่ระบุ")
    weight = cat_profile.get("weight", "ไม่ระบุ")
    gender = cat_profile.get("gender", "ไม่ระบุ")
    is_neutered = cat_profile.get("isNeutered", "ไม่ระบุ")
    activity = cat_profile.get("activity", "ไม่ระบุ")

    # สังเกต: ใน f-string ถ้าจะพิมปีกกา json ต้องเบิ้ลเป็น {{ }} ส่วนตัวแปรใช้ { } เดียว
    return f"""
    You are a veterinary health assistant for a cat health application.
    Your task is to provide personalized health advice for a cat named "{name}" who is diagnosed with or suspected of: "{disease_name}".

    CAT PROFILE:
    - Name: {name}
    - Breed: {breed}
    - Age: {age}
    - Weight: {weight} kg
    - Gender: {gender} ({is_neutered})
    - Activity Level: {activity}

    RESPONSE FORMAT:
    You must return a valid JSON object strictly following this structure. Do not include markdown formatting (like ```json).

    {{
      "prevention": {{
        "title": "วิธีป้องกัน{disease_name} ฉบับคนรักแมว",
        "intro": "A short introduction tailored to {name}.",
        "points": [
          {{
            "title": "Topic Header",
            "desc": "Explanation 1-2 sentences.",
            "tip": "Optional tip."
          }}
        ]
      }},
      "counseling": {{
        "title": "สัญญาณเตือนที่ต้องเฝ้าระวัง",
        "intro": "If you see these signs in {name}, go to the vet immediately.",
        "red_flags": [
          {{
            "symptom": "Symptom Name",
            "meaning": "What it means"
          }}
        ]
      }}
    }}

    Tone: Friendly, caring, professional.
    Language: Thai (ภาษาไทย).
    """

# --- 2. ข้อมูลจำลอง (Mock Data) จาก User ---
my_cat = {
    "name": "ถุงทอง",
    "breed": "Scottish Fold",
    "age": 5,
    "weight": 7.0, # อ้วน
    "gender": "ผู้",
    "isNeutered": "ทำหมันแล้ว",
    "activity": "นอนทั้งวัน"
}
disease = "โรคอ้วน (Obesity)"

# --- 3. เรียกใช้งาน ---
try:
    # สร้างข้อความ Prompt
    prompt_text = build_disease_prompt(disease, my_cat)

    # ส่งไปหา Gemini
    # หมายเหตุ: model "gemini-3-flash" ยังไม่มีนะครับ ตอนนี้ใหม่สุดคือ "gemini-2.0-flash" 
    # หรือ "gemini-1.5-flash" ผมแก้เป็น 2.0 ให้ก่อนครับ
    response = client.models.generate_content(
        model="gemini-3-flash-preview", 
        contents=prompt_text,
        config=types.GenerateContentConfig(
            response_mime_type="application/json" # สั่งให้ตอบเป็น JSON เท่านั้น
        )
    )

    # --- 4. แปลงผลลัพธ์เป็น Dictionary (JSON Object) ---
    # ใน SDK ใหม่ ข้อมูลจะอยู่ใน response.text
    result_data = json.loads(response.text)

    # --- 5. แสดงผล (หรือส่งกลับไปที่ App) ---
    print("=== ผลวิเคราะห์ ===")
    print(f"เรื่อง: {result_data['prevention']['title']}")
    print(f"คำแนะนำ: {result_data['prevention']['intro']}")
    
    print("\n=== วิธีป้องกัน ===")
    for point in result_data['prevention']['points']:
        print(f"• {point['title']}: {point['desc']}")

except Exception as e:
    print(f"เกิดข้อผิดพลาด: {e}")

    #gemini-3-flash-preview