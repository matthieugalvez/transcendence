// C'est l'equivalent de notre MAIN en gros, on recupere le code et on le route au bon endroit grace a simpler router.
// C'est un peu temporaire je pense qu'il faut le mettre dans le back peut etre.


import { router } from './configs/simplerouter.ts';
import { renderHomePage  } from './pages/HomePage.ts';
import { signup } from './pages/Signup.ts'

// donc / redirige vers signup et /home vers renderHomePage

router.register('/', signup);
router.register ('/home', renderHomePage);
router.start();