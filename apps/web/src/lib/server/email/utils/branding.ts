import { env } from '$lib/env';

/**
 * Email branding configuration and utilities
 */

export interface BrandingConfig {
	appName: string;
	appUrl?: string;
	logoUrl?: string;
	useLogo: boolean;
}

/**
 * Get the base URL from various sources
 * @param requestUrl - Optional URL from the current request
 * @returns Base URL string
 */
export function getBaseUrl(requestUrl?: string | URL): string {
	// 1. Try from environment variable
	if (env.APP_URL) {
		return env.APP_URL;
	}

	// 2. Try from request URL
	if (requestUrl) {
		const url = typeof requestUrl === 'string' ? new URL(requestUrl) : requestUrl;
		return `${url.protocol}//${url.host}`;
	}

	// 3. Fallback to localhost in development
	if (env.NODE_ENV === 'development') {
		return 'http://localhost:5173';
	}

	// 4. Last resort fallback
	return env.BETTER_AUTH_URL || 'http://localhost:3000';
}

/**
 * Get branding configuration from environment variables
 * @param requestUrl - Optional URL from the current request for dynamic base URL
 */
export function getBrandingConfig(requestUrl?: string | URL): BrandingConfig {
	const baseUrl = getBaseUrl(requestUrl);

	return {
		appName: env.APP_NAME || 'Racona',
		appUrl: baseUrl,
		logoUrl: env.APP_LOGO_URL,
		useLogo: env.EMAIL_USE_LOGO || false
	};
}

/**
 * Generate app name or logo HTML for email templates
 * @param options - Optional overrides for branding config
 * @returns HTML string with app name or logo
 */
export function getAppBrandingHtml(options?: Partial<BrandingConfig>): string {
	const config = { ...getBrandingConfig(), ...options };

	// If logo is enabled and URL is provided, return logo HTML
	if (config.useLogo && config.logoUrl) {
		const logoUrl = config.logoUrl.startsWith('http')
			? config.logoUrl
			: `${config.appUrl || ''}${config.logoUrl}`;

		return `<img src="${logoUrl}" alt="${config.appName}" style="max-width: 150px; height: auto;" />`;
	}

	// Otherwise return app name as text
	return config.appName;
}

/**
 * Generate app name or logo text for plain text email templates
 * @param options - Optional overrides for branding config
 * @returns Plain text app name
 */
export function getAppBrandingText(options?: Partial<BrandingConfig>): string {
	const config = { ...getBrandingConfig(), ...options };
	return config.appName;
}

/**
 * Enrich template data with branding information
 * @param data - Original template data
 * @param requestUrl - Optional URL from the current request
 * @returns Template data with branding fields added
 */
export function enrichTemplateDataWithBranding<T extends Record<string, unknown>>(
	data: T,
	requestUrl?: string | URL
): T & {
	appName: string;
	appNameHtml: string;
	appBrandingHtml: string;
	appBrandingText: string;
	appUrl: string;
} {
	const config = getBrandingConfig(requestUrl);
	const brandingHtml = getAppBrandingHtml(config);
	const brandingText = getAppBrandingText(config);

	return {
		...data,
		// appName always stays as text (for subject lines)
		appName: config.appName,
		// appNameHtml can be logo or text (for HTML content)
		appNameHtml: brandingHtml,
		appUrl: config.appUrl || '',
		appBrandingHtml: brandingHtml,
		appBrandingText: brandingText
	};
}
