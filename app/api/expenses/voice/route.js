import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import Groq from 'groq-sdk';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/expenses/voice
export const POST = withAuth(async (request, user) => {
  let tmpFilePath = null;
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Write audio to a temp file so Groq SDK can upload it
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    tmpFilePath = join(tmpdir(), `voice_${Date.now()}.m4a`);
    await writeFile(tmpFilePath, audioBuffer);

    // Step 1: Transcribe using Groq's Whisper model
    const { createReadStream } = await import('fs');
    const transcription = await groq.audio.transcriptions.create({
      file: createReadStream(tmpFilePath),
      model: 'whisper-large-v3-turbo',
      response_format: 'json',
      language: 'en',
    });

    const transcript = transcription.text?.trim();
    console.log('Voice transcript:', transcript);

    if (!transcript) {
      return NextResponse.json({ error: 'Could not understand audio. Please speak clearly.' }, { status: 400 });
    }

    // Step 2: Parse with Groq Llama-3 to extract structured JSON
    const prompt = `
You are an expense extraction AI. A user said this to log an expense:
"${transcript}"

Extract the following and return ONLY a raw JSON object (no markdown, no explanation):
1. "amount": The numeric amount spent (e.g. 300). If not found, return null.
2. "category": Exactly one of: "food", "transport", "shopping", "bills", "entertainment", "other".
3. "note": A concise 2-5 word description (e.g. "Coffee at Starbucks", "Uber to office").
4. "date": If a date is mentioned (like "yesterday", "today"), return YYYY-MM-DD format for today's date (${new Date().toISOString().slice(0, 10)}). Otherwise return null.

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
      return NextResponse.json({ ...expenseData, transcript }, { status: 200 });
    } catch {
      console.error('Groq JSON parse error. Raw:', jsonString);
      return NextResponse.json({ error: 'AI failed to format data correctly.' }, { status: 500 });
    }

  } catch (error) {
    console.error('Voice API Error:', error);
    return NextResponse.json({ error: 'Internal server error during voice processing' }, { status: 500 });
  } finally {
    // Cleanup temp file
    if (tmpFilePath) {
      unlink(tmpFilePath).catch(() => {});
    }
  }
});
