import { router } from '../configs/simplerouter';
import { CommonComponent } from '../components/common.component';
import { WebSocketService } from '../services/websocket.service';
import { renderChatPage } from '../pages/ChatPage';

export class StatsRender {
	private static createStatsHeader(user: any, isOwnStats: boolean): HTMLElement {
		const header = document.createElement('div');
		header.className = 'flex items-center justify-between mb-8';

		const title = document.createElement('h1');
		title.textContent = isOwnStats ? 'Your Stats' : `${user.displayName}'s Stats`;
		title.className = `font-['Orbitron'] text-2xl font-bold text-gray-900`;

		// Avatar container with status dot
		const avatarContainer = document.createElement('div');
		avatarContainer.className = 'relative';

		const avatar = document.createElement('img');
		avatar.src = user.avatar;
		console.log(`Avatar URL for stats: ${user.avatar}`);
		avatar.alt = user.displayName;
		avatar.className = 'w-14 h-14 rounded-full border-2 border-purple-400 shadow';

		// Add status dot (same logic as ProfileRender)
		const statusDot = document.createElement('span');
		statusDot.setAttribute('data-user-status', user.id);
		statusDot.style.position = 'absolute';
		statusDot.style.bottom = '2px';
		statusDot.style.right = '2px';
		statusDot.style.display = 'inline-block';
		statusDot.style.width = '12px';
		statusDot.style.height = '12px';
		statusDot.style.borderRadius = '50%';
		statusDot.style.background = 'gray';
		statusDot.style.border = '2px solid white';
		statusDot.title = 'Checking status...';

		const wsService = WebSocketService.getInstance();

		// Set up status change listener (same as ProfileRender)
		wsService.onStatusChange((userId, isOnline) => {
			if (userId === user.id) {
				statusDot.style.background = isOnline ? 'green' : 'red';
				statusDot.title = isOnline ? 'Online' : 'Offline';
			}
		});

		// Get initial status (same as ProfileRender)
		(async () => {
			try {
				const connected = await wsService.waitForConnection(3000);
				if (connected) {
					setTimeout(() => {
						const isOnline = wsService.isUserOnline(user.id);
						statusDot.style.background = isOnline ? 'green' : 'red';
						statusDot.title = isOnline ? 'Online' : 'Offline';
					}, 500);
				} else {
					statusDot.style.background = 'red';
					statusDot.title = 'Offline';
				}
			} catch (error) {
				console.error('Error getting initial status:', error);
				statusDot.style.background = 'red';
				statusDot.title = 'Offline';
			}
		})();

		avatarContainer.appendChild(avatar);
		avatarContainer.appendChild(statusDot);

		header.appendChild(title);
		header.appendChild(avatarContainer);

		return header;
	}

	static async renderStatsContent(user: any, isOwnStats: boolean): Promise<void> {
	//    const container = document.createElement('div');
	//    container.className = 'main-content-centered';

		// Create main container with flex layout and proper height constraint
		const mainContainer = document.createElement('div');
		mainContainer.className = 'flex w-full h-full';
		mainContainer.style.marginLeft = '350px';

		const statsCard = document.createElement('div');
		statsCard.title = 'statsCard';
		statsCard.className = `
			bg-white/90 backdrop-blur-md
			border-2 border-black
			rounded-xl mb-5 p-4 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
			flex-1 max-w-[30%] min-w-[300px] transition-all duration-300
			overflow-y-auto compact-container
		`;

		// Header - make more compact
		const header = this.createStatsHeader(user, isOwnStats);
		statsCard.appendChild(header);

		// Fetch detailed stats
		const statsData = await this.fetchDetailedStats(user.id);

		// Overview Cards - make more compact
		const overviewSection = this.createOverviewSection(statsData);
		statsCard.appendChild(overviewSection);

		// Charts Section - make more compact
		const chartsSection = this.createChartsSection(statsData);
		statsCard.appendChild(chartsSection);

		// Recent Matches - limit the height
		const matchesSection = await this.createDetailedMatchesSection(user.id, user);
		statsCard.appendChild(matchesSection);

		// Recent Tournament - limit the height
		const tournamentsSection = await this.createTournamentsSection(user.id, user);
		statsCard.appendChild(tournamentsSection);

		mainContainer.appendChild(statsCard);

		if (isOwnStats) {
			const matchDetailsPanel = this.createMatchDetailsPanel();
			mainContainer.appendChild(matchDetailsPanel);
			(window as any).matchDetailsPanel = matchDetailsPanel;
			(window as any).currentUser = user;
		} else {
			this.embedChat(user, mainContainer);
		}

		document.body.appendChild(mainContainer);
	}

