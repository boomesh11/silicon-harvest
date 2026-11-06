import { BoardCategory, BoardTemplateComponent } from '../types/harvest';

const GEMINI_RUNTIME_KEY_STORAGE = 'silicon_harvest_prod_v1_gemini_api_key';

export interface AiScannedPcbResult {
  boardName: string;
  category: BoardCategory;
  defaultRawPriceInr: number;
  primaryFaultPartNumber: string;
  diagnosticSummary: string;
  confidencePercent: number;
  scanEngine: 'GEMINI_2.5_FLASH_VISION';
  components: (BoardTemplateComponent & { isPrimaryFault: boolean })[];
}

export function getGeminiApiKey(): string {
  try {
    const saved = (
      localStorage.getItem(GEMINI_RUNTIME_KEY_STORAGE) || ''
    ).trim();
    if (saved) return saved;
  } catch {
    // ignore
  }
  return (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
}

export function saveRuntimeGeminiApiKey(key: string) {
  try {
    localStorage.setItem(GEMINI_RUNTIME_KEY_STORAGE, key.trim());
  } catch {
    // ignore
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || '');
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Live Gemini 2.5 Flash Vision PCB Auto-BoM Scanner (Zero mock fallback).
 * Requires a real uploaded PCB image file and a configured `VITE_GEMINI_API_KEY`.
 */
export async function scanPcbPhotoForBom(
  file: File
): Promise<AiScannedPcbResult> {
  const apiKey = getGeminiApiKey();

  if (!apiKey || !apiKey.startsWith('AIza')) {
    throw new Error(
      'Gemini 2.5 Flash Vision API Key is not configured. Click "Configure Gemini API Key" to paste your VITE_GEMINI_API_KEY (or define VITE_GEMINI_API_KEY in .env), or select a 1-Click Hardware Reference Template below.'
    );
  }

  const base64Data = await fileToBase64(file);
  const prompt = `You are an expert PCB hardware failure & component salvage engineer.
Inspect this circuit board image and return ONLY valid JSON matching this schema:
{
  "boardName": "Detected PCB Model Name",
  "category": "ACADEMIC_MAKER" | "POWER_SMPS" | "APPLIANCE_PCB" | "LAPTOP_MOBILE",
  "defaultRawPriceInr": 65,
  "primaryFaultPartNumber": "PART_NUMBER_OF_LIKELY_FAULT",
  "diagnosticSummary": "1 sentence technical summary of packages detected",
  "confidencePercent": 96,
  "components": [
    {
      "partNumber": "AMS1117-3.3",
      "partName": "3.3V 1A LDO Voltage Regulator",
      "componentCategory": "Voltage Regulator",
      "packageType": "SOT-223 SMD",
      "difficulty": "LEVEL_1_PLUG_PULL" | "LEVEL_2_BASIC_IRON" | "LEVEL_3_HOT_AIR_SMD",
      "recommendedTempC": 315,
      "partPriceInr": 12,
      "extractionFeeInr": 15,
      "bypassHackTip": "Optional hardware jumper bypass hack tip",
      "isPrimaryFault": false
    }
  ]
}
Include 4 to 5 components visible or standard on this board, marking exactly 1 component with "isPrimaryFault": true.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      apiKey
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: file.type || 'image/jpeg',
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(
      `Gemini Vision API returned HTTP ${response.status}: ${errBody.slice(
        0,
        160
      )}`
    );
  }

  const json = await response.json();
  const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const parsed = JSON.parse(rawText);

  if (
    !parsed ||
    !Array.isArray(parsed.components) ||
    parsed.components.length === 0
  ) {
    throw new Error(
      'Gemini Vision could not isolate distinct IC packages from this image. Try a clearer top-down PCB photo or select a hardware template.'
    );
  }

  return {
    boardName: String(parsed.boardName || 'Scanned Donor PCB'),
    category: (parsed.category as BoardCategory) || 'ACADEMIC_MAKER',
    defaultRawPriceInr: Number(parsed.defaultRawPriceInr || 65),
    primaryFaultPartNumber: String(
      parsed.primaryFaultPartNumber || parsed.components[0].partNumber
    ),
    diagnosticSummary: String(
      parsed.diagnosticSummary ||
        'Gemini 2.5 Flash Vision isolated SMD/THT IC packages from PCB silkscreen.'
    ),
    confidencePercent: Number(parsed.confidencePercent || 95),
    scanEngine: 'GEMINI_2.5_FLASH_VISION',
    components: parsed.components.map((c: any, idx: number) => ({
      partNumber: String(c.partNumber || `IC-${idx + 1}`),
      partName: String(c.partName || 'Integrated Circuit'),
      componentCategory: String(c.componentCategory || 'Logic IC'),
      packageType: String(c.packageType || 'SOIC-8 SMD'),
      difficulty: c.difficulty || 'LEVEL_3_HOT_AIR_SMD',
      recommendedTempC: Number(c.recommendedTempC || 320),
      partPriceInr: Number(c.partPriceInr || 20),
      extractionFeeInr: Number(c.extractionFeeInr || 20),
      bypassHackTip: c.bypassHackTip ? String(c.bypassHackTip) : undefined,
      isPrimaryFault: Boolean(c.isPrimaryFault),
    })),
  };
}
