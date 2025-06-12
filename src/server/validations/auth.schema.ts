import { z } from "zod";



const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[a-z]/, "Password must include at least one lowercase letter")
    .regex(/[0-9]/, "Password must include at least one number")
    .regex(/[@$!%*?&$#]/, "Password must include at least one special character");

const usernameSchema = z.string()
    .min(3, "Username must be at least 3 characters long")
    .max(12, "Username must not exceed 12 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, hyphens, and underscores")
    .refine((value) => !/^\d+$/.test(value), {
        message: "Username cannot be only numbers",
    });

// Login schema - matches your current API (name + password)
const login = z.object({
    name: z.string().min(1, "Username is required\n"),
    password: z.string().min(1, "Password is required\n")
});

// Register/Signup schema - matches your current API (name + password)
const signup = z.object({
    name: usernameSchema,
    password: passwordSchema
});



const displayNameSchema = z.string()
    .min(1, "Display name is required")
    .max(12, "Display name must not exceed 12 characters")
    .regex(/^[a-zA-Z0-9_\s-]+$/, "Display name can only contain letters, numbers, spaces, hyphens, and underscores")
    .refine((value) => value.trim().length > 0, {
        message: "Display name cannot be only whitespace",
    });

const updateDisplayName = z.object({
    displayName: displayNameSchema
});

const updatePassword = z.object({
    password: z.string()
        .min(8, "Password must be at least 8 characters long")
        .regex(/[A-Z]/, "Password must include at least one uppercase letter")
        .regex(/[a-z]/, "Password must include at least one lowercase letter")
        .regex(/[0-9]/, "Password must include at least one number")
        .regex(/[@$!%*?&$#]/, "Password must include at least one special character")
});

const signupWithDisplayName = z.object({
    name: usernameSchema,
    password: passwordSchema,
    displayName: displayNameSchema
});


const authSchema = {
    login,
    signup,
	signupWithDisplayName
}

const userSchema = {
    updateDisplayName,
    updatePassword
};

export { userSchema };

export { authSchema };