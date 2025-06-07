import '../styles.css';
import { router } from '../configs/simplerouter';
import { AuthRender } from '../renders/auth.render';
import { AuthComponent } from '../components/auth.component';
import { UserService } from '../services/user.service';
import { ApiClient } from '../utils/apiclient.utils';

let nameInput: HTMLInputElement;
let passwordInput: HTMLInputElement;
let signupButton: HTMLButtonElement;
let loginButton: HTMLButtonElement;

/**
 * Main auth page function - checks authentication and handles rendering
 */
export async function authPage(): Promise<void> {
  // Check if user is already authenticated
  try {
    const response = await ApiClient.silentFetch('/api/users/me');

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log('User already authenticated, redirecting to /home');
        router.navigate('/home');
        return;
      }
    }
  } catch (error) {
    console.log('Error checking authentication:', error);
  }

  // User is not authenticated, continue with auth page rendering
  console.log('User not authenticated, showing auth page');
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