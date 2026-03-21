const catchAsync = require("../../utils/catchAsync");
const { syncBlockchainBlocks } = require("../services/blockchainService");

const listChainBlocks = catchAsync(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));

  const blocks = await syncBlockchainBlocks();
  const total = blocks.length;
  const pages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, pages);
  const start = (safePage - 1) * limit;
  const paginated = blocks.slice(start, start + limit);

  res.status(200).json({
    status: "success",
    page: safePage,
    pages,
    total,
    results: paginated.length,
    data: paginated,
  });
});

module.exports = {
  listChainBlocks,
};
