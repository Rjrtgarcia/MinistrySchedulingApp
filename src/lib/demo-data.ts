// Demo data store for development without Supabase connection
// This provides realistic mock data for all features

import type {
  User, Skill, UserSkill, Event, Shift, Song,
  RunSheetItem, Resource, Unavailability, SwapRequest, AppNotification
} from './types'

// ============================================
// DEMO USERS
// ============================================
export const demoUsers: User[] = [
  {
    id: '1', first_name: 'Marcus', last_name: 'Rivera', email: 'marcus@church.org',
    phone_number: '+1234567890', system_role: 'admin', approval_status: 'approved',
    serving_frequency_pref: 4, avatar_url: null, discipleship_one2one: true, discipleship_spiritual_foundation: true, discipleship_leadership_113: true, small_group_status: 'plugged_in', small_group_leader: 'Tuesday Leaders', created_at: '2025-01-15T00:00:00Z', updated_at: '2025-06-01T00:00:00Z'
  },
  {
    id: '2', first_name: 'Sarah', last_name: 'Chen', email: 'sarah@church.org',
    phone_number: '+1234567891', system_role: 'coordinator', approval_status: 'approved',
    serving_frequency_pref: 4, avatar_url: null, discipleship_one2one: true, discipleship_spiritual_foundation: true, discipleship_leadership_113: false, small_group_status: 'plugged_in', small_group_leader: 'Wednesday Worship', created_at: '2025-02-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z'
  },
  {
    id: '3', first_name: 'David', last_name: 'Kim', email: 'david@church.org',
    phone_number: '+1234567892', system_role: 'leader', approval_status: 'approved',
    serving_frequency_pref: 4, avatar_url: null, discipleship_one2one: true, discipleship_spiritual_foundation: true, discipleship_leadership_113: true, small_group_status: 'plugged_in', small_group_leader: 'Young Adults Friday', created_at: '2025-02-10T00:00:00Z', updated_at: '2025-06-01T00:00:00Z'
  },
  {
    id: '4', first_name: 'Emily', last_name: 'Torres', email: 'emily@church.org',
    phone_number: '+1234567893', system_role: 'volunteer', approval_status: 'approved',
    serving_frequency_pref: 2, avatar_url: null, discipleship_one2one: true, discipleship_spiritual_foundation: false, discipleship_leadership_113: false, small_group_status: 'seeking', small_group_leader: null, created_at: '2025-03-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z'
  },
  {
    id: '5', first_name: 'James', last_name: 'Patel', email: 'james@church.org',
    phone_number: '+1234567894', system_role: 'volunteer', approval_status: 'approved',
    serving_frequency_pref: 3, avatar_url: null, discipleship_one2one: true, discipleship_spiritual_foundation: true, discipleship_leadership_113: false, small_group_status: 'plugged_in', small_group_leader: 'Young Adults Friday', created_at: '2025-03-05T00:00:00Z', updated_at: '2025-06-01T00:00:00Z'
  },
  {
    id: '6', first_name: 'Rachel', last_name: 'Okonkwo', email: 'rachel@church.org',
    phone_number: '+1234567895', system_role: 'volunteer', approval_status: 'approved',
    serving_frequency_pref: 2, avatar_url: null, discipleship_one2one: false, discipleship_spiritual_foundation: false, discipleship_leadership_113: false, small_group_status: 'unknown', small_group_leader: null, created_at: '2025-03-12T00:00:00Z', updated_at: '2025-06-01T00:00:00Z'
  },
  {
    id: '7', first_name: 'Michael', last_name: 'Santos', email: 'michael@church.org',
    phone_number: '+1234567896', system_role: 'volunteer', approval_status: 'approved',
    serving_frequency_pref: 2, avatar_url: null, discipleship_one2one: true, discipleship_spiritual_foundation: false, discipleship_leadership_113: false, small_group_status: 'plugged_in', small_group_leader: 'Men of Faith', created_at: '2025-04-01T00:00:00Z', updated_at: '2025-06-01T00:00:00Z'
  },
  {
    id: '8', first_name: 'Aisha', last_name: 'Mohammed', email: 'aisha@church.org',
    phone_number: '+1234567897', system_role: 'volunteer', approval_status: 'pending',
    serving_frequency_pref: 1, avatar_url: null, discipleship_one2one: false, discipleship_spiritual_foundation: false, discipleship_leadership_113: false, small_group_status: 'not_interested', small_group_leader: null, created_at: '2025-05-20T00:00:00Z', updated_at: '2025-06-01T00:00:00Z'
  },
  {
    id: '9', first_name: 'Tyler', last_name: 'Johnson', email: 'tyler@church.org',
    phone_number: '+1234567898', system_role: 'volunteer', approval_status: 'pending',
    serving_frequency_pref: 2, avatar_url: null, discipleship_one2one: false, discipleship_spiritual_foundation: false, discipleship_leadership_113: false, small_group_status: 'unknown', small_group_leader: null, created_at: '2025-05-22T00:00:00Z', updated_at: '2025-06-01T00:00:00Z'
  },
  {
    id: '10', first_name: 'Grace', last_name: 'Lee', email: 'grace@church.org',
    phone_number: '+1234567899', system_role: 'volunteer', approval_status: 'approved',
    serving_frequency_pref: 3, avatar_url: null, discipleship_one2one: true, discipleship_spiritual_foundation: true, discipleship_leadership_113: false, small_group_status: 'plugged_in', small_group_leader: 'Worship Team Devo', created_at: '2025-04-15T00:00:00Z', updated_at: '2025-06-01T00:00:00Z'
  },
]

