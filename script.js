// Tell PDF.js where the worker is online
// NEW OFFLINE CODE
pdfjsLib.GlobalWorkerOptions.workerSrc = 'libs/pdf.worker.min.js';

// --- TAILWIND CONFIGURATION ---
tailwind.config = {
    darkMode: 'class', 
    theme: {
        extend: {
            colors: { slate: { 850: '#1e293b', 900: '#0f172a' } },
            screens: { 'xs': '480px' }
        }
    }
}

// --- CONFIGURATION ---
// PASTE YOUR GIST ID HERE (Safe to share)
const GLOBAL_GIST_ID = "7dd1541d3fa4a1212de87b7df74b71fd";

// --- CONFIGURATION ---
const CHECKWX_API_KEY = '78a2df4a09e1431aa1e8e09e1741b038'; // Get a free key at checkwx.com

// --- GLOBAL STATE ---
window.currentFlightInfo = { flightNo: "FLIGHT", dof: null, dest: null };

// --- THEME LOGIC ---
const THEME_KEY = 'flightBriefTheme';
const systemMedia = window.matchMedia('(prefers-color-scheme: dark)');

// 1. Helper to Apply Theme & Color
function applyTheme(isDark) {
    const html = document.documentElement;
    if (isDark) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    updateMetaColor(isDark);
}

// 2. Initialize Immediately
(function initTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    // Use saved preference if it exists, otherwise use System
    if (savedTheme) {
        applyTheme(savedTheme === 'dark');
    } else {
        applyTheme(systemMedia.matches);
    }
})();

// 3. LISTEN FOR SYSTEM CHANGES (Live Update)
// This detects when you toggle the iPad Control Center theme
systemMedia.addEventListener('change', (e) => {
    // If system changes, force the app to follow and clear manual overrides
    localStorage.removeItem(THEME_KEY);
    applyTheme(e.matches);
});

// 4. Manual Toggle Function (Called by your HTML button)
window.toggleTheme = function() {
    const html = document.documentElement;
    const willBeDark = !html.classList.contains('dark'); // Calculate new state
    
    applyTheme(willBeDark);
    localStorage.setItem(THEME_KEY, willBeDark ? 'dark' : 'light');
}

// Helper to change the browser status bar color on mobile
function updateMetaColor(isDark) {
    const color = isDark ? '#0f172a' : '#f1f5f9';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color);
}


// ==========================================
// 1. HELPER FUNCTIONS
// ==========================================

window.refreshWeatherData = function() {
    if (window.currentSectors && window.currentSectors.length > 0) {
        // This will trigger the existing placeholder animation and re-fetch
        fetchAndRenderWeather(window.currentSectors);
    }
}

// --- NAVIGATION HELPER ---
function scrollToSector(id) {
    const element = document.getElementById(`card-${id}`);
    if (element) {
        // Smooth scroll to the card
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Visual Cue: Flash the border blue briefly
        element.classList.add('ring-4', 'ring-blue-500', 'transition-all', 'duration-500');
        setTimeout(() => {
            element.classList.remove('ring-4', 'ring-blue-500');
        }, 1500);
    }
}

// Add this helper function to script.js
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-dropdown');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Close the menu if clicking outside of it
document.addEventListener('click', function(event) {
    const menu = document.getElementById('mobile-dropdown');
    const btn = document.getElementById('mobile-menu-btn');
    
    // If menu is open AND click is NOT on the menu AND click is NOT on the button
    if (menu && !menu.classList.contains('hidden') && !menu.contains(event.target) && !btn.contains(event.target)) {
        menu.classList.add('hidden');
    }
});

function toggleReadMe() {
    const modal = document.getElementById('readme-modal');
    modal.classList.toggle('hidden');
}

function calculateTimeSum(base, adds, offset) { 
    if(!base || base.includes("-")) return "---"; 
    let min = base.split(':').reduce((acc,v)=>acc*60+Number(v),0); 
    for(let a of adds) if(a && !a.includes("-")) min += a.split(':').reduce((acc,v)=>acc*60+Number(v),0); 
    min += offset; 
    while(min<0) min+=1440; 
    while(min>=1440) min-=1440; 
    return `${Math.floor(min/60).toString().padStart(2,'0')}:${(min%60).toString().padStart(2,'0')}`; 
}

function calculateTransit(s1, s2) { 
    if (!s1 || !s2 || s1.sta === "--:--" || s2.std === "--:--") return null; 
    const [h1, m1] = s1.sta.split(':').map(Number); 
    const [h2, m2] = s2.std.split(':').map(Number); 
    let m1s = h1 * 60 + m1; 
    let m2s = h2 * 60 + m2; 
    if (m2s < m1s) m2s += 1440; 
    const d = m2s - m1s; 
    return (d < 0 || d > 1000) ? null : `${Math.floor(d/60).toString().padStart(2,'0')}:${(d%60).toString().padStart(2,'0')}`; 
}

function parseSectorHeader(text, s) { 
   const c = text.match(/(?:\||FPL-)\s*([A-Z]{2,3}\d{2,4}[A-Z]?)/); 
    if (c) s.flightNo = c[1];
    const r = text.match(/([A-Z]{3})\/([A-Z]{4})[\s-]+([A-Z]{3})\/([A-Z]{4})/); if (r) { s.dep = r[2]; s.dest = r[4]; } 
    else { const im = text.match(/([A-Z]{4})\s+RWY-\w+\s+.*?\s+([A-Z]{4})/); if (im) { s.dep = im[1]; s.dest = im[2]; } } 
    const am = text.match(/ALTN:\s*(?:[\w]{3,4}\/)?([A-Z]{4})/); if (am) s.alt = am[1]; 
    
    // Extract FMGS RTE & Cost Index
    const fmgs = text.match(/FMGS\s*RTE\/([A-Z0-9]+)/); 
    if (fmgs) s.fmgsRte = fmgs[1];

    const ci = text.match(/CRZ\/C[I1]?\s*(\d+)/);
    if (ci) s.costIndex = ci[1];
}

function parseRouteDetails(text, s) { 
    // CHANGE: Use [\s\S]*? instead of .*? to match across newlines
    const m = text.match(new RegExp(`${s.dep}\\s+RWY-(\\w+)\\s+([\\s\\S]*?)\\s+RWY-(\\w+)\\s+${s.dest}`)); 
    
    if (m) { 
        s.hasRoute = true; 
        s.depRwy = m[1]; 
        s.arrRwy = m[3]; 
        // Clean up newlines in the captured route string
        const p = m[2].replace(/\n/g, ' ').trim().split(/\s+/); 
        
        if(p.length>=1) { 
            s.sid = p[0]; 
            s.star = p.length>1 ? p[p.length-1] : ""; 
            s.waypoints = p.length>2 ? p.slice(1, p.length-1).join(' ') : ""; 
        } 
    } 
}

function parsePlanningDetails(text, s) { 
    const cl = text.replace(/\s+/g, ' '); 
    const ev = (k) => { const m = cl.match(new RegExp(k + "\\s*[:\\.]?\\s*(.*?)(?=($|TAKEOFF\\s+ALTN|FEA|EDTO\\s*\\/\\s*ETP\\s+ALTN|PSR|ALTN\\s+W\\/C|[A-Z]{4}\\s+[PM]\\d{3}))")); return m ? m[1].replace(/\|/g, '').trim() : null; }; 
    s.takeoffAltn = ev("TAKEOFF\\s+ALTN") || s.takeoffAltn; 
    s.fea = ev("FEA") || s.fea; 
    const e = ev("EDTO\\s*\\/\\s*ETP\\s+ALTN"); if (e) { s.edto = (e.includes("NON EDTO") || e.includes("NOT APPLICABLE")) ? "NON EDTO" : "EDTO"; s.edtoAltn = e; } 
    s.psr = ev("PSR") || s.psr; 
    const fm = cl.match(/FEA.*?WINDOW.*?(\d{2}[:.]\d{2}Z?\s+TO\s+\d{2}[:.]\d{2}Z?)/i); if (fm) s.feaWindow = fm[1]; 
	
    // Extract Wind Component (W/C)
    const wcMatch = text.match(/W\/C\s*[:]?\s*([PM]\d{3})/);
    if (wcMatch) s.windComp = wcMatch[1];

    // --- NEW: Extract TTL DIST ---
    const distMatch = text.match(/TTL\s*DIST\s*[:]?\s*(\d+)/);
    if (distMatch) s.ttlDist = distMatch[1];
}

function parseFeaData(text, s) {
    // 1. Try to find detailed FEA Block first (Airport + Window)
    const feaRe = /FEA\s+INFORMATION[\s\S]{0,500}?FEA\s+AIRPORT\s*:\s*([A-Z]{4})[\s\S]{0,100}?FEA\s+ETA\s+WINDOW\s*:\s*(\d{2}:\d{2}Z\s*TO\s*\d{2}:\d{2}Z)/;
    const feaMatch = text.match(feaRe);
    
    if (feaMatch) {
        s.feaDetailsAirport = feaMatch[1];
        s.feaWindow = feaMatch[2];
        s.fea = feaMatch[1]; // Also set main code
    } else {
        // 2. Fallback: Simple FEA line (e.g., "FEA : NOT APPLICABLE" or "FEA : WSSS")
        // FIXED REGEX: Now looks for "NOT APPLICABLE" explicitly OR a standard 3-4 letter code
        const simpleFea = text.match(/FEA\s*:\s*(NOT\s+APPLICABLE|[A-Z0-9]{3,4})/);
        
        if (simpleFea) {
            s.fea = simpleFea[1].trim();
        }
    }

    // 3. FUEL PADDING EXTRACTION (Kept from previous steps)
    const padMatch = text.match(/FUEL\s+PADDING\s+(\d{2}[:.]\d{2})\s+(\d+)/);
    if (padMatch) {
        s.paddingText = `${padMatch[1]} <span class="text-slate-500 text-[9px] ml-0.5">(${padMatch[2]})</span>`;
        s.rawPad = parseInt(padMatch[2]);
    }
}

function parseAlternateTime(text, s) { 
    if (s.alt === "???" || s.alt.includes("(")) return; 
    const m = text.match(new RegExp(`${s.alt}\\s+[PM]\\d{3}\\s+\\d{3,4}\\s+[FA]\\d{3}\\s+(\\d{2}\\.\\d{2})`)); 
    if (m) {
        s.altFlightTime = m[1]; 
        s.alt = `${s.alt}(${m[1]})`; 
    }
}

function parseFuelTable(text, s) { 
    const g = (r) => { const m=text.match(r); return m?parseInt(m[1]):0; }; 
    const z=text.match(/Z\s*F\s*W\s*T[\s\S]{0,60}?(\d{4,6})/); 
    if(z) s.zfw=(parseInt(z[1])/1000).toFixed(1); 
    
    const m=text.match(/MIN\.*\s*SECTOR\s*FUEL.*?(?:\d{2}[:.]\d{2})?\s*(\d{4,6})/); 
    if(m) { s.msf=m[1]; s.rawMsf=parseInt(m[1]); } 
    
    s.rawAb=g(/AB\s*(?:\d{2}[:.]\d{2})?\s*(\d{3,5})/)||g(/BURN\s*OFF\s*(\d{3,5})/); 
    s.abFuel=s.rawAb; 
    s.rawTaxi=g(/TAXI\s*(\d{2,4})/); 
    s.taxi=s.rawTaxi; 
    s.rawAdd=g(/ADDITIONAL\s*(?:\d{2}[:.]\d{2})?\s*(\d+)/); 
    s.rawPad=g(/FUEL\s+PADDING\s*(?:\d{2}[:.]\d{2})?\s*(\d+)/); 
    s.rawCont=g(/CONST\s+RES\s*(?:\d{2}[:.]\d{2}(?:\.\d{0,2})?)?\s*(\d+)/); 
    
    const b=text.match(/BLOCK\s*FUEL[\s\S]{0,60}?(\d{4,6})/); 
    if(b) s.bf=b[1]; 
    const a=text.match(/ARR\s*FUEL[\s\S]{0,40}?(\d{3,5})/); 
    if(a) s.arrFuel=a[1]; 
    const t=text.match(/TANKERING\s*[:]?\s*(YES|NO|NFP)/); 
    if(t) s.tankering=t[1]; 
    
    // Extract DIVN / MDF
    const divn = text.match(/DIVN[\s\S]{0,30}?(\d{4,5})/);
    if(divn) s.mdf = divn[1];
}

function parseLoadSheetData(text, s) { 
    const g = (r) => { const m = text.match(r); return m ? parseInt(m[1]) : 0; }; 
    const pm = text.match(/PAX\s*(\d{1,3})\s+(\d{3,6})\s+(\d{1,3})/); 
    if(pm) { s.paxPlan=parseInt(pm[1]); s.paxMax=parseInt(pm[3]); } 
    else { const sp = text.match(/PAX\s*(\d{1,3})\s*\/\s*(\d{1,3})/); if(sp) { s.paxPlan=parseInt(sp[1]); s.paxMax=parseInt(sp[2]); } } 
    s.cargoPlan = g(/CARGO\s*W\s*T[\s\S]{0,15}?(\d+)/); 
    const zm = text.match(/Z\s*F\s*W\s*T?[\s\S]{0,30}?(\d{4,6})[\s\S]{0,30}?(\d{4,6})/); 
    if(zm) { s.zfwPlan=parseInt(zm[1]); s.zfwMax=parseInt(zm[2]); } 
    const tm = text.match(/T\s*O\s*W\s*T?[\s\S]{0,30}?(\d{4,6})[\s\S]{0,30}?(\d{4,6})/); 
    if(tm) { s.towPlan=parseInt(tm[1]); s.towMax=parseInt(tm[2]); } 
    const lm = text.match(/LDG\s*W\s*T[\s\S]{0,30}?(\d{4,6})[\s\S]{0,30}?(\d{4,6})/); 
    if(lm) { let v1=parseInt(lm[1]), v2=parseInt(lm[2]); if(v1>v2 && v1===66000) { s.ldgPlan=v2; s.ldgMax=v1; } else { s.ldgPlan=v1; s.ldgMax=v2; } } 
}

function parseEdtoData(text, s) {
    if (!s.edtoPoints) s.edtoPoints = [];
    
    // 1. Parse EEP/EXP Points (Standard Logic)
    const ft = (t) => { const m = t.match(/(\d{2}[:\.]\d{2})/); return m ? m[1].replace('.',':') : null; };
    const fc = (t) => { const m = t.match(/([NS]\d{2}\s+\d{1,2}\.\d\s+[EW]\d{3}\s+\d{1,2}\.\d)/); return m ? m[1].trim() : null; };
    const addPt = (type, time, coord, sort) => { if (!s.edtoPoints.some(p => p.type === type)) s.edtoPoints.push({ type, time, coord: coord||"---", sort }); };
    
    ['E.ENT', 'E.EXT'].forEach(k => {
        const idx = text.indexOf(k);
        if (idx > -1) { const win = text.substring(Math.max(0, idx-50), idx+200); const t = ft(win); const c = fc(win); if(t) addPt(k==="E.ENT"?"EEP (E.ENT)":"EXP (E.EXT)", t, c, k==="E.ENT"?10:90); }
    });

    // 2. Parse ETP Points (Standard Logic)
    const etpRe = /ETP\s*:\s*(\d)\s*[A-Z]{4}\/([A-Z]{3})\s*-\s*[A-Z]{4}\/([A-Z]{3})[\s\S]{0,150}?LOC\s*([NS]\d{2}.*?[EW]\d{3}.*?)(?:\s+|-)\s*(?:DIST|TIME).*?TIME\s*(\d{2}:\d{2})/g;
    let m; while ((m = etpRe.exec(text)) !== null) {
        const [, n, a1, a2, rawC, time] = m;
        const coord = rawC.match(/([NS]\d{2}\s+\d{1,2}\.\d\s+[EW]\d{3}\s+\d{1,2}\.\d)/)?.[1] || rawC.trim();
        const lbl = `ETP ${n} (${a1}/${a2})`;
        const divM = text.match(new RegExp(`${n}\\s+(?:1ED|2ED|1E|2E).*?(\\d{2}[:\\.]\\d{2})\\s+\\d+`, "m"));
        
        const existing = s.edtoPoints.find(p => p.type === lbl);
        if(existing) { existing.time=time; existing.coord=coord; } else { s.edtoPoints.push({type:lbl, time, coord, sort:20+parseInt(n)}); }
        
        if(divM) { const dLbl = `ETP ${n} to EA`; if(!s.edtoPoints.some(p=>p.type===dLbl)) s.edtoPoints.push({type:dLbl, time:divM[1].replace('.',':'), coord:"", sort:20+parseInt(n)+0.1}); }
    }
    s.edtoPoints.sort((a,b) => a.sort - b.sort);

    // 3. Parse Critical ETP Scenario Line (Broad Match)
    let maxFuel = s.edtoCriticalFuel || 0; 
    const scenarioRegex = /^\s*((?:1|2)\s+(?:1ED|2ED|1E|2E).*)$/gm;
    let scMatch;
    while ((scMatch = scenarioRegex.exec(text)) !== null) {
        const fullLine = scMatch[1].trim();
        const numbers = fullLine.match(/[\d,]{3,7}/g);
        if (numbers) {
            const lineMax = Math.max(...numbers.map(n => parseInt(n.replace(/,/g, ''))));
            if (lineMax > maxFuel) {
                maxFuel = lineMax;
                s.edtoScenarioLine = fullLine; 
                s.edtoCriticalFuel = maxFuel;
            }
        }
    }

    // 4. Parse Details with COORDINATES (UPDATED)
    // Matches: TO VTSG... TDV P15... WC P08... MORA 05000... AT N08 12.1...
    const detailsRe = /TO\s+([A-Z]{4})\/DIST\s+(\d{3,4})[\s\S]{0,100}?TDV\s+([MP]?\d{1,4})[\s\S]{0,50}?WC\s+([MP]\d{2,4})[\s\S]{0,100}?MORA\s+(\d{3,5})[\s\S]{0,50}?AT\s+([NS]\d{2}.*?[EW]\d{3}.*?)(?:\r|\n|$)/g;
    
    let dm; 
    while ((dm = detailsRe.exec(text)) !== null) {
         const apt = dm[1];
         const dist = dm[2];
         const tdv = dm[3];
         const wc = dm[4];
         const mora = dm[5];
         const coord = dm[6].trim(); // New coordinate capture
         
         if(!s.edtoDetails.some(d => d.apt === apt && d.dist === dist)) {
             s.edtoDetails.push({ apt, dist, tdv, wc, mora, coord });
         }
    }
}

