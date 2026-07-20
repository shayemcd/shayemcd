// Meal calorie/macro estimation via Gemini (Firebase AI Logic).
// In demo mode (or if the AI call fails) a deterministic canned estimate is
// returned so the app keeps working and tests can run offline.

import { SDK, firebaseApp } from './firebase-store.js';

export const MEAL_SCHEMA_FIELDS = ['calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g'];

const PROMPT = `You are a nutritionist estimating a meal's content.
Estimate the WHOLE meal/batch described or pictured (not one serving unless stated).
Be realistic about portion sizes. If a batch size is given (e.g. "4 chicken breasts"), estimate the whole batch.
Return your best single estimate.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Short name for the meal, max 5 words' },
    items: { type: 'array', items: { type: 'string' }, description: 'Component foods with rough quantities' },
    calories: { type: 'integer' },
    protein_g: { type: 'integer' },
    carbs_g: { type: 'integer' },
    fat_g: { type: 'integer' },
    fiber_g: { type: 'integer' },
    food_groups: {
      type: 'array',
      items: { type: 'string', enum: ['vegetables', 'fruit', 'protein', 'grains', 'dairy'] },
    },
    assumptions: { type: 'string', description: 'One sentence on what you assumed' },
  },
  required: ['name', 'calories', 'protein_g', 'carbs_g', 'fat_g', 'fiber_g', 'food_groups'],
};

let model = null;

async function getModel() {
  if (model) return model;
  const ai = await import(`${SDK}/firebase-ai.js`);
  const instance = ai.getAI(firebaseApp(), { backend: new ai.GoogleAIBackend() });
  model = ai.getGenerativeModel(instance, {
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });
  return model;
}

// text: user description; imageDataUrl: data:image/jpeg;base64,... (optional)
export async function estimateMeal({ text, imageDataUrl }, { demo = false } = {}) {
  if (demo) return demoEstimate(text);
  const m = await getModel();
  const parts = [{ text: `${PROMPT}\n\nMeal description: ${text || '(see photo)'}` }];
  if (imageDataUrl) {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageDataUrl.split(',')[1] } });
  }
  const result = await m.generateContent({ contents: [{ role: 'user', parts }] });
  const parsed = JSON.parse(result.response.text());
  parsed.estimatedBy = imageDataUrl ? 'ai-photo' : 'ai-text';
  return parsed;
}

// Deterministic estimate for demo mode and tests.
function demoEstimate(text = '') {
  const t = text.toLowerCase();
  const protein = /chicken|beef|fish|salmon|egg|tofu|steak/.test(t);
  const veg = /broccoli|salad|veg|spinach|pepper/.test(t);
  return {
    name: text ? text.split(/[,.]/)[0].slice(0, 40) : 'Photographed meal',
    items: text ? text.split(',').map(s => s.trim()).filter(Boolean) : ['estimated from photo'],
    calories: protein ? 650 : 520,
    protein_g: protein ? 45 : 18,
    carbs_g: 55,
    fat_g: 22,
    fiber_g: veg ? 9 : 4,
    food_groups: [
      ...(protein ? ['protein'] : []),
      ...(veg ? ['vegetables'] : []),
      'grains',
    ],
    assumptions: 'Demo-mode estimate (no AI call was made).',
    estimatedBy: 'ai-text',
  };
}

// Downscale an image File/Blob to a JPEG data URL (max 512px long edge) so
// the request stays small and the saved thumbnail fits in a Firestore doc.
export function downscaleImage(file, maxDim = 512, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

// A much smaller thumbnail for storing inside the meal document.
export function thumbnail(dataUrl, maxDim = 96, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}
