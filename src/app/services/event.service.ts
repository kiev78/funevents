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

  constructor(private http: HttpClient) {
    this.loadEvents();
  }

  loadEvents(): void {
    this.http.get<{ events: Event[] }>('/data/events.json').subscribe(
      (data) => {
        this.eventsSubject.next(data.events);
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
}
