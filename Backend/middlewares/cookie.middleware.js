const parseCookieHeader = (header = '') => {
    return header.split(';').reduce((acc, part) => {
        const [rawKey, ...rest] = part.split('=');
        const key = rawKey?.trim();
        if (!key) return acc;
        acc[key] = decodeURIComponent(rest.join('=').trim());
        return acc;
    }, {});
};

const cookieParser = (req, _res, next) => {
    const header = req.headers?.cookie || '';
    req.cookies = parseCookieHeader(header);
    next();
};

export default cookieParser;
