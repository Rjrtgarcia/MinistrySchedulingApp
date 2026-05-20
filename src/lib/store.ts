'use client'

import { create } from 'zustand'
import { createClient } from './supabase/client'
import { toast } from 'sonner'
import type { User, Event, Shift, RunSheetItem, Song, Skill, UserSkill, Unavailability, SwapRequest, AppNotification } from './types'
import {
  demoUsers, demoEvents, demoShifts, demoRunSheetItems,
  demoSongs, demoSkills, demoUserSkills, demoResources,
  demoUnavailabilities, demoSwapRequests, demoNotifications
} from './demo-data'

interface AppState {
  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Loading state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  fetchData: () => Promise<void>

  // Current user
  currentUser: User | null
  setCurrentUser: (user: User | null) => void

  // Users
  users: User[]
  setUsers: (users: User[]) => void
  approveUser: (userId: string) => Promise<void>
  rejectUser: (userId: string) => Promise<void>
  updateUser: (userId: string, data: Partial<User>) => Promise<void>
  updateUserJourney: (userId: string, data: Partial<Pick<User, 'discipleship_one2one' | 'discipleship_spiritual_foundation' | 'discipleship_leadership_113' | 'small_group_status' | 'small_group_leader'>>) => Promise<void>

  // Events
  events: Event[]
  setEvents: (events: Event[]) => void
  addEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }) => Promise<string | null>
  updateEvent: (id: string, data: Partial<Event>) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  duplicateEvent: (eventId: string, newDate: string, newCallTime: string | null) => Promise<string | null>

  // Shifts
  shifts: Shift[]
  setShifts: (shifts: Shift[]) => void
  addShift: (shift: Omit<Shift, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }) => Promise<void>
  updateShiftStatus: (shiftId: string, status: Shift['status']) => Promise<void>
  deleteShift: (shiftId: string) => Promise<void>

  // Run Sheet Items
  runSheetItems: RunSheetItem[]
  setRunSheetItems: (items: RunSheetItem[]) => void
  addRunSheetItem: (item: Omit<RunSheetItem, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }) => Promise<void>
  updateRunSheetItem: (id: string, data: Partial<RunSheetItem>) => Promise<void>
  removeRunSheetItem: (id: string) => Promise<void>
  reorderRunSheetItems: (eventId: string, items: RunSheetItem[]) => Promise<void>

  // Songs
  songs: Song[]
  setSongs: (songs: Song[]) => void
  addSong: (song: Omit<Song, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }) => Promise<void>
  updateSong: (id: string, data: Partial<Song>) => Promise<void>
  deleteSong: (id: string) => Promise<void>

  // Skills
  skills: Skill[]
  addSkill: (skill: Omit<Skill, 'id' | 'created_at'> & { id?: string; created_at?: string }) => Promise<void>
  updateSkill: (id: string, data: Partial<Skill>) => Promise<void>
  deleteSkill: (id: string) => Promise<void>

  // User Skills
  userSkills: UserSkill[]
  addUserSkill: (userSkill: Omit<UserSkill, 'id' | 'created_at'> & { id?: string; created_at?: string }) => Promise<void>
  updateUserSkillStatus: (id: string, status: UserSkill['training_status']) => Promise<void>
  removeUserSkill: (id: string) => Promise<void>

  // Unavailabilities
  unavailabilities: Unavailability[]
  addUnavailability: (item: Omit<Unavailability, 'id' | 'created_at'> & { id?: string; created_at?: string }) => Promise<void>
  removeUnavailability: (id: string) => Promise<void>

  // Swap Requests
  swapRequests: SwapRequest[]
  addSwapRequest: (req: Omit<SwapRequest, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }) => Promise<void>
  updateSwapRequestStatus: (id: string, status: SwapRequest['status']) => Promise<void>

  // Notifications
  notifications: AppNotification[]
  addNotification: (n: Omit<AppNotification, 'id' | 'created_at'> & { id?: string; created_at?: string; event_id?: string }) => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>

  // Resources (read-only for now)
  resources: typeof demoResources

  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

// Generate valid UUID locally if needed
const generateUUID = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}


