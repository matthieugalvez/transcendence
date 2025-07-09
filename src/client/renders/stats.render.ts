import { router } from '../configs/simplerouter';
import { WebSocketService } from '../services/websocket.service';
import { renderChatPage } from '../pages/ChatPage';
import Chart from 'chart.js/auto';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import { BoxPlotController, BoxAndWiskers } from '@sgratzl/chartjs-chart-boxplot';
import 'chartjs-adapter-date-fns';
import { DoughnutController, ArcElement, BarController, CategoryScale, LinearScale } from 'chart.js/auto';
import { TimeScale, LineController, LineElement, PointElement } from 'chart.js/auto';
import { CommonComponent } from '../components/common.component';
import { language_obj } from '..';

Chart.register(TimeScale, LineController, LineElement, PointElement);
Chart.register(DoughnutController, ArcElement, BarController, CategoryScale, LinearScale);
Chart.register(MatrixController, MatrixElement, BoxPlotController, BoxAndWiskers);

export class StatsRender {
	private static createStatsHeader(user: any, isOwnStats: boolean): HTMLElement {
		const header = document.createElement('div');
		header.className = 'flex items-center justify-between mb-8';

		const title = document.createElement('h1');
		title.textContent = isOwnStats ? `${language_obj['Your_stats']}` : `${user.displayName}'s ${language_obj['Stats']}`;
		title.className = `font-['Orbitron'] text-2xl font-bold text-gray-900`;

		// Avatar container with status dot
		const avatarContainer = document.createElement('div');
		avatarContainer.className = 'relative';

		const avatar = document.createElement('img');
		avatar.src = user.avatar;
		////console.log(`Avatar URL for stats: ${user.avatar}`);
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
		statusDot.title = `${language_obj['Checking_status']}`;

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
		// Create main container with flex layout and proper height constraint
		document.body.style.overflow = 'auto';
		const mainContainer = document.createElement('div');
		mainContainer.className = 'flex w-full h-full overflow-hidden';
		mainContainer.style.marginLeft = '355px';

		const statsCard = document.createElement('div');
		statsCard.title = 'statsCard';
		statsCard.className = `
			bg-white/90 backdrop-blur-md
			border-2 border-black
			rounded-xl mb-5 p-4 shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
			w-[45%] max-w-xxl transition-all duration-300
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

		if (!isOwnStats) {
			this.embedChat(user, mainContainer);
		} else {
			this.createCharts(statsData, user.id, mainContainer);
		}

		const matchDetailsPanel = this.createMatchDetailsPanel();
		mainContainer.appendChild(matchDetailsPanel);


		(window as any).matchDetailsPanel = matchDetailsPanel;
		(window as any).currentUser = user;

		document.body.appendChild(mainContainer);

		const	LanguageMenu = CommonComponent.createLanguageMenu(language_obj['_lang']);
		document.body.appendChild(LanguageMenu);
	}

	private static createMatchDetailsPanel(): HTMLElement {
		const panel = document.createElement('div');
		panel.id = 'match-details-panel';
		panel.className = `
			absolute left-[45%]
            w-96 bg-white/95 backdrop-blur-md
            border-2 border-black rounded-xl
            shadow-[8.0px_10.0px_0.0px_rgba(0,0,0,0.8)]
            translate-x-full transition-all duration-300 ease-in-out
			opacity-0 overflow-hidden
        `;
		panel.style.pointerEvents = 'none';
		panel.style.height = 'fit-content';
		panel.style.maxHeight = '90vh';
		panel.style.overflowY = 'auto';
		panel.style.zIndex = '50';

		const content = document.createElement('div');
		content.className = 'p-6';
		content.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <div class="text-4xl mb-4">🏓</div>
                <p>${language_obj['Click_to_view_details']}</p>
            </div>
        `;

		panel.appendChild(content);
		return panel;
	}

