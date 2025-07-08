import '../styles.css';
import paddleImg from '../assets/logo.png';
import { BackgroundComponent } from '../components/background.component';
import { router } from '../configs/simplerouter';
import { UserService } from '../services/user.service';
const	language_obj = await UserService.GetLanguageFile();

export function renderNotFoundPage(): void {
    document.title = `${language_obj['NoFoundpage_title']}`;
    BackgroundComponent.applyNormalGradientLayout();

	// 1) Container principal fullscreen
	const container = document.createElement('div');
	container.className = `
        fixed inset-0 w-full h-full
        flex flex-col
        z-50
    `;
	//container.style.background = "radial-gradient(ellipse at center,rgb(106, 61, 240) 5%,rgb(73, 2, 139) 100%)";

	// 1.1) div pour le 404 (70% de hauteur environ)
	const big404container = document.createElement('div');
	big404container.className = `
        flex items-center justify-center w-full
        w-full h-[70vh] pt-6
    `;

	// 2) Ligne “4 – raquette – 4”
	const row = document.createElement('div');
	row.className = 'flex items-center justify-center';

	// Premier "4"
	const fourLeft = document.createElement('span');
	fourLeft.textContent = '4';
	fourLeft.className = `
        text-white text-[25rem] font-['Canada-big'] font-extrabold m-0 leading-none drop-shadow-xl'
    `;
	row.appendChild(fourLeft);

	// Image de la raquette
	const paddle = document.createElement('img');
	paddle.src = paddleImg;
	paddle.alt = 'Ping Pong Paddle';
	paddle.className = 'w-100 h-auto drop-shadow-lg p-0';
	row.appendChild(paddle);

	// Deuxième "4"
	const fourRight = document.createElement('span');
	fourRight.textContent = '4';
	fourRight.className = fourLeft.className;
	row.appendChild(fourRight);

	big404container.appendChild(row);
	container.appendChild(big404container);

    // 3) Sous-texte explicatif
    const subtitle = document.createElement('p');
    subtitle.textContent = `${language_obj['NoFoundpage_error_message']}`;
    subtitle.className = `
        font-['Orbitron']
        text-gray-200 text-lg mt-2 text-center
        leading-relaxed
        whitespace-nowrap
    `;
	subtitle.style.letterSpacing = "0.15em"; // ou 0.2em si tu veux plus espacé
	container.appendChild(subtitle);

	// 4) Bouton “Go Home”
	const btnContainer = document.createElement('div');
	btnContainer.className = 'mt-8 flex justify-center';

    const goHomeBtn = document.createElement('button');
    goHomeBtn.textContent = `${language_obj['NoFoundpage_backhome_button']}`;
    goHomeBtn.className = `
        font-['Orbitron']
        bg-blue-500 hover:bg-blue-700 text-white font-semibold
        border-2 border-black
        py-2 px-12
        rounded-lg text-lg transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-300
        shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
    `;
	goHomeBtn.style.letterSpacing = "0.2em";
	goHomeBtn.onclick = () => router.navigate('/home');
	btnContainer.appendChild(goHomeBtn);
	container.appendChild(btnContainer);

	// 5) Ajouter le container au body
	document.body.appendChild(container);
}