function calculateSectorTankering(s) { const ma = ['WMKC', 'WMKI', 'WMKN', 'WMKA', 'WMKD']; s.isMandatoryTankering = ma.includes(s.dest); s.calcEcoTanker = s.rawAb + s.rawTaxi + s.rawAdd + s.rawPad; s.calcManTanker = s.calcEcoTanker + s.rawCont; }
function parseTimes(text, s) { const std = text.match(/STD\s*(?:\||:)?\s*(\d{2}:\d{2})/); if (std) s.std = std[1]; const sta = text.match(/STA\s*(?:\||:)?\s*(\d{2}:\d{2})/); if (sta) s.sta = sta[1]; const blk = text.match(/BLK\s*(?:\||:)?\s*(\d{2}:\d{2})/); if (blk) s.blk = blk[1]; }
function parseEet(text, s) { const match = text.match(/EET\s*[:]?\s*(\d{2}[:.]\d{2})/); if (match) s.eet = match[1].replace('.', ':'); }
function parseOptiSpeeds(text, s) { const cl = text.replace(/\s+/g, ' '); const vr = cl.match(/IAS\s*(\d{3})\s*\/\s*FL\s*(\d{3})/i); if (vr) s.opti1 = `${vr[1]}/${vr[2]}`; const ias = cl.match(/IAS\s*(\d{3})\s*ON\s*FCU/i); const tr = cl.match(/FL\s*(\d{3})\s*[:\.]?\s*SPD\/MACH/i); if (ias && tr) s.opti2 = `${ias[1]}/${tr[1]}`; else if (ias) s.opti2 = ias[1]; const ma = cl.match(/SPD\/MACH\s*M(\d?\.?\d+)/i); if (ma) { let m = ma[1]; if (m.startsWith('0')) m = m.substring(1); s.opti3 = m; } }

// --- UPDATED: PARSE MAX FLIGHT LEVEL (Full Scan for Highest) ---
function parseMaxFlightLevel(text, s) {
    // Helper to safely update maxFL if a higher valid value is found
    const checkVal = (val) => {
        // Range check: valid cruise levels are usually between 100 and 500
        if (!isNaN(val) && val > s.maxFL && val >= 100 && val < 600) {
            s.maxFL = val;
        }
    };

    // 1. Scan for ATC FPL format (e.g. N0462F290, M078F330)
    // This catches initial levels AND step climbs (like /M078F330)
    const fplPattern = /[NKM]\d{3,4}F(\d{3})/gi;
    let m;
    while ((m = fplPattern.exec(text)) !== null) {
        checkVal(parseInt(m[1]));
    }

    // 2. Scan for Profile Headers (e.g. WMKK/FL290, URIGO/FL330)
    const headerPattern = /[A-Z0-9]{3,5}\/FL(\d{3})/gi;
    while ((m = headerPattern.exec(text)) !== null) {
        checkVal(parseInt(m[1]));
    }

    // 3. Scan Fuel Table Step Climbs (e.g., "2ND 330", "3RD 350")
    const stepPattern = /(?:2ND|3RD|4TH)\s+(?:\d{3}\s+)?(\d{3})/gi;
    while ((m = stepPattern.exec(text)) !== null) {
        checkVal(parseInt(m[1]));
    }
}

function parseAircraftInfo(text, s) { 
    const cl = text.replace(/\s+/g, ' '); 
    const reg = cl.match(/REG\/([A-Z0-9-]+)/); if (reg) s.reg = reg[1]; 
    if (s.reg === "---") { const sfx = cl.match(/A32[01]\/([A-Z0-9]+)[\s-]*KGS/); if (sfx) s.reg = (sfx[1].length === 3 ? "9M-" : "") + sfx[1]; } 
    if (s.reg.length === 5 && s.reg.startsWith('9M')) { s.reg = s.reg.substring(0, 2) + '-' + s.reg.substring(2); }
    const ifv = cl.match(/IF\/\s*(-?[\d\.]+)/); if (ifv) { let val = parseFloat(ifv[1]); s.ifVal = isNaN(val) ? ifv[1] : val.toFixed(1); }
    const pfv = cl.match(/PF\/\s*(-?[\d\.]+)/); if (pfv) { let val = parseFloat(pfv[1]); s.pfVal = isNaN(val) ? pfv[1] : val.toFixed(1); }
    const dof = cl.match(/DOF\/(\d{6})/); if (dof) s.dof = dof[1];
}

function parseDispatchRemarks(text, s) { 
    const start = text.match(/DISPATCH\s+REMARKS\s*[:]?/i); 
    if (start) { 
        const sub = text.substring(start.index + start[0].length); 
        const em = ["I HEREBY", "CAPTAIN NAME", "LIC NO", "+"]; 
        let ei = -1; 
        for (let m of em) { 
            const idx = sub.indexOf(m); 
            if (idx !== -1 && (ei === -1 || idx < ei)) ei = idx; 
        } 
        
        let cl = (ei !== -1 ? sub.substring(0, ei) : sub.substring(0, 1000))
            .trim()
            .replace(/^[\+\s]+|[\+\s]+$/g, '')
            .replace(/[ \t]+/g, ' '); 
            
        cl = cl.replace(/(\s\d{1,2}\.\s)/g, '\n$1');
        cl = cl.replace(/(\b[A-Z0-9\s-]{2,15}:\s)/g, '\n$1');

        const keywords = [
            "COMPANY FUEL", "FUEL PADDING", "TANKERING", 
            "MEL", "CDL", "NOTE", "RMK", "REMARK", 
            "PAYLOAD", "KINDLY", "PLEASE", "ENSURE", "REFER", "CHECK",
            "TAF", "METAR", "SIGMET", "AIP SUP", "NOTAM",
            "WARNING", "CAUTION", "ATTN", "ATTENTION", 
            "CTOT", "SLOT", "CALLSIGN", "CRITICAL", "OPERATIONAL"
        ];
        
        const keywordRegex = new RegExp(`(${keywords.join('|')})`, 'gi');
        cl = cl.replace(keywordRegex, '\n$1');
        cl = cl.replace(/(\b[A-Z]{4}\s+[A-Z]\d{4}\/\d{2})/g, '\n$1');
        cl = cl.replace(/(\b[A-Z]{4}\s+[A-Z\s]+INTL)/g, '\n$1');
        cl = cl.replace(/\n\s*\n/g, '\n').trim();
        
        if (cl.length > 0) s.remarks = cl; 
    } 
}

// --- PARSE CRUISE TEMP (Maintains fallback logic) ---
function parseCruiseTemperature(text, s) {
    // 1. Ensure we are on the Wind/Temp page
    if (!/WIND\s*&\s*TEMPERATURE\s*INFORMATION/i.test(text)) return;
    if (!s.maxFL) return;

    // 2. Scan the ENTIRE page text (Do not cut off at DESCENT WINDS)
    // This fixes short flights where data is only in the Descent section.
    const cruiseSection = text; 
    
    const flData = [];
    // Regex to match "F300/wind/wind M30" or "F300... P05"
    // Matches F followed by 3 digits, slash, data, space, then M or P and 2 digits
    const regex = /F(\d{3})\/\d{3}\/\d{3}\s+([MP]\d{2})/g;
    let m;
    while ((m = regex.exec(cruiseSection)) !== null) {
        flData.push({
            fl: parseInt(m[1]),
            temp: m[2]
        });
    }

    if (flData.length === 0) return;

    // Sort by Flight Level ascending (Low -> High)
    flData.sort((a, b) => a.fl - b.fl);

    // 3. Find Exact Match
    const exact = flData.find(d => d.fl === s.maxFL);
    
    if (exact) {
        s.cruiseTempDisplay = `FL${s.maxFL} ${exact.temp}`;
    } else {
        // 4. Fallback: Find the closest available level
        // (Useful if Plan is FL220 but chart starts at FL300)
        let closest = flData[0];
        let minDiff = Math.abs(s.maxFL - closest.fl);
        
        for (let i = 1; i < flData.length; i++) {
            const diff = Math.abs(s.maxFL - flData[i].fl);
            if (diff < minDiff) {
                minDiff = diff;
                closest = flData[i];
            }
        }
        
        // Format: FL220 (FL300 M31)
        s.cruiseTempDisplay = `FL${s.maxFL} (FL${closest.fl} ${closest.temp})`;
    }
}

// ==========================================
// 2. AIRCRAFT DB MANAGER
// ==========================================

function getMergedAircraftDB() {
    const baseDB = window.AIRCRAFT_DB || {};
    const customDBStr = localStorage.getItem('customAircraftDB');
    if (!customDBStr) return baseDB;
    try {
        const cloudDB = JSON.parse(customDBStr);
        const { _META, ...aircraftData } = cloudDB;
        return { ...baseDB, ...aircraftData };
    } catch (e) {
        console.error("Custom DB Corrupt", e);
        return baseDB;
    }
}

const dbFileInput = document.getElementById('db-file-input');
if (dbFileInput) {
    dbFileInput.addEventListener('change', async function(e) {
        if (e.target.files.length === 0) return;
        const file = e.target.files[0];
        dbFileInput.value = ''; 
        
        const oldBtnHtml = document.querySelector('button[title="Update Aircraft DB"]').innerHTML;
        document.querySelector('button[title="Update Aircraft DB"]').innerHTML = '⏳';

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map(item => item.str).join(" ") + " ";
            }

            const issueMatch = fullText.match(/Issue\s*No\.?[\s:]*([0-9]+-[0-9]+)/i);
            if (issueMatch) {
                localStorage.setItem('aircraftDBIssueNo', issueMatch[1]);
            }

            const regex = /(9M-[A-Z]{3}\*?)\s+([-A-Z0-9]+)\s+(EDTO|NON)\s+([AB-])\s+([0-9.]+[K])\s+(-?[0-9.]+)\s+([0-9.]+)\s+(\d{3,4})\s+.*?(\d{5})\s+.*?(\d{2}\.\d{2})\s+.*?(\d{5})\s+.*?(\d{2}\.\d{2})/g;
            
            let match;
            let count = 0;
            const newDB = {};
            while ((match = regex.exec(fullText)) !== null) {
                const reg = match[1].replace('*','').trim(); 
                newDB[reg] = {
                    var: match[2], edto: match[3], type: match[4], eng: match[5],
                    idle: parseFloat(match[6]).toFixed(1), perf: parseFloat(match[7]).toFixed(1),
                    wStd: parseInt(match[9]), iStd: parseFloat(match[10]),
                    wFull: parseInt(match[11]), iFull: parseFloat(match[12])
                };
                count++;
            }

            if (count > 0) {
                localStorage.setItem('customAircraftDB', JSON.stringify(newDB));
                alert(`✅ Database Updated Successfully!\nIssue No: ${issueMatch ? issueMatch[1] : 'Unknown'}\nLoaded ${count} aircraft.`);
                location.reload(); 
            } else {
                alert("❌ Could not find aircraft data.");
            }

        } catch (error) {
            alert("Error parsing database file: " + error.message);
        } finally {
            document.querySelector('button[title="Update Aircraft DB"]').innerHTML = oldBtnHtml;
        }
    });
}

// ==========================================
// 3. CORE APP LOGIC
// ==========================================

async function exportToPDF() {
    if (!window.jspdf) { alert("PDF Tools not ready. Refresh app."); return; }
    const { jsPDF } = window.jspdf;
    const container = document.getElementById('sectors-container');
    if (!container || container.children.length === 0) { alert("Load a flight plan first!"); return; }

    const btn = document.getElementById('btn-pdf-export');
    const oldIcon = btn.innerHTML;
    btn.innerHTML = '⏳';

    try {
        const isMobile = window.innerWidth < 1024; 
        const canvas = await html2canvas(container, {
            scale: isMobile ? 1.5 : 2, useCORS: true,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f1f5f9',
            windowWidth: 800, logging: false,
            onclone: (doc) => {
                doc.querySelectorAll('.route-badge').forEach(b => b.style.display = 'inline-flex');
                doc.querySelectorAll('.no-scrollbar').forEach(s => s.style.overflow = 'visible');
            }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const pdfWidth = 210; 
        const pageHeight = (canvas.height * pdfWidth) / canvas.width; 
        const pdf = new jsPDF('p', 'mm', [pdfWidth, pageHeight + 10]);
        pdf.addImage(imgData, 'JPEG', 0, 5, pdfWidth, pageHeight);

        const f = window.currentFlightInfo;
        const dateStr = f.dof ? "20" + f.dof : new Date().toISOString().slice(0,10).replace(/-/g,'');
        pdf.save(`${dateStr}_${f.flightNo.replace(/\s+/g,'')}_${f.dest||"DEST"}_Brief.pdf`);

    } catch (err) { alert("Export Failed: " + err.message); } 
    finally { btn.innerHTML = oldIcon; }
}

function saveToHistory(sectors) {
    if (!sectors || sectors.length === 0) return;
    const flightKey = `${sectors[0].flightNo} (${sectors[0].dep}-${sectors[sectors.length-1].dest})`;
    
    const historyItem = { 
        id: Date.now(), 
        title: flightKey, 
        date: new Date().toLocaleString(), 
        data: sectors,
        // --- NEW: SAVE NOTAMS ---
        companyNotams: window.currentCompanyNotams || null 
        // ------------------------
    };
    
    let history = JSON.parse(localStorage.getItem('flightHistory') || '[]');
    history.unshift(historyItem);
    if (history.length > 5) history.pop();
    localStorage.setItem('flightHistory', JSON.stringify(history));
}
function toggleHistory() {
    const modal = document.getElementById('history-modal');
    const list = document.getElementById('history-list');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        const history = JSON.parse(localStorage.getItem('flightHistory') || '[]');
        if (history.length === 0) { list.innerHTML = '<div class="text-center p-4 text-slate-500 text-sm">No recent flights.</div>'; return; }
        list.innerHTML = history.map(item => `<div onclick="loadFromHistory(${item.id})" class="p-3 mb-2 bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 rounded-lg cursor-pointer border border-transparent hover:border-blue-200"><div class="font-bold text-slate-800 dark:text-white text-sm">${item.title}</div><div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${item.date}</div></div>`).join('');
    }
}
function loadFromHistory(id) { 
    const h = JSON.parse(localStorage.getItem('flightHistory') || '[]'); 
    const i = h.find(x => x.id === id); 
    if (i) { 
        window.currentSectors = i.data;
        // --- NEW: RESTORE NOTAMS ---
        window.currentCompanyNotams = i.companyNotams || null; 
        // ---------------------------
        
        renderSectors(i.data); 
        
        // --- NEW: RENDER BUTTON ---
        renderCompanyNotamSection(); 
        // --------------------------
        
        toggleHistory(); 
        if (navigator.onLine) fetchAndRenderWeather(i.data); 
    } 
}
function clearHistory() { if(confirm('Clear history?')) { localStorage.removeItem('flightHistory'); toggleHistory(); } }

const fileInput = document.getElementById('file-input');
const sectorsContainer = document.getElementById('sectors-container');
const emptyState = document.getElementById('empty-state');

// --- IN script.js ---

// 1. Add this function anywhere in your global scope (e.g., near the other helper functions)
function viewOriginalOfp() {
    if (window.currentOfpBlobUrl) {
        window.open(window.currentOfpBlobUrl, '_blank');
    } else {
        alert("No OFP loaded currently.");
    }
}

// 2. Modify your existing file input listener to save the URL
if (fileInput) {
    fileInput.addEventListener('change', async function(e) {
        if (e.target.files.length === 0) return;
        const file = e.target.files[0]; 
        fileInput.value = '';

        // *** NEW LINE: Create a temporary URL for the uploaded file ***
        if (window.currentOfpBlobUrl) URL.revokeObjectURL(window.currentOfpBlobUrl); // Cleanup old file
        window.currentOfpBlobUrl = URL.createObjectURL(file);
        // **********************************************************
        
        emptyState.innerHTML = '<div class="animate-pulse text-center py-10"><div class="font-bold text-blue-600 mb-2">Processing Flight Plan...</div></div>';
        
        try {
            // ... rest of your existing parsing code ...
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const sectors = [];
			let fullOfpText = ""; 
            let currentSector = null;

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
const text = textContent.items.map(item => 
                    item.str + (item.hasEOL ? "\n" : " ")
                ).join("");
                
                fullOfpText += text + "\n";

                if (text.includes("COMPUTED AT") && text.includes("PLAN VALID UNTIL")) {
                    if (currentSector) { calculateSectorTankering(currentSector); if (!isDuplicate(sectors, currentSector)) sectors.push(currentSector); }
                    const tempSector = createSectorObject(sectors.length + 1);
                    parseSectorHeader(text, tempSector);
                    if (sectors.length > 0) {
                        const last = sectors[sectors.length - 1];
                        currentSector = (last.dep === tempSector.dep && last.dest === tempSector.dest) ? last : tempSector;
                    } else { currentSector = tempSector; }
                    parseSectorHeader(text, currentSector); 
                    parseFuelTable(text, currentSector); 
                    parseLoadSheetData(text, currentSector); 
                    parseAlternateTime(text, currentSector); 
                    parsePlanningDetails(text, currentSector);
                    parseRouteDetails(text, currentSector);
                    parseMaxFlightLevel(text, currentSector);
                }
                
                if (!currentSector) continue;
                
                // NEW: Parse Max Flight Level on EVERY page (so it sees the ATC FPL on Page 2 and any higher step climbs)
                parseMaxFlightLevel(text, currentSector);

                // NEW: Parse Cruise Temp from Wind Page
                parseCruiseTemperature(text, currentSector);

                if (text.includes("OPTICLIMB") || (text.includes("VERT REV") && text.includes("IAS"))) parseOptiSpeeds(text, currentSector);
                parseAircraftInfo(text, currentSector);
                if (text.includes("STD") || text.includes("STA") || text.includes("BLK")) { parseTimes(text, currentSector); if (currentSector.std !== "--:--") currentSector.isComplete = true; }
                if (text.includes("EET")) parseEet(text, currentSector);
                if (text.match(/DISPATCH\s+REMARKS/i)) parseDispatchRemarks(text, currentSector);
                parseEdtoData(text, currentSector);
                parseFeaData(text, currentSector);
            }
			window.fullOfpText = fullOfpText; 
			// --- ADD THIS EXTRACTION ---
            window.currentCompanyNotams = extractCompanyNotams(fullOfpText);
            // ---------------------------
            if (currentSector) { calculateSectorTankering(currentSector); if (!isDuplicate(sectors, currentSector)) sectors.push(currentSector); }
            
            const validSectors = sectors.filter(s => s.dep !== "???");
            if (validSectors.length > 0) { 
                validSectors.forEach((s, i) => s.id = i + 1); 
                window.currentFlightInfo.flightNo = validSectors[0].flightNo;
                window.currentFlightInfo.dof = validSectors[0].dof;
                window.currentFlightInfo.dest = validSectors[0].dest;
                
                window.currentSectors = validSectors; 
                
                saveToHistory(validSectors); 
                renderSectors(validSectors);
                
                // --- ADD THIS MISSING LINE ---
                renderCompanyNotamSection();
                // -----------------------------

                if (navigator.onLine) fetchAndRenderWeather(validSectors);
            }
            else { alert("Could not detect sectors."); location.reload(); }
        } catch (error) { console.error(error); alert("Error: " + error.message); location.reload(); }
    });
}
function createSectorObject(id) { 
    return { 
        id: id, flightNo: "AXM", fmgsRte: "---", costIndex: "---", maxFL: 0, 
        cruiseTempDisplay: "", windComp: "---", ttlDist: "---", mdf: "---",
        dep: "???", dest: "???", alt: "???", altFlightTime: null,
        std: "--:--", sta: "--:--", blk: "--:--", eet: "---",
        zfw: "---", abFuel: "---", taxi: "---", msf: "---", bf: "---", arrFuel: "---", 
        tankering: "NO", edto: "NON EDTO", edtoAltn: "---", fea: "---", feaWindow: "---", feaDetailsAirport: null,
        takeoffAltn: "NOT REQD", psr: "NOT APPLICABLE", 
		        // --- AMEND START ---
        paddingText: "---", // To store "00:10 417"
        // --- AMEND END ---
        opti1: "--", opti2: "--", opti3: "--", reg: "---", 
        ifVal: "---", pfVal: "---", remarks: "", 
        depRwy: "??", arrRwy: "??", sid: "---", star: "---", waypoints: "", hasRoute: false,
        edtoPoints: [], edtoDetails: [], edtoCriticalFuel: 0, 
        // --- AMEND START ---
        edtoScenarioLine: "---",
        // --- AMEND END ---
        rawAb: 0, rawTaxi: 0, rawAdd: 0, rawPad: 0, rawCont: 0, rawMsf: 0,
        paxPlan: 0, paxMax: 0, cargoPlan: 0,
        zfwPlan: 0, zfwMax: 0, towPlan: 0, towMax: 0, ldgPlan: 0, ldgMax: 0,
        dof: null 
    }; 
}

