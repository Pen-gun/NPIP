import { YoutubeTranscript } from 'youtube-transcript';

export const fetchTranscriptPreview = async (videoId, limit = 12) => {
    if (!videoId) return null;
    const enabled = String(process.env.YOUTUBE_TRANSCRIPTS || '').toLowerCase() === 'true';
    if (!enabled) return null;

    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        if (!Array.isArray(transcript)) return null;
        const lines = transcript.slice(0, limit).map((line) => line.text).filter(Boolean);
        return lines;
    } catch (err) {
        return null;
    }
};
