// ===== Child =====
export interface Child {
  id: string
  userId: string
  name: string
  age: number
  avatar: AnimalAvatar
  bio: string
  createdAt: number
}

export type AnimalAvatar = '🐼' | '🦊' | '🐰' | '🐱' | '🦁' | '🐸' | '🐧' | '🐻'

export const AVATAR_OPTIONS: { emoji: AnimalAvatar; label: string }[] = [
  { emoji: '🐼', label: '熊猫' },
  { emoji: '🦊', label: '狐狸' },
  { emoji: '🐰', label: '兔子' },
  { emoji: '🐱', label: '小猫' },
  { emoji: '🦁', label: '狮子' },
  { emoji: '🐸', label: '青蛙' },
  { emoji: '🐧', label: '企鹅' },
  { emoji: '🐻', label: '小熊' },
]

// ===== Task =====
export interface Task {
  id: string
  time: string
  endTime?: string
  title: string
  emoji: string
  category: TaskCategory
  note?: string
  completed: boolean
  completedAt?: number
}

export type TaskCategory = 'study' | 'play' | 'meal' | 'sleep' | 'sport' | 'other'

export const CATEGORY_META: Record<TaskCategory, { label: string; color: string }> = {
  study: { label: '学习', color: '#FF99C8' },
  play: { label: '玩乐', color: '#4ECDC4' },
  meal: { label: '餐饮', color: '#FFD166' },
  sleep: { label: '休息', color: '#DDA0DD' },
  sport: { label: '运动', color: '#A8E6CF' },
  other: { label: '其他', color: '#FB923C' },
}

// ===== Plan =====
export interface Plan {
  id: string
  childId: string
  userId: string
  weekStart: string
  weekEnd: string
  userDescription: string
  status: PlanStatus
  createdAt: number
}

export type PlanStatus = 'draft' | 'active' | 'archived'

// ===== Daily Schedule =====
export interface DaySchedule {
  date: string
  tasks: Task[]
}

// ===== API Types =====
export interface GeneratePlanRequest {
  childId: string
  description: string
}

export interface GeneratePlanResponse {
  planId: string
  weekStart: string
  days: Record<string, Task[]>
}

export interface ToggleTaskRequest {
  taskId: string
  completed: boolean
}

export interface ToggleTaskResponse {
  success: boolean
  dayProgress: number
}

// ===== Auth =====
export interface User {
  id: string
  name: string
  email: string
  image?: string
}
