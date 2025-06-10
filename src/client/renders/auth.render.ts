import logo from '../assets/logo.png';
import { CommonComponent } from '../components/common.component';

import { BackgroundComponent } from '../components/background.component';


export class AuthRender {
  /**
   * Render the complete signup/login page
   */
  static renderSignupPage(): {
    nameInput: HTMLInputElement;
    passwordInput: HTMLInputElement;
    signupButton: HTMLButtonElement;
    loginButton: HTMLButtonElement;
  } {
    // Set document title and body styles to match HomePage
 document.title = 'Transcendence - Authentication'; // i18n var: Authpage_title
    document.body.innerHTML = '';

    // Apply centered gradient layout using BackgroundComponent
    BackgroundComponent.applyCenteredGradientLayout();


    // Main container with glassmorphism
    const mainContainer = document.createElement('div');
    mainContainer.className = `
      bg-white/90 backdrop-blur-md
      border-2 border-black
      rounded-xl p-8 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
      max-w-md w-full mx-4
    `.replace(/\s+/g, ' ').trim();

    // Create and append logo
    this.createLogo(mainContainer);

    // Create and append page title
    this.createPageTitle(mainContainer);

    // Create form elements
    const formElements = this.createFormElements(mainContainer);

    // Create message display container
    this.createMessageDisplay(mainContainer);

    document.body.appendChild(mainContainer);

    return formElements;
  }

  /**
   * Create and append logo to the container
   */
  private static createLogo(container: HTMLElement): void {
    const img = document.createElement('img');
    img.src = logo;
    img.alt = 'Project Logo';
    img.className = 'w-32 h-auto mx-auto mb-4';
    container.appendChild(img);
  }

  /**
   * Create and append page title
   */
  private static createPageTitle(container: HTMLElement): void {
    const title = document.createElement('h1');
    title.textContent = 'Enter the Game'; // i18n var: Authpage_box_title
    title.className = `
      font-['Canada-big'] uppercase font-bold
      text-3xl text-center mb-2
      bg-gradient-to-r from-[#7101b2] to-[#ffae45f2]
      bg-clip-text text-transparent
      select-none
    `.replace(/\s+/g, ' ').trim();
    title.style.letterSpacing = "0.1em";

    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Join the ultimate ping pong experience'; // i18n var: Authpage_box_subtitle
    subtitle.className = `
      font-['Orbitron'] text-center text-gray-600
      text-sm font-medium mb-6
    `.replace(/\s+/g, ' ').trim();
    subtitle.style.letterSpacing = "0.05em";

    container.appendChild(title);
    container.appendChild(subtitle);
  }

  /**
   * Create form elements (inputs and buttons)
   */
  private static createFormElements(container: HTMLElement): {
    nameInput: HTMLInputElement;
    passwordInput: HTMLInputElement;
    signupButton: HTMLButtonElement;
    loginButton: HTMLButtonElement;
  } {
    const inputContainer = document.createElement('div');
    inputContainer.className = 'text-center mb-6';

    // Name input and label with gaming theme
    const nameLabel = CommonComponent.createLabel('Nickname'); // i18n var: Authpage_name_label
    const nameInput = CommonComponent.createInput('text', 'Enter your nickname'); // i18n var: Authpage_name_input

    // Password input and label with gaming theme
    const passwordLabel = CommonComponent.createLabel('Password'); // i18n var: Authpage_password_label
    const passwordInput = CommonComponent.createInput('password', 'Enter your password'); // i18n var: Authpage_password_label

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex gap-4 justify-center mt-6';

    // Create buttons with gaming theme
    const loginButton = CommonComponent.createStylizedButton('LOGIN', 'blue'); // i18n var: Authpage_login_button
    const signupButton = CommonComponent.createStylizedButton('SIGNUP', 'purple'); // i18n var: Authpage_signup_button

    // Append buttons to container
    buttonContainer.appendChild(loginButton);
    buttonContainer.appendChild(signupButton);

    // Append all elements to input container
    inputContainer.appendChild(nameLabel);
    inputContainer.appendChild(nameInput);
    inputContainer.appendChild(passwordLabel);
    inputContainer.appendChild(passwordInput);
    inputContainer.appendChild(buttonContainer);

    container.appendChild(inputContainer);

    return {
      nameInput,
      passwordInput,
      signupButton,
      loginButton
    };
  }

  /**
   * Create message display container
   */
  private static createMessageDisplay(container: HTMLElement): void {
    const signupMsgDisplay = document.createElement('div');
    signupMsgDisplay.id = 'signup-msg-display';
    signupMsgDisplay.className = 'text-center mt-4';
    container.appendChild(signupMsgDisplay);
  }
}
