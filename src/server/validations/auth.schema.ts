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

export const emailSchema = z.string()
	.email('Invalid email format')
	.min(5, 'Email must be at least 5 characters')
	.max(100, 'Email must be less than 100 characters')
	.toLowerCase()
	.trim();



// Login schema - matches your current API (name + password)
const login = z.object({
	email: emailSchema,  // ✅ Now expects string
	password: z.string().min(1, "Password is required")
});

const signup = z.object({
	email: emailSchema,  // ✅ Now expects string
	password: passwordSchema
});

const IMAGE_SCHEMA = z.object({
    filename: z.string(),
    mimetype: z.string().refine(
        (mimetype) => [
            "image/png",
            "image/jpeg", 
            "image/jpg",
            "image/svg+xml",
            "image/gif",
        ].includes(mimetype),
        { message: "Invalid image file type" }
    ),
    // Add size validation if needed
    // size: z.number().max(5 * 1024 * 1024, "File size must be less than 5MB")
});



const displayNameSchema = z.string()
	.min(3, "Display must be at least 3 characters long")
	.max(12, "Display name must not exceed 12 characters")
	.regex(/^[a-zA-Z0-9_\s-]+$/, "Display name can only contain letters, numbers, spaces, hyphens, and underscores")
	.refine((value) => value.trim().length > 0, {
		message: "Display name cannot be only whitespace",
	});

const updateDisplayName = z.object({
	displayName: displayNameSchema
});

const updatePicture = z.object({
	avatarSchema: IMAGE_SCHEMA
})

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
	updatePassword,
	updatePicture
};

export { userSchema };

export { authSchema };