	private static createMatchDetailsPanel(): HTMLElement {
		const panel = document.createElement('div');
		panel.id = 'match-details-panel';
		panel.className = `
            w-96 bg-white/95 backdrop-blur-md
            border-2 border-black rounded-xl
            shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
            opacity-0 translate-x-full transition-all duration-300 ease-in-out
            overflow-hidden
        `;
		panel.style.height = 'fit-content';
		panel.style.maxHeight = '90vh';
		panel.style.overflowY = 'auto';

		const content = document.createElement('div');
		content.className = 'p-6';
		content.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <div class="text-4xl mb-4">🏓</div>
                <p>Click on a match to view details</p>
            </div>
        `;

		panel.appendChild(content);
		return panel;
	}

	private static createOverviewSection(statsData: any): HTMLElement {
		const section = document.createElement('div');
		section.className = 'mb-8';

		const title = document.createElement('h2');
		title.textContent = 'Overview';
		title.className = `font-['Orbitron'] text-2xl font-bold mb-4 text-gray-800`;

		const grid = document.createElement('div');
		grid.className = 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6';

		const totalGames = (statsData.oneVOneWins || 0) + (statsData.oneVOneLosses || 0) +
			(statsData.tournamentWins || 0) + (statsData.tournamentLosses || 0);
		const totalWins = (statsData.oneVOneWins || 0) + (statsData.tournamentWins || 0);
		const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

		const overviewStats = [
			{
				label: 'Total Games',
				value: totalGames.toString(),
				icon: '🎮',
				color: 'bg-blue-100 text-blue-800'
			},
			{
				label: 'Win Rate',
				value: `${winRate}%`,
				icon: '🏆',
				color: 'bg-green-100 text-green-800'
			},
			{
				label: 'Total Wins',
				value: totalWins.toString(),
				icon: '🔥',
				color: 'bg-orange-100 text-orange-800'
			},
			{
				label: 'Favorite Mode',
				value: (statsData.oneVOneWins || 0) >= (statsData.tournamentWins || 0) ? '1v1' : 'Tournament',
				icon: '⭐',
				color: 'bg-purple-100 text-purple-800'
			}
		];

		overviewStats.forEach(stat => {
			const card = document.createElement('div');
			card.className = `${stat.color} p-4 rounded-lg text-center`;

			const icon = document.createElement('div');
			icon.textContent = stat.icon;
			icon.className = 'text-2xl mb-2';

			const value = document.createElement('div');
			value.textContent = stat.value;
			value.className = 'text-xl font-bold mb-1';

			const label = document.createElement('div');
			label.textContent = stat.label;
			label.className = 'text-sm font-medium opacity-80';

			card.appendChild(icon);
			card.appendChild(value);
			card.appendChild(label);
			grid.appendChild(card);
		});

		section.appendChild(title);
		section.appendChild(grid);

		return section;
	}

	private static createChartsSection(statsData: any): HTMLElement {
		const section = document.createElement('div');
		section.className = 'mb-8';

		const title = document.createElement('h2');
		title.textContent = 'Performance Charts';
		title.className = `font-['Orbitron'] text-2xl font-bold mb-4 text-gray-800`;

		const chartsGrid = document.createElement('div');
		chartsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';

		// Win/Loss Chart
		const winLossChart = this.createWinLossChart(statsData);
		chartsGrid.appendChild(winLossChart);

		// Mode Performance Chart
		const modeChart = this.createModeChart(statsData);
		chartsGrid.appendChild(modeChart);

		section.appendChild(title);
		section.appendChild(chartsGrid);

		return section;
	}

	private static createWinLossChart(statsData: any): HTMLElement {
		const container = document.createElement('div');
		container.className = 'bg-gray-50 p-4 rounded-lg';

		const title = document.createElement('h3');
		title.textContent = 'Win/Loss Distribution';
		title.className = 'font-medium mb-4 text-center';

		const chartContainer = document.createElement('div');
		chartContainer.className = 'space-y-2';

		const categories = [
			{ label: '1v1 Wins', value: statsData.oneVOneWins || 0, color: 'bg-green-500' },
			{ label: '1v1 Losses', value: statsData.oneVOneLosses || 0, color: 'bg-red-500' },
			{ label: 'Tournament Wins', value: statsData.tournamentWins || 0, color: 'bg-blue-500' },
			{ label: 'Tournament Losses', value: statsData.tournamentLosses || 0, color: 'bg-orange-500' }
		];

		const maxValue = Math.max(...categories.map(c => c.value), 1);

		categories.forEach(category => {
			const row = document.createElement('div');
			row.className = 'flex items-center space-x-2';

			const label = document.createElement('span');
			label.textContent = category.label;
			label.className = 'text-sm w-24 text-right';

			const barContainer = document.createElement('div');
			barContainer.className = 'flex-1 bg-gray-200 rounded-full h-4 relative';

			const bar = document.createElement('div');
			bar.className = `${category.color} h-4 rounded-full transition-all duration-1000`;
			bar.style.width = `${(category.value / maxValue) * 100}%`;

			const value = document.createElement('span');
			value.textContent = category.value.toString();
			value.className = 'text-sm font-medium w-8';

			barContainer.appendChild(bar);
			row.appendChild(label);
			row.appendChild(barContainer);
			row.appendChild(value);
			chartContainer.appendChild(row);
		});

		container.appendChild(title);
		container.appendChild(chartContainer);

		return container;
	}

	private static createModeChart(statsData: any): HTMLElement {
		const container = document.createElement('div');
		container.className = 'bg-gray-50 p-4 rounded-lg';

		const title = document.createElement('h3');
		title.textContent = 'Mode Performance';
		title.className = 'font-medium mb-4 text-center';

		const modeData = [
			{
				mode: '1v1',
				wins: statsData.oneVOneWins || 0,
				losses: statsData.oneVOneLosses || 0,
				color: 'bg-blue-500'
			},
			{
				mode: 'Tournament',
				wins: statsData.tournamentWins || 0,
				losses: statsData.tournamentLosses || 0,
				color: 'bg-purple-500'
			}
		];

		const modeGrid = document.createElement('div');
		modeGrid.className = 'space-y-4';

		modeData.forEach(mode => {
			const total = mode.wins + mode.losses;
			const winRate = total > 0 ? Math.round((mode.wins / total) * 100) : 0;

			const modeItem = document.createElement('div');
			modeItem.className = 'text-center';

			const modeName = document.createElement('h4');
			modeName.textContent = mode.mode;
			modeName.className = 'font-semibold mb-2';

			const stats = document.createElement('div');
			stats.className = 'flex justify-between items-center text-sm';

			const winsLosses = document.createElement('span');
			winsLosses.textContent = `${mode.wins}W - ${mode.losses}L`;

			const winRateSpan = document.createElement('span');
			winRateSpan.textContent = `${winRate}%`;
			winRateSpan.className = 'font-bold';

			stats.appendChild(winsLosses);
			stats.appendChild(winRateSpan);

			modeItem.appendChild(modeName);
			modeItem.appendChild(stats);
			modeGrid.appendChild(modeItem);
		});

		container.appendChild(title);
		container.appendChild(modeGrid);

		return container;
	}

	private static async createDetailedMatchesSection(userId: string, user: any): Promise<HTMLElement> {
		const section = document.createElement('div');
		section.className = 'mb-8';

		const header = document.createElement('div');
		header.className = 'flex items-center justify-between mb-4';

		const title = document.createElement('h2');
		title.textContent = 'Recent Matches';
		title.className = `font-['Orbitron'] text-2xl font-bold text-gray-800`;

		header.appendChild(title);

		// Fetch recent matches using the same logic as profile page
		const matches = await this.fetchRecentMatches(userId);
		// const matchesList = this.createMatchHistorySection(matches, userId, user);

		// retire ceux issus d'un tournoi
		const filtered = matches.filter(m => !m.tournamentId);
		const matchesList = this.createMatchHistorySection(filtered, userId, user);

		section.appendChild(header);
		section.appendChild(matchesList);

		return section;
	}

	// Reuse the exact match history logic from ProfileRender
	private static createMatchHistorySection(matches: any[], currentUserId: string, user: any): HTMLElement {
		const matchList = document.createElement('div');
		matchList.className = 'space-y-3';

		if (matches.length === 0) {
			const noMatches = document.createElement('div');
			noMatches.className = 'text-center py-8 text-gray-500';
			noMatches.textContent = 'No matches played yet';
			return noMatches;
		}

		matches.forEach(match => {
			const matchItem = document.createElement('div');
			matchItem.className = `
                bg-white border border-gray-200 rounded-lg p-4 shadow-sm
                cursor-pointer hover:bg-gray-50 hover:border-purple-300
                transition-all duration-200
            `;

			// Add click handler for match details
			matchItem.onclick = () => {
				this.showMatchDetails(match, currentUserId, user);
			};

			const isWinner = match.winnerId === currentUserId;
			const opponent = match.playerOneId === currentUserId ? match.playerTwo : match.playerOne;
			const currentUserScore = match.playerOneId === currentUserId ? match.playerOneScore : match.playerTwoScore;
			const opponentScore = match.playerOneId === currentUserId ? match.playerTwoScore : match.playerOneScore;

			const matchHeader = document.createElement('div');
			matchHeader.className = 'flex justify-between items-center mb-2';

			const vsInfo = document.createElement('div');
			vsInfo.className = 'flex items-center space-x-3';

			// Current user avatar
			const userAvatar = document.createElement('img');
			userAvatar.src = user.avatar || 'default.svg';
			userAvatar.alt = user.displayName;
			userAvatar.className = 'w-8 h-8 rounded-full';

			// VS text
			const vsText = document.createElement('span');
			vsText.textContent = 'vs';
			vsText.className = 'text-sm font-medium text-gray-500';

			// Opponent avatar
			const opponentAvatar = document.createElement('img');
			opponentAvatar.src = opponent?.avatar || 'default.svg';
			opponentAvatar.alt = opponent?.displayName || 'Unknown';
			opponentAvatar.className = 'w-8 h-8 rounded-full';

			// Match details with opponent name
			const matchDetails = document.createElement('div');
			const matchType = document.createElement('span');
			matchType.textContent = match.matchType === 'ONE_V_ONE' ? '1v1' : 'Tournament';
			matchType.className = 'text-xs bg-gray-100 px-2 py-1 rounded ml-2 font-medium text-gray-600';

			matchDetails.appendChild(matchType);

			vsInfo.appendChild(userAvatar);
			vsInfo.appendChild(vsText);
			vsInfo.appendChild(opponentAvatar);
			vsInfo.appendChild(matchDetails);

			const resultInfo = document.createElement('div');
			resultInfo.className = 'text-right';

			const score = document.createElement('div');
			score.textContent = `${currentUserScore || 0} - ${opponentScore || 0}`;
			score.className = `font-bold ${isWinner ? 'text-green-600' : 'text-red-600'}`;

			const result = document.createElement('div');
			result.textContent = isWinner ? 'WIN' : 'LOSS';
			result.className = `text-xs font-medium ${isWinner ? 'text-green-600' : 'text-red-600'}`;

			resultInfo.appendChild(score);
			resultInfo.appendChild(result);

			matchHeader.appendChild(vsInfo);
			matchHeader.appendChild(resultInfo);

			const matchDate = document.createElement('div');
			const dateStr = match.playedAt ? new Date(match.playedAt).toLocaleDateString('en-GB', {
				year: 'numeric',
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			}) : 'Unknown date';
			matchDate.textContent = dateStr;
			matchDate.className = 'text-sm text-gray-500';

			// Add click indicator
			const clickIndicator = document.createElement('div');
			clickIndicator.className = 'text-xs text-purple-500 mt-1 opacity-70';
			clickIndicator.textContent = 'Click for details →';

			matchItem.appendChild(matchHeader);
			matchItem.appendChild(matchDate);
			matchItem.appendChild(clickIndicator);
			matchList.appendChild(matchItem);
		});
		return matchList;
	}

	private static showMatchDetails(match: any, currentUserId: string, user: any): void {
		const panel = document.getElementById('match-details-panel');
		if (!panel) return;

		// Show panel with animation
		panel.style.opacity = '1';
		panel.style.transform = 'translateX(-50%) translateY(60%)'; // For fixed positioning

		const isWinner = match.winnerId === currentUserId;
		const opponent = match.playerOneId === currentUserId ? match.playerTwo : match.playerOne;
		const currentUserScore = match.playerOneId === currentUserId ? match.playerOneScore : match.playerTwoScore;
		const opponentScore = match.playerOneId === currentUserId ? match.playerTwoScore : match.playerOneScore;

		const matchDate = match.playedAt ? new Date(match.playedAt) : new Date();

		panel.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-800">Match Details</h3>
                    <button id="close-match-details" class="text-gray-500 hover:text-gray-700 text-xl font-bold">×</button>
                </div>

                <!-- Simple Match Result -->
                <div class="text-center mb-6 p-4 rounded-lg ${isWinner ? 'bg-green-50' : 'bg-red-50'}">
                    <div class="text-2xl mb-2">${isWinner ? '🏆' : '😔'}</div>
                    <div class="text-xl font-bold ${isWinner ? 'text-green-600' : 'text-red-600'}">
                        ${isWinner ? 'WIN' : 'LOSS'}
                    </div>
                    <div class="text-2xl font-bold text-gray-800 mt-2">
                        ${currentUserScore} - ${opponentScore}
                    </div>
                </div>

                <!-- Opponent Info -->
                <div class="mb-4 p-3 bg-gray-50 rounded-lg flex items-center space-x-3">
                    <img src="${opponent?.avatar || 'default.svg'}" alt="${opponent?.displayName || 'Unknown'}" class="w-12 h-12 rounded-full">
                    <div>
                        <div class="font-medium text-lg">${opponent?.displayName || 'Unknown Player'}</div>
                        <div class="text-sm text-gray-500">${match.matchType === 'ONE_V_ONE' ? '1v1 Match' : 'Tournament'}</div>
                    </div>
                </div>

                <!-- Match Date -->
                <div class="mb-6 text-center text-sm text-gray-600">
                    ${matchDate.toLocaleDateString('en-GB', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		})}
                </div>

                <!-- Simple Actions -->
                <div class="space-y-2">
                    <button id="view-opponent-profile" class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                        View ${opponent?.displayName || 'Player'}'s Profile
                    </button>
                </div>
            </div>
        `;

		// Add event listeners
		const closeBtn = panel.querySelector('#close-match-details');
		closeBtn?.addEventListener('click', () => {
			panel.style.opacity = '0';
			panel.style.transform = 'translateX(100%)';
		});

		const viewProfileBtn = panel.querySelector('#view-opponent-profile');
		viewProfileBtn?.addEventListener('click', () => {
			if (opponent?.displayName) {
				router.navigate(`/profile/${opponent.displayName}`);
			}
		});
	}

