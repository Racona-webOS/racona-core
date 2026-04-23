<script lang="ts">
	import Logo from '$lib/assets/logo.mp4';
	interface Props {
		width: number;
		loop?: boolean;
	}

	let { width, loop = false }: Props = $props();
</script>

<video src={Logo} style="width: {width}px;" autoplay {loop} muted playsinline class="object-contain"
></video>
