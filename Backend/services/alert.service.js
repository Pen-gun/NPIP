import { Alert } from '../model/alert.model.js';
import { Mention } from '../model/mention.model.js';
import { emitToUser, emitToProject } from './socket.service.js';
import { sendEmail } from './email.service.js';

const SPIKE_THRESHOLD_MIN = 5;
const SPIKE_MULTIPLIER = 2;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

const notifyRealtime = (alert) => {
    emitToUser(alert.userId, 'alert', alert);
    emitToProject(alert.projectId, 'alert', alert);
};

const shouldSendEmail = () => process.env.ALERT_EMAIL_ENABLED === 'true';

const maybeEmail = async (user, alert) => {
    if (!shouldSendEmail() || !user?.email) return;
    await sendEmail({
        to: user.email,
        subject: `NPIP Alert: ${alert.type}`,
        text: alert.message,
    });
};

export const createAlert = async ({ user, project, type, message, payload = {} }) => {
    const alert = await Alert.create({
        userId: user._id,
        projectId: project._id,
        type,
        message,
        payload,
    });

    notifyRealtime(alert);
    await maybeEmail(user, alert);
    return alert;
};

export const checkForSpike = async ({ project, user }) => {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - HOUR_MS);
    const dayAgo = new Date(now.getTime() - DAY_MS);

    const [lastHourCount, lastDayCount] = await Promise.all([
        Mention.countDocuments({ projectId: project._id, createdAt: { $gte: hourAgo } }),
        Mention.countDocuments({ projectId: project._id, createdAt: { $gte: dayAgo } }),
    ]);

    const avgHourly = lastDayCount / 24 || 0;
    const threshold = Math.max(SPIKE_THRESHOLD_MIN, avgHourly * SPIKE_MULTIPLIER);

    if (lastHourCount > threshold) {
        await createAlert({
            user,
            project,
            type: 'spike',
            message: `Spike detected: ${lastHourCount} mentions in the last hour.`,
            payload: { lastHourCount, avgHourly },
        });
    }
};
