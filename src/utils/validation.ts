import { z } from 'zod'

// Input sanitization utility
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>"/\\&]/g, '') // Remove potentially dangerous characters
    .slice(0, 255) // Limit length
}

// Validation schemas using Zod
export const userRegistrationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Please enter a valid email address')
    .max(100, 'Email must be less than 100 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  userType: z.enum(['creator', 'business']),
  companyName: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.userType === 'business') {
    return data.companyName && data.companyName.trim().length > 0
  }
  return true
}, {
  message: "Company name is required for business accounts",
  path: ["companyName"],
})

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

export const bountySchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  budget: z.number()
    .min(1, 'Budget must be at least $1')
    .max(100000, 'Budget must be less than $100,000'),
  category: z.string().min(1, 'Please select a category'),
  requirements: z.array(z.string()).min(1, 'At least one requirement is needed'),
  deadline: z.date().min(new Date(), 'Deadline must be in the future')
})

// Validation helper function
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  try {
    const result = schema.parse(data)
    return { success: true, data: result, errors: null }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.issues.reduce((acc: Record<string, string>, err) => {
          const path = err.path.join('.')
          acc[path] = err.message
          return acc
        }, {})
      }
    }
    return { success: false, data: null, errors: { general: 'Validation failed' } }
  }
}