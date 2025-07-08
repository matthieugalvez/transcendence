class SimpleRouter {
    routes = [];
    register(path, handler) {
        const paramNames = [];
        const pattern = new RegExp('^' + path.replace(/:([^/]+)/g, (_, name) => {
            paramNames.push(name);
            return '([^/]+)';
        }) + '$');
        this.routes.push({ pattern, paramNames, handler });
    }
    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute(path);
    }
    handleRoute(path) {
        document.body.innerHTML = '';
        for (const { pattern, paramNames, handler } of this.routes) {
            const match = pattern.exec(path);
            if (match) {
                const params = {};
                paramNames.forEach((name, i) => params[name] = match[i + 1]);
                handler(params);
                return;
            }
        }
        this.renderNotFound();
    }
    renderNotFound() {
        import('../pages/NotFoundPage.ts').then((module) => {
            module.renderNotFoundPage();
        });
    }
    start() {
        this.handleRoute(window.location.pathname || '/');
        window.addEventListener('popstate', (event) => {
            this.handleRoute(window.location.pathname || '/');
        });
    }
}
export const router = new SimpleRouter();
