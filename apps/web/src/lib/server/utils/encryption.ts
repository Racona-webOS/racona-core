/**
 * Encryption Utility
 *
 * Titkosítja és visszafejti az érzékeny adatokat (pl. API key-ek).
 * AES-256-GCM algoritmust használ.
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Encryption key az environment változóból
const ENCRYPTION_KEY =
	process.env.ENCRYPTION_KEY || 'default-encryption-key-change-me-in-production';

/**
 * Titkosít egy szöveget
 * @param text A titkosítandó szöveg
 * @returns A titkosított szöveg (base64 formátumban, iv:encrypted:authTag)
 */
export async function encrypt(text: string): Promise<string> {
	// Generálunk egy véletlenszerű IV-t (Initialization Vector)
	const iv = randomBytes(16);

	// Generálunk egy kulcsot a jelszóból
	const key = (await scryptAsync(ENCRYPTION_KEY, 'salt', 32)) as Buffer;

	// Létrehozzuk a cipher-t
	const cipher = createCipheriv('aes-256-gcm', key, iv);

	// Titkosítjuk a szöveget
	let encrypted = cipher.update(text, 'utf8', 'hex');
	encrypted += cipher.final('hex');

	// Lekérjük az auth tag-et
	const authTag = cipher.getAuthTag();

	// Visszaadjuk az IV, encrypted text és auth tag kombinációját
	return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
}

/**
 * Visszafejt egy titkosított szöveget
 * @param encryptedText A titkosított szöveg (iv:encrypted:authTag formátumban)
 * @returns Az eredeti szöveg
 */
export async function decrypt(encryptedText: string): Promise<string> {
	// Szétbontjuk az IV, encrypted text és auth tag részekre
	const parts = encryptedText.split(':');
	if (parts.length !== 3) {
		throw new Error('Invalid encrypted text format');
	}

	const [ivHex, encrypted, authTagHex] = parts;
	const iv = Buffer.from(ivHex, 'hex');
	const authTag = Buffer.from(authTagHex, 'hex');

	// Generálunk egy kulcsot a jelszóból
	const key = (await scryptAsync(ENCRYPTION_KEY, 'salt', 32)) as Buffer;

	// Létrehozzuk a decipher-t
	const decipher = createDecipheriv('aes-256-gcm', key, iv);
	decipher.setAuthTag(authTag);

	// Visszafejtjük a szöveget
	let decrypted = decipher.update(encrypted, 'hex', 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}

/**
 * Maszkolja az API key-t megjelenítéshez (csak az első 4 és utolsó 4 karaktert mutatja)
 * @param apiKey Az API key
 * @returns A maszkolt API key (pl. "sk-1234...5678")
 */
export function maskApiKey(apiKey: string): string {
	if (apiKey.length <= 8) {
		return '****';
	}
	const start = apiKey.substring(0, 4);
	const end = apiKey.substring(apiKey.length - 4);
	return `${start}${'*'.repeat(Math.min(apiKey.length - 8, 20))}${end}`;
}
