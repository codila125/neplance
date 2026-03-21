const mongoose = require("mongoose");

const blockchainBlockSchema = new mongoose.Schema({
  hash: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
  },
  prevHash: {
    type: String,
    default: "",
    trim: true,
  },
  blockIndex: {
    type: Number,
    required: true,
    min: 0,
  },
  contracts: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  transactions: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  sourceFetchedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const BlockchainBlock = mongoose.model("BlockchainBlock", blockchainBlockSchema);

module.exports = BlockchainBlock;
