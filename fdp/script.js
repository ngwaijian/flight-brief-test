document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupTabs();
    setupInputs();
    document.getElementById('calc-btn').addEventListener('click', calculateFDP);
});

// --- THEME & UI SETUP ---
document.addEventListener('DOMContentLoaded', () => {
    // REMOVED initTheme() - The Head Script handles this now!
    setupTabs();
    setupInputs();
    document.getElementById('calc-btn').addEventListener('click', calculateFDP);
    
    // CONNECT THE BUTTON TO THE SYNC ENGINE
    const themeBtn = document.getElementById('theme-toggle');
    if(themeBtn) {
        themeBtn.addEventListener('click', () => {
            // Call the global function defined in index.html <head>
            if(window.toggleTheme) window.toggleTheme(); 
        });
    }
});

// REMOVE THE OLD initTheme() FUNCTION COMPLETELY

function setupTabs() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Update
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show Fields
            const type = btn.dataset.type;
            document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`${type}-fields`).classList.add('active');
            
            // Hide Results (reset view)
            document.getElementById('empty-results').style.display = 'flex';
            document.getElementById('results-content').classList.add('hidden');
        });
    });
}

function setupInputs() {
    // Acclimatisation Toggle
    const accToggle = document.getElementById('isAcclimatised');
    const restField = document.getElementById('rest-duration-field');
    accToggle.addEventListener('change', () => {
        restField.classList.toggle('hidden', accToggle.checked);
    });
}

// --- DATA TABLES (Unchanged) ---
const tableAcclimatised = {
    "0600-0759": [13, 12.25, 11.5, 10.75, 10, 9.5, 9, 9],
    "0800-1259": [14, 13.25, 12.5, 11.75, 11, 10.5, 10, 9.5],
    "1300-1759": [13, 12.25, 11.5, 10.75, 10, 9.5, 9, 9],
    "1800-2159": [12, 11.25, 10.5, 9.75, 9, 9, 9, 9],
    "2200-0559": [11, 10.25, 9.5, 9, 9, 9, 9, 9]
};

const tableNotAcclimatised = {
    "low": [13, 12.25, 11.5, 10.75, 10, 9.25, 9, 9],
    "high": [13, 12.25, 11.5, 10.75, 10, 9.25, 9, 9],
    "medium": [11.5, 11, 10.5, 9.75, 9, 9, 9, 9]
};

// --- LOGIC ---
function calculateFDP() {
    try {
        const type = document.querySelector('.nav-btn.active').dataset.type;
        const sectors = parseInt(document.getElementById('sectors').value);
        let res = {};

        // 1. NORMAL
        if (type === 'normal') {
            const report = document.getElementById('reportTime').value;
            const signOff = document.getElementById('signOffNormal').value;
            if(!report) return alert("Enter Reporting Time");

            const limit = getLimit(report, sectors);
            res = calcDuty(report, limit, report, signOff);
        }
        // 2. STANDBY
        else if (type === 'standby') {
            const start = document.getElementById('standbyStartTime').value;
            const report = document.getElementById('reportTimeStandby').value;
            const notice = document.getElementById('noticeTime').value;
            const signOff = document.getElementById('signOffStandby').value;

            if(!start || !report) return alert("Enter Standby Start & Actual Report");

            const sbDur = getDiff(start, report);
            if(sbDur > 12) return alert("Standby exceeds 12h");

            let isShortNotice = false;
            
            // Logic: Check if Night Standby AND Notification Provided AND Short Notice
            const startMins = toMins(start);
            // 22:00 = 1320 mins, 08:00 = 480 mins
            const isNight = (startMins >= 1320 || startMins <= 480);
            
            if(isNight && notice) {
                if(getDiff(notice, report) <= 2.05) { // 2h 05m buffer
                    isShortNotice = true;
                }
            }

            let fdpStart = start; 
            let limit = 0;

            if(isShortNotice) {
                fdpStart = report; // Reset to report
                limit = getLimit(report, sectors);
            } else {
                const l1 = getLimit(start, sectors);
                const l2 = getLimit(report, sectors);
                const base = Math.min(l1, l2);
                limit = (sbDur <= 6) ? (base + sbDur) : (base + 6);
            }
            // Duty always counts from Standby Start
            res = calcDuty(fdpStart, limit, start, signOff);
        }
        // 3. DELAYED REPORTING
        else if (type === 'delayed') {
            const orig = document.getElementById('originalReportTime').value;
            const act = document.getElementById('actualReportTime').value;
            const signOff = document.getElementById('signOffDelayed').value;

            if(!orig || !act) return alert("Enter both times");

            const delay = getDiff(orig, act);
            const l1 = getLimit(orig, sectors);
            const l2 = getLimit(act, sectors);

            let fdpStart, limit;
            if(delay < 4) {
                fdpStart = act;
                limit = l1;
            } else {
                fdpStart = addTime(orig, 4);
                limit = Math.min(l1, l2);
            }
            res = calcDuty(fdpStart, limit, fdpStart, signOff);
        }

        display(res);

    } catch (e) { console.error(e); }
}

