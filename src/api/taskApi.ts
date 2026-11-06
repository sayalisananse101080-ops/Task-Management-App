import type { Task, TaskStatus } from "../types/task";
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { BASE_URL } from "./authApi";
const BASE_URL='http://192.168.0.15:8000'; 
// 401 (token expire / login nahi) olakhnyasathi
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
 
// Sagalya requests sathi common helper: token automatic jodto
async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = await AsyncStorage.getItem('access_token');
  if (!token) {
    throw new ApiError('Please login first', 401);
  }
 
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(
      `Server shi connect hot nahi.\nURL: ${BASE_URL}${path}`,
      0,
    );
  }
 
  let data: any = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
 
  if (!response.ok) {
    let message = 'Request failed';
    if (typeof data?.detail === 'string') {
      message = data.detail;
    } else if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((d: any) => `${(d.loc || []).slice(1).join('.')}: ${d.msg}`)
        .join('\n');
    }
    throw new ApiError(message, response.status);
  }
 
  return data as T;
}
 
// GET all tasks (fakt logged-in user che)
export const getTasks = () => apiFetch<Task[]>('/tasks');
 
// GET task by ID
export const getTaskById = (id: number) => apiFetch<Task>(`/tasks/${id}`);
 
// CREATE task  (userId pathvaychi garaj nahi, backend token madhun gheto)
export const createTask = (
  title: string,
  description: string,
  status: TaskStatus,
  priority: Task["priority"],
) =>
  apiFetch<Task>('/tasks', {
    method: 'POST',
    body: { title, description, status, priority },
  });
 
// UPDATE task
export const updateTask = async (
  id: number,
  updates: Partial<Task>,
): Promise<Task> => {
  const existing = await getTaskById(id);
  const updated = { ...existing, ...updates };
 
  return apiFetch<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: {
      title: updated.title,
      description: updated.description,
      status: updated.status,
      priority: updated.priority,
    },
  });
};
 
// DELETE task
export const deleteTask = async (id: number): Promise<void> => {
  await apiFetch<{ message: string }>(`/tasks/${id}`, { method: 'DELETE' });
};
 
