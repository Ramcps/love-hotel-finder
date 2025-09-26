-- =====================================================
-- HOTEL FINDER APP - Complete Database Schema
-- =====================================================

-- 1. Enable UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 2. HOTELS TABLE
-- =====================================================
CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    latitude FLOAT NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
    longitude FLOAT NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
    contact_number TEXT,
    rating FLOAT DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ROOMS TABLE
-- =====================================================
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    room_type TEXT NOT NULL CHECK (room_type IN ('single', 'double', 'suite', 'deluxe', 'family')),
    price_per_night NUMERIC(10,2) NOT NULL CHECK (price_per_night > 0),
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. USER PROFILES TABLE
-- =====================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. REVIEWS TABLE
-- =====================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hotel_id, user_id) -- Each user can review a hotel only once
);

-- =====================================================
-- 6. INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for geo search using GIST
CREATE INDEX idx_hotels_location ON hotels USING GIST (
    point(longitude, latitude)
);

-- Index on hotel city for city-based searches
CREATE INDEX idx_hotels_city ON hotels(city);

-- Index on hotel rating (descending order for best-rated first)
CREATE INDEX idx_hotels_rating ON hotels(rating DESC);

-- Index on reviews for hotel lookup
CREATE INDEX idx_reviews_hotel_id ON reviews(hotel_id);

-- Index on rooms for hotel lookup
CREATE INDEX idx_rooms_hotel_id ON rooms(hotel_id);

-- Additional useful indexes
CREATE INDEX idx_hotels_state ON hotels(state);
CREATE INDEX idx_hotels_country ON hotels(country);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_rooms_available ON rooms(available) WHERE available = true;

-- =====================================================
-- 7. AUTO-UPDATE RATING FUNCTION & TRIGGER
-- =====================================================

-- Function to calculate and update hotel rating based on reviews
CREATE OR REPLACE FUNCTION update_hotel_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the hotel's rating based on average of all reviews
    UPDATE hotels 
    SET rating = (
        SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0)
        FROM reviews 
        WHERE hotel_id = COALESCE(NEW.hotel_id, OLD.hotel_id)
    )
    WHERE id = COALESCE(NEW.hotel_id, OLD.hotel_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update hotel rating when reviews change
CREATE TRIGGER update_hotel_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_hotel_rating();

-- =====================================================
-- 8. LOCATION SEARCH FUNCTION
-- =====================================================

-- Function to search hotels by location within radius using Haversine formula
CREATE OR REPLACE FUNCTION search_hotels_by_location(
    search_lat FLOAT,
    search_lng FLOAT,
    radius_km FLOAT DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    city TEXT,
    rating FLOAT,
    distance_km FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.name,
        h.address,
        h.city,
        h.rating,
        -- Haversine formula for distance calculation in km
        ROUND(
            (6371 * acos(
                cos(radians(search_lat)) * 
                cos(radians(h.latitude)) * 
                cos(radians(h.longitude) - radians(search_lng)) + 
                sin(radians(search_lat)) * 
                sin(radians(h.latitude))
            ))::numeric, 2
        ) as distance_km
    FROM hotels h
    WHERE 
        -- Filter hotels within the specified radius
        (6371 * acos(
            cos(radians(search_lat)) * 
            cos(radians(h.latitude)) * 
            cos(radians(h.longitude) - radians(search_lng)) + 
            sin(radians(search_lat)) * 
            sin(radians(h.latitude))
        )) <= radius_km
    ORDER BY distance_km ASC; -- Nearest hotels first
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Insert sample hotels (Mumbai, India)
INSERT INTO hotels (name, description, address, city, state, country, latitude, longitude, contact_number) VALUES
('The Taj Mahal Palace', 'Luxury heritage hotel overlooking the Gateway of India', 'Apollo Bunder, Colaba', 'Mumbai', 'Maharashtra', 'India', 18.9220, 72.8332, '+91-22-6665-3366'),
('The Oberoi Mumbai', 'Contemporary luxury hotel in the business district', 'Nariman Point', 'Mumbai', 'Maharashtra', 'India', 18.9268, 72.8258, '+91-22-6632-5757'),
('ITC Grand Central', 'Premium business hotel with modern amenities', 'Dr. Babasaheb Ambedkar Road, Parel', 'Mumbai', 'Maharashtra', 'India', 19.0144, 72.8318, '+91-22-2410-1010');

-- Insert sample rooms
INSERT INTO rooms (hotel_id, room_type, price_per_night, available) 
SELECT 
    h.id,
    (ARRAY['single', 'double', 'suite'])[floor(random() * 3 + 1)],
    (random() * 15000 + 5000)::numeric(10,2),
    true
FROM hotels h, generate_series(1, 3);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Hotels: Public read access
CREATE POLICY "Hotels are viewable by everyone" ON hotels
    FOR SELECT USING (true);

-- Rooms: Public read access
CREATE POLICY "Rooms are viewable by everyone" ON rooms
    FOR SELECT USING (true);

-- User profiles: Users can view and update their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Reviews: Users can view all reviews, but only create/update/delete their own
CREATE POLICY "Reviews are viewable by everyone" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- SCHEMA DEPLOYMENT COMPLETE
-- =====================================================

-- Run this query to verify your schema was created successfully:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('hotels', 'rooms', 'user_profiles', 'reviews');