import crypto from 'crypto';

export const createSimilarityHash = (value = '') => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!normalized) return '';
    return crypto.createHash('sha256').update(normalized).digest('hex');
};
