// Local Storage Management for Habit Tracker
class HabitStorage {
    constructor() {
        this.storageKey = 'habitTracker';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.storageKey)) {
            this.saveData({
                habits: [],
                completions: {},
                settings: {
                    createdAt: new Date().toISOString()
                }
            });
        }
    }

    getData() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey)) || { habits: [], completions: {} };
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return { habits: [], completions: {} };
        }
    }

    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    addHabit(habit) {
        const data = this.getData();
        const newHabit = {
            id: Date.now().toString(),
            name: habit.name,
            category: habit.category,
            createdAt: new Date().toISOString(),
            streak: 0,
            bestStreak: 0,
            totalCompletions: 0,
            lastCompleted: null
        };
        
        data.habits.push(newHabit);
        this.saveData(data);
        return newHabit;
    }

    getHabits() {
        return this.getData().habits;
    }

    updateHabit(habitId, updates) {
        const data = this.getData();
        const habitIndex = data.habits.findIndex(h => h.id === habitId);
        
        if (habitIndex !== -1) {
            data.habits[habitIndex] = { ...data.habits[habitIndex], ...updates };
            this.saveData(data);
            return data.habits[habitIndex];
        }
        return null;
    }

    deleteHabit(habitId) {
        const data = this.getData();
        data.habits = data.habits.filter(h => h.id !== habitId);
        
        // Clean up completions for this habit
        Object.keys(data.completions).forEach(date => {
            if (data.completions[date][habitId]) {
                delete data.completions[date][habitId];
            }
        });
        
        this.saveData(data);
        return true;
    }

    markHabitComplete(habitId, date = null) {
        const today = date || new Date().toISOString().split('T')[0];
        const data = this.getData();
        
        if (!data.completions[today]) {
            data.completions[today] = {};
        }
        
        data.completions[today][habitId] = {
            completed: true,
            timestamp: new Date().toISOString()
        };
        
        // Update habit stats
        const habit = data.habits.find(h => h.id === habitId);
        if (habit) {
            habit.totalCompletions++;
            habit.lastCompleted = today;
            
            // Calculate streak
            habit.streak = this.calculateStreak(habitId, today);
            habit.bestStreak = Math.max(habit.bestStreak, habit.streak);
        }
        
        this.saveData(data);
        return true;
    }

    markHabitSkipped(habitId, date = null) {
        const today = date || new Date().toISOString().split('T')[0];
        const data = this.getData();
        
        if (!data.completions[today]) {
            data.completions[today] = {};
        }
        
        data.completions[today][habitId] = {
            completed: false,
            skipped: true,
            timestamp: new Date().toISOString()
        };
        
        // Reset streak
        const habit = data.habits.find(h => h.id === habitId);
        if (habit) {
            habit.streak = 0;
        }
        
        this.saveData(data);
        return true;
    }

    calculateStreak(habitId, endDate) {
        const data = this.getData();
        let streak = 0;
        let currentDate = new Date(endDate);
        
        while (true) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const completion = data.completions[dateStr]?.[habitId];
            
            if (completion && completion.completed) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (completion && completion.skipped) {
                break; // Streak broken by skip
            } else {
                // Check if this is a recent date (within last 2 days) or if habit existed
                const habit = data.habits.find(h => h.id === habitId);
                const habitCreated = new Date(habit.createdAt);
                
                if (currentDate < habitCreated) {
                    break; // Don't count days before habit was created
                }
                
                const daysDiff = Math.floor((new Date() - currentDate) / (1000 * 60 * 60 * 24));
                if (daysDiff <= 1) {
                    // Recent day without completion - streak continues for now
                    currentDate.setDate(currentDate.getDate() - 1);
                } else {
                    break; // Older day without completion - streak broken
                }
            }
        }
        
        return streak;
    }

    getHabitCompletions(habitId, days = 30) {
        const data = this.getData();
        const completions = [];
        const endDate = new Date();
        
        for (let i = 0; i < days; i++) {
            const date = new Date(endDate);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const completion = data.completions[dateStr]?.[habitId];
            completions.push({
                date: dateStr,
                completed: completion?.completed || false,
                skipped: completion?.skipped || false
            });
        }
        
        return completions.reverse();
    }

    getTodayCompletions() {
        const today = new Date().toISOString().split('T')[0];
        const data = this.getData();
        return data.completions[today] || {};
    }

    getCompletionRate(days = 7) {
        const data = this.getData();
        const habits = data.habits;
        
        if (habits.length === 0) return 0;
        
        let totalPossible = 0;
        let totalCompleted = 0;
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            habits.forEach(habit => {
                const habitCreated = new Date(habit.createdAt);
                if (date >= habitCreated) {
                    totalPossible++;
                    const completion = data.completions[dateStr]?.[habit.id];
                    if (completion && completion.completed) {
                        totalCompleted++;
                    }
                }
            });
        }
        
        return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
    }

    exportData() {
        return this.getData();
    }

    importData(importedData) {
        try {
            this.saveData(importedData);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    clearAllData() {
        localStorage.removeItem(this.storageKey);
        this.init();
        return true;
    }
}

// Initialize storage
const habitStorage = new HabitStorage();