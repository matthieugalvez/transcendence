import '../styles.css';
import { router } from '../configs/simplerouter';
import { AuthRender } from '../renders/auth.render';
import { AuthComponent } from '../components/auth.component';

let nameInput: HTMLInputElement;
let passwordInput: HTMLInputElement;
let signupButton: HTMLButtonElement;
let loginButton: HTMLButtonElement;

/**
 * Main signup page function - orchestrates rendering and event handling
 */
export function authPage(): void {
  // Render the page and get form elements
  const formElements = AuthRender.renderSignupPage();

  nameInput = formElements.nameInput;
  passwordInput = formElements.passwordInput;
  signupButton = formElements.signupButton;
  loginButton = formElements.loginButton;

  // Setup event listeners
  setupEventListeners();

  // Focus on name input
  nameInput.focus();
}

/**
 * Setup event listeners for buttons and keyboard events
 */
function setupEventListeners(): void {
  // Button click handlers
  signupButton.addEventListener('click', onSignupClick);
  loginButton.addEventListener('click', onLoginClick);

}

/**
 * Handle signup button click - includes navigation logic
 */
async function onSignupClick(): Promise<void> {
  const name = nameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!AuthComponent.validateInput(name, password)) {
    return;
  }

  const success = await AuthComponent.signupUser(name, password);

  if (success) {
    // Page-level navigation logic
    setTimeout(() => {
      router.navigate('/home');
    }, 500);
  }
}

/**
 * Handle login button click - includes navigation logic
 */
async function onLoginClick(): Promise<void> {
  const name = nameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!AuthComponent.validateInput(name, password)) {
    return;
  }

  const success = await AuthComponent.loginUser(name, password);

  if (success) {
    // Page-level navigation logic
    setTimeout(() => {
      router.navigate('/home');
    }, 500);
  }
}