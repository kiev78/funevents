export interface Event {
  id: string;
  title: string;
  tags: string[]; // ['Seed Swap/Exchange', 'Dance', 'Healing', 'Meditation Retreat', etc.]
  host: string;
  coHosts: string[];
  date: string; // ISO date format (YYYY-MM-DD)
  time: string; // HH:MM format
  timezone: string;
  location: string;
  lat?: number; // Latitude for distance calculation
  lng?: number; // Longitude for distance calculation
  isRemote: boolean;
  remoteLink?: string;
  eventDetails: string;
  sponsors: string[];
  status?: 'upcoming' | 'attended' | 'cancelled';
  createdAt?: string;
}
