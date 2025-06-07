import '../styles.css';
import { router } from '../configs/simplerouter';
import paddleImg from '../assets/logo.png';
import profil1 from '../assets/profilpic/profilpic1.png';
import profil2 from '../assets/profilpic/profilpic2.png';
import profil3 from '../assets/profilpic/proflipic3.png';
import bgEffect from '../assets/effects/otis-redding.png';
import { BackgroundComponent } from '../components/background.component';

export function renderHomePage(): void {
  document.title = "Transcendence - Homepage";
  document.body.innerHTML = '';

  BackgroundComponent.applyNormalGradientLayout();

  // —————————————————————————————————————————
  //  NAVIGATION
  // —————————————————————————————————————————
  const header = document.createElement('header');
  header.className = 'w-full flex justify-end pt-6 pr-12 bg-[#F6F4F2]';
  header.style.backgroundImage = `url(${bgEffect})`;
  header.style.backgroundBlendMode = 'multiply';

  const nav = document.createElement('nav');
  nav.className = 'flex items-center gap-5 text-[1.2rem] overflow-visible';

  const login = document.createElement('p');
  login.textContent = 'Login';
  login.className = `
    font-['Orbitron']
    cursor-pointer hover:text-[#942b99] transition-colors
  `;
  login.onclick = () => router.navigate('/auth'); // Fixed: changed from /signup to /auth

  const btn = document.createElement('button');
  btn.textContent = 'Sign in →';
  btn.className = `
    font-['Orbitron']
    ml-6 border border-black rounded py-2 px-6 text-[1.1rem]
    bg-[#942b99] text-white
    cursor-pointer transition-transform transition-colors
    hover:bg-[#7101b2] hover:scale-110 focus:outline-none
  `;
  btn.onclick = () => router.navigate('/auth'); // Fixed: changed from /signup to /auth

  // Fixed: Uncommented these lines to actually add the nav elements
  nav.appendChild(login);
  nav.appendChild(btn);
  header.appendChild(nav);
  document.body.appendChild(header); // Fixed: Added this line

  // —————————————————————————————————————————
  //  HERO
  // —————————————————————————————————————————
  const hero = document.createElement('section');
  hero.id = "accueil";
  hero.className = `
    text-center px-[2%] pb-[3%] pt-0
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
    uppercase font-bold pt-5 mx-auto text-[9.5rem] max-w-[1400px] leading-[1]
    bg-gradient-to-r from-[#7101b2] to-[#ffae45f2] bg-clip-text text-transparent
    leading-[1.1]
    select-none
  `;
  hero.appendChild(h1);
  document.body.appendChild(hero); // Fixed: Added this line

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
    right-[22%] top-[-48%]
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
  document.body.appendChild(bottomPage); // Fixed: Added this line

  // —————————————————————————————————————————
  //  ACTION BUTTONS
  // —————————————————————————————————————————
//   const buttonContainer = document.createElement('div');
//   buttonContainer.className = 'flex flex-col gap-4 items-center mt-8 mb-8 relative z-20';

//   // Fixed: Properly declare gameButton as a local variable
//   const gameButton = document.createElement('button');
//   gameButton.textContent = 'Start Tournament';
//   gameButton.className = `
//     font-['Orbitron']
//     bg-blue-600 hover:bg-green-600 text-white font-bold
//     py-3 px-8 rounded-lg text-lg transition-colors
//     border-2 border-black shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
//   `;
//   gameButton.addEventListener('click', () => {
//     router.navigate('/tournament');
//   });

//   // Play Game button
//   const playButton = document.createElement('button');
//   playButton.textContent = 'Play Game';
//   playButton.className = `
//     font-['Orbitron']
//     bg-purple-600 hover:bg-purple-700 text-white font-bold
//     py-3 px-8 rounded-lg text-lg transition-colors
//     border-2 border-black shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
//   `;
//   playButton.addEventListener('click', () => {
//     router.navigate('/game');
//   });

//   // Login button
//   const loginButton = document.createElement('button');
//   loginButton.textContent = 'Login to Play';
//   loginButton.className = `
//     font-['Orbitron']
//     bg-gradient-to-r from-[#7101b2] to-[#942b99] hover:from-[#942b99] hover:to-[#7101b2]
//     text-white font-bold py-3 px-8 rounded-lg text-lg transition-all
//     border-2 border-black shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
//   `;
//   loginButton.addEventListener('click', () => {
//     router.navigate('/auth');
//   });

  // Add buttons to container
//   buttonContainer.appendChild(playButton);
//   buttonContainer.appendChild(gameButton);
//   buttonContainer.appendChild(loginButton);

  // Add container to body
  document.body.appendChild(buttonContainer);
}