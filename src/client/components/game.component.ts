import { router } from "../configs/simplerouter";
import { CommonComponent } from './common.component';

export interface GameSetOptions {
  showUrl?: boolean;
  showGamePause?: boolean;
}

export class GameSettingsComponent {
  static render(opts: GameSetOptions): HTMLDivElement {
    const { showUrl = false, showGamePause = false } = opts;
    const settingsBar = document.createElement("nav") as unknown as HTMLDivElement;
    settingsBar.className = `
        fixed right-30 top-63 h-[55%] w-80
        bg-blue-950/70 backdrop-blur-2xl
        rounded-lg text-lg transition-colors
        focus:outline-none focus:ring-2
        shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
        disabled:opacity-50 disabled:cursor-not-allowed
        border-2 border-black
        flex flex-col items-center p-6
        space-y-4 z-1
    `.trim();

    // game buttons if game launched
    if (showGamePause) {
        const selectGameSet = document.createElement('div');
        selectGameSet.className = `
            flex flex-row items-center justify-center space-x-10
        `;

        const playPauseImg = document.createElement('img');
        playPauseImg.src = "../assets/img/pause-play-button.png"
        playPauseImg.className = `
            w-10 h-auto
        `;
        playPauseImg.addEventListener('click', () => {
            // start or pause game
        });
        selectGameSet.appendChild(playPauseImg);

        const restartBtn = document.createElement('img');
        restartBtn.src = "../assets/img/restart-button.png"
        restartBtn.className = `
            w-10 h-auto
        `;
        playPauseImg.addEventListener('click', () => {
            // restart game
        });
        selectGameSet.appendChild(restartBtn);

        settingsBar.appendChild(selectGameSet);
    }

    // remote/local buttons
    const chooseMode = document.createElement('div');

    const remoteBtn = CommonComponent.createStylizedButton('Online', 'orange');
    remoteBtn.classList.add("w-full", "text-center", "cursor-pointer", "mb-5");
    remoteBtn.addEventListener('click', () => {
        chooseMode.remove();
        showUrl == true;
        showGamePause == true;
    });
    chooseMode.appendChild(remoteBtn);

    const localBtn = CommonComponent.createStylizedButton('Local', 'red');
    localBtn.classList.add("w-full", "text-center", "cursor-pointer");
    localBtn.addEventListener('click', () => {
        chooseMode.remove();
        showGamePause == true;
    });
    chooseMode.appendChild(localBtn);

    settingsBar.appendChild(chooseMode);

    // copier lien de la game si remote
    if (showUrl) {
        // rajouter lien gameId ici
        const remoteUrl = document.createElement('p');
        remoteUrl.textContent = 'Copy to play together';
        remoteUrl.className = `
        font-['Orbitron'] text-center text-white
        text-sm font-medium mb-8
        `.replace(/\s+/g, ' ').trim();
        remoteUrl.style.letterSpacing = "0.05em";
        settingsBar.appendChild(remoteUrl);
    }

    // pousse les bouttons suivants tout en bas
    const bottomContainer = document.createElement('div');
    bottomContainer.className = 'mt-auto w-full space-y-2';

    // difficulty buttons (ball speed)
    const easyDiff = CommonComponent.createStylizedButton('EASY', 'blue');
    easyDiff.classList.add("w-full", "text-center", "cursor-pointer");
    easyDiff.addEventListener('click', () => {
        // set difficulte en easy
    });
    bottomContainer.appendChild(easyDiff);

    const mediumDiff = CommonComponent.createStylizedButton('MEDIUM', 'purple');
    mediumDiff.classList.add("w-full", "text-center", "cursor-pointer");
    mediumDiff.addEventListener('click', () => {
        // set difficulte en medium
    });
    bottomContainer.appendChild(mediumDiff);

    const hardDiff = CommonComponent.createStylizedButton('HARD', 'gray');
    hardDiff.classList.add("w-full", "text-center", "cursor-pointer");
    hardDiff.addEventListener('click', () => {
        // set difficulte en hard
    });
    bottomContainer.appendChild(hardDiff);

    settingsBar.appendChild(bottomContainer);
    document.body.appendChild(settingsBar);
    return settingsBar;
  }
}