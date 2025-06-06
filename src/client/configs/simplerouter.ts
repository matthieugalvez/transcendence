// en gros on stock les routes et si onrecoit une methode GET a ces routes on renvoit la page.
// En les stockant dans une map de route
//Vu qu'ensuite niveau back on interagit juste avec les endpoints (post/get fastify)

import { renderNotFoundPage } from '../pages/NotFoundPage';

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
    if (handler) {
      handler();
    }
    else {
      this.renderNotFound();
    }
  }

  // évite d’avoir tout le code 404 chargé si l’utilisateur ne tombe jamais sur cette page
  private renderNotFound() {
    import('../pages/NotFoundPage').then((module) => {
      module.renderNotFoundPage();
    });
  }

  start() {
    this.handleRoute(window.location.pathname || '/');
  }
}

export const router = new SimpleRouter();