	private static createOverviewSection(statsData: any): HTMLElement {
		const section = document.createElement('div');
		section.className = 'mb-8';

		const title = document.createElement('h2');
		title.textContent = `${language_obj['Overview']}`;
		title.className = `font-['Orbitron'] text-2xl font-bold mb-4 text-gray-800`;

		const grid = document.createElement('div');
		grid.className = 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6';

		const totalGames = (statsData.oneVOneWins || 0) + (statsData.oneVOneLosses || 0) +
			(statsData.tournamentWins || 0) + (statsData.tournamentLosses || 0);
		const totalWins = (statsData.oneVOneWins || 0) + (statsData.tournamentWins || 0);
		const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

		const overviewStats = [
			{
				label: `${language_obj['Total_games']}`,
				value: totalGames.toString(),
				icon: '🎮',
				color: 'bg-blue-100 text-blue-800'
			},
			{
				label: `${language_obj['Winrate']}`,
				value: `${winRate}%`,
				icon: '🏆',
				color: 'bg-green-100 text-green-800'
			},
			{
				label: `${language_obj['Total_wins']}`,
				value: totalWins.toString(),
				icon: '🔥',
				color: 'bg-orange-100 text-orange-800'
			},
			{
				label: `${language_obj['Favorite_mode']}`,
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
		title.textContent = `${language_obj['Performance_charts']}`;
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
		title.textContent = `${language_obj['Win_loss_distr']}`;
		title.className = 'font-medium mb-4 text-center';

		const chartContainer = document.createElement('div');
		chartContainer.className = 'space-y-2';

		const categories = [
			{ label: `1v1 ${language_obj['Wins']}`, value: statsData.oneVOneWins || 0, color: 'bg-green-500' },
			{ label: `1v1 ${language_obj['Losses']}`, value: statsData.oneVOneLosses || 0, color: 'bg-red-500' },
			{ label: `${language_obj['Tournament']} ${language_obj['Wins']}`, value: statsData.tournamentWins || 0, color: 'bg-blue-500' },
			{ label: `${language_obj['Tournament']} ${language_obj['Losses']}`, value: statsData.tournamentLosses || 0, color: 'bg-orange-500' }
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
		title.textContent = `${language_obj['Mode_performance']}`;
		title.className = 'font-medium mb-4 text-center';

		const modeData = [
			{
				mode: '1v1',
				wins: statsData.oneVOneWins || 0,
				losses: statsData.oneVOneLosses || 0,
				color: 'bg-blue-500'
			},
			{
				mode: `${language_obj['Tournament']}`,
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

	private static async createCharts(statsData: any, userId: string, mainContainer: HTMLElement) {
		const section = document.createElement('div');
		section.className = `
			flex-1 m-10 h-full
			bg-white/80 backdrop-blur-md
			border-2 border-black rounded-xl p-4
			shadow-[8px_10px_0_rgba(0,0,0,0.8)]
			overflow-y-auto h-[700px]
		`;

		const title = document.createElement('h2');
		title.textContent = `${language_obj['Visual_charts']}`;
		title.className = `font-['Orbitron'] text-2xl font-bold mb-4 text-gray-800`;

		const chartsGrid = document.createElement('div');
		chartsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-6';

		// new charts
		const scoreTime = await this.createWinRateTimeline(userId);
        chartsGrid.appendChild(scoreTime);

		const headChart = await this.createHeadToHeadChart(userId);
		chartsGrid.appendChild(headChart);

		const pieChart = this.createWinLossPieChart(statsData);
		pieChart.classList.add('md:col-span-2', 'justify-self-center');
		chartsGrid.appendChild(pieChart);

		section.appendChild(title);
		section.appendChild(chartsGrid);

		mainContainer.appendChild(section);
		// return section;
	}

	private static async createWinRateTimeline(userId:string):Promise<HTMLElement>{
		const box=document.createElement('div');
		box.className='bg-gray-50 p-4 rounded-lg';
		box.style.height  = '310px';
		box.innerHTML=`<h3 class="font-medium mb-1 text-center">${language_obj['Winrate_over_time']}</h3><canvas></canvas>`;
		const ctx=box.querySelector('canvas')! as HTMLCanvasElement;

		/* recuperer tous les matchs connus */
		const matches=await this.fetchRecentMatches(userId,500);
		matches.sort((a,b)=>new Date(a.playedAt).getTime()-new Date(b.playedAt).getTime());

		let wins=0;
		const points = matches.map((m,i)=>{
			const isWin = m.winnerId===userId;
			if (isWin) wins++;
			const wr = Math.round(100*wins/(i+1));
			return { x:new Date(m.playedAt), y:wr };
		});

		new Chart(ctx,{
			type:'line',
			data:{ datasets:[{
				label:'Win %',
				data:points,
				borderWidth:2,
				borderColor:'#6366f1',
				tension:0.4,
				fill:false,
				pointRadius:0
			}]},
			options:{
				plugins:{ legend:{display:false} },
				scales:{
					x:{ type:'time', time:{ unit:'week' }, grid:{display:false} },
					y:{ beginAtZero:true, suggestedMax:100, ticks:{ callback:v=>v+'%' } }
				},
				responsive:true,
				maintainAspectRatio:false,
				layout:{ padding:20 }
			}
		});
		return box;
	}

	private static async createHeadToHeadChart(userId: string): Promise<HTMLElement> {
		const box = document.createElement('div');
		box.className = 'bg-gray-50 p-4 rounded-lg';

		box.innerHTML = `<h3 class="font-medium mb-4 text-center">${language_obj['H2H']}</h3>
						<canvas></canvas>`;
		const ctx = box.querySelector('canvas') as HTMLCanvasElement;

		/* agrège les matchs */
		const matches = await this.fetchRecentMatches(userId, 200);
		const stats: Record<string,{wins:number,total:number}> = {};
		matches.forEach(m => {
			const opp = m.playerOneId === userId ? m.playerTwo : m.playerOne;
			if (!opp) return;
			const key = opp.displayName || opp.id;
			if (!stats[key]) stats[key] = { wins:0, total:0 };
			stats[key].total++;
			if (m.winnerId === userId) stats[key].wins++;
		});

		/* top 3 par % de victoires (puis par volume) */
		const top3 = Object.entries(stats)
			.sort((a,b)=>{
				const aw=a[1].wins/a[1].total, bw=b[1].wins/b[1].total;
				return bw===aw ? b[1].total-a[1].total : bw-aw;
			})
			.slice(0,3);

		const labels = top3.map(e=>e[0]);
		const data   = top3.map(e=>Math.round((e[1].wins/e[1].total)*100));

		new Chart(ctx,{
			type:'bar',
			data:{ labels,
					datasets:[{ data,
								backgroundColor:['#4ade80','#34d399','#10b981']}]},
			options:{
			plugins:{ legend:{display:false} },
			scales:{
				x:{ ticks:{ display:true }, grid:{display:false} },
				y:{ display:false, suggestedMax:100 }
			}
			}
		});
		return box;
	}

	private static createWinLossPieChart(stats:any):HTMLElement{
		const box = document.createElement('div');
		box.className='bg-gray-50 p-4 rounded-lg';

		box.style.height  = '310px';
    	box.style.width   = '70%';

		box.innerHTML=`<h3 class="font-medium mb-1 text-center">${language_obj['Win_loss_breakdown']}</h3><canvas></canvas>`;
		const ctx=box.querySelector('canvas') as HTMLCanvasElement;

		const values=[ stats.oneVOneWins||0, stats.oneVOneLosses||0,
						stats.tournamentWins||0, stats.tournamentLosses||0 ];
		const labels=['1v1 Win','1v1 Loose','Tourn. Win','Tourn. Loose'];
		const colors=['#22c55e','#ef4444','#3b82f6','#f97316'];

		new Chart(ctx,{
			type:'doughnut',
			data:{ labels, datasets:[{ data:values, backgroundColor:colors }]},
			options:{
				plugins:{ legend:{ position:'bottom' } },
				maintainAspectRatio: false,
				cutout: '60%',
				layout:{ padding:20 }
			}
		});
		return box;
	}

	private static async createDetailedMatchesSection(userId: string, user: any): Promise<HTMLElement> {
		const section = document.createElement('div');
		section.className = 'mb-8';

		const header = document.createElement('div');
		header.className = 'flex items-center justify-between mb-4';

		const title = document.createElement('h2');
		title.textContent = `${language_obj['Recent_matches']}`;
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
			noMatches.textContent = `${language_obj['No_matches_yet']}`;
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
			if (user.avatar && user.avatar !== 'null' && user.avatar !== 'undefined') {
				userAvatar.src = user.avatar.startsWith('/avatars/') ? user.avatar : `/avatars/${user.avatar}`;
			} else {
				userAvatar.src = '/avatars/default.svg';
			}
			userAvatar.alt = user.displayName;
			userAvatar.className = 'w-8 h-8 rounded-full';

			// VS text
			const vsText = document.createElement('span');
			vsText.textContent = 'vs';
			vsText.className = 'text-sm font-medium text-gray-500';

			// Opponent avatar
			const opponentAvatar = document.createElement('img');
			if (opponent?.avatar && opponent.avatar !== 'null' && opponent.avatar !== 'undefined') {
				opponentAvatar.src = opponent.avatar.startsWith('/avatars/') ? opponent.avatar : `/avatars/${opponent.avatar}`;
			} else {
				opponentAvatar.src = '/avatars/default.svg';
			}
			opponentAvatar.alt = opponent?.displayName || 'Unknown';
			opponentAvatar.className = 'w-8 h-8 rounded-full';

			// Match details with opponent name
			const matchDetails = document.createElement('div');
			const matchType = document.createElement('span');
			matchType.textContent = match.matchType === 'ONE_V_ONE' ? '1v1' : `${language_obj['Tournament']}`;
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
			result.textContent = isWinner ? `${language_obj['Win_iswinner']}`  : `${language_obj['Loss_iswinner']}`;
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
			clickIndicator.textContent = `${language_obj['Click_for_details']}`;

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
		panel.style.pointerEvents = 'auto';
		panel.style.transform = 'translateX(-50%) translateY(60%)'; // For fixed positioning

		const isWinner = match.winnerId === currentUserId;
		const opponent = match.playerOneId === currentUserId ? match.playerTwo : match.playerOne;
		const currentUserScore = match.playerOneId === currentUserId ? match.playerOneScore : match.playerTwoScore;
		const opponentScore = match.playerOneId === currentUserId ? match.playerTwoScore : match.playerOneScore;

		const matchDate = match.playedAt ? new Date(match.playedAt) : new Date();

		panel.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-800">${language_obj['Matches_details']}</h3>
                    <button id="close-match-details" class="text-gray-500 hover:text-gray-700 text-xl font-bold">×</button>
                </div>

                <!-- Simple Match Result -->
                <div class="text-center mb-6 p-4 rounded-lg ${isWinner ? 'bg-green-50' : 'bg-red-50'}">
                    <div class="text-2xl mb-2">${isWinner ? '🏆' : '😔'}</div>
                    <div class="text-xl font-bold ${isWinner ? 'text-green-600' : 'text-red-600'}">
                        ${isWinner ? `${language_obj['Win_iswinner']}`  : `${language_obj['Loss_iswinner']}`}
                    </div>
                    <div class="text-2xl font-bold text-gray-800 mt-2">
                        ${currentUserScore} - ${opponentScore}
                    </div>
                </div>

                <!-- Opponent Info -->
                <div class="mb-4 p-3 bg-gray-50 rounded-lg flex items-center space-x-3">
            <img src="${opponent?.avatar ? (opponent.avatar.startsWith('/avatars/') ? opponent.avatar : `/avatars/${opponent.avatar}`) : '/avatars/default.svg'}" alt="${opponent?.displayName || 'Unknown'}" class="w-12 h-12 rounded-full">
                    <div>
                        <div class="font-medium text-lg">${opponent?.displayName || 'Unknown Player'}</div>
                        <div class="text-sm text-gray-500">${match.matchType === 'ONE_V_ONE' ? '1v1 Match' : `${language_obj['Tournament']}`}</div>
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
                        ${language_obj['View']} ${opponent?.displayName || `${language_obj['Player']}`} ${language_obj['Profile']}
                    </button>
                </div>
            </div>
        `;

		// Add event listeners
		const closeBtn = panel.querySelector('#close-match-details');
		closeBtn?.addEventListener('click', () => {
			panel.style.transform = 'translateX(50%) translateY(-60%)';
			panel.style.opacity = '0';
			panel.style.pointerEvents = 'none';
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
		title.textContent = `${language_obj['Recent_tournaments']}`;
		title.className = `font-['Orbitron'] text-2xl font-bold text-gray-800 mb-4`;
		section.appendChild(title);

		const list = document.createElement('div');
		list.className = 'space-y-3';
		section.appendChild(list);

		const tourns = await this.fetchRecentTournaments(userId);

		if (tourns.length === 0) {
			list.innerHTML = `<div class="text-center py-8 text-gray-500">
                ${language_obj['No_tournament_yet']}
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
                    <span class="font-semibold">${isWinner ? `🏆 ${language_obj['Victory']} ` : `🚩 ${language_obj['Defeat']} `}</span>
                    <span class="text-xs bg-gray-100 px-2 py-1 rounded ml-2 font-medium text-gray-600">
                        ${language_obj['Tournament']}
                    </span>
                    </div>
                    <div class="text-right">
                        <div class="font-bold ${isWinner ? 'text-green-600' : 'text-red-600'}">
                            ${userScore} - ${oppScore}
                        </div>
                        <div class="text-xs font-medium ${isWinner ? 'text-green-600' : 'text-red-600'}">
                            ${isWinner ? `${language_obj['Win_iswinner']}`  : `${language_obj['Loss_iswinner']}`}
                        </div>
                    </div>
                </div>
                <div class="mb-1 mt-2 text-sm text-gray-500">
                    ${new Date(t.playedAt).toLocaleDateString('en-GB', {
				year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
			})}
                </div>
                <div class="text-xs text-purple-500 opacity-70">
                    ${language_obj['Click_for_details']}
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
		panel.style.opacity = '1';
		panel.style.pointerEvents = 'auto';
		panel.style.transform = 'translateX(-50%) translateY(60%)';

		/* construire un petit bracket “semi‑finales / finale” */
		const semi1 = t.matches[0];
		const semi2 = t.matches[1];
		const final = t.matches[2];

		const id2user = new Map<string, { displayName: string; avatar: string }>();
		t.participants.forEach((p: any) => {
			const uid = p.userId ?? p.user?.id;
			if (uid) id2user.set(uid, p.user);
		});
		const name = (id: string) => id2user.get(id)?.displayName ?? 'Unknown';
		// const avatar = (id: string) => id2user.get(id)?.avatar ?? 'default.svg';

		const matchRow = (m: any) => `
			<div class="flex justify-between items-center mb-1">
			<span class="whitespace-nowrap">
				${name(m.playerOneId)} <span class="opacity-60">vs</span> ${name(m.playerTwoId)}
			</span>
			<span class="font-bold">${m.playerOneScore}-${m.playerTwoScore}</span>
			</div>
		`;

		const playersGrid = `
			<div class="grid grid-cols-2 gap-y-3">
			${t.participants.map((p: any) => `
				<div class="flex items-center space-x-2">
        <img src="${p.user.avatar ? (p.user.avatar.startsWith('/avatars/') ? p.user.avatar : `/avatars/${p.user.avatar}`) : '/avatars/default.svg'}" alt="${p.user.displayName}"
					class="w-8 h-8 rounded-full border">
				<p class="text-sm">
					${p.user.displayName}
				</p>
				</div>`).join('')}
			</div>
		`;

		const youWon = t.winnerId === currentUserId;
		const winner = name(t.winnerId);

		panel.innerHTML = `
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold">${language_obj['Tournament_details']}</h3>
                <button id="close-match-details"
                    class="text-gray-500 hover:text-gray-700 text-xl font-bold">×</button>
                </div>

                <div class="text-center mb-4 p-4 rounded-lg ${youWon ? 'bg-green-50' : 'bg-red-50'}">
                <div class="text-2xl mb-2">${youWon ? '🏆' : '😔'}</div>
                <div class="text-xl font-bold ${youWon ? 'text-green-600' : 'text-red-600'}">
                    ${youWon ? `${language_obj['You_won']}`  : `${language_obj['You_lost']}`}
                </div>
                </div>

                <h4 class="font-semibold mb-2">${language_obj['Bracket']}</h4>
                <div class="bg-gray-50 p-4 rounded mb-2">
					${matchRow(semi1)}
					${matchRow(semi2)}
					<hr class="my-2">
					${matchRow(final)}
                </div>

				<div class="mb-4 text-center"><span class="font-semibold">🏆 ${language_obj['Stats_winner']}</span> ${winner}</div>

                <h4 class="font-semibold mb-2">${language_obj['Players']}</h4>
                ${playersGrid}
            </div>
        `;

		panel.querySelector('#close-match-details')
			?.addEventListener('click', () => {
				panel.style.transform = 'translateX(50%) translateY(-60%)';
				panel.style.opacity = '0';
				panel.style.pointerEvents = 'none';
			});
	}

	private static async embedChat(user: any, mainContainer: HTMLElement) {
		const chat_page = document.createElement('iframe');
		chat_page.title = 'chat';
		chat_page.src = `/chat/${user.displayName}`;
		chat_page.style.width = "100%";
		chat_page.style.zIndex = '40';
		chat_page.style.marginLeft = '10px';
		chat_page.style.marginRight = '10px';

		mainContainer.appendChild(chat_page);
	}
}
