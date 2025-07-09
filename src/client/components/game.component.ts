import { CommonComponent } from './common.component';
import { validatePlayerNames } from '../utils/player.utils';
import { router } from '../configs/simplerouter';
import { language_obj } from '..';

export interface GameSetOptions {
	showUrl?: boolean;
	showGamePause?: boolean;
	showAll?: boolean;
}

// types d'etats pour le settingsBar
type SettingState =
	| 'initial'
	| 'solo'
	| 'solo-start'
	| 'duo'
	| 'duo-start'
	| 'duo-local'
	| 'duo-online'
	| 'tournament'
	| 'tournament-alias'
	| 'tournament-local'
	| 'tournament-online'
	| 'duo-guest'
	| 'tournament-settings';

// pour changer logique de jeu
interface GameSettingsCallbacks {
	onStartGame?: (mode: SettingState, difficulty?: string, aliases?: string[]) => void;
	onPauseGame?: () => void;
	onRestartGame?: () => void;
	onDifficultyChange?: (difficulty: string) => void;
	onCopyLink?: (link: string) => void;
	getOnlineLink?: () => string | undefined;
	canStart?: () => boolean;
}

export class GameSettingsComponent {
	static panelId = 'game-settings-bar';
	static currentDifficulty = 'MEDIUM'; // default
	static currentMode: SettingState = 'initial';
	static tournamentStarted = false;

