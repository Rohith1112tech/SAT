/**
 * API Configuration
 * -----------------
 * LOCAL:   API_BASE = '' (relative URLs → same server)
 * LIVE:    API_BASE = Render backend URL
 */
window.API_BASE = (function () {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
        return ''; // development: uses local server
    }
    return 'https://sat-backend-qd49.onrender.com'; // Render backend
})();

