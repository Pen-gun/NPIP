import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/apiResponse.js';
import { SiteSetting } from '../model/siteSetting.model.js';

const DEFAULTS = {
    key: 'global',
    brandName: 'NPIP',
    tagline: 'Nepal is listening',
    logoUrl: '',
    footerText: "NPIP - Nepal's Public Figure Information Portal",
    accentColor: '#d86b2c',
};

const toDTO = (setting) => ({
    brandName: setting.brandName,
    tagline: setting.tagline,
    logoUrl: setting.logoUrl,
    footerText: setting.footerText,
    accentColor: setting.accentColor,
});

const ensureSettings = async () => {
    const existing = await SiteSetting.findOne({ key: 'global' }).lean();
    if (existing) return existing;
    const created = await SiteSetting.create(DEFAULTS);
    return created.toObject();
};

export const getPublicSettings = asyncHandler(async (_req, res) => {
    const settings = await ensureSettings();
    return res.status(200).json(new ApiResponse(200, toDTO(settings), 'Settings fetched'));
});

export const getAdminSettings = asyncHandler(async (_req, res) => {
    const settings = await ensureSettings();
    return res.status(200).json(new ApiResponse(200, toDTO(settings), 'Settings fetched'));
});

export const updateAdminSettings = asyncHandler(async (req, res) => {
    const { brandName, tagline, logoUrl, footerText, accentColor } = req.body || {};
    const update = {
        brandName: brandName?.trim() || DEFAULTS.brandName,
        tagline: tagline?.trim() || DEFAULTS.tagline,
        logoUrl: logoUrl?.trim() || '',
        footerText: footerText?.trim() || DEFAULTS.footerText,
        accentColor: accentColor?.trim() || DEFAULTS.accentColor,
    };

    const settings = await SiteSetting.findOneAndUpdate({ key: 'global' }, update, {
        new: true,
        upsert: true,
        runValidators: true,
    }).lean();

    return res.status(200).json(new ApiResponse(200, toDTO(settings), 'Settings updated'));
});
