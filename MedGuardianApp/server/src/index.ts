import 'dotenv/config';
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
  let contextHint = '';
  if (context && Array.isArray(context) && context.length > 0) {
    contextHint = `\n\nPreviously identified medications in this scanning session: ${context.join(', ')}. If this image shows additional information for one of these medications (like a doctor name, dosage detail, or prescription info visible on a different side of the same bottle), use the known medication name and include any new details found.`;
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
                text: `Look at this image of pill bottle(s) or medication label(s). The image may show only a PORTION of a label — extract whatever information is visible. Some images may be slightly blurry — do your best to read any visible text.

For EACH medication you can identify, extract the information.

Respond with ONLY a JSON array (no markdown, no other text):
[{"name": "medication name", "dosage": "dosage like 10mg", "doctor": "doctor name if visible or empty string"}]

If multiple bottles are visible, include an object for each one.
If you cannot read a label clearly, skip it.
If nothing is readable, return: []${contextHint}`,
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
