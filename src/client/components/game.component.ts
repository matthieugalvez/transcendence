import { CommonComponent } from './common.component';

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
    | 'duo-online';

// pour changer logique de jeu
interface GameSettingsCallbacks {
    onStartGame?: (mode: SettingState, difficulty?: string) => void;
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
            fixed right-30 top-63 h-[55%] w-80
            bg-blue-950/70 backdrop-blur-2xl
            rounded-lg text-lg transition-colors
            shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
            border-2 border-black
            flex flex-col items-center p-6 space-y-4 z-10
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
            settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks));
        }

        // 1.5 SOLO SANS START
        if (state === 'solo-start') {
            // Play/Pause/Restart
            settingsBar.appendChild(GameSettingsComponent.renderPlayPauseRestart(callbacks));

            // Difficulté
            settingsBar.appendChild(GameSettingsComponent.renderDifficultyBtns(callbacks));
        }

         // 2. DUO
        if (state === 'duo') {
            // Choix local/online
            const chooseMode = document.createElement('div');
            chooseMode.className = 'flex flex-col w-full space-y-4';

            const localBtn = CommonComponent.createStylizedButton('Local', 'red');
            // localBtn.onclick = () => callbacks.onStartGame?.('duo-local', GameSettingsComponent.currentDifficulty);
            localBtn.onclick = () => GameSettingsComponent.render('duo-local', callbacks);

            const onlineBtn = CommonComponent.createStylizedButton('Online', 'orange');
            onlineBtn.onclick = () => GameSettingsComponent.render('duo-online', callbacks);

            chooseMode.appendChild(localBtn);
            chooseMode.appendChild(onlineBtn);
            settingsBar.appendChild(chooseMode);
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
            // const urlInput = document.createElement('input');
            // urlInput.value = link;
            // urlInput.readOnly = true;
            // urlInput.className = 'w-full text-center px-2 py-1 mb-2 rounded text-white whitespace-normal';
            // linkBox.appendChild(urlInput);
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
            // a mettre plus tard : callbacks.canStart && !callbacks.canStart()
            let canStart = false;
            if (canStart == false) {
                startBtn.disabled = true;
                startBtn.classList.add('opacity-40', 'cursor-not-allowed');
            }
            startBtn.onclick = () => callbacks.onStartGame?.('duo-online', GameSettingsComponent.currentDifficulty);
            settingsBar.appendChild(startBtn);
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
        playPauseImg.src = '../assets/img/pause-play-button.png';
        playPauseImg.className = 'w-10 h-auto cursor-pointer';
        playPauseImg.onclick = () => callbacks.onPauseGame?.();

        const restartBtn = document.createElement('img');
        restartBtn.src = '../assets/img/restart-button.png';
        restartBtn.className = 'w-10 h-auto cursor-pointer';
        restartBtn.onclick = () => callbacks.onRestartGame?.();

        setBox.appendChild(playPauseImg);
        setBox.appendChild(restartBtn);

        return setBox;
    }
}
