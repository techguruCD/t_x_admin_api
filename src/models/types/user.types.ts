/* eslint-disable no-debugger */
import { Types, Document, Model } from 'mongoose';
import { IPasswordDoc } from './password.types';
import { IStatusDoc } from './status.types';
import { Email } from '../../types';
import { PopulateEmbeddedDoc, PopulateVirtualDoc } from './typeutil';

/* User Types */
interface IAdmin {
    firstname: string;
    lastname: string;
    email: Email;
    role: 'Admin';
    googleId?: string;
}
interface IAdminDoc extends IAdmin, Document { }
interface AdminWithVirtualsDoc<R extends IAdmin['role']> extends IAdminDoc {
    status: Types.ObjectId | IStatusDoc;
    password: Types.ObjectId | IPasswordDoc;
}

type UserWithPassword = PopulateEmbeddedDoc<IAdminDoc, 'password', IPasswordDoc>;

type AdminWithStatus = PopulateEmbeddedDoc<IAdminDoc, 'status', IStatusDoc>;

export {
    IAdmin, IAdminDoc,  
    AdminWithVirtualsDoc,
    UserWithPassword,
    AdminWithStatus,
}