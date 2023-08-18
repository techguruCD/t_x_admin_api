import { Model, Schema, model } from 'mongoose';
import { IAdDoc } from './types/ads.types';
import bcrypt from 'bcrypt';

const options = { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } };

const adsSchema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        image: { type: String, required: true },
        url: { type: String, required: true },
        status: { type: String, enum: ['enabled', 'disabled'], default: 'enabled' },
        expiry: { type: Date, required: true },
        hidden: { type: Boolean, default: false }
    }, options
)

const Ads: Model<IAdDoc> = model<IAdDoc>('Ads', adsSchema);

export { Ads, adsSchema };