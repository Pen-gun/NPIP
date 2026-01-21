import { FacebookAdsApi } from 'facebook-nodejs-business-sdk';

const metaConnector = {
    id: 'meta',
    displayName: 'Meta (Owned Assets Only)',
    enabledByDefault: false,
    capabilities: {
        realtime: false,
        search: false,
        limits: 'Owned pages/IG business accounts only; no global keyword search.',
    },
    async run() {
        const accessToken = process.env.META_ACCESS_TOKEN;
        if (!accessToken) throw new Error('Missing META_ACCESS_TOKEN');

        FacebookAdsApi.init(accessToken);
        return [];
    },
};

export default metaConnector;
