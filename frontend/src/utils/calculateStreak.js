export function calculateStreak(completedDates) {
    const today = new Date();
    let streak = 0;

    while (true) {
        const d = new Date(today);
        d.setDate(today.getDate() - streak);
        const key = d.toISOString().slice(0, 10);

        if (completedDates[key]) {
            streak++;
        } else {
            break;
        }
    }

    return streak;
}
