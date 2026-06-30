/**
 * API Configuration
 * -----------------
 * LOCAL:   API_BASE = '' (empty → uses relative URLs, same server)
 * LIVE:    API_BASE = your Render backend URL
 *
 * ⚠️ After deploying to Render, replace the URL below with your actual Render URL.
 *    e.g. 'https://sat-backend.onrender.com'
 */
window.API_BASE = (function () {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return ''; // development: same server
    }
    // ← REPLACE THIS after your Render backend is live
    return 'https://YOUR-RENDER-APP-NAME.onrender.com';
})();
