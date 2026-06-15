export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { base64Data, mimeType } = req.body;
    
    if (!base64Data || !mimeType) {
        return res.status(400).json({ error: 'Thiếu dữ liệu ảnh' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Chưa cấu hình API Key trên máy chủ' });
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Chỉ trả về ĐÚNG MỘT TỪ HOẶC CỤM TỪ duy nhất thuộc danh sách sau, không giải thích gì thêm: 'Thực vật', 'Động vật', 'Vi sinh vật', 'Khoáng chất', 'Khác'. Nếu không chắc chắn, trả về 'Khác'. Dựa vào cấu trúc quan sát được trong ảnh này để phân loại." },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Data
                            }
                        }
                    ]
                }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        let result = data.candidates[0].content.parts[0].text.trim().toLowerCase();
        
        let finalCategory = "Khác";
        if (result.includes("thực vật")) finalCategory = "Thực vật";
        else if (result.includes("động vật")) finalCategory = "Động vật";
        else if (result.includes("vi sinh vật")) finalCategory = "Vi sinh vật";
        else if (result.includes("khoáng chất")) finalCategory = "Khoáng chất";

        return res.status(200).json({ category: finalCategory });

    } catch (error) {
        console.error("Gemini API Error:", error);
        return res.status(500).json({ error: 'Lỗi phân tích AI' });
    }
}