function isDuplicate(sectors, newSector) {
    // If there are no sectors yet, it can't be a duplicate
    if (sectors.length === 0) return false;
    
    // Get the last sector added to the list
    const last = sectors[sectors.length - 1];

    // 1. Check if Departure and Destination match
    const sameRoute = (last.dep === newSector.dep) && (last.dest === newSector.dest);

    // 2. Check if Scheduled Time of Departure (STD) matches
    // (This prevents deleting a valid second flight on the same route at a different time)
    const sameTime = (last.std === newSector.std);

    // 3. Check if Flight Number matches
    const sameFlight = (last.flightNo === newSector.flightNo);

    // A sector is only a "Duplicate" (parsing error) if EVERYTHING matches.
    return sameRoute && sameTime && sameFlight;
}

// ==========================================
// 4. WEATHER & UI
// ==========================================

function renderWeatherPlaceholder() {
    const container = document.getElementById('sectors-container');
    let weatherDiv = document.getElementById('weather-container');
    if (!weatherDiv) { 
        weatherDiv = document.createElement('div'); 
        weatherDiv.id = 'weather-container'; 
        weatherDiv.className = "mt-8 space-y-6 pb-10"; 
        container.appendChild(weatherDiv); 
    }
    weatherDiv.innerHTML = '<div class="flex justify-center items-center gap-2 p-4 text-slate-500 animate-pulse"><span class="text-sm font-bold">Fetching Real-Time Weather (METAR/TAF)...</span></div>';
}

function applyKeywords(text) { 
    if (!text) return text; 
    
    // 1. Highlight Hazards (TS, Heavy Rain, Squalls, Volcanic Ash, Hail, etc.) -> RED BACKGROUND
    text = text.replace(/(^|\s)([+-]?(?:TS|SQ|FC|VA|GR|GS)[A-Z]*|[+-]RA)(?=\s|$)/g, 
        '$1<span class="bg-red-600 text-white px-1.5 py-0.5 rounded font-black tracking-wide">$2</span>'); 
    
    // 2. Highlight Wind Shear -> RED BACKGROUND
    text = text.replace(/(^|\s)(WS\s+ALL\s+RWY|WS\s+RWY\d{2}[A-Z]?)(?=\s|$)/g, 
        '$1<span class="bg-red-600 text-white px-1.5 py-0.5 rounded font-black">$2</span>');

    // 3. Highlight TEMPO (Temporary) -> AMBER/ORANGE Text
    text = text.replace(/(^|\s)(TEMPO)(?=\s|$)/g, 
        '$1<span class="text-amber-700 dark:text-amber-500 font-black underline decoration-2 underline-offset-4">$2</span>');

    // 4. Highlight BECMG (Becoming) -> PURPLE Text (Distinct from TEMPO)
    text = text.replace(/(^|\s)(BECMG)(?=\s|$)/g, 
        '$1<span class="text-purple-700 dark:text-purple-400 font-black underline decoration-2 underline-offset-4">$2</span>');

    // 5. Highlight FM (From) -> BLUE Text (New Time Block)
    text = text.replace(/(^|\s)(FM\d{6})(?=\s|$)/g, 
        '$1<span class="text-blue-700 dark:text-cyan-400 font-black underline decoration-2 underline-offset-4">$2</span>');

    // 6. Highlight PROB (Probability) -> PINK Text
    text = text.replace(/(^|\s)(PROB\d{2,4})(?=\s|$)/g, 
        '$1<span class="text-pink-700 dark:text-pink-400 font-black underline decoration-2 underline-offset-4">$2</span>');

    return text; 
}


function isTafStale(tafTxt) {
    if (!tafTxt) return false;
    const timeRegex = /\b(\d{2})(\d{2})(\d{2})Z\b/;
    const match = tafTxt.match(timeRegex);
    if (!match) return false;
    const tDay = parseInt(match[1], 10);
    const tHour = parseInt(match[2], 10);
    const tMin = parseInt(match[3], 10);
    const now = new Date();
    const cDay = now.getUTCDate();
    const cHour = now.getUTCHours();
    const cMin = now.getUTCMinutes();
    let tafTotalMins = (tDay * 1440) + (tHour * 60) + tMin;
    let currentTotalMins = (cDay * 1440) + (cHour * 60) + cMin;
    if (cDay < 5 && tDay > 25) { currentTotalMins += (31 * 1440); }
    else if (cDay > 25 && tDay < 5) { tafTotalMins += (31 * 1440); }
    const diff = currentTotalMins - tafTotalMins;
    return (diff > 360 || diff < -60);
}

function isMetarStale(metarTxt) {
    if (!metarTxt) return false;
    const timeRegex = /\b(\d{2})(\d{2})(\d{2})Z\b/;
    const match = metarTxt.match(timeRegex);
    if (!match) return false;
    const mDay = parseInt(match[1], 10);
    const mHour = parseInt(match[2], 10);
    const mMin = parseInt(match[3], 10);
    const now = new Date();
    const cDay = now.getUTCDate();
    const cHour = now.getUTCHours();
    const cMin = now.getUTCMinutes();
    let metarTotalMins = (mDay * 1440) + (mHour * 60) + mMin;
    let currentTotalMins = (cDay * 1440) + (cHour * 60) + cMin;
    if (cDay < 5 && mDay > 25) { currentTotalMins += (31 * 1440); } 
    else if (cDay > 25 && mDay < 5) { metarTotalMins += (31 * 1440); }
    const diff = currentTotalMins - metarTotalMins;
    return (diff > 90 || diff < -60);
}

function highlightTaf(rawTaf, flightTimeStr, dofStr) {
    if (!flightTimeStr || flightTimeStr === "--:--") {
        // Even if no flight time, we still want new lines for readability
        return rawTaf.split(/(?=\s(?:FM\d{6}|BECMG|TEMPO|PROB))/g)
                     .map(part => `<div class="mb-1">${applyKeywords(part.trim())}</div>`)
                     .join('');
    }

    let flightDate = new Date();
    if (dofStr && dofStr.length === 6) {
        flightDate = new Date(Date.UTC("20" + dofStr.substring(0, 2), parseInt(dofStr.substring(2, 4)) - 1, dofStr.substring(4, 6)));
    }
    const [hrs, mins] = flightTimeStr.split(':').map(Number); 
    flightDate.setUTCHours(hrs, mins, 0, 0);
    
    const flightTotal = flightDate.getUTCDate() * 24 + flightDate.getUTCHours();
    
    // Split TAF into segments (FM, BECMG, TEMPO, PROB)
    const parts = rawTaf.split(/(?=\s(?:FM\d{6}|BECMG|TEMPO|PROB))/g);
    
    let html = "";
    parts.forEach(part => {
        let isMatch = false; 
        const cleanPart = part.trim();
        
        // 1. Check FM (From)
        if (cleanPart.startsWith("FM")) {
            const day = parseInt(cleanPart.substring(2, 4));
            const hour = parseInt(cleanPart.substring(4, 6));
            if (day === flightDate.getUTCDate() && flightDate.getUTCHours() >= hour) isMatch = true;
        } 
        // 2. Check BECMG/TEMPO/PROB Ranges (e.g. 3012/3014)
        else if (cleanPart.match(/^(BECMG|TEMPO|PROB)/)) {
            const m = cleanPart.match(/(\d{2})(\d{2})\/(\d{2})(\d{2})/);
            if (m) {
                let startTotal = parseInt(m[1])*24 + parseInt(m[2]);
                let endTotal = parseInt(m[3])*24 + parseInt(m[4]);
                // Handle month rollover (e.g. 31st to 1st)
                if (parseInt(m[3]) < parseInt(m[1])) endTotal += (30*24); 
                
                if (flightTotal >= startTotal && flightTotal <= endTotal) isMatch = true;
            }
        }

        // Apply formatting
        const content = applyKeywords(cleanPart);
        
        // If it matches flight time, add yellow background highlight
        if (isMatch) {
            html += `<div class="mb-1 p-1 -mx-1 rounded bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-yellow-500">${content}</div>`;
        } else {
            html += `<div class="mb-1 pl-1 border-l-4 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800">${content}</div>`;
        }
    });
    
    return html;
}


function renderTimelineStrip(sectors) {
    if (!sectors || sectors.length === 0) return '';
    const hasAnyEdto = sectors.some(s => s.edto && !s.edto.includes("NON") && !s.edto.includes("NOT APPLICABLE"));
    const hasAnyFea = sectors.some(s => s.feaDetailsAirport || (s.fea && s.fea.length >= 3 && !s.fea.includes("APPLICABLE")));

    let flightSpan = "md:col-span-3";
    let altSpan = "md:col-span-3";
    let edtoSpan = "md:col-span-3";
    let feaSpan = "md:col-span-2";

    if (!hasAnyEdto && !hasAnyFea) { flightSpan = "md:col-span-5"; altSpan = "md:col-span-6"; } 
    else if (hasAnyEdto && !hasAnyFea) { flightSpan = "md:col-span-4"; altSpan = "md:col-span-4"; edtoSpan = "md:col-span-3"; } 
    else if (!hasAnyEdto && hasAnyFea) { flightSpan = "md:col-span-4"; altSpan = "md:col-span-4"; feaSpan = "md:col-span-3"; }

    let headerHtml = `<div class="md:col-span-1 text-center">#</div><div class="${flightSpan}">Flight</div><div class="${altSpan}">Alternate</div>`;
    if (hasAnyEdto) headerHtml += `<div class="${edtoSpan}">EDTO</div>`;
    if (hasAnyFea) headerHtml += `<div class="${feaSpan} text-right">FEA</div>`;

    // CHANGED: bg-slate-800 -> bg-white dark:bg-black
    // CHANGED: border-slate-600 -> border-slate-200 dark:border-slate-700
    // CHANGED: bg-slate-900 -> bg-slate-100 dark:bg-slate-900
    // CHANGED: text-slate-400 -> text-slate-500 dark:text-slate-400
    let html = `<div class="bg-white dark:bg-black rounded-xl border border-slate-200 dark:border-slate-700 mb-6 overflow-hidden shadow-lg"><div class="bg-slate-100 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-700 hidden md:grid md:grid-cols-12 gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider items-center">${headerHtml}</div><div class="md:hidden bg-slate-100 dark:bg-slate-900 px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mission Timeline</div><div class="divide-y divide-slate-200 dark:divide-slate-700">`;

    sectors.forEach((s, index) => {
        if (index > 0) {
            const prevSector = sectors[index - 1];
            const transitTime = calculateTransit(prevSector, s);
            if (transitTime) {
                // CHANGED: bg-slate-700/30 -> bg-slate-50 dark:bg-slate-800
                // CHANGED: border-slate-700 -> border-slate-200 dark:border-slate-700
                // CHANGED: text-white -> text-slate-800 dark:text-white
                html += `<div class="px-4 py-1 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-center items-center"><span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>TRANSIT: <span class="text-slate-800 dark:text-white font-mono text-xs">${transitTime}</span></span></div>`;
            }
        }

        let altArr = "---";
        let altCode = "---";
        if (s.alt && s.alt.length >= 3) {
            altCode = s.alt.split('(')[0].trim();
            if (s.altFlightTime && s.sta !== "--:--") {
                altArr = calculateTimeSum(s.sta, [s.altFlightTime.replace('.', ':')], 0);
            }
        }

        let edtoStr = "";
        const isEdto = s.edto && !s.edto.includes("NON") && !s.edto.includes("NOT APPLICABLE");
        
        if (isEdto && s.std && s.std !== "--:--") {
            let eep="", exp="", etp1="", etpDiv1="";
            if (s.edtoPoints) {
                const pEep = s.edtoPoints.find(p => p.type.includes("EEP")); if(pEep) eep=pEep.time;
                const pExp = s.edtoPoints.find(p => p.type.includes("EXP")); if(pExp) exp=pExp.time;
                const pEtp = s.edtoPoints.find(p => p.type.startsWith("ETP 1 (")); if(pEtp) etp1=pEtp.time;
                const pDiv = s.edtoPoints.find(p => p.type === "ETP 1 to EA"); if(pDiv) etpDiv1=pDiv.time;
            }

            const altnNames = s.edtoAltn.replace(/[^A-Z\s]/g, '').replace(/\bNM\b/g, '').trim().split(/\s+/).filter(x=>x.length>2);
            
            const t1 = calculateTimeSum(s.std, [eep], 0);
            const t2 = (etp1 && etpDiv1) ? calculateTimeSum(s.std, [etp1, etpDiv1], 60) : "---";
            const t3 = (etp1 && etpDiv1) ? calculateTimeSum(s.std, [etp1, etpDiv1], -60) : "---";
            const t4 = calculateTimeSum(s.std, [exp], 120);

            // CHANGED: text-white -> text-slate-900 dark:text-white
            if(altnNames.length >= 1) edtoStr += `<div class="flex flex-col sm:block mb-1 sm:mb-0"><span class="text-slate-900 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">${altnNames[0]}</span> <span class="text-slate-500 dark:text-slate-400 text-xs">(${t1}-${t2})</span></div>`;
            if(altnNames.length >= 2) edtoStr += `<div class="flex flex-col sm:block"><span class="text-slate-900 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">${altnNames[1]}</span> <span class="text-slate-500 dark:text-slate-400 text-xs">(${t3}-${t4})</span></div>`;
            else if (altnNames.length === 1 && t3 !== "---") edtoStr += `<div class="flex flex-col sm:block"><span class="text-slate-400 dark:text-slate-500">|</span> <span class="text-slate-500 dark:text-slate-400 text-xs">(${t3}-${t4})</span></div>`;
        }

        let feaStr = "";
        const finalFea = s.feaDetailsAirport || s.fea;
        const isFea = finalFea && finalFea !== "---" && !finalFea.includes("APPLICABLE");
        // CHANGED: text-white -> text-slate-900 dark:text-white
        if(isFea) feaStr = `<div class="flex flex-col md:items-end"><span class="text-slate-900 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">${finalFea}</span><span class="text-slate-500 dark:text-slate-400 text-xs">${s.feaWindow || "---"}</span></div>`;

        // CHANGED: 
        // 1. text-slate-300 -> text-slate-700 dark:text-slate-300
        // 2. border-slate-700 -> border-slate-200 dark:border-slate-700
        // 3. hover:bg-slate-700 -> hover:bg-slate-50 dark:hover:bg-slate-800
        // 4. text-white -> text-slate-900 dark:text-white
        // 5. group-hover:text-cyan-300 -> group-hover:text-blue-600 dark:group-hover:text-cyan-300
        
        let rowHtml = `
        <div id="timeline-row-${s.id}" onclick="scrollToSector(${s.id})" class="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-4 py-3 text-sm font-mono text-slate-700 dark:text-slate-300 items-start md:items-center border-b border-slate-200 dark:border-slate-700 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
            <div class="flex flex-col md:block md:col-span-1 md:text-center">
                <div class="flex md:flex-col items-center gap-2 md:gap-1">
                    <span class="bg-yellow-500 text-black font-bold px-2 py-0.5 rounded text-xs shadow-sm group-hover:bg-yellow-400">#${s.id}</span>
                    <span class="text-[10px] md:text-xs font-bold text-blue-600 dark:text-cyan-300 font-mono tracking-wide group-hover:text-blue-500 dark:group-hover:text-cyan-200">${s.flightNo}</span>
                    <span class="md:hidden text-slate-900 dark:text-white font-bold text-xs group-hover:text-blue-600 dark:group-hover:text-cyan-300">${s.dep} &rarr; ${s.dest}</span>
                </div>
                <div class="md:hidden text-xs text-slate-500 dark:text-slate-400 mt-1 ml-1">${s.std} - ${s.sta}</div>
            </div>
            <div id="tl-depdest-${s.id}" class="hidden md:block ${flightSpan}">
                <div class="flex flex-col"><span class="text-slate-900 dark:text-white font-bold text-base group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">${s.dep} <span class="text-slate-400 dark:text-slate-500">&rarr;</span> ${s.dest}</span><span class="text-slate-500 dark:text-slate-400 text-xs">STD:${s.std} - STA:${s.sta}</span></div>
            </div>
            <div id="tl-altn-${s.id}" class="${altSpan} pl-4 md:pl-0 border-l-2 border-slate-200 dark:border-slate-700 md:border-0">
                <div class="flex flex-row md:flex-col gap-2 md:gap-0 items-center md:items-start"><span class="md:hidden text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold w-10">ALTN</span><div><span class="text-slate-900 dark:text-white font-bold text-base group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">${altCode}</span><span class="text-slate-500 dark:text-slate-400 text-xs">(${s.sta} + ${s.altFlightTime?s.altFlightTime.replace('.',':'):'--'} = <span class="text-slate-900 dark:text-white font-bold">${altArr}</span>)</span></div></div>
            </div>`;

        if (hasAnyEdto) rowHtml += `<div id="tl-edto-${s.id}" class="${edtoSpan} pl-4 md:pl-0 border-l-2 border-slate-200 dark:border-slate-700 md:border-0 min-h-[1.5em]">${edtoStr ? `<div class="flex flex-row md:flex-col gap-2 md:gap-0 items-start"><span class="md:hidden text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold w-10">EDTO</span><div class="flex flex-col gap-1 w-full">${edtoStr}</div></div>` : ''}</div>`;
        if (hasAnyFea) rowHtml += `<div class="${feaSpan} pl-4 md:pl-0 border-l-2 border-slate-200 dark:border-slate-700 md:border-0">${feaStr ? `<div class="flex flex-row md:justify-end gap-2 md:gap-0 items-center"><span class="md:hidden text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold w-10">FEA</span>${feaStr}</div>` : ''}</div>`;

        rowHtml += `</div>`;
        html += rowHtml;
    });

    html += `</div></div>`;
    return html;
}