	private static async fetchDetailedStats(userId: string): Promise<any> {
		try {
			const response = await fetch(`/api/users/${userId}/stats`, {
				credentials: 'include'
			});

			if (!response.ok) {
				throw new Error('Failed to fetch detailed stats');
			}

			return await response.json();
		} catch (error) {
			console.error('Error fetching detailed stats:', error);
			return;
		}
	}

	private static async fetchRecentMatches(userId: string, limit: number = 10): Promise<any[]> {
		try {
			// Use the same endpoint as profile page
			const response = await fetch(`/api/users/${userId}/matches?limit=${limit}`, {
				credentials: 'include'
			});

			if (!response.ok) {
				throw new Error('Failed to fetch matches');
			}

			const data = await response.json();

			// Handle different response formats
			let matches: any[] = [];
			if (Array.isArray(data)) {
				matches = data;
			} else if (data && Array.isArray(data.matches)) {
				matches = data.matches;
			} else if (data && Array.isArray(data.data)) {
				matches = data.data;
			} else {
				console.warn('Unexpected matches response format:', data);
				matches = [];
			}

			return matches;
		} catch (error) {
			console.error('Error fetching matches:', error);
			return [];
		}
	}

	private static async fetchRecentTournaments(userId: string, limit = 5) {
		const res = await fetch(`/api/users/${userId}/tournaments?limit=${limit}`, {
			credentials: 'include'
		});
		if (!res.ok) return [];
		return await res.json();
	}

