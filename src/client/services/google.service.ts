import { ApiClient } from "../utils/apiclient.utils";

export class GoogleService {
    static signin(): void {
        try {
            // Redirect to the backend OAuth2 start path (port 3000)
            window.location.href = 'http://localhost:3000/api/auth/oauth2/google';
        } catch (error) {
            console.error('Error initiating Google signin:', error);
        }
    }
}