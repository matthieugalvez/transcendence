import { AuthComponent } from '../components/auth.component';

export class CommonComponent {
  /**
   * Display a message to the user
   */
 static showMessage(text: string, type: 'success' | 'error', isHtml: boolean = false): void {
    const signupMsgDisplay = document.getElementById('signup-msg-display');
    if (!signupMsgDisplay) return;

    signupMsgDisplay.innerHTML = '';

    const message = document.createElement('div');
    if (isHtml) {
      message.innerHTML = text;
    } else {
      message.textContent = text;
    }

    // Apply consistent typography to match your auth page
    message.className = `
      font-['Orbitron']
      ${type === 'success' ? 'text-green-600' : 'text-red-600'}
      font-semibold mt-2 text-center
    `.replace(/\s+/g, ' ').trim();

    // Apply consistent letter spacing
    message.style.letterSpacing = "0.05em";

    signupMsgDisplay.appendChild(message);
  }

  /**
   * Create a styled label element
   */
static createLabel(text: string): HTMLLabelElement {
  const label = document.createElement('label');
  label.textContent = text;
  label.className = `
    font-['Orbitron']
    block text-lg font-semibold mb-2 text-gray-700
  `.replace(/\s+/g, ' ').trim();

  label.style.letterSpacing = "0.1em";

  return label;
}

  /**
   * Create a styled input element
   */
static createInput(type: string, placeholder: string): HTMLInputElement {
  const input = document.createElement('input');
  input.type = type;
  input.placeholder = placeholder;
  input.className = `
    font-['Orbitron']
    border-2 border-black rounded-lg
    px-4 py-3
    text-lg font-medium
    w-80 mx-auto block mb-4
    bg-white
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    shadow-[2.0px_3.0px_0.0px_rgba(0,0,0,0.6)]
    transition-all duration-200
  `.replace(/\s+/g, ' ').trim();

  input.style.letterSpacing = "0.1em";

  return input;
}

  /**
   * Create a styled button element
   */
  static createButton(text: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'bg-blue-600 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg text-lg transition-colors';
    return button;
  }

	static createStylizedButton(text: string, color: 'blue' | 'purple' | 'gray' = 'blue'): HTMLButtonElement {
	  const button = document.createElement('button');
	  button.textContent = text;

	  const colorClasses = {
		blue: 'bg-blue-500 hover:bg-blue-700 focus:ring-blue-300',
		purple: 'bg-purple-500 hover:bg-purple-700 focus:ring-purple-300',
		gray: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-300',
		red: 'bg-red-500 hover:bg-red-700 focus:ring-red-300'
	  };

	  button.className = `
		font-['Orbitron']
		${colorClasses[color]} text-white font-semibold
		border-2 border-black
		py-2 px-12
		rounded-lg text-lg transition-colors
		focus:outline-none focus:ring-2
		shadow-[4.0px_5.0px_0.0px_rgba(0,0,0,0.8)]
		disabled:opacity-50 disabled:cursor-not-allowed
	  `.replace(/\s+/g, ' ').trim();

	  button.style.letterSpacing = "0.2em";

	  return button;
	}

	static	createLanguageMenu(language: string): HTMLDivElement {
		const	LanguageDropdownMenu = document.createElement('div');
		LanguageDropdownMenu.className = `
		  bg-white/90 backdrop-blur-md
		  border-2 border-black
		  rounded-xl p-2 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
		`.replace(/\s+/g, ' ').trim();
		LanguageDropdownMenu.style.position = 'absolute';
		LanguageDropdownMenu.style.top = '8px';
		LanguageDropdownMenu.style.right = '16px';
		LanguageDropdownMenu.style.display = 'inline-grid';
			
		const	LanguageDropdownButton = document.createElement('button');
		LanguageDropdownButton.className = 'dropbtn';
		if (language === 'eng') {
			LanguageDropdownButton.textContent = '🇬🇧';
		}
		if (language === 'fr') {
			LanguageDropdownButton.textContent = '🇫🇷';
		}

		const	LanguageDropdownContent = document.createElement('div');
		LanguageDropdownContent.className = 'dropdown-content';
		LanguageDropdownContent.style.display = 'none';

		LanguageDropdownMenu.addEventListener('mouseover', (event) => {
			LanguageDropdownButton.style.display = "none";
			LanguageDropdownContent.style.display = 'inline-grid';
			});

		LanguageDropdownMenu.addEventListener('mouseout', (event) => {
			LanguageDropdownButton.style.display = "initial";
			LanguageDropdownContent.style.display = 'none';
			});

		const	EnglishButton = document.createElement('button');
		EnglishButton.textContent = '🇬🇧';
		EnglishButton.addEventListener('click', async () => {
			const success = await AuthComponent.SetLanguageUser('eng');
			if (success.error) {
					CommonComponent.showMessage('Failed to change language', 'error');
				}
			location.reload();
		});

		const	FrenchButton = document.createElement('button');
		FrenchButton.textContent = '🇫🇷';
		FrenchButton.addEventListener('click', async () => {
			const success = await AuthComponent.SetLanguageUser('fr');
			if (success.error) {
					CommonComponent.showMessage('Failed to change language', 'error');
				}
			location.reload();
		});

		LanguageDropdownMenu.appendChild(LanguageDropdownButton);
		LanguageDropdownContent.appendChild(EnglishButton);
		LanguageDropdownContent.appendChild(FrenchButton);
		LanguageDropdownMenu.appendChild(LanguageDropdownContent);
		
		return LanguageDropdownMenu;
	}

  /**
   * Create a styled container div
   */
  static createContainer(className: string = ''): HTMLDivElement {
    const container = document.createElement('div');
    container.className = className;
    return container;
  }

  /**
   * Create a styled heading
   */
  static createHeading(text: string, level: number = 1, className: string = ''): HTMLHeadingElement {
    const heading = document.createElement(`h${level}`) as HTMLHeadingElement;
    heading.textContent = text;
    heading.className = className;
    return heading;
  }

  /**
   * Clear the content of an element
   */
  static clearElement(element: HTMLElement): void {
    element.innerHTML = '';
  }

  /**
   * Add multiple CSS classes to an element
   */
  static addClasses(element: HTMLElement, ...classes: string[]): void {
    element.classList.add(...classes);
  }

  /**
   * Remove multiple CSS classes from an element
   */
  static removeClasses(element: HTMLElement, ...classes: string[]): void {
    element.classList.remove(...classes);
  }
}
