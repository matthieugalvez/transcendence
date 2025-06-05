import './styles.css'
import { router } from './configs/simplerouter'
import { signup } from './pages/Signup'
import { renderHomePage } from './pages/HomePage'

// Register routes
router.register('/', signup)
router.register('/home', renderHomePage)

// Start the router
router.start()