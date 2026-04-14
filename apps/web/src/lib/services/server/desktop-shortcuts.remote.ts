import { command, getRequestEvent } from '$app/server';
import * as v from 'valibot';
import db from '$lib/server/database';
import { desktopShortcuts } from '@racona/database';
import { eq, and } from 'drizzle-orm';
import type { DesktopShortcut } from '$lib/types/desktop';

const emptySchema = v.object({});

const createShortcutSchema = v.object({
	appId: v.pipe(v.string(), v.minLength(1)),
	position: v.object({
		x: v.number(),
		y: v.number()
	}),
	label: v.optional(v.nullable(v.string()))
});

const updatePositionSchema = v.object({
	id: v.pipe(v.string(), v.uuid()),
	position: v.object({
		x: v.number(),
		y: v.number()
	})
});

const updateLabelSchema = v.object({
	id: v.pipe(v.string(), v.uuid()),
	label: v.pipe(v.string(), v.minLength(1), v.maxLength(50))
});

const deleteShortcutSchema = v.object({
	id: v.pipe(v.string(), v.uuid())
});

interface ShortcutResponse {
	success: boolean;
	error?: string;
	shortcuts?: DesktopShortcut[];
	shortcut?: DesktopShortcut;
}

/**
 * Get all desktop shortcuts for the authenticated user.
 */
export const getDesktopShortcuts = command(emptySchema, async (): Promise<ShortcutResponse> => {
	const event = getRequestEvent();
	const { locals } = event;

	if (!locals.user?.id) {
		return {
			success: false,
			error: 'User not authenticated',
			shortcuts: []
		};
	}

	try {
		const userId = parseInt(locals.user.id);
		const shortcuts = await db
			.select()
			.from(desktopShortcuts)
			.where(eq(desktopShortcuts.userId, userId));

		return {
			success: true,
			shortcuts: shortcuts as DesktopShortcut[]
		};
	} catch (error) {
		console.error('[DesktopShortcuts] Error fetching shortcuts:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error',
			shortcuts: []
		};
	}
});

/**
 * Create a new desktop shortcut.
 */
export const createDesktopShortcut = command(
	createShortcutSchema,
	async ({ appId, position, label }): Promise<ShortcutResponse> => {
		const event = getRequestEvent();
		const { locals } = event;

		if (!locals.user?.id) {
			return {
				success: false,
				error: 'User not authenticated'
			};
		}

		try {
			const userId = parseInt(locals.user.id);
			// Get max order for new shortcut
			const existingShortcuts = await db
				.select()
				.from(desktopShortcuts)
				.where(eq(desktopShortcuts.userId, userId));

			const maxOrder = existingShortcuts.reduce((max: number, s) => Math.max(max, s.order), 0);

			const [newShortcut] = await db
				.insert(desktopShortcuts)
				.values({
					userId,
					appId,
					position,
					label: label ?? null,
					order: maxOrder + 1
				})
				.returning();

			return {
				success: true,
				shortcut: newShortcut as DesktopShortcut
			};
		} catch (error) {
			console.error('[DesktopShortcuts] Error creating shortcut:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}
);

/**
 * Update desktop shortcut position.
 */
export const updateShortcutPosition = command(
	updatePositionSchema,
	async ({ id, position }): Promise<ShortcutResponse> => {
		const event = getRequestEvent();
		const { locals } = event;

		if (!locals.user?.id) {
			return {
				success: false,
				error: 'User not authenticated'
			};
		}

		try {
			const userId = parseInt(locals.user.id);
			const [updatedShortcut] = await db
				.update(desktopShortcuts)
				.set({
					position,
					updatedAt: new Date()
				})
				.where(and(eq(desktopShortcuts.id, id), eq(desktopShortcuts.userId, userId)))
				.returning();

			if (!updatedShortcut) {
				return {
					success: false,
					error: 'Shortcut not found or access denied'
				};
			}

			return {
				success: true,
				shortcut: updatedShortcut as DesktopShortcut
			};
		} catch (error) {
			console.error('[DesktopShortcuts] Error updating shortcut position:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}
);

/**
 * Update desktop shortcut label.
 */
export const updateShortcutLabel = command(
	updateLabelSchema,
	async ({ id, label }): Promise<ShortcutResponse> => {
		const event = getRequestEvent();
		const { locals } = event;

		if (!locals.user?.id) {
			return {
				success: false,
				error: 'User not authenticated'
			};
		}

		try {
			const userId = parseInt(locals.user.id);
			const [updatedShortcut] = await db
				.update(desktopShortcuts)
				.set({
					label,
					updatedAt: new Date()
				})
				.where(and(eq(desktopShortcuts.id, id), eq(desktopShortcuts.userId, userId)))
				.returning();

			if (!updatedShortcut) {
				return {
					success: false,
					error: 'Shortcut not found or access denied'
				};
			}

			return {
				success: true,
				shortcut: updatedShortcut as DesktopShortcut
			};
		} catch (error) {
			console.error('[DesktopShortcuts] Error updating shortcut label:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}
);

/**
 * Delete a desktop shortcut.
 */
export const deleteDesktopShortcut = command(
	deleteShortcutSchema,
	async ({ id }): Promise<ShortcutResponse> => {
		const event = getRequestEvent();
		const { locals } = event;

		if (!locals.user?.id) {
			return {
				success: false,
				error: 'User not authenticated'
			};
		}

		try {
			const userId = parseInt(locals.user.id);
			const [deletedShortcut] = await db
				.delete(desktopShortcuts)
				.where(and(eq(desktopShortcuts.id, id), eq(desktopShortcuts.userId, userId)))
				.returning();

			if (!deletedShortcut) {
				return {
					success: false,
					error: 'Shortcut not found or access denied'
				};
			}

			return {
				success: true
			};
		} catch (error) {
			console.error('[DesktopShortcuts] Error deleting shortcut:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}
);
