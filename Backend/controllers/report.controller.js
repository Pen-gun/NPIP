import PDFDocument from 'pdfkit';
import { Project } from '../model/project.model.js';
import { Mention } from '../model/mention.model.js';
import { getProjectMetrics } from '../services/metrics.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';

const FORMAT_DATE_OPTIONS = Object.freeze({
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
});

const formatDate = (value) => {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString('en-US', FORMAT_DATE_OPTIONS);
};

const buildMentionsQuery = (projectId, scope, lastRunAt) => {
    if (scope !== 'last_run') return { projectId };
    if (!lastRunAt) return null;
    const windowEnd = new Date(lastRunAt);
    const windowStart = new Date(windowEnd.getTime() - 5 * 60 * 1000);
    return { projectId, ingestedAt: { $gte: windowStart, $lte: windowEnd } };
};

export const downloadReport = asyncHandler(async (req, res) => {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) {
        throw new ApiError(404, 'Project not found');
    }

    const allowedScopes = new Set(['summary', 'all', 'mentions', 'last_run']);
    const rawScope = String(req.query?.scope || 'summary');
    const scope = allowedScopes.has(rawScope) ? rawScope : 'summary';
    const includeMetrics = scope === 'summary' || scope === 'all';
    const includeMentions = scope === 'all' || scope === 'mentions' || scope === 'last_run';

    const metrics = includeMetrics ? await getProjectMetrics(project._id) : null;
    let mentions = [];
    if (includeMentions) {
        const mentionsQuery = buildMentionsQuery(project._id, scope, project.lastRunAt);
        mentions = mentionsQuery
            ? await Mention.find(mentionsQuery).sort({ publishedAt: -1 }).lean()
            : [];
    }
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}-report.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).text(`NPIP Report: ${project.name}`, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${formatDate(new Date())}`);
    doc.fontSize(10).text(`Scope: ${scope}`);
    doc.moveDown();

    if (includeMetrics && metrics) {
        doc.fontSize(14).text('Volume Over Time');
        metrics.volume.forEach((row) => {
            const date = `${row._id.year}-${row._id.month}-${row._id.day}`;
            doc.fontSize(10).text(`${date}: ${row.count}`);
        });
        doc.moveDown();

        doc.fontSize(14).text('Sentiment Share');
        metrics.sentimentShare.forEach((row) => {
            doc.fontSize(10).text(`${row._id || 'unknown'}: ${row.count}`);
        });
        doc.moveDown();

        doc.fontSize(14).text('Top Sources');
        metrics.topSources.forEach((row) => {
            doc.fontSize(10).text(`${row._id}: ${row.count}`);
        });
        doc.moveDown();

        doc.fontSize(14).text('Top Authors');
        metrics.topAuthors.forEach((row) => {
            doc.fontSize(10).text(`${row._id || 'unknown'}: ${row.count}`);
        });
        doc.moveDown();
    }

    if (includeMentions) {
        const title = scope === 'last_run' ? 'Mentions (Last Run)' : 'Mentions';
        doc.fontSize(14).text(title);
        doc.moveDown(0.5);
        if (!mentions.length) {
            doc.fontSize(10).text('No mentions found for this scope.');
        } else {
            mentions.forEach((mention) => {
                doc.fontSize(10).text(`- ${mention.title || 'Untitled'}`);
                doc.fontSize(9).text(`  Source: ${mention.source || 'unknown'} | Published: ${formatDate(mention.publishedAt)}`);
                if (mention.keywordMatched) {
                    doc.fontSize(9).text(`  Keyword: ${mention.keywordMatched}`);
                }
                if (mention.url) {
                    doc.fontSize(9).text(`  URL: ${mention.url}`);
                }
                doc.moveDown(0.3);
            });
        }
        doc.moveDown();
    }

    doc.end();
});
