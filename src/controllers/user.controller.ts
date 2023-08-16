import { NextFunction, Response } from "express"
import { AuthenticatedRequest } from "../types"
import { User } from "../models/user.model"

const getUserInfo = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const {
        user_id, username,
        email_id, twitter_username,
        discord_username, wallet_address,
        ref_code, referrer } = req.query

    const query = {} as any

    if (user_id) query.userId = user_id
    if (username) query.username = username
    if (email_id) query.emailId = email_id
    if (twitter_username) query.twitterUsername = twitter_username
    if (discord_username) query.discordUsername = discord_username
    if (wallet_address) query.walletAddress = wallet_address
    if (ref_code) query.refCode = ref_code
    if (referrer) query.referrer = referrer

    const user = await User.findOne(query)

    res.status(200).send({
        success: true,
        mesage: "Users fetched successfully",
        data: {
            user
        }
    })
}

const getUsers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const users = await User.find({})

    res.status(200).send({
        success: true,
        mesage: "User info fetched successfully",
        data: {
            users
        }
    })
}

export {
    getUsers,
    getUserInfo
}