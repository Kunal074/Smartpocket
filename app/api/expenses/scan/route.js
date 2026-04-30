import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/expenses/scan
export const POST = withAuth(async (request, user) => {
  try {
    const body = await request.json();
    const { base64Image } = body;

    if (!base64Image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Step 1: Extract raw text using OCR.space
    const ocrFormData = new FormData();
    ocrFormData.append('apikey', process.env.OCR_SPACE_API_KEY || 'helloworld');
    ocrFormData.append('language', 'eng');
    ocrFormData.append('isOverlayRequired', 'false');
    ocrFormData.append('base64Image', base64Image); // e.g. "data:image/jpeg;base64,/9j/4AAQSkZJRg..."

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: ocrFormData,
    });
    
    const ocrResult = await ocrResponse.json();
    
    if (ocrResult.IsErroredOnProcessing) {
      console.error('OCR Error:', ocrResult.ErrorMessage);
      return NextResponse.json({ error: 'Failed to extract text from image.' }, { status: 500 });
    }

    const parsedText = ocrResult.ParsedResults?.[0]?.ParsedText || '';
    
    if (!parsedText.trim()) {
      return NextResponse.json({ error: 'Could not find any readable text on this receipt.' }, { status: 400 });
    }

    // Step 2: Use Groq (Llama-3) to parse the raw text into structured JSON
    const prompt = `
You are an expert expense parsing AI. I will give you the raw text extracted from a receipt or bill.
Your job is to extract the following information and return ONLY a valid JSON object. Do not include any markdown formatting like \`\`\`json. Just the raw JSON string.

Extract:
1. "amount": The total final amount paid (number only, no currency symbols). Look for keywords like "Total", "Net", "Grand Total".
2. "date": The date of the receipt in YYYY-MM-DD format. If no date is found, return null.
3. "category": Categorize the expense into EXACTLY ONE of these categories: "food", "transport", "shopping", "bills", "entertainment", or "other".
4. "note": A very short 2-4 word description of what the bill was for (e.g. "Starbucks Coffee", "Uber Ride", "Grocery Run").

Raw Receipt Text:
"""
${parsedText}
"""
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.1,
    });

    const llmResponse = chatCompletion.choices[0]?.message?.content || '';
    
    // Clean up response in case Groq returns markdown code blocks
    let jsonString = llmResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    try {
      const expenseData = JSON.parse(jsonString);
      return NextResponse.json(expenseData, { status: 200 });
    } catch (parseError) {
      console.error('Groq JSON Parse Error. Raw response:', llmResponse);
      return NextResponse.json({ error: 'AI failed to format data correctly.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Scan API Error:', error);
    return NextResponse.json({ error: 'Internal server error during scanning' }, { status: 500 });
  }
});
