<script lang="ts">
	import { authClient } from '$lib/auth/client';
	const session = authClient.useSession();
	import { UniversalIcon } from '$lib/components/shared';
	import * as Avatar from '$lib/components/ui/avatar/index';
	import { Button } from '$lib/components/ui/button';
	import { useI18n } from '$lib/i18n/hooks';
	import { getDisplayedAvatar } from '$apps/settings/utils/avatar-helpers';
	import type { ProfileData } from '$lib/server/database/repositories';
	import { getAppByName } from '$lib/services/client/appRegistry';
	import type { WindowManager } from '$lib/stores';
	import { getShellInfo, switchShell } from '$lib/stores/shellMode';

	let { windowManager, onClose }: { windowManager: WindowManager; onClose?: () => void } = $props();
	const { t } = useI18n();

	// Telefonon, kézzel választott asztali nézetből vissza lehet váltani a mobilra
	const shell = getShellInfo();
	const canSwitchToMobile = shell.deviceType === 'mobile' && shell.mode === 'desktop';

	// Konvertáljuk a session user-t ProfileData formátumra
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

	const displayedAvatar = $derived(profileData ? getDisplayedAvatar(profileData) : null);

	const handleOpenProfile = async () => {
		const settingsApp = await getAppByName('settings');
		if (settingsApp) {
			windowManager.openWindow(settingsApp.appName, settingsApp.title, settingsApp, {
				section: 'profile'
			});
			onClose?.();
		}
	};
	const handleSignOut = () => {
		authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					window.location.href = '/admin/sign-in';
				}
			}
		});
	};
</script>

<div class="footer">
	<div class="footer-left">
		{#if $session.data && displayedAvatar}
			<button class="btn-user-profile" onclick={handleOpenProfile}>
				<Avatar.Root class="size-11">
					{#if displayedAvatar.url}
						<Avatar.Image src={displayedAvatar.url} referrerpolicy="no-referrer" alt="" />
					{/if}
					<Avatar.Fallback class="text-xl">{displayedAvatar.initials || '?'}</Avatar.Fallback>
				</Avatar.Root>
				<div class="user-info transition-colors duration-200">
					<span>{$session.data.user.name}</span>
					<span class="user-email transition-colors duration-200">{$session.data.user.email}</span>
				</div>
			</button>
		{/if}
	</div>
	<div class="footer-right">
		{#if canSwitchToMobile}
			<Button
				variant="outline"
				size="icon"
				title={t('desktop.mobile.mobileView')}
				aria-label={t('desktop.mobile.mobileView')}
				onclick={() => switchShell('mobile')}
			>
				<UniversalIcon icon="Smartphone" size={16} />
			</Button>
		{/if}
		<Button
			variant="destructive"
			class="btn-click-effect mx-2 flex items-center gap-2"
			onclick={handleSignOut}
		>
			<UniversalIcon icon="Power" size={16} class="btn-power" />
			{t('desktop.startMenu.footer.signOut')}
		</Button>
	</div>
</div>

<style>
	.btn-user-profile {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
		text-align: left;
	}

	.user-info {
		display: flex;
		flex-direction: column;
		color: var(--color-foreground);
		line-height: 1.2;

		& .user-email {
			color: --alpha(var(--color-foreground) / var(--alpha-50));
		}

		&:hover {
			color: var(--primary);

			& .user-email {
				color: --alpha(var(--primary) / var(--alpha-50));
			}
		}
	}

	.footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-top: 1px solid var(--color-border);
		background-color: var(--primary-500-alpha-80);
		padding: 20px 0 0 0;
		color: var(--neutral-100);
		font-size: 0.8rem;

		.footer-left {
			display: flex;
			align-items: center;
			gap: 10px;
		}
	}
</style>
