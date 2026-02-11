// --- FLIGHTBRIEF SERVICE WORKER ---
// UPDATE THIS VERSION to force all users to get the new script.js
const CACHE_NAME = 'flightbrief-suite-v17'; 

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

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // --- CRITICAL FIX: DO NOT CACHE WEATHER ---
    // If the URL is for Weather (AviationWeather, NOAA, CheckWX), 
    // strictly go to NETWORK. Do not look in Cache.
    if (url.includes('aviationweather.gov') || 
        url.includes('checkwx.com') || 
        url.includes('noaa.gov') || 
        url.includes('corsproxy.io')) {
        return; // Default browser behavior (Network Only)
    }

    if (!url.startsWith('http')) return;
    
    // Standard Stale-While-Revalidate for App Files
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const networkFetch = fetch(event.request).then((networkResponse) => {
                if(networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }
                return networkResponse;
            }).catch(() => {
                // Offline fallback could go here
            });

            return cachedResponse || networkFetch;
        })
    );
});