const isLocalMockError = (error: any) => {
  if (!error || !error.message) return false;
  const msg = error.message.toLowerCase();
  return msg.includes('schema cache') || 
         msg.includes('relation') || 
         msg.includes('does not exist') || 
         msg.includes('foreign key constraint') ||
         msg.includes('violates foreign key');
};

export const useAppStore = create<AppState>((set, get) => ({
  // Theme
  theme: 'system',
  setTheme: (theme) => set({ theme }),

  // Loading state
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  // Fetch real data from Supabase
  fetchData: async () => {
    const supabase = createClient()
    set({ isLoading: true })
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Fallback to demo data if unauthenticated (e.g. preview mode)
        set((state) => ({
          currentUser: state.currentUser || demoUsers[0],
          users: demoUsers,
          events: demoEvents,
          shifts: demoShifts,
          runSheetItems: demoRunSheetItems,
          songs: demoSongs,
          skills: demoSkills,
          userSkills: demoUserSkills,
          unavailabilities: demoUnavailabilities,
          swapRequests: demoSwapRequests,
          notifications: demoNotifications,
          isLoading: false
        }))
        return
      }

      // Fetch user profile from db
      const { data: profile, error: profileErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileErr) {
        // If profile doesn't exist yet, seed with demoUser profile
        const newProfile: User = {
          id: user.id,
          first_name: user.user_metadata?.first_name || 'Volunteer',
          last_name: user.user_metadata?.last_name || '',
          email: user.email || '',
          phone_number: user.user_metadata?.phone_number || null,
          system_role: 'volunteer',
          approval_status: 'pending',
          serving_frequency_pref: 2,
          avatar_url: null,
          discipleship_one2one: false,
          discipleship_spiritual_foundation: false,
          discipleship_leadership_113: false,
          small_group_status: 'unknown',
          small_group_leader: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        await supabase.from('users').insert(newProfile)
        set({ currentUser: newProfile })
      } else {
        set({ currentUser: profile })
      }

      // Fetch other tables in parallel
      const [
        { data: dbUsers },
        { data: dbEvents },
        { data: dbShifts },
        { data: dbSongs },
        { data: dbSkills },
        { data: dbUserSkills },
        { data: dbUnavailabilities },
        { data: dbSwapRequests }
      ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('events').select('*').order('event_datetime', { ascending: true }),
        supabase.from('shifts').select('*'),
        supabase.from('song_library').select('*'),
        supabase.from('skills').select('*'),
        supabase.from('user_skills').select('*'),
        supabase.from('unavailabilities').select('*'),
        supabase.from('swap_requests').select('*')
      ])

      // Fetch run_sheet_items separately to handle missing table gracefully
      let dbRunSheetItems: RunSheetItem[] | null = null
      try {
        const { data, error } = await supabase.from('run_sheet_items').select('*').order('order_index', { ascending: true })
        if (!error) dbRunSheetItems = data
      } catch {
        // Table may not exist yet — fall back to demo data silently
      }

      // Match database records or keep demo data if database is empty/unconfigured
      set({
        users: dbUsers && dbUsers.length > 0 ? dbUsers : demoUsers,
        events: dbEvents && dbEvents.length > 0 ? dbEvents : demoEvents,
        shifts: dbShifts && dbShifts.length > 0 ? dbShifts : demoShifts,
        runSheetItems: dbRunSheetItems && dbRunSheetItems.length > 0 ? dbRunSheetItems : demoRunSheetItems,
        songs: dbSongs && dbSongs.length > 0 ? dbSongs : demoSongs,
        skills: dbSkills && dbSkills.length > 0 ? dbSkills : demoSkills,
        userSkills: dbUserSkills && dbUserSkills.length > 0 ? dbUserSkills : demoUserSkills,
        unavailabilities: dbUnavailabilities && dbUnavailabilities.length > 0 ? dbUnavailabilities : demoUnavailabilities,
        swapRequests: dbSwapRequests && dbSwapRequests.length > 0 ? dbSwapRequests : demoSwapRequests,
        notifications: demoNotifications // Local-only for now
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      toast.error('Failed to sync with database: ' + message)
    } finally {
      set({ isLoading: false })
    }
  },

  // Initialize with demo data
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  users: [],
  setUsers: (users) => set({ users }),
  
  approveUser: async (userId) => {
    const supabase = createClient()
    const { error } = await supabase.from('users').update({ approval_status: 'approved' }).eq('id', userId)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      users: state.users.map((u) => u.id === userId ? { ...u, approval_status: 'approved' } : u)
    }))
    toast.success('Volunteer approved successfully.')
  },

  rejectUser: async (userId) => {
    const supabase = createClient()
    const { error } = await supabase.from('users').update({ approval_status: 'rejected' }).eq('id', userId)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      users: state.users.map((u) => u.id === userId ? { ...u, approval_status: 'rejected' } : u)
    }))
    toast.success('Volunteer rejected.')
  },

  updateUser: async (userId, data) => {
    const supabase = createClient()
    const { error } = await supabase.from('users').update(data).eq('id', userId)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      users: state.users.map((u) => u.id === userId ? { ...u, ...data, updated_at: new Date().toISOString() } : u),
      currentUser: state.currentUser?.id === userId ? { ...state.currentUser, ...data } : state.currentUser
    }))
    toast.success('Profile updated.')
  },

  updateUserJourney: async (userId, data) => {
    const supabase = createClient()
    const { error } = await supabase.from('users').update(data).eq('id', userId)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      users: state.users.map((u) => u.id === userId ? { ...u, ...data, updated_at: new Date().toISOString() } : u)
    }))
    toast.success('Spiritual journey updated.')
  },

  events: [],
  setEvents: (events) => set({ events }),
  
  addEvent: async (event) => {
    const supabase = createClient()
    const id = generateUUID()
    const newEvent = { ...event, id }
    const { error } = await supabase.from('events').insert(newEvent)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return null
    }
    set((state) => ({ events: [...state.events, newEvent as Event] }))
    toast.success('Event added.')
    return id
  },

  updateEvent: async (id, data) => {
    const supabase = createClient()
    const { error } = await supabase.from('events').update(data).eq('id', id)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      events: state.events.map((e) => e.id === id ? { ...e, ...data, updated_at: new Date().toISOString() } : e)
    }))
    toast.success('Event updated.')
  },

  deleteEvent: async (id) => {
    const supabase = createClient()
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
      shifts: state.shifts.filter((s) => s.event_id !== id),
      runSheetItems: state.runSheetItems.filter((i) => i.event_id !== id)
    }))
    toast.success('Event deleted.')
  },

  duplicateEvent: async (eventId, newDate, newCallTime) => {
    const supabase = createClient()
    const originalEvent = get().events.find(e => e.id === eventId)
    if (!originalEvent) return null

    const newEventId = generateUUID()
    const newEvent = {
      ...originalEvent,
      id: newEventId,
      event_datetime: newDate,
      call_time: newCallTime,
      status: 'draft' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: eventErr } = await supabase.from('events').insert(newEvent)
    if (eventErr) {
      toast.error(eventErr.message)
      return null
    }

    // Duplicate shifts
    const eventShifts = get().shifts.filter(s => s.event_id === eventId)
    const newShifts = eventShifts.map((s) => ({
      event_id: newEventId,
      user_id: s.user_id,
      skill_id: s.skill_id,
      status: 'pending' as const,
      soft_conflict: s.soft_conflict
    }))

    if (newShifts.length > 0) {
      await supabase.from('shifts').insert(newShifts)
    }

    // Duplicate runsheet
    const eventItems = get().runSheetItems.filter(i => i.event_id === eventId)
    const newItems = eventItems.map((i) => ({
      event_id: newEventId,
      order_index: i.order_index,
      item_type: i.item_type,
      song_id: i.song_id,
      title: i.title,
      duration_minutes: i.duration_minutes,
      tech_cues: i.tech_cues,
      stage_notes: i.stage_notes,
      key_override: i.key_override,
      bpm_override: i.bpm_override
    }))

    if (newItems.length > 0) {
      await supabase.from('run_sheet_items').insert(newItems)
    }

    await get().fetchData()
    toast.success('Event duplicated successfully.')
    return newEventId
  },

  shifts: [],
  setShifts: (shifts) => set({ shifts }),
  
  addShift: async (shift) => {
    const supabase = createClient()
    const id = generateUUID()
    const newShift = { ...shift, id }
    // Optimistic update first so UI reflects change immediately
    set((state) => ({ shifts: [...state.shifts, newShift as Shift] }))
    const { error } = await supabase.from('shifts').insert(newShift)
    if (error && !isLocalMockError(error)) {
      // Rollback optimistic update on failure
      set((state) => ({ shifts: state.shifts.filter((s) => s.id !== id) }))
      toast.error(error.message)
      return
    }
    toast.success('Shift assigned.')
  },

  updateShiftStatus: async (shiftId, status) => {
    const supabase = createClient()
    const { error } = await supabase.from('shifts').update({ status, responded_at: new Date().toISOString() }).eq('id', shiftId)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      shifts: state.shifts.map((s) => s.id === shiftId ? { ...s, status, responded_at: new Date().toISOString() } : s)
    }))
    toast.success('Shift response recorded.')
  },

  deleteShift: async (shiftId) => {
    const supabase = createClient()
    const { error } = await supabase.from('shifts').delete().eq('id', shiftId)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      shifts: state.shifts.filter((s) => s.id !== shiftId)
    }))
    toast.success('Shift removed.')
  },

  runSheetItems: [],
  setRunSheetItems: (items) => set({ runSheetItems: items }),
  
  addRunSheetItem: async (item) => {
    const supabase = createClient()
    const id = generateUUID()
    const newItem = { ...item, id }
    // Optimistic update so UI reflects change immediately
    set((state) => ({ runSheetItems: [...state.runSheetItems, newItem as RunSheetItem] }))
    const { error } = await supabase.from('run_sheet_items').insert(newItem)
    if (error && !isLocalMockError(error)) {
      // If DB fails (e.g. missing table in schema cache), keep local change but warn
      if (error.message?.includes('schema cache') || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        // Silently keep optimistic update — running in demo/local mode
        return
      }
      // Rollback on real error
      set((state) => ({ runSheetItems: state.runSheetItems.filter((i) => i.id !== id) }))
      toast.error(error.message)
      return
    }
    toast.success('Item added to run sheet.')
  },

  updateRunSheetItem: async (id, data) => {
    const supabase = createClient()
    const { error } = await supabase.from('run_sheet_items').update(data).eq('id', id)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      runSheetItems: state.runSheetItems.map((i) => i.id === id ? { ...i, ...data } : i)
    }))
  },

  removeRunSheetItem: async (id) => {
    const supabase = createClient()
    const { error } = await supabase.from('run_sheet_items').delete().eq('id', id)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      runSheetItems: state.runSheetItems.filter((i) => i.id !== id)
    }))
    toast.success('Item removed.')
  },

  reorderRunSheetItems: async (eventId, items) => {
    const supabase = createClient()
    // Optimistic update
    const previousItems = get().runSheetItems
    const reordered = items.map((item, index) => ({ ...item, order_index: index }))
    
    set((state) => ({
      runSheetItems: [
        ...state.runSheetItems.filter((i) => i.event_id !== eventId),
        ...reordered
      ]
    }))

    // Save to DB
    const updates = reordered.map((item) => 
      supabase.from('run_sheet_items').update({ order_index: item.order_index }).eq('id', item.id)
    )

    try {
      await Promise.all(updates)
    } catch (e) {
      set({ runSheetItems: previousItems })
      toast.error('Failed to save runsheet order.')
    }
  },

  songs: [],
  setSongs: (songs) => set({ songs }),
  
  addSong: async (song) => {
    const supabase = createClient()
    const id = generateUUID()
    const newSong = { ...song, id }
    const { error } = await supabase.from('song_library').insert(newSong)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({ songs: [...state.songs, newSong as Song] }))
    toast.success('Song added.')
  },

  updateSong: async (id, data) => {
    const supabase = createClient()
    const { error } = await supabase.from('song_library').update(data).eq('id', id)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      songs: state.songs.map((s) => s.id === id ? { ...s, ...data, updated_at: new Date().toISOString() } : s)
    }))
    toast.success('Song details updated.')
  },

  deleteSong: async (id) => {
    const supabase = createClient()
    const { error } = await supabase.from('song_library').delete().eq('id', id)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      songs: state.songs.filter((s) => s.id !== id)
    }))
    toast.success('Song deleted.')
  },

  skills: [],
  addSkill: async (skill) => {
    const supabase = createClient()
    const id = generateUUID()
    const newSkill = { ...skill, id }
    const { error } = await supabase.from('skills').insert(newSkill)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({ skills: [...state.skills, newSkill as Skill] }))
    toast.success('Skill created.')
  },

  updateSkill: async (id, data) => {
    const supabase = createClient()
    const { error } = await supabase.from('skills').update(data).eq('id', id)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      skills: state.skills.map((s) => s.id === id ? { ...s, ...data } : s)
    }))
    toast.success('Skill updated.')
  },

  deleteSkill: async (id) => {
    const supabase = createClient()
    const { error } = await supabase.from('skills').delete().eq('id', id)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      skills: state.skills.filter((s) => s.id !== id),
      userSkills: state.userSkills.filter((us) => us.skill_id !== id)
    }))
    toast.success('Skill deleted.')
  },

  userSkills: [],
  addUserSkill: async (userSkill) => {
    const supabase = createClient()
    const id = generateUUID()
    const newUserSkill = { ...userSkill, id }
    const { error } = await supabase.from('user_skills').insert(newUserSkill)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({ userSkills: [...state.userSkills, newUserSkill as UserSkill] }))
    toast.success('Skill certified.')
  },

  updateUserSkillStatus: async (id, status) => {
    const supabase = createClient()
    const certified_at = status !== 'in_training' ? new Date().toISOString() : null
    const { error } = await supabase.from('user_skills').update({ training_status: status, certified_at }).eq('id', id)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      userSkills: state.userSkills.map((us) =>
        us.id === id ? { ...us, training_status: status, certified_at } : us
      )
    }))
    toast.success('Training status updated.')
  },

  removeUserSkill: async (id) => {
    const supabase = createClient()
    const { error } = await supabase.from('user_skills').delete().eq('id', id)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      userSkills: state.userSkills.filter((us) => us.id !== id)
    }))
    toast.success('Skill removed from profile.')
  },

  unavailabilities: [],
  addUnavailability: async (item) => {
    const supabase = createClient()
    const id = generateUUID()
    const newItem = { ...item, id }
    const { error } = await supabase.from('unavailabilities').insert(newItem)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({ unavailabilities: [...state.unavailabilities, newItem as Unavailability] }))
    toast.success('Unavailability added.')
  },

  removeUnavailability: async (id) => {
    const supabase = createClient()
    const { error } = await supabase.from('unavailabilities').delete().eq('id', id)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({
      unavailabilities: state.unavailabilities.filter((u) => u.id !== id)
    }))
    toast.success('Unavailability removed.')
  },

  swapRequests: [],
  addSwapRequest: async (req) => {
    const supabase = createClient()
    const id = generateUUID()
    const newReq = { ...req, id }
    const { error } = await supabase.from('swap_requests').insert(newReq)
    if (error && !isLocalMockError(error)) {
      toast.error(error.message)
      return
    }
    set((state) => ({ swapRequests: [...state.swapRequests, newReq as SwapRequest] }))
    toast.success('Swap request created successfully.')
  },

  updateSwapRequestStatus: async (id, status) => {
    const supabase = createClient()
    
    // Optimistic update
    const previousRequests = get().swapRequests
    set((state) => ({
      swapRequests: state.swapRequests.map((r) => r.id === id ? { ...r, status, updated_at: new Date().toISOString() } : r)
    }))
    
    const { error } = await supabase.from('swap_requests').update({ status }).eq('id', id)
    if (error && !isLocalMockError(error)) {
      // Rollback
      set({ swapRequests: previousRequests })
      toast.error(error.message)
      return
    }
    toast.success(`Swap request ${status}.`)
  },

  notifications: [],
  addNotification: async (n) => {
    const { event_id, ...notificationFields } = n
    const id = generateUUID()
    const newNotification = { ...notificationFields, id, created_at: new Date().toISOString() } as AppNotification
    set((state) => ({
      notifications: [newNotification, ...state.notifications]
    }))

    try {
      fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: n.user_id,
          title: n.title,
          message: n.message,
          link: n.link,
          event_id: event_id
        })
      }).catch((err) => {
        console.error('Async fetch to dispatch route failed:', err)
      })
    } catch (err) {
      console.error('Failed to trigger notification dispatch:', err)
    }
  },

  markNotificationRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n)
    }))
  },

  markAllNotificationsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true }))
    }))
  },

  resources: demoResources,

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open })
}))
