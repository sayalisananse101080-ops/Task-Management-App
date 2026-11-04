export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type Task = {
    id: number;
    userId: number;
    title: string;
    description: string;
    status: TaskStatus;
    priority: 'Low' | 'Medium' | 'High';
};