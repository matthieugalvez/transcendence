import { CommonComponent } from './common.component';
import { UserSearchComponent } from './usersearch.component';
import { router } from '../configs/simplerouter';

export class TournamentComponent {
  /**
  * Affiche un overlay pour sélectionner exactement 4 utilisateurs existants.
  * Appelle `onComplete` avec la liste de leurs displayNames.
  */
  static async showPlayerSelection(
    container: HTMLElement,
    onComplete: (players: string[]) => void
  ) {
    container.innerHTML = '';
    const overlay = document.createElement('div');
    overlay.className = `
      absolute inset flex flex-col items-center justify-center
      bg-black/70 p-6 space-y-4 z-20 w-[60%] h-full
    `;
    container.appendChild(overlay);

    const title = document.createElement('h2');
    title.textContent = '⬇️ Choose 4 registered players ⬇️';
    title.className = `
      text-white text-2xl mb-4 font-['Orbitron']
    `;
    overlay.appendChild(title);

    const slots: { user?: string; elem: HTMLElement }[] = [];
    for (let i = 0; i < 4; i++) {
      const slot = document.createElement('div');
      slot.className = 'w-full mb-2';
      overlay.appendChild(slot);
      slots.push({ elem: slot });

      // rendre la search et resultats
      function renderSearchUI() {
        slot.innerHTML = '';
        const searchSection = document.createElement('div');
        slot.appendChild(searchSection);
        UserSearchComponent.render(searchSection, (user) => {
          // verif si deja selectionner
          const already = slots.some((s, idx) => idx !== i && s.user === user.displayName);
          if (already) {
			CommonComponent.showMessage("User alreadly selected!", 'error');
            // alert("User already selected!");
            return;
          }
          // on sélectionne
          slots[i].user = user.displayName;
          checkReady();
          renderSelectedUI(user);
        });
      }
      // UI une fois qu’on a sélectionné
      function renderSelectedUI(user: { displayName: string; avatar: string; id: string }) {
        slot.innerHTML = '';
        const pill = document.createElement('div');
        pill.className = 'flex items-center justify-between p-2 bg-purple-900/60 text-white rounded';
        pill.innerHTML = `
          <span>${user.displayName}</span>
        `;
        const deselectBtn = document.createElement('button');
        deselectBtn.textContent = 'Deselect';
        deselectBtn.className = 'ml-4 px-2 py-1 bg-red-600 rounded hover:bg-red-700';
        deselectBtn.addEventListener('click', () => {
          slots[i].user = undefined;
          checkReady();
          renderSearchUI();
        });
        pill.appendChild(deselectBtn);
        slot.appendChild(pill);
      }
      // // pour chaque slot, on rend un UserSearchComponent et on récupère la sélection
      // UserSearchComponent.render(slot, async (user) => {
      //   slots[i].user = user.displayName;
      //   checkReady();
      // });
      renderSearchUI();
    }

    const startBtn = document.createElement('button');
    startBtn.textContent = 'Launch tournament';
    startBtn.disabled = true;
    startBtn.className = `
      bg-purple-600 text-white
      font-['Orbitron']
      font-semibold
      border-2 border-black
      py-2 px-12
      rounded-lg text-lg transition-colors
      focus:outline-none focus:ring-2
      shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
      disabled:opacity-50 disabled:cursor-not-allowed
    `;
    overlay.appendChild(startBtn);

    function checkReady() {
      const allSelected = slots.every(s => typeof s.user === 'string');
      startBtn.disabled = !allSelected;
    }

    startBtn.onclick = () => {
      const players = slots.map(s => s.user!) as string[];
      overlay.remove();
      onComplete(players);
    };
  }

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
      backdrop-blur-2xl z-50 w-[35%] h-[23%]
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
      const info = document.createElement('p');
      info.textContent = `Going to your stats…`;
      info.className = `
          text-lg text-gray-300
          font-["Orbitron"]
          border-2 border-black
          py-2 px-12
          mt-4
          bg-blue-500
          rounded-lg text-lg transition-colors
          focus:outline-none focus:ring-2
          shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
      `;
      setTimeout(() => {
        window.dispatchEvent(new Event('app:close-sockets'));
        router.navigate('/statistics');
      }, 2000);
      transition.appendChild(info);
    }

    gameContainer.appendChild(transition);
    const canvas = gameContainer.querySelector('canvas');
    if (canvas) canvas.classList.add('blur-xs');

    setTimeout(() => {
      if (canvas) canvas.classList.remove('blur-xs');
      transition.remove();
      if (i < matchups.length - 1) onNext();
    }, 4000);
  }
}
