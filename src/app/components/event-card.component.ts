import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event } from '../models/event.model';

@Component({
  selector: 'event-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="event-card">
      <div class="event-header">
        <div class="header-top-row">
          <h2>{{ event.title }}</h2>
          <div class="action-buttons">
            <button
              class="attended-btn"
              (click)="onAttendedToggle()"
              [class.attended]="isAttended"
              [title]="isAttended ? 'Mark as not attended' : 'Mark as attended'"
            >
              {{ isAttended ? '✓' : '○' }}
            </button>
            <button
              class="save-btn"
              (click)="onSaveToggle()"
              [class.saved]="isSaved"
              [title]="isSaved ? 'Remove from saved events' : 'Save this event'"
            >
              {{ isSaved ? '❤️' : '🤍' }}
            </button>
          </div>
        </div>
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
        <div class="detail-row rating-row">
          <strong>Your Rating:</strong>
          <div class="star-rating">
            <span
              *ngFor="let star of [1, 2, 3, 4, 5]"
              class="star"
              [class.filled]="star <= (event.rating || 0)"
              [class.empty]="star > (event.rating || 0)"
              (click)="onRatingChange(star)"
              [title]="star + ' star' + (star > 1 ? 's' : '')"
            >
              {{ star <= (event.rating || 0) ? '⭐' : '☆' }}
            </span>
            <span *ngIf="event.rating" class="rating-text"> {{ event.rating }} / 5 </span>
            <button
              *ngIf="event.rating"
              class="clear-rating"
              (click)="onRatingChange(0)"
              title="Clear rating"
            >
              ✕
            </button>
          </div>
        </div>
        <div *ngIf="event.ticketUrl || event.eventDetailUrl" class="detail-row event-actions">
          <a *ngIf="event.ticketUrl" [href]="event.ticketUrl" target="_blank" class="ticket-btn">
            🎟️ Get Tickets
          </a>
          <a
            *ngIf="event.eventDetailUrl"
            [href]="event.eventDetailUrl"
            target="_blank"
            class="details-btn"
          >
            📋 Event Details
          </a>
          <a
            [href]="getGoogleCalendarUrl()"
            target="_blank"
            class="calendar-btn"
            title="Add to Google Calendar"
          >
            📅 Add to Calendar
          </a>
        </div>
        <div *ngIf="event.instagramUrl || event.facebookUrl" class="detail-row social-links">
          <strong>Follow:</strong>
          <div class="social-buttons">
            <a
              *ngIf="event.instagramUrl"
              [href]="event.instagramUrl"
              target="_blank"
              class="social-btn ig-btn"
              title="Instagram"
            >
              📷 Instagram
            </a>
            <a
              *ngIf="event.facebookUrl"
              [href]="event.facebookUrl"
              target="_blank"
              class="social-btn fb-btn"
              title="Facebook"
            >
              👍 Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .event-card {
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 16px;
        transition: all 0.3s ease;
        background: white;
      }

      .event-card:hover {
        border-color: #673ab7;
        box-shadow: 0 4px 12px rgba(103, 58, 183, 0.15);
        transform: translateY(-2px);
      }

      .event-header {
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 12px;
        margin-bottom: 12px;
      }

      .header-top-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        margin-bottom: 8px;
      }

      .event-header h2 {
        margin: 0;
        color: #333;
        font-size: 1.4em;
        font-weight: 600;
        flex: 1;
      }

      .action-buttons {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }

      .save-btn,
      .attended-btn {
        background: transparent;
        border: 2px solid #e0e0e0;
        border-radius: 50%;
        width: 44px;
        height: 44px;
        font-size: 1.4em;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .save-btn:hover {
        transform: scale(1.1);
        border-color: #ff4081;
      }

      .save-btn.saved {
        border-color: #ff4081;
        background: #fff0f5;
        animation: pulse 0.3s ease;
      }

      .attended-btn {
        font-size: 1.6em;
        font-weight: bold;
        color: #666;
      }

      .attended-btn:hover {
        transform: scale(1.1);
        border-color: #4caf50;
      }

      .attended-btn.attended {
        border-color: #4caf50;
        background: #f1f8f4;
        color: #4caf50;
        animation: pulse 0.3s ease;
      }

      @keyframes pulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.2);
        }
      }

      .event-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .event-tag {
        background: #673ab7;
        color: white;
        padding: 4px 10px;
        border-radius: 12px;
        font-size: 0.85em;
      }

      .event-details {
        color: #555;
      }

      .detail-row {
        margin: 8px 0;
        line-height: 1.6;
      }

      .detail-row strong {
        color: #673ab7;
        margin-right: 6px;
      }

      .format-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 0.85em;
        font-weight: 500;
        margin-right: 8px;
      }

      .in-person-badge {
        background: #4caf50;
        color: white;
      }

      .remote-only-badge {
        background: #2196f3;
        color: white;
      }

      .hybrid-badge {
        background: #ff9800;
        color: white;
      }

      .distance-badge {
        font-size: 0.85em;
        color: #666;
        margin-left: 8px;
      }

      .remote-link {
        color: #673ab7;
        text-decoration: none;
        font-weight: 500;
      }

      .remote-link:hover {
        text-decoration: underline;
      }

      .event-actions {
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid #e0e0e0;
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }

      .ticket-btn,
      .details-btn {
        display: inline-block;
        padding: 10px 20px;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.2s ease;
        font-size: 0.95em;
      }

      .ticket-btn {
        background: #673ab7;
        color: white;
      }

      .ticket-btn:hover {
        background: #512da8;
        transform: scale(1.05);
      }

      .details-btn {
        background: #e0e0e0;
        color: #333;
      }

      .details-btn:hover {
        background: #bdbdbd;
        transform: scale(1.05);
      }

      .social-links {
        margin-top: 12px;
      }

      .social-buttons {
        display: flex;
        gap: 10px;
        margin-top: 8px;
        flex-wrap: wrap;
      }

      .social-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9em;
        transition: all 0.2s ease;
        color: white;
      }

      .ig-btn {
        background: linear-gradient(
          45deg,
          #f09433 0%,
          #e6683c 25%,
          #dc2743 50%,
          #cc2366 75%,
          #bc1888 100%
        );
      }

      .ig-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(188, 24, 136, 0.3);
      }

      .fb-btn {
        background: #1877f2;
      }

      .fb-btn:hover {
        background: #166fe5;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(24, 119, 242, 0.3);
      }

      .rating-row {
        padding: 12px 0;
        border-top: 1px solid #e0e0e0;
        border-bottom: 1px solid #e0e0e0;
        background: #f9f9f9;
        margin: 12px -16px;
        padding-left: 16px;
        padding-right: 16px;
      }

      .star-rating {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 4px;
      }

      .star {
        font-size: 1.5em;
        cursor: pointer;
        transition: all 0.2s ease;
        user-select: none;
      }

      .star:hover {
        transform: scale(1.2);
      }

      .star.filled {
        color: #ffa000;
      }

      .star.empty {
        color: #ddd;
      }

      .rating-text {
        font-size: 0.9em;
        color: #666;
        margin-left: 8px;
        font-weight: 500;
      }

      .clear-rating {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        font-size: 1.2em;
        padding: 0 8px;
        margin-left: 4px;
        transition: color 0.2s ease;
      }

      .clear-rating:hover {
        color: #f44336;
      }

      .calendar-btn {
        display: inline-block;
        padding: 10px 20px;
        border-radius: 4px;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.2s ease;
        font-size: 0.95em;
        background: #34a853;
        color: white;
      }

      .calendar-btn:hover {
        background: #2d8e47;
        transform: scale(1.05);
      }
    `,
  ],
})
export class EventCardComponent {
  @Input() event!: Event;
  @Input() userLocation: { lat: number; lng: number } | null = null;
  @Input() getEventDistance!: (event: Event) => string | null;
  @Input() isOnlineOnly!: (event: Event) => boolean;
  @Input() distanceUnit!: string;
  @Input() isSaved: boolean = false;
  @Input() isAttended: boolean = false;
  @Output() saveToggle = new EventEmitter<string>();
  @Output() attendedToggle = new EventEmitter<string>();
  @Output() ratingChange = new EventEmitter<{ eventId: string; rating: number }>();

  onSaveToggle(): void {
    this.saveToggle.emit(this.event.id);
  }

  onAttendedToggle(): void {
    this.attendedToggle.emit(this.event.id);
  }

  onRatingChange(rating: number): void {
    this.ratingChange.emit({ eventId: this.event.id, rating });
  }

  getGoogleCalendarUrl(): string {
    // Parse event date and time
    const dateTimeStr = `${this.event.date}T${this.event.time}:00`;
    const eventDate = new Date(dateTimeStr);

    // Assume 2-hour duration if not specified
    const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);

    // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
    const formatGoogleDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDateTime = formatGoogleDate(eventDate);
    const endDateTime = formatGoogleDate(endDate);

    // Build the URL
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: this.event.title,
      dates: `${startDateTime}/${endDateTime}`,
      details:
        this.event.eventDetails +
        (this.event.ticketUrl ? `\n\nTickets: ${this.event.ticketUrl}` : ''),
      location:
        this.event.isRemote && this.isOnlineOnly(this.event) ? 'Online' : this.event.location,
    });

    return `https://www.google.com/calendar/render?${params.toString()}`;
  }
}
