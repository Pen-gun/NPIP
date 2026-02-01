import mongoose, { Schema } from 'mongoose';

const adminMediaSchema = new Schema(
    {
        url: { type: String, required: true },
        title: { type: String, default: '' },
        alt: { type: String, default: '' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

adminMediaSchema.index({ createdAt: -1 });

export const AdminMedia = mongoose.model('AdminMedia', adminMediaSchema);
