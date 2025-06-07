import '../styles.css';
import { router } from '../configs/simplerouter';
import paddleImg from '../assets/logo.png';
import profil1 from '../assets/profilpic/profilpic1.png';
import profil2 from '../assets/profilpic/profilpic2.png';
import profil3 from '../assets/profilpic/proflipic3.png';
import bgEffect from '../assets/effects/otis-redding.png';

export function renderHomePage(): void {
document.title = "Transcendence - Homepage";
    document.body.innerHTML = '';

  // —————————————————————————————————————————
  //  BODY : fond fixe + motif
  // —————————————————————————————————————————
  document.body.style.backgroundColor = "#8217c1";
  document.body.style.backgroundImage = `url(${bgEffect})`;
  document.body.style.backgroundSize = "60px";
  document.body.style.backgroundBlendMode = "multiply";

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
    login.onclick = () => router.navigate('/signup');

    const btn = document.createElement('button');
    btn.textContent = 'Sign in →';
    btn.className = `
        font-['Orbitron']
        ml-6 border border-black rounded py-2 px-6 text-[1.1rem]
        bg-[#942b99] text-white
        cursor-pointer transition-transform transition-colors
        hover:bg-[#7101b2] hover:scale-110 focus:outline-none
    `;
    btn.onclick = () => router.navigate('/signup');
    nav.appendChild(login);
    nav.appendChild(btn);
    header.appendChild(nav);

  // —————————————————————————————————————————
  //  HERO
  // —————————————————————————————————————————
    const hero = document.createElement('section');
    hero.id = "accueil";
    hero.className = `
        text-center px-[2%] pb-[3%] pt-0
        rounded-b-[40px] border-b-2 border-[#e0e0e0]
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
        absolute z-30 pointer-events-none
        right-[28%] top-[-45%]
        w-[700px] max-w-[47vw]
        drop-shadow-[0_14px_24px_#63007399]
    `;
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
    users.appendChild(userpic);

    const userText = document.createElement('p');
    userText.textContent = 'Users';
    userText.className = 'text-base font-thin mt-0 pt-1 pl-2';
    users.appendChild(userText);

    // KEYWORDS
    const keywords = document.createElement('div');
    keywords.id = 'keywords';
    keywords.className = `
      font-['Orbitron'] pr-2 text-right text-white text-[1rem] leading-3 space-y-4
    `;
    ['Fun /01', 'Challenge /02', 'Competitive /03'].forEach(word => {
        const h4 = document.createElement('h4');
        h4.textContent = word;
        h4.className = 'font-bold';
        keywords.appendChild(h4);
    });

    little.appendChild(users);
    little.appendChild(keywords);

    // CITATION
    // const citation = document.createElement('div');
    // citation.className = 'citation mx-auto mt-[150px] mb-4 px-12 py-4 w-fit';
    // const h5 = document.createElement('h5');
    // h5.textContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec nec auctor elit. onsectetur adipiscing elit.';
    // h5.className = 'm-2 max-w-[340px] text-white text-[1.2rem] font-light';
    // const points = document.createElement('h5');
    // points.textContent = '..................................................';
    // points.className = 'points m-2 max-w-[340px] text-white text-[1.2rem] font-light';
    // citation.appendChild(h5);
    // citation.appendChild(points);

    // ASSEMBLAGE
    bottomPage.appendChild(little);

    // AJOUT AU BODY
    document.body.appendChild(header);
    document.body.appendChild(hero);
    document.body.appendChild(bottomPage);
}
