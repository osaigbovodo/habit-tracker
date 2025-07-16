// Main Application Logic
class HabitTracker {
    constructor() {
        this.storage = habitStorage;
        this.ai = habitAI;
        this.init();
    }

    init() {
        this.bindEvents();
        this.render();
        this.updateInsights();
        this.updateStats();
    }

    bindEvents() {
        // Add habit form
        document.getElementById('habit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addHabit();
        });

        // Update insights every 30 seconds
        setInterval(() => {
            this.updateInsights();
        }, 30000);
    }

    addHabit() {
        const nameInput = document.getElementById('habit-name');
        const categorySelect = document.getElementById('habit-category');
        
        const name = nameInput.value.trim();
        const category = categorySelect.value;

        if (!name) return;

        const habit = this.storage.addHabit({ name, category });
        
        nameInput.value = '';
        this.render();
        this.updateStats();
        this.updateInsights();
    }

    render() {
        const container = document.getElementById('habits-container');
        const habits = this.storage.getHabits();
        const todayCompletions = this.storage.getTodayCompletions();

        if (habits.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #718096; padding: 40px;">No habits yet. Add your first habit above!</p>';
            return;
        }

        container.innerHTML = habits.map(habit => {
            const isCompleted = todayCompletions[habit.id]?.completed;
            const isSkipped = todayCompletions[habit.id]?.skipped;
            const difficulty = this.ai.calculateHabitDifficulty(habit.id);
            const optimalTime = this.ai.predictOptimalTime(habit.id);

            return `
                <div class="habit-card">
                    <div class="habit-header">
                        <div>
                            <div class="habit-name">${habit.name}</div>
                            <span class="habit-category">${habit.category}</span>
                        </div>
                        <div style="text-align: right; font-size: 0.8rem; color: #718096;">
                            <div>Difficulty: ${difficulty}%</div>
                            <div>Best time: ${optimalTime}</div>
                        </div>
                    </div>
                    
                    <div class="habit-stats">
                        <span>🔥 Streak: ${habit.streak} days</span>
                        <span>🏆 Best: ${habit.bestStreak} days</span>
                        <span>✅ Total: ${habit.totalCompletions}</span>
                        <span>📅 Created: ${new Date(habit.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min((habit.streak / 21) * 100, 100)}%"></div>
                    </div>
                    <div style="font-size: 0.8rem; color: #718096; margin-bottom: 15px;">
                        ${habit.streak}/21 days to automatic habit
                    </div>

                    <div class="habit-actions">
                        <button class="btn btn-complete" 
                                onclick="app.completeHabit('${habit.id}')"
                                ${isCompleted ? 'disabled' : ''}>
                            ${isCompleted ? '✅ Completed' : '✅ Complete'}
                        </button>
                        <button class="btn btn-skip" 
                                onclick="app.skipHabit('${habit.id}')"
                                ${isCompleted || isSkipped ? 'disabled' : ''}>
                            ${isSkipped ? '⏭️ Skipped' : '⏭️ Skip'}
                        </button>
                        <button class="btn btn-delete" onclick="app.deleteHabit('${habit.id}')">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    completeHabit(habitId) {
        this.storage.markHabitComplete(habitId);
        this.render();
        this.updateStats();
        this.updateInsights();
        this.showNotification('Habit completed! 🎉');
    }

    skipHabit(habitId) {
        this.storage.markHabitSkipped(habitId);
        this.render();
        this.updateStats();
        this.updateInsights();
        this.showNotification('Habit skipped. Tomorrow is a new day! 💪');
    }

    deleteHabit(habitId) {
        if (confirm('Are you sure you want to delete this habit? This action cannot be undone.')) {
            this.storage.deleteHabit(habitId);
            this.render();
            this.updateStats();
            this.updateInsights();
            this.showNotification('Habit deleted.');
        }
    }

    updateStats() {
        const habits = this.storage.getHabits();
        const todayCompletions = this.storage.getTodayCompletions();
        const completionRate = this.storage.getCompletionRate(1); // Today's rate
        
        const completedToday = Object.values(todayCompletions).filter(c => c.completed).length;
        const bestStreak = Math.max(...habits.map(h => h.bestStreak), 0);

        document.getElementById('total-habits').textContent = habits.length;
        document.getElementById('completion-rate').textContent = `${completionRate}%`;
        document.getElementById('streak-count').textContent = bestStreak;
    }

    updateInsights() {
        const insights = this.ai.generateInsights();
        const container = document.getElementById('insights-container');

        if (insights.length === 0) {
            container.innerHTML = '<p>Complete some habits to get AI-powered insights!</p>';
            return;
        }

        container.innerHTML = insights.map(insight => `
            <div class="insight-card">
                <div class="insight-title">
                    ${this.getInsightIcon(insight.type)} ${insight.title}
                </div>
                <div class="insight-text">${insight.message}</div>
            </div>
        `).join('');
    }

    getInsightIcon(type) {
        const icons = {
            welcome: '👋',
            success: '🎉',
            improvement: '📈',
            motivation: '💪',
            achievement: '🏆',
            encouragement: '⚡',
            pattern: '🧠',
            prediction: '🔮',
            warning: '⚠️',
            timing: '⏰',
            strategy: '🎯',
            adjustment: '🔧'
        };
        return icons[type] || '💡';
    }

    showNotification(message) {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #48bb78;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 3000);
    }

    // Export data for backup
    exportData() {
        const data = this.storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Data exported successfully! 📁');
    }

    // Import data from backup
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (this.storage.importData(data)) {
                    this.render();
                    this.updateStats();
                    this.updateInsights();
                    this.showNotification('Data imported successfully! 📥');
                } else {
                    this.showNotification('Failed to import data. Please check the file format.');
                }
            } catch (error) {
                this.showNotification('Invalid file format. Please select a valid backup file.');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the app
const app = new HabitTracker();

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 'n':
                e.preventDefault();
                document.getElementById('habit-name').focus();
                break;
            case 'e':
                e.preventDefault();
                app.exportData();
                break;
        }
    }
});

// Add service worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('Service Worker registered'))
            .catch(() => console.log('Service Worker registration failed'));
    });
}