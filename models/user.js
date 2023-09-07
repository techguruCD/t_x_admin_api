const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    username: String,
    photoUrl: String,
    emailId: {
      type: String,
      default: null
    },
    twitterUsername: String,
    discordUsername: String,
    walletAddress: String,
    refCode: {
      type: String,
      unique: true,
    },
    referrer: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: {
      updatedAt: true,
      createdAt: true,
    },
  }
);

const UsersModel = mongoose.model('Users', userSchema, 'Users');

module.exports = UsersModel;

