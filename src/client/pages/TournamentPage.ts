import '../styles.css';
import { PongGame } from './GamePage';
import { renderGame } from './game/renderGame';
import { startPongInContainer } from './game/utils';

export function renderTournamentPage() {
    document.title = 'Tournoi';
    // 1) Container global centré
    const container = document.createElement('div');
    container.className = 'bg-gray-100 min-h-screen flex flex-col items-center justify-center p-8';
    document.body.appendChild(container);

    // 2) Titre
    const title = document.createElement('h1');
    title.textContent = 'Enter name to begin tournament:';
    title.className = 'text-2xl font-bold mb-6';
    container.appendChild(title);

    // 3) Quatre champs de saisie d’alias
    const inputs: HTMLInputElement[] = [];
    for (let i = 1; i <= 4; i++) {
        const inp = document.createElement('input');
        inp.type = 'text';
        inp.placeholder = `Joueur ${i}`;
        inp.className =
        'border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4 w-64';
        container.appendChild(inp);
        inputs.push(inp);
    }
    
    // 4) Bouton “Start” au centre (invisible tant que inscription pas faite)
    const startButton = document.createElement('button');
    startButton.textContent = 'Start Tournament';
    startButton.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg text-lg transition-colors mb-4';
    startButton.disabled = true;
    startButton.style.display = 'none';
    container.appendChild(startButton);

    // Fonction utilitaire pour vérifier si tous les inputs sont non vides
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
    // On écoute chaque input pour débloquer le bouton dès que les 4 contiennent du texte
    inputs.forEach((inp, index) => {
        // Sur chaque saisie, on vérifie si tous sont remplis
        inp.addEventListener('input', checkAllFilled);
        // Si l’utilisateur appuie sur “Entrée” et qu’il y a quelque chose dans le champ
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && inp.value.trim().length > 0) {
            e.preventDefault(); // empêche tout comportement par défaut
            // Si ce n’est pas le dernier champ, on se place dans le suivant
            if (index < inputs.length - 1) {
                inputs[index + 1].focus();
            } else {
                // Si c’est le dernier champ (4e), on déclenche le bouton si possible
                checkAllFilled();
                if (!startButton.disabled) {
                startButton.click();
                }
            }
            }
        });
        });

    // 5) Quand on clique sur “Start Tournament”
    startButton.addEventListener('click', () => {
        // Récupérer et “trimmer” les 4 alias
        const alias4 = inputs.map((inp) => inp.value.trim());

        // Construire les matchs : [alias1 vs alias2], [alias3 vs alias4]
        const matchups: [string, string][] = [
        [alias4[0], alias4[1]],
        [alias4[2], alias4[3]],
        ['', ''], // finale : on connait pas encore qui jouera
        ];

        document.body.innerHTML = '';

        // pour stocker tous les gagnants
        const winners: string[] = [];

        // Récursive pour lancer tournoi
        let currentMatch = 0;
        function launchMatch(i: number) {
            // Si i >= matchups.length, on a fait tous les matchs
            if (i >= matchups.length) {
                document.body.innerHTML = '';
                const finalMsg = document.createElement('h2');
                finalMsg.textContent = 'Tournoi terminé ! 🏆';
                finalMsg.className = 'text-3xl font-bold text-center mt-8';
                document.body.appendChild(finalMsg);
                return;
            }

            document.body.innerHTML = '';

            // Créer un conteneur centré pour le canvas
            const gameContainer = document.createElement('div');
            gameContainer.className = 'flex flex-col items-center justify-center p-4';
            document.body.appendChild(gameContainer);

            // si finale on renseigne les joueurs
            if (i == 2) {
                matchups[2][0] = winners[0];
                matchups[2][1] = winners[1];
            }

            // Récupérer les alias pour le match i
            const [leftAlias, rightAlias] = matchups[i];
            const matchTitle = `Match ${i + 1} : ${leftAlias} vs ${rightAlias}`;

            startPongInContainer(
                gameContainer,
                matchTitle,
                leftAlias,
                rightAlias,
                // callback onFinish = passer au match suivant
                (winnerAlias:string) => {
                setTimeout(() => {
                    winners.push(winnerAlias);
                    launchMatch(i + 1);
                }, 4000); // On attend 4 secondez que l’utilisateur voie “X a gagné !”
                }
            );
        }
        launchMatch(0);
    });
}
