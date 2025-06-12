import '../styles.css';
import { startPongInContainer } from './game/utils';
import {
  createTournamentContainer,
  appendTournamentTitle,
  createAliasInputs,
  createStartButton,
  setupStartButtonLogic,
  requestNewGameId,
} from './game/tournament.utils';
import { BackgroundComponent } from '../components/background.component';
import { SidebarComponent } from "../components/sidebar.component";
import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';

export async function renderTournamentPage() {
  document.title = 'Tournoi';

  document.body.innerHTML = '';

  // sidebar + bg gradient

  try {
  const user = await UserService.getCurrentUser();
  SidebarComponent.render({
    userName: user.name,
    showStats: true,
    showBackHome: true
  });
  BackgroundComponent.applyNormalGradientLayout();

  // main container
  const wrapper = document.createElement('div');
  wrapper.className = `
    ml-60 w-[calc(100%-15rem)] min-h-screen
    flex items-center justify-center
    p-8 relative
  `.replace(/\s+/g,' ').trim();
  document.body.appendChild(wrapper);

  // canva container
  const canvasContainer = document.createElement('div');
  canvasContainer.className = 'relative flex flex-col items-center justify-center';
  wrapper.appendChild(canvasContainer);

  const pongHandle = startPongInContainer(
    canvasContainer,
    '', // pas de titre au début
    'Player 1',
    'Player 2',
    () => {},
    Date.now().toString()
  );

  // overlay input alias
  const overlay = document.createElement('div');
  overlay.style.backgroundColor = "#362174";
  overlay.className = `
    absolute flex flex-col items-center justify-center
    backdrop-blur-2xl z-10 w-[35%] h-[43%]
    border-2 border-black
    rounded-lg
    shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
  `;
  wrapper.appendChild(overlay);

  // Blur sur le canvas tant que l’overlay est là
  const canvas = canvasContainer.querySelector('canvas');
  if (canvas) canvas.classList.add('blur-xs');

  // création du titre
  appendTournamentTitle(overlay, 'Enter name to begin tournament:');

  // création des 4 inputs pour les alias
  const inputs = createAliasInputs(overlay, 4);

  // création du bouton "Start Tournament"
  const startButton = createStartButton(overlay);

  // installation de la logique d’activation/affichage du bouton
  setupStartButtonLogic(inputs, startButton);

  // quand on clique sur "Start Tournament", on lance la boucle des matchs
  startButton.addEventListener('click', () => {
    overlay.remove();
    if (canvas) canvas.classList.remove('blur-xs');
    launchTournament(inputs, wrapper)
  });
} catch (error) {
	CommonComponent.handleAuthError();
}
}

async function launchTournament(inputs: HTMLInputElement[], wrapper: HTMLElement) {
  // 1) on récupère les 4 alias et on prépare la structure des matches
  const alias4 = inputs.map((inp) => inp.value.trim());
  const matchups: [string, string][] = [
    [alias4[0], alias4[1]],
    [alias4[2], alias4[3]],
    ['', ''],
  ];

  // 2) on nettoie l’écran pour afficher les matchs
  wrapper.innerHTML = '';
  const winners: string[] = [];

  // 3) fonction récursive qui lance chaque match l’un après l’autre
  async function playMatch(i: number) {
    // 4) préparation du titre du match et du conteneur de jeu
    const [leftAlias, rightAlias] = matchups[i];
    const matchTitle = `Match ${i + 1} : ${leftAlias} vs ${rightAlias}`;

    wrapper.innerHTML = '';
    const gameContainer = document.createElement('div');
    gameContainer.className = 'flex flex-col items-center justify-center p-4';
    wrapper.appendChild(gameContainer);

    // 5) on demande un gameId au serveur pour créer la partie
    let gameId: string;
    try {
      gameId = await requestNewGameId();
    } catch (err) {
      console.error(err);
      const errMsg = document.createElement('p');
      errMsg.textContent = 'Erreur serveur, réessayez plus tard';
      errMsg.className = 'text-red-600';
      document.body.appendChild(errMsg);
      return;
    }

    // 6) on lance le match : startPongInContainer se charge de la WS, du rendu, etc.
    const pongHandle = startPongInContainer(
      gameContainer,
      matchTitle,
      leftAlias,
      rightAlias,
      (winnerAlias: string) => {
        winners.push(winnerAlias);
        if (i === 1) {
            matchups[2][0] = winners[0];
            matchups[2][1] = winners[1];
        }

        const transition = document.createElement('div');
        transition.style.backgroundColor = "#362174";
        transition.className = `
          absolute flex flex-col items-center justify-center p-8
          backdrop-blur-2xl z-20 w-[30%] h-[20%]
          border-2 border-black
          whitespace-nowrap
          rounded-lg
          shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
        `;
        const winnerMsg = document.createElement('h2');
        if (i === matchups.length - 1)
          winnerMsg.textContent = "Tournament finished! 🏆";
        else
          winnerMsg.textContent = `${winnerAlias} won this match!`;
        winnerMsg.className = 'font-["Canada-big"] uppercase mb-4 text-white text-2xl';
        transition.appendChild(winnerMsg);

        // Prépare la phrase "Prochain match : ..."
        let nextMatchMsg = '';
        if (i < matchups.length - 1) {
          // Si on va vers la finale
          const [nextLeft, nextRight] =
            i + 1 === 2
              ? [winners[0], winners[1]]
              : matchups[i + 1];
          nextMatchMsg = `Next Match : ${nextLeft} VS ${nextRight}`;
        } else {
          nextMatchMsg = `${winnerAlias} won!`;
        }
        const nextMsg = document.createElement('p');
        nextMsg.textContent = nextMatchMsg;
        nextMsg.className = `
          font-["Orbitron"] text-white mt-2 text-xl
        `;
        transition.appendChild(nextMsg);
        // si dernier match bouton replay
        if (i === matchups.length - 1) {
          const replayBtn = CommonComponent.createStylizedButton('Replay', 'blue');
          replayBtn.classList.add('mt-4');
          replayBtn.onclick = () => renderTournamentPage();
          transition.appendChild(replayBtn);
        }

        gameContainer.appendChild(transition);
        const canvas = gameContainer.querySelector('canvas');
        if (canvas) canvas.classList.add('blur-xs');

        setTimeout(() => {
          if (canvas) canvas.classList.remove('blur-xs');
          // winners.push(winnerAlias);
          playMatch(i + 1);
        }, 4000);
      },
      gameId
    );
    pongHandle.start();
  }
  await playMatch(0);
}