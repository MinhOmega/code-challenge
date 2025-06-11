import { z } from 'zod';

/**
 * User entity interface representing the database structure
 */
export interface IUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  department: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User creation payload (without auto-generated fields)
 */
export interface ICreateUser {
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  department: string;
  isActive?: boolean;
}

/**
 * User update payload (all fields optional except id)
 */
export interface IUpdateUser {
  email?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  department?: string;
  isActive?: boolean;
}

/**
 * Query filters for listing users
 */
export interface IUserFilters {
  department?: string;
  isActive?: boolean;
  minAge?: number;
  maxAge?: number;
  search?: string; // Search in firstName, lastName, or email
  page?: number;
  limit?: number;
  sortBy?: 'id' | 'email' | 'firstName' | 'lastName' | 'age' | 'department' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response interface
 */
export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Standard API response interface
 */
export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Zod validation schemas for request validation
 */
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  age: z.number().int().min(18, 'Age must be at least 18').max(100, 'Age must be less than 100'),
  department: z.string().min(1, 'Department is required').max(100, 'Department name too long'),
  isActive: z.boolean().optional().default(true),
});

export const UpdateUserSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  firstName: z.string().min(1, 'First name cannot be empty').max(50, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name cannot be empty').max(50, 'Last name too long').optional(),
  age: z.number().int().min(18, 'Age must be at least 18').max(100, 'Age must be less than 100').optional(),
  department: z.string().min(1, 'Department cannot be empty').max(100, 'Department name too long').optional(),
  isActive: z.boolean().optional(),
});

export const UserFiltersSchema = z.object({
  department: z.string().optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
  minAge: z.string().transform((val) => parseInt(val, 10)).optional(),
  maxAge: z.string().transform((val) => parseInt(val, 10)).optional(),
  search: z.string().optional(),
  page: z.string().transform((val) => Math.max(1, parseInt(val, 10) || 1)).optional(),
  limit: z.string().transform((val) => Math.min(100, Math.max(1, parseInt(val, 10) || 10))).optional(),
  sortBy: z.enum(['id', 'email', 'firstName', 'lastName', 'age', 'department', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Error types for better error handling
 */
export enum ErrorCodes {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export class ApiError extends Error {
  constructor(
    public code: ErrorCodes,
    public message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
} 