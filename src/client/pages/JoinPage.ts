// ./pages/online-join.ts
import { startPongInContainer, showGameOverOverlay } from '../utils/game.utils';
import { SidebarComponent } from "../components/sidebar.component";
import { BackgroundComponent } from '../components/background.component';

export async function renderJoinPage(params) {
  const { gameId } = params;

  document.body.innerHTML = '';
  document.title = 'Pong - Online';

  SidebarComponent.render({ userName: '', showStats:false, showBackHome:true });
  BackgroundComponent.applyNormalGradientLayout();

  // Wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'flex min-h-screen w-full items-center justify-center';
  document.body.appendChild(wrapper);

  // Tu peux afficher "Waiting..." le temps de charger
  const waiting = document.createElement('div');
  waiting.className = 'text-white text-2xl p-10';
  waiting.textContent = "Waiting for another player to join...";
  wrapper.appendChild(waiting);

  // Option: bouton "Rejoindre la partie" si tu veux un vrai flow
  const joinBtn = document.createElement('button');
  joinBtn.textContent = "Join Game";
  joinBtn.className = "bg-blue-500 text-white px-8 py-4 rounded-lg mt-4";
  joinBtn.onclick = () => {
    waiting.remove();
    joinBtn.remove();
    const container = document.createElement('div');
    wrapper.appendChild(container);
    startPongInContainer(
      container,
      "Player 2 vs Player 1", // tu adaptes les noms selon qui rejoint
      "Player 2",
      "Player 1",
      (winnerAlias) => showGameOverOverlay(wrapper, winnerAlias, () => renderJoinPage(params)),
      gameId
    ).start();
  };
  wrapper.appendChild(joinBtn);
}
