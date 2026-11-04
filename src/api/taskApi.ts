
import type { Task, TaskStatus } from "../types/task";

const BASE_URL = "http://192.168.0.20:8000";

// Common API response handler
async function checkResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`HTTP Error ${response.status}: ${message}`);
  }

  return response.json() as Promise<T>;
}

// GET all tasks
export const getTasks = async (): Promise<Task[]> => {
  const response = await fetch(`${BASE_URL}/tasks`);
  return checkResponse<Task[]>(response);
};

// GET task by ID
export const getTaskById = async (id: number): Promise<Task> => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`);
  return checkResponse<Task>(response);
};

// CREATE task
export const createTask = async (
  title: string,
  description: string,
  status: TaskStatus,
  priority: Task["priority"]
): Promise<Task> => {
  const response = await fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: 1,
      title,
      description,
      status,
      priority,
    }),
  });
  console.log("STATUS SENDING TO BACKEND:", status);
  
  return checkResponse<Task>(response);
};

// UPDATE task
export const updateTask = async (
  id: number,
  updates: Partial<Task>
): Promise<Task> => {
  const existing = await getTaskById(id);
  const updated = { ...existing, ...updates };

  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: updated.userId,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      priority: updated.priority,
    }),
  });

  return checkResponse<Task>(response);
};

// DELETE task
export const deleteTask = async (id: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Delete failed: ${response.status}: ${message}`);
  }
};
