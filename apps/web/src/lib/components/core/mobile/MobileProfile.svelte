<!--
 Mobil profil panel: felhasználó, témaváltás, asztali nézetre váltás, kijelentkezés.
 -->
<script lang="ts">
	import { Moon, Monitor, LogOut } from 'lucide-svelte';
	import { authClient } from '$lib/auth/client';
	import * as Avatar from '$lib/components/ui/avatar/index';
	import { Switch } from '$lib/components/ui/switch';
	import { getThemeManager } from '$lib/stores';
	import { switchShell } from '$lib/stores/shellMode';
	import { getDisplayedAvatar } from '$apps/settings/utils/avatar-helpers';
	import type { ProfileData } from '$lib/server/database/repositories';
	import { useI18n } from '$lib/i18n/hooks';

	const { t } = useI18n();
	const session = authClient.useSession();
	const theme = getThemeManager();

	const profileData = $derived.by((): ProfileData | null => {
		if (!$session.data) return null;
		return {
			id: parseInt($session.data.user.id),
			name: $session.data.user.name,
			email: $session.data.user.email,
			username: null,
			image: $session.data.user.image || null,
			oauthImage: ($session.data.user as any).oauthImage || null,
			oauthProvider: null,
			createdAt: new Date()
		};
	});

	const avatar = $derived(profileData ? getDisplayedAvatar(profileData) : null);

	function setDark(dark: boolean) {
		theme.setMode(dark ? 'dark' : 'light');
	}

	function signOut() {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					window.location.href = '/admin/sign-in';
				}
			}
		});
	}
</script>

{#if profileData}
	<div class="profile-card">
		<Avatar.Root class="size-14">
			{#if avatar?.url}
				<Avatar.Image src={avatar.url} referrerpolicy="no-referrer" alt="" />
			{/if}
			<Avatar.Fallback class="text-xl">{avatar?.initials || '?'}</Avatar.Fallback>
		</Avatar.Root>
		<div class="profile-text">
			<span class="profile-name">{profileData.name}</span>
			<span class="profile-email">{profileData.email}</span>
		</div>
	</div>
{/if}

<div class="settings-list">
	<label class="settings-row">
		<Moon class="size-5 shrink-0" />
		<span class="settings-label">{t('desktop.mobile.profile.darkMode')}</span>
		<Switch checked={theme.isDark} onCheckedChange={setDark} />
	</label>

	<button class="settings-row" onclick={() => switchShell('desktop')}>
		<Monitor class="size-5 shrink-0" />
		<span class="settings-label">
			{t('desktop.mobile.profile.desktopView')}
			<span class="settings-hint">{t('desktop.mobile.profile.desktopViewHint')}</span>
		</span>
	</button>

	<button class="settings-row danger" onclick={signOut}>
		<LogOut class="size-5 shrink-0" />
		<span class="settings-label">{t('desktop.startMenu.footer.signOut')}</span>
	</button>
</div>

<style>
	.profile-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.profile-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.profile-name {
		font-weight: 600;
		font-size: 1.0625rem;
	}

	.profile-email {
		overflow: hidden;
		color: var(--muted-foreground);
		font-size: 0.875rem;
		text-overflow: ellipsis;
	}

	.settings-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border);
		border-radius: 0.875rem;
		background: var(--card);
		overflow: hidden;
	}

	.settings-row {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.875rem 1rem;
		min-height: 3.5rem;
		text-align: left;

		& + .settings-row {
			border-top: 1px solid var(--border);
		}

		&:active {
			background: var(--muted);
		}

		&.danger {
			color: var(--destructive);
		}
	}

	.settings-label {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 0.125rem;
	}

	.settings-hint {
		color: var(--muted-foreground);
		font-size: 0.75rem;
	}
</style>
