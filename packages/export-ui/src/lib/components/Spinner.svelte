<!-- Spinning circle shown while something is in progress -->
<span class="gl-export-spinner"></span>

<style>
	.gl-export-spinner {
		display: inline-block;
		width: 16px;
		height: 16px;
		border: 2px solid currentColor;
		border-bottom-color: transparent;
		border-radius: 50%;
		animation: rotation 0.8s linear infinite;
	}

	@keyframes rotation {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