	private static async createTournamentsSection(userId: string, user: any) {
		const section = document.createElement('div');
		section.className = 'mb-8';

		const title = document.createElement('h2');
		title.textContent = 'Recent Tournaments';
		title.className = `font-['Orbitron'] text-2xl font-bold text-gray-800 mb-4`;
		section.appendChild(title);

		const list = document.createElement('div');
		list.className = 'space-y-3';
		section.appendChild(list);

		const tourns = await this.fetchRecentTournaments(userId);

		if (tourns.length === 0) {
			list.innerHTML = `<div class="text-center py-8 text-gray-500">
                No tournaments played yet
            </div>`;
			return section;
		}

		tourns.forEach(t => {
			// calc WIN / LOSS for current user
			const isWinner = t.winnerId === userId;

			// recuperer les scores:
			const finalMatch = t.matches[t.matches.length - 1]; // on recup la finale
			// on calcule le score du joueur courant vs l’adversaire
			let userScore = 0, oppScore = 0;
			if (finalMatch.playerOneId === userId) {
				userScore = finalMatch.playerOneScore;
				oppScore = finalMatch.playerTwoScore;
			} else {
				userScore = finalMatch.playerTwoScore;
				oppScore = finalMatch.playerOneScore;
			}
			// const opponent =
			// finalMatch.playerOneId === userId
			//     ? t.participants.find((p:any) => p.userId === finalMatch.playerTwoId)?.user
			//     : t.participants.find((p:any) => p.userId === finalMatch.playerOneId)?.user;

			const item = document.createElement('div');
			item.className = `
                bg-white border border-gray-200 rounded-lg p-4 shadow-sm
                cursor-pointer hover:bg-gray-50 hover:border-purple-300
                transition-all duration-200
            `;

			// header : Champions ⟷ Date + result
			item.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center space-x-2">
                    <span class="font-semibold">${isWinner ? '🏆 VICTORY' : '🚩 DEFEAT'}</span>
                    <span class="text-xs bg-gray-100 px-2 py-1 rounded ml-2 font-medium text-gray-600">
                        Tournament
                    </span>
                    </div>
                    <div class="text-right">
                        <div class="font-bold ${isWinner ? 'text-green-600' : 'text-red-600'}">
                            ${userScore} - ${oppScore}
                        </div>
                        <div class="text-xs font-medium ${isWinner ? 'text-green-600' : 'text-red-600'}">
                            ${isWinner ? 'WIN' : 'LOSS'}
                        </div>
                    </div>
                </div>
                <div class="mb-1 mt-2 text-sm text-gray-500">
                    ${new Date(t.playedAt).toLocaleDateString('en-GB', {
				year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
			})}
                </div>
                <div class="text-xs text-purple-500 opacity-70">
                    Click for details →
                </div>
            `;

			/* click -> panneau détaillé */
			item.onclick = () => this.showTournamentDetails(t, userId);
			list.appendChild(item);
		});
		return section;
	}

	private static showTournamentDetails(t: any, currentUserId: string) {
		const panel = document.getElementById('match-details-panel');
		if (!panel) return;
		panel.style.opacity = '1'; panel.style.transform = 'translateX(0)';

		/* construire un petit bracket “semi‑finales / finale” */
		const semi1 = t.matches[0];
		const semi2 = t.matches[1];
		const final = t.matches[2];

		const row = (m: any, label: string) => `
            <div class="flex justify-between mb-1">
            <span>${label}</span>
            <span>${m.playerOneScore}‑${m.playerTwoScore}</span>
            </div>
        `;
		const youWon = t.winnerId === currentUserId;
		panel.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold">Tournament Details</h3>
                <button id="close-match-details"
                    class="text-gray-500 hover:text-gray-700 text-xl font-bold">×</button>
                </div>

                <div class="text-center mb-4 p-4 rounded-lg ${youWon ? 'bg-green-50' : 'bg-red-50'}">
                <div class="text-2xl mb-2">${youWon ? '🏆' : '😔'}</div>
                <div class="text-xl font-bold ${youWon ? 'text-green-600' : 'text-red-600'}">
                    ${youWon ? 'YOU WON' : 'YOU LOST'}
                </div>
                </div>

                <h4 class="font-semibold mb-2">Bracket</h4>
                <div class="bg-gray-50 p-4 rounded mb-4">
                ${row(semi1, 'Semi-final 1')}
                ${row(semi2, 'Semi-final 2')}
                <hr class="my-2">
                ${row(final, 'Final')}
                </div>

                <h4 class="font-semibold mb-2">Players</h4>
                <ul class="list-disc list-inside text-sm">
                ${t.participants.map((p: any) => `<li>${p.user.displayName}</li>`).join('')}
                </ul>
            </div>
        `;

		panel.querySelector('#close-match-details')
			?.addEventListener('click', () => {
				panel.style.opacity = '0';
				panel.style.transform = 'translateX(100%)';
			});
	}

	private static async	embedChat(user: any, mainContainer: HTMLElement) {
		const	chat_page = document.createElement('iframe');
		chat_page.title = 'chat';
		chat_page.src = `/chat/${user.displayName}`;
		chat_page.style.width = "100%";
		chat_page.style.zIndex = '50';
		chat_page.style.marginLeft = '20px';
		chat_page.style.marginRight = '10px';

		mainContainer.appendChild(chat_page);
	}
}
