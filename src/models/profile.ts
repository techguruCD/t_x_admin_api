import { ProfileData, ISuperAdminDoc, IUserDoc, Profile } from './types/user.types';
import { model, ClientSession } from 'mongoose'
import { SuperAdmin } from './user.model';

async function createSuperAdminProfile(
    user: IUserDoc,
    session?: ClientSession
): Promise<ISuperAdminDoc> {
    const doc = session
        ? SuperAdmin
            .create([{ user: user._id }], { session })
            .then(doc => doc[0])
        : SuperAdmin.create({ user: user._id });

    return doc;
}

async function createProfile(
    this: IUserDoc,
    profile_data?: ProfileData<"SuperAdmin">,
    session?: ClientSession,
) {
    switch (this.role) {
        case 'SuperAdmin':
            return createSuperAdminProfile(this, session)    
        default:
            throw new Error('Invalid user role')
    }
}

async function getProfile(this: IUserDoc): Promise<Profile<typeof this.role>> {
    type UserRole = typeof this.role;
    type ProfileType = Profile<UserRole>;
    
    const res = await model<ProfileType>(this.role).findOne({ user: this._id })

    return res?.toObject() as unknown as Promise<ProfileType>;
}

export {
    createProfile,
    getProfile
}