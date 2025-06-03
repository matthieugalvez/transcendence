
// en gros on stock les routes et si onrecoit une methode GET a ces routes on renvoit la page.
// En les stockant dans une map de route
//Vu qu'ensuite niveau back on interagit juste avec les endpoints (post/get fastify)

class SimpleRouter {
  private routes: Map<string, () => void> = new Map();
  private currentRoute: string = '/'; // -> spa ne change pas l'adresse

  constructor() {
    // window.addEventListener('popstate', () => {
    //   this.handleRoute(window.location.pathname);
    // });
  }

  register(path: string, handler: () => void) {
    this.routes.set(path, handler);
  }

  navigate(path: string) {
    // window.history.pushState({}, '', path); -> non SPA change l'adresse
	this.currentRoute = path;
    this.handleRoute(path);
  }

getCurrentRoute(): string {
    return this.currentRoute;
  }

  private handleRoute(path: string) {
	document.body.innerHTML = '';
    const handler = this.routes.get(path) || this.routes.get('/');
    if (handler) {
      handler();
    }
  }

  start() {
    this.handleRoute(window.location.pathname || '/');
  }
}

export const router = new SimpleRouter();