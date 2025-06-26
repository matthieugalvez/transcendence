import { UserService } from '../services/user.service';
import { router } from '../configs/simplerouter';

export class UserSearchComponent {
    static render(container: HTMLElement, onSelect?: (user: { displayName: string, avatar: string, id: string }) => void) {
        const searchSection = document.createElement('div');
        searchSection.className = 'mb-6';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search users...';
        searchInput.className = `
            font-['Orbitron'] text-white w-full p-3 border-2 border-black rounded-lg
            focus:outline-none focus:border-purple-500
        `;

        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'mt-4 space-y-2';

        searchInput.addEventListener('input', async (e) => {
            const query = (e.target as HTMLInputElement).value.trim();
            if (query.length > 2) {
                await this.performSearch(query, resultsContainer, onSelect);
            } else {
                resultsContainer.innerHTML = '';
            }
        });

        searchSection.appendChild(searchInput);
        searchSection.appendChild(resultsContainer);
        container.appendChild(searchSection);
    }

    private static async performSearch(
        query: string,
        container: HTMLElement,
        onSelect?: (user: { displayName: string; avatar: string; id: string }) => void
    ): Promise<void> {
        try {
            // You'll need to implement this in UserService
            const users = await UserService.searchUsers(query);
            const limited3Users = users.slice(0, 3); // limite a 3 user max 
            
            container.innerHTML = '';

            limited3Users.forEach(user => {
                const userItem = document.createElement('div');
                userItem.className = `
                    flex items-center justify-between p-3
                    bg-white border-2 border-black rounded-lg
                    hover:bg-gray-50 transition-colors
                `;

                userItem.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <img src="${user.avatar || '/assets/default-avatar.png'}"
                             alt="${user.displayName}"
                             class="w-5 h-5 rounded-full border-2 border-purple-500">
                        <div>
                            <p class="font-bold">${user.displayName}</p>
                        </div>
                    </div>
                `;

                const btn = document.createElement('button');
                if (onSelect) {
                    btn.textContent = 'Select';
                    btn.className = 'px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700';
                    btn.addEventListener('click', () => {
                        onSelect(user);
                    });
                } else {
                    btn.textContent = 'View';
                    btn.className = 'px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700';
                    btn.addEventListener('click', () => router.navigate(`/profile/${user.displayName}`));
                }

                userItem.appendChild(btn);

                container.appendChild(userItem);
            });
            if (users.length > limited3Users.length) {
                const more = document.createElement('p');
                more.textContent = `… et ${users.length - limited3Users.length} résultat(s) de plus`;
                more.className = 'text-gray-400 italic text-sm mt-1';
                container.appendChild(more);
            }

        } catch (error) {
            console.error('Search error:', error);
        }
    }
}