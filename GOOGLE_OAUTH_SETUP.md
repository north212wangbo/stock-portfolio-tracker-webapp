# Google OAuth Setup Guide - Backend Integration

This app integrates with your backend API for Google OAuth authentication.

## How It Works

1. User clicks "Continue with Google"
2. Google OAuth returns an `idToken`
3. Frontend sends the `idToken` to your backend API
4. Backend validates the token and returns user data + JWT token
5. Frontend stores both user data and auth token for future API calls

## Current Configuration

The app needs to be configured with:
- **Google Client ID**: Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in your environment
- **Backend API**: Set `NEXT_PUBLIC_API_BASE_URL` in your environment

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id-here"
NEXT_PUBLIC_API_BASE_URL="http://localhost:8080"  # or your production API URL
NEXT_PUBLIC_STOCK_API_KEY="your-stock-api-key-here"
```

## API Integration Details

### Authentication Flow
1. **POST** `/api/auth/google`
   - Body: `{ "idToken": "google_id_token_here" }`
   - Returns: User data + JWT token

### Expected Backend Response
```json
{
  "user": {
    "id": "user_id",
    "email": "user@example.com", 
    "name": "User Name",
    "avatar": "profile_picture_url"
  },
  "token": "jwt_token_here"
}
```

## Making Authenticated Requests

Use the utility functions in `src/lib/auth-utils.ts`:

```typescript
import { makeAuthenticatedRequest } from '@/lib/auth-utils';

// Make an authenticated API call
const response = await makeAuthenticatedRequest('/api/protected-endpoint');
```

## Testing

1. Run `npm run dev`
2. Click the user profile icon → "Sign In" → "Continue with Google"  
3. The app will authenticate with Google and call your backend API
4. User data and JWT token will be stored locally
5. All future API calls will include the Authorization header

## Security Notes

- JWT tokens are stored in localStorage and automatically included in API requests
- Google sign-out also clears local authentication data
- The backend handles all token validation and user management