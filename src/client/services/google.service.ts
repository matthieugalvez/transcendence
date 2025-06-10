import { ApiClient } from "../utils/apiclient.utils";


export class GoogleService {
    static signin(): void {
        try {
            ApiClient.authenticatedFetch('/api/auth/google')
        } catch (error) {
            console.error('Error initiating Google signin:', error);
        }
    }
}