import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/expenses/text
export const POST = withAuth(async (request, user) => {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const prompt = `
You are an expense extraction AI for an Indian finance app. 
A user or a payment app (GPay/PhonePe) shared this text:
"${text}"

Extract the following and return ONLY a raw JSON object (no markdown, no explanation):
1. "amount": The numeric amount spent (e.g. 10). If not found, return null.
2. "category": Exactly one of: "food", "transport", "shopping", "bills", "entertainment", "other". (e.g. "chai" = food, "auto" = transport)
3. "note": A concise 2-5 word description of what was bought or the payee.
4. "date": If a date is mentioned, return YYYY-MM-DD format for today's date (${new Date().toISOString().slice(0, 10)}). Otherwise return null.

JSON only, no backticks, no extra text.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
    });

    let jsonString = chatCompletion.choices[0]?.message?.content || '';
    jsonString = jsonString.replace(/```json/gi, '').replace(/```/g, '').trim();

    try {
      const expenseData = JSON.parse(jsonString);
      return NextResponse.json(expenseData, { status: 200 });
    } catch {
      console.error('Groq JSON parse error. Raw:', jsonString);
      return NextResponse.json({ error: 'AI failed to format data correctly.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Text API Error:', error);
    return NextResponse.json({ error: 'Internal server error during text processing' }, { status: 500 });
  }
});
