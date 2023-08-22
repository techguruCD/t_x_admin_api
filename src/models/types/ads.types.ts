import { Types, Document } from 'mongoose';

interface IAd {
    name: string;
    image: string;
    url: string;
    status: 'enabled' | 'disabled';
    expiry: Date;
    createdAt: Date;
    updatedAt: Date;
}
interface IAdDoc extends IAd, Document { }


export { IAd, IAdDoc };
