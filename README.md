# Healing Fun Schedule - Event Tracker

Keep track of events you'd like to attend with this Angular-based event management application.

## Features

- **Advanced Filtering**:
  - Multi-select event categories/tags
  - Date range filtering (start and end date)
  - Distance-based filtering with browser geolocation
  - Remote events toggle
  - Location autocomplete with 10+ major US cities

- **Event Database**: Browse a curated collection of healing, wellness, and community events

- **Google Maps Integration** (optional):
  - Real driving distance calculations using Google Maps Distance Matrix API
  - Automatic fallback to straight-line distance if API unavailable
  - Set your own location or use browser geolocation
  - Configurable distance radius (5-500 km)

- **Comprehensive Event Details**:
  - Event title, description, and multiple tags
  - Host and co-hosts information
  - Date, time, and timezone
  - Location (in-person or remote)
  - Remote links for virtual events
  - Distance to event (when using distance filter)
  - Sponsors and organizers
  - Event status tracking

## Event Categories Supported

- Seed Swap/Exchange
- Dance
- Healing
- Meditation Retreat
- And more!

## Project Structure

- src/app/models/event.model.ts - Event data model interface
- src/app/services/event.service.ts - Event management service
- src/app/data/events.json - Mock event data
- src/app/app.ts - Main app component
- src/app/app.html - Event list display template
- src/app/app.css - Application styles

## Getting Started

### Prerequisites

- Node.js and npm installed
- Angular CLI installed globally (
  pm install -g @angular/cli)

### Installation

`ash
npm install
`

### Development Server

To run the development server:

`ash
npm start
`

Or use Angular CLI directly:

`ash
ng serve
`

Navigate to `http://localhost:4200/` in your browser. The application will automatically reload when you modify source files.

### Google Maps Integration (Optional)

To enable real driving distance calculations:

1. Get a Google Maps API key from the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Distance Matrix API**
3. Add your key to `src/app/config/app.config.ts`:

```typescript
export const appConfig = {
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY_HERE',
};
```

See [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) for detailed instructions and troubleshooting.

### Building for Production

`ash
ng build
`

The build artifacts will be stored in the dist/ directory.

### Running Tests

`ash
npm test
`

## Event Data Format

Events are stored in public/data/events.json with the following structure:

`json
{
  "id": "unique-id",
  "title": "Event Title",
  "tag": "Category",
  "host": "Host Name",
  "coHosts": ["Co-host 1", "Co-host 2"],
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "timezone": "EST/PST/CST",
  "location": "Physical Location",
  "isRemote": false,
  "remoteLink": "https://zoom.link",
  "eventDetails": "Detailed event description",
  "sponsors": ["Sponsor 1", "Sponsor 2"],
  "status": "upcoming|attended|cancelled"
}
`

## Customization

To add new events, edit the public/data/events.json file and reload the application.

To modify styling, update src/app/app.css.

## Available Scripts

- pm start - Run development server
- pm run build - Build for production
- pm run watch - Watch mode for continuous compilation
- pm test - Run unit tests
- g generate component <name> - Create new component

## Technologies Used

- **Angular 20.3.0** - Frontend framework
- **TypeScript** - Programming language
- **Angular Routing** - Application routing
- **RxJS** - Reactive programming
- **JSON** - Data format for mock events

## Future Enhancements

- User authentication and accounts
- Event creation and editing
- Personal event favorites/wishlist
- Calendar integration
- Event notifications and reminders
- Social features (sharing, reviews, ratings)
- Advanced filtering and search
- Backend API integration

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please create an issue in the project repository.
