// Profile types
export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  weight: number | null;
  bio: string | null;
  is_pro_member: boolean;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

// Track types
export interface Track {
  id: string;
  name: string;
  location: string;
  length_meters: number | null;
  map_image_url: string | null;
  created_at: string;
}

// Championship types
export interface Championship {
  id: string;
  name: string;
  organizer_id: string | null;
  rules_summary: string | null;
  is_private: boolean;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  organizer?: Profile | null;
}

// Championship member types
export type MemberStatus = 'active' | 'pending' | 'banned';
export type MemberRole = 'driver' | 'admin' | 'organizer';

export interface ChampionshipMember {
  id: string;
  championship_id: string;
  profile_id: string;
  status: MemberStatus;
  role: MemberRole;
  joined_at: string;
  profile?: Profile;
}

// Event types
export type EventStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Event {
  id: string;
  championship_id: string;
  track_id: string | null;
  name: string;
  date: string;
  status: EventStatus;
  created_at: string;
  track?: Track | null;
  championship?: Championship | null;
}

// Heat types
export type WeatherCondition = 'dry' | 'wet' | 'mixed';

export interface Heat {
  id: string;
  event_id: string;
  name: string;
  weather_condition: WeatherCondition;
  start_time: string | null;
  created_at: string;
  event?: Event | null;
}

// Heat result types
export interface HeatResult {
  id: string;
  heat_id: string;
  driver_id: string | null;
  driver_name_text: string | null;
  position: number;
  kart_number: number | null;
  best_lap_time: string | null;
  total_time: string | null;
  gap_to_leader: string | null;
  gap_to_previous: string | null;
  average_speed: number | null;
  total_laps: number | null;
  payment_status: boolean;
  points: number;
  created_at: string;
  driver?: Profile | null;
}

// Lap telemetry types
export interface LapTelemetry {
  id: string;
  heat_result_id: string;
  lap_number: number;
  lap_time: string;
  sector1: string | null;
  sector2: string | null;
  sector3: string | null;
  kart_number: number | null;
  gap_to_best: string | null;
  gap_to_leader: string | null;
  total_time: string | null;
  average_speed: number | null;
  created_at: string;
}

// Driver badge types
export interface DriverBadge {
  id: string;
  profile_id: string;
  badge_type: string;
  badge_name: string;
  badge_definition_id: string | null;
  championship_id: string | null;
  awarded_by: string | null;
  notes: string | null;
  earned_at: string;
}

// Statistics types
export interface DriverStats {
  totalRaces: number;
  wins: number;
  podiums: number;
  bestPosition: number | null;
  averagePosition: number;
  totalPoints: number;
  fastestLaps: number;
}

export interface DriverStanding extends Profile {
  stats: DriverStats;
  badges: DriverBadge[];
}
