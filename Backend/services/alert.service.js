import { Alert } from '../model/alert.model.js';
import { Mention } from '../model/mention.model.js';
import { getSocket } from './socket.service.js';
import { sendEmail } from './email.service.js';

const notifyRealtime = (alert) => {
    const io = getSocket();
    if (!io) return;
    io.to(`user:${alert.userId}`).emit('alert', alert);
    io.to(`project:${alert.projectId}`).emit('alert', alert);
};

const maybeEmail = async (user, alert) => {
    if (!process.env.ALERT_EMAIL_ENABLED) return;
    if (!user?.email) return;
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
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [lastHourCount, lastDayCount] = await Promise.all([
        Mention.countDocuments({ projectId: project._id, createdAt: { $gte: hourAgo } }),
        Mention.countDocuments({ projectId: project._id, createdAt: { $gte: dayAgo } }),
    ]);

    const avgHourly = lastDayCount / 24 || 0;
    if (lastHourCount > Math.max(5, avgHourly * 2)) {
        await createAlert({
            user,
            project,
            type: 'spike',
            message: `Spike detected: ${lastHourCount} mentions in the last hour.`,
            payload: { lastHourCount, avgHourly },
        });
    }
};
