import { handleRequest } from '../server/resume-picker.mjs';

// Vercel's Node runtime accepts the standard Request -> Response fetch export.
export default { fetch: handleRequest };
