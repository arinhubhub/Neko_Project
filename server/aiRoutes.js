import express from "express";
import { generateDiseaseAdvice } from "./aiService.js";

const router = express.Router();

/* ใช้งานจริง */
// Changed from /generate-advice to /guidance to match frontend
router.post("/guidance", async (req, res) => {
    try {
        // Frontend sends 'condition', we map it to 'disease' for the service
        // 'catProfile' is optional but enhances the advice
        const { condition, catId, catProfile } = req.body;

        if (!condition) {
            return res.status(400).json({ error: "condition is required" });
        }

        console.log(`Generating guidance for: ${condition} (Cat ID: ${catId})`);

        const content = await generateDiseaseAdvice(condition, catProfile);

        // Content is already JSON object { prevention, counseling }
        res.json(content);
    } catch (err) {
        console.error("Guidance Error:", err);
        res.status(500).json({ error: "AI generation failed" });
    }
});

/* Mock Assessment Endpoints (No Database Yet) */
router.get("/assessment/:catId", (req, res) => {
    console.log(`[MOCK] Fetch assessment for cat: ${req.params.catId}`);
    res.json({
        riskData: [
            { label: "Obesity", value: "High Risk", score: 80 },
            { label: "Dental", value: "Moderate Risk", score: 50 },
            { label: "Kidney", value: "Low Risk", score: 20 }
        ],
        conditions: ["Obesity", "Dental Disease", "Chronic Kidney Disease"],
        overallRisk: "Moderate Risk",
        summaryTitle: "สุขภาพโดยรวมอยู่ในเกณฑ์ปานกลาง",
        summaryDesc: "ควรเฝ้าระวังเรื่องน้ำหนักและสุขภาพช่องปากเป็นพิเศษ"
    });
});

router.post("/assessment/save", (req, res) => {
    console.log(`[MOCK] Save assessment:`, req.body);
    res.json({
        success: true,
        assessmentId: "mock-id-" + Date.now()
    });
});

/* ใช้ทดสอบ Gemini */
router.get("/test-gemini", async (req, res) => {
    try {
        const mockDisease = "นิ่วในทางเดินปัสสาวะแมว";
        const content = await generateDiseaseAdvice(mockDisease);

        res.json({
            success: true,
            source: "test",
            disease: mockDisease,
            content // Should be JSON object
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: "Gemini test failed"
        });
    }
});

export default router;