window.updateTimeline = function(id, rtd) {
    const cardEl = document.getElementById(`card-${id}`);
    if(!cardEl) return;
    
    // 1. Calculate New Arrival Time
    const blk = cardEl.getAttribute('data-blk');
    const std = cardEl.getAttribute('data-std');
    const sta = cardEl.getAttribute('data-sta');
    const altFlight = cardEl.getAttribute('data-alt-flight'); 
    
    const baseTime = (rtd && rtd !== "") ? rtd : std;
    
    const rtaEl = document.getElementById(`rta-${id}`);
    let newArrTime = sta;
    
    if(blk && baseTime !== "--:--") {
        newArrTime = calculateTimeSum(baseTime, [blk], 0);
        if(rtaEl) rtaEl.innerText = newArrTime;
    }

    // 2. Update Summary Timeline (Flight Column)
    // FIX: Added 'group-hover' classes to maintain visual consistency
    const depDestEl = document.getElementById(`tl-depdest-${id}`);
    if(depDestEl) depDestEl.innerHTML = `<div class="flex flex-col"><span class="text-white font-bold text-base group-hover:text-cyan-300 transition-colors">${cardEl.getAttribute('data-dep')} <span class="text-slate-500">&rarr;</span> ${cardEl.getAttribute('data-dest')}</span><span class="text-slate-400 text-xs">STD:${baseTime} - STA:${newArrTime}</span></div>`;
    
    // 3. Update Summary Timeline (Alternate Column)
    let altArrStr = "---";
    if (altFlight && newArrTime !== "---") {
        altArrStr = calculateTimeSum(newArrTime, [altFlight.replace('.', ':')], 0);
    }
    const altnEl = document.getElementById(`tl-altn-${id}`);
    if(altnEl && altFlight) {
        const code = cardEl.getAttribute('data-altn-code');
        // FIX: Added 'group-hover' classes here too
        altnEl.innerHTML = `<div class="flex flex-row md:flex-col gap-2 md:gap-0 items-center md:items-start"><span class="md:hidden text-[10px] text-slate-500 uppercase font-bold w-10">ALTN</span><div><span class="text-white font-bold text-base group-hover:text-cyan-300 transition-colors">${code}</span> <span class="text-slate-400 text-xs">(${newArrTime} + ${altFlight.replace('.',':')} = <span class="text-white font-bold">${altArrStr}</span>)</span></div></div>`;
    }

    // 4. Update EDTO Calculation Cards
    const edtoData = JSON.parse(cardEl.getAttribute('data-edto-points') || "{}");
    const { eep, exp, etp1, etpDiv1 } = edtoData;
    let t1="--:--", t2="--:--", t3="--:--", t4="--:--";

    if(Object.keys(edtoData).length > 0) {
        // Update Title
        const tTitle = document.getElementById(`edto-title-${id}`);
        if(tTitle) tTitle.innerText = `EDTO Validity (${(rtd && rtd!=="")?"RTD":"STD"} ${baseTime})`; 
        
        // Recalculate Windows
        if(eep) {
            t1 = calculateTimeSum(baseTime,[eep],0);
            const v1 = document.getElementById(`edto-val-1-${id}`);
            if(v1) v1.innerText = t1;
        }
        if(etp1 && etpDiv1) { 
            t2 = calculateTimeSum(baseTime,[etp1, etpDiv1],60);
            t3 = calculateTimeSum(baseTime,[etp1, etpDiv1],-60);
            const v2 = document.getElementById(`edto-val-2-${id}`);
            if(v2) v2.innerText = t2;
            const v3 = document.getElementById(`edto-val-3-${id}`);
            if(v3) v3.innerText = t3; 
        } 
        if(exp) {
            t4 = calculateTimeSum(baseTime,[exp],120);
            const v4 = document.getElementById(`edto-val-4-${id}`);
            if(v4) v4.innerText = t4; 
        }

        // Update Summary Timeline (EDTO Column)
        const edtoContainer = document.getElementById(`tl-edto-${id}`);
        if(edtoContainer) {
            const altnRaw = cardEl.getAttribute('data-edto-altn-names');
            const altns = altnRaw ? altnRaw.split(' ').filter(x => x.length >= 3) : [];
            let edtoStr = "";
            
            // FIX: Added 'group-hover' classes
            if (altns.length >= 1) edtoStr += `<div class="flex flex-col sm:block mb-1 sm:mb-0"><span class="text-white font-bold group-hover:text-cyan-300 transition-colors">${altns[0]}</span> <span class="text-slate-400 text-xs">(${t1}-${t2})</span></div>`;
            if (altns.length >= 2) edtoStr += `<div class="flex flex-col sm:block"><span class="text-white font-bold group-hover:text-cyan-300 transition-colors">${altns[1]}</span> <span class="text-slate-400 text-xs">(${t3}-${t4})</span></div>`;
            else if (altns.length === 1 && t3 !== "---") edtoStr += `<div class="flex flex-col sm:block"><span class="text-slate-500">|</span> <span class="text-slate-400 text-xs">(${t3}-${t4})</span></div>`;
            
            if(edtoStr) edtoContainer.innerHTML = `<div class="flex flex-row md:flex-col gap-2 md:gap-0 items-start"><span class="md:hidden text-[10px] text-slate-500 uppercase font-bold w-10">EDTO</span><div class="flex flex-col gap-1 w-full">${edtoStr}</div></div>`;
        }
        
        // Update Weather Footer EDTO Text
        const altnRaw = cardEl.getAttribute('data-edto-altn-names');
        const altns = altnRaw ? altnRaw.split(' ').filter(x => x.length >= 3) : [];
        altns.forEach((code, i) => {
            const el = document.getElementById(`wb-${id}-EDTO-${code}`);
            if(el) {
                let wStr = "";
                if(i===0) wStr = `${t1}-${t2}`;
                else if(i===1) wStr = `${t3}-${t4}`;
                if(wStr && wStr !== "--:-----:--") el.innerText = `#${id} EDTO ( ${wStr}Z )`;
            }
        });
    }

    // 5. Update Weather Footer (DEP/ARR/ALTN)
    // These IDs (wb-X-DEP) will now work because you fixed renderWeatherUI above
    const wbDep = document.getElementById(`wb-${id}-DEP`);
    if(wbDep) wbDep.innerText = `#${id} DEP ( ${baseTime}Z )`;

    const wbArr = document.getElementById(`wb-${id}-ARR`);
    if(wbArr) wbArr.innerText = `#${id} ARR ( ${newArrTime}Z )`;

    const wbAltn = document.getElementById(`wb-${id}-ALTN`);
    if(wbAltn && altFlight) {
        const altArrTime = calculateTimeSum(newArrTime, [altFlight.replace('.', ':')], 0);
        wbAltn.innerText = `#${id} ALTN ( ${altArrTime}Z )`;
    }
}

