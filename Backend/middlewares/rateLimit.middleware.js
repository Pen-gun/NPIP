const buckets = new Map();

const prune = (now, windowMs) => {
    for (const [key, bucket] of buckets.entries()) {
        if (now - bucket.start > windowMs) {
            buckets.delete(key);
        }
    }
};

const rateLimiter = ({ windowMs = 60_000, max = 60 } = {}) => {
    return (req, res, next) => {
        const now = Date.now();
        prune(now, windowMs);

        const key = `${req.ip}:${req.path}`;
        const bucket = buckets.get(key) || { count: 0, start: now };

        if (now - bucket.start > windowMs) {
            bucket.count = 0;
            bucket.start = now;
        }

        bucket.count += 1;
        buckets.set(key, bucket);

        if (bucket.count > max) {
            return res.status(429).json({ error: 'Too many requests' });
        }

        next();
    };
};

export default rateLimiter;
