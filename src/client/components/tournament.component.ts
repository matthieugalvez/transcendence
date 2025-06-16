import { renderTournamentPage } from '../pages/TournamentPage';
import { validatePlayerNames } from '../utils/player.utils';
import { CommonComponent } from './common.component';

export class TournamentComponent {
  // static showAliasOverlay(
  //   canvas: HTMLCanvasElement | null,
  //   wrapper: HTMLElement,
  //   onSubmit: (aliases: string[]) => void
  // ) {
  //   const overlay = document.createElement('div');
  //   overlay.style.backgroundColor = "#362174";
  //   overlay.className = `
  //     absolute flex flex-col items-center justify-center
  //     backdrop-blur-2xl z-10 w-[30%] h-[45%]
  //     border-2 border-black
  //     rounded-lg
  //     shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
  //   `;
  //   wrapper.appendChild(overlay);

  //   // Blur le canvas pendant la saisie
  //   if (canvas) canvas.classList.add('blur-xs');

  //   // Titre
  //   const title = document.createElement('h1');
  //   title.textContent = 'Enter name to begin tournament:';
  //   title.className = 'text-2xl text-white font-["Canada-big"] capitalize mb-6';
  //   overlay.appendChild(title);

  //   // Inputs
  //   const inputs: HTMLInputElement[] = [];
  //   for (let i = 1; i <= 4; i++) {
  //     const inp = document.createElement('input');
  //     inp.type = 'text';
  //     inp.placeholder = `Player ${i}`;
  //     inp.className = `
  //       border border-purple-500 rounded-lg px-4 py-2
  //       text-lg text-white font-['Orbitron']
  //       focus:outline-none focus:ring-2 focus:ring-purple-500
  //       mb-4 w-64
  //     `;
  //     overlay.appendChild(inp);
  //     inputs.push(inp);
  //   }

  //   // Bouton start
  //   const startButton = CommonComponent.createStylizedButton('Start Tournament','blue');
  //   startButton.disabled = true;
  //   startButton.style.display = 'none';
  //   overlay.appendChild(startButton);

  //   // Message d’erreur
  //   let errorMsg = document.createElement('p');
  //   errorMsg.className = "text-sm text-red-500 mb-2";
  //   overlay.appendChild(errorMsg);

  //   // Validation dynamique
  //   function checkAllValid() {
  //     const aliases = inputs.map(inp => inp.value.trim());
  //     const { valid, error } = validatePlayerNames(...aliases);
  //     if (valid) {
  //       startButton.disabled = false;
  //       startButton.style.display = 'block';
  //       errorMsg.textContent = '';
  //     } else {
  //       startButton.disabled = true;
  //       startButton.style.display = 'none';
  //       errorMsg.textContent = error || '';
  //     }
  //   }
  //   inputs.forEach((inp, index) => {
  //     inp.addEventListener('input', checkAllValid);
  //     inp.addEventListener('keydown', (e) => {
  //       if (e.key === 'Enter' && inp.value.trim().length > 0) {
  //         e.preventDefault();
  //         if (index < inputs.length - 1) {
  //           inputs[index + 1].focus();
  //         } else {
  //           checkAllValid();
  //           if (!startButton.disabled) startButton.click();
  //         }
  //       }
  //     });
  //   });

  //   startButton.onclick = () => {
  //     overlay.remove();
  //     if (canvas) canvas.classList.remove('blur-xs');
  //     onSubmit(inputs.map(inp => inp.value.trim()));
  //   };
  // }

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
