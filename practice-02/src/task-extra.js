export function searchTasks(tasks, query) {
    const trimmedQuery = query.trim().toLowerCase();
    if (trimmedQuery === "") {
        return [...tasks];
    }
    return tasks.filter(task =>
        task.title.toLowerCase().includes(trimmedQuery)
    );
}