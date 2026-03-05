import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Event } from '../models/event.model';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  private eventsSubject = new BehaviorSubject<Event[]>([]);
  public events$ = this.eventsSubject.asObservable();
  private readonly SAVED_EVENTS_KEY = 'savedEvents';
  private readonly ATTENDED_EVENTS_KEY = 'attendedEvents';
  private readonly EVENT_RATINGS_KEY = 'eventRatings';
  private savedEventIds = new Set<string>();
  private attendedEventIds = new Set<string>();
  private eventRatings = new Map<string, number>();

  constructor(private http: HttpClient) {
    this.loadSavedEvents();
    this.loadAttendedEvents();
    this.loadEventRatings();
    this.loadEvents();
  }

  loadEvents(): void {
    this.http.get<{ events: Event[] }>('/data/events.json').subscribe(
      (data) => {
        // Apply stored ratings to events
        const eventsWithRatings = data.events.map((event) => ({
          ...event,
          rating: this.eventRatings.get(event.id) || event.rating,
        }));
        this.eventsSubject.next(eventsWithRatings);
      },
      (error) => {
        console.error('Error loading events:', error);
      },
    );
  }

  getEvents(): Observable<Event[]> {
    return this.events$;
  }

  getEventById(id: string): Event | undefined {
    return this.eventsSubject.value.find((event) => event.id === id);
  }

  addEvent(event: Event): void {
    const currentEvents = this.eventsSubject.value;
    this.eventsSubject.next([...currentEvents, event]);
  }

  updateEvent(id: string, updatedEvent: Event): void {
    const currentEvents = this.eventsSubject.value;
    const index = currentEvents.findIndex((event) => event.id === id);
    if (index !== -1) {
      currentEvents[index] = updatedEvent;
      this.eventsSubject.next([...currentEvents]);
    }
  }

  deleteEvent(id: string): void {
    const currentEvents = this.eventsSubject.value;
    this.eventsSubject.next(currentEvents.filter((event) => event.id !== id));
  }

  getEventsByTag(tag: string): Event[] {
    return this.eventsSubject.value.filter((event) => event.tags.includes(tag));
  }

  getUpcomingEvents(): Event[] {
    return this.eventsSubject.value.filter((event) => event.status === 'upcoming');
  }

  // Saved Events Management
  private loadSavedEvents(): void {
    try {
      const saved = localStorage.getItem(this.SAVED_EVENTS_KEY);
      if (saved) {
        this.savedEventIds = new Set(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading saved events:', error);
      this.savedEventIds = new Set();
    }
  }

  private saveSavedEventsToStorage(): void {
    try {
      localStorage.setItem(this.SAVED_EVENTS_KEY, JSON.stringify(Array.from(this.savedEventIds)));
    } catch (error) {
      console.error('Error saving events to storage:', error);
    }
  }

  saveEvent(eventId: string): void {
    this.savedEventIds.add(eventId);
    this.saveSavedEventsToStorage();
  }

  unsaveEvent(eventId: string): void {
    this.savedEventIds.delete(eventId);
    this.saveSavedEventsToStorage();
  }

  isEventSaved(eventId: string): boolean {
    return this.savedEventIds.has(eventId);
  }

  toggleEventSaved(eventId: string): boolean {
    if (this.isEventSaved(eventId)) {
      this.unsaveEvent(eventId);
      return false;
    } else {
      this.saveEvent(eventId);
      return true;
    }
  }

  getSavedEvents(): Event[] {
    return this.eventsSubject.value.filter((event) => this.isEventSaved(event.id));
  }

  getSavedEventIds(): Set<string> {
    return new Set(this.savedEventIds);
  }

  // Attended Events Management
  private loadAttendedEvents(): void {
    try {
      const attended = localStorage.getItem(this.ATTENDED_EVENTS_KEY);
      if (attended) {
        this.attendedEventIds = new Set(JSON.parse(attended));
      }
    } catch (error) {
      console.error('Error loading attended events:', error);
      this.attendedEventIds = new Set();
    }
  }

  private saveAttendedEventsToStorage(): void {
    try {
      localStorage.setItem(
        this.ATTENDED_EVENTS_KEY,
        JSON.stringify(Array.from(this.attendedEventIds)),
      );
    } catch (error) {
      console.error('Error saving attended events to storage:', error);
    }
  }

  markEventAttended(eventId: string): void {
    this.attendedEventIds.add(eventId);
    this.saveAttendedEventsToStorage();
  }

  unmarkEventAttended(eventId: string): void {
    this.attendedEventIds.delete(eventId);
    this.saveAttendedEventsToStorage();
  }

  isEventAttended(eventId: string): boolean {
    return this.attendedEventIds.has(eventId);
  }

  toggleEventAttended(eventId: string): boolean {
    if (this.isEventAttended(eventId)) {
      this.unmarkEventAttended(eventId);
      return false;
    } else {
      this.markEventAttended(eventId);
      return true;
    }
  }

  getAttendedEvents(): Event[] {
    return this.eventsSubject.value.filter((event) => this.isEventAttended(event.id));
  }

  getAttendedEventIds(): Set<string> {
    return new Set(this.attendedEventIds);
  }

  // Event Ratings Management
  private loadEventRatings(): void {
    try {
      const saved = localStorage.getItem(this.EVENT_RATINGS_KEY);
      if (saved) {
        const ratingsArray = JSON.parse(saved) as [string, number][];
        this.eventRatings = new Map(ratingsArray);
      }
    } catch (error) {
      console.error('Error loading event ratings:', error);
      this.eventRatings = new Map();
    }
  }

  private saveEventRatingsToStorage(): void {
    try {
      const ratingsArray = Array.from(this.eventRatings.entries());
      localStorage.setItem(this.EVENT_RATINGS_KEY, JSON.stringify(ratingsArray));
    } catch (error) {
      console.error('Error saving event ratings to storage:', error);
    }
  }

  setEventRating(eventId: string, rating: number): void {
    if (rating === 0) {
      this.eventRatings.delete(eventId);
    } else {
      this.eventRatings.set(eventId, rating);
    }
    this.saveEventRatingsToStorage();

    // Update the event in the events array
    const currentEvents = this.eventsSubject.value;
    const updatedEvents = currentEvents.map((event) =>
      event.id === eventId ? { ...event, rating: rating || undefined } : event,
    );
    this.eventsSubject.next(updatedEvents);
  }

  getEventRating(eventId: string): number | undefined {
    return this.eventRatings.get(eventId);
  }
}
