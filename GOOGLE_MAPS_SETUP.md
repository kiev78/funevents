# Google Maps API Configuration

## Getting Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing one)
3. Enable the **Distance Matrix API** and **Directions API**:
   - Search for "Distance Matrix API" and enable it
   - Search for "Directions API" and enable it
4. Create an API key:
   - Go to "Credentials" in the left menu
   - Click "Create Credentials" → "API Key"
   - Copy your API key

## Adding Your API Key

### Option 1: Direct Configuration (Development)

Edit `src/app/config/app.config.ts`:

```typescript
export const appConfig = {
  googleMapsApiKey: 'YOUR_ACTUAL_API_KEY_HERE',
  // Example:
  // googleMapsApiKey: 'AIzaSyDxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxX',
};
```

### Option 2: Environment Variables (Recommended for Production)

1. Create `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  googleMapsApiKey: 'YOUR_API_KEY_HERE',
};
```

2. Create `src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  googleMapsApiKey: 'YOUR_API_KEY_HERE',
};
```

3. Update `src/app/config/app.config.ts`:

```typescript
import { environment } from '../../environments/environment';

export const appConfig = {
  googleMapsApiKey: environment.googleMapsApiKey,
};
```

## CORS Considerations

### Frontend Direct Calls (Current Implementation)

**Issue**: Browser CORS policy may block direct API calls from the frontend.

**When it works**:

- If you enable "Unrestricted" CORS in Google Cloud Console
- For development/testing (not recommended for production)

**Solution 1: API Key Restrictions** (Recommended)

1. In Google Cloud Console → Credentials → Your API Key
2. Click "Restrict key"
3. Under "Application restrictions", select "HTTP referrers (web sites)"
4. Add your domain (e.g., `localhost:4200` for development)
5. Under "API restrictions", select the Distance Matrix API

### Backend Proxy (Recommended for Production)

Create a backend endpoint that calls Google Maps API:

```typescript
// Node.js/Express Example
app.get('/api/distance', async (req, res) => {
  const { origin, destinations } = req.query;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json`;

  const params = new URLSearchParams({
    origins: origin,
    destinations: destinations,
    key: process.env.GOOGLE_MAPS_API_KEY,
    units: 'metric',
  });

  fetch(`${url}?${params}`)
    .then((r) => r.json())
    .then((data) => res.json(data))
    .catch((err) => res.status(500).json({ error: err.message }));
});
```

Then update the app to call your backend instead of Google Maps directly.

## API Response

The app uses the **Distance Matrix API** which returns:

- Driving distance in meters (converted to km)
- Travel time (not currently used but available)
- Handles multiple destinations in a single request

## Fallback Behavior

If the API key is:

- Not provided
- Invalid
- Missing permissions
- Blocked by CORS

The app automatically falls back to **straight-line distance** calculations, so filtering still works but results will be approximate.

## Testing

1. Enter the API key in `src/app/config/app.config.ts`
2. Run `npm start`
3. Click "Use My Current Location" or enter a city
4. Check browser console for any API errors
5. Verify distances display correctly on event cards

## Troubleshooting

### "Invalid request" error

- Make sure API key is valid
- Verify Distance Matrix API is enabled

### CORS error

- Check Application restrictions on your API key
- Add your domain to the allowed HTTP referrers

### No distances showing

- Check if app falls back to console log for straight-line distances
- Verify your location is set (should see distance badges)

## Security Notes

⚠️ **Important**: Don't commit API keys to public repositories!

Use environment files that are git-ignored:

```bash
# Add to .gitignore
src/environments/environment.ts
src/environments/environment.prod.ts
src/app/config/app.config.ts
```
