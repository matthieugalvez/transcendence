import logo from '../assets/logo.png';
import { CommonComponent } from '../components/common.component';

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
    // Set document title and body styles
    document.title = 'Transcendence';
    document.body.style.background = "#fff";
    document.body.style.backgroundImage = "";
    document.body.style.backgroundSize = "";
    document.body.style.backgroundBlendMode = "";
    document.body.className = 'bg-gray-100 font-sans min-h-screen flex flex-col items-center justify-center p-8';

    // Clear existing content
    document.body.innerHTML = '';

    // Create and append logo
    this.createLogo();

    // Create and append page title
    this.createPageTitle();

    // Create form elements
    const formElements = this.createFormElements();

    // Create message display container
    this.createMessageDisplay();

    return formElements;
  }

  /**
   * Create and append logo to the page
   */
  private static createLogo(): void {
    const img = document.createElement('img');
    img.src = logo;
    img.alt = 'Project Logo';
    img.className = 'w-48 h-auto mx-auto mb-6';
    document.body.appendChild(img);
  }

  /**
   * Create and append page title
   */
  private static createPageTitle(): void {
    const pageTitle = document.createElement('h1');
    pageTitle.textContent = 'Transcendence';
    pageTitle.className = 'text-blue-600 text-3xl font-bold mb-4 text-center';
    document.body.appendChild(pageTitle);
  }

  /**
   * Create form elements (inputs and buttons)
   */
  private static createFormElements(): {
    nameInput: HTMLInputElement;
    passwordInput: HTMLInputElement;
    signupButton: HTMLButtonElement;
    loginButton: HTMLButtonElement;
  } {
    const inputContainer = document.createElement('div');
    inputContainer.className = 'text-center mb-6';

    // Name input and label
    const nameLabel = CommonComponent.createLabel('Enter your name:');
    const nameInput = CommonComponent.createInput('text', 'Name');

    // Password input and label
    const passwordLabel = CommonComponent.createLabel('Enter your password:');
    const passwordInput = CommonComponent.createInput('password', 'Password');

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex gap-10 justify-center';

    // Create buttons
    const loginButton = CommonComponent.createButton('Login');
    const signupButton = CommonComponent.createButton('Signup');

    // Append buttons to container
    buttonContainer.appendChild(loginButton);
    buttonContainer.appendChild(signupButton);

    // Append all elements to input container
    inputContainer.appendChild(nameLabel);
    inputContainer.appendChild(nameInput);
    inputContainer.appendChild(passwordLabel);
    inputContainer.appendChild(passwordInput);
    inputContainer.appendChild(buttonContainer);

    document.body.appendChild(inputContainer);

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
  private static createMessageDisplay(): void {
    const signupMsgDisplay = document.createElement('div');
    signupMsgDisplay.id = 'signup-msg-display';
    signupMsgDisplay.className = 'text-center mb-6';
    document.body.appendChild(signupMsgDisplay);
  }
}