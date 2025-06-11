import { CommonComponent } from '../../components/common.component';

// Crée et retourne le conteneur principal centré
export function createTournamentContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.className = `
    ml-60
    w-[calc(100%-15rem)]
    min-h-screen 
    flex
      flex-col 
      items-center 
      justify-center 
    p-8
  `.replace(/\s+/g,' ').trim()
  container.style.position = 'relative';
  container.style.zIndex = '0';
  document.body.appendChild(container);
  return container;
}

// Ajoute un titre h1 dans le conteneur
export function appendTournamentTitle(container: HTMLDivElement, text: string): void {
  const title = document.createElement('h1');
  title.textContent = text;
  title.className = `
    text-2xl text-white 
    font-['Canada-big']
    capitalize
    mb-6
  `;
  container.appendChild(title);
}

// Crée N inputs pour saisir les alias, les ajoute dans le conteneur, et retourne le tableau de ces inputs
export function createAliasInputs(container: HTMLDivElement, count: number): HTMLInputElement[] {
  const inputs: HTMLInputElement[] = [];
  for (let i = 1; i <= count; i++) {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.placeholder = `Player ${i}`;
    inp.className = `
      border border-purple-500 rounded-lg px-4 py-2
      text-lg text-white font-['Orbitron']
      focus:outline-none focus:ring-2 focus:ring-purple-500
      mb-4 w-64
    `;
    container.appendChild(inp);
    inputs.push(inp);
  }
  return inputs;
}

// Crée et retourne le bouton "Start Tournament" (désactivé/masqué par défaut)
export function createStartButton(container: HTMLDivElement): HTMLButtonElement {
  // const startButton = document.createElement('button');
  const startButton = CommonComponent.createStylizedButton('Start Tournament','blue');
  startButton.textContent = 'Start Tournament';
  startButton.classList.add("cursor-pointer");
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
  let errorMsg = document.createElement('p');
  errorMsg.className = "text-sm text-red-500 mb-2";
  startButton.parentElement?.appendChild(errorMsg);
  
  function checkAllFilled() {
    const aliases = inputs.map(inp => inp.value.trim().toLowerCase());
    const tousValides = inputs.every((inp) => inp.value.trim().length > 0);
    const allUnique = new Set(aliases).size === aliases.length;
    if (tousValides && allUnique) {
      startButton.disabled = false;
      startButton.style.display = 'block';
      errorMsg.textContent = '';
    } else {
      startButton.disabled = true;
      startButton.style.display = 'none';
      if (!allUnique && tousValides)
        errorMsg.textContent = 'Each player must have a unique name!';
      else
        errorMsg.textContent = '';
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