function getLimit(time, sectors) {
    const isAcc = document.getElementById('isAcclimatised').checked;
    const idx = Math.min(sectors - 1, 7);

    if(isAcc) {
        return tableAcclimatised[getBand(time)][idx];
    } else {
        const val = document.getElementById('restDuration').value;
        const key = (val === 'medium') ? 'medium' : 'low'; 
        return tableNotAcclimatised[key][idx];
    }
}

function calcDuty(fdpStart, limit, dutyStart, signOff) {
    const legalEnd = addTime(fdpStart, limit);
    const maxExt = addTime(legalEnd, 3);
    
    let total = "--:--", next = "--:--", isBust = false;

    if(signOff) {
        // FDP Bust Check
        const fdpDur = getDiff(fdpStart, signOff);
        if(fdpDur > limit) isBust = true;

        // Total Duty & Next Report
        const dutyDur = getDiff(dutyStart, signOff);
        total = fromMins(Math.round(dutyDur * 60));
        next = addTime(signOff, Math.max(12, dutyDur));
    }

    return { limit, legalEnd, maxExt, total, next, isBust };
}

function display(d) {
    const limitH = Math.floor(d.limit);
    const limitM = Math.round((d.limit % 1) * 60);

    document.getElementById('disp-limit').innerText = `${limitH}h ${limitM}m`;
    document.getElementById('disp-legal').innerText = d.legalEnd;
    document.getElementById('disp-max').innerText = d.maxExt;
    document.getElementById('disp-duty').innerText = d.total;
    document.getElementById('disp-next').innerText = d.next;

    const alertBox = document.getElementById('alert-msg');
    const legalBox = document.querySelector('.result-card.highlight');
    
    if(d.isBust) {
        alertBox.classList.remove('hidden');
        legalBox.style.backgroundColor = 'var(--danger)';
    } else {
        alertBox.classList.add('hidden');
        legalBox.style.backgroundColor = ''; // Reset to CSS default
    }

    document.getElementById('empty-results').style.display = 'none';
    document.getElementById('results-content').classList.remove('hidden');
}

// --- HELPERS ---
function toMins(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function fromMins(m) { 
    let h = Math.floor(m/60) % 24; let min = Math.round(m%60);
    if(min===60){min=0; h=(h+1)%24;}
    return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
}
function addTime(t, h) { return fromMins(toMins(t) + h * 60); }
function getDiff(s, e) {
    let sm = toMins(s), em = toMins(e);
    if(em < sm) em += 1440;
    return (em - sm) / 60;
}
function getBand(t) {
    const v = parseInt(t.replace(':',''));
    if(v>=600 && v<=759) return "0600-0759";
    if(v>=800 && v<=1259) return "0800-1259";
    if(v>=1300 && v<=1759) return "1300-1759";
    if(v>=1800 && v<=2159) return "1800-2159";
    return "2200-0559";
}

// Add this inside setupInputs() or at the bottom of the script
document.getElementById('reset-btn').addEventListener('click', () => {
    // 1. Clear all inputs
    document.querySelectorAll('input').forEach(i => {
        if(i.type === 'checkbox') i.checked = true; // Reset toggles to default
        else i.value = '';
    });
    
    // 2. Reset Selects
    document.getElementById('sectors').value = "1";
    document.getElementById('restDuration').value = "low";

    // 3. Hide Results
    document.getElementById('empty-results').style.display = 'flex';
    document.getElementById('results-content').classList.add('hidden');
    document.getElementById('alert-msg').classList.add('hidden');
    
    // 4. Reset Highlights
    document.querySelectorAll('.result-card').forEach(c => c.style.backgroundColor = '');
});