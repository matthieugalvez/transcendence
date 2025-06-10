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

export function renderTournamentPage() {
  document.title = 'Transcendence - Tournament'; // i18n var: Tournamentpage_title

  // 1) création du conteneur + titre
  const container = createTournamentContainer();
  appendTournamentTitle(container, 'Enter name to begin tournament:'); // i18n var: Tournamentpage_name_prompt

  // 2) création des 4 inputs pour les alias
  const inputs = createAliasInputs(container, 4);

  // 3) création du bouton "Start Tournament"
  const startButton = createStartButton(container);

  // 4) installation de la logique d’activation/affichage du bouton
  setupStartButtonLogic(inputs, startButton);

  // 5) quand on clique sur "Start Tournament", on lance la boucle des matchs
  startButton.addEventListener('click', () => launchTournament(inputs));
}

async function launchTournament(inputs: HTMLInputElement[]) {
  // 1) on récupère les 4 alias et on prépare la structure des matches
  const alias4 = inputs.map((inp) => inp.value.trim());
  const matchups: [string, string][] = [
    [alias4[0], alias4[1]],
    [alias4[2], alias4[3]],
    ['', ''],
  ];

  // 2) on nettoie l’écran pour afficher les matchs
  document.body.innerHTML = '';
  const winners: string[] = [];

  // 3) fonction récursive qui lance chaque match l’un après l’autre
  async function playMatch(i: number) {
    if (i >= matchups.length) {
      // tournoi terminé : on affiche un message final
      document.body.innerHTML = '';
      const finalMsg = document.createElement('h2');
      finalMsg.textContent = 'Tournament finished! 🏆'; // i18n var: Tournamentpage_finished
      finalMsg.className = 'text-3xl font-bold text-center mt-8';
      document.body.appendChild(finalMsg);
      return;
    }

    // si on est à la finale (match index 2), on remplit les alias gagnants
    if (i === 2) {
      matchups[2][0] = winners[0];
      matchups[2][1] = winners[1];
    }

    // 4) préparation du titre du match et du conteneur de jeu
    const [leftAlias, rightAlias] = matchups[i];
    const matchTitle = `Match ${i + 1} : ${leftAlias} vs ${rightAlias}`; // i18n var: Tournamentpage_match

    document.body.innerHTML = '';
    const gameContainer = document.createElement('div');
    gameContainer.className = 'flex flex-col items-center justify-center p-4';
    document.body.appendChild(gameContainer);
    
    // 5) on demande un gameId au serveur pour créer la partie
    let gameId: string;
    try {
      gameId = await requestNewGameId();
    } catch (err) {
      console.error(err);
      const errMsg = document.createElement('p');
      errMsg.textContent = 'Server error, please try again later'; // i18n var: Tournamentpage_error_server
      errMsg.className = 'text-red-600';
      document.body.appendChild(errMsg);
      return;
    }
    
    // 6) on lance le match : startPongInContainer se charge de la WS, du rendu, etc.
    startPongInContainer(
      gameContainer,
      matchTitle,
      leftAlias,
      rightAlias,
      (winnerAlias: string) => {
        setTimeout(() => {
          winners.push(winnerAlias);
          playMatch(i + 1);
        }, 4000); // laisser le temps de voir "X a gagné !" avant de passer au match suivant
      },
      gameId
    );
  }
  await playMatch(0);
}
