/* eslint-disable no-debugger */
import { Types, Document, Model } from 'mongoose';
import { IPasswordDoc } from './password.types';
import { IStatusDoc } from './status.types';
import { Email } from '../../types';
import { createProfile } from '../profile';
import { PopulateEmbeddedDoc, PopulateVirtualDoc } from './typeutil';

/* User Types */
type UserRole = 'SuperAdmin';
interface IUser {
    firstname: string;
    lastname: string;
    email: Email;
    role: UserRole;
    googleId?: string;
}
interface IUserDoc extends IUser, IUserMethods, Document { }
interface IUserModel extends Model<IUserDoc>, IUserMethods { }
interface IUserMethods {
    createProfile: typeof createProfile;
    getProfile: <U extends UserRole>() => Promise<Profile<U>>;
}

interface UserWithVirtualsDoc<R extends UserRole> extends IUserDoc {
    status: Types.ObjectId | IStatusDoc;
    password: Types.ObjectId | IPasswordDoc;
    user_profile: Profile<R>
}

type UserWithPassword = PopulateEmbeddedDoc<IUserDoc, 'password', IPasswordDoc>;

/* User Profiles */
interface ISuperAdmin extends IUser {
    role: 'SuperAdmin';
    user: Types.ObjectId | IUser;
}
interface ISuperAdminDoc extends ISuperAdmin, Document { }

/* User Profiles Grouped by Role */
type Profile<R extends UserRole> = R extends 'SuperAdmin' ? ISuperAdmin : never
type ProfileDoc<R extends UserRole> = R extends 'SuperAdmin' ? ISuperAdminDoc : never
type ProfileData<R extends UserRole> = Omit<Profile<R>, 'user'>

type UserWithProfile = PopulateEmbeddedDoc<IUserDoc, 'profile', ProfileDoc<UserRole>>;
type UserWithStatus = PopulateEmbeddedDoc<IUserDoc, 'status', IStatusDoc>;
type UserWithProfileAndStatus = PopulateEmbeddedDoc<UserWithProfile, 'status', IStatusDoc>;

export {
    IUser, IUserDoc, IUserModel, 
    IUserMethods, 
    ISuperAdmin, ISuperAdminDoc,
    UserWithVirtualsDoc,
    UserWithPassword,
    Profile, ProfileDoc, ProfileData, 
    UserWithStatus,
    UserWithProfile,
    UserWithProfileAndStatus,
    UserRole
}