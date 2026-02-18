import dotenv from 'dotenv';
import path from 'path';
// Only load .env in development — in production (Railway), env vars are injected
if (!process.env.RAILWAY_ENVIRONMENT) {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const APP_SECRET = process.env.APP_SECRET || 'mg_s3cur3_k8x2pQ7vR4wL9mN1bZ';

if (!ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── API Secret Authentication Middleware ────────────────────────────────────
// Protects all /api/* routes (except /api/health) from unauthorized access.
// The app sends x-app-secret header with every request.
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Allow health checks without auth
  if (req.path === '/api/health') {
    next();
    return;
  }

  const secret = req.headers['x-app-secret'];
  if (!secret || secret !== APP_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

app.use('/api', authMiddleware);

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

// ─── Pill Visual Identification Endpoint ────────────────────────────────────

const pillIdLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Too many pill ID requests. Please try again in a minute.' },
});

app.post('/api/pill-id', pillIdLimiter, async (req, res) => {
  const { image } = req.body;

  if (!image || typeof image !== 'string') {
    res.status(400).json({ error: 'Missing "image" field (base64 string)' });
    return;
  }

  const prompt = `You are an expert pill identification assistant used by healthcare professionals. Carefully analyze this image to identify ALL pills/tablets/capsules visible.

STEP 1 — OBSERVE EVERY DETAIL:
For each distinct pill, examine:
- SHAPE: round, oval, oblong, capsule, diamond, square, rectangle, triangle, other
- COLOR: primary color(s) — white, off-white, yellow, blue, pink, red, orange, green, brown, tan, peach, purple, gray. Note if two-toned or speckled.
- IMPRINT: Look VERY carefully for any text, numbers, letters, logos, or symbols. These may be VERY faint, debossed (pressed in), or small. Zoom in mentally. Check BOTH sides. Common formats: "IP 204", "M523", "TEVA", "G 31", "L484", "watson 853", "U 135".
- SCORING: score line (dividing line) present?
- COATING: film-coated (shiny), sugar-coated, uncoated (matte/chalky), enteric-coated, gel-cap
- SIZE: small (<7mm), medium (7-12mm), large (>12mm)
- TEXTURE: smooth, rough, powdery surface

STEP 2 — IDENTIFY USING MULTIPLE METHODS:
Method A (strongest): If you can read an imprint code, use it as primary identifier.
Method B (strong): If imprint is unclear, use the COMBINATION of shape + color + size + coating to narrow down candidates. Many common medications have distinctive appearances:
  - Small white round tablets are extremely common (lisinopril, metformin, atenolol, minoxidil, etc.)
  - Small white oval/oblong = often metformin, acetaminophen, etc.
  - Blue round = often sildenafil, oxycodone, adderall
  - Pink/peach round = often lisinopril, hydrochlorothiazide
  - Capsules with two colors = often identifiable by color combination
Method C (moderate): Consider context — what are common US prescription medications that match these physical characteristics? Think about the most commonly prescribed drugs.

COMMON SMALL PILL REFERENCE (many are small white round tablets — look for subtle differences):
- Minoxidil 2.5mg/10mg: small white round, may have "U 135" or "M" markings, often scored
- Lisinopril 10mg/20mg: small round, may be white/pink/peach
- Metformin 500mg: white, usually oval/oblong, relatively large
- Atenolol 25mg/50mg: small white round
- Amlodipine 5mg/10mg: small white/yellowish round or octagonal
- Hydrochlorothiazide 25mg: small white/peach round
- Metoprolol 25mg/50mg: small white round, often scored
- Losartan 25mg/50mg: white/green oval
- Levothyroxine: color-coded by dose (white, orange, blue, etc.)
- Prednisone 5mg/10mg: small white round, scored

STEP 3 — ALWAYS PROVIDE YOUR BEST IDENTIFICATION:
Even if you're not 100% certain, provide your best educated assessment based on physical characteristics. Use confidence levels honestly:
- "high": Imprint clearly readable OR very distinctive appearance
- "medium": Partial imprint visible OR physical characteristics strongly suggest a specific drug
- "low": No imprint visible, identification based on shape/color/size alone — but STILL provide your best guess

Return ONLY a JSON array:
[{
  "name": "generic drug name",
  "brandName": "brand name or empty string",
  "dosage": "strength e.g. 10mg",
  "imprint": "text visible on pill, or 'not visible' if none seen",
  "shape": "round/oval/oblong/capsule/etc",
  "color": "white/blue/etc",
  "scoring": "scored/unscored",
  "confidence": "high/medium/low",
  "description": "1-2 sentence note explaining identification reasoning"
}]

CRITICAL RULES:
- NEVER return an empty array if pills ARE visible in the image. Always attempt identification.
- If a pill is hard to identify, still return an entry with confidence "low" and your best guess.
- Return [] ONLY if the image contains NO pills at all.
- If multiple identical pills are visible, return ONE entry.
- For each pill, explain WHY you identified it that way in the description field.

Respond with ONLY the JSON array, no markdown, no other text.`;

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
        max_tokens: 4096,
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
      res.status(502).json({ error: 'Failed to analyze pill image. Please try again.' });
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

    const cleanText = extractedText.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Parse JSON array
    const arrayMatch = cleanText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed)) {
        const pills = parsed.filter((item: any) => item.name || item.imprint);

        // For each identified pill, try to cross-reference with FDA
        const enrichedPills = await Promise.all(
          pills.map(async (pill: any) => {
            if (pill.name) {
              try {
                const fdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(pill.name)}"&limit=1`;
                const fdaResponse = await fetch(fdaUrl);
                if (fdaResponse.ok) {
                  const fdaData: any = await fdaResponse.json();
                  const label = fdaData.results?.[0];
                  if (label) {
                    const openfda = label.openfda || {};
                    pill.fdaVerified = true;
                    if (!pill.brandName && openfda.brand_name?.[0]) {
                      pill.brandName = openfda.brand_name[0];
                    }
                    if (openfda.manufacturer_name?.[0]) {
                      pill.manufacturer = openfda.manufacturer_name[0];
                    }
                  }
                }
              } catch {
                // FDA enrichment is best-effort
              }
            }
            return pill;
          })
        );

        res.json({ pills: enrichedPills });
        return;
      }
    }

    // Fallback: single object
    const objMatch = cleanText.match(/\{[^{}]*\}/);
    if (objMatch) {
      const parsed = JSON.parse(objMatch[0]);
      if (parsed.name || parsed.imprint) {
        res.json({ pills: [parsed] });
        return;
      }
    }

    res.json({ pills: [], message: 'No pills could be identified in the image' });
  } catch (error: any) {
    console.error('Pill ID error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Ask MedGuardian Health Q&A Endpoint ────────────────────────────────────

const askLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many questions. Please try again in a minute.' },
});

