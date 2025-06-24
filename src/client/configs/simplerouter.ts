class SimpleRouter {
	private routes: { pattern: RegExp; paramNames: string[]; handler: (params: Record<string, string>) => void }[] = [];

	register(path: string, handler: (params?: Record<string, string>) => void) {
		const paramNames: string[] = [];
		const pattern = new RegExp('^' + path.replace(/:([^/]+)/g, (_, name) => {
			paramNames.push(name);
			return '([^/]+)';
		}) + '$');
		this.routes.push({ pattern, paramNames, handler });
	}

	navigate(path: string) {
		window.history.pushState({}, '', path);
		this.handleRoute(path);
	}

	private handleRoute(path: string) {
		document.body.innerHTML = '';
		for (const { pattern, paramNames, handler } of this.routes) {
			const match = pattern.exec(path);
			if (match) {
				const params: Record<string, string> = {};
				paramNames.forEach((name, i) => params[name] = match[i + 1]);
				handler(params);
				return;
			}
		}
		this.renderNotFound();
	}

	private renderNotFound() {
		import('../pages/NotFoundPage').then((module) => {
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
