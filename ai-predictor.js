// AI-Powered Habit Prediction and Insights
class HabitAI {
    constructor(storage) {
        this.storage = storage;
        this.insights = [];
    }

    // Generate AI insights based on habit data
    generateInsights() {
        const habits = this.storage.getHabits();
        const insights = [];

        if (habits.length === 0) {
            return [{
                type: 'welcome',
                title: '🎯 Welcome to AI Habit Tracking!',
                message: 'Start by adding your first habit. I\'ll analyze your patterns and provide personalized insights to help you succeed.'
            }];
        }

        // Analyze completion patterns
        insights.push(...this.analyzeCompletionPatterns());
        
        // Analyze streaks
        insights.push(...this.analyzeStreaks());
        
        // Analyze categories
        insights.push(...this.analyzeCategoryPerformance());
        
        // Predict success likelihood
        insights.push(...this.predictSuccessLikelihood());
        
        // Provide recommendations
        insights.push(...this.generateRecommendations());

        return insights.slice(0, 5); // Limit to top 5 insights
    }

    analyzeCompletionPatterns() {
        const insights = [];
        const habits = this.storage.getHabits();
        const completionRate = this.storage.getCompletionRate(7);
        
        if (completionRate >= 80) {
            insights.push({
                type: 'success',
                title: '🔥 Excellent Progress!',
                message: `You're crushing it with a ${completionRate}% completion rate this week! Your consistency is building strong neural pathways.`
            });
        } else if (completionRate >= 60) {
            insights.push({
                type: 'improvement',
                title: '📈 Good Momentum',
                message: `${completionRate}% completion rate shows solid progress. Try the "2-minute rule" - make habits so easy you can't say no.`
            });
        } else if (completionRate < 40 && habits.length > 0) {
            insights.push({
                type: 'motivation',
                title: '💪 Let\'s Bounce Back',
                message: `${completionRate}% completion rate suggests you might be overcommitting. Consider focusing on 1-2 core habits first.`
            });
        }

        return insights;
    }

    analyzeStreaks() {
        const insights = [];
        const habits = this.storage.getHabits();
        
        const bestStreak = Math.max(...habits.map(h => h.bestStreak), 0);
        const currentStreaks = habits.filter(h => h.streak > 0);
        
        if (bestStreak >= 7) {
            insights.push({
                type: 'achievement',
                title: '🏆 Streak Master!',
                message: `Your best streak of ${bestStreak} days shows you have the discipline to build lasting habits. That's neuroplasticity in action!`
            });
        }
        
        if (currentStreaks.length > 0) {
            const avgStreak = Math.round(currentStreaks.reduce((sum, h) => sum + h.streak, 0) / currentStreaks.length);
            insights.push({
                type: 'encouragement',
                title: '⚡ Active Streaks Detected',
                message: `You have ${currentStreaks.length} active streak(s) with an average of ${avgStreak} days. Keep the momentum going!`
            });
        }

        return insights;
    }

    analyzeCategoryPerformance() {
        const insights = [];
        const habits = this.storage.getHabits();
        
        if (habits.length < 2) return insights;
        
        const categoryStats = {};
        habits.forEach(habit => {
            if (!categoryStats[habit.category]) {
                categoryStats[habit.category] = { total: 0, completions: 0, streaks: 0 };
            }
            categoryStats[habit.category].total++;
            categoryStats[habit.category].completions += habit.totalCompletions;
            categoryStats[habit.category].streaks += habit.bestStreak;
        });

        const bestCategory = Object.keys(categoryStats).reduce((best, category) => {
            const avgCompletions = categoryStats[category].completions / categoryStats[category].total;
            const bestAvg = categoryStats[best]?.completions / categoryStats[best]?.total || 0;
            return avgCompletions > bestAvg ? category : best;
        });

        if (bestCategory && categoryStats[bestCategory].total > 0) {
            insights.push({
                type: 'pattern',
                title: '🎯 Category Champion',
                message: `You excel at ${bestCategory} habits! Your brain has formed strong associations in this area. Consider leveraging this strength.`
            });
        }

        return insights;
    }

