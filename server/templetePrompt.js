export function buildDiseasePrompt(diseaseName, catProfile = {}) {
  const {
    name = "แมว",
    breed = "ไม่ระบุสายพันธุ์",
    age = "ไม่ระบุ",
    weight = "ไม่ระบุ",
    gender = "ไม่ระบุ",
    isNeutered = "ไม่ระบุ",
    activity = "ไม่ระบุ"
  } = catProfile;

  return `
You are a veterinary health assistant for a cat health application.
Your task is to provide personalized health advice for a cat named "${name}" who is diagnosed with or suspected of: "${diseaseName}".

CAT PROFILE:
- Name: ${name}
- Breed: ${breed}
- Age: ${age}
- Weight: ${weight} kg
- Gender: ${gender} (${isNeutered})
- Activity Level: ${activity}

RESPONSE FORMAT:
You must return a valid JSON object strictly following this structure. Do not include markdown formatting (like \`\`\`json).

{
  "prevention": {
    "title": "วิธีป้องกัน${diseaseName} ฉบับคนรักแมว",
    "intro": "A short introduction (1-2 sentences) tailored to this specific cat (mention name/breed/age if relevant) on how to prevent this.",
    "points": [
      {
        "title": "Topic Header (e.g., Hydration)",
        "desc": "Explanation 1-2 sentences.",
        "tip": "Optional tip (e.g., Use a fountain). Return empty string if no tip."
      },
      {
        "title": "Topic Header",
        "desc": "Explanation...",
        "tip": ""
      },
      {
         "title": "Topic Header",
         "desc": "Explanation...",
         "tip": ""
      }
    ]
  },
  "counseling": {
    "title": "สัญญาณเตือนที่ต้องเฝ้าระวัง (Red Flags)",
    "intro": "If you see these signs in ${name}, go to the vet immediately.",
    "red_flags": [
      {
        "symptom": "Symptom Name (e.g., Straining to pee)",
        "meaning": "What it means (e.g., Blockage)"
      },
      {
        "symptom": "Symptom Name",
        "meaning": "What it means"
      },
       {
        "symptom": "Symptom Name",
        "meaning": "What it means"
      }
    ]
  }
}

Tone: Friendly, caring, professional.
Language: Thai (ภาษาไทย).
Ensure advice is specific to the cat's age/weight if relevant (e.g., obesity advice for overweight cats).
`;
}