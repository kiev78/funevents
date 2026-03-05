import {
  Component,
  signal,
  computed,
  effect,
  OnInit,
  inject,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventService } from './services/event.service';
import { Event } from './models/event.model';
import { appConfig } from './config/app.config';
import { EventCardComponent } from './components/event-card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, EventCardComponent, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, AfterViewChecked {
  protected readonly title = signal('Healing Fun Schedule');
  protected events = signal<Event[]>([]);
  protected selectedTags = signal<Set<string>>(new Set());
  protected startDate = signal<string>('');
  protected endDate = signal<string>('');
  protected userLocation = signal<{ lat: number; lng: number } | null>(null);
  protected maxDistance = signal<number>(50);
  protected useMiles = signal<boolean>(appConfig.defaultDistanceUnit === 'miles');
  protected distanceInputShown = signal<boolean>(true);
  protected locationInputError = signal<string>('');
  protected locationInput = signal<string>('');
  protected locationSuggestions = signal<string[]>([]);
  protected showSuggestions = signal<boolean>(false);
  protected locationName = signal<string>('');
  protected includeRemoteEvents = signal<boolean>(true);
  protected isGettingLocation = signal<boolean>(false);
  protected drivingDistances = signal<{ [key: string]: number }>({});
  protected showMap = signal<boolean>(false);
  protected showSavedOnly = signal<boolean>(false);
  protected showAttendedOnly = signal<boolean>(false);
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private map: any = null;
  private mapMarkers: any[] = [];
  private mapNeedsInit = false;
  private eventService = inject(EventService);
  private autocompleteService: any = null;
  private geocoder: any = null;
  private searchDebounceTimer: any = null;
  protected filtersSidebarOpen = signal<boolean>(false);

  constructor() {
    // Reactively update map markers whenever filtered results change
    effect(() => {
      const events = this.filteredEvents;
      const mapOpen = this.showMap();
      if (mapOpen && this.map) {
        this.updateMapMarkers();
      }
    });
  }

  ngOnInit(): void {
    // Load Google Maps API dynamically
    this.loadGoogleMapsScript();

    // Default start date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.startDate.set(`${yyyy}-${mm}-${dd}`);

    this.eventService.getEvents().subscribe((events) => {
      this.events.set(events);
    });
  }

  private loadGoogleMapsScript(): void {
    if (typeof google !== 'undefined' && google.maps) {
      return; // Already loaded
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      return; // Script tag already exists
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${appConfig.googleMapsApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  get filteredEvents(): Event[] {
    let filtered = this.events();

    // Filter by saved events
    if (this.showSavedOnly()) {
      filtered = filtered.filter((event) => this.eventService.isEventSaved(event.id));
    }

    // Filter by attended events
    if (this.showAttendedOnly()) {
      filtered = filtered.filter((event) => this.eventService.isEventAttended(event.id));
    }

    // Filter by multiple selected tags
    const selectedTags = this.selectedTags();
    if (selectedTags.size > 0) {
      filtered = filtered.filter((event) =>
        Array.from(selectedTags).some((tag) => event.tags.includes(tag)),
      );
    }

    // Filter by date range
    if (this.startDate()) {
      filtered = filtered.filter((event) => event.date >= this.startDate());
    }
    if (this.endDate()) {
      filtered = filtered.filter((event) => event.date <= this.endDate());
    }

    // Filter by remote events checkbox
    if (!this.includeRemoteEvents()) {
      filtered = filtered.filter((event) => !event.isRemote);
    }

    // Filter by distance
    if (this.userLocation()) {
      const userLoc = this.userLocation()!;
      const maxDistKm = this.useMiles() ? this.maxDistance() * 1.60934 : this.maxDistance();
      filtered = filtered.filter((event) => {
        if (event.isRemote && this.includeRemoteEvents()) return true;
        if (!event.lat || !event.lng) return false;
        const distance = this.calculateDistance(userLoc.lat, userLoc.lng, event.lat, event.lng);
        return distance <= maxDistKm;
      });
    }

    return filtered;
  }

  get eventTags(): string[] {
    const tags = new Set<string>();
    this.events().forEach((event) => {
      event.tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  toggleTag(tag: string): void {
    const tags = new Set(this.selectedTags());
    if (tags.has(tag)) {
      tags.delete(tag);
    } else {
      tags.add(tag);
    }
    this.selectedTags.set(tags);
  }

  isTagSelected(tag: string): boolean {
    return this.selectedTags().has(tag);
  }

  clearTagFilters(): void {
    this.selectedTags.set(new Set());
  }

  clearDateFilters(): void {
    this.startDate.set('');
    this.endDate.set('');
  }

  toggleDistanceFilter(): void {
    this.distanceInputShown.set(!this.distanceInputShown());
    if (!this.distanceInputShown()) {
      this.userLocation.set(null);
      this.locationInputError.set('');
    }
  }

  private initGoogleMapsServices(): void {
    if (typeof google !== 'undefined' && google.maps) {
      this.autocompleteService = new google.maps.places.AutocompleteService();
      this.geocoder = new google.maps.Geocoder();
    }
  }

  onLocationInput(input: string): void {
    this.locationInput.set(input);
    if (input.length < 2) {
      this.showSuggestions.set(false);
      this.locationSuggestions.set([]);
      return;
    }

    // Initialize Google Maps services on first use
    if (!this.autocompleteService) {
      this.initGoogleMapsServices();
    }

    if (!this.autocompleteService) {
      this.locationInputError.set('Google Maps is still loading. Please try again.');
      return;
    }

    // Debounce API calls (300ms)
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.autocompleteService.getPlacePredictions(
        {
          input: input,
          types: ['(cities)'],
        },
        (predictions: any[], status: string) => {
          if (status === 'OK' && predictions) {
            const suggestions = predictions.map((p: any) => p.description);
            this.locationSuggestions.set(suggestions);
            this.showSuggestions.set(suggestions.length > 0);
          } else {
            this.locationSuggestions.set([]);
            this.showSuggestions.set(false);
          }
        },
      );
    }, 300);
  }

  selectLocationSuggestion(location: string): void {
    this.locationInput.set(location);
    this.showSuggestions.set(false);
    this.geocodeAddress(location);
  }

  private geocodeAddress(address: string): void {
    if (!this.geocoder) {
      this.initGoogleMapsServices();
    }

    if (!this.geocoder) {
      this.locationInputError.set('Google Maps is still loading. Please try again.');
      return;
    }

    this.geocoder.geocode({ address: address }, (results: any[], status: string) => {
      if (status === 'OK' && results && results.length > 0) {
        const loc = results[0].geometry.location;
        this.userLocation.set({ lat: loc.lat(), lng: loc.lng() });
        this.locationInputError.set('');
        // Set a friendly location name from the geocoder results
        const placeName = this.extractPlaceName(results);
        if (placeName) this.locationName.set(placeName);
        this.calculateDrivingDistances();
      } else {
        this.locationInputError.set('Could not find coordinates for this location.');
        this.userLocation.set(null);
        this.locationName.set('');
      }
    });
  }

  private reverseGeocode(lat: number, lng: number): void {
    if (!this.geocoder) {
      this.initGoogleMapsServices();
    }
    if (!this.geocoder) return;

    this.geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
      if (status === 'OK' && results && results.length > 0) {
        const placeName = this.extractPlaceName(results);
        if (placeName) {
          this.locationName.set(placeName);
        } else {
          this.locationName.set(results[0].formatted_address || '');
        }
      } else {
        this.locationName.set('');
      }
    });
  }

  // Extract a sensible place name (city, locality, or administrative area)
  private extractPlaceName(results: any[]): string {
    for (const r of results) {
      if (!r.address_components) continue;
      const comp = r.address_components;
      const locality = comp.find((c: any) => c.types.includes('locality'))?.long_name;
      if (locality) return locality;
      const postalTown = comp.find((c: any) => c.types.includes('postal_town'))?.long_name;
      if (postalTown) return postalTown;
      const admin = comp.find((c: any) =>
        c.types.includes('administrative_area_level_1'),
      )?.long_name;
      if (admin) return admin;
    }
    return '';
  }

  getUserLocation(): void {
    this.isGettingLocation.set(true);
    this.locationInputError.set('');

    if (!navigator.geolocation) {
      this.locationInputError.set('Geolocation is not supported by your browser.');
      this.isGettingLocation.set(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.userLocation.set({ lat, lng });
        this.locationInput.set('');
        this.showSuggestions.set(false);
        this.locationSuggestions.set([]);
        // Reverse-geocode to get nearest city/locality for display
        this.reverseGeocode(lat, lng);
        this.calculateDrivingDistances();
        this.isGettingLocation.set(false);
      },
      (error) => {
        this.locationInputError.set(
          'Unable to get your location. Please check your browser permissions.',
        );
        this.isGettingLocation.set(false);
      },
    );
  }

  calculateDrivingDistances(): void {
    if (
      !this.userLocation() ||
      !appConfig.googleMapsApiKey ||
      appConfig.googleMapsApiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE'
    ) {
      // Fall back to straight-line distance if no API key configured
      this.calculateStraightLineDistances();
      return;
    }

    const userLoc = this.userLocation()!;
    const inPersonEvents = this.filteredEvents.filter(
      (event) => event.lat && event.lng && !event.isRemote,
    );

    if (inPersonEvents.length === 0) {
      this.drivingDistances.set({});
      return;
    }

    // Call Google Maps Distance Matrix API
    this.getGoogleMapsDistances(userLoc, inPersonEvents);
  }

  private async getGoogleMapsDistances(
    userLoc: { lat: number; lng: number },
    events: Event[],
  ): Promise<void> {
    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps) {
      console.warn('Google Maps API not loaded, using straight-line distances');
      this.calculateStraightLineDistances();
      return;
    }

    const service = new google.maps.DistanceMatrixService();
    const origins = [new google.maps.LatLng(userLoc.lat, userLoc.lng)];
    const destinations = events.map((event) => new google.maps.LatLng(event.lat!, event.lng!));

    try {
      const response = await service.getDistanceMatrix({
        origins,
        destinations,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      });

      if (response.rows[0]) {
        const distances: { [key: string]: number } = {};

        response.rows[0].elements.forEach(
          (element: google.maps.DistanceMatrixResponseElement, index: number) => {
            if (element.status === google.maps.DistanceMatrixElementStatus.OK && element.distance) {
              // Convert meters to kilometers
              distances[events[index].id] = element.distance.value / 1000;
            } else {
              // Fallback to straight-line distance if element fails
              distances[events[index].id] = this.calculateDistance(
                userLoc.lat,
                userLoc.lng,
                events[index].lat!,
                events[index].lng!,
              );
            }
          },
        );

        this.drivingDistances.set(distances);
      } else {
        console.warn('Google Maps API warning: No results');
        this.calculateStraightLineDistances();
      }
    } catch (error) {
      console.error('Error calling Google Maps API:', error);
      this.calculateStraightLineDistances();
    }
  }

  private calculateStraightLineDistances(): void {
    if (!this.userLocation()) return;

    const userLoc = this.userLocation()!;
    const distances: { [key: string]: number } = {};

    this.filteredEvents
      .filter((event) => event.lat && event.lng && !event.isRemote)
      .forEach((event) => {
        distances[event.id] = this.calculateDistance(
          userLoc.lat,
          userLoc.lng,
          event.lat!,
          event.lng!,
        );
      });

    this.drivingDistances.set(distances);
  }

  toggleRemoteEvents(): void {
    this.includeRemoteEvents.set(!this.includeRemoteEvents());
  }

  toggleSavedFilter(): void {
    this.showSavedOnly.set(!this.showSavedOnly());
  }

  handleSaveToggle(eventId: string): void {
    this.eventService.toggleEventSaved(eventId);
  }

  handleRatingChange(data: { eventId: string; rating: number }): void {
    this.eventService.setEventRating(data.eventId, data.rating);
  }

  isEventSaved(eventId: string): boolean {
    return this.eventService.isEventSaved(eventId);
  }

  toggleAttendedFilter(): void {
    this.showAttendedOnly.set(!this.showAttendedOnly());
  }

  handleAttendedToggle(eventId: string): void {
    this.eventService.toggleEventAttended(eventId);
  }

  isEventAttended(eventId: string): boolean {
    return this.eventService.isEventAttended(eventId);
  }

  clearDistanceFilter(): void {
    this.userLocation.set(null);
    this.distanceInputShown.set(false);
    this.locationInputError.set('');
    this.locationName.set('');
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  get distanceUnit(): string {
    return this.useMiles() ? 'mi' : 'km';
  }

  toggleDistanceUnit(): void {
    this.useMiles.set(!this.useMiles());
  }

  // Format numbers with grouping separators (commas) and one decimal when needed
  protected formatNumber(value: number): string {
    const hasFraction = Math.abs(value % 1) > 1e-9;
    const options: Intl.NumberFormatOptions = {
      minimumFractionDigits: hasFraction ? 1 : 0,
      maximumFractionDigits: hasFraction ? 1 : 0,
      useGrouping: true,
    };
    return Number(value).toLocaleString(undefined, options);
  }

  getEventDistance(event: Event): string {
    if (!this.userLocation() || !event.lat || !event.lng) {
      return '';
    }
    const userLoc = this.userLocation()!;
    const distanceKm = this.calculateDistance(userLoc.lat, userLoc.lng, event.lat, event.lng);
    const distance = this.useMiles() ? distanceKm / 1.60934 : distanceKm;
    return this.formatNumber(Number(distance.toFixed(1)));
  }

  isOnlineOnly(event: Event): boolean {
    return event.isRemote && (!event.location || event.location.toLowerCase().includes('online'));
  }

  toggleMap(): void {
    this.showMap.set(!this.showMap());
    if (this.showMap()) {
      this.mapNeedsInit = true;
    } else {
      this.map = null;
      this.mapMarkers = [];
    }
  }

  ngAfterViewChecked(): void {
    if (this.mapNeedsInit && this.showMap() && this.mapContainer) {
      this.mapNeedsInit = false;
      this.initMap();
    }
  }

  private initMap(): void {
    if (typeof google === 'undefined' || !google.maps) {
      console.warn('Google Maps JS API not loaded yet.');
      return;
    }

    const center = this.userLocation() || { lat: 39.8283, lng: -98.5795 }; // Default: center of US

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: center,
      zoom: this.userLocation() ? 8 : 4,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    this.updateMapMarkers();
  }

  updateMapMarkers(): void {
    if (!this.map) return;

    // Clear existing markers
    this.mapMarkers.forEach((m) => m.setMap(null));
    this.mapMarkers = [];

    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    // Add user location marker
    if (this.userLocation()) {
      const userMarker = new google.maps.Marker({
        position: this.userLocation()!,
        map: this.map,
        title: 'Your Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });
      this.mapMarkers.push(userMarker);
      bounds.extend(this.userLocation()!);
      hasMarkers = true;
    }

    // Add event markers
    for (const event of this.filteredEvents) {
      if (!event.lat || !event.lng || this.isOnlineOnly(event)) continue;

      const position = { lat: event.lat, lng: event.lng };
      const marker = new google.maps.Marker({
        position,
        map: this.map,
        title: event.title,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: event.isRemote ? '#7b1fa2' : '#2e7d32',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      const distText = this.getEventDistance(event);
      const infoContent = `
        <div style="max-width:220px;font-family:sans-serif">
          <strong style="font-size:14px">${event.title}</strong><br>
          <span style="color:#666;font-size:12px">${event.date} at ${event.time}</span><br>
          <span style="font-size:12px">${event.location}</span>
          ${distText ? '<br><span style="color:#1976d2;font-size:12px">' + distText + ' ' + this.distanceUnit + ' away</span>' : ''}
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({ content: infoContent });
      marker.addListener('click', () => infoWindow.open(this.map, marker));

      this.mapMarkers.push(marker);
      bounds.extend(position);
      hasMarkers = true;
    }

    if (hasMarkers) {
      this.map.fitBounds(bounds);
      // Don't zoom too far in
      google.maps.event.addListenerOnce(this.map, 'bounds_changed', () => {
        if (this.map.getZoom() > 14) this.map.setZoom(14);
      });
    }
  }
}
