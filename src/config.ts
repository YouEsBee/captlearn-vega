// The backend's address as seen from the TV, written in at build time from BACKEND_URL in the
// environment, a .env file at the project root, or the shared default in backendUrl.js (see README). "localhost" won't work on a
// device. Empty when the build had none: the app then says so instead of loading.
export const BACKEND_URL: string = process.env.BACKEND_URL ?? '';
