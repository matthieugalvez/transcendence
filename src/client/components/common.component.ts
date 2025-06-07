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

    message.className = type === 'success'
      ? 'text-green-600 font-semibold mt-2'
      : 'text-red-600 font-semibold mt-2';

    signupMsgDisplay.appendChild(message);
  }

  /**
   * Create a styled label element
   */
  static createLabel(text: string): HTMLLabelElement {
    const label = document.createElement('label');
    label.textContent = text;
    label.className = 'block text-gray-700 text-lg font-medium mb-2';
    return label;
  }

  /**
   * Create a styled input element
   */
  static createInput(type: string, placeholder: string): HTMLInputElement {
    const input = document.createElement('input');
    input.type = type;
    input.placeholder = placeholder;
    input.className = 'border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mr-2 mb-4 block w-64 mx-auto';
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