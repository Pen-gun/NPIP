import { pipeline } from '@xenova/transformers';

let sentimentPipeline = null;

const loadPipeline = async () => {
    if (!sentimentPipeline) {
        sentimentPipeline = await pipeline('sentiment-analysis', 'Xenova/bert-base-multilingual-uncased-sentiment');
    }
    return sentimentPipeline;
};

const devanagariRegex = /[\u0900-\u097F]/;

export const detectLanguage = (text = '') => {
    if (devanagariRegex.test(text)) return 'ne';
    if (/[a-zA-Z]/.test(text)) return 'en';
    return 'unknown';
};

export const inferSentiment = async (text = '') => {
    const trimmed = text.trim();
    if (!trimmed) {
        return { label: 'neutral', confidence: 0 };
    }
    try {
        const model = await loadPipeline();
        const output = await model(trimmed.slice(0, 512));
        const top = Array.isArray(output) ? output[0] : output;
        const label = top?.label?.toLowerCase() || 'neutral';
        return { label, confidence: Number(top?.score || 0) };
    } catch (err) {
        const lower = trimmed.toLowerCase();
        if (lower.includes('good') || lower.includes('great') || lower.includes('excellent')) {
            return { label: 'positive', confidence: 0.4 };
        }
        if (lower.includes('bad') || lower.includes('terrible') || lower.includes('poor')) {
            return { label: 'negative', confidence: 0.4 };
        }
        return { label: 'neutral', confidence: 0.2 };
    }
};
