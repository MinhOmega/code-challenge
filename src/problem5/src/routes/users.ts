import { Router, Request, Response } from 'express';
import { z } from 'zod';
import database from '../database/database';
import { validateRequest, validateQuery, asyncHandler } from '../middleware/validation';
import {
  CreateUserSchema,
  UpdateUserSchema,
  UserFiltersSchema,
  IApiResponse,
  IPaginatedResponse,
  IUser,
  ErrorCodes,
  ApiError,
} from '../types/user.types';

const router = Router();

// Parameter validation schema
const IdParamSchema = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val, 10);
    if (isNaN(num) || num <= 0) {
      throw new Error('Invalid ID format');
    }
    return num;
  }),
});

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Public
 */
router.post(
  '/',
  validateRequest(CreateUserSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userData = req.body;
    
    const newUser = database.createUser(userData);
    
    const response: IApiResponse<IUser> = {
      success: true,
      message: 'User created successfully',
      data: newUser,
      timestamp: new Date().toISOString(),
    };
    
    res.status(201).json(response);
  })
);

/**
 * @route   GET /api/users
 * @desc    Get all users with filtering and pagination
 * @access  Public
 */
router.get(
  '/',
  validateQuery(UserFiltersSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const filters = req.query as any; // Type assertion after validation
    
    const { users, total } = database.getUsers(filters);
    
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalPages = Math.ceil(total / limit);
    
    const paginatedResponse: IApiResponse<IPaginatedResponse<IUser>> = {
      success: true,
      message: 'Users retrieved successfully',
      data: {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      timestamp: new Date().toISOString(),
    };
    
    res.json(paginatedResponse);
  })
);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Public
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const stats = database.getStats();
    
    const response: IApiResponse<typeof stats> = {
      success: true,
      message: 'Statistics retrieved successfully',
      data: stats,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  })
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Public
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = IdParamSchema.parse(req.params);
    
    const user = database.getUserById(id);
    
    if (!user) {
      throw new ApiError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404);
    }
    
    const response: IApiResponse<IUser> = {
      success: true,
      message: 'User retrieved successfully',
      data: user,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  })
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user by ID
 * @access  Public
 */
router.put(
  '/:id',
  validateRequest(UpdateUserSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = IdParamSchema.parse(req.params);
    const updateData = req.body;
    
    // Check if email is being updated and if it already exists
    if (updateData.email) {
      const emailExists = database.userExistsByEmail(updateData.email, id);
      if (emailExists) {
        throw new ApiError(ErrorCodes.EMAIL_ALREADY_EXISTS, 'Email already exists', 409);
      }
    }
    
    const updatedUser = database.updateUser(id, updateData);
    
    const response: IApiResponse<IUser> = {
      success: true,
      message: 'User updated successfully',
      data: updatedUser!,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  })
);

/**
 * @route   PATCH /api/users/:id
 * @desc    Partially update user by ID
 * @access  Public
 */
router.patch(
  '/:id',
  validateRequest(UpdateUserSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = IdParamSchema.parse(req.params);
    const updateData = req.body;
    
    // Check if email is being updated and if it already exists
    if (updateData.email) {
      const emailExists = database.userExistsByEmail(updateData.email, id);
      if (emailExists) {
        throw new ApiError(ErrorCodes.EMAIL_ALREADY_EXISTS, 'Email already exists', 409);
      }
    }
    
    const updatedUser = database.updateUser(id, updateData);
    
    const response: IApiResponse<IUser> = {
      success: true,
      message: 'User updated successfully',
      data: updatedUser!,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  })
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user by ID
 * @access  Public
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = IdParamSchema.parse(req.params);
    
    // Check if user exists before deletion
    const user = database.getUserById(id);
    if (!user) {
      throw new ApiError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404);
    }
    
    const deleted = database.deleteUser(id);
    
    if (!deleted) {
      throw new ApiError(ErrorCodes.DATABASE_ERROR, 'Failed to delete user', 500);
    }
    
    const response: IApiResponse<{ deletedUser: IUser }> = {
      success: true,
      message: 'User deleted successfully',
      data: { deletedUser: user },
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  })
);

/**
 * @route   POST /api/users/:id/toggle-status
 * @desc    Toggle user active status
 * @access  Public
 */
router.post(
  '/:id/toggle-status',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = IdParamSchema.parse(req.params);
    
    const user = database.getUserById(id);
    if (!user) {
      throw new ApiError(ErrorCodes.USER_NOT_FOUND, 'User not found', 404);
    }
    
    const updatedUser = database.updateUser(id, { isActive: !user.isActive });
    
    const response: IApiResponse<IUser> = {
      success: true,
      message: `User status ${updatedUser!.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedUser!,
      timestamp: new Date().toISOString(),
    };
    
    res.json(response);
  })
);

/**
 * @route   GET /api/users/search/:term
 * @desc    Search users by term (firstName, lastName, email)
 * @access  Public
 */
router.get(
  '/search/:term',
  validateQuery(UserFiltersSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { term } = req.params;
    const filters = { ...req.query, search: term } as any;
    
    const { users, total } = database.getUsers(filters);
    
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalPages = Math.ceil(total / limit);
    
    const paginatedResponse: IApiResponse<IPaginatedResponse<IUser>> = {
      success: true,
      message: `Search results for "${term}"`,
      data: {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      timestamp: new Date().toISOString(),
    };
    
    res.json(paginatedResponse);
  })
);

export default router; 