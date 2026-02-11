// --- FLIGHTBRIEF SERVICE WORKER ---
// UPDATE THIS VERSION to force all users to get the new script.js
const CACHE_NAME = 'flightbrief-suite-v18'; 

const ASSETS_TO_CACHE = [
    // 1. ROOT APP
    './',
    './index.html',
    './script.js',
    './aircraft_db.js',
    './manifest.json',
    './app-icon.png',

    // 2. FDP APP
    './fdp/',
    './fdp/index.html',
    './fdp/styles.css',
    './fdp/script.js',
    './fdp/app-icon.png',

    // 3. DELAY CODES APP
    './delays/',
    './delays/index.html',
    './delays/app.js',
    './delays/data.js',
    './delays/app-icon.png',

    // 4. LIBRARIES
    './libs/pdf.min.js',
    './libs/pdf.worker.min.js',
    './libs/html2canvas.min.js',
    './libs/jspdf.umd.min.js',
    './libs/fuse.min.js',
    './libs/tailwindcss.js'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force this new SW to become active immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Caching App Suite...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
    event.waitUntil(
        caches.keys().then((keys) => {
            // Delete old caches (v14, v15, etc.)
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

// --- UPDATED FETCH LISTENER ---
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // 1. EXCEPTION: Do NOT cache Weather APIs or Proxies
    // We want these to go straight to the internet every single time.
    if (url.includes('aviationweather') || 
        url.includes('checkwx') || 
        url.includes('corsproxy') || 
        url.includes('noaa')) {
        return; // By returning nothing, we force a direct network call
    }

    // 2. STANDARD CACHING for everything else (HTML, CSS, JS, Images)
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached file if found, otherwise fetch from network
            return response || fetch(event.request);
        })
    );
});