function renderSectors(sectors) {
    emptyState.classList.add('hidden'); sectorsContainer.classList.remove('hidden'); sectorsContainer.innerHTML = '';
    const aircraftDB = getMergedAircraftDB();

    sectorsContainer.innerHTML = renderTimelineStrip(sectors);

    sectors.forEach((s, index) => {
        // 1. TRANSIT LOGIC
        if (index > 0) { const tr = calculateTransit(sectors[index-1], s); if (tr) sectorsContainer.innerHTML += `<div class="text-center p-2 text-xs lg:text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 dark:text-slate-400 rounded border border-dashed border-slate-300 dark:border-slate-600">⏱️ TRANSIT: ${tr}</div>`; }
        
        const isEdto = s.edto.includes("EDTO") && !s.edto.includes("NON");
        const edtoClass = isEdto ? "bg-purple-700 text-white" : "bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-300";
        
        // 2. PAYLOAD DIFFERENCE CALCULATION
        const zfwDiff = s.zfwMax - s.zfwPlan; const towDiff = s.towMax - s.towPlan; const ldgDiff = s.ldgMax - s.ldgPlan; const paxDiff = s.paxMax - s.paxPlan;
        
        // --- FIXED STYLE FUNCTION ---
        // Now returns the BACKGROUND class too, to avoid "White text on White background" issues
        const getStyle = (diff) => (diff < 700 && diff >= 0) 
            ? "bg-red-600 text-white font-bold animate-pulse" // Critical: Red BG
            : "bg-white dark:bg-slate-900 text-green-600 dark:text-green-400 font-bold"; // Safe: White/Dark BG
        
        // 3. EDTO DATA PREP
        let eep="", exp="", etp1="", etpDiv1="";
        if (s.edtoPoints) {
            const pEep = s.edtoPoints.find(p => p.type.includes("EEP")); if(pEep) eep=pEep.time;
            const pExp = s.edtoPoints.find(p => p.type.includes("EXP")); if(pExp) exp=pExp.time;
            const pEtp = s.edtoPoints.find(p => p.type.startsWith("ETP 1 (")); if(pEtp) etp1=pEtp.time;
            const pDiv = s.edtoPoints.find(p => p.type === "ETP 1 to EA"); if(pDiv) etpDiv1=pDiv.time;
        }
        const edtoPointsJson = JSON.stringify({ eep, exp, etp1, etpDiv1 }).replace(/"/g, "&quot;");
        const altCode = (s.alt && s.alt.length>=3) ? s.alt.split('(')[0].trim() : "---";
        const cleanEdtoAltns = s.edtoAltn.replace(/[^A-Z\s]/g, '').replace(/\bNM\b/g, '').trim();

        const dbIssue = localStorage.getItem('aircraftDBIssueNo');

        // 4. AIRCRAFT INFO HTML
        let acInfoHtml = '';
        if (aircraftDB) {
            let key = s.reg; 
            let info = aircraftDB[key];
            if (!info && key.includes('-')) info = aircraftDB[key.replace('-', '')];
            if (!info && !key.includes('-') && key.length === 5) info = aircraftDB[key.substring(0,2) + '-' + key.substring(2)];
            if (info) {
                const is321 = info.var && info.var.includes('251NX');
                const labelStd = is321 ? "7 Crew" : "6 Crew";
                const labelFull = is321 ? "8 Crew" : "7 Crew";

                acInfoHtml = `
                <div class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-mono text-[10px] sm:text-xs border-b border-slate-200 dark:border-slate-600">
                    <div class="p-2 flex flex-wrap justify-center gap-x-3 gap-y-1 border-b border-slate-200 dark:border-slate-700 bg-slate-200 dark:bg-slate-900/50">
                        ${dbIssue ? `<span class="text-red-600 dark:text-red-500 font-bold whitespace-nowrap">${dbIssue}</span><span class="text-slate-400 dark:text-slate-600">|</span>` : ''}
                        <span><span class="font-bold text-blue-700 dark:text-yellow-400">${key}*</span></span>
                        <span class="text-slate-400 dark:text-slate-600">|</span>
                        <span>${info.var}</span>
                        <span class="text-slate-400 dark:text-slate-600">|</span>
                        <span class="${info.edto === 'EDTO' ? 'text-green-600 dark:text-green-400 font-bold' : ''}">${info.edto}</span>
                        <span class="text-slate-400 dark:text-slate-600">|</span>
                        <span>${info.type}</span>
                        <span class="text-slate-400 dark:text-slate-600">|</span>
                        <span>${info.eng}</span>
                        <span class="text-slate-400 dark:text-slate-600">|</span>
                        <span>${!isNaN(parseFloat(info.idle)) ? parseFloat(info.idle).toFixed(1) : info.idle} / ${!isNaN(parseFloat(info.perf)) ? parseFloat(info.perf).toFixed(1) : info.perf}</span>
                        <span class="text-slate-400 dark:text-slate-600">|</span>
                        <span class="text-slate-500 dark:text-slate-400">MSN:${info.msn}</span>
                    </div>
                    <div class="p-2 flex flex-wrap justify-center gap-x-4 bg-slate-100 dark:bg-slate-800">
                        <span><span class="text-slate-500 dark:text-slate-400 font-bold uppercase">${labelStd}:</span> <span class="text-blue-700 dark:text-cyan-300 font-bold">${info.wStd} / ${info.iStd}</span></span>
                        <span class="text-slate-300 dark:text-slate-600">|</span>
                        <span><span class="text-slate-500 dark:text-slate-400 font-bold uppercase">${labelFull}:</span> <span class="text-blue-700 dark:text-cyan-300 font-bold">${info.wFull} / ${info.iFull}</span></span>
                    </div>
                </div>`;
            }
        }

        // 5. TANKERING HTML
        let tnk = '';
        if ((s.tankering === "YES" || s.tankering === "NFP") && sectors[index+1]) {
            const nx = sectors[index+1]; 
            const cr = s.isMandatoryTankering ? s.rawCont : 0;
            const taxiTotal = s.rawTaxi + nx.rawTaxi;
            const s1AddPad = s.rawAdd + s.rawPad;
            const s2AddPad = nx.rawAdd + nx.rawPad;
            const addPadTotal = s1AddPad + s2AddPad;
            const tot = s.rawAb + nx.rawMsf + taxiTotal + addPadTotal + cr;
            
            tnk = `
            <div class="bg-blue-50 dark:bg-sky-900/30 border-t border-blue-200 dark:border-sky-800 p-3 text-[11px] lg:text-xs font-mono text-sky-900 dark:text-sky-200">
                <div class="font-bold underline mb-2">${s.isMandatoryTankering ? "Mandatory Tankering" : "Economic Tankering"}</div>
                <div class="tanker-grid gap-y-1">
                    <div class="col-span-2 sm:col-span-4">AB(1): <span class="font-bold">${s.rawAb}</span></div>
                    <div class="col-span-2 sm:col-span-4">MSF(2): <span class="font-bold">${nx.rawMsf}</span></div>
                    <div class="col-span-2 sm:col-span-4 whitespace-nowrap">TAXI: <span class="font-bold">${s.rawTaxi} + ${nx.rawTaxi} = ${taxiTotal}</span></div>
                    <div class="col-span-2 sm:col-span-4 whitespace-nowrap">ADD/PAD: <span class="font-bold">${s1AddPad} + ${s2AddPad} = ${addPadTotal}</span></div>
                    ${s.isMandatoryTankering ? `<div class="col-span-2 sm:col-span-4">CONT: <span class="font-bold">${cr}</span></div>` : ''}
                </div>
                <div class="mt-2 pt-2 border-t border-dashed border-blue-300 dark:border-sky-700 text-right font-bold text-sky-600 dark:text-sky-400 text-sm lg:text-base">TOTAL REQ: ${tot} kg</div>
            </div>`;
        }

// 6. ROUTE HTML
        let routeHtml = '';
        if (s.hasRoute) {
            const styledWaypoints = s.waypoints.split(' ').map(w => (/^([A-Z][0-9]{1,4}|DCT)$/.test(w)) ? `<span class="font-bold text-amber-600 dark:text-amber-400">${w}</span>` : `<span class="text-slate-600 dark:text-slate-300">${w}</span>`).join(' ');
            
            const rteStr = s.fmgsRte !== "---" ? `RTE: ${s.fmgsRte}` : "";
            const ciStr = s.costIndex !== "---" ? `CI: ${s.costIndex}` : "";
            let flStr = s.cruiseTempDisplay ? s.cruiseTempDisplay : (s.maxFL > 0 ? `FL${s.maxFL}` : "");
            const wcStr = s.windComp !== "---" ? `W/C: ${s.windComp}` : "";
            const distStr = s.ttlDist !== "---" ? `TTL DIST: ${s.ttlDist}` : "";
            const mdfStr = s.mdf !== "---" ? `MDF: ${s.mdf}` : "";

            // --- NEW: Calculate Delivery Frequency ---
            const delFreq = getDeliveryFrequency(s.dep, s.dest, s.waypoints);
            // We use a styled span to make it pop (Blue/Cyan)
            const delStr = delFreq ? `<span class="text-blue-700 dark:text-cyan-400 font-black border border-blue-200 dark:border-cyan-800 bg-blue-50 dark:bg-cyan-900/30 px-1 rounded">DEL: ${delFreq}</span>` : "";
            // -----------------------------------------

            // --- AMENDED: Added delStr to the parts array ---
            const parts = [rteStr, ciStr, flStr, wcStr, distStr, mdfStr, delStr].filter(p => p !== "");
            const headerString = parts.map(p => `<span class="whitespace-nowrap">${p}</span>`).join(` <span class="text-slate-300 dark:text-slate-600 px-1">|</span> `);

            routeHtml = `
            <div class="bg-slate-50 dark:bg-slate-900/50 p-3 border-b border-slate-200 dark:border-slate-700">
                ${headerString ? `<div class="text-center text-xs sm:text-sm font-bold font-mono tracking-wide text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">${headerString}</div><div class="border-t border-dashed border-slate-300 dark:border-slate-600 mb-3"></div>` : ''}
                <div class="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs lg:text-sm font-mono leading-relaxed">
                    <div class="flex flex-col items-center"><span class="text-sm lg:text-base font-black text-slate-800 dark:text-white">${s.dep}</span><span class="route-badge bg-blue-600 text-white px-2 py-1 rounded text-sm font-bold shadow-sm align-middle inline-flex items-center justify-center" style="display:inline-flex !important;">RWY ${s.depRwy}</span></div>
                    <span class="text-slate-400 mx-1">&rarr;</span>
                    <span class="text-purple-700 dark:text-purple-400 font-bold">${s.sid}</span>
                    <div class="flex flex-wrap gap-x-2 gap-y-1 px-2 border-l border-r border-slate-300 dark:border-slate-600 mx-1 text-xs">${styledWaypoints}</div>
                    <span class="text-purple-700 dark:text-purple-400 font-bold">${s.star}</span>
                    <span class="text-slate-400 mx-1">&rarr;</span>
                    <div class="flex flex-col items-center"><span class="text-sm lg:text-base font-black text-slate-800 dark:text-white">${s.dest}</span><span class="route-badge bg-blue-600 text-white px-2 py-1 rounded text-sm font-bold shadow-sm align-middle inline-flex items-center justify-center" style="display:inline-flex !important;">RWY ${s.arrRwy}</span></div>
                </div>
            </div>`;
        }

        // 7. EDTO HTML
        let edtoHtml = ''; let calcHtml = ''; let edtoStatusRow = '';
        if (isEdto && s.edtoCriticalFuel > 0 && s.rawMsf > 0) {
            edtoStatusRow = (s.edtoCriticalFuel > s.rawMsf) 
                ? `<div class="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 p-2 mb-2 rounded flex items-center justify-between animate-pulse"><span class="text-red-700 dark:text-red-300 font-bold text-xs uppercase">⚠️ CF Exceeds MSF</span><span class="text-red-800 dark:text-red-200 font-mono font-bold text-sm">CF: ${s.edtoCriticalFuel} > MSF: ${s.rawMsf}</span></div>`
                : `<div class="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 p-2 mb-2 rounded flex items-center justify-between"><span class="text-green-700 dark:text-green-300 font-bold text-xs uppercase">✅ CF Covered</span><span class="text-green-800 dark:text-green-200 font-mono font-bold text-sm">CF: ${s.edtoCriticalFuel} < MSF: ${s.rawMsf}</span></div>`;
        }

        if (s.edtoPoints && s.edtoPoints.length > 0) {
            const rows = s.edtoPoints.map(p => `<div class="grid grid-cols-7 gap-2 text-[10px] lg:text-xs font-mono py-1 border-b border-slate-100 dark:border-slate-700 last:border-0 items-center ${p.type.includes("to EA")?"bg-slate-50 dark:bg-slate-800/50":""}"><div class="col-span-3 ${p.type.includes("to EA")?"text-slate-500 dark:text-slate-400 italic pl-2":"text-slate-700 dark:text-slate-300 font-bold"} truncate" title="${p.type}">${p.type}</div><div class="col-span-1 ${p.type.includes("to EA")?"text-amber-600 dark:text-amber-500 font-bold":"text-blue-600 dark:text-blue-400 font-bold"} text-center">${p.time}</div><div class="col-span-3 text-right text-slate-500 dark:text-slate-400 truncate font-mono text-sm font-bold lg:text-xl">${p.coord}</div></div>`).join('');
            
            if (s.std && s.std !== "--:--") {
                const res1 = calculateTimeSum(s.std, [eep], 0);
                const res2 = calculateTimeSum(s.std, [etp1, etpDiv1], 60);
                const res3 = calculateTimeSum(s.std, [etp1, etpDiv1], -60);
                const res4 = calculateTimeSum(s.std, [exp], 120);
                calcHtml = `<div class="mt-3 pt-3 border-t border-dashed border-slate-300 dark:border-slate-600"><div id="edto-title-${s.id}" class="text-[9px] lg:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">EDTO Validity Calculation (STD ${s.std})</div><div class="space-y-1 text-[10px] lg:text-xs font-mono text-slate-500 dark:text-slate-400"><div class="flex justify-between"><span>1. STD/RTD + EEP</span><span id="edto-val-1-${s.id}" class="font-bold text-blue-600 dark:text-blue-400 text-xs lg:text-sm">${res1}</span></div>${etp1 && etpDiv1 && etpDiv1 !== "---" ? `<div class="flex justify-between"><span>2. STD/RTD + ETP1 + Div + 1hr</span><span id="edto-val-2-${s.id}" class="font-bold text-blue-600 dark:text-blue-400 text-xs lg:text-sm">${res2}</span></div><div class="flex justify-between"><span>3. STD/RTD + ETP1 + Div - 1hr</span><span id="edto-val-3-${s.id}" class="font-bold text-blue-600 dark:text-blue-400 text-xs lg:text-sm">${res3}</span></div>` : ''}<div class="flex justify-between"><span>4. STD/RTD + EXP + 2hr</span><span id="edto-val-4-${s.id}" class="font-bold text-blue-600 dark:text-blue-400 text-xs lg:text-sm">${res4}</span></div></div></div>`;
            }

            let etpInfoHtml = '';
            if (s.edtoScenarioLine && s.edtoScenarioLine !== "---") {
                const cols = s.edtoScenarioLine.trim().split(/\s+/);
                if (cols.length >= 10) {
                    const scenario = `${cols[0]} ${cols[1]}`; const fl = cols[2]; const burn = cols[3]; const pen = cols[5]; const hold = cols[7]; const etpFuel = cols[9]; const time = cols[10]; const total = cols[11];
                    etpInfoHtml = `<div class="mt-2 border-t border-slate-200 dark:border-slate-700"><div class="bg-slate-100 dark:bg-slate-800 grid grid-cols-8 gap-1 p-1 text-[9px] font-bold text-slate-500 dark:text-slate-400 text-center uppercase tracking-tighter"><div class="col-span-1">Scn</div><div class="col-span-1">FL</div><div class="col-span-1">Burn</div><div class="col-span-1">Pen</div><div class="col-span-1">Hold</div><div class="col-span-1">ETP F</div><div class="col-span-1">Time</div><div class="col-span-1 text-slate-900 dark:text-white">Total</div></div><div class="bg-white dark:bg-slate-900 grid grid-cols-8 gap-1 p-2 text-[10px] lg:text-xs font-mono font-bold text-slate-700 dark:text-slate-200 text-center items-center border-b border-l border-r border-slate-200 dark:border-slate-700 rounded-b shadow-sm"><div class="col-span-1 text-purple-600 dark:text-purple-400">${scenario}</div><div class="col-span-1">${fl}</div><div class="col-span-1">${burn}</div><div class="col-span-1">${pen}</div><div class="col-span-1">${hold}</div><div class="col-span-1 text-blue-600 dark:text-blue-400">${etpFuel}</div><div class="col-span-1">${time}</div><div class="col-span-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-900 dark:text-white ring-1 ring-slate-200 dark:ring-slate-700">${total}</div></div></div>`;
                } else {
                    etpInfoHtml = `<div class="mt-2 p-2 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-center border border-slate-200 dark:border-slate-700 break-words">${s.edtoScenarioLine}</div>`;
                }
            }

            let detailsHtml = '';
            if (s.edtoDetails && s.edtoDetails.length > 0) {
                detailsHtml = `<div class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700"><div class="text-[9px] lg:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">ETP Scenario Analysis</div><div class="grid grid-cols-1 gap-2">${s.edtoDetails.map(d => `<div class="bg-slate-100 dark:bg-slate-800 rounded p-2 text-[10px] lg:text-xs font-mono border border-slate-200 dark:border-slate-600"><div class="flex justify-between items-center mb-1"><span class="font-bold text-blue-700 dark:text-blue-400">TO ${d.apt}</span><span class="text-slate-500">DIST: <span class="text-slate-800 dark:text-white font-bold">${d.dist} NM</span></span></div><div class="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300"><div>TDV: <span class="font-bold">${d.tdv}</span></div><div>WC: <span class="font-bold">${d.wc}</span></div><div class="col-span-2 border-t border-slate-200 dark:border-slate-700 mt-1 pt-1 flex justify-between items-end"><div><span class="text-[9px] text-slate-400 uppercase">Max Mora:</span><br><span class="font-bold text-amber-700 dark:text-amber-500">${d.mora} FT</span></div><div class="text-right max-w-[60%]"><span class="text-[9px] text-slate-400 uppercase">Coord:</span><br><span class="font-bold text-slate-700 dark:text-slate-300 text-[9px] break-words leading-tight">${d.coord}</span></div></div></div></div>`).join('')}</div></div>`;
            }

            edtoHtml = `<div class="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 p-3"><div class="text-[10px] lg:text-xs font-bold text-purple-600 dark:text-purple-400 mb-2 uppercase flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>EDTO Operational Summary</div><div class="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 p-2 shadow-sm">${edtoStatusRow}<div class="grid grid-cols-7 gap-2 text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase mb-1 pb-1 border-b border-slate-100 dark:border-slate-700"><div class="col-span-3">Point</div><div class="col-span-1 text-center">Time</div><div class="col-span-3 text-right">Coordinates</div></div>${rows}${calcHtml}${etpInfoHtml}${detailsHtml}</div></div>`;
        }

        // 8. FEA HTML
        let feaHtml = '';
        const finalFeaAirport = s.feaDetailsAirport || s.fea;
        if (finalFeaAirport && finalFeaAirport !== "---" && !finalFeaAirport.includes("APPLICABLE")) {
             feaHtml = `<div class="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 p-3"><div class="text-[10px] lg:text-xs font-bold text-purple-600 dark:text-purple-400 mb-2 uppercase flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 16s-1.5-2-4-2-4 2-4 2"/><line x1="12" y1="2" x2="12" y2="12"/></svg>FEA Details</div><div class="bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 p-2 shadow-sm"><div class="grid grid-cols-2 gap-2 text-[10px] lg:text-xs font-mono py-1 border-b border-slate-100 dark:border-slate-700"><div class="font-bold text-slate-500 dark:text-slate-400">FEA Airport:</div><div class="text-right font-bold text-slate-800 dark:text-white text-sm lg:text-base">${finalFeaAirport}</div></div><div class="grid grid-cols-2 gap-2 text-[10px] lg:text-xs font-mono py-1"><div class="font-bold text-slate-500 dark:text-slate-400">ETA Window:</div><div class="text-right font-bold text-blue-600 dark:text-blue-400 text-sm lg:text-base">${s.feaWindow || "---"}</div></div></div></div>`;
        }
        
        // 9. PAYLOAD GRID HIGHLIGHTS
        const paxThreshold = s.paxMax * 0.15; 
        const isPaxCritical = (paxDiff < paxThreshold);
        const paxDiffStyle = isPaxCritical ? "bg-red-600 text-white font-bold animate-pulse" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300";

        const hasCargo = s.cargoPlan > 0;
        const cargoPlanStyle = hasCargo ? "bg-red-600 text-white font-bold" : "bg-white dark:bg-slate-900 text-slate-800 dark:text-white";

        const payloadGridHtml = `
        <div class="bg-slate-50 dark:bg-slate-800/50 border-t border-b border-slate-200 dark:border-slate-700">
            <div class="grid grid-cols-4 gap-px bg-slate-200 dark:bg-slate-700">
                <div class="bg-slate-100 dark:bg-slate-800 p-1 text-[9px] lg:text-[10px] text-center font-bold text-slate-400">ITEM</div>
                <div class="bg-slate-100 dark:bg-slate-800 p-1 text-[9px] lg:text-[10px] text-center font-bold text-slate-400">PLAN</div>
                <div class="bg-slate-100 dark:bg-slate-800 p-1 text-[9px] lg:text-[10px] text-center font-bold text-slate-400">MAX</div>
                <div class="bg-slate-100 dark:bg-slate-800 p-1 text-[9px] lg:text-[10px] text-center font-bold text-slate-400">DIFF</div>
                
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-bold text-slate-600 dark:text-slate-300">PAX</div>
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-mono font-bold text-slate-800 dark:text-white">${s.paxPlan}</div>
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-mono font-bold text-slate-500 dark:text-slate-400">${s.paxMax}</div>
                <div class="${paxDiffStyle} p-1.5 text-center text-xs lg:text-sm font-mono">${paxDiff}</div>
                
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-bold text-slate-600 dark:text-slate-300">CARGO</div>
                <div class="${cargoPlanStyle} p-1.5 text-center text-xs lg:text-sm font-mono">${s.cargoPlan}</div>
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-mono text-slate-400">---</div>
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-mono text-slate-400">---</div>
                
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-bold text-slate-600 dark:text-slate-300">ZFW</div>
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-mono font-bold text-slate-800 dark:text-white">${s.zfwPlan}</div>
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-mono font-bold text-slate-500 dark:text-slate-400">${s.zfwMax}</div>
                <div class="${getStyle(zfwDiff)} p-1.5 text-center text-xs lg:text-sm font-mono">${zfwDiff}</div>
                
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-bold text-slate-600 dark:text-slate-300">TOW</div>
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-mono font-bold text-slate-800 dark:text-white">${s.towPlan}</div>
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-mono font-bold text-slate-500 dark:text-slate-400">${s.towMax}</div>
                <div class="${getStyle(towDiff)} p-1.5 text-center text-xs lg:text-sm font-mono">${towDiff}</div>
                
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-bold text-slate-600 dark:text-slate-300">LDG</div>
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-mono font-bold text-slate-800 dark:text-white">${s.ldgPlan}</div>
                <div class="bg-white dark:bg-slate-900 p-1.5 text-center text-xs lg:text-sm font-mono font-bold text-slate-500 dark:text-slate-400">${s.ldgMax}</div>
                <div class="${getStyle(ldgDiff)} p-1.5 text-center text-xs lg:text-sm font-mono">${ldgDiff}</div>
            </div>
        </div>`;

        // 10. FINAL CARD ASSEMBLY
        // SWAPPED: data-grid is now ABOVE times-grid
        const html = `<div id="card-${s.id}" class="card bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-4 relative" 
            data-blk="${s.blk}" data-std="${s.std}" data-sta="${s.sta}" data-dep="${s.dep}" data-dest="${s.dest}"
            data-alt-flight="${s.altFlightTime||''}" data-altn-code="${altCode}"
            data-edto-status="${isEdto}"
            data-edto-points="${edtoPointsJson}" data-edto-altn-names="${cleanEdtoAltns}">
            ${acInfoHtml}
            <div class="bg-white dark:bg-black text-slate-900 dark:text-white p-3 flex justify-between items-center flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700">
                <div class="flex items-center gap-3"><span class="bg-blue-600 text-white text-[10px] lg:text-xs font-bold px-2 py-0.5 rounded">#${s.id}</span><span class="font-mono text-lg lg:text-xl font-bold text-blue-700 dark:text-yellow-400">${s.flightNo}</span><div class="flex items-center gap-1 font-mono font-bold text-sm lg:text-base"><span>${s.dep}</span><span class="text-slate-400 dark:text-slate-500">&rarr;</span><span>${s.dest}</span></div></div>
                <div class="flex items-center gap-2 ml-auto mt-1 sm:mt-0"><span class="px-2 py-0.5 rounded text-[9px] lg:text-xs font-bold ${edtoClass}">${isEdto ? "EDTO" : "NON EDTO"}</span><div class="text-right"><span class="block text-[9px] lg:text-[10px] text-slate-400 uppercase">Altn</span><span class="font-mono font-bold text-sm lg:text-base leading-none">${s.alt}</span></div></div>
            </div>
            <div class="flex justify-between bg-slate-50 dark:bg-slate-700/50 p-2 text-xs lg:text-sm font-mono border-b border-slate-200 dark:border-slate-700">
                <div class="flex gap-1"><span class="font-bold text-slate-400">REG</span><span class="font-bold text-slate-700 dark:text-slate-200">${s.reg}</span></div><div class="flex gap-1"><span class="font-bold text-slate-400">IF</span><span class="font-bold text-slate-700 dark:text-slate-200">${s.ifVal}</span></div><div class="flex gap-1"><span class="font-bold text-slate-400">PF</span><span class="font-bold text-slate-700 dark:text-slate-200">${s.pfVal}</span></div>
            </div>
            ${routeHtml}
            <div class="p-2 bg-cyan-50 dark:bg-cyan-900/30 border-b border-cyan-200 dark:border-cyan-800"><div class="text-[9px] lg:text-xs text-center text-cyan-600 dark:text-cyan-400 font-bold mb-1 tracking-wider">OPTI SPEEDS</div><div class="flex justify-around text-xs lg:text-sm font-mono font-bold text-cyan-800 dark:text-cyan-100"><span>${s.opti1}</span><span>${s.opti2}</span><span>${s.opti3}</span></div></div>
            
            <div class="data-grid bg-slate-300 dark:bg-slate-600 gap-px border-b border-slate-200 dark:border-slate-700">
                <div class="bg-white dark:bg-slate-800 p-2 text-center flex flex-col justify-center min-h-[50px]"><div class="text-[9px] lg:text-xs text-slate-400 font-bold">ZFW</div><div class="font-mono text-sm lg:text-base font-bold text-slate-700 dark:text-slate-200">${s.zfw}</div></div>
                <div class="bg-white dark:bg-slate-800 p-2 text-center flex flex-col justify-center"><div class="text-[9px] lg:text-xs text-slate-400 font-bold">AB FUEL</div><div class="font-mono text-sm lg:text-base font-bold text-slate-700 dark:text-slate-200">${s.abFuel}</div></div>
                <div class="bg-white dark:bg-slate-800 p-2 text-center flex flex-col justify-center"><div class="text-[9px] lg:text-xs text-slate-400 font-bold">TAXI</div><div class="font-mono text-sm lg:text-base font-bold text-slate-700 dark:text-slate-200">${s.taxi}</div></div>
                <div class="bg-white dark:bg-slate-800 p-2 text-center flex flex-col justify-center"><div class="text-[9px] lg:text-xs text-slate-400 font-bold">MSF</div><div class="font-mono text-sm lg:text-base font-bold text-orange-600 dark:text-orange-400">${s.msf}</div></div>
                <div class="bg-slate-50 dark:bg-slate-700 p-2 text-center flex flex-col justify-center"><div class="text-[9px] lg:text-xs text-blue-600 dark:text-blue-400 font-bold">BLK FUEL</div><div class="font-mono text-lg lg:text-xl font-bold text-green-600 dark:text-green-400">${s.bf}</div></div>
                <div class="bg-white dark:bg-slate-800 p-2 text-center flex flex-col justify-center"><div class="text-[9px] lg:text-xs text-slate-400 font-bold">ARR FUEL</div><div class="font-mono text-sm lg:text-base font-bold text-slate-700 dark:text-slate-200">${s.arrFuel}</div></div>
                <div class="col-span-1 bg-white dark:bg-slate-800 p-2 text-center flex flex-col justify-center border-r border-slate-200 dark:border-slate-700"><div class="text-[9px] lg:text-xs text-slate-400 font-bold">TANKERING</div><div class="font-mono text-sm lg:text-base font-bold ${s.tankering === 'YES' ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}">${s.tankering}</div></div>
                <div class="col-span-1 bg-white dark:bg-slate-800 p-2 text-center flex flex-col justify-center"><div class="text-[9px] lg:text-xs text-slate-400 font-bold">PADDING</div><div class="font-mono text-sm lg:text-base font-bold text-slate-700 dark:text-slate-200">${s.paddingText}</div></div>
            </div>

            <div class="times-grid bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div class="p-2 text-center border-r border-slate-200 dark:border-slate-700"><div class="text-[9px] lg:text-xs text-slate-400 font-bold">STD</div><div class="font-mono text-base lg:text-lg font-bold text-slate-700 dark:text-slate-200">${s.std}</div></div>
                <div class="p-2 text-center border-r border-slate-200 dark:border-slate-700"><div class="text-[9px] lg:text-xs text-slate-400 font-bold">BLOCK</div><div class="font-mono text-base lg:text-lg font-bold text-slate-700 dark:text-slate-200">${s.blk}</div></div>
                <div class="p-2 text-center"><div class="text-[9px] lg:text-xs text-slate-400 font-bold">STA</div><div class="font-mono text-base lg:text-lg font-bold text-slate-700 dark:text-slate-200">${s.sta}</div></div>
                <div class="p-1.5 sm:p-2 text-center border-r border-t border-slate-200 dark:border-slate-700 bg-yellow-50 dark:bg-yellow-900/10 flex flex-col justify-center"><div class="text-[9px] lg:text-xs text-yellow-600 dark:text-yellow-500 font-bold mb-1">RTD</div><input type="time" class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white text-xs sm:text-sm rounded px-0 sm:px-2 py-1 w-full max-w-[100px] mx-auto text-center focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm appearance-none" oninput="updateTimeline(${s.id}, this.value)"></div>
                <div class="p-2 text-center border-r border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col justify-center"><div class="text-[9px] lg:text-xs text-slate-400 font-bold mb-1">EET</div><div class="font-mono text-base lg:text-lg font-bold text-slate-700 dark:text-slate-200">${s.eet}</div></div>
                <div class="p-2 text-center border-t border-slate-200 dark:border-slate-700 bg-yellow-50 dark:bg-yellow-900/10"><div class="text-[9px] lg:text-xs text-yellow-600 dark:text-yellow-500 font-bold mb-1">RTA</div><div id="rta-${s.id}" class="font-mono text-base lg:text-lg font-bold text-yellow-700 dark:text-yellow-400">--:--</div></div>
            </div>

            ${tnk}
            ${payloadGridHtml}
            ${edtoHtml}
            ${feaHtml}
            <div class="planning-row p-3 border-t border-slate-200 dark:border-slate-700 text-[11px] lg:text-xs"><div class="text-[10px] lg:text-xs font-bold text-slate-400 uppercase mb-2 border-b border-slate-100 dark:border-slate-700 pb-1">Mission Planning</div><div class="planning-grid gap-1"><div><span class="font-bold text-slate-500 dark:text-slate-400">T/O ALTN:</span> <span class="font-mono font-bold text-slate-800 dark:text-slate-200">${s.takeoffAltn}</span></div><div><span class="font-bold text-slate-500 dark:text-slate-400">FEA:</span> <span class="font-mono font-bold text-purple-700 dark:text-purple-400">${s.fea}</span></div><div class="col-span-2"><span class="font-bold text-slate-500 dark:text-slate-400">EDTO ALTN:</span> <span class="font-mono font-bold text-purple-700 dark:text-purple-400">${s.edtoAltn}</span></div><div class="col-span-2"><span class="font-bold text-slate-500 dark:text-slate-400">PSR:</span> <span class="font-mono font-bold text-slate-800 dark:text-slate-200">${s.psr}</span></div></div></div>${s.remarks ? `<div class="bg-orange-50 dark:bg-orange-900/20 p-3 text-[11px] lg:text-xs font-mono text-orange-900 dark:text-orange-200 border-t border-dashed border-orange-200 dark:border-orange-800 whitespace-pre-wrap"><div class="font-bold text-orange-600 dark:text-orange-400 mb-1 border-b border-orange-200 dark:border-orange-800 pb-1">DISPATCH REMARKS:</div>${s.remarks}</div>` : ''}</div>`;        
        sectorsContainer.innerHTML += html;
    });
    
    // Update Navigation Menu
    const navContainer = document.getElementById('nav-dynamic-sectors');
    if (navContainer) {
        navContainer.innerHTML = sectors.map(s => `
            <button onclick="navigateTo('card-${s.id}')" class="flex items-center gap-3 group animate-fade-in">
                <span class="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ${s.dep} &rarr; ${s.dest}
                </span>
                <div class="w-10 h-10 rounded-full bg-yellow-500 text-white shadow-lg flex items-center justify-center hover:bg-yellow-600 transition-colors font-bold font-mono text-sm border-2 border-slate-800/10">
                    #${s.id}
                </div>
            </button>
        `).join('');
    }
}

// ==========================================
// 5. CLOUD SYNC LOGIC
// ==========================================
function toggleSettings() {
    const modal = document.getElementById('settings-modal');
    modal.classList.toggle('hidden');
    if (!modal.classList.contains('hidden')) {
        document.getElementById('gist-token').value = localStorage.getItem('fb_gist_token') || '';
        fetchCloudDB(); 
    }
}

function saveCloudSettings() {
    const token = document.getElementById('gist-token').value.trim();
    if(token) {
        localStorage.setItem('fb_gist_token', token);
        alert('Admin Token Saved.');
        toggleSettings();
    } else {
        alert('Please enter Token');
    }
}

async function fetchCloudDB() {
    const gistId = GLOBAL_GIST_ID;
    if (!gistId) return;

    const cloudLabel = document.getElementById('cloud-version-label');

    try {
        const noCacheUrl = `https://api.github.com/gists/${gistId}?timestamp=${new Date().getTime()}`;
        const response = await fetch(noCacheUrl, { method: 'GET' });
        
        if (!response.ok) {
            if(cloudLabel) cloudLabel.innerText = "Connection Failed";
            return; 
        }
        
        const data = await response.json();
        const file = data.files['aircraft_db.json'];
        
        if (file && file.content) {
            const serverContent = file.content;
            const serverDB = JSON.parse(serverContent);
            
            if(cloudLabel && serverDB._META && serverDB._META.issue) {
                cloudLabel.innerText = `Latest Available: ${serverDB._META.issue}`;
            }

            const localContent = localStorage.getItem('customAircraftDB');
            const localDB = localContent ? JSON.parse(localContent) : null;

            let shouldUpdate = true;
            if (localDB && localDB._META && serverDB._META) {
                const serverTime = new Date(serverDB._META.lastUpdated).getTime();
                const localTime = new Date(localDB._META.lastUpdated).getTime();
                if (localTime >= serverTime) shouldUpdate = false;
            }

            if (shouldUpdate) {
                console.log("Downloading new DB from Cloud...");
                localStorage.setItem('customAircraftDB', serverContent);
                if (serverDB._META.issue) localStorage.setItem('aircraftDBIssueNo', serverDB._META.issue);
                
                const statusDiv = document.getElementById('db-status');
                if(statusDiv) {
                    statusDiv.innerHTML = `Cloud Sync: ${serverDB._META.issue}`;
                    statusDiv.classList.remove('hidden');
                    statusDiv.classList.add('bg-green-100', 'text-green-800');
                }
                updateDBStatusUI(); 
            } else {
                 updateDBStatusUI();
            }
        }
    } catch (e) { 
        console.log("Cloud check skipped (Offline)"); 
        if(cloudLabel) cloudLabel.innerText = "Offline / No Connection";
    }
}

window.addEventListener('load', fetchCloudDB);

async function forceCloudSync() {
    const gistId = GLOBAL_GIST_ID;
    if (!gistId) return;

    const btn = document.getElementById('btn-force-sync');
    const originalText = btn ? btn.innerHTML : 'Force Sync';
    if(btn) btn.innerHTML = '⏳ Downloading...';

    try {
        const noCacheUrl = `https://api.github.com/gists/${gistId}?timestamp=${new Date().getTime()}`;
        const response = await fetch(noCacheUrl, { method: 'GET' });
        
        if (!response.ok) throw new Error("Could not connect to Cloud.");
        
        const data = await response.json();
        const file = data.files['aircraft_db.json'];
        
        if (file && file.content) {
            localStorage.setItem('customAircraftDB', file.content);
            const dbObj = JSON.parse(file.content);
            if (dbObj._META && dbObj._META.issue) localStorage.setItem('aircraftDBIssueNo', dbObj._META.issue);
            
            updateDBStatusUI();
            
            // --- AMENDMENT START: Auto Reload ---
            alert(`✅ Database Synced!\nIssue: ${dbObj._META.issue}\n\nThe app will now reload to apply changes.`);
            location.reload(); 
            // --- AMENDMENT END ---
        }
    } catch (error) {
        alert("❌ Sync Failed: " + error.message);
    } finally {
        if(btn) btn.innerHTML = originalText;
    }
}

async function parseAndUploadCloudDB(inputElement) {
    if (inputElement.files.length === 0) return;
    
    const token = localStorage.getItem('fb_gist_token');
    const gistId = GLOBAL_GIST_ID;
    const isAdmin = (token && gistId);

    try {
        const file = inputElement.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = "";

        // 1. Extract Text
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join("  ") + "\n";
        }

        // 2. Extract Issue Number
        const issueMatch = fullText.match(/ISSUE.*?(\d{3}-\d{4})/i);
        const issueNo = issueMatch ? issueMatch[1] : "UNKNOWN-ISSUE";

        // 3. Smart Scan Logic
        const newDB = {};
        let count = 0;
        const aircraftBlocks = fullText.split("9M-");

        // Skip the first block (header)
        for (let k = 1; k < aircraftBlocks.length; k++) {
            let rawBlock = "9M-" + aircraftBlocks[k].substring(0, 300);
            
            // Clean up text
            const cleanText = rawBlock.replace(/[\n\r|]/g, " ").trim();
            const tokens = cleanText.split(/\s+/); 

            // --- A. Identify Registration ---
            const reg = tokens[0].replace('*', '');
            if (reg.length !== 6) continue;

            // --- B. Identify Data by TYPE ---
            let engine = "27K"; 
            let factors = [];   
            let weights = [];   
            let msn = "000";

            tokens.forEach(t => {
                if (/\d+K$/.test(t)) {
                    engine = t;
                }
                else if (/^-?\d+(\.\d+)?$/.test(t)) {
                    const val = parseFloat(t);
                    
                    if (val > 20000) {
                        weights.push(Math.round(val));
                    } else if (val > 1000 && val < 20000) {
                        if (msn === "000") msn = String(Math.round(val));
                    } else if (val > -10 && val < 15) {
                        factors.push(val);
                    }
                }
            });

            // --- C. Assign Data ---
            if (factors.length >= 2) {
                // Ensure we handle negative/positive correctly
                // Smart Scan assumes Idle is first, Perf is second
                const idleVal = Number(factors[0]);
                const perfVal = Number(factors[1]);

                const wStd = weights.length > 0 ? weights[0] : 0;
                const wFull = weights.length > 1 ? weights[1] : (wStd + 100);
                
                const isNeo = cleanText.includes("251NX");
                const isEdto = cleanText.includes("NON") ? "NON" : "EDTO";
                
                newDB[reg] = {
                    var: isNeo ? "-251NX" : "-214EF", 
                    edto: isEdto,
                    type: cleanText.includes(" B ") ? "B" : (cleanText.includes(" A ") ? "A" : "--"),
                    eng: engine,
                    
                    // --- THE FIX: Format to 1 Decimal Place ---
                    idle: idleVal.toFixed(1), // e.g. 3 becomes "3.0"
                    perf: perfVal.toFixed(1), // e.g. 5.1 stays "5.1"
                    // ------------------------------------------
                    
                    msn: msn,
                    wStd: wStd,
                    iStd: 25.0, 
                    wFull: wFull,
                    iFull: 25.0
                };
                count++;
            }
        }

        if (count === 0) throw new Error("No aircraft data found. Parsing failed.");

        const finalJSON = {
            _META: { issue: issueNo, lastUpdated: new Date().toISOString() },
            ...newDB
        };

        localStorage.setItem('customAircraftDB', JSON.stringify(finalJSON));
        localStorage.setItem('aircraftDBIssueNo', issueNo);

        if (isAdmin) {
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                method: 'PATCH',
                headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: { "aircraft_db.json": { content: JSON.stringify(finalJSON, null, 2) } } })
            });
            if (!response.ok) throw new Error("GitHub Upload Failed");
            alert(`✅ Cloud Sync Complete!\nIssue: ${issueNo}\nParsed ${count} aircraft.`);
            location.reload();
        } else {
            alert(`✅ Local Update Complete!\nIssue: ${issueNo}\nParsed ${count} aircraft.`);
            location.reload();
        }

    } catch (error) {
        console.error(error);
        alert("❌ Error: " + error.message);
    } finally {
        inputElement.value = '';
    }
}
 
 
function updateDBStatusUI() {
    const statusDiv = document.getElementById('db-status');
    const customDBStr = localStorage.getItem('customAircraftDB');
    
    if (customDBStr && statusDiv) {
        try {
            const db = JSON.parse(customDBStr);
            let label = "Custom DB";
            let count = Object.keys(db).filter(k => k !== '_META').length;
            
            if (db._META && db._META.issue) {
                label = `Issue: ${db._META.issue}`;
            } else if (localStorage.getItem('aircraftDBIssueNo')) {
                label = `Issue: ${localStorage.getItem('aircraftDBIssueNo')}`;
            }

            statusDiv.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <span class="ml-1">${label} (${count})</span>`;
            statusDiv.classList.remove('hidden');
        } catch(e) {}
    }
}

// ==========================================
// NEW: NOTAM & WEATHER LOGIC
// ==========================================

function extractNotamsFromText(fullText) {
    const notamDB = {};
    
    // 1. Pre-clean headers/footers to avoid breaking flows
    let cleanText = fullText.replace(/PAGE\s+\d+\s+OF\s+\d+/gi, "")
                            .replace(/AIRASIA\s+BERHAD\s+BRIEF/gi, "");

    // 2. Structure: Ensure Section Headers (e.g. "OTHER:") start on a new line
    let structText = cleanText.replace(/(DEPARTURE|ARRIVAL|OTHER|Fir|NO SIGMET)\s*:/g, '\n$1:');

    // 3. Regex to capture blocks
    // FIX: Added '\s*:' to the lookahead. This ensures we only stop at "DEPARTURE:" 
    // and ignore the word "DEPARTURE" if it appears inside a sentence.
    const blockRegex = /(DEPARTURE|ARRIVAL|OTHER)\s*:\s*([\s\S]*?)(?=\n(?:DEPARTURE|ARRIVAL|OTHER|Fir|NO SIGMET)\s*:|$)/g;
    
    let match;
    while ((match = blockRegex.exec(structText)) !== null) {
        const blockContent = match[2]; 

        // 4. Identify airport code from TAF line
        const codeMatch = blockContent.match(/TAF\s+(?:AMD\s+|COR\s+)?[A-Z]{4}\b/);
        
        if (codeMatch) {
            const code = codeMatch[0].match(/[A-Z]{4}$/)[0];
            
            let finalContent = blockContent.trim();

            // 5. Remove the TAF line so we only show NOTAMs
            // Remove everything from "TAF..." up to the first separator "*****"
            if(finalContent.includes("*******")) {
                 finalContent = finalContent.replace(/TAF\s+(?:AMD\s+|COR\s+)?[A-Z]{4}[\s\S]*?(?=\*)/, "");
            } else {
                 finalContent = finalContent.replace(/TAF\s+(?:AMD\s+|COR\s+)?[A-Z]{4}.*?(\r\n|\r|\n)/g, "");
            }

            finalContent = finalContent.trim();

            if (finalContent.length > 20 && !finalContent.includes("NO OPERATIONAL NOTAMS")) { 
                notamDB[code] = finalContent;
            } else if (finalContent.includes("NO OPERATIONAL NOTAMS")) {
                notamDB[code] = null;
            }
        }
    }
    return notamDB;
}


// ==========================================
// 6. RENDER FUNCTION UPDATE
// ==========================================

function renderWeatherUI(airportMap, data, ofpNotams) {
    const weatherDiv = document.getElementById('weather-container'); 
    if (!weatherDiv) return;
    
    weatherDiv.innerHTML = `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
        <div class="text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="m17 5-5-3-5 3"/><path d="m17 19-5 3-5-3"/></svg>
            Live Weather & OFP NOTAMs
        </div>
        <button onclick="window.refreshWeatherData()" class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-xs font-bold transition-all shadow-sm active:scale-95 active:bg-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
            <span>Refresh Weather</span>
        </button>
    </div>`;

    const listContainer = document.createElement('div');
    listContainer.className = "flex flex-col gap-4"; 
    weatherDiv.appendChild(listContainer);

    data.forEach(d => {
        const aptInfo = airportMap[d.code]; 
        if (!aptInfo) return;
        
        const notamText = ofpNotams ? ofpNotams[d.code] : null;
        const hasNotam = (notamText && notamText.length > 10);

        let cleanMetar = d.metarTxt ? d.metarTxt.trim() : null;
        if (cleanMetar && cleanMetar.match(/^\d{4}\//)) cleanMetar = cleanMetar.split('\n').slice(1).join('\n').trim();

        let cleanTaf = d.tafTxt ? d.tafTxt.trim() : null;
        if (cleanTaf && cleanTaf.match(/^\d{4}\//)) cleanTaf = cleanTaf.split('\n').slice(1).join('\n').trim();

        const metarOld = isMetarStale(cleanMetar);
        const tafOld = isTafStale(cleanTaf);
        const oldBadge = '<span class="ml-2 text-[9px] bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 font-bold uppercase tracking-wider">OLD</span>';

        const notamBtnHtml = hasNotam 
            ? `<button onclick="showNotamModal('${d.code}')" class="mt-auto w-full bg-slate-200 dark:bg-slate-700 hover:bg-blue-100 dark:hover:bg-blue-900 text-slate-700 dark:text-slate-200 text-[10px] font-bold py-2 px-2 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center gap-1 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                 View OFP NOTAMs
               </button>`
            : `<div class="mt-auto w-full text-center text-[9px] text-slate-300 dark:text-slate-600 font-mono italic select-none py-1">No OFP NOTAMs</div>`;

// NEW / FIXED CODE
const rolesHtml = aptInfo.roles.map(r => {
     let colorClass = "text-slate-500 dark:text-slate-400";
     if(r.type.includes("ALTN")) colorClass = "text-amber-600 dark:text-amber-500";
     if(r.type.includes("EDTO")) colorClass = "text-purple-600 dark:text-purple-400";
     if(r.type.includes("FEA")) colorClass = "text-green-600 dark:text-green-400";
     
     // FIX: Added id="${r.id}" below so the update function can find this line!
     return `<div id="${r.id}" class="whitespace-normal mb-1 leading-tight ${colorClass}" title="${r.text}">${r.text}</div>`;
}).join("");

        // Generate Decoded HTML on the fly
        const decodedMetarInner = decodeMetarHtml(cleanMetar);
        const decodedTafInner = decodeTafHtml(cleanTaf);

        const cardHtml = `
        <div class="flex flex-col sm:flex-row border border-slate-300 dark:border-slate-600 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-800 min-h-[160px]">
            <div class="sm:w-36 bg-slate-50 dark:bg-slate-900 border-b sm:border-b-0 sm:border-r border-slate-300 dark:border-slate-600 p-3 flex flex-col shrink-0">
                <div class="font-black text-2xl text-slate-800 dark:text-white mb-2 leading-none tracking-tight">${d.code}</div>
                <div class="flex flex-col gap-1 text-[10px] font-mono font-bold leading-tight mb-4">${rolesHtml}</div>
                
                <div class="bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg flex mb-4 border border-slate-300 dark:border-slate-700">
                    <button id="btn-decoded-${d.code}" onclick="toggleWeatherFormat('${d.code}', 'decoded')" class="flex-1 py-1.5 px-2 text-[10px] font-bold rounded text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all">Decoded</button>
                    <button id="btn-raw-${d.code}" onclick="toggleWeatherFormat('${d.code}', 'raw')" class="flex-1 py-1.5 px-2 text-[10px] font-bold rounded shadow-sm bg-white dark:bg-slate-600 text-slate-900 dark:text-white transition-all">Raw</button>
                </div>
                ${notamBtnHtml}
            </div>

            <div class="flex-1 min-w-0 bg-white dark:bg-slate-800 relative">
                
                <div id="view-raw-${d.code}" class="h-full flex flex-col">
                    <div class="p-3 border-b border-slate-200 dark:border-slate-700 ${metarOld?"bg-red-50 dark:bg-red-900/10":""}">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase">METAR</span>
                            ${metarOld ? oldBadge : ''}
                        </div>
                        <div class="font-mono text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 leading-tight whitespace-pre-wrap">${applyKeywords(cleanMetar||"N/A")}</div>
                    </div>
                    <div class="p-3 ${tafOld?"bg-red-50 dark:bg-red-900/10":""} flex-1">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase">TAF</span>
                            ${tafOld ? oldBadge : ''}
                        </div>
                        <div class="font-mono text-[10px] sm:text-xs text-slate-700 dark:text-slate-300 leading-tight whitespace-pre-wrap">${highlightTaf(cleanTaf||"N/A", aptInfo.time, aptInfo.dof)}</div>
                    </div>
                </div>

                <div id="view-decoded-${d.code}" class="hidden h-full flex flex-col">
                    <div class="p-4 border-b border-slate-200 dark:border-slate-700 ${metarOld?"bg-red-50 dark:bg-red-900/10":""}">
                         ${decodedMetarInner}
                         ${metarOld ? `<div class="mt-2 text-red-600 dark:text-red-400 text-xs font-bold uppercase flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Observation Outdated</div>` : ''}
                    </div>

                    <div class="p-4 flex-1 overflow-y-auto max-h-[400px] ${tafOld?"bg-red-50 dark:bg-red-900/10":""}">
                        <div class="flex items-center gap-2 mb-2">
                             <span class="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded font-bold">TAF</span>
                             ${tafOld ? oldBadge : ''}
                        </div>
                        ${decodedTafInner}
                    </div>
                </div>

            </div>
        </div>`;

        if(hasNotam) { window.sessionStorage.setItem(`notam-${d.code}`, notamText); }
        const wrapper = document.createElement('div');
        wrapper.innerHTML = cardHtml;
        listContainer.appendChild(wrapper.firstElementChild);
    });
}

async function fetchAndRenderWeather(sectors) {
    const uniqueAirports = {};
    const add = (code, roleObj) => {
        if (!code || code === '???') return;
        code = code.trim().toUpperCase();
        if (code.length < 3) return; 
        if (!uniqueAirports[code]) uniqueAirports[code] = { code, roles: [], dof: null };
        if(!uniqueAirports[code].roles.some(r => r.id === roleObj.id)) {
            uniqueAirports[code].roles.push(roleObj);
        }
    };

    sectors.forEach((s, index) => {
        const id = index + 1;
        const depTime = (s.std && s.std !== "--:--") ? `( ${s.std}Z )` : "";
        add(s.dep, { id: `wb-${id}-DEP`, label: `#${id} DEP`, text: `#${id} DEP ${depTime}`, type: 'DEP' }); 
        
        const arrTime = (s.sta && s.sta !== "--:--") ? `( ${s.sta}Z )` : "";
        add(s.dest, { id: `wb-${id}-ARR`, label: `#${id} ARR`, text: `#${id} ARR ${arrTime}`, type: 'ARR' });
        
        if (s.alt && s.alt.length >= 3) {
            const cleanAlt = s.alt.split('(')[0].trim();
            let altTimeStr = "";
            if (s.sta !== "--:--" && s.altFlightTime) {
                 const arrival = calculateTimeSum(s.sta, [s.altFlightTime.replace('.', ':')], 0);
                 altTimeStr = `( ${arrival}Z )`;
            }
            add(cleanAlt, { id: `wb-${id}-ALTN`, label: `#${id} ALTN`, text: `#${id} ALTN ${altTimeStr}`, type: 'ALTN' });
        }

        const finalFea = s.feaDetailsAirport || s.fea;
        if(finalFea && finalFea.length >= 3 && !finalFea.includes("APPLICABLE")) {
             const feaWin = s.feaWindow ? `( ${s.feaWindow} )` : "";
             add(finalFea, { id: `wb-${id}-FEA`, label: `#${id} FEA`, text: `#${id} FEA ${feaWin}`, type: 'FEA' });
        }

        if(s.edtoAltn && s.edtoAltn.length > 2 && !s.edtoAltn.includes("NON")) {
            const altnNames = s.edtoAltn.replace(/[^A-Z\s]/g, '').replace(/\bNM\b/g, '').trim().split(/\s+/).filter(x=>x.length>2);
            let t1="--:--", t2="--:--", t3="--:--", t4="--:--";
            if (s.std && s.std !== "--:--") {
                 let eep="", exp="", etp1="", etpDiv1="";
                 if (s.edtoPoints) {
                    const pEep = s.edtoPoints.find(p => p.type.includes("EEP")); if(pEep) eep=pEep.time;
                    const pExp = s.edtoPoints.find(p => p.type.includes("EXP")); if(pExp) exp=pExp.time;
                    const pEtp = s.edtoPoints.find(p => p.type.startsWith("ETP 1 (")); if(pEtp) etp1=pEtp.time;
                    const pDiv = s.edtoPoints.find(p => p.type === "ETP 1 to EA"); if(pDiv) etpDiv1=pDiv.time;
                }
                t1 = calculateTimeSum(s.std, [eep], 0);
                t2 = (etp1 && etpDiv1) ? calculateTimeSum(s.std, [etp1, etpDiv1], 60) : "---";
                t3 = (etp1 && etpDiv1) ? calculateTimeSum(s.std, [etp1, etpDiv1], -60) : "---";
                t4 = calculateTimeSum(s.std, [exp], 120);
            }

            altnNames.forEach((code, i) => {
                let timeStr = "";
                if(i===0) timeStr = `( ${t1}-${t2} )`;
                else if(i===1) timeStr = `( ${t3}-${t4} )`;
                add(code, { id: `wb-${id}-EDTO-${code}`, label: `#${id} EDTO`, text: `#${id} EDTO ${timeStr}`, type: 'EDTO' });
            });
        }
        
        [s.dep, s.dest].forEach(k => { if(uniqueAirports[k]) uniqueAirports[k].dof = s.dof; });
    });

    let ofpNotams = {};
    if (window.fullOfpText) {
        ofpNotams = extractNotamsFromText(window.fullOfpText);
    }

    const airportList = Object.keys(uniqueAirports);
    if (airportList.length === 0) return;
    
    renderWeatherPlaceholder();
    
async function getWeatherText(code, type) {
        const cacheBuster = `&_=${Date.now()}`;
        const proxy = 'https://corsproxy.io/?'; 

        // Timeout: Kill request if it hangs for more than 5 seconds
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); 

        // 1. Define URLs (NOW ALL PROXIED)
        // We route AviationWeather through the proxy too, to bypass CORS/Network blocks
        const urlAWC_Direct = type === 'METAR'
            ? `https://aviationweather.gov/api/data/metar?ids=${code}&format=raw${cacheBuster}`
            : `https://aviationweather.gov/api/data/taf?ids=${code}&format=raw${cacheBuster}`;
            
        const urlAWC_Proxied = proxy + encodeURIComponent(urlAWC_Direct);

        const urlNOAA = type === 'METAR' 
            ? `https://tgftp.nws.noaa.gov/data/observations/metar/stations/${code}.TXT`
            : `https://tgftp.nws.noaa.gov/data/forecasts/taf/stations/${code}.TXT`;
        const urlNOAA_Proxied = proxy + encodeURIComponent(urlNOAA) + cacheBuster;

        // --- ATTEMPT 1: AviationWeather (Via Proxy) ---
        try {
            console.log(`Fetching ${type} for ${code} from AWC (Proxied)...`);
            const res1 = await fetch(urlAWC_Proxied, { signal: controller.signal });
            clearTimeout(timeoutId); 
            
            if (res1.ok) {
                const text = await res1.text();
                // AWC returns empty string if not found
                if (text && text.length > 5) return text; 
            }
        } catch (e) { 
            console.warn(`AWC (Proxy) failed for ${code}:`, e);
        }

        // --- ATTEMPT 2: NOAA (Via Proxy) ---
        try {
            console.log(`Fetching ${type} for ${code} from NOAA (Proxy)...`);
            const res2 = await fetch(urlNOAA_Proxied);
            if (res2.ok) {
                const text = await res2.text();
                if (text && text.length > 5 && text.includes(code)) return text;
            }
        } catch (e) {
            console.warn(`NOAA Proxy failed for ${code}:`, e);
        }

        // --- ATTEMPT 3: CheckWX (Fail-Safe) ---
        if (typeof CHECKWX_API_KEY !== 'undefined' && CHECKWX_API_KEY && CHECKWX_API_KEY !== 'YOUR_API_KEY_HERE') {
            try {
                console.log(`Fetching ${type} for ${code} from CheckWX...`);
                const urlCheck = `https://api.checkwx.com/${type.toLowerCase()}/${code}?_=${Date.now()}`;
                const res3 = await fetch(urlCheck, { 
                    headers: { "X-API-Key": CHECKWX_API_KEY },
                    cache: "no-store"
                });
                
                if (res3.ok) {
                    const json = await res3.json();
                    if (json.data && json.data.length > 0) return json.data[0];
                }
            } catch (e) {
                console.warn(`CheckWX failed for ${code}:`, e);
            }
        }

        return null; // All sources failed
    }

    const promises = airportList.map(async (code) => {
        const metarTxt = await getWeatherText(code, 'METAR');
        const tafTxt = await getWeatherText(code, 'TAF');
        return { code, metarTxt, tafTxt };
    });
    
    try { 
        const results = await Promise.all(promises); 
        renderWeatherUI(uniqueAirports, results, ofpNotams); 
    } catch (e) { console.error(e); }
}

