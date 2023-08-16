import { Schema, Model, model, Error as MongooseError } from 'mongoose';
import { Status } from './status.model';
import {
    IAdmin, IAdminDoc,
} from './types/user.types';

const options = { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } };

const userSchema = new Schema(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        username: String,
        photoUrl: String,
        emailId: {
            type: String,
            default: null
        },
        twitterUsername: String,
        discordUsername: String,
        walletAddress: String,
        refCode: {
            type: String,
            unique: true,
        },
        referrer: {
            type: String,
            default: null,
        },
    }, options
);

const adminSchema = new Schema<IAdminDoc>(
    {
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        role: { type: String, required: true, default: 'Admin' },
    }, options
);

adminSchema.virtual('password', {
    ref: 'Password',
    localField: '_id',
    foreignField: 'admin',
    justOne: true,
});
adminSchema.virtual('status', {
    ref: 'Status',
    localField: '_id',
    foreignField: 'admin',
    justOne: true,
});
adminSchema.pre('validate', async function (next) {
    if (this.isNew) {
        const status = new Status({ admin: this._id });
        status.isActive = true;

        await status.save();
    }

    next();
});

const Admin: Model<IAdminDoc> = model<IAdminDoc>('Admin', adminSchema)
const User = model('Users', userSchema, 'Users');

export {
    User, Admin,
};
