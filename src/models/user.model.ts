import { Schema, Model, model, Error as MongooseError } from 'mongoose';
import { Status } from './status.model';
import {
    ISuperAdmin, ISuperAdminDoc,
    IUser, IUserDoc, IUserMethods, IUserModel,
} from './types/user.types';
import { createProfile, getProfile } from './profile';

const options = { timestamps: true, toObject: { virtuals: true }, toJSON: { virtuals: true } };

const user_schema = new Schema<IUserDoc, IUserModel, IUserMethods>(
    {
        firstname: { type: String },
        lastname: { type: String },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        role: {
            type: String,
            required: true,
            enum: ['SuperAdmin'],
        },
        googleId: { type: String, select: false },
    },
    {
        timestamps: true,
        toObject: {
            transform: function (doc, ret) {
                delete ret.profile?.user
                return ret
            },
            virtuals: true
        },
        toJSON: { virtuals: true }
    }
);

const super_admin_schema = new Schema<ISuperAdminDoc>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        role: { type: String, required: true, default: 'SuperAdmin' },
    },
    options
);

user_schema.virtual('password', {
    ref: 'Password',
    localField: '_id',
    foreignField: 'user',
    justOne: true,
});
user_schema.virtual('status', {
    ref: 'Status',
    localField: '_id',
    foreignField: 'user',
    justOne: true,
});

user_schema.pre('validate', async function (next) {
    if (this.isNew) {
        const status = new Status({ user: this._id });
        await status.save();
    }

    next();
});

user_schema.method('createProfile', createProfile);
user_schema.method('getProfile', getProfile);

const
    User: Model<IUserDoc & IUserModel> = model<IUserDoc & IUserModel>('User', user_schema),
    SuperAdmin: Model<ISuperAdminDoc> = model<ISuperAdminDoc>('SuperAdmin', super_admin_schema);

export {
    User, IUser, IUserDoc,
    SuperAdmin, ISuperAdmin, ISuperAdminDoc,
};