// ==========================================
// ADVANCED WEATHER DECODER (METAR & TAF)
// ==========================================

const WX_CODES = {
    '-': 'Light', '+': 'Heavy', 'VC': 'In Vicinity', 'MI': 'Shallow', 'BC': 'Patches',
    'DR': 'Low Drifting', 'BL': 'Blowing', 'SH': 'Showers', 'TS': 'Thunderstorm',
    'FZ': 'Freezing', 'PR': 'Partial', 'RA': 'Rain', 'DZ': 'Drizzle', 'SN': 'Snow',
    'SG': 'Snow Grains', 'IC': 'Ice Crystals', 'PL': 'Ice Pellets', 'GR': 'Hail',
    'GS': 'Small Hail', 'UP': 'Unknown Precip', 'BR': 'Mist', 'FG': 'Fog', 'FU': 'Smoke',
    'VA': 'Ash', 'DU': 'Dust', 'SA': 'Sand', 'HZ': 'Haze', 'PY': 'Spray', 'SQ': 'Squall',
    'PO': 'Dust Whirls', 'DS': 'Duststorm', 'SS': 'Sandstorm', 'FC': 'Funnel Cloud'
};

const CLOUD_CODES = { 'FEW': 'Few clouds', 'SCT': 'Scattered clouds', 'BKN': 'Broken clouds', 'OVC': 'Overcast', 'VV': 'Vertical Visibility', 'SKC': 'Sky Clear', 'CLR': 'Clear', 'NSC': 'No Sig. Clouds' };

