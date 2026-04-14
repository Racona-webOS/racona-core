import type { BetterAuthOptions } from 'better-auth';
import db from '$lib/server/database';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '@racona/database/schemas';
import { config } from '$lib/config';
import { eq } from 'drizzle-orm';
import { customSession } from 'better-auth/plugins';
import { EmailManager } from '$lib/server/email/manager';
import { EmailTemplateType } from '$lib/server/email/types';

/**
 * Közös Better Auth konfiguráció, amely minden környezetben használható.
 * Ez tartalmazza az összes alapvető beállítást, de nem tartalmaz SvelteKit-specifikus pluginokat.
 */
export const baseAuthConfig: Omit<BetterAuthOptions, 'plugins'> = {
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			...schema
		},
		debugLogs: false,
		usePlural: true
	}),
	account: {
		modelName: 'account',
		fields: {
			accountId: 'providerAccountId'
		}
	},
	trustedOrigins: [
		'http://localhost:5173',
		'http://127.0.0.1:5173',
		...(process.env.NODE_ENV === 'development'
			? ['http://10.8.0.33:5173', 'http://192.168.*:5173']
			: [])
	],
	advanced: {
		database: {
			generateId: false
		},
		cookiePrefix: config.SESSION_COOKIE_PREFIX
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: config.FEATURES.EMAIL_VERIFICATION_ENABLED,
		disableSignUp: !config.REGISTRATION_ENABLED,
		sendResetPassword: async ({ user, url, token }) => {
			console.log('[Auth] sendResetPassword called for user:', user.email);
			console.log('[Auth] Reset URL:', url);

			const emailManager = new EmailManager();

			const result = await emailManager.sendTemplatedEmail({
				to: user.email,
				template: EmailTemplateType.PASSWORD_RESET,
				data: {
					name: user.name || user.email.split('@')[0],
					email: user.email,
					resetLink: url,
					appName: config.APP_NAME,
					expirationTime: '1 óra'
				}
			});

			console.log('[Auth] Email send result:', result);

			if (!result.success) {
				console.error('[Auth] Failed to send password reset email:', result.error);
				throw new Error('Email küldése sikertelen');
			}

			console.log('[Auth] Password reset email sent successfully');
		}
	},
	emailVerification: {
		autoSignInAfterVerification: config.FEATURES.AUTO_SIGNIN_AFTER_VERIFICATION,
		sendVerificationEmail: async ({ user, url, token }) => {
			const emailManager = new EmailManager();

			const result = await emailManager.sendTemplatedEmail({
				to: user.email,
				template: EmailTemplateType.EMAIL_VERIFICATION,
				data: {
					name: user.name || user.email.split('@')[0],
					email: user.email,
					verificationUrl: url,
					token: token,
					appName: config.APP_NAME,
					expirationTime: '24 óra'
				}
			});

			if (!result.success) {
				throw new Error('Email küldése sikertelen');
			}
		},
		async afterEmailVerification(user) {
			// Your custom logic here, e.g., grant access to premium features
			console.log(user);
			const emailManager = new EmailManager();

			const baseUrl = config.APP_URL || 'http://localhost:3000';
			const templateData = {
				name: user.name,
				email: user.email,
				appName: config.APP_NAME,
				dashboardUrl: `${baseUrl}/`,
				userId: 'test-user-id'
			};

			const result = await emailManager.sendTemplatedEmail({
				to: user.email,
				template: EmailTemplateType.WELCOME,
				data: templateData
			});

			if (!result.success) {
				throw new Error('Email küldése sikertelen');
			}
		}
	},
	socialProviders: {
		google: {
			//accessType: 'offline',
			//prompt: 'select_account consent',
			clientId: config.GOOGLE_CLIENT_ID as string,
			clientSecret: config.GOOGLE_CLIENT_SECRET as string
		}
	},
	databaseHooks: {
		session: {
			create: {
				before: async (session) => {
					/** Mielott letrejon az uj session, toroljuk a felhasznalo meglevo sessionjeit.
					 * Ez megakadalyozza, hogy parhuzamosan be legyen jelentkezve.
					 */
					await db
						.delete(schema.sessions)
						.where(eq(schema.sessions.userId, parseInt(session.userId)));
				}
			}
		},
		user: {
			create: {
				after: async (user) => {
					// Ha OAuth regisztráció és van kép, mentsük el az oauthImage mezőbe is
					if (user.image) {
						await db
							.update(schema.users)
							.set({ oauthImage: user.image })
							.where(eq(schema.users.id, parseInt(user.id)));
					}
				}
			}
		}
	}
};

/**
 * Közös custom session plugin, amely minden környezetben használható.
 */
export const baseCustomSessionPlugin = customSession(async ({ user, session }) => {
	const roles = {
		admin: false,
		user: false
	};

	// Lekérjük a teljes user adatokat az oauthImage mezővel együtt
	const fullUser = await db
		.select({
			oauthImage: schema.users.oauthImage
		})
		.from(schema.users)
		.where(eq(schema.users.id, parseInt(user.id)))
		.limit(1);

	return {
		roles,
		user: {
			...user,
			oauthImage: fullUser[0]?.oauthImage || null
		},
		session
	};
});
