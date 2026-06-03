import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .max(128),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(20).optional(),
  // Self-registration is limited to user/worker; admins are provisioned out-of-band.
  role: z.enum(['user', 'worker']).default('user'),
  // Workers must specify their vehicle type at registration.
  vehicle: z.enum(['bike', 'motorbike', 'car', 'van', 'foot']).optional(),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});
export type RefreshDto = z.infer<typeof refreshSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(10, 'Password must be at least 10 characters').max(128),
});
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
