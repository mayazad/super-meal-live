-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create meals table
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  total_meals INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(member_id, month_year)
);

-- Create groceries table
CREATE TABLE groceries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  item_name TEXT NOT NULL,
  cost NUMERIC(10, 2) NOT NULL,
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  purchased_by UUID REFERENCES members(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create utilities table
CREATE TABLE utilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  cost NUMERIC(10, 2) NOT NULL,
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE groceries ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilities ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all tables so the public summary works without auth
CREATE POLICY "Allow public read access to members" ON members FOR SELECT USING (true);
CREATE POLICY "Allow public read access to meals" ON meals FOR SELECT USING (true);
CREATE POLICY "Allow public read access to groceries" ON groceries FOR SELECT USING (true);
CREATE POLICY "Allow public read access to utilities" ON utilities FOR SELECT USING (true);

-- Allow admin full access to members
CREATE POLICY "Allow admin full access to members" ON members USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin full access to meals" ON meals USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin full access to groceries" ON groceries USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin full access to utilities" ON utilities USING (auth.role() = 'authenticated');

-- MESS MANAGEMENT REFACTOR TABLES --

-- Create daily_meals table
CREATE TABLE daily_meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  regular_meals INTEGER NOT NULL DEFAULT 0,
  guest_meals INTEGER NOT NULL DEFAULT 0,
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(member_id, date)
);

-- Create meal_deposits table
CREATE TABLE meal_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create utility_deposits table
CREATE TABLE utility_deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  month_year VARCHAR(7) NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS) for new tables
ALTER TABLE daily_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_deposits ENABLE ROW LEVEL SECURITY;

-- Allow public read access to new tables
CREATE POLICY "Allow public read access to daily_meals" ON daily_meals FOR SELECT USING (true);
CREATE POLICY "Allow public read access to meal_deposits" ON meal_deposits FOR SELECT USING (true);
CREATE POLICY "Allow public read access to utility_deposits" ON utility_deposits FOR SELECT USING (true);

-- Allow authenticated users (Admin) full access
CREATE POLICY "Allow admin full access to daily_meals" ON daily_meals USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin full access to meal_deposits" ON meal_deposits USING (auth.role() = 'authenticated');
CREATE POLICY "Allow admin full access to utility_deposits" ON utility_deposits USING (auth.role() = 'authenticated');

-- Utility Payment Matrix table
-- Tracks which members have paid for each specific utility bill
CREATE TABLE utility_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  utility_id UUID REFERENCES utilities(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(utility_id, member_id)
);

ALTER TABLE utility_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to utility_payments" ON utility_payments FOR SELECT USING (true);
CREATE POLICY "Allow admin full access to utility_payments" ON utility_payments USING (auth.role() = 'authenticated');

-- Lock Month table — prevents further editing once a month is closed
CREATE TABLE locked_months (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month_year VARCHAR(7) NOT NULL UNIQUE, -- Format: YYYY-MM
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  locked_by TEXT -- admin email
);

ALTER TABLE locked_months ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to locked_months" ON locked_months FOR SELECT USING (true);
CREATE POLICY "Allow admin full access to locked_months" ON locked_months USING (auth.role() = 'authenticated');


