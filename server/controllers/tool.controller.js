import Tool from "../models/Tool.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * @desc Customers post new heavy equipment/tools to lend to workers
 * @route POST /api/tools
 */
export const createTool = asyncHandler(async (req, res) => {
  const { toolName, description, category, hourlyRate, coordinates, address, imageUrl } = req.body;

  if (!toolName || !hourlyRate) {
    throw new ApiError(400, "toolName and hourlyRate are required.");
  }

  const ownerId = req.user?._id || req.body.ownerId;
  if (!ownerId) {
    throw new ApiError(401, "User authentication required to list tools.");
  }

  const location = {
    type: "Point",
    coordinates: Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [77.209, 28.6139],
    address: address || "Delhi NCR",
  };

  const tool = await Tool.create({
    ownerId,
    toolName: toolName.trim(),
    description: description || "",
    category: category || "General",
    hourlyRate: Number(hourlyRate),
    location,
    status: "available",
    imageUrl: imageUrl || "",
  });

  res.status(201).json({
    success: true,
    data: tool,
    message: "Tool listed successfully on P2P Tool Bank.",
  });
});

/**
 * @desc Get all available tools or query by location/status
 * @route GET /api/tools
 */
export const getTools = asyncHandler(async (req, res) => {
  const { status = "available", category, search } = req.query;

  const query = {};
  if (status && status !== "all") {
    query.status = status;
  }
  if (category && category !== "All") {
    query.category = category;
  }
  if (search) {
    query.toolName = { $regex: search, $options: "i" };
  }

  const tools = await Tool.find(query)
    .populate("ownerId", "name phone email avatar")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: tools,
    count: tools.length,
  });
});

/**
 * @desc Worker rents an available tool
 * @route POST /api/tools/:id/rent
 */
export const rentTool = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const workerId = req.user?._id || req.body.workerId;

  if (!workerId) {
    throw new ApiError(401, "Worker authentication required to rent equipment.");
  }

  const tool = await Tool.findById(id);
  if (!tool) {
    throw new ApiError(404, "Tool not found.");
  }

  if (tool.status === "rented") {
    throw new ApiError(400, "This tool is currently rented by another worker.");
  }

  tool.status = "rented";
  tool.rentedBy = workerId;
  tool.rentedAt = new Date();
  await tool.save();

  res.status(200).json({
    success: true,
    data: tool,
    message: `Successfully reserved ${tool.toolName} from P2P Tool Bank.`,
  });
});

/**
 * @desc Return rented tool
 * @route POST /api/tools/:id/return
 */
export const returnTool = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tool = await Tool.findById(id);
  if (!tool) {
    throw new ApiError(404, "Tool not found.");
  }

  tool.status = "available";
  tool.rentedBy = null;
  tool.rentedAt = null;
  await tool.save();

  res.status(200).json({
    success: true,
    data: tool,
    message: `Returned ${tool.toolName} to P2P Tool Bank.`,
  });
});