    predictSuccessLikelihood() {
        const insights = [];
        const habits = this.storage.getHabits();
        
        habits.forEach(habit => {
            const completions = this.storage.getHabitCompletions(habit.id, 14);
            const recentCompletions = completions.slice(-7).filter(c => c.completed).length;
            const successLikelihood = this.calculateSuccessLikelihood(habit, completions);
            
            if (successLikelihood >= 80) {
                insights.push({
                    type: 'prediction',
                    title: '🚀 High Success Probability',
                    message: `"${habit.name}" has an ${successLikelihood}% likelihood of becoming automatic based on your pattern. You're in the habit formation zone!`
                });
            } else if (successLikelihood <= 30 && habit.totalCompletions > 5) {
                insights.push({
                    type: 'warning',
                    title: '⚠️ Habit at Risk',
                    message: `"${habit.name}" shows ${successLikelihood}% success likelihood. Consider simplifying it or changing the trigger/reward.`
                });
            }
        });

        return insights.slice(0, 2); // Limit predictions
    }

    calculateSuccessLikelihood(habit, completions) {
        const recentCompletions = completions.slice(-7);
        const completionRate = recentCompletions.filter(c => c.completed).length / 7;
        const streakFactor = Math.min(habit.streak / 21, 1); // 21 days to form habit
        const consistencyFactor = this.calculateConsistency(completions);
        
        return Math.round((completionRate * 0.4 + streakFactor * 0.4 + consistencyFactor * 0.2) * 100);
    }

    calculateConsistency(completions) {
        if (completions.length < 7) return 0;
        
        const windows = [];
        for (let i = 0; i <= completions.length - 7; i++) {
            const window = completions.slice(i, i + 7);
            const rate = window.filter(c => c.completed).length / 7;
            windows.push(rate);
        }
        
        const avgRate = windows.reduce((sum, rate) => sum + rate, 0) / windows.length;
        const variance = windows.reduce((sum, rate) => sum + Math.pow(rate - avgRate, 2), 0) / windows.length;
        
        return Math.max(0, 1 - variance); // Lower variance = higher consistency
    }

    generateRecommendations() {
        const insights = [];
        const habits = this.storage.getHabits();
        const todayCompletions = this.storage.getTodayCompletions();
        
        // Time-based recommendations
        const hour = new Date().getHours();
        if (hour < 10) {
            const morningHabits = habits.filter(h => !todayCompletions[h.id]?.completed);
            if (morningHabits.length > 0) {
                insights.push({
                    type: 'timing',
                    title: '🌅 Morning Opportunity',
                    message: `Morning is prime time for habit formation. Your willpower is strongest now - perfect for tackling "${morningHabits[0].name}".`
                });
            }
        }

        // Habit stacking recommendations
        const completedToday = Object.keys(todayCompletions).filter(id => todayCompletions[id].completed);
        const pendingHabits = habits.filter(h => !todayCompletions[h.id]?.completed);
        
        if (completedToday.length > 0 && pendingHabits.length > 0) {
            insights.push({
                type: 'strategy',
                title: '🔗 Habit Stacking Opportunity',
                message: `You've completed some habits today! Try "stacking" - do "${pendingHabits[0].name}" right after your next completed habit.`
            });
        }

        // Difficulty adjustment
        const strugglingHabits = habits.filter(h => {
            const completions = this.storage.getHabitCompletions(h.id, 7);
            return completions.filter(c => c.completed).length < 3;
        });

        if (strugglingHabits.length > 0) {
            insights.push({
                type: 'adjustment',
                title: '🎯 Simplification Suggestion',
                message: `"${strugglingHabits[0].name}" might be too ambitious. Try the 1% rule - make it 1% easier until it becomes automatic.`
            });
        }

        return insights;
    }

    // Predict best time to do a habit based on historical data
    predictOptimalTime(habitId) {
        // This would analyze completion times and suggest optimal scheduling
        // For now, return general recommendations
        const habit = this.storage.getHabits().find(h => h.id === habitId);
        if (!habit) return null;

        const recommendations = {
            health: 'Morning (6-9 AM) when willpower is highest',
            productivity: 'Morning (9-11 AM) during peak focus hours',
            learning: 'Evening (7-9 PM) for better retention',
            social: 'Afternoon (2-5 PM) when energy is balanced',
            other: 'Choose a consistent time that fits your schedule'
        };

        return recommendations[habit.category] || recommendations.other;
    }

    // Generate habit difficulty score
    calculateHabitDifficulty(habitId) {
        const habit = this.storage.getHabits().find(h => h.id === habitId);
        if (!habit) return 0;

        const completions = this.storage.getHabitCompletions(habitId, 30);
        const completionRate = completions.filter(c => c.completed).length / completions.length;
        const streakConsistency = habit.bestStreak / 30; // Normalize to 30 days
        
        // Lower completion rate and streak = higher difficulty
        return Math.round((1 - (completionRate * 0.7 + streakConsistency * 0.3)) * 100);
    }
}

// Initialize AI predictor
const habitAI = new HabitAI(habitStorage);