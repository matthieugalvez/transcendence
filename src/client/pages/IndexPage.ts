import '../styles.css';
import { router } from '../configs/simplerouter';
import paddleImg from '../assets/logo.png';
import profil1 from '../assets/profilpic/profilpic1.png';
import profil2 from '../assets/profilpic/profilpic2.png';
import profil3 from '../assets/profilpic/proflipic3.png';
import bgEffect from '../assets/effects/otis-redding.png';
import { BackgroundComponent } from '../components/background.component';

export function renderIndexPage(): void {
  document.title = "Transcendence - Index";
  document.body.innerHTML = '';

  BackgroundComponent.applyNormalGradientLayout();

  // —————————————————————————————————————————
  //  HERO
  // —————————————————————————————————————————
  const hero = document.createElement('section');
  hero.id = "accueil";
  hero.className = `
    text-center px-[2%] pb-[3%] pt-0
    rounded-b-[40px]
    border-b-2 border-[#e0e0e0]
    bg-[#F6F4F2] bg-blend-multiply bg-[url('otis-redding.png')]
    relative
  `;
  hero.style.backgroundImage = `url(${bgEffect})`;
  hero.style.backgroundBlendMode = 'multiply';

  const h1 = document.createElement('h1');
  h1.textContent = 'Transcendence.';
  h1.className = `
    font-['Canada-big']
    uppercase font-bold pt-10 mx-auto text-[clamp(1.8rem,9.7vw,16rem)] leading-[1] w-[90%]
    bg-gradient-to-r from-[#7101b2] to-[#ffae45f2] bg-clip-text text-transparent
    leading-[1.1]
    select-none
  `;
  hero.appendChild(h1);
  document.body.appendChild(hero);

  // —————————————————————————————————————————
  //  BOTTOM PAGE
  // —————————————————————————————————————————
  const bottomPage = document.createElement('section');
  bottomPage.className = 'bottom-page w-full relative mt-0 pb-2 min-h-[45vh]';

  // —————————————————————————————————————————
  //  RAQUETTE
  // —————————————————————————————————————————
  const paddle = document.createElement('img');
  paddle.src = paddleImg;
  paddle.alt = 'raquette ping pong';
  paddle.className = `
    absolute z-30 cursor-pointer
    right-[22%] top-[-45%]
    w-[1600px] max-w-[60vw]
    drop-shadow-[0_14px_24px_#63007399]
    transition-transform hover:scale-105
  `;
  paddle.onclick = () => router.navigate('/auth');
  bottomPage.appendChild(paddle);

  // —————————————————————————————————————————
  //  STATS USER + KEYWORDS
  // —————————————————————————————————————————
  const little = document.createElement('section');
  little.id = 'little';
  little.className = `
    font-['Orbitron']
    flex flex-row justify-between items-center
    text-right px-[3%] py-[5vh] relative z-10
    text-white
  `;

  // —————————————————————————————————————————
  //  USERS
  // —————————————————————————————————————————
  const users = document.createElement('div');
  users.className = 'flex flex-col justify-center items-start mb-5 pl-2';

  const userpic = document.createElement('div');
  userpic.id = 'userpic';
  userpic.className = 'flex flex-row items-center mb-1';

  [profil1, profil2, profil3].forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'profil-pic' + (i + 1);
    img.className = `
      w-[55px] h-[55px] rounded-full border-4 border-white
      object-cover bg-white shadow-[0_2px_8px_#0002]
      transition-all duration-200
      ${i === 0 ? '' : 'ml-[-15px]'}
    `;
    userpic.appendChild(img);
  });

  const userText = document.createElement('p');
  userText.textContent = '1000+ Players';
  userText.className = 'text-sm font-medium ml-3';

  users.appendChild(userpic);
  users.appendChild(userText);

  // —————————————————————————————————————————
  //  KEYWORDS/STATS
  // —————————————————————————————————————————
  const keywords = document.createElement('div');
  keywords.className = 'flex flex-col items-end text-right';

  const keywordText = document.createElement('p');
  keywordText.innerHTML = `
    <span class="block text-lg font-bold">Fast-Paced</span>
    <span class="block text-lg font-bold">Competitive</span>
    <span class="block text-lg font-bold">Multiplayer</span>
  `;
  keywords.appendChild(keywordText);

  little.appendChild(users);
  little.appendChild(keywords);
  bottomPage.appendChild(little);
  document.body.appendChild(bottomPage);
}