// ============================================
// DEMO SKILLS
// ============================================
export const demoSkills: Skill[] = [
  { id: 's1', name: 'Audio Engineer', department: 'technical', description: 'Operates sound mixing console', created_at: '2025-01-01T00:00:00Z' },
  { id: 's2', name: 'Lighting Operator', department: 'technical', description: 'Controls lighting board', created_at: '2025-01-01T00:00:00Z' },
  { id: 's3', name: 'Visual Presentation', department: 'technical', description: 'Manages ProPresenter slides', created_at: '2025-01-01T00:00:00Z' },
  { id: 's4', name: 'Stage Manager', department: 'technical', description: 'Coordinates stage transitions', created_at: '2025-01-01T00:00:00Z' },
  { id: 's5', name: 'Camera Operator', department: 'technical', description: 'Operates cameras for streaming', created_at: '2025-01-01T00:00:00Z' },
  { id: 's6', name: 'Stream Technician', department: 'technical', description: 'Manages live streaming', created_at: '2025-01-01T00:00:00Z' },
  { id: 's7', name: 'Worship Leader', department: 'music', description: 'Leads worship', created_at: '2025-01-01T00:00:00Z' },
  { id: 's8', name: 'Vocalist', department: 'music', description: 'Backup vocals', created_at: '2025-01-01T00:00:00Z' },
  { id: 's9', name: 'Guitarist', department: 'music', description: 'Acoustic/Electric guitar', created_at: '2025-01-01T00:00:00Z' },
  { id: 's10', name: 'Bassist', department: 'music', description: 'Bass guitar', created_at: '2025-01-01T00:00:00Z' },
  { id: 's11', name: 'Drummer', department: 'music', description: 'Drums and percussion', created_at: '2025-01-01T00:00:00Z' },
  { id: 's12', name: 'Keyboardist', department: 'music', description: 'Keys/Piano', created_at: '2025-01-01T00:00:00Z' },
]

