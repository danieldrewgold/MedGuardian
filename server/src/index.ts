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
  max: 10,
  message: { error: 'Too many scan requests. Please try again in a minute.' },
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/scan', scanLimiter, async (req, res) => {
  const { image } = req.body;

  if (!image || typeof image !== 'string') {
    res.status(400).json({ error: 'Missing "image" field (base64 string)' });
    return;
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
        max_tokens: 1024,
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
                text: 'Look at this pill bottle label. Extract the medication information and respond with ONLY a JSON object (no markdown, no other text):\n\n{"name": "medication name", "dosage": "dosage like 10mg", "doctor": "doctor name if visible or empty string"}\n\nIf you cannot read it clearly, return: {"name": "", "dosage": "", "doctor": ""}',
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

    // Parse JSON from response
    const cleanText = extractedText.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const jsonMatch = cleanText.match(/\{[^{}]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.name || parsed.dosage || parsed.doctor) {
        res.json(parsed);
        return;
      }
    }

    // Fallback: extract from plain text
    const nameMatch = extractedText.match(/name["\s:]+([^",\n]+)/i);
    const dosageMatch = extractedText.match(/dosage["\s:]+([^",\n]+)/i);
    const doctorMatch = extractedText.match(/doctor["\s:]+([^",\n]+)/i);

    const fallback = {
      name: nameMatch?.[1]?.trim() || '',
      dosage: dosageMatch?.[1]?.trim() || '',
      doctor: doctorMatch?.[1]?.trim() || '',
    };

    if (fallback.name || fallback.dosage) {
      res.json(fallback);
      return;
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
