// en gros on stock les routes et si onrecoit une methode GET a ces routes on renvoit la page.
// En les stockant dans une map de route
//Vu qu'ensuite niveau back on interagit juste avec les endpoints (post/get fastify)

class SimpleRouter {
  private routes: Map<string, () => void> = new Map();

  constructor() {
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });
  }

  register(path: string, handler: () => void) {
    this.routes.set(path, handler);
  }

  navigate(path: string) {
    window.history.pushState({}, '', path);
    this.handleRoute(path);
  }

  private handleRoute(path: string) {
	  document.body.innerHTML = '';
    const handler = this.routes.get(path);
    // const handler = this.routes.get(path) || this.routes.get('/');
    if (handler) {
      handler();
    }
    else {
      this.renderNotFound();
    }
  }

  private renderNotFound() {
    document.title = '404 - Page introuvable';

    const container = document.createElement('div');
    container.className = 'bg-gray-100 min-h-screen flex flex-col items-center justify-center p-8';

    const title = document.createElement('h1');
    title.textContent = '404 - Page not found';
    title.className = 'text-4xl font-bold text-red-600 mb-4 text-center';
    container.appendChild(title);

    const msg = document.createElement('p');
    msg.textContent = `Page "${window.location.pathname}" does not exist.`;
    msg.className = 'text-lg text-gray-700 mb-6 text-center';
    container.appendChild(msg);

    const homeLink = document.createElement('button');
    homeLink.textContent = 'Back to Home';
    homeLink.className = 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded';
    homeLink.addEventListener('click', () => {
      this.navigate('/');
    });
    container.appendChild(homeLink);

    document.body.appendChild(container);
  }

  start() {
    this.handleRoute(window.location.pathname || '/');
  }
}

export const router = new SimpleRouter();