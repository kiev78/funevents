/**
 * Application Configuration
 * API keys are stored in secrets.local.ts (gitignored)
 * Copy secrets.example.ts to secrets.local.ts and add your keys
 */

import { secrets } from './secrets.local';

export const appConfig = {
  googleMapsApiKey: secrets.googleMapsApiKey,
  // Default distance unit: 'miles' or 'km'
  defaultDistanceUnit: 'miles' as 'miles' | 'km',
};
