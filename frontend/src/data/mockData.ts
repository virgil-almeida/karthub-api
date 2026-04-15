import type { Profile, Championship, Event, Heat, HeatResult, Track, DriverStats, DriverBadge } from "@/types/kart";

// Mock Profiles (Drivers)
export const mockProfiles: Profile[] = [
  {
    id: "p1",
    username: "speed_lucas",
    full_name: "Lucas Mendes",
    avatar_url: "",
    weight: 72,
    bio: "Piloto profissional desde 2018. Especialista em pistas molhadas.",
    is_pro_member: true,
    instagram: null, youtube: null, tiktok: null, website: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "p2",
    username: "thunder_rafa",
    full_name: "Rafael Santos",
    avatar_url: "",
    weight: 68,
    bio: "Velocidade é minha paixão. 3x campeão regional.",
    is_pro_member: true,
    instagram: null, youtube: null, tiktok: null, website: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "p3",
    username: "flash_gab",
    full_name: "Gabriel Silva",
    avatar_url: "",
    weight: 75,
    bio: "Piloto veterano com 10 anos de experiência.",
    is_pro_member: false,
    instagram: null, youtube: null, tiktok: null, website: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "p4",
    username: "rocket_andre",
    full_name: "André Costa",
    avatar_url: "",
    weight: 70,
    bio: "Especialista em largadas e ultrapassagens.",
    is_pro_member: true,
    instagram: null, youtube: null, tiktok: null, website: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "p5",
    username: "turbo_bruno",
    full_name: "Bruno Oliveira",
    avatar_url: "",
    weight: 73,
    bio: "Consistência é a chave para o campeonato.",
    is_pro_member: false,
    instagram: null, youtube: null, tiktok: null, website: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "p6",
    username: "nitro_felipe",
    full_name: "Felipe Almeida",
    avatar_url: "",
    weight: 65,
    bio: "Piloto mais jovem do campeonato. Promessa do kart.",
    is_pro_member: false,
    instagram: null, youtube: null, tiktok: null, website: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

// Mock Tracks
export const mockTracks: Track[] = [
  {
    id: "t1",
    name: "Kartódromo Interlagos",
    location: "São Paulo, SP",
    length_meters: 1200,
    map_image_url: null,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "t2",
    name: "Kartódromo Granja Viana",
    location: "Cotia, SP",
    length_meters: 1450,
    map_image_url: null,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "t3",
    name: "SP Indoor Kart",
    location: "São Paulo, SP",
    length_meters: 800,
    map_image_url: null,
    created_at: "2024-01-01T00:00:00Z",
  },
];

// Mock Championships
export const mockChampionships: Championship[] = [
  {
    id: "c1",
    name: "Campeonato Paulista de Kart 2024",
    organizer_id: "p1",
    rules_summary: "Regulamento FIA Karting. Categoria Senior. Sistema de pontuação: 25-18-15-12-10-8-6-4-2-1",
    is_private: false,
    logo_url: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "c2",
    name: "Copa Indoor SP",
    organizer_id: "p2",
    rules_summary: "Campeonato indoor. Karts de aluguel padronizados.",
    is_private: false,
    logo_url: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

// Mock Events
export const mockEvents: Event[] = [
  {
    id: "e1",
    championship_id: "c1",
    track_id: "t1",
    name: "GP Interlagos",
    date: "2024-01-15",
    status: "completed",
    created_at: "2024-01-01T00:00:00Z",
    track: mockTracks[0],
  },
  {
    id: "e2",
    championship_id: "c1",
    track_id: "t2",
    name: "GP Granja Viana",
    date: "2024-02-20",
    status: "completed",
    created_at: "2024-01-01T00:00:00Z",
    track: mockTracks[1],
  },
  {
    id: "e3",
    championship_id: "c1",
    track_id: "t3",
    name: "GP São Paulo Indoor",
    date: "2024-03-18",
    status: "completed",
    created_at: "2024-01-01T00:00:00Z",
    track: mockTracks[2],
  },
  {
    id: "e4",
    championship_id: "c1",
    track_id: "t1",
    name: "GP Campinas",
    date: "2024-04-20",
    status: "scheduled",
    created_at: "2024-01-01T00:00:00Z",
    track: mockTracks[0],
  },
];

// Mock Heats
export const mockHeats: Heat[] = [
  {
    id: "h1",
    event_id: "e1",
    name: "Bateria Classificatória",
    weather_condition: "dry",
    start_time: "2024-01-15T10:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "h2",
    event_id: "e1",
    name: "Bateria Final",
    weather_condition: "dry",
    start_time: "2024-01-15T14:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "h3",
    event_id: "e2",
    name: "Bateria Final",
    weather_condition: "wet",
    start_time: "2024-02-20T14:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "h4",
    event_id: "e3",
    name: "Bateria Final",
    weather_condition: "dry",
    start_time: "2024-03-18T14:00:00Z",
    created_at: "2024-01-01T00:00:00Z",
  },
];

// Mock Heat Results
export const mockHeatResults: HeatResult[] = [
  // GP Interlagos Final
  { id: "hr1", heat_id: "h2", driver_id: "p1", driver_name_text: null, position: 1, kart_number: 7, best_lap_time: "0:58.234", total_time: "14:52.456", gap_to_leader: null, gap_to_previous: null, average_speed: 73.2, total_laps: 15, payment_status: true, points: 25, created_at: "2024-01-15T00:00:00Z" },
  { id: "hr2", heat_id: "h2", driver_id: "p3", driver_name_text: null, position: 2, kart_number: 44, best_lap_time: "0:58.567", total_time: "14:55.123", gap_to_leader: "+2.667", gap_to_previous: "+2.667", average_speed: 72.8, total_laps: 15, payment_status: true, points: 18, created_at: "2024-01-15T00:00:00Z" },
  { id: "hr3", heat_id: "h2", driver_id: "p2", driver_name_text: null, position: 3, kart_number: 23, best_lap_time: "0:58.891", total_time: "14:58.789", gap_to_leader: "+6.333", gap_to_previous: "+3.666", average_speed: 72.4, total_laps: 15, payment_status: true, points: 15, created_at: "2024-01-15T00:00:00Z" },
  { id: "hr4", heat_id: "h2", driver_id: "p4", driver_name_text: null, position: 4, kart_number: 11, best_lap_time: "0:59.123", total_time: "15:02.345", gap_to_leader: "+9.889", gap_to_previous: "+3.556", average_speed: 71.9, total_laps: 15, payment_status: false, points: 12, created_at: "2024-01-15T00:00:00Z" },
  { id: "hr5", heat_id: "h2", driver_id: "p5", driver_name_text: null, position: 5, kart_number: 88, best_lap_time: "0:59.456", total_time: "15:05.678", gap_to_leader: "+13.222", gap_to_previous: "+3.333", average_speed: 71.5, total_laps: 15, payment_status: true, points: 10, created_at: "2024-01-15T00:00:00Z" },
  { id: "hr6", heat_id: "h2", driver_id: "p6", driver_name_text: null, position: 6, kart_number: 33, best_lap_time: "0:59.789", total_time: "15:08.901", gap_to_leader: "+16.445", gap_to_previous: "+3.223", average_speed: 71.1, total_laps: 15, payment_status: true, points: 8, created_at: "2024-01-15T00:00:00Z" },
  
  // GP Granja Viana Final
  { id: "hr7", heat_id: "h3", driver_id: "p2", driver_name_text: null, position: 1, kart_number: 23, best_lap_time: "1:02.345", total_time: "18:45.678", gap_to_leader: null, gap_to_previous: null, average_speed: 84.1, total_laps: 18, payment_status: true, points: 25, created_at: "2024-02-20T00:00:00Z" },
  { id: "hr8", heat_id: "h3", driver_id: "p1", driver_name_text: null, position: 2, kart_number: 7, best_lap_time: "1:02.567", total_time: "18:48.123", gap_to_leader: "+2.445", gap_to_previous: "+2.445", average_speed: 83.8, total_laps: 18, payment_status: true, points: 18, created_at: "2024-02-20T00:00:00Z" },
  { id: "hr9", heat_id: "h3", driver_id: "p4", driver_name_text: null, position: 3, kart_number: 11, best_lap_time: "1:02.891", total_time: "18:52.456", gap_to_leader: "+6.778", gap_to_previous: "+4.333", average_speed: 83.4, total_laps: 18, payment_status: true, points: 15, created_at: "2024-02-20T00:00:00Z" },
  { id: "hr10", heat_id: "h3", driver_id: "p6", driver_name_text: null, position: 4, kart_number: 33, best_lap_time: "1:03.123", total_time: "18:56.789", gap_to_leader: "+11.111", gap_to_previous: "+4.333", average_speed: 83.0, total_laps: 18, payment_status: false, points: 12, created_at: "2024-02-20T00:00:00Z" },
  { id: "hr11", heat_id: "h3", driver_id: "p3", driver_name_text: null, position: 5, kart_number: 44, best_lap_time: "1:03.456", total_time: "19:01.234", gap_to_leader: "+15.556", gap_to_previous: "+4.445", average_speed: 82.6, total_laps: 18, payment_status: true, points: 10, created_at: "2024-02-20T00:00:00Z" },
  { id: "hr12", heat_id: "h3", driver_id: "p5", driver_name_text: null, position: 6, kart_number: 88, best_lap_time: "1:03.789", total_time: "19:05.567", gap_to_leader: "+19.889", gap_to_previous: "+4.333", average_speed: 82.2, total_laps: 18, payment_status: true, points: 8, created_at: "2024-02-20T00:00:00Z" },
  
  // GP SP Indoor Final
  { id: "hr13", heat_id: "h4", driver_id: "p3", driver_name_text: null, position: 1, kart_number: 44, best_lap_time: "0:45.234", total_time: "9:12.456", gap_to_leader: null, gap_to_previous: null, average_speed: 63.8, total_laps: 12, payment_status: true, points: 25, created_at: "2024-03-18T00:00:00Z" },
  { id: "hr14", heat_id: "h4", driver_id: "p4", driver_name_text: null, position: 2, kart_number: 11, best_lap_time: "0:45.567", total_time: "9:15.123", gap_to_leader: "+2.667", gap_to_previous: "+2.667", average_speed: 63.4, total_laps: 12, payment_status: true, points: 18, created_at: "2024-03-18T00:00:00Z" },
  { id: "hr15", heat_id: "h4", driver_id: "p1", driver_name_text: null, position: 3, kart_number: 7, best_lap_time: "0:45.891", total_time: "9:18.789", gap_to_leader: "+6.333", gap_to_previous: "+3.666", average_speed: 63.0, total_laps: 12, payment_status: true, points: 15, created_at: "2024-03-18T00:00:00Z" },
  { id: "hr16", heat_id: "h4", driver_id: "p2", driver_name_text: null, position: 4, kart_number: 23, best_lap_time: "0:46.123", total_time: "9:22.345", gap_to_leader: "+9.889", gap_to_previous: "+3.556", average_speed: 62.6, total_laps: 12, payment_status: true, points: 12, created_at: "2024-03-18T00:00:00Z" },
  { id: "hr17", heat_id: "h4", driver_id: "p5", driver_name_text: null, position: 5, kart_number: 88, best_lap_time: "0:46.456", total_time: "9:25.678", gap_to_leader: "+13.222", gap_to_previous: "+3.333", average_speed: 62.2, total_laps: 12, payment_status: true, points: 10, created_at: "2024-03-18T00:00:00Z" },
  { id: "hr18", heat_id: "h4", driver_id: "p6", driver_name_text: null, position: 6, kart_number: 33, best_lap_time: "0:46.789", total_time: "9:28.901", gap_to_leader: "+16.445", gap_to_previous: "+3.223", average_speed: 61.8, total_laps: 12, payment_status: false, points: 8, created_at: "2024-03-18T00:00:00Z" },
];

// Mock Driver Badges
export const mockBadges: DriverBadge[] = [
  { id: "b1", profile_id: "p1", badge_type: "pole_position", badge_name: "Pole Position", badge_definition_id: null, championship_id: null, awarded_by: null, notes: null, earned_at: "2024-01-15T00:00:00Z" },
  { id: "b2", profile_id: "p1", badge_type: "fastest_lap", badge_name: "Volta Mais Rápida", badge_definition_id: null, championship_id: null, awarded_by: null, notes: null, earned_at: "2024-01-15T00:00:00Z" },
  { id: "b3", profile_id: "p2", badge_type: "rain_master", badge_name: "Rei da Chuva", badge_definition_id: null, championship_id: null, awarded_by: null, notes: null, earned_at: "2024-02-20T00:00:00Z" },
  { id: "b4", profile_id: "p3", badge_type: "comeback", badge_name: "Comeback King", badge_definition_id: null, championship_id: null, awarded_by: null, notes: null, earned_at: "2024-03-18T00:00:00Z" },
  { id: "b5", profile_id: "p4", badge_type: "consistent", badge_name: "Consistência", badge_definition_id: null, championship_id: null, awarded_by: null, notes: null, earned_at: "2024-03-18T00:00:00Z" },
];

// Helper functions
export function getDriverStats(profileId: string): DriverStats {
  const results = mockHeatResults.filter(r => r.driver_id === profileId);
  
  if (results.length === 0) {
    return {
      totalRaces: 0,
      wins: 0,
      podiums: 0,
      bestPosition: null,
      averagePosition: 0,
      totalPoints: 0,
      fastestLaps: 0,
    };
  }

  const positions = results.map(r => r.position);
  const wins = positions.filter(p => p === 1).length;
  const podiums = positions.filter(p => p <= 3).length;
  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);

  return {
    totalRaces: results.length,
    wins,
    podiums,
    bestPosition: Math.min(...positions),
    averagePosition: parseFloat((positions.reduce((a, b) => a + b, 0) / positions.length).toFixed(1)),
    totalPoints,
    fastestLaps: wins,
  };
}

export function getStandings() {
  const standings = mockProfiles.map(profile => {
    const stats = getDriverStats(profile.id);
    const badges = mockBadges.filter(b => b.profile_id === profile.id);
    return {
      ...profile,
      stats,
      badges,
    };
  });

  return standings.sort((a, b) => b.stats.totalPoints - a.stats.totalPoints);
}

export function getRecentEvents(limit = 5) {
  return mockEvents
    .filter(e => e.status === 'completed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export function getUpcomingEvents(limit = 5) {
  return mockEvents
    .filter(e => e.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}

export function getEventResults(eventId: string) {
  const heats = mockHeats.filter(h => h.event_id === eventId);
  const heatIds = heats.map(h => h.id);
  return mockHeatResults.filter(r => heatIds.includes(r.heat_id));
}

export function getProfileById(id: string) {
  return mockProfiles.find(p => p.id === id);
}
