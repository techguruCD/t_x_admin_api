import { NextFunction, Response } from "express"
import { AuthenticatedRequest } from "../types"
import { BadRequestError, NotFoundError } from "../utils/errors"
import { Ads } from "../models/ads.model"
import { uploadToCloudinary } from "../services/fileupload.service"
import fs from 'fs'

const createNewAd = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const {
        name, url, expiry
    } = req.body

    const image = req.file

    // Change date from DD-MM-YYYY to UTC
    const [day, month, year] = expiry.split('-').map(Number);
    const expiryDate = new Date(new Date(Date.UTC(year, month - 1, day))).toISOString()

    let newAd = new Ads({
        name, url, expiry: expiryDate,
    })

    if (!image) {
        return next(new BadRequestError('Image not found'))
    }

    const secure_url = await uploadToCloudinary({
        path: image.path,
        fileName: image.filename,
        destinationPath: 'ads'
    })

    newAd.image = secure_url
    newAd = await newAd.save()

    // Delete image from local storage
    fs.unlinkSync(image.path)

    res.status(201).send({
        success: true,
        message: 'Ad created successfully',
        data: {
            ad: newAd
        }
    })
}

const getAdInfo = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { ad_id } = req.query

    const ad = await Ads.findOne({ _id: ad_id })

    if (!ad) {
        return next(new NotFoundError('Ad not found'))
    }

    res.status(200).send({
        success: true,
        message: 'Ad found',
        data: {
            ad
        }
    })
}

const getAds = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const {
        limit, image, url, expiry, status, name
    }: {
        limit: number,
        image: string,
        url: string,
        expiry: `${number}-${number}-${number}`,
        status: string,
        name: string
    } = req.query as any

    const query: any = {}

    if (image) { query.image = image }
    if (url) { query.url = url }
    if (expiry) {
        const [day, month, year] = expiry.split('-').map(Number);
        query.expiry = new Date(new Date(Date.UTC(year, month - 1, day))).toISOString()
    }
    if (status) { query.status = status }
    if (name) { query.name = name }

    const ads = await Ads.find(query).limit(limit)

    res.status(200).send({
        success: true,
        message: 'Ads found',
        data: {
            ads
        }
    })
}

const disableAd = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { ad_id } = req.body

    const ad = await Ads.findOne({ _id: ad_id })
    if (!ad) {
        return next(new NotFoundError('Ad not found'))
    }

    if (ad.status === 'disabled') {
        return next(new BadRequestError('Ad already disabled'))
    }

    ad.status = 'disabled'
    const updatedAd = await ad.save()

    res.status(200).send({
        success: true,
        message: 'Ad disabled successfully ',
        data: {
            ad: updatedAd
        }
    })
}

const enableAd = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { ad_id } = req.body

    const ad = await Ads.findOne({ _id: ad_id })
    if (!ad) {
        return next(new NotFoundError('Ad not found'))
    }

    if (ad.status === 'enabled') {
        return next(new BadRequestError('Ad already enabled'))
    }

    ad.status = 'enabled'
    const updatedAd = await ad.save()

    res.status(200).send({
        success: true,
        message: 'Ad enaabled successfully',
        data: {
            ad: updatedAd
        }
    })
}

const bulkDisableAds = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { ad_ids } = req.body

    const ads = await Ads.find({ _id: { $in: ad_ids } })
    const allAdsFound = ads.length === ad_ids.length

    if (!allAdsFound) {
        return next(new NotFoundError('Some ads not found'))
    }

    await Ads.updateMany({ _id: { $in: ad_ids } }, { status: 'disabled' })

    const updatedAds = await Ads.find({ _id: { $in: ad_ids } })

    res.status(200).send({
        success: true,
        message: 'Ads disabled successfully',
        data: {
            ads: updatedAds
        }
    })
}

const bulkEnableAds = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { ad_ids } = req.body

    const ads = await Ads.find({ _id: { $in: ad_ids } })
    const allAdsFound = ads.length === ad_ids.length

    if (!allAdsFound) {
        return next(new NotFoundError('Some ads not found'))
    }

    await Ads.updateMany({ _id: { $in: ad_ids } }, { status: 'enabled' })

    const updatedAds = await Ads.find({ _id: { $in: ad_ids } })
    
    res.status(200).send({
        success: true,
        message: 'Ads enabled successfully',
        data: {
            ads: updatedAds
        }
    })
}

const updateAd = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { ad_id } = req.body
    const { name, url, expiry } = req.body

    const existingAd = await Ads.findOne({ _id: ad_id })
    if (!existingAd) {
        return next(new NotFoundError('Ad not found'))
    }

    const updateQuery = {} as any

    if (name) { updateQuery.name = name }
    if (url) { updateQuery.url = url }
    if (expiry) {
        const [day, month, year] = expiry.split('-').map(Number);
        updateQuery.expiry = new Date(new Date(Date.UTC(year, month - 1, day))).toISOString()
    }

    const imageFile = req.file
    if (imageFile) {
        const secureUrl = await uploadToCloudinary({
            path: imageFile.path,
            fileName: imageFile.filename,
            destinationPath: 'ads'
        })

        updateQuery.image = secureUrl
    }

    if (Object.keys(updateQuery).length === 0) {
        return next(new BadRequestError('No update parameters provided'))
    }

    const updatedAd = await Ads.findOneAndUpdate({ _id: ad_id }, updateQuery, { new: true })

    res.status(200).send({
        success: true,
        message: 'Ad updated successfully',
        data: {
            ad: updatedAd
        }
    })

}

const deleteAd = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { ad_id } = req.body

    const ad = await Ads.findOne({ _id: ad_id })
    if (!ad) {
        return next(new NotFoundError('Ad not found'))
    }

    await ad.deleteOne()

    res.status(200).send({
        success: true,
        message: 'Ad deleted successfully',
        data: {
            ad
        }
    })
}

export {
    getAds,
    getAdInfo,
    createNewAd,
    disableAd,
    enableAd,
    bulkDisableAds,
    bulkEnableAds,
    updateAd,
    deleteAd,
}


