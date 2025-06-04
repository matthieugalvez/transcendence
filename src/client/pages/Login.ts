// src/client/Login.ts

import { navigateTo } from '../configs/simplerouter';

export default {
  render(root: HTMLElement) {
    const container = document.createElement('div');
    container.className = 'flex flex-col items-center p-8';

    const title = document.createElement('h1');
    title.textContent = 'Connexion';
    title.className = 'text-3xl font-bold mb-6';
    container.appendChild(title);

    const form = document.createElement('form');
    form.className = 'flex flex-col w-full max-w-sm';

    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.placeholder = 'Nom d’utilisateur';
    usernameInput.className = 'border border-gray-300 rounded px-3 py-2 mb-4';
    form.appendChild(usernameInput);

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Mot de passe';
    passwordInput.className = 'border border-gray-300 rounded px-3 py-2 mb-4';
    form.appendChild(passwordInput);

    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Se connecter';
    submitBtn.className = 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md';
    form.appendChild(submitBtn);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();
      if (!username || !password) {
        alert('Veuillez remplir tous les champs');
        return;
      }
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (data.success && data.token) {
          // Stocker le token (JWT) en localStorage
          localStorage.setItem('token', data.token);
          navigateTo('/');
        } else {
          alert(data.error || 'Échec de la connexion');
        }
      } catch (err) {
        console.error(err);
        alert('Erreur réseau');
      }
    });

    container.appendChild(form);

    // Lien vers l’inscription
    const signupLink = document.createElement('a');
    signupLink.href = '/signup';
    signupLink.textContent = 'Je n’ai pas de compte';
    signupLink.className = 'text-blue-500 mt-4 hover:underline';
    container.appendChild(signupLink);

    root.appendChild(container);
  },
};