// --- HELPER FUNCTIONS ---

function getCardinal(angle) {
    if (angle === 'VRB') return '';
    const val = parseInt(angle);
    if (isNaN(val)) return '';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return `(${directions[Math.round(val / 22.5) % 16]})`;
}

function calculateRH(temp, dew) {
    if (!temp || !dew) return null;
    const t = parseInt(temp.replace('M', '-'));
    const d = parseInt(dew.replace('M', '-'));
    // Magnus formula approximation
    const es = 6.112 * Math.exp((17.67 * t) / (t + 243.5));
    const e = 6.112 * Math.exp((17.67 * d) / (d + 243.5));
    const rh = Math.round((e / es) * 100);
    return rh > 100 ? 100 : rh;
}

function getFlightCategory(visMeters, ceilingFt) {
    // Simple NOAA classification
    // LIFR: Cig < 500 OR Vis < 1600m (1 mile)
    // IFR: Cig 500-1000 OR Vis 1600-4800m (1-3 miles)
    // MVFR: Cig 1000-3000 OR Vis 4800-8000m (3-5 miles)
    // VFR: Cig > 3000 AND Vis > 8000m
    
    let cat = "VFR";
    let color = "bg-green-600";
    
    const v = visMeters === 9999 ? 10000 : visMeters;
    const c = ceilingFt === null ? 10000 : ceilingFt; // If no ceiling (SKC/FEW/SCT), assume unlimited

    if (c < 500 || v < 1600) { cat = "LIFR"; color = "bg-pink-600"; }
    else if (c < 1000 || v < 5000) { cat = "IFR"; color = "bg-red-600"; }
    else if (c <= 3000 || v <= 8000) { cat = "MVFR"; color = "bg-blue-600"; }

    return `<span class="${color} text-white text-[10px] font-bold px-1.5 py-0.5 rounded ml-2">${cat}</span>`;
}

function parseMetarToken(t) {
    // 1. Wind
    let m = t.match(/^(\d{3}|VRB)(\d{2})(?:G(\d{2}))?KT$/);
    if (m) return { type: 'wind', val: `${m[1]}° ${getCardinal(m[1])} at ${parseInt(m[2])} knots${m[3]?` gusting ${m[3]}kt`:''}` };
    
    // 2. Visibility
    if (t === '9999') return { type: 'vis', val: '10 km or more', raw: 10000 };
    if (t === 'CAVOK') return { type: 'vis', val: '10 km or more (CAVOK)', raw: 10000, cavok: true };
    if (/^\d{4}$/.test(t)) return { type: 'vis', val: `${parseInt(t)} meters`, raw: parseInt(t) };
    
    // 3. Clouds
    m = t.match(/^([A-Z]{3})(\d{3})(CB|TCU)?$/);
    if (m) {
        const ft = parseInt(m[2]) * 100;
        return { type: 'cloud', val: `${CLOUD_CODES[m[1]]||m[1]} at ${ft} ft${m[3]?` (${m[3]})`:''}`, raw: ft, code: m[1] };
    }
    if (t === 'SKC' || t === 'CLR' || t === 'NSC') return { type: 'cloud', val: CLOUD_CODES[t], raw: null, code: t };

    // 4. METAR Temp/Dew (e.g. 30/25)
    m = t.match(/^(M?\d{2})\/(M?\d{2})$/);
    if (m) {
        const temp = m[1].replace('M', '-');
        const dew = m[2].replace('M', '-');
        const rh = calculateRH(temp, dew);
        return { type: 'temp', val: `${temp}°C`, dew: `${dew}°C`, rh: rh };
    }

    // --- NEW: TAF Max/Min Temp (e.g. TX32/3008Z) ---
    // Matches TX or TN, followed by Temp, Slash, Day, Hour, Z
    m = t.match(/^T([XN])(M?\d{2})\/(\d{2})(\d{2})Z$/);
    if (m) {
        const label = m[1] === 'X' ? 'Max Temp' : 'Min Temp';
        const temp = m[2].replace('M', '-');
        const day = m[3];
        const hour = m[4];
        // Returns a distinct type 'taf_temp'
        return { type: 'taf_temp', val: `<span class="font-bold text-slate-600 dark:text-slate-400">${label}:</span> ${temp}°C (Day ${day} @ ${hour}:00Z)` };
    }
    // ------------------------------------------------

    // 5. Pressure
    m = t.match(/^([QA])(\d{4})$/);
    if (m) return { type: 'pres', val: m[1]==='Q' ? `${m[2]} hPa` : `${m[2].substring(0,2)}.${m[2].substring(2)} inHg` };

    // 6. Weather Codes
    const wxRegex = /^(-|\+|VC)?(MI|BC|DR|BL|SH|TS|FZ|PR)?(RA|DZ|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|SQ|PO|DS|SS|FC)$/;
    m = t.match(wxRegex);
    if (m) {
        let s = "";
        if(m[1]) s += WX_CODES[m[1]] + " ";
        if(m[2]) s += WX_CODES[m[2]] + " ";
        if(m[3]) s += WX_CODES[m[3]];
        return { type: 'wx', val: s.trim().toLowerCase() };
    }
    
    if(t === 'NOSIG') return { type: 'trend', val: 'no significant changes' };

    return null;
}
// --- MAIN PARSERS ---

