import { Project } from '../model/project.model.js';
import { Usage } from '../model/usage.model.js';
import { PLAN_LIMITS } from '../utils/plans.js';
import apiError from '../utils/apiError.js';
import apiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sanitizeQuery } from '../utils/booleanQuery.js';
import { ingestProject } from '../services/ingestion.service.js';
import { getProjectMetrics } from '../services/metrics.service.js';
import { ConnectorHealth } from '../model/connectorHealth.model.js';
import { Mention } from '../model/mention.model.js';
import { Alert } from '../model/alert.model.js';
import { getMonthKey } from '../utils/date.js';

const normalizeKeywords = (keywords = []) =>
    keywords.map((word) => word.trim()).filter(Boolean);

export const createProject = asyncHandler(async (req, res) => {
    const { name, keywords = [], booleanQuery = '', sources = {}, scheduleMinutes, geoFocus } = req.body;
    if (!name?.trim()) {
        throw new apiError(400, 'Project name is required');
    }
    const plan = PLAN_LIMITS[req.user.plan] || PLAN_LIMITS.individual;
    const keywordList = normalizeKeywords(keywords);
    if (keywordList.length > plan.keywords) {
        throw new apiError(400, `Keyword limit exceeded for ${req.user.plan} plan`);
    }
    const interval = Math.max(Number(scheduleMinutes) || plan.minIntervalMinutes, plan.minIntervalMinutes);

    const project = await Project.create({
        userId: req.user._id,
        name: name.trim(),
        keywords: keywordList,
        booleanQuery: sanitizeQuery(booleanQuery),
        sources,
        scheduleMinutes: interval,
        geoFocus: geoFocus || 'Nepal',
    });

    return res.status(201).json(new apiResponse(201, project, 'Project created'));
});

export const listProjects = asyncHandler(async (req, res) => {
    const projects = await Project.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(new apiResponse(200, projects, 'Projects fetched'));
});

export const getProject = asyncHandler(async (req, res) => {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) throw new apiError(404, 'Project not found');
    return res.status(200).json(new apiResponse(200, project, 'Project fetched'));
});

export const updateProject = asyncHandler(async (req, res) => {
    const { name, keywords, booleanQuery, sources, scheduleMinutes, geoFocus, status } = req.body;
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) throw new apiError(404, 'Project not found');
    const plan = PLAN_LIMITS[req.user.plan] || PLAN_LIMITS.individual;

    if (name) project.name = name.trim();
    if (keywords) {
        const keywordList = normalizeKeywords(keywords);
        if (keywordList.length > plan.keywords) {
            throw new apiError(400, `Keyword limit exceeded for ${req.user.plan} plan`);
        }
        project.keywords = keywordList;
    }
    if (booleanQuery !== undefined) {
        project.booleanQuery = sanitizeQuery(booleanQuery);
    }
    if (sources) project.sources = sources;
    if (scheduleMinutes) {
        project.scheduleMinutes = Math.max(Number(scheduleMinutes) || plan.minIntervalMinutes, plan.minIntervalMinutes);
    }
    if (geoFocus) project.geoFocus = geoFocus;
    if (status) project.status = status;

    await project.save();
    return res.status(200).json(new apiResponse(200, project, 'Project updated'));
});

export const deleteProject = asyncHandler(async (req, res) => {
    const project = await Project.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!project) throw new apiError(404, 'Project not found');
    await Promise.all([
        ConnectorHealth.deleteMany({ projectId: project._id }),
        Mention.deleteMany({ projectId: project._id }),
        Alert.deleteMany({ projectId: project._id }),
    ]);
    return res.status(200).json(new apiResponse(200, null, 'Project deleted'));
});

export const runProjectIngestion = asyncHandler(async (req, res) => {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) throw new apiError(404, 'Project not found');

    const month = getMonthKey();
    await Usage.findOneAndUpdate(
        { userId: req.user._id, month },
        { $setOnInsert: { mentionsCount: 0 } },
        { upsert: true, new: true }
    );
    const result = await ingestProject(project);
    return res.status(200).json(new apiResponse(200, result, 'Ingestion triggered'));
});

export const fetchProjectMetrics = asyncHandler(async (req, res) => {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) throw new apiError(404, 'Project not found');
    const metrics = await getProjectMetrics(project._id, {
        from: req.query.from ? new Date(req.query.from) : undefined,
        to: req.query.to ? new Date(req.query.to) : undefined,
    });
    return res.status(200).json(new apiResponse(200, metrics, 'Metrics fetched'));
});

export const fetchProjectHealth = asyncHandler(async (req, res) => {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) throw new apiError(404, 'Project not found');
    const health = await ConnectorHealth.find({ projectId: project._id });
    return res.status(200).json(new apiResponse(200, health, 'Connector health fetched'));
});
