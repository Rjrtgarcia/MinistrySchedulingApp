-- Ministry Scheduling App - Initial Database Schema
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE system_role AS ENUM ('admin', 'coordinator', 'leader', 'volunteer');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE department AS ENUM ('technical', 'music');
CREATE TYPE training_status AS ENUM ('in_training', 'qualified', 'lead');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'completed', 'cancelled');
CREATE TYPE shift_status AS ENUM ('pending', 'accepted', 'declined', 'swapping');
CREATE TYPE run_sheet_item_type AS ENUM ('song', 'sermon', 'video', 'transition', 'announcement', 'prayer', 'other');
CREATE TYPE notification_channel AS ENUM ('sms', 'email');
CREATE TYPE swap_request_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');
CREATE TYPE small_group_status AS ENUM ('plugged_in', 'seeking', 'not_interested', 'unknown');

-- ============================================
-- 1. USERS, SKILLS, AND AVAILABILITY
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  phone_number TEXT,
  system_role system_role NOT NULL DEFAULT 'volunteer',
  approval_status approval_status NOT NULL DEFAULT 'pending',
  serving_frequency_pref INTEGER DEFAULT 2, -- times per month
  avatar_url TEXT,
  discipleship_one2one BOOLEAN NOT NULL DEFAULT FALSE,
  discipleship_spiritual_foundation BOOLEAN NOT NULL DEFAULT FALSE,
  discipleship_leadership_113 BOOLEAN NOT NULL DEFAULT FALSE,
  small_group_status small_group_status NOT NULL DEFAULT 'unknown',
  small_group_leader TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skills table
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  department department NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User-Skills join table
CREATE TABLE public.user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  training_status training_status NOT NULL DEFAULT 'in_training',
  certified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, skill_id)
);

-- Unavailabilities
CREATE TABLE public.unavailabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. EVENTS & SCHEDULING
-- ============================================

-- Events table
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  event_datetime TIMESTAMPTZ NOT NULL,
  call_time TIMESTAMPTZ,
  status event_status NOT NULL DEFAULT 'draft',
  description TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shifts table
CREATE TABLE public.shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill_id UUID REFERENCES public.skills(id),
  status shift_status NOT NULL DEFAULT 'pending',
  soft_conflict BOOLEAN NOT NULL DEFAULT FALSE,
  notified_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Swap Requests table
CREATE TABLE public.swap_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.users(id),
  offered_to UUID REFERENCES public.users(id),
  status swap_request_status NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. THE RUN SHEET & RESOURCES
-- ============================================

-- Song Library
CREATE TABLE public.song_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist TEXT,
  default_key TEXT,
  default_bpm INTEGER,
  lyrics TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Run Sheet Items
CREATE TABLE public.run_sheet_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  item_type run_sheet_item_type NOT NULL DEFAULT 'other',
  song_id UUID REFERENCES public.song_library(id),
  title TEXT,
  duration_minutes INTEGER,
  tech_cues TEXT,
  stage_notes TEXT,
  key_override TEXT,
  bpm_override INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Resources (file attachments)
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.run_sheet_items(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. COMMUNICATION LOG
-- ============================================

CREATE TABLE public.notifications_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  type TEXT NOT NULL,
  content_preview TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_shifts_event ON public.shifts(event_id);
CREATE INDEX idx_shifts_user ON public.shifts(user_id);
CREATE INDEX idx_shifts_status ON public.shifts(status);
CREATE INDEX idx_run_sheet_items_event ON public.run_sheet_items(event_id);
CREATE INDEX idx_run_sheet_items_order ON public.run_sheet_items(event_id, order_index);
CREATE INDEX idx_unavailabilities_user ON public.unavailabilities(user_id);
CREATE INDEX idx_unavailabilities_dates ON public.unavailabilities(start_date, end_date);
CREATE INDEX idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX idx_events_datetime ON public.events(event_datetime);
CREATE INDEX idx_events_status ON public.events(status);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_song_library_updated_at BEFORE UPDATE ON public.song_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_run_sheet_items_updated_at BEFORE UPDATE ON public.run_sheet_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_swap_requests_updated_at BEFORE UPDATE ON public.swap_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unavailabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.run_sheet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Coordinators and admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role IN ('leader', 'coordinator', 'admin'))
  );
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update any user" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role = 'admin')
  );
