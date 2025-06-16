export class BackgroundComponent {
	/**
	 * Apply animated gradient background to the page
	 */
	static applyAnimatedGradient(): void {
		// Reset all body styles first
		this.resetBodyStyles();

		// Remove any existing background elements
		this.removeExistingBackgrounds();

		// Create the main gradient background layer with HomePage brand colors
		const gradientLayer = document.createElement('div');
		gradientLayer.className = `
      absolute inset-0
      bg-gradient-to-br from-[#7101b2] via-[#8217c1] to-[#ffae45f2]
      animate-gradient
      bg-[length:400%_400%]
    `.replace(/\s+/g, ' ').trim();
		gradientLayer.id = 'gradient-background';

		// Create the overlay patterns container
		const overlayContainer = document.createElement('div');
		overlayContainer.className = 'absolute inset-0 opacity-30';
		overlayContainer.id = 'overlay-patterns';

		// Create first overlay pattern (top-left purple)
		const purpleOverlay = document.createElement('div');
		purpleOverlay.className = `
      absolute top-0 left-0
      bg-[#7101b2] rounded-full
      w-96 h-96
      mix-blend-overlay filter blur-3xl
      animate-pulse
    `.replace(/\s+/g, ' ').trim();

		// Create second overlay pattern (bottom-right orange)
		const orangeOverlay = document.createElement('div');
		orangeOverlay.className = `
      absolute bottom-0 right-0
      bg-[#ffae45] rounded-full
      w-96 h-96
      mix-blend-overlay filter blur-3xl
      animate-pulse
    `.replace(/\s+/g, ' ').trim();

		// Assemble the overlay patterns
		overlayContainer.appendChild(purpleOverlay);
		overlayContainer.appendChild(orangeOverlay);

		// Insert background layers as first children of body
		document.body.insertBefore(overlayContainer, document.body.firstChild);
		document.body.insertBefore(gradientLayer, document.body.firstChild);

		// Set body to relative positioning
		document.body.style.position = 'relative';
		document.body.style.minHeight = '100vh';
	}

	/**
	 * Apply brand-themed animated gradient (matching HomePage text colors)
	 */
	static applyBrandGradient(): void {
		// Reset all body styles first
		this.resetBodyStyles();

		// Remove any existing background elements
		this.removeExistingBackgrounds();

		// Create the main gradient background layer with exact HomePage brand colors
		const gradientLayer = document.createElement('div');
		gradientLayer.className = `
      absolute inset-0
      bg-gradient-to-br from-[#7101b2] via-[#8217c1] to-[#ffae45f2]
      animate-gradient
      bg-[length:400%_400%]
    `.replace(/\s+/g, ' ').trim();
		gradientLayer.id = 'gradient-background';

		// Create the overlay patterns container with brand colors
		const overlayContainer = document.createElement('div');
		overlayContainer.className = 'absolute inset-0 opacity-25';
		overlayContainer.id = 'overlay-patterns';

		// Create first overlay pattern (top-left deep purple)
		const purpleOverlay = document.createElement('div');
		purpleOverlay.className = `
      absolute top-10 left-10
      bg-[#7101b2] rounded-full
      w-80 h-80
      mix-blend-overlay filter blur-3xl
      animate-pulse
    `.replace(/\s+/g, ' ').trim();

		// Create second overlay pattern (bottom-right orange)
		const orangeOverlay = document.createElement('div');
		orangeOverlay.className = `
      absolute bottom-10 right-10
      bg-[#ffae45] rounded-full
      w-72 h-72
      mix-blend-overlay filter blur-3xl
      animate-pulse
    `.replace(/\s+/g, ' ').trim();

		// Create third overlay pattern (center medium purple)
		const mediumPurpleOverlay = document.createElement('div');
		mediumPurpleOverlay.className = `
      absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2
      bg-[#8217c1] rounded-full
      w-64 h-64
      mix-blend-overlay filter blur-3xl
      animate-pulse
    `.replace(/\s+/g, ' ').trim();

		// Create fourth overlay pattern (offset light orange)
		const lightOrangeOverlay = document.createElement('div');
		lightOrangeOverlay.className = `
      absolute top-1/4 right-1/3 transform translate-x-1/2 -translate-y-1/2
      bg-[#ffae45f2] rounded-full
      w-56 h-56
      mix-blend-overlay filter blur-3xl
      animate-pulse
    `.replace(/\s+/g, ' ').trim();

		// Assemble the overlay patterns
		overlayContainer.appendChild(purpleOverlay);
		overlayContainer.appendChild(orangeOverlay);
		overlayContainer.appendChild(mediumPurpleOverlay);
		overlayContainer.appendChild(lightOrangeOverlay);

		// Insert background layers as first children of body
		document.body.insertBefore(overlayContainer, document.body.firstChild);
		document.body.insertBefore(gradientLayer, document.body.firstChild);

		// Set body to relative positioning
		document.body.style.position = 'relative';
		document.body.style.minHeight = '100vh';
	}

	/**
	 * Apply centered layout for auth-style pages with animated background
	 */
	static applyCenteredGradientLayout(): void {
		this.applyBrandGradient();
		document.body.style.display = "flex";
		document.body.style.alignItems = "center";
		document.body.style.justifyContent = "center";
		document.body.style.minHeight = "100vh";
	}

	/**
	 * Apply normal layout for home-style pages with animated background
	 */
	static applyNormalGradientLayout(): void {
		this.applyBrandGradient();
		document.body.style.display = "";
		document.body.style.alignItems = "";
		document.body.style.justifyContent = "";
	}

	// ... rest of the existing methods remain the same ...

	/**
	 * Remove all background elements
	 */
	static removeExistingBackgrounds(): void {
		const existingGradient = document.getElementById('gradient-background');
		const existingOverlay = document.getElementById('overlay-patterns');

		if (existingGradient) {
			existingGradient.remove();
		}
		if (existingOverlay) {
			existingOverlay.remove();
		}
	}

	/**
	 * Reset all body styles to default
	 */
	static resetBodyStyles(): void {
		document.body.style.backgroundColor = "";
		document.body.style.backgroundImage = "";
		document.body.style.backgroundSize = "";
		document.body.style.backgroundBlendMode = "";
		document.body.style.minHeight = "";
		document.body.style.display = "";
		document.body.style.alignItems = "";
		document.body.style.justifyContent = "";
		document.body.style.flexDirection = "";
		document.body.style.position = "";
		document.body.className = '';
	}
}