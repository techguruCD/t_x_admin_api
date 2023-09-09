const mongoose = require("mongoose");

const BQPairSchema = new mongoose.Schema(
  {
    buyCurrency: {
      address: {
        type: String,
      },
      decimals: {
        type: Number,
      },
      name: {
        type: String,
      },
      symbol: {
        type: String,
      },
      tokenId: {
        type: String,
      },
      tokenType: {
        type: String,
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    network: {
      type: String,
    },
    sellCurrency: {
      address: {
        type: String,
      },
      decimals: {
        type: Number,
      },
      name: {
        type: String,
      },
      symbol: {
        type: String,
      },
      tokenId: {
        type: String,
      },
      tokenType: {
        type: String,
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    smartContract: {
      address: {
        address: {
          type: String,
        },
        _id: {
          type: mongoose.Schema.Types.ObjectId,
        },
      },
      contractType: {
        type: String,
      },
      currency: {
        decimals: {
          type: Number,
        },
        name: {
          type: String,
        },
        symbol: {
          type: String,
        },
        tokenType: {
          type: String,
        },
        _id: {
          type: mongoose.Schema.Types.ObjectId,
        },
      },
      protocolType: {
        type: String,
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    count: {
      type: Number,
    },
    daysTraded: {
      type: Number,
    },
    dexToolSlug: {
      type: String,
    },
    exchange: {
      address: {
        address: {
          type: String,
        },
        _id: {
          type: mongoose.Schema.Types.ObjectId,
        },
      },
      fullName: {
        type: String,
      },
      fullNameWithId: {
        type: String,
      },
      _id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    started: {
      type: Date,
    },
    tradeAmount: {
      type: Number,
    },
    buyCurrencyPrice: {
      type: Number,
    },
    sellCurrencyPrice: {
      type: Number,
    },
  },
  { collection: "BQPair" }
);

const BQPair = mongoose.model("BQPair", BQPairSchema);

module.exports = { BQPair };
