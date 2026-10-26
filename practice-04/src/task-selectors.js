export function getVisibleTasks(tasks, statusFilter, priorityFilter = 'all') {
    return tasks.filter(task => {
        const matchStatus = statusFilter === 'all' ||
            (statusFilter === 'pending' && task.completed === false) ||
            (statusFilter === 'completed' && task.completed === true);
        const matchPriority = priorityFilter === 'all' || task.priority === priorityFilter;
        return matchStatus && matchPriority;
    });
}