CREATE POLICY "Coordinators can update volunteer profiles" ON public.users
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role IN ('leader', 'coordinator', 'admin'))
  );
CREATE POLICY "Allow insert for new users" ON public.users
  FOR INSERT WITH CHECK (true);

-- Skills policies
CREATE POLICY "Anyone authenticated can view skills" ON public.skills
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Coordinators can manage skills" ON public.skills
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role IN ('leader', 'coordinator', 'admin'))
  );

-- User Skills policies
CREATE POLICY "Users can view their own skills" ON public.user_skills
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Coordinators can view all user skills" ON public.user_skills
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role IN ('leader', 'coordinator', 'admin'))
  );
CREATE POLICY "Coordinators can manage user skills" ON public.user_skills
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role IN ('leader', 'coordinator', 'admin'))
  );

-- Unavailabilities policies
CREATE POLICY "Users can manage their own unavailabilities" ON public.unavailabilities
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Coordinators can view all unavailabilities" ON public.unavailabilities
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role IN ('leader', 'coordinator', 'admin'))
  );

-- Events policies
CREATE POLICY "Anyone authenticated can view published events" ON public.events
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Coordinators can manage events" ON public.events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role IN ('leader', 'coordinator', 'admin'))
  );

-- Shifts policies
CREATE POLICY "Users can view their own shifts" ON public.shifts
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Coordinators can view all shifts" ON public.shifts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role IN ('leader', 'coordinator', 'admin'))
  );
CREATE POLICY "Users can update their own shift status" ON public.shifts
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Coordinators can manage shifts" ON public.shifts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role IN ('leader', 'coordinator', 'admin'))
  );

-- Swap Requests policies
CREATE POLICY "Users can view their swap requests" ON public.swap_requests
  FOR SELECT USING (requested_by = auth.uid() OR offered_to = auth.uid());
CREATE POLICY "Users can create swap requests" ON public.swap_requests
  FOR INSERT WITH CHECK (requested_by = auth.uid());
CREATE POLICY "Involved parties can update swap requests" ON public.swap_requests
  FOR UPDATE USING (requested_by = auth.uid() OR offered_to = auth.uid());
CREATE POLICY "Coordinators can manage swap requests" ON public.swap_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role IN ('leader', 'coordinator', 'admin'))
  );

-- Song Library policies
CREATE POLICY "Anyone authenticated can view songs" ON public.song_library
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Coordinators can manage songs" ON public.song_library
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role IN ('leader', 'coordinator', 'admin'))
  );

-- Run Sheet Items policies
CREATE POLICY "Anyone authenticated can view run sheet items" ON public.run_sheet_items
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Coordinators can manage run sheet items" ON public.run_sheet_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role IN ('leader', 'coordinator', 'admin'))
  );

-- Resources policies
CREATE POLICY "Anyone authenticated can view resources" ON public.resources
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Coordinators can manage resources" ON public.resources
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role IN ('leader', 'coordinator', 'admin'))
  );

-- Notifications log policies
CREATE POLICY "Users can view their own notifications" ON public.notifications_log
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Coordinators can view all notifications" ON public.notifications_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND system_role IN ('leader', 'coordinator', 'admin'))
  );

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.run_sheet_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- ============================================
-- SEED DATA: Default Skills
-- ============================================
INSERT INTO public.skills (name, department, description) VALUES
  ('Audio Engineer', 'technical', 'Operates sound mixing console and manages audio levels'),
  ('Lighting Operator', 'technical', 'Controls lighting board and manages stage lighting'),
  ('Visual Presentation', 'technical', 'Manages presentation software (ProPresenter, slides)'),
  ('Stage Manager', 'technical', 'Coordinates physical stage transitions and logistics'),
  ('Camera Operator', 'technical', 'Operates cameras for live streaming or recording'),
  ('Stream Technician', 'technical', 'Manages live streaming software and broadcast'),
  ('Worship Leader', 'music', 'Leads worship through music selection and performance'),
  ('Vocalist', 'music', 'Provides vocal harmonies and backup vocals'),
  ('Guitarist', 'music', 'Plays acoustic or electric guitar'),
  ('Bassist', 'music', 'Plays bass guitar'),
  ('Drummer', 'music', 'Plays drums and percussion'),
  ('Keyboardist', 'music', 'Plays keyboard or piano'),
  ('Sound Check Lead', 'music', 'Coordinates pre-service sound check');
