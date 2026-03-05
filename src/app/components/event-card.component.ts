import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event } from '../models/event.model';

@Component({
  selector: 'event-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="event-card">
      <div class="event-header">
        <h2>{{ event.title }}</h2>
        <div class="event-tags">
          <span *ngFor="let tag of event.tags" class="event-tag">{{ tag }}</span>
        </div>
      </div>
      <div class="event-details">
        <div class="detail-row">
          <strong>Date & Time:</strong>
          <span>{{ event.date }} at {{ event.time }} ({{ event.timezone }})</span>
        </div>
        <div class="detail-row">
          <strong>Host:</strong>
          <span>{{ event.host }}</span>
        </div>
        <div *ngIf="event.coHosts.length > 0" class="detail-row">
          <strong>Co-hosts:</strong>
          <span>{{ event.coHosts.join(', ') }}</span>
        </div>
        <div class="detail-row">
          <strong>Format:</strong>
          <div class="event-format">
            <span
              *ngIf="event.isRemote && event.location && !isOnlineOnly(event)"
              class="format-badge hybrid-badge"
              >🔀 Hybrid — In-Person & Remote</span
            >
            <span
              *ngIf="event.isRemote && isOnlineOnly(event)"
              class="format-badge remote-only-badge"
              >🖥️ Remote Only</span
            >
            <span *ngIf="!event.isRemote" class="format-badge in-person-badge">📍 In-Person</span>
          </div>
        </div>
        <div class="detail-row">
          <strong>Location:</strong>
          <div class="location-info">
            <span *ngIf="!isOnlineOnly(event)">{{ event.location }}</span>
            <span *ngIf="isOnlineOnly(event)" class="online-location">Online</span>
            <span
              *ngIf="userLocation && !event.isRemote && getEventDistance"
              class="distance-badge"
            >
              {{ getEventDistance(event) }} {{ distanceUnit }} away
            </span>
            <span
              *ngIf="userLocation && event.isRemote && !isOnlineOnly(event) && getEventDistance"
              class="distance-badge"
            >
              {{ getEventDistance(event) }} {{ distanceUnit }} away (in-person)
            </span>
          </div>
        </div>
        <div *ngIf="event.remoteLink" class="detail-row">
          <strong>Remote Access:</strong>
          <div class="location-info">
            <a [href]="event.remoteLink" target="_blank" class="remote-link">🔗 Join Remotely</a>
          </div>
        </div>
        <div class="detail-row">
          <strong>Details:</strong>
          <p>{{ event.eventDetails }}</p>
        </div>
        <div *ngIf="event.sponsors.length > 0" class="detail-row">
          <strong>Sponsors:</strong>
          <span>{{ event.sponsors.join(', ') }}</span>
        </div>
      </div>
    </div>
  `,
})
export class EventCardComponent {
  @Input() event!: Event;
  @Input() userLocation: { lat: number; lng: number } | null = null;
  @Input() getEventDistance!: (event: Event) => string | null;
  @Input() isOnlineOnly!: (event: Event) => boolean;
  @Input() distanceUnit!: string;
}