function decodeMetarHtml(rawText) {
    if (!rawText) return '<div class="text-slate-500 italic">No Data</div>';
    
    const tokens = rawText.trim().replace(/\s+/g, ' ').split(' ');
    const data = { winds:[], vis:null, clouds:[], temps:null, pres:null, wx:[], trend:null };
    let ceiling = null; // Lowest Broken or Overcast layer

    tokens.forEach(t => {
        const p = parseMetarToken(t);
        if(!p) return;
        if(p.type === 'wind') data.winds.push(p.val);
        if(p.type === 'vis') data.vis = p;
        if(p.type === 'cloud') {
            data.clouds.push(p.val);
            if((p.code === 'BKN' || p.code === 'OVC') && (ceiling === null || p.raw < ceiling)) ceiling = p.raw;
        }
        if(p.type === 'temp') data.temps = p;
        if(p.type === 'pres') data.pres = p.val;
        if(p.type === 'wx') data.wx.push(p.val);
        if(p.type === 'trend') data.trend = p.val;
    });

    const flightCat = getFlightCategory(data.vis ? data.vis.raw : 9999, ceiling);

    // Build Rows
    const row = (lbl, val) => `<div class="flex"><div class="w-24 shrink-0 text-slate-500 dark:text-slate-400 font-bold">${lbl}</div><div class="text-slate-800 dark:text-slate-200 font-mono">${val}</div></div>`;
    
    let html = `<div class="flex items-center mb-3"><span class="bg-blue-600 text-white text-xs px-2 py-0.5 rounded font-bold">METAR</span>${flightCat}</div><div class="space-y-1 text-xs sm:text-sm">`;
    
    if(data.winds.length > 0) html += row("Wind", data.winds.join(', '));
    if(data.vis) html += row("Visibility", data.vis.val);
    if(data.wx.length > 0) html += row("Weather", data.wx.join(', '));
    if(data.clouds.length > 0) html += row("Clouds", data.clouds.join('<br>'));
    else if(data.vis && data.vis.cavok) html += row("Clouds", "Ceiling and Visibility OK");
    else html += row("Clouds", "No significant clouds");
    
    if(data.temps) {
        html += row("Temperature", data.temps.val);
        html += row("Dew point", `${data.temps.dew}, Relative humidity: ${data.temps.rh}%`);
    }
    if(data.pres) html += row("Pressure", data.pres);
    if(data.trend) html += row("Trend", data.trend);

    html += `</div>`;
    return html;
}

function decodeTafHtml(rawTaf) {
    if (!rawTaf) return '<div class="text-slate-500 italic">No Data</div>';

    // Split blocks more intelligently
    const blocks = rawTaf.replace(/\n/g, ' ').replace(/FM(\d{6})/g, '\nFM$1').replace(/(BECMG|TEMPO|PROB\d{2})/g, '\n$1').split('\n').filter(x => x.trim().length > 0);
    
    let html = '<div class="space-y-4 mt-2">';

    blocks.forEach((block, idx) => {
        const parts = block.trim().split(' ');
        let title = "";
        let color = "text-slate-400";
        let contentTokens = parts;

        // Header Parsing
        if (idx === 0) {
            title = "Report Validity:"; 
            color = "text-slate-500";
        } 
        else if (parts[0].startsWith('FM')) {
            const d = parts[0].substring(2,4);
            const h = parts[0].substring(4,6);
            const m = parts[0].substring(6,8);
            title = `Forecast from ${h}:${m} (Day ${d}):`;
            color = "text-orange-600 dark:text-orange-400";
            contentTokens = parts.slice(1);
        }
        else if (parts[0] === 'TEMPO') {
            title = `Temporary ${parts[1] ? parts[1].replace('/', ' to ') : ''}:`;
            color = "text-orange-600 dark:text-orange-400";
            contentTokens = parts.slice(parts[1] && parts[1].includes('/') ? 2 : 1);
        }
        else if (parts[0] === 'BECMG') {
            title = `Becoming ${parts[1] ? parts[1].replace('/', ' to ') : ''}:`;
            color = "text-yellow-600 dark:text-yellow-400";
            contentTokens = parts.slice(parts[1] && parts[1].includes('/') ? 2 : 1);
        }
        else if (parts[0].startsWith('PROB')) {
            title = `Probability ${parts[0].substring(4)}% ${parts[1] ? parts[1].replace('/', ' to ') : ''}:`;
            color = "text-red-600 dark:text-red-400";
            contentTokens = parts.slice(parts[1] && parts[1].includes('/') ? 2 : 1);
        }

// Parse content of the block
        let lines = [];
        contentTokens.forEach(t => {
            const p = parseMetarToken(t);
            if(p) {
                if(p.type === 'wind') lines.push(p.val);
                else if(p.type === 'vis') lines.push(p.val);
                else if(p.type === 'wx') lines.push(p.val);
                else if(p.type === 'cloud') lines.push(p.val);
                
                // --- NEW: Add TAF Temp Support ---
                else if(p.type === 'taf_temp') lines.push(p.val);
                // ---------------------------------
            }
        });

        // Fallback for validity line or empty parses
        if(lines.length === 0) lines.push(contentTokens.join(' '));

        html += `
        <div class="border-l-2 border-slate-300 dark:border-slate-700 pl-3">
            <div class="${color} font-bold text-xs uppercase mb-1">${title}</div>
            <div class="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-mono space-y-0.5">
                ${lines.map(l => `<div>${l}</div>`).join('')}
            </div>
        </div>`;
    });

    html += '</div>';
    return html;
}


// 5. Update UI Toggle
window.toggleWeatherFormat = function(code, format) {
    const rawBtn = document.getElementById(`btn-raw-${code}`);
    const decBtn = document.getElementById(`btn-decoded-${code}`);
    const rawView = document.getElementById(`view-raw-${code}`);
    const decView = document.getElementById(`view-decoded-${code}`);

    if (format === 'raw') {
        rawBtn.classList.add('bg-white', 'dark:bg-slate-600', 'shadow-sm', 'text-slate-900', 'dark:text-white');
        rawBtn.classList.remove('text-slate-500');
        decBtn.classList.remove('bg-white', 'dark:bg-slate-600', 'shadow-sm', 'text-slate-900', 'dark:text-white');
        decBtn.classList.add('text-slate-500');
        rawView.classList.remove('hidden');
        decView.classList.add('hidden');
    } else {
        decBtn.classList.add('bg-white', 'dark:bg-slate-600', 'shadow-sm', 'text-slate-900', 'dark:text-white');
        decBtn.classList.remove('text-slate-500');
        rawBtn.classList.remove('bg-white', 'dark:bg-slate-600', 'shadow-sm', 'text-slate-900', 'dark:text-white');
        rawBtn.classList.add('text-slate-500');
        rawView.classList.add('hidden');
        decView.classList.remove('hidden');
    }
}

function renderCompanyNotamSection() {
    const container = document.getElementById('sectors-container');
    let notamDiv = document.getElementById('company-notam-card');
    
    // Create container if missing
    if (!notamDiv) {
        notamDiv = document.createElement('div');
        notamDiv.id = 'company-notam-card';
        // Insert BEFORE weather container
        const weatherDiv = document.getElementById('weather-container');
        if(weatherDiv) {
            container.insertBefore(notamDiv, weatherDiv);
        } else {
            container.appendChild(notamDiv);
        }
    }
    
    const text = window.currentCompanyNotams;
    if (!text) { notamDiv.innerHTML = ''; return; }

    // RENDER AS A CLEAN CARD BUTTON
    notamDiv.innerHTML = `
    <div onclick="showCompanyNotamModal()" class="cursor-pointer bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-4 group hover:border-purple-400 transition-all">
        <div class="p-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </div>
                <div>
                    <h4 class="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wide">Company NOTAMs</h4>
                    <p class="text-[10px] text-slate-500 dark:text-slate-400">Click to view full document</p>
                </div>
            </div>
            <div class="text-slate-300 dark:text-slate-600 group-hover:text-purple-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
        </div>
    </div>`;
}

function showNotamModal(code) {
    const rawNotam = window.sessionStorage.getItem(`notam-${code}`);
    if(!rawNotam) return;
    const modalHtml = `
    <div id="notam-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        <div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh]">
            <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-100 dark:bg-slate-800 rounded-t-xl">
                <h3 class="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><span class="bg-blue-600 text-white text-xs px-2 py-1 rounded">OFP</span> NOTAMs for ${code}</h3>
                <button onclick="document.getElementById('notam-modal').remove()" class="text-slate-400 hover:text-red-500 text-2xl leading-none">&times;</button>
            </div>
            <div class="p-4 overflow-y-auto font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed bg-white dark:bg-slate-900">
                ${highlightNotamKeywords(rawNotam)}
            </div>
            <div class="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-b-xl">
                <button onclick="document.getElementById('notam-modal').remove()" class="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 rounded text-sm transition-colors">Close</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function highlightNotamKeywords(text) {
    text = text.replace(/(\*{5,}[A-Z\s\/]+\*{5,})/g, '<div class="block w-full font-black text-slate-800 dark:text-white bg-slate-200 dark:bg-slate-700 py-1.5 px-3 rounded-md mt-8 mb-3 text-center text-xs tracking-[0.2em] border border-slate-300 dark:border-slate-600 shadow-sm uppercase">$1</div>');
    text = text.replace(/(?:^|\s)(?:NEW\s+|-\s+)?([A-Z]{4})\s+([A-Z]\d{4}\/\d{2})/g, '<div class="mt-4 pt-3 border-t border-dashed border-slate-300 dark:border-slate-700"></div><span class="font-bold text-slate-700 dark:text-slate-300">$1</span> <span class="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 rounded">$2</span>');
    text = text.replace(/\b(\d{2}[A-Z]{3}\d{4})\b/g, '<span class="font-bold text-amber-600 dark:text-amber-500">$1</span>');
    text = text.replace(/\b(CLSD|CLOSED|U\/S|UNSERVICEABLE)\b/g, '<span class="font-black text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-1 rounded">$1</span>');
    text = text.replace(/(\b\d{4,6}[NS]\s?\d{5,7}[EW]\b)/g, '<span class="font-mono text-emerald-600 dark:text-emerald-400 tracking-tighter">$1</span>');
    return text;
}


// --- COMPANY NOTAM FUNCTIONS ---

function extractCompanyNotams(fullText) {
    if (!fullText) return null;

    // Scan for Company Notams until a major section change
    const regex = /COMPANY\s+NOTAMS([\s\S]*?)(?=(?:DEPARTURE:|\|\s*STD\s*\||FPL-|END\s+OF\s+PLAN))/gi;
    
    let combinedText = "";
    let match;
    
    while ((match = regex.exec(fullText)) !== null) {
        combinedText += match[1] + "\n";
    }

    if (!combinedText) return null;

    // --- FIX: Aggressively force newlines before any NOTAM ID pattern ---
    // This handles cases like: "PERMITTED 0012/25" -> "PERMITTED \n 0012/25"
    // And specifically: "0007/13 BTU... 0012/25 WBGB..." -> "0007/13 BTU...\n0012/25 WBGB..."
    combinedText = combinedText.replace(/([^\r\n])\s*(\b[A-Z]?\d{4}\/\d{2}\b)/g, '$1\n$2');
    // ---------------------------------------------------------

    // Clean up garbage lines
    return combinedText.split('\n')
        .filter(line => {
            const l = line.trim();
            if (l.length < 3) return false;
            
            // Remove Page Headers
            if (/AIRASIA\s+BERHAD\s+BRIEF/i.test(l)) return false; 
            if (/PAGE\s+\d+\s+OF\s+\d+/i.test(l)) return false;
            
            // Remove ASCII Borders
            if (/^[\+\-\|\s]+$/.test(l)) return false; 

            return true;
        })
        .join('\n')
        .trim();
}

function formatCompanyNotams(text) {
    if (!text) return '<div class="text-center text-slate-400 italic">No content available</div>';
    
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    // Map stores: ID -> { title: string, content: string }
    const uniqueBlocks = new Map(); 
    
    let currentId = "GEN";
    let currentTitle = "General Info";
    let currentContent = [];
    
    // Regex to find the ID at the start of a line (e.g. 0014/25, S0057/22)
    const headerIdRegex = /^([A-Z]?\d{4}\/\d{2}|[A-Z]{3}\d{3}\/\d{2}|OCC\d{3}\/\d{2})/;

    const saveBlock = () => {
        if (currentContent.length > 0 || currentId !== "GEN") {
            const contentStr = currentContent.join('\n').trim();
            
            // FIX: Use currentId as the unique key, so we don't duplicate 0014/25
            const existing = uniqueBlocks.get(currentId);
            
            // FIX: If we already have this ID, only overwrite if the new one is LONGER.
            // This prevents short summaries on later pages from wiping out the full detail.
            if (!existing || contentStr.length > existing.content.length) {
                uniqueBlocks.set(currentId, { title: currentTitle, content: contentStr });
            }
        }
    };

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let nextLine = lines[i+1] || "";

        // Check for Header ID
        const idMatch = line.match(headerIdRegex);
        
        // Check for Text Header (Underlined)
        // FIX: Only treat as a "New Block" if we aren't already inside a specific ID block.
        // If we are in 0014/25, "MAINTENANCE..." should just be content, not a new block.
        const isTextHeader = /^\*+$/.test(nextLine);

        if (idMatch) {
            saveBlock(); // Save previous block
            currentId = idMatch[0]; // Use ID (e.g. "0014/25") as key
            currentTitle = line;    // Use full line as display title
            currentContent = [];
        } 
        else if (isTextHeader && currentId === "GEN") {
            // Only split on text headers if we haven't found a real ID yet
            saveBlock();
            currentId = line; // Use text as key fallback
            currentTitle = line;
            currentContent = [];
            i++; // Skip the underline
        } 
        else {
            // Filter separator lines
            if (!/^\*+$/.test(line)) {
                currentContent.push(line);
            }
        }
    }
    saveBlock(); // Save final block
    
    // Render HTML
    let html = "";
    // Sort by ID to keep them tidy (optional, or just iterate)
    uniqueBlocks.forEach((block, id) => {
        const title = block.title;
        const content = block.content;
        
        // Skip empty blocks that might result from parsing glitches
        if (!content && title === id) return;

        // Red styling for EFB/FlySmart
        const isEfb = title.includes("EFB") || title.includes("FLYSMART") || content.includes("EFB");
        
        const headerClass = isEfb 
            ? "bg-red-600 text-white border-red-700" 
            : "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-800";
            
        const bodyClass = isEfb
            ? "bg-red-50 dark:bg-red-900/10 text-slate-800 dark:text-slate-200"
            : "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300";

        html += `
        <div class="mb-3 rounded border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div class="${headerClass} px-3 py-2 border-b">
                <h4 class="font-bold text-xs font-mono uppercase tracking-wide">${title}</h4>
            </div>
            <div class="${bodyClass} p-2 text-[11px] font-mono whitespace-pre-wrap leading-relaxed">${content}</div>
        </div>`;
    });

    return html;
}

function showCompanyNotamModal() {
    const text = window.currentCompanyNotams;
    if (!text) { alert("No Company NOTAMs found."); return; }

    const modalHtml = `
    <div id="company-notam-modal" class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
        <div class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh]">
            <div class="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-purple-50 dark:bg-slate-800 rounded-t-xl">
                <h3 class="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <span class="bg-purple-600 text-white text-xs px-2 py-1 rounded shadow-sm">COMPANY</span>
                    NOTAMs
                </h3>
                <button onclick="document.getElementById('company-notam-modal').remove()" class="text-slate-400 hover:text-red-500 text-2xl leading-none">&times;</button>
            </div>
            
            <div class="p-4 overflow-y-auto bg-white dark:bg-slate-900 scroll-smooth">
                ${formatCompanyNotams(text)}
            </div>
            
            <div class="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-b-xl">
                <button onclick="document.getElementById('company-notam-modal').remove()" class="w-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 rounded text-sm transition-colors">Close</button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function toggleAppsMenu() {
    const menu = document.getElementById('apps-dropdown');
    if (menu) {
        menu.classList.toggle('hidden');
    }
}

// Close Apps menu if clicking outside
document.addEventListener('click', function(event) {
    const appsMenu = document.getElementById('apps-dropdown');
    // We need to check if the click target is NOT the button that toggles it
    const toggleBtn = event.target.closest('button[onclick="toggleAppsMenu()"]');
    
    if (appsMenu && !appsMenu.classList.contains('hidden') && !appsMenu.contains(event.target) && !toggleBtn) {
        appsMenu.classList.add('hidden');
    }
});

window.addEventListener('load', updateDBStatusUI);


// --- HELPER: WMKK Delivery Frequency Logic ---
function getDeliveryFrequency(dep, dest, route) {
    if (!dep || dep !== 'WMKK') return '';
    
    // Clean inputs for comparison
    const r = route ? route.toUpperCase() : "";
    const d = dest ? dest.toUpperCase() : "";

    // 1. Check for 126.00 Criteria
    // specific airways OR destination WSSS
    const airways126 = ["R208", "A334", "M626", "M644", "M751", "M771", "L625", "N884", "M758", "M761", "A464", "B470", "M635", "M774"];
    
    if (d === 'WSSS') return '126.00';
    for (let aw of airways126) {
        if (r.includes(aw)) return '126.00';
    }

    // 2. Check for 128.15 Criteria
    // specific airways OR Peninsular Malaysia (WMxx)
    const airways128 = ["Y501", "Y502", "A457", "R461", "N633", "P628", "L510", "N571", "P574", "B466"];
    
    // Check for Peninsular Malaysia (Starts with WM, but not WMKK)
    if (d.startsWith('WM') && d !== 'WMKK') return '128.15';
    
    for (let aw of airways128) {
        if (r.includes(aw)) return '128.15';
    }

    return ''; // No match found
}