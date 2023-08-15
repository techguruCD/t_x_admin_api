import { Types, Document } from 'mongoose';
import { IAdmin } from './user.types';

interface IStatus {
    admin: Types.ObjectId | IAdmin;
    isActive: boolean;
    isVerified: boolean;
}
interface IStatusDoc extends  IStatus, Document { }

export { IStatus, IStatusDoc };