// ============================================
// DEMO USER SKILLS
// ============================================
export const demoUserSkills: UserSkill[] = [
  { id: 'us1', user_id: '2', skill_id: 's7', training_status: 'lead', certified_at: '2025-02-01T00:00:00Z', created_at: '2025-02-01T00:00:00Z' },
  { id: 'us2', user_id: '3', skill_id: 's1', training_status: 'lead', certified_at: '2025-02-10T00:00:00Z', created_at: '2025-02-10T00:00:00Z' },
  { id: 'us3', user_id: '4', skill_id: 's8', training_status: 'qualified', certified_at: '2025-03-01T00:00:00Z', created_at: '2025-03-01T00:00:00Z' },
  { id: 'us4', user_id: '4', skill_id: 's9', training_status: 'qualified', certified_at: '2025-03-01T00:00:00Z', created_at: '2025-03-01T00:00:00Z' },
  { id: 'us5', user_id: '5', skill_id: 's2', training_status: 'qualified', certified_at: '2025-03-05T00:00:00Z', created_at: '2025-03-05T00:00:00Z' },
  { id: 'us6', user_id: '5', skill_id: 's3', training_status: 'qualified', certified_at: '2025-03-05T00:00:00Z', created_at: '2025-03-05T00:00:00Z' },
  { id: 'us7', user_id: '6', skill_id: 's11', training_status: 'qualified', certified_at: '2025-03-12T00:00:00Z', created_at: '2025-03-12T00:00:00Z' },
  { id: 'us8', user_id: '7', skill_id: 's10', training_status: 'in_training', certified_at: null, created_at: '2025-04-01T00:00:00Z' },
  { id: 'us9', user_id: '7', skill_id: 's12', training_status: 'qualified', certified_at: '2025-04-15T00:00:00Z', created_at: '2025-04-01T00:00:00Z' },
  { id: 'us10', user_id: '10', skill_id: 's5', training_status: 'qualified', certified_at: '2025-04-15T00:00:00Z', created_at: '2025-04-15T00:00:00Z' },
  { id: 'us11', user_id: '10', skill_id: 's4', training_status: 'in_training', certified_at: null, created_at: '2025-04-15T00:00:00Z' },
]

// ============================================
// DEMO EVENTS
// ============================================
const now = new Date()
const nextSunday = new Date(now)
nextSunday.setDate(now.getDate() + (7 - now.getDay()))
nextSunday.setHours(9, 0, 0, 0)

const followingSunday = new Date(nextSunday)
followingSunday.setDate(nextSunday.getDate() + 7)

const lastSunday = new Date(now)
lastSunday.setDate(now.getDate() - now.getDay())
lastSunday.setHours(9, 0, 0, 0)

export const demoEvents: Event[] = [
  {
    id: 'e1', name: 'Sunday Worship Service', event_datetime: nextSunday.toISOString(),
    call_time: new Date(nextSunday.getTime() - 90 * 60000).toISOString(), status: 'published',
    description: 'Regular Sunday morning worship service', created_by: '2',
    created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z'
  },
  {
    id: 'e2', name: 'Sunday Evening Service', event_datetime: new Date(nextSunday.getTime() + 9 * 3600000).toISOString(),
    call_time: new Date(nextSunday.getTime() + 7.5 * 3600000).toISOString(), status: 'draft',
    description: 'Sunday evening worship and prayer', created_by: '2',
    created_at: '2025-05-12T00:00:00Z', updated_at: '2025-05-15T00:00:00Z'
  },
  {
    id: 'e3', name: 'Sunday Worship Service', event_datetime: followingSunday.toISOString(),
    call_time: new Date(followingSunday.getTime() - 90 * 60000).toISOString(), status: 'draft',
    description: 'Regular Sunday morning worship service', created_by: '2',
    created_at: '2025-05-14T00:00:00Z', updated_at: '2025-05-15T00:00:00Z'
  },
  {
    id: 'e4', name: 'Sunday Worship Service', event_datetime: lastSunday.toISOString(),
    call_time: new Date(lastSunday.getTime() - 90 * 60000).toISOString(), status: 'completed',
    description: 'Last Sunday service - completed', created_by: '2',
    created_at: '2025-05-01T00:00:00Z', updated_at: lastSunday.toISOString()
  },
]

