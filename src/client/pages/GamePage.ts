// import '../styles.css';
// import { BackgroundComponent } from '../components/background.component';
// import { startPongInContainer } from './game/utils';
// import { SidebarComponent } from "../components/sidebar.components";
// import { UserService } from '../services/user.service';
// import { CommonComponent } from '../components/common.component';
// import { router } from '../configs/simplerouter';

// export async function renderGamePage() {
//   document.title = 'Pong';

//   // sidebar + bg gradient
//   const user = await UserService.getCurrentUser();
//   SidebarComponent.render({
//         userName: user.name,
//         showStats: true,
//         showBackHome: true
//   });
//   BackgroundComponent.applyNormalGradientLayout();

//   // 1) Conteneur principal centré
//   const container = document.createElement('div');
//   container.className = `
//     ml-60
//     w-[calc(100%-15rem)]
//     min-h-screen 
//     flex
//       flex-col 
//       items-center 
//       justify-center 
//     p-8
//   `.replace(/\s+/g,' ').trim()
//   container.style.position = 'relative';
//   container.style.zIndex = '0';
//   document.body.appendChild(container);

//   // bouton Start
//   const startBtn = CommonComponent.createStylizedButton('Start', 'blue');
//   startBtn.classList.add("my-5");
//   container.appendChild(startBtn);

//   // bouton Tournament
//   const tourBtn = CommonComponent.createStylizedButton('Tournament', 'purple');
//   tourBtn.onclick = () => router.navigate('/tournament');
//   container.appendChild(tourBtn);

//   // 2) canva du jeu en dessous
//   const canvas = document.createElement('canvas');
//   canvas.width = 800;
//   canvas.height = 600;
//   canvas.className = 'border-4 border-blue-500 rounded-md';
//   container.appendChild(canvas);

//   // 2) Générer un gameId unique (par exemple à partir de la date courante)
//   const gameId = Date.now().toString();

//   // startBtn.addEventListener('click', () => {
//   //   // on masque les boutons
//   //   tourBtn.remove();
//   //   startBtn.remove();
//   //   // on lance le Pong
//   //   startPongInContainer(
//   //     container,
//   //     'Player 1 vs Player 2',
//   //     'Player 1',
//   //     'Player 2',
//   //     (winner) => showGameOverOverlay(container, winner, () => {
//   //       // replay callback : reload la page ou relance la partie
//   //       renderGamePage();
//   //     }),
//   //     gameId
//   //   );
//   // });

//   // 3) Appeler l’utilitaire pour ouvrir la WebSocket et démarrer le rendu
//   startPongInContainer(
//     container,
//     'Player 1 vs Player 2',
//     'Player 1',
//     'Player 2',
//     (winnerAlias: string) => {
//       // Ici on efface et on affiche le message final
//       container.innerHTML = '';
//       const msg = document.createElement('h2');
//       msg.textContent = `Le gagnant est : ${winnerAlias} !`;
//       msg.className = 'text-3xl font-bold text-center mt-8';
//       container.appendChild(msg);
//     },
//     gameId
//   );
// }
import '../styles.css';
import { BackgroundComponent } from '../components/background.component';
import { startPongInContainer } from './game/utils';
import { SidebarComponent } from "../components/sidebar.components";
import { UserService } from '../services/user.service';
import { CommonComponent } from '../components/common.component';
import { router } from '../configs/simplerouter';

export async function renderGamePage() {
  document.title = 'Pong';
  const user = await UserService.getCurrentUser();
  SidebarComponent.render({ userName: user.name, showStats:true, showBackHome:true });
  BackgroundComponent.applyNormalGradientLayout();

  const wrapper = document.createElement('div');
  wrapper.className = `
    ml-60 w-[calc(100%-15rem)] min-h-screen flex items-center justify-center p-8 relative
  `.replace(/\s+/g,' ').trim();
  document.body.appendChild(wrapper);

  const gameContainer = document.createElement('div');
  gameContainer.className = 'relative z-0';
  wrapper.appendChild(gameContainer);

  // initialise sans lancer
  const gameId = Date.now().toString();
  const { start } = startPongInContainer(
    gameContainer,
    'Player 1 vs Player 2',
    'Player 1',
    'Player 2',
    (winnerAlias: string) => showGameOverOverlay(wrapper, winnerAlias, renderGamePage),
    gameId
  );

  // overlay de contrôles
  const controls = document.createElement('div');
  controls.className = `
    absolute flex flex-col items-center justify-center
    space-y-4 z-10
  `.replace(/\s+/g,' ').trim();
  wrapper.appendChild(controls);

  const startBtn = CommonComponent.createStylizedButton('Start','blue');
  startBtn.onclick = () => {
    controls.remove(); // cache les boutons
    start();
  };
  controls.appendChild(startBtn);

  const tourBtn = CommonComponent.createStylizedButton('Tournament','purple');
  tourBtn.onclick = () => router.navigate('/tournament');
  controls.appendChild(tourBtn);
}

// overlay de fin de partie
function showGameOverOverlay(
  parent: HTMLElement,
  winner: string,
  onReplay: () => void
) {
  const ov = document.createElement('div');
  ov.className = `
    absolute inset-0 flex flex-col items-center justify-center
    space-y-4 z-20
  `.replace(/\s+/g,' ').trim();
  parent.appendChild(ov);

  const pane = document.createElement('div');
  pane.className = 'bg-white/90 backdrop-blur-md p-6 rounded-lg shadow-lg text-center';
  ov.appendChild(pane);

  const msg = document.createElement('p');
  msg.textContent = `${winner} a gagné !`;
  msg.className = 'text-2xl font-bold mb-4';
  pane.appendChild(msg);

  const replay = CommonComponent.createStylizedButton('Play Again','purple');
  replay.onclick = () => {
    ov.remove();
    onReplay();
  };
  pane.appendChild(replay);
}
