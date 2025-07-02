import { CommonComponent } from './common.component';
import { validatePlayerNames } from '../utils/player.utils';
import { router } from '../configs/simplerouter';

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
    static render(state: SettingState = 'initial', callbacks: GameSettingsCallbacks = {}) {
        const existing = document.getElementById(GameSettingsComponent.panelId);
        if (existing) existing.remove();

        GameSettingsComponent.currentMode = state;

        // create panel
        const settingsBar = document.createElement("nav");
        settingsBar.id = GameSettingsComponent.panelId;
        settingsBar.className = `
            fixed right-30 top-63 h-[56%] w-80
            bg-blue-950/70 backdrop-blur-2xl
            rounded-lg text-lg transition-colors
            shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
            border-2 border-black
            flex flex-col items-center p-6 space-y-4 z-15
        `.trim();

        // title
        const title = document.createElement('h2');
        title.className
        title.textContent = "Game Settings";
        title.className = 'font-["Canada-big"] uppercase mb-4 text-white text-2xl';
        settingsBar.appendChild(title);

        // 1. SOLO
        if (state === 'solo') {
            // Play/Pause/Restart
            settingsBar.appendChild(GameSettingsComponent.renderPlayPauseRestart(callbacks));

            // Bouton Start
            const startBtn = CommonComponent.createStylizedButton('Start Game', 'red');
            startBtn.classList.add('w-full');
            startBtn.onclick = () => callbacks.onStartGame?.('solo', GameSettingsComponent.currentDifficulty);
            settingsBar.appendChild(startBtn);

            // Difficulté
            // settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks));
        }

        // 1.5 SOLO SANS START
        if (state === 'solo-start') {
            // Play/Pause/Restart
            settingsBar.appendChild(GameSettingsComponent.renderPlayPauseRestart(callbacks));

            // Difficulté
            // settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks));
        }

        // 2. DUO
        if (state === 'duo') {
            // Choix local/online
            const chooseMode = document.createElement('div');
            chooseMode.className = 'flex flex-col w-full space-y-4';

            const localBtn = CommonComponent.createStylizedButton('Local', 'red');
            localBtn.onclick = () => GameSettingsComponent.render('duo-local', callbacks);

            const onlineBtn = CommonComponent.createStylizedButton('Online', 'orange');
            onlineBtn.onclick = () => callbacks.onStartGame?.('duo-online');

            chooseMode.appendChild(localBtn);
            chooseMode.appendChild(onlineBtn);
            settingsBar.appendChild(chooseMode);
        }

        // 2.5
        if (state === 'duo-guest') {
            // Play/Pause
            settingsBar.appendChild(GameSettingsComponent.renderPlayPause(callbacks));

            // Difficulté
            settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks));
        }

        // 3. DUO LOCAL
        if (state === 'duo-local') {
            settingsBar.appendChild(GameSettingsComponent.renderPlayPauseRestart(callbacks));
            const startBtn = CommonComponent.createStylizedButton('Start Game', 'red');
            startBtn.classList.add('w-full');
            startBtn.onclick = () => callbacks.onStartGame?.('duo-local', GameSettingsComponent.currentDifficulty);
            settingsBar.appendChild(startBtn);
            settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks));
        }

        // 4. DUO ONLINE
        if (state === 'duo-online') {
            settingsBar.appendChild(GameSettingsComponent.renderPlayPauseRestart(callbacks));
            // Lien de jeu online
            const link = callbacks.getOnlineLink?.() ?? '';
            const linkBox = document.createElement('div');
            linkBox.className = 'flex flex-col items-center w-full mt-4';
            const copyBtn = CommonComponent.createStylizedButton('Copy Game Link', 'orange');
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(link);
                callbacks.onCopyLink?.(link);
                copyBtn.textContent = 'Copied!';
                setTimeout(() => (copyBtn.textContent = 'Copy Link'), 1200);
            };
            linkBox.appendChild(copyBtn);
            settingsBar.appendChild(linkBox);

            const startBtn = CommonComponent.createStylizedButton('Start Game', 'red');
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
            settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks));
        }

        // 4. TOURNOI
        if (state === 'tournament') {
            // Choix local/online
            const chooseMode = document.createElement('div');
            chooseMode.className = 'flex flex-col w-full space-y-4';

            const localBtn = CommonComponent.createStylizedButton('Local', 'red');
            localBtn.onclick = () => router.navigate('/tournament');

            const onlineBtn = CommonComponent.createStylizedButton('Online', 'orange');
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
            const copyBtn = CommonComponent.createStylizedButton('Copy Game Link', 'orange');
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(link);
                callbacks.onCopyLink?.(link);
                copyBtn.textContent = 'Copied!';
                setTimeout(() => (copyBtn.textContent = 'Copy Link'), 1200);
            };
            linkBox.appendChild(copyBtn);
            settingsBar.appendChild(linkBox);

            const startBtn = CommonComponent.createStylizedButton('Start Game', 'red');
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
            settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks));
        }

        if (state === 'tournament-alias') {
            // Titre
            const title = document.createElement('h2');
            title.textContent = "⬇️ Enter player names for the tournament ⬇️";
            title.className = 'font-["Canada-big"] capitalize mb-4 text-white text-2xl justify-center items-center';
            settingsBar.appendChild(title);

            // Inputs
            const inputs: HTMLInputElement[] = [];
            for (let i = 1; i <= 4; i++) {
                const inp = document.createElement('input');
                inp.type = 'text';
                inp.placeholder = `Player ${i}`;
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
            const startButton = CommonComponent.createStylizedButton('Start Tournament', 'blue');
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
                const startBtn = CommonComponent.createStylizedButton('Start Tournament', 'red');
                startBtn.classList.add('w-full');
                startBtn.onclick = () => {
                    GameSettingsComponent.tournamentStarted = true;
                    callbacks.onStartGame?.('tournament-settings');
                    // Re-render pour faire disparaitre le bouton
                    GameSettingsComponent.render('tournament-settings', callbacks);
                };
                settingsBar.appendChild(startBtn);
            }

            // Difficulté
            settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks));
        }
        document.body.appendChild(settingsBar);
    }

    /**
     * buttons in settings bar
     */
    static renderDifficultyBtns(callbacks: GameSettingsCallbacks) {
        const diffBox = document.createElement('div');
        diffBox.className = 'mt-auto flex flex-col w-full space-y-3 mb-2';

        const diffs: { label: string; color: 'blue' | 'purple' | 'gray' }[] = [
            { label: 'EASY', color: 'blue' },
            { label: 'MEDIUM', color: 'purple' },
            { label: 'HARD', color: 'gray' },
        ];
        diffs.forEach(({ label, color }) => {
            const btn = CommonComponent.createStylizedButton(label, color);
            if (label === GameSettingsComponent.currentDifficulty) {
                btn.classList.add('opacity-100', 'ring-2', 'ring-yellow-400');
            }
            btn.onclick = () => {
                GameSettingsComponent.currentDifficulty = label;
                callbacks.onDifficultyChange?.(label);
                // Refresh buttons pour mettre à jour l'état visuel
                GameSettingsComponent.render(GameSettingsComponent.currentMode, callbacks);
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
}
