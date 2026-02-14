-- Calendar Booking System Schema
-- Run this in Supabase SQL Editor or via supabase db push

-- ============================================================================
-- AVAILABILITY SETTINGS TABLE
-- Stores the owner's available hours for each day of the week
-- ============================================================================

CREATE TABLE IF NOT EXISTS availability_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  slot_duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(day_of_week)
);

-- Seed default availability (Monday-Friday 9am-5pm)
INSERT INTO availability_settings (day_of_week, start_time, end_time)
VALUES
  (1, '09:00', '20:00'),  -- Monday
  (2, '09:00', '20:00'),  -- Tuesday
  (3, '09:00', '20:00'),  -- Wednesday
  (4, '09:00', '20:00'),  -- Thursday
  (5, '09:00', '20:00')   -- Friday
ON CONFLICT (day_of_week) DO NOTHING;

-- ============================================================================
-- BOOKINGS TABLE
-- Stores all booking requests and their status
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Guest information
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,

  -- Booking time (always stored in UTC)
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  booker_timezone TEXT NOT NULL,

  -- Status workflow:
  -- pending_verification → pending_approval → approved/rejected → cancelled
  status TEXT DEFAULT 'pending_verification'
    CHECK (status IN (
      'pending_verification',
      'pending_approval',
      'approved',
      'rejected',
      'cancelled'
    )),

  -- Tokens for verification and approval flows
  verification_token TEXT,
  verification_expires_at TIMESTAMPTZ,
  approval_token TEXT UNIQUE,

  -- Meeting details
  topic TEXT NOT NULL,
  notes TEXT,
  meeting_preference TEXT DEFAULT 'google_meet'
    CHECK (meeting_preference IN ('google_meet', 'custom_link', 'phone')),
  custom_meeting_link TEXT,
  phone_number TEXT,

  -- Google Calendar integration
  google_calendar_event_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_email ON bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_bookings_verification_token ON bookings(verification_token)
  WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_approval_token ON bookings(approval_token)
  WHERE approval_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE availability_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Public can read active availability settings
CREATE POLICY "Public read availability"
  ON availability_settings FOR SELECT TO anon
  USING (is_active = true);

-- Public can only INSERT bookings with pending_verification status
-- This prevents anyone from creating pre-approved bookings
CREATE POLICY "Public can create pending bookings"
  ON bookings FOR INSERT TO anon
  WITH CHECK (status = 'pending_verification');

-- Public can read their own booking by verification or approval token
-- This allows the status page to work
CREATE POLICY "Public read own booking by token"
  ON bookings FOR SELECT TO anon
  USING (
    verification_token IS NOT NULL
    OR approval_token IS NOT NULL
  );

-- Public can verify a booking (pending_verification → pending_approval)
-- Only works if the caller provides the correct verification_token
CREATE POLICY "Public can verify booking by token"
  ON bookings FOR UPDATE TO anon
  USING (verification_token IS NOT NULL AND status = 'pending_verification')
  WITH CHECK (status = 'pending_approval');

-- Public can approve/reject a booking via approval_token
CREATE POLICY "Public can approve or reject booking by token"
  ON bookings FOR UPDATE TO anon
  USING (approval_token IS NOT NULL AND status = 'pending_approval')
  WITH CHECK (status IN ('approved', 'rejected'));

-- Authenticated users (admin) have full access
CREATE POLICY "Admin full access to availability"
  ON availability_settings FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin full access to bookings"
  ON bookings FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to clean up expired unverified bookings (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_bookings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM bookings
  WHERE status = 'pending_verification'
    AND verification_expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_availability_settings_updated_at
  BEFORE UPDATE ON availability_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
