import { renderTournamentPage } from '../pages/TournamentPage';
import { validatePlayerNames } from '../utils/player.utils';
import { CommonComponent } from './common.component';

export class TournamentComponent {
  static showTransitionPanel(
    gameContainer: HTMLElement,
    i: number,
    matchups: [string, string][],
    winnerAlias: string,
    winners: string[],
    onNext: () => void
  ) {
    const transition = document.createElement('div');
    transition.style.backgroundColor = "#530196";
    transition.className = `
      absolute flex flex-col items-center justify-center p-8
      backdrop-blur-2xl z-20 w-[28%] h-[22%]
      border-2 border-black
      whitespace-nowrap
      rounded-lg
      shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
    `;
    // Message principal
    const winnerMsg = document.createElement('h2');
    if (i === matchups.length - 1)
      winnerMsg.textContent = "Tournament finished! 🏆";
    else
      winnerMsg.textContent = `${winnerAlias} wins this match!`;
    winnerMsg.className = 'font-["Canada-big"] uppercase mb-4 text-white text-2xl';
    transition.appendChild(winnerMsg);

    // Sous message / prochain match ou résultat final
    let nextMatchMsg = '';
    if (i < matchups.length - 1) {
      const [nextLeft, nextRight] = 
        i + 1 === 2
          ? [winners[0], winners[1]]
          : matchups[i + 1];
      nextMatchMsg = `Next Match : ${nextLeft} VS ${nextRight}`;
    } else {
      nextMatchMsg = `${winnerAlias} wins!`;
    }
    const nextMsg = document.createElement('p');
    nextMsg.textContent = nextMatchMsg;
    nextMsg.className = `font-["Orbitron"] text-white mt-2 text-xl`;
    transition.appendChild(nextMsg);

    // Bouton play again si dernier match
    if (i === matchups.length - 1) {
      const replayBtn = CommonComponent.createStylizedButton('Play again', 'orange');
      replayBtn.classList.add('mt-4');
      replayBtn.onclick = () => renderTournamentPage();
      transition.appendChild(replayBtn);
    }

    gameContainer.appendChild(transition);
    const canvas = gameContainer.querySelector('canvas');
    if (canvas) canvas.classList.add('blur-xs');

    setTimeout(() => {
      if (canvas) canvas.classList.remove('blur-xs');
      if (i < matchups.length - 1) onNext();
    }, 4000);
  }
}