// ============================================
// DEMO SHIFTS
// ============================================
export const demoShifts: Shift[] = [
  { id: 'sh1', event_id: 'e1', user_id: '2', skill_id: 's7', status: 'accepted', soft_conflict: false, notified_at: '2025-05-15T00:00:00Z', responded_at: '2025-05-15T01:00:00Z', created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { id: 'sh2', event_id: 'e1', user_id: '3', skill_id: 's1', status: 'accepted', soft_conflict: false, notified_at: '2025-05-15T00:00:00Z', responded_at: '2025-05-15T02:00:00Z', created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { id: 'sh3', event_id: 'e1', user_id: '4', skill_id: 's9', status: 'accepted', soft_conflict: false, notified_at: '2025-05-15T00:00:00Z', responded_at: '2025-05-15T03:00:00Z', created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { id: 'sh4', event_id: 'e1', user_id: '5', skill_id: 's2', status: 'pending', soft_conflict: false, notified_at: '2025-05-15T00:00:00Z', responded_at: null, created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { id: 'sh5', event_id: 'e1', user_id: '6', skill_id: 's11', status: 'declined', soft_conflict: false, notified_at: '2025-05-15T00:00:00Z', responded_at: '2025-05-16T00:00:00Z', created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-16T00:00:00Z' },
  { id: 'sh6', event_id: 'e1', user_id: '7', skill_id: 's12', status: 'pending', soft_conflict: true, notified_at: '2025-05-15T00:00:00Z', responded_at: null, created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { id: 'sh7', event_id: 'e1', user_id: '10', skill_id: 's5', status: 'accepted', soft_conflict: false, notified_at: '2025-05-15T00:00:00Z', responded_at: '2025-05-15T04:00:00Z', created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
]

// ============================================
// DEMO SONGS
// ============================================
export const demoSongs: Song[] = [
  { id: 'sg1', title: 'Goodness of God', artist: 'Bethel Music', default_key: 'A', default_bpm: 68, lyrics: 'I love You Lord\nOh Your mercy never fails me\nAll my days\nI\'ve been held in Your hands\n\nFrom the moment that I wake up\nUntil I lay my head\nI will sing of the goodness of God\n\nAll my life You have been faithful\nAll my life You have been so so good\nWith every breath that I am able\nI will sing of the goodness of God', created_by: '2', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'sg2', title: 'Build My Life', artist: 'Housefires', default_key: 'E', default_bpm: 68, lyrics: 'Worthy of every song we could ever sing\nWorthy of all the praise we could ever bring\nWorthy of every breath we could ever breathe\nWe live for You\n\nHoly there is no one like You\nThere is none beside You\nOpen up my eyes in wonder\nAnd show me who You are\nAnd fill me with Your heart\nAnd lead me in Your love to those around me', created_by: '2', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'sg3', title: 'Way Maker', artist: 'Sinach', default_key: 'E', default_bpm: 68, lyrics: 'You are here moving in our midst\nI worship You I worship You\nYou are here working in this place\nI worship You I worship You\n\nWay maker miracle worker\nPromise keeper light in the darkness\nMy God that is who You are', created_by: '2', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'sg4', title: 'Great Are You Lord', artist: 'All Sons & Daughters', default_key: 'G', default_bpm: 74, lyrics: null, created_by: '2', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'sg5', title: 'Holy Spirit', artist: 'Francesca Battistelli', default_key: 'D', default_bpm: 72, lyrics: null, created_by: '2', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'sg6', title: 'What A Beautiful Name', artist: 'Hillsong Worship', default_key: 'D', default_bpm: 68, lyrics: null, created_by: '2', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'sg7', title: 'Reckless Love', artist: 'Cory Asbury', default_key: 'C', default_bpm: 78, lyrics: null, created_by: '2', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'sg8', title: 'King of Kings', artist: 'Hillsong Worship', default_key: 'D', default_bpm: 136, lyrics: null, created_by: '2', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'sg9', title: 'Graves Into Gardens', artist: 'Elevation Worship', default_key: 'C', default_bpm: 80, lyrics: null, created_by: '2', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
  { id: 'sg10', title: 'Blessing', artist: 'Kari Jobe', default_key: 'Bb', default_bpm: 72, lyrics: null, created_by: '2', created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
]

// ============================================
// DEMO RUN SHEET ITEMS
// ============================================
export const demoRunSheetItems: RunSheetItem[] = [
  { id: 'rs1', event_id: 'e1', order_index: 0, item_type: 'other', song_id: null, title: 'Doors Open / Pre-Service Loop', duration_minutes: 15, tech_cues: 'Play ambient loop, house lights at 60%', stage_notes: 'Welcome team stationed at doors', key_override: null, bpm_override: null, created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { id: 'rs2', event_id: 'e1', order_index: 1, item_type: 'transition', song_id: null, title: 'Countdown & Welcome', duration_minutes: 3, tech_cues: 'Start countdown timer on screen, fade house lights to 30%', stage_notes: 'Host walks to center stage', key_override: null, bpm_override: null, created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { id: 'rs3', event_id: 'e1', order_index: 2, item_type: 'song', song_id: 'sg6', title: 'What A Beautiful Name', duration_minutes: 6, tech_cues: 'Full stage lights, warm wash. Lyrics on screen.', stage_notes: 'Full band starts together', key_override: 'D', bpm_override: 68, created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { id: 'rs4', event_id: 'e1', order_index: 3, item_type: 'song', song_id: 'sg1', title: 'Goodness of God', duration_minutes: 7, tech_cues: 'Softer lighting, spotlight on worship leader', stage_notes: 'Acoustic intro, band builds in at chorus', key_override: 'A', bpm_override: 68, created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { id: 'rs5', event_id: 'e1', order_index: 4, item_type: 'song', song_id: 'sg2', title: 'Build My Life', duration_minutes: 6, tech_cues: 'Gradual light build, full color by bridge', stage_notes: 'Keys lead intro, full band on chorus', key_override: null, bpm_override: null, created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { id: 'rs6', event_id: 'e1', order_index: 5, item_type: 'transition', song_id: null, title: 'Prayer & Offering', duration_minutes: 5, tech_cues: 'House lights up to 40%, offering slides on screen', stage_notes: 'Host returns for offering announcement', key_override: null, bpm_override: null, created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { id: 'rs7', event_id: 'e1', order_index: 6, item_type: 'sermon', song_id: null, title: 'Message: "Walking in Faith"', duration_minutes: 35, tech_cues: 'Podium light, sermon slides ready. Record.', stage_notes: 'Pastor mic check complete', key_override: null, bpm_override: null, created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { id: 'rs8', event_id: 'e1', order_index: 7, item_type: 'song', song_id: 'sg4', title: 'Great Are You Lord', duration_minutes: 5, tech_cues: 'Soft blue/purple wash, minimal stage lights', stage_notes: 'Acoustic only - guitar and keys', key_override: 'G', bpm_override: 74, created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
  { id: 'rs9', event_id: 'e1', order_index: 8, item_type: 'announcement', song_id: null, title: 'Announcements & Closing', duration_minutes: 5, tech_cues: 'House lights full, announcement slides', stage_notes: 'Host closes service', key_override: null, bpm_override: null, created_at: '2025-05-10T00:00:00Z', updated_at: '2025-05-15T00:00:00Z' },
]

// ============================================
// DEMO UNAVAILABILITIES
// ============================================
export const demoUnavailabilities: Unavailability[] = [
  { id: 'u1', user_id: '6', start_date: nextSunday.toISOString().split('T')[0], end_date: nextSunday.toISOString().split('T')[0], reason: 'Family event', created_at: '2025-05-14T00:00:00Z' },
  { id: 'u2', user_id: '7', start_date: followingSunday.toISOString().split('T')[0], end_date: new Date(followingSunday.getTime() + 7 * 86400000).toISOString().split('T')[0], reason: 'Vacation', created_at: '2025-05-10T00:00:00Z' },
]

// ============================================
// DEMO SWAP REQUESTS
// ============================================
export const demoSwapRequests: SwapRequest[] = [
  {
    id: 'sw1', shift_id: 'sh4', requested_by: '5', offered_to: '7',
    status: 'pending', message: 'I have a family event that Sunday morning. Could you cover for me?',
    created_at: '2025-05-17T00:00:00Z', updated_at: '2025-05-17T00:00:00Z',
  },
]

// ============================================
// DEMO RESOURCES
// ============================================
export const demoResources: Resource[] = [
  { id: 'r1', file_url: '#', file_name: 'what-a-beautiful-name-chart.pdf', file_type: 'application/pdf', file_size: 245000, event_id: 'e1', item_id: 'rs3', uploaded_by: '2', created_at: '2025-05-12T00:00:00Z' },
  { id: 'r2', file_url: '#', file_name: 'goodness-of-god-chart.pdf', file_type: 'application/pdf', file_size: 198000, event_id: 'e1', item_id: 'rs4', uploaded_by: '2', created_at: '2025-05-12T00:00:00Z' },
  { id: 'r3', file_url: '#', file_name: 'stage-plot-may.pdf', file_type: 'application/pdf', file_size: 512000, event_id: 'e1', item_id: null, uploaded_by: '3', created_at: '2025-05-13T00:00:00Z' },
]

// Helper to get user with skills populated
export function getUserWithSkills(userId: string) {
  const user = demoUsers.find(u => u.id === userId)
  if (!user) return null
  const skills = demoUserSkills
    .filter(us => us.user_id === userId)
    .map(us => ({
      ...us,
      skill: demoSkills.find(s => s.id === us.skill_id)
    }))
  return { ...user, skills }
}

// Helper to get shifts with user and skill populated
export function getShiftsForEvent(eventId: string) {
  return demoShifts
    .filter(s => s.event_id === eventId)
    .map(s => ({
      ...s,
      user: demoUsers.find(u => u.id === s.user_id),
      skill: demoSkills.find(sk => sk.id === s.skill_id),
    }))
}

// Helper to get run sheet items with songs
export function getRunSheetForEvent(eventId: string) {
  return demoRunSheetItems
    .filter(item => item.event_id === eventId)
    .sort((a, b) => a.order_index - b.order_index)
    .map(item => ({
      ...item,
      song: item.song_id ? demoSongs.find(s => s.id === item.song_id) : undefined,
      resources: demoResources.filter(r => r.item_id === item.id),
    }))
}

// ============================================
// DEMO NOTIFICATIONS
// ============================================
export const demoNotifications: AppNotification[] = [
  {
    id: 'n1', user_id: null, type: 'shift_assigned', title: 'Shift Assigned',
    message: 'James Patel has been assigned to Lighting Operator for Sunday Worship Service',
    read: false, link: '/dashboard/events/e1', created_at: '2025-05-15T00:00:00Z',
  },
  {
    id: 'n2', user_id: null, type: 'approval_pending', title: 'New Registration',
    message: 'Aisha Mohammed has registered and is awaiting approval',
    read: false, link: '/dashboard/volunteers/approval', created_at: '2025-05-20T00:00:00Z',
  },
  {
    id: 'n3', user_id: null, type: 'swap_requested', title: 'Swap Request',
    message: 'James Patel requested a shift swap for Sunday Worship Service',
    read: false, link: '/dashboard/swaps', created_at: '2025-05-17T00:00:00Z',
  },
  {
    id: 'n4', user_id: null, type: 'shift_accepted', title: 'Shift Accepted',
    message: 'Sarah Chen accepted the Worship Leader shift for Sunday Worship Service',
    read: true, link: '/dashboard/events/e1', created_at: '2025-05-15T01:00:00Z',
  },
  {
    id: 'n5', user_id: null, type: 'approval_pending', title: 'New Registration',
    message: 'Tyler Johnson has registered and is awaiting approval',
    read: true, link: '/dashboard/volunteers/approval', created_at: '2025-05-22T00:00:00Z',
  },
]

