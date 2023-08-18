import { Router } from 'express';
import {
    getAds,
    getAdInfo,
    createNewAd,
    disableAd,
    enableAd,
    bulkDisableAds,
    bulkEnableAds,
    updateAd,
    deleteAd,
} from '../controllers/ads.controller';
import { basicAuth, withAuthentication } from '../middlewares/auth';
import { multerUpload } from '../services/fileupload.service';

const router = Router();

router
    .post('/create', basicAuth(), multerUpload.single('image'), withAuthentication(createNewAd))
    .get('/all', basicAuth(), withAuthentication(getAds))
    .get('/info', basicAuth(), withAuthentication(getAdInfo))
    .patch('/disable', basicAuth(), withAuthentication(disableAd))
    .patch('/enable', basicAuth(), withAuthentication(enableAd))
    .patch('/bulkdisable', basicAuth(), withAuthentication(bulkDisableAds))
    .patch('/bulkenable', basicAuth(), withAuthentication(bulkEnableAds))
    .patch('/update', basicAuth(), withAuthentication(updateAd))
    .delete('/delete', basicAuth(), withAuthentication(deleteAd))
    
export default router;