	/**
	 *  dynamic render of settings panel
	 */
	static render(state: SettingState = 'initial', callbacks: GameSettingsCallbacks = {}): HTMLElement {
		const existing = document.getElementById(GameSettingsComponent.panelId);
		const parentContainer = existing?.parentElement; // Store the parent before removing

		if (existing) existing.remove();

		// create panel
		const settingsBar = document.createElement("nav");
		settingsBar.id = GameSettingsComponent.panelId;

		GameSettingsComponent.currentMode = state;
		if (parentContainer) {
			parentContainer.appendChild(settingsBar);
		}
		settingsBar.className = `
        w-80 h-[768px] max-h-[768-px]
        bg-blue-950/70 backdrop-blur-2xl
        rounded-lg text-lg transition-colors
        shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
        border-2 border-black
        flex flex-col items-center p-6 space-y-4 z-15
        ml-6 overflow-y-auto
    `.trim();

		// title
		const title = document.createElement('h2');
		title.className
		title.textContent = `${language_obj['Gamepage_settings']}`;
		title.className = 'font-["Canada-big"] uppercase mb-4 text-white text-2xl';
		settingsBar.appendChild(title);

		// 1. SOLO
		if (state === 'solo') {
			// Play/Pause/Restart
			settingsBar.appendChild(GameSettingsComponent.renderPlayPauseRestart(callbacks));

			// Bouton Start
			const startBtn = CommonComponent.createStylizedButton(`${language_obj['Gamepage_start_button']}`, 'red');
			startBtn.classList.add('w-full');
			startBtn.onclick = () => callbacks.onStartGame?.('solo', GameSettingsComponent.currentDifficulty);
			settingsBar.appendChild(startBtn);

			// Touches
			settingsBar.appendChild(GameSettingsComponent.renderGuide('solo'));

			// Difficulté
			// settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks));
		}

		// 1.5 SOLO SANS START
		if (state === 'solo-start') {
			// Play/Pause/Restart
			settingsBar.appendChild(GameSettingsComponent.renderPlayPauseRestart(callbacks));

			settingsBar.appendChild(GameSettingsComponent.renderGuide('solo'));
		}

		// 2. DUO
		if (state === 'duo') {
			// Choix local/online
			const chooseMode = document.createElement('div');
			chooseMode.className = 'flex flex-col w-full space-y-4';

			const localBtn = CommonComponent.createStylizedButton('Local', 'red');
			localBtn.onclick = () => {
				// Instead of just calling render, we need to trigger the callback
				callbacks.onStartGame?.('duo-local');
			};
			const onlineBtn = CommonComponent.createStylizedButton(`${language_obj['Online']}`, 'orange');
			onlineBtn.onclick = () => callbacks.onStartGame?.('duo-online');

			chooseMode.appendChild(localBtn);
			chooseMode.appendChild(onlineBtn);
			settingsBar.appendChild(chooseMode);
		}

		if (state === 'duo-start') {
			// Play/Pause/Restart
			settingsBar.appendChild(GameSettingsComponent.renderPlayPauseRestart(callbacks));
			// Guide touches
			settingsBar.appendChild(GameSettingsComponent.renderGuide('duo'));
			// Difficulté
			settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks, true));
		}

		// 2.5
		if (state === 'duo-guest') {
			// Play/Pause
			settingsBar.appendChild(GameSettingsComponent.renderPlayPause(callbacks));

			settingsBar.appendChild(GameSettingsComponent.renderGuide('solo'));
			// Difficulté
			settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks, true));
		}

		// 3. DUO LOCAL
		if (state === 'duo-local') {
			settingsBar.appendChild(GameSettingsComponent.renderPlayPauseRestart(callbacks));
			const startBtn = CommonComponent.createStylizedButton(`${language_obj['Gamepage_start_button']}`, 'red');
			startBtn.classList.add('w-full');
			startBtn.onclick = () => callbacks.onStartGame?.('duo-local', GameSettingsComponent.currentDifficulty);
			settingsBar.appendChild(startBtn);
			settingsBar.appendChild(GameSettingsComponent.renderGuide('duo'));
			settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks));
		}

		// 4. DUO ONLINE
		if (state === 'duo-online') {
			settingsBar.appendChild(GameSettingsComponent.renderPlayPauseRestart(callbacks));
			// Lien de jeu online
			const link = callbacks.getOnlineLink?.() ?? '';
			const linkBox = document.createElement('div');
			linkBox.className = 'flex flex-col items-center w-full mt-4';
			const copyBtn = CommonComponent.createStylizedButton(`${language_obj['Gamepage_game_link']}`, 'orange');
			copyBtn.onclick = () => {
				const link = callbacks.getOnlineLink?.() ?? '';

				// Use fallback method for better browser support (SAME AS TOURNAMENT)
				if (navigator.clipboard && window.isSecureContext) {
					// Modern async clipboard API
					navigator.clipboard.writeText(link).then(() => {
						callbacks.onCopyLink?.(link);
						copyBtn.textContent = `${language_obj['Gamepage_copied_link']}`;
						setTimeout(() => (copyBtn.textContent = `${language_obj['Gamepage_game_link']}`), 1200);
					}).catch(err => {
						console.error('Clipboard write failed:', err);
						// Fallback to legacy method
						GameSettingsComponent.fallbackCopyTextToClipboard(link, copyBtn, callbacks);
					});
				} else {
					// Fallback for older browsers or non-secure contexts
					GameSettingsComponent.fallbackCopyTextToClipboard(link, copyBtn, callbacks);
				}
			};
			linkBox.appendChild(copyBtn);
			settingsBar.appendChild(linkBox);

			const startBtn = CommonComponent.createStylizedButton(`${language_obj['Gamepage_start_button']}`, 'red');
			startBtn.classList.add('w-full');
			let canStart = callbacks.canStart ? callbacks.canStart() : false;
			if (!canStart) {
				startBtn.disabled = true;
				startBtn.classList.add('opacity-40', 'cursor-not-allowed');
			} else {
				startBtn.disabled = false;
				startBtn.classList.remove('opacity-40', 'cursor-not-allowed');
			}
			startBtn.onclick = () => callbacks.onStartGame?.('duo-online', GameSettingsComponent.currentDifficulty);
			settingsBar.appendChild(startBtn);
			settingsBar.appendChild(GameSettingsComponent.renderGuide('solo'));
			settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks));
		}

		// 4. TOURNOI
		if (state === 'tournament') {
			// Choix local/online
			const chooseMode = document.createElement('div');
			chooseMode.className = 'flex flex-col w-full space-y-4';

			const localBtn = CommonComponent.createStylizedButton('Local', 'red');
			localBtn.onclick = () => router.navigate('/tournament');

			const onlineBtn = CommonComponent.createStylizedButton(`${language_obj['Online']}`, 'orange');
			onlineBtn.onclick = () => callbacks.onStartGame?.('tournament-online');

			chooseMode.appendChild(localBtn);
			chooseMode.appendChild(onlineBtn);
			settingsBar.appendChild(chooseMode);
		}

		if (state === 'tournament-online') {
			settingsBar.appendChild(GameSettingsComponent.renderPlayPauseRestart(callbacks));
			// Lien de jeu online
			const link = callbacks.getOnlineLink?.() ?? '';
			const linkBox = document.createElement('div');
			linkBox.className = 'flex flex-col items-center w-full mt-4';
			const copyBtn = CommonComponent.createStylizedButton(`${language_obj['Gamepage_game_link']}`, 'orange');
			copyBtn.onclick = () => {
				const link = callbacks.getOnlineLink?.() ?? '';

				// Use fallback method for better browser support
				if (navigator.clipboard && window.isSecureContext) {
					// Modern async clipboard API
					navigator.clipboard.writeText(link).then(() => {
						callbacks.onCopyLink?.(link);
						copyBtn.textContent = `${language_obj['Gamepage_copied_link']}`;
						setTimeout(() => (copyBtn.textContent = `${language_obj['Gamepage_game_link']}`), 1200);
					}).catch(err => {
						console.error('Clipboard write failed:', err);
						// Fallback to legacy method
						GameSettingsComponent.fallbackCopyTextToClipboard(link, copyBtn, callbacks);
					});
				} else {
					// Fallback for older browsers or non-secure contexts
					GameSettingsComponent.fallbackCopyTextToClipboard(link, copyBtn, callbacks);
				}
			};
			linkBox.appendChild(copyBtn);
			settingsBar.appendChild(linkBox);

			const startBtn = CommonComponent.createStylizedButton(`${language_obj['Gamepage_start_button']}`, 'red');
			startBtn.classList.add('w-full');
			let canStart = callbacks.canStart ? callbacks.canStart() : false;
			if (!canStart) {
				startBtn.disabled = true;
				startBtn.classList.add('opacity-40', 'cursor-not-allowed');
			} else {
				startBtn.disabled = false;
				startBtn.classList.remove('opacity-40', 'cursor-not-allowed');
			}
			startBtn.onclick = () => callbacks.onStartGame?.('tournament-online', GameSettingsComponent.currentDifficulty); // test ecole
			settingsBar.appendChild(startBtn);
			settingsBar.appendChild(GameSettingsComponent.renderGuide('solo'));
			settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks));
		}

		if (state === 'tournament-alias') {
			// Titre
			const title = document.createElement('h2');
			title.textContent = `⬇️ ${language_obj['Tournamentpage_name_prompt']} ⬇️`;
			title.className = 'font-["Canada-big"] capitalize mb-4 text-white text-2xl justify-center items-center';
			settingsBar.appendChild(title);

			// Inputs
			const inputs: HTMLInputElement[] = [];
			for (let i = 1; i <= 4; i++) {
				const inp = document.createElement('input');
				inp.type = 'text';
				inp.placeholder = `${language_obj['Gamepage_player']} ${i}`;
				inp.className = `
                    border border-purple-500 rounded-lg px-4 py-2
                    text-lg text-white font-['Orbitron']
                    focus:outline-none focus:ring-2 focus:ring-purple-500
                    mb-4 w-full
                `;
				settingsBar.appendChild(inp);
				inputs.push(inp);
			}

			// Bouton Start
			const startButton = CommonComponent.createStylizedButton(`${language_obj['Tournamentpage_start']}`, 'blue');
			startButton.classList.add('w-full');
			startButton.disabled = true;
			settingsBar.appendChild(startButton);

			// Message d’erreur
			let errorMsg = document.createElement('p');
			errorMsg.className = "text-sm text-red-500 mb-2";
			settingsBar.appendChild(errorMsg);

			// Validation dynamique (utilise ta fonction existante validatePlayerNames)
			function checkAllValid() {
				const aliases = inputs.map(inp => inp.value.trim());
				const { valid, error } = validatePlayerNames(...aliases);
				if (valid) {
					startButton.disabled = false;
					errorMsg.textContent = '';
				} else {
					startButton.disabled = true;
					errorMsg.textContent = error || '';
				}
			}
			inputs.forEach((inp, index) => {
				inp.addEventListener('input', checkAllValid);
				inp.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						if (inp.value.trim().length === 0) return;
						if (index < inputs.length - 1) {
							inputs[index + 1].focus();
						} else if (!startButton.disabled) {
							startButton.click();
						}
					}
				});
			});

			startButton.onclick = () => {
				callbacks.onStartGame?.('tournament-settings', undefined, inputs.map(i => i.value.trim()));
			};
		}

		if (state === 'tournament-settings') {
			// Play/Pause/Restart
			settingsBar.appendChild(GameSettingsComponent.renderPlayPauseRestart(callbacks));
			// Start game
			if (!GameSettingsComponent.tournamentStarted) {
				const startBtn = CommonComponent.createStylizedButton(`${language_obj['Tournamentpage_start']}`, 'red');
				startBtn.classList.add('w-full');
				startBtn.onclick = () => {
					GameSettingsComponent.tournamentStarted = true;
					callbacks.onStartGame?.('tournament-settings');
					// Re-render pour faire disparaitre le bouton
					GameSettingsComponent.render('tournament-settings', callbacks);
				};
				settingsBar.appendChild(startBtn);
			}
			settingsBar.appendChild(GameSettingsComponent.renderGuide('solo'));

			// Difficulté
			settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks));
		}
		return settingsBar;
	}

	static fallbackCopyTextToClipboard(text: string, button: HTMLButtonElement, callbacks: any) {
		const textArea = document.createElement('textarea');
		textArea.value = text;
		textArea.style.position = 'fixed';
		textArea.style.left = '-999999px';
		textArea.style.top = '-999999px';
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try {
			const successful = document.execCommand('copy');
			if (successful) {
				callbacks.onCopyLink?.(text);
				button.textContent = `${language_obj['Gamepage_copied_link']}`;
				setTimeout(() => (button.textContent = `${language_obj['Gamepage_game_link']}`), 1200);
			} else {
				button.textContent = `${language_obj['Gamepage_link_copy_failure']}`;
				setTimeout(() => (button.textContent = `${language_obj['Gamepage_game_link']}`), 1200);
			}
		} catch (err) {
			console.error('Fallback copy failed:', err);
			button.textContent = `${language_obj['Gamepage_link_copy_failure']}`;
			setTimeout(() => (button.textContent = `${language_obj['Gamepage_game_link']}`), 1200);
		} finally {
			document.body.removeChild(textArea);
		}
	}

	/**
	 * buttons in settings bar
	 */
	static renderDifficultyBtns(callbacks: GameSettingsCallbacks, readOnly = false) {
		const diffBox = document.createElement('div');
		diffBox.className = 'mt-auto flex flex-col w-full space-y-3 mb-2';

		const diffs: { label: string; color: 'blue' | 'purple' | 'gray' }[] = [
			{ label: 'EASY', color: 'blue' },
			{ label: 'MEDIUM', color: 'purple' },
			{ label: 'HARD', color: 'gray' },
		];
		diffs.forEach(({ label, color }) => {
			if (readOnly && label !== GameSettingsComponent.currentDifficulty) return;
			const btn = CommonComponent.createStylizedButton(label, color);
			if (label === GameSettingsComponent.currentDifficulty) {
				btn.classList.add('opacity-100', 'ring-2', 'ring-yellow-400');
			}
			btn.onclick = () => {
				GameSettingsComponent.currentDifficulty = label;
				callbacks.onDifficultyChange?.(label);
				// Refresh buttons pour mettre à jour l'état visuel
				// GameSettingsComponent.render(GameSettingsComponent.currentMode, callbacks);
				diffBox.querySelectorAll('button').forEach(b =>
					b.classList.remove('ring-2','ring-yellow-400','opacity-100'));
				btn.classList.add('ring-2','ring-yellow-400','opacity-100');
			};
			diffBox.appendChild(btn);
		});
		return diffBox;
	}

	static renderPlayPauseRestart(callbacks: GameSettingsCallbacks) {
		const setBox = document.createElement('div');
		setBox.className = 'flex flex-row items-center justify-center space-x-8 mb-4';

		const playPauseImg = document.createElement('img');
		playPauseImg.src = '/assets/img/pause-play-button.png';
		playPauseImg.className = 'w-10 h-auto cursor-pointer';
		playPauseImg.onclick = () => callbacks.onPauseGame?.();

		const restartBtn = document.createElement('img');
		restartBtn.src = '/assets/img/restart-button.png';
		restartBtn.className = 'w-10 h-auto cursor-pointer';
		restartBtn.onclick = () => callbacks.onRestartGame?.();

		setBox.appendChild(playPauseImg);
		setBox.appendChild(restartBtn);

		return setBox;
	}

	static renderPlayPause(callbacks: GameSettingsCallbacks) {
		const setBox = document.createElement('div');
		setBox.className = 'flex flex-row items-center justify-center space-x-8 mb-4';

		const playPauseImg = document.createElement('img');
		playPauseImg.src = '/assets/img/pause-play-button.png';
		playPauseImg.className = 'w-10 h-auto cursor-pointer';
		playPauseImg.onclick = () => callbacks.onPauseGame?.();

		setBox.appendChild(playPauseImg);

		return setBox;
	}

	static renderGuide(mode: 'solo' | 'duo') {
		const heightClass = mode === 'duo' ? 'h-[70%]' : 'h-[32%]';
		/** conteneur bleu qui englobe les deux colonnes */
		const wrapper = document.createElement('div');
		wrapper.className = `
            w-full ${heightClass} p-3
            bg-blue-800/70 backdrop-blur-2xl
            rounded-lg border-2 border-black
            shadow-[4px_5px_0_rgba(0,0,0,0.8)]
            flex ${mode === 'duo' ? 'justify-between' : 'justify-center'}
        `.trim();

		/** petite fabrique pour ne pas dupliquer le code */
		const makeSide = (
			label: string,
			keyUp: string,
			keyDown: string,
			colorBg: string
		) => {
			const widthClass = mode === 'duo' ? 'w-[48%]' : 'w-[85%]';

			const box = document.createElement('div');
			box.className = `
            ${widthClass} py-4
            ${colorBg}
            rounded-lg border-2 border-black
            shadow-[4px_5px_0_rgba(0,0,0,0.8)]
            flex flex-col items-center justify-center
            space-y-2
            `.trim();

			const title = document.createElement('p');
			title.className = 'font-["Orbitron"] text-white text-center whitespace-normal';
			title.textContent = label;

			const up = document.createElement('p');
			up.className = 'text-white';
			up.innerHTML = `<span class="font-bold">${keyUp}</span> : ${language_obj['Up']}`;

			const down = document.createElement('p');
			down.className = 'text-white';
			down.innerHTML = `<span class="font-bold">${keyDown}</span> : ${language_obj['Down']}`;

			box.append(title, up, down);
			return box;
		};
		if (mode === 'duo') {
			wrapper.append(
				makeSide(`${language_obj['Left_player']}`, 'W', 'S', 'bg-amber-500/90'),
				makeSide(`${language_obj['Right_player']}`, '↑', '↓', 'bg-fuchsia-600/90')
			);
		} else {
			wrapper.append(
				makeSide(`${language_obj['Gamepage_player']}`, 'W/↑', 'S/↓', 'bg-amber-500/90'),
			);
		}
		return wrapper;
	}
}



