import * as z from 'zod';

export const userSignup = z.object({
    body: z.object({
        email: z.string().email(),
        firstname: z.string(),
        lastname: z.string(),
        password: z.string().min(8).trim()
    })
});

export const resendVerificationEmail = z.object({
    query: z.object({
        email: z.string().email(),
    }),
});

export const verifyUserEmail = z.object({
    body: z.object({
        verification_code: z.number(),
    }),
});

export const forgotPassword = z.object({
    body: z.object({
        email: z.string().email(),
    }),
});

export const resetPassword = z.object({
    body: z.object({
        new_password: z.string().min(8),
        password_reset_code: z.number(),
    }),
});

export const activateUserAccount = z.object({
    query: z.object({
        email: z.string().email(),
    }),
});

export const deactivateUserAccount = z.object({
    query: z.object({
        email: z.string().email(),
    }),
});

export const requestSuperAdminAccountActivation = z.object({
    query: z.object({
        email: z.string().email(),
    }),
});

export const activateSuperAdminAccount = z.object({
    body: z.object({
        activation_code1: z.number(),
        activation_code2: z.number(),
    }),
});

export const deactivateSuperAdminAccount = z.object({
    body: z.object({
        deactivation_code1: z.number(),
        deactivation_code2: z.number(),
    }),
});

export const requestSuperAdminAccountDeactivation = z.object({
    query: z.object({
        email: z.string().email(),
    }),
});

export const login = z.object({
    body: z.object({
        email: z.string().email(), 
        password: z.string().min(8).trim(),
    })
})