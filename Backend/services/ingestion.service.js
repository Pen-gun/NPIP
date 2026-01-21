import { connectors } from '../connectors/index.js';
import { Project } from '../model/project.model.js';
import { Mention } from '../model/mention.model.js';
import { ConnectorHealth } from '../model/connectorHealth.model.js';
import { Usage } from '../model/usage.model.js';
import { User } from '../model/user.model.js';
import { AuditLog } from '../model/auditLog.model.js';
import { evaluateBooleanQuery, sanitizeQuery } from '../utils/booleanQuery.js';
import { createSimilarityHash } from '../utils/hash.js';
import { detectLanguage, inferSentiment } from './sentiment.service.js';
import { PLAN_LIMITS } from '../utils/plans.js';
import { getMonthKey } from '../utils/date.js';
import { createAlert, checkForSpike } from './alert.service.js';

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

const withTimeout = (promise, ms) => Promise.race([promise, timeout(ms)]);

const getEnabledConnectors = (project) => {
    return connectors.filter((connector) => {
        const key = connector.id;
        return project.sources?.[key] ?? connector.enabledByDefault;
    });
};

const matchKeywords = (project, text) => {
    const haystack = text.toLowerCase();
    const keywords = (project.keywords || []).map((k) => k.toLowerCase());
    const matched = keywords.find((keyword) => haystack.includes(keyword));
    const sanitized = sanitizeQuery(project.booleanQuery || '');
    const booleanMatch = sanitized ? evaluateBooleanQuery(sanitized, haystack) : true;
    return { matchedKeyword: matched || '', booleanMatch };
};

const estimateReach = (mention) => {
    if (mention.followerCount) return mention.followerCount;
    if (mention.source === 'youtube') return (mention.engagement?.likes || 0) * 10;
    if (mention.source === 'reddit') return (mention.engagement?.comments || 0) * 5;
    return 0;
};

const upsertConnectorHealth = async (projectId, connectorId, status, err) => {
    const payload = {
        status,
        lastError: err ? String(err.message || err) : '',
        lastCheckedAt: new Date(),
    };
    await ConnectorHealth.findOneAndUpdate(
        { projectId, connectorId },
        payload,
        { upsert: true, new: true }
    );
};

const logConnectorError = async (project, connectorId, err) => {
    await AuditLog.create({
        userId: project.userId,
        projectId: project._id,
        connectorId,
        level: 'error',
        message: String(err.message || err),
    });
};

const ensureUsage = async (userId) => {
    const month = getMonthKey();
    const usage = await Usage.findOneAndUpdate(
        { userId, month },
        { $setOnInsert: { mentionsCount: 0 } },
        { upsert: true, new: true }
    );
    return usage;
};

const isOverLimit = (user, usage) => {
    const plan = PLAN_LIMITS[user.plan] || PLAN_LIMITS.individual;
    return usage.mentionsCount >= plan.mentionsPerMonth;
};

const runConnector = async (connector, project) => {
    const result = await withTimeout(
        connector.run({ project, from: project.lastRunAt, to: new Date() }),
        25_000
    );
    return Array.isArray(result) ? result : [];
};

export const ingestProject = async (project) => {
    if (project.status !== 'active') return { inserted: 0 };
    const user = await User.findById(project.userId);
    const usage = await ensureUsage(project.userId);
    if (!user || isOverLimit(user, usage)) {
        return { inserted: 0, reason: 'limit' };
    }

    const enabledConnectors = getEnabledConnectors(project);
    let inserted = 0;

    for (const connector of enabledConnectors) {
        try {
            const rawMentions = await runConnector(connector, project);
            await upsertConnectorHealth(project._id, connector.id, 'ok');

            const prepared = [];
            for (const raw of rawMentions) {
                const text = `${raw.title || ''} ${raw.text || ''}`.trim();
                const { matchedKeyword, booleanMatch } = matchKeywords(project, text);
                if (!booleanMatch || (!matchedKeyword && project.keywords?.length)) {
                    continue;
                }
                const lang = detectLanguage(text);
                const sentiment = await inferSentiment(text);
                const similarityHash = createSimilarityHash(`${raw.title} ${raw.text}`) || null;
                prepared.push({
                    projectId: project._id,
                    source: raw.source,
                    keywordMatched: matchedKeyword,
                    title: raw.title || '',
                    text: raw.text || '',
                    author: raw.author || '',
                    url: raw.url || null,
                    publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : null,
                    engagement: raw.engagement || { likes: 0, comments: 0, shares: 0 },
                    followerCount: raw.followerCount || 0,
                    reachEstimate: estimateReach(raw),
                    lang,
                    geo: project.geoFocus || '',
                    sentiment,
                    similarityHash,
                });
            }

            if (prepared.length) {
                try {
                    const docs = await Mention.insertMany(prepared, { ordered: false });
                    inserted += docs.length;
                } catch (err) {
                    if (err?.writeErrors) {
                        inserted += prepared.length - err.writeErrors.length;
                    } else {
                        throw err;
                    }
                }
            }
        } catch (err) {
            await upsertConnectorHealth(project._id, connector.id, 'degraded', err);
            await logConnectorError(project, connector.id, err);
        }
    }

    if (inserted > 0) {
        await Usage.findOneAndUpdate(
            { userId: project.userId, month: getMonthKey() },
            { $inc: { mentionsCount: inserted } }
        );
        await createAlert({
            user,
            project,
            type: 'new_mentions',
            message: `${inserted} new mentions for ${project.name}.`,
            payload: { count: inserted },
        });
        await checkForSpike({ project, user });
    }

    project.lastRunAt = new Date();
    await project.save({ validateBeforeSave: false });

    return { inserted };
};

export const startIngestionScheduler = () => {
    const intervalMs = 60_000;
    setInterval(async () => {
        const projects = await Project.find({ status: 'active' });
        for (const project of projects) {
            const lastRun = project.lastRunAt ? new Date(project.lastRunAt).getTime() : 0;
            const due = Date.now() - lastRun >= project.scheduleMinutes * 60 * 1000;
            if (due) {
                await ingestProject(project);
            }
        }
    }, intervalMs);
};
