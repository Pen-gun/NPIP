import { Mention } from '../model/mention.model.js';
import { Project } from '../model/project.model.js';
import apiResponse from '../utils/apiResponse.js';
import apiError from '../utils/apiError.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listMentions = asyncHandler(async (req, res) => {
    const { projectId, source, sentiment, from, to } = req.query;
    if (!projectId) throw new apiError(400, 'projectId is required');
    const project = await Project.findOne({ _id: projectId, userId: req.user._id });
    if (!project) throw new apiError(404, 'Project not found');

    const filter = { projectId };
    if (source) filter.source = source;
    if (sentiment) filter['sentiment.label'] = sentiment;
    if (from || to) {
        filter.publishedAt = {};
        if (from) filter.publishedAt.$gte = new Date(from);
        if (to) filter.publishedAt.$lte = new Date(to);
    }

    const mentions = await Mention.find(filter).sort({ publishedAt: -1 }).limit(200);
    return res.status(200).json(new apiResponse(200, mentions, 'Mentions fetched'));
});
