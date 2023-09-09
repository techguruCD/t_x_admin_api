const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const coinInfoSchema = new mongoose.Schema({
  id: {
    type: String,
    index: true,
  },
  symbol: String,
  name: String,
  asset_platform_id: String,
  platforms: Schema.Types.Mixed,
  detail_platforms: Schema.Types.Mixed,
  categories: [String],
  public_notice: String,
  description: Schema.Types.Mixed,
  links: Schema.Types.Mixed,
  current_price: Number,
  roi: new Schema({
    currency: String,
    percentrage: Number,
  }),
  ath: Number,
  ath_change_percentage: Number,
  ath_date: String,
  atl: Number,
  atl_change_percentage: Number,
  atl_date: String,
  market_cap: Number,
  fully_diluted_valuation: Number,
  total_volume: Number,
  high_24h: Number,
  low_24h: Number,
  price_change_24h: Number,
  price_change_percentage_24h: Number,
  market_cap_change_24h: Number,
  market_cap_change_percentage_24h: Number,
  circulating_supply: Number,
  total_supply: Number,
  max_supply: Number,
  price_change_percentage_1h_in_currency: Number,
  image: String,
  market_cap_rank: Number,
  coingecko_rank: Number,
  coingecko_score: Number,
  developer_score: Number,
  community_score: Number,
  liquidity_score: Number,
  public_interest_score: Number,
  last_updated: String,
});

const coinIds = new mongoose.Schema({
  id: {
    type: String,
    index: true,
  },
});

const tickersSchema = new mongoose.Schema({
  id: String,
  name: String,
  tickers: [Schema.Types.Mixed],
});

const CGCoinInfoModel = mongoose.model("CGInfo", coinInfoSchema, "CGInfo");
const CGTickersModel = mongoose.model("CGTickers", tickersSchema, "CGTickers");
const CGIdsModel = mongoose.model("CGIds", coinIds, "CGIds");

module.exports = {
  CGCoinInfoModel,
  CGTickersModel,
  CGIdsModel,
};
