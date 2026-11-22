// Vercel serverless entry point. Vercel calls the exported Express app for every request.
// No listen(), no Socket.IO and no schema sync here: serverless functions are short-lived.
import app from "../app.js";

export default app;