app.post('/api/ask', askLimiter, async (req, res) => {
  const { question, medications, allergies, patientName } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length < 3) {
    res.status(400).json({ error: 'Please provide a question (at least 3 characters).' });
    return;
  }

  // Build medication-aware system context
  let medContext = '';
  if (medications && Array.isArray(medications) && medications.length > 0) {
    medContext += `\nPATIENT'S CURRENT MEDICATIONS:\n`;
    medications.forEach((med: any) => {
      let line = `- ${med.name}`;
      if (med.dosage) line += ` ${med.dosage}`;
      if (med.frequency) line += ` (${med.frequency})`;
      if (med.reason) line += ` — for: ${med.reason}`;
      medContext += `${line}\n`;
    });
  }

  if (allergies && Array.isArray(allergies) && allergies.length > 0) {
    medContext += `\nPATIENT'S ALLERGIES: ${allergies.join(', ')}\n`;
  }

  const systemPrompt = `You are MedGuardian Assistant, an AI health assistant built into a medication tracking app used by patients and their healthcare providers (PAs, nurses, doctors).

Your role is to provide helpful, accurate health information while being mindful of the patient's current medications and allergies.

CONTEXT — This patient's medication profile:
${medContext || 'No medications or allergies on file.'}

GUIDELINES:
1. ALWAYS consider the patient's current medications and allergies when answering. If their question relates to a symptom that could be a medication side effect, mention that possibility.
2. If a question involves recommending an OTC medication or supplement, CHECK for potential interactions with their current meds and allergies first.
3. Be practical and actionable — give specific, helpful advice they can use.
4. Keep answers concise but thorough — aim for 2-4 short paragraphs.
5. Use simple, patient-friendly language (avoid medical jargon unless necessary, and explain terms if used).
6. ALWAYS end with a brief note to consult their healthcare provider for personalized medical advice, especially for new or worsening symptoms.
7. If a question is clearly outside your scope (emergency symptoms, mental health crisis, etc.), advise them to seek immediate medical attention.
8. Do NOT diagnose conditions — suggest possibilities and recommend professional evaluation.
9. When relevant, mention if any of their current medications could be contributing to the issue they're asking about.

FORMAT: Respond in plain text. Use short paragraphs. Do NOT use markdown formatting, headers, bullet points, or special characters — just clean readable text.`;

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
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: question.trim(),
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error (${response.status}):`, errorText.substring(0, 300));
      res.status(502).json({ error: 'Could not get a response. Please try again.' });
      return;
    }

    const data: any = await response.json();
    let answer = '';

    if (data.content && Array.isArray(data.content)) {
      for (const block of data.content) {
        if (block.type === 'text' && block.text) {
          answer += block.text;
        }
      }
    }

    if (!answer) {
      res.status(502).json({ error: 'Empty response from AI. Please try again.' });
      return;
    }

    res.json({ answer: answer.trim() });
  } catch (error: any) {
    console.error('Ask error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`MedGuardian server running on 0.0.0.0:${PORT}`);
});
