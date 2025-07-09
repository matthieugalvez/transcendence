import { router } from '../configs/simplerouter';
import { FriendService } from '../services/friend.service';
import { UserService } from '../services/user.service';
import { CommonComponent } from './common.component';
import { language_obj } from '../index.ts';

export class UserSearchComponent {
	static render(container: HTMLElement, onSelect?: (user: { displayName: string, avatar: string, id: string }) => void, opts: { theme?: 'light' | 'dark' } = {}) {
		const searchSection = document.createElement('div');
		searchSection.className = 'mb-6';

		const searchInput = document.createElement('input');
		searchInput.type = 'text';
		searchInput.placeholder = `${language_obj['Searchpage_search']}`;
		searchInput.className = `
            font-['Orbitron'] ${opts.theme === 'dark' ? 'text-white placeholder-white' : 'text-gray-900'}
            w-full p-3 border-2 border-black rounded-lg
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
            // Get current user to filter out self
            const currentUser = await UserService.getCurrentUser();

            const users = await UserService.searchUsers(query);
            // Filter out current user from search results
            const filteredUsers = users.filter(user => user.id !== currentUser.id);
            // const limited3Users = users.slice(0, 3); // limite a 3 user max
            const limited3Users = filteredUsers.slice(0, 3); // limite a 3 user max

            container.innerHTML = '';

            limited3Users.forEach(async user => {
                const userItem = document.createElement('div');
                userItem.className = `
                    flex items-center justify-between p-3
                    bg-white border-2 border-black rounded-lg
                    hover:bg-gray-50 transition-colors
                `;

                userItem.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <img src="${user.avatar}"
                            alt="${user.displayName}"
                            class="w-8 h-8 rounded-full border-2 border-purple-500 object-cover">
                        <div>
                            <p class="font-bold text-gray-900">${user.displayName}</p>
                        </div>
                    </div>
                `;

                // Create button container
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'flex gap-2';

                if (onSelect) {
                    // Select button (for tournament selection, etc.)
                    const selectBtn = document.createElement('button');
                    selectBtn.textContent = `${language_obj['Select']}`;
                    selectBtn.className = 'px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm';
                    selectBtn.addEventListener('click', () => onSelect(user));
                    buttonContainer.appendChild(selectBtn);
                } else {
                    // View profile button
                    const viewBtn = document.createElement('button');
                    viewBtn.textContent = `${language_obj['View']}`;
                    viewBtn.className = 'px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm';
                    viewBtn.addEventListener('click', () => router.navigate(`/profile/${user.displayName}`));
                    buttonContainer.appendChild(viewBtn);

                    // Check friendship status before showing Add Friend
                    try {
                        const statusResult = await UserService.getFriendshipStatus(user.id);

                        if (statusResult.status === 'none') {
                            const addBtn = document.createElement('button');
                            addBtn.textContent = `${language_obj['Add_friend']}`;
                            addBtn.className = 'px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm';
                            addBtn.addEventListener('click', async () => {
                                await this.handleAddFriend(user, addBtn);
                            });
                            buttonContainer.appendChild(addBtn);
                        } else if (statusResult.status === 'pending') {
                            const pendingBtn = document.createElement('button');
                            pendingBtn.textContent = `${language_obj['Sent']}`;
                            pendingBtn.className = 'px-3 py-1 bg-gray-400 text-white rounded cursor-not-allowed text-sm';
                            pendingBtn.disabled = true;
                            buttonContainer.appendChild(pendingBtn);
                        } else if (statusResult.status === 'incoming') {
                            const incomingBtn = document.createElement('button');
                            incomingBtn.textContent = `${language_obj['Accept']}`;
                            incomingBtn.className = 'px-3 py-1 bg-yellow-500 text-white rounded cursor-not-allowed text-sm';
                            incomingBtn.disabled = true;
                            incomingBtn.addEventListener('click', async () => {
                                await FriendService.rejectFriendRequest(user.id);
                            });
                            buttonContainer.appendChild(incomingBtn);
                        } else if (statusResult.status === 'friends') {
                            const friendsBtn = document.createElement('button');
                            friendsBtn.textContent = `${language_obj['Friends']}`;
                            friendsBtn.className = 'px-3 py-1 bg-green-600 text-white rounded cursor-not-allowed text-sm';
                            friendsBtn.disabled = true;
                            buttonContainer.appendChild(friendsBtn);
                        }
                    } catch (e) {
                        console.log('Error retrieving friendship status', e);
                    }
                }

                userItem.appendChild(buttonContainer);
                container.appendChild(userItem);
            });
            if (filteredUsers.length > limited3Users.length) {
                const more = document.createElement('p');
                more.textContent = `… ${language_obj['And']} ${filteredUsers.length - limited3Users.length} ${language_obj['More_results']}`;
                more.className = 'text-gray-400 italic text-sm mt-1';
                container.appendChild(more);
            }
        } catch (error) {
            console.error('Search error:', error);
            container.innerHTML = `
                <div class="text-red-600 text-center p-4">
                    Error searching users. Please try again.
                </div>
            `;
        }
    }

    private static async handleAddFriend(
        user: { displayName: string; avatar: string; id: string },
        button: HTMLButtonElement
    ): Promise<void> {
        try {
            // Disable button during request
            button.disabled = true;
            button.textContent = `${language_obj['Adding']}`;
            button.className = button.className.replace('bg-blue-600 hover:bg-blue-700', 'bg-gray-500');

            // Send friend request
            const result = await FriendService.sendFriendRequest(user.id);

            if (result.success) {
                // Update button to show success
                button.textContent = `${language_obj['Request_sent']}`;
                button.className = button.className.replace('bg-gray-500', 'bg-green-600');

                // Show success message
                CommonComponent.showMessage(`${language_obj['Sent_to']} ${user.displayName}!`, 'success');

                // Reload page to update friend lists and notifications
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                throw new Error(result.message || 'Failed to send friend request');
            }
        } catch (error) {
            console.error('Error adding friend:', error);

            // Reset button on error
            button.disabled = false;
            button.textContent = `${language_obj['Add_friend']}`;
            button.className = button.className.replace('bg-gray-500', 'bg-blue-600 hover:bg-blue-700');

            // Show error message
            CommonComponent.showMessage(
                error.message || 'Failed to send friend request. Please try again.',
                'error'
            );
        }
    }
}
