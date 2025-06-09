// Crée et retourne le conteneur principal centré
export function createTournamentContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'bg-gray-100 min-h-screen flex flex-col items-center justify-center p-8';
  document.body.appendChild(container);
  return container;
}

// Ajoute un titre h1 dans le conteneur
export function appendTournamentTitle(container: HTMLDivElement, text: string): void {
  const title = document.createElement('h1');
  title.textContent = text;
  title.className = 'text-2xl font-bold mb-6';
  container.appendChild(title);
}

// Crée N inputs pour saisir les alias, les ajoute dans le conteneur, et retourne le tableau de ces inputs
export function createAliasInputs(container: HTMLDivElement, count: number): HTMLInputElement[] {
  const inputs: HTMLInputElement[] = [];
  for (let i = 1; i <= count; i++) {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = `Joueur ${i}`;
    inp.className =
      'border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4 w-64';
    container.appendChild(inp);
    inputs.push(inp);
  }
  return inputs;
}

// Crée et retourne le bouton "Start Tournament" (désactivé/masqué par défaut)
export function createStartButton(container: HTMLDivElement): HTMLButtonElement {
  const startButton = document.createElement('button');
  startButton.textContent = 'Start Tournament';
  startButton.className =
    'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg transition-colors mb-4';
  startButton.disabled = true;
  startButton.style.display = 'none';
  container.appendChild(startButton);
  return startButton;
}

// Vérifie si tous les inputs sont renseignés, active/affiche ou désactive/cache le bouton
export function setupStartButtonLogic(
  inputs: HTMLInputElement[],
  startButton: HTMLButtonElement
): void {
  function checkAllFilled() {
    const tousValides = inputs.every((inp) => inp.value.trim().length > 0);
    if (tousValides) {
      startButton.disabled = false;
      startButton.style.display = 'block';
    } else {
      startButton.disabled = true;
      startButton.style.display = 'none';
    }
  }

  inputs.forEach((inp, index) => {
    inp.addEventListener('input', checkAllFilled);
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && inp.value.trim().length > 0) {
        e.preventDefault(); // empêche le rechargement
        if (index < inputs.length - 1) {
          inputs[index + 1].focus();
        } else {
          checkAllFilled();
          if (!startButton.disabled) {
            startButton.click();
          }
        }
      }
    });
  });
}

// Renvoie un gameId en appelant POST /api/game/start
export async function requestNewGameId(): Promise<string> {
  const res = await fetch('/api/game/start', { 
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = (await res.json()) as { success: boolean; gameId: string };
  if (!data.success) throw new Error('Impossible de démarrer la partie côté serveur');
  return data.gameId;
}
