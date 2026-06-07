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
  mode: InputMode
  description?: string
  structured?: StructuredInput
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

// ===== 结构化计划输入 =====
export interface FixedSlot {
  id: string
  days: number[]  // [1,2,3,4,5] = 周一到周五, [1,3,5] = 周一三五
  startTime: string  // "16:00"
  endTime: string    // "17:30"
  title: string
  emoji: string
  location?: string
}

export interface WishlistItem {
  id: string
  category: WishlistCategory
  title: string
  frequency: WishlistFrequency
  duration: string
  priority: WishlistPriority
  note?: string
}

export type WishlistCategory = 'reading' | 'tutoring' | 'practice' | 'homework' | 'habit' | 'chore' | 'play'
export type WishlistFrequency = 'daily' | 'weekdays' | 'weekends' | 'weekly'
export type WishlistPriority = 'high' | 'medium' | 'low'

export const WISHLIST_CATEGORY_META: Record<WishlistCategory, { label: string; emoji: string }> = {
  reading: { label: '阅读', emoji: '📖' },
  tutoring: { label: '辅导', emoji: '📚' },
  practice: { label: '练习', emoji: '✏️' },
  homework: { label: '作业', emoji: '📝' },
  habit: { label: '习惯', emoji: '🌟' },
  chore: { label: '家务', emoji: '🧹' },
  play: { label: '玩乐', emoji: '🎮' },
}

export const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
export const DAY_NAMES_SHORT = ['日', '一', '二', '三', '四', '五', '六']

export interface StructuredInput {
  fixedSlots: FixedSlot[]
  wishlist: WishlistItem[]
  freeTimePreference: {
    minPlayTime: string
    preferredPeriod: string
  }
  additionalNotes: string
}

export type InputMode = 'natural' | 'structured'

export const WISHLIST_FREQUENCY_META: Record<WishlistFrequency, { label: string }> = {
  daily: { label: '每天' },
  weekdays: { label: '周中' },
  weekends: { label: '周末' },
  weekly: { label: '每周几次' },
}

export const WISHLIST_PRIORITY_META: Record<WishlistPriority, { label: string; color: string }> = {
  high: { label: '高优先', color: '#FF6B6B' },
  medium: { label: '中优先', color: '#FFD166' },
  low: { label: '低优先', color: '#A8E6CF' },
}
