import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const scanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // Higher limit for live scanning (~12 requests/min at 5s intervals)
  message: { error: 'Too many scan requests. Please try again in a minute.' },
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/scan', scanLimiter, async (req, res) => {
  const { image, context } = req.body;

  if (!image || typeof image !== 'string') {
    res.status(400).json({ error: 'Missing "image" field (base64 string)' });
    return;
  }

  // Build context-aware prompt
  const hasContext = context && Array.isArray(context) && context.length > 0;

  let prompt = `Look at this image of a pill bottle or medication label. The image may show only a PORTION of a label — extract whatever information is visible. Some images may be slightly blurry — do your best to read any visible text.

US PRESCRIPTION LABEL LAYOUT GUIDE (use this to identify fields correctly):
- TOP AREA: Pharmacy name/logo, pharmacy address, phone number, Rx number (e.g. "Rx# 1234567")
- UPPER-MIDDLE: Patient name (the person taking the medication — NOT the doctor)
- MAIN/LARGEST TEXT: Medication name (generic name, sometimes brand name in smaller text nearby). This is usually the BIGGEST text on the label.
- NEAR MEDICATION NAME: Dosage/strength (e.g. "10mg", "500mg", "20mg/5mL") and quantity/count
- DIRECTIONS LINE: Starts with "Take..." or "TAKE..." — this is dosing instructions, not the drug name
- DOCTOR LINE: Usually prefixed with "Dr.", "DR.", "Prescriber:", or "Written by:" — this is the PRESCRIBING DOCTOR, not the patient
- BOTTOM AREA: Refill info (e.g. "Refills: 3", "No Refills", "Refill by: 03/15/2026"), date filled, expiration date
- SIDE/BACK: May have manufacturer info, NDC number, lot number, warnings

IMPORTANT DISTINCTIONS:
- The PATIENT NAME and DOCTOR NAME are different people — the patient is who takes it, the doctor is who prescribed it
- "Dr. Smith" or "Prescriber: Smith" = doctor field
- Directions like "Take 1 tablet daily" are NOT the medication name
- The medication name is typically the largest/boldest text on the label

For EACH medication you can identify, extract:
- name: the medication/drug name (the large/bold text, NOT the patient name, NOT directions)
- dosage: strength like "10mg", "500mg", "5mL"
- doctor: the PRESCRIBING doctor's name (look for "Dr.", "Prescriber:", "Written by:")
- refillDate: refill info ("Refills: 3", "No refills", or a refill-by date)

Respond with ONLY a JSON array (no markdown, no other text):
[{"name": "medication name", "dosage": "dosage if visible", "doctor": "doctor name if visible", "refillDate": "refill info if visible"}]

Use empty string "" for any field not visible in the image.
If nothing is readable at all, return: []`;

  if (hasContext) {
    prompt += `

IMPORTANT CONTEXT: The user is currently scanning bottles and has already identified these medications: ${context.join(', ')}.

This image is very likely showing ANOTHER SIDE of the same bottle(s) — the user is rotating the bottle to capture doctor name, refill info, or other details.

RULES:
- If you see a doctor name, refill date, or other details but NO clear medication name, this info belongs to one of the already-identified medications. Return the KNOWN medication name with the new details filled in.
- If you see a medication name that matches or is similar to one already identified, use the EXACT known name and fill in any new details.
- Only add a NEW medication entry if you clearly see a DIFFERENT drug name that does not match any of the already-identified medications.
- When in doubt, attribute information to an existing medication rather than creating a new one.`;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: image,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error (${response.status}):`, errorText.substring(0, 300));
      res.status(502).json({ error: 'Failed to analyze image. Please try again.' });
      return;
    }

    const data: any = await response.json();
    let extractedText = '';

    if (data.content && Array.isArray(data.content)) {
      for (const block of data.content) {
        if (block.type === 'text' && block.text) {
          extractedText += block.text;
        }
      }
    }

    if (!extractedText) {
      res.status(502).json({ error: 'No text in API response' });
      return;
    }

    // Parse JSON array from response
    const cleanText = extractedText.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Try to find a JSON array first
    const arrayMatch = cleanText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) {
        const results = parsed.filter((item: any) => item.name || item.dosage);
        if (results.length > 0) {
          res.json({ medications: results });
          return;
        }
      }
    }

    // Fallback: try to find a single JSON object
    const objMatch = cleanText.match(/\{[^{}]*\}/);
    if (objMatch) {
      const parsed = JSON.parse(objMatch[0]);
      if (parsed.name || parsed.dosage || parsed.doctor) {
        res.json({ medications: [parsed] });
        return;
      }
    }

    res.status(422).json({ error: 'Could not extract medication info from image' });
  } catch (error: any) {
    console.error('Scan error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`MedGuardian server running on port ${PORT}`);
});
