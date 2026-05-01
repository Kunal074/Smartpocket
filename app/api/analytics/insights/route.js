import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import Groq from 'groq-sdk';

// GET /api/analytics/insights?month=04&year=2026
const getHandler = async (request, user) => {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const lang = searchParams.get('lang') || 'en';
    const customStart = searchParams.get('startDate'); // YYYY-MM-DD
    const customEnd = searchParams.get('endDate');     // YYYY-MM-DD
    const isCustom = !!(customStart && customEnd);

    let startDate, endDate, periodLabel;
    if (isCustom) {
      startDate = customStart;
      endDate = customEnd;
      periodLabel = `${customStart} to ${customEnd}`;
    } else {
      if (!month || !year) {
        return NextResponse.json({ error: 'Month and year are required' }, { status: 400 });
      }
      startDate = `${year}-${month.padStart(2, '0')}-01`;
      endDate = new Date(year, parseInt(month), 0).toISOString().slice(0, 10);
      periodLabel = `${month}/${year}`;
    }

    // Fetch personal expenses
    const expensesRes = await query(
      `SELECT amount, category_id as category
       FROM expenses
       WHERE user_id = $1 AND date >= $2 AND date <= $3`,
      [user.id, startDate, endDate]
    );

    // Fetch user's share of group expenses
    const groupSharesRes = await query(
      `SELECT es.amount as amount, 'group_share' as category
       FROM expense_splits es
       JOIN group_expenses ge ON es.expense_id = ge.id
       WHERE es.user_id = $1 AND ge.date >= $2 AND ge.date <= $3 AND es.amount > 0`,
      [user.id, startDate, endDate]
    );

    const allData = [...expensesRes.rows, ...groupSharesRes.rows];

    if (allData.length === 0) {
      return NextResponse.json({ insights: "You don't have any expenses recorded for this month yet. Start logging to get AI-powered insights!" });
    }

    // Summarize data for the AI to keep tokens low
    const categoryTotals = {};
    let totalSpent = 0;
    for (const item of allData) {
      const amt = parseFloat(item.amount);
      totalSpent += amt;
      const cat = item.category || 'other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    }

    const summaryText = `Total Spent: ₹${totalSpent.toFixed(2)}\nCategories:\n` +
      Object.entries(categoryTotals).map(([c, amt]) => `- ${c}: ₹${amt.toFixed(2)}`).join('\n');

    const langInstruction = 
      lang === 'hi'
        ? 'IMPORTANT: Respond ONLY in Hindi (Devanagari script). Do not use English at all.'
        : lang === 'hinglish'
        ? 'IMPORTANT: Respond in Hinglish (a fun mix of Hindi and English spoken by Indian youth, e.g., "Bhai, tune food pe bohot zyada kharcha kar diya!"). Be casual and friendly.'
        : 'Respond in clear, simple English.';

    const prompt = `
You are an expert personal finance assistant inside the "SmartPocket" app.
${langInstruction}
Analyze the following spending summary for an Indian user (period: ${periodLabel}) and provide 3-4 bullet points of highly personalized, actionable advice.
Keep it concise and practical. Use emojis. Do not use markdown headers, just bullet points.

User's Spending Data (${periodLabel}):
${summaryText}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a concise financial advisor.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.6,
      max_tokens: 300,
    });

    const insights = chatCompletion.choices[0]?.message?.content || "Keep up the good work managing your finances!";

    return NextResponse.json({ insights }, { status: 200 });

  } catch (error) {
    console.error('Insights Error:', error);
    return NextResponse.json({ error: 'Failed to generate insights', details: error.message }, { status: 500 });
  }
};

export const GET = withAuth(getHandler);
