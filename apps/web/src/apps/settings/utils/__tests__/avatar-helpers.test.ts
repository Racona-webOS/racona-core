import { describe, it, expect } from 'vitest';
import { getDisplayedAvatar, getUserInitials } from '../avatar-helpers';
import type { ProfileData } from '$lib/server/database/repositories';

describe('Avatar Helpers', () => {
	describe('getUserInitials', () => {
		it('should return first two letters of single word name', () => {
			expect(getUserInitials('John')).toBe('JO');
		});

		it('should return first letter of first two words', () => {
			expect(getUserInitials('John Doe')).toBe('JD');
		});

		it('should handle names with multiple spaces', () => {
			expect(getUserInitials('John   Doe')).toBe('JD');
		});

		it('should return single letter for single character name', () => {
			expect(getUserInitials('J')).toBe('J');
		});

		it('should return ? for empty name', () => {
			expect(getUserInitials('')).toBe('?');
		});

		it('should return ? for whitespace-only name', () => {
			expect(getUserInitials('   ')).toBe('?');
		});

		it('should handle names with more than two words', () => {
			expect(getUserInitials('John Michael Doe')).toBe('JM');
		});
	});

	describe('getDisplayedAvatar', () => {
		const baseProfile: ProfileData = {
			id: 1,
			name: 'John Doe',
			email: 'john@example.com',
			username: 'johndoe',
			image: null,
			createdAt: new Date(),
			oauthProvider: null,
			oauthImage: null
		};

		it('should prioritize custom avatar over oauth image', () => {
			const profile: ProfileData = {
				...baseProfile,
				image: 'https://example.com/custom.jpg',
				oauthImage: 'https://oauth.com/image.jpg'
			};

			const result = getDisplayedAvatar(profile);
			expect(result.type).toBe('custom');
			expect(result.url).toBe('https://example.com/custom.jpg');
		});

		it('should use oauth image when image matches oauthImage', () => {
			// Ha az image és oauthImage megegyezik, akkor OAuth típusú
			const profile: ProfileData = {
				...baseProfile,
				image: 'https://oauth.com/image.jpg',
				oauthImage: 'https://oauth.com/image.jpg'
			};

			const result = getDisplayedAvatar(profile);
			expect(result.type).toBe('oauth');
			expect(result.url).toBe('https://oauth.com/image.jpg');
		});

		it('should use oauth image when no custom avatar', () => {
			const profile: ProfileData = {
				...baseProfile,
				image: null,
				oauthImage: 'https://oauth.com/image.jpg'
			};

			const result = getDisplayedAvatar(profile);
			expect(result.type).toBe('oauth');
			expect(result.url).toBe('https://oauth.com/image.jpg');
		});

		it('should use placeholder when no custom or oauth image', () => {
			const profile: ProfileData = {
				...baseProfile,
				image: null,
				oauthImage: null,
				name: 'John Doe'
			};

			const result = getDisplayedAvatar(profile);
			expect(result.type).toBe('placeholder');
			expect(result.url).toBe(null);
			expect(result.initials).toBe('JD');
		});

		it('should use custom avatar even when empty string', () => {
			const profile: ProfileData = {
				...baseProfile,
				image: '',
				oauthImage: 'https://oauth.com/image.jpg'
			};

			// Empty string is falsy, so it should fall back to oauth
			const result = getDisplayedAvatar(profile);
			expect(result.type).toBe('oauth');
			expect(result.url).toBe('https://oauth.com/image.jpg');
		});
	});
});
