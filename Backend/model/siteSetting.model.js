import mongoose, { Schema } from 'mongoose';

const siteSettingSchema = new Schema(
    {
        key: { type: String, default: 'global', unique: true, index: true },
        brandName: { type: String, default: 'NPIP' },
        tagline: { type: String, default: "Nepal is listening" },
        logoUrl: { type: String, default: '' },
        footerText: { type: String, default: "NPIP - Nepal's Public Figure Information Portal" },
        accentColor: { type: String, default: '#d86b2c' },
    },
    { timestamps: true }
);

export const SiteSetting = mongoose.model('SiteSetting', siteSettingSchema);
