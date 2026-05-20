// ============================================
// Database Types for Ministry Scheduling App
// ============================================

export type SystemRole = 'admin' | 'coordinator' | 'leader' | 'volunteer'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type Department = 'technical' | 'music'
export type TrainingStatus = 'in_training' | 'qualified' | 'lead'
export type EventStatus = 'draft' | 'published' | 'completed' | 'cancelled'
export type ShiftStatus = 'pending' | 'accepted' | 'declined' | 'swapping'
export type RunSheetItemType = 'song' | 'sermon' | 'video' | 'transition' | 'announcement' | 'prayer' | 'other'
export type NotificationChannel = 'sms' | 'email'
export type SwapRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'
export type SmallGroupStatus = 'plugged_in' | 'seeking' | 'not_interested' | 'unknown'

export interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  phone_number: string | null
  system_role: SystemRole
  approval_status: ApprovalStatus
  serving_frequency_pref: number | null
  avatar_url: string | null
  discipleship_one2one: boolean
  discipleship_spiritual_foundation: boolean
  discipleship_leadership_113: boolean
  small_group_status: SmallGroupStatus
  small_group_leader: string | null
  created_at: string
  updated_at: string
}

export interface Skill {
  id: string
  name: string
  department: Department
  description: string | null
  created_at: string
}

export interface UserSkill {
  id: string
  user_id: string
  skill_id: string
  training_status: TrainingStatus
  certified_at: string | null
  created_at: string
  skill?: Skill
  user?: User
}

export interface Unavailability {
  id: string
  user_id: string
  start_date: string
  end_date: string
  reason: string | null
  created_at: string
}

export interface Event {
  id: string
  name: string
  event_datetime: string
  call_time: string | null
  status: EventStatus
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Shift {
  id: string
  event_id: string
  user_id: string
  skill_id: string | null
  status: ShiftStatus
  soft_conflict: boolean
  notified_at: string | null
  responded_at: string | null
  created_at: string
  updated_at: string
  user?: User
  skill?: Skill
  event?: Event
}

export interface SwapRequest {
  id: string
  shift_id: string
  requested_by: string
  offered_to: string | null
  status: SwapRequestStatus
  message: string | null
  created_at: string
  updated_at: string
  shift?: Shift
  requester?: User
  recipient?: User
}

export interface Song {
  id: string
  title: string
  artist: string | null
  default_key: string | null
  default_bpm: number | null
  lyrics: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface RunSheetItem {
  id: string
  event_id: string
  order_index: number
  item_type: RunSheetItemType
  song_id: string | null
  title: string | null
  duration_minutes: number | null
  tech_cues: string | null
  stage_notes: string | null
  key_override: string | null
  bpm_override: number | null
  created_at: string
  updated_at: string
  song?: Song
  resources?: Resource[]
}

export interface Resource {
  id: string
  file_url: string
  file_name: string
  file_type: string | null
  file_size: number | null
  event_id: string | null
  item_id: string | null
  uploaded_by: string | null
  created_at: string
}

export interface NotificationLog {
  id: string
  user_id: string
  channel: NotificationChannel
  type: string
  content_preview: string | null
  status: string
  sent_at: string
}

// ============================================
// In-App Notifications
// ============================================

export type NotificationType =
  | 'shift_assigned'
  | 'shift_accepted'
  | 'shift_declined'
  | 'approval_pending'
  | 'approval_approved'
  | 'approval_rejected'
  | 'swap_requested'
  | 'swap_accepted'
  | 'swap_declined'
  | 'event_published'
  | 'event_cancelled'
  | 'general'

export interface AppNotification {
  id: string
  user_id: string | null  // null = broadcast to all
  type: NotificationType
  title: string
  message: string
  read: boolean
  link: string | null
  created_at: string
}

// ============================================
// UI / App Types
// ============================================

export interface NavItem {
  label: string
  href: string
  icon: string
  roles?: SystemRole[]
  badge?: number
}

export interface DashboardStats {
  upcomingEvents: number
  pendingResponses: number
  activeVolunteers: number
  attendanceRate: number
}
