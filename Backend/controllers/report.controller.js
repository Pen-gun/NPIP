import PDFDocument from 'pdfkit';
import { Project } from '../model/project.model.js';
import { getProjectMetrics } from '../services/metrics.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';

export const downloadReport = asyncHandler(async (req, res) => {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) {
        throw new ApiError(404, 'Project not found');
    }

    const metrics = await getProjectMetrics(project._id);
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}-report.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).text(`NPIP Report: ${project.name}`, { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

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

    doc.end();
});
