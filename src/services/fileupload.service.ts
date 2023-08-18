import multer from 'multer';
import cloudinary from 'cloudinary'
import {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET
} from '../config';
import { randomUUID } from 'crypto';

const storage = multer.diskStorage({
    destination: 'src/uploads',
    filename: (req, file, cb) => {
        cb(null, randomUUID() + file.originalname);
    }
});
const multerUpload = multer({ storage });


cloudinary.v2.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});
interface ICloudinaryFileOptions {
    path: string;
    fileName: string;
    destinationPath: string;
}

async function uploadToCloudinary(file_options: ICloudinaryFileOptions) {
    const {
        path, fileName, destinationPath
    } = file_options;

    if (!path || !fileName || !destinationPath) {
        throw new Error('Invalid file options');
    }

    const { secure_url } = await cloudinary.v2.uploader.upload(path, {
        folder: destinationPath,
        public_id: fileName,
        resource_type: 'auto'
    });

    return secure_url
}

async function deleteFileFromCloudinary(fileURl: string) {
    const publicId = fileURl.split('/').pop()?.split('.')[0];
    if (!publicId) {
        throw new Error('Invalid file url');
    }

    await cloudinary.v2.uploader.destroy(publicId);
}

export { multerUpload, uploadToCloudinary, deleteFileFromCloudinary };