import { Mention } from '../model/mention.model.js';

const buildDateFilter = (from, to) => {
    const filter = { $ne: null };
    if (from) filter.$gte = from;
    if (to) filter.$lte = to;
    return filter;
};

export const getProjectMetrics = async (projectId, { from, to } = {}) => {
    const match = {
        projectId,
        publishedAt: buildDateFilter(from, to),
    };

    const [volume, sentimentShare, topSources, topAuthors] = await Promise.all([
        Mention.aggregate([
            { $match: match },
            {
                $group: {
                    _id: {
                        year: { $year: '$publishedAt' },
                        month: { $month: '$publishedAt' },
                        day: { $dayOfMonth: '$publishedAt' },
                    },
                    count: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        ]),
        Mention.aggregate([
            { $match: match },
            { $group: { _id: '$sentiment.label', count: { $sum: 1 } } },
        ]),
        Mention.aggregate([
            { $match: match },
            { $group: { _id: '$source', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]),
        Mention.aggregate([
            { $match: match },
            { $group: { _id: '$author', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
        ]),
    ]);

    return { volume, sentimentShare, topSources, topAuthors };
};
