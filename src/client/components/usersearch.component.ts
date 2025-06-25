import { router } from '../configs/simplerouter';
import { FriendService } from '../services/friend.service';
import { UserService } from '../services/user.service';
import { CommonComponent } from './common.component';

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
			const users = await UserService.searchUsers(query);

			container.innerHTML = '';

			users.forEach(user => {
				const userItem = document.createElement('div');
				userItem.className = `
                    flex items-center justify-between p-3
                    bg-white border-2 border-black rounded-lg
                    hover:bg-gray-50 transition-colors
                `;

				userItem.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <img src="${user.avatar || '/avatars/default.svg'}"
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

				// Add different buttons based on context
				if (onSelect) {
					// Select button (for tournament selection, etc.)
					const selectBtn = document.createElement('button');
					selectBtn.textContent = 'Select';
					selectBtn.className = 'px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm';
					selectBtn.addEventListener('click', () => onSelect(user));
					buttonContainer.appendChild(selectBtn);
				} else {
					// View profile button
					const viewBtn = document.createElement('button');
					viewBtn.textContent = 'View';
					viewBtn.className = 'px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm';
					viewBtn.addEventListener('click', () => router.navigate(`/profile/${user.displayName}`));
					buttonContainer.appendChild(viewBtn);

					// Add friend button
					const addBtn = document.createElement('button');
					addBtn.textContent = 'Add Friend';
					addBtn.className = 'px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm';
					addBtn.addEventListener('click', async () => {
						await this.handleAddFriend(user, addBtn);
					});
					buttonContainer.appendChild(addBtn);
				}

				userItem.appendChild(buttonContainer);
				container.appendChild(userItem);
			});

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
			button.textContent = 'Adding...';
			button.className = button.className.replace('bg-blue-600 hover:bg-blue-700', 'bg-gray-500');

			// Send friend request
			const result = await FriendService.sendFriendRequest(user.id);

			if (result.success) {
				// Update button to show success
				button.textContent = 'Request Sent';
				button.className = button.className.replace('bg-gray-500', 'bg-green-600');

				// Show success message
				CommonComponent.showMessage(`Friend request sent to ${user.displayName}!`, 'success');

				// Keep button disabled since request is sent
				button.disabled = true;
			} else {
				throw new Error(result.message || 'Failed to send friend request');
			}
		} catch (error) {
			console.error('Error adding friend:', error);

			// Reset button on error
			button.disabled = false;
			button.textContent = 'Add Friend';
			button.className = button.className.replace('bg-gray-500', 'bg-blue-600 hover:bg-blue-700');

			// Show error message
			CommonComponent.showMessage(
				error.message || 'Failed to send friend request. Please try again.',
				'error'
			);
		}
	}
}