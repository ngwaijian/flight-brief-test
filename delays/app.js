// Initialize Fuse.js (Fuzzy Search Tool)
// We removed the "Synonym Engine" because the data.js tags are now detailed enough.
const options = {
    includeScore: true,
    // Search in code, description, tags, AND category
    keys: [
        { name: 'code', weight: 0.4 }, // Increased weight for code matches
        { name: 'desc', weight: 0.4 },
        { name: 'tags', weight: 0.2 },
        { name: 'cat', weight: 0.1 }
    ],
    threshold: 0.2, // Slightly looser matching to help with typos
    ignoreLocation: true
};
const fuse = new Fuse(DELAY_CODES, options);

// DOM Elements
const searchInput = document.getElementById('searchInput');
const resultsDiv = document.getElementById('results');
const clearBtn = document.getElementById('clearBtn');

// Render Function
function renderCards(data) {
    resultsDiv.innerHTML = '';
    if (data.length === 0) {
        // Dark mode text support for empty state
        resultsDiv.innerHTML = '<div class="text-center text-slate-400 mt-10">No codes found.</div>';
        return;
    }

    data.forEach(item => {
        // Base classes: Light Mode | Dark Mode
        let cardBase = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200";
        let badgeBase = "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300";

        // Specific Category Overrides (Add dark variants)
        if (item.cat === "TECH") { 
            cardBase = "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900 text-red-900 dark:text-red-100"; 
            badgeBase = "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-100"; 
        }
        if (item.cat === "WX") { 
            cardBase = "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-100"; 
            badgeBase = "bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-100"; 
        }
        if (item.cat === "PAX") { 
            cardBase = "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-100"; 
            badgeBase = "bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-100"; 
        }
        if (item.cat === "RAMP") { 
            cardBase = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100"; 
            badgeBase = "bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100"; 
        }

        // Logic to display Code + Subcode
        let displayCode = item.code;
        if (item.sub) {
            displayCode = `<span class="text-2xl font-black tracking-tighter">${item.code}</span> <span class="text-xl font-bold opacity-75">${item.sub}</span>`;
        } else {
             displayCode = `<span class="text-2xl font-black tracking-tighter">${item.code}</span>`;
        }

        const html = `
        <div class="code-card ${cardBase} border rounded-lg p-3 shadow-sm flex flex-col gap-1.5">
            <div class="flex justify-between items-center">
                <div class="flex items-baseline gap-1">
                    ${displayCode}
                </div>
                <span class="${badgeBase} text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">${item.cat}</span>
            </div>
            
            <div class="text-sm font-black uppercase leading-tight tracking-wide border-t border-black/10 dark:border-white/10 pt-1.5">
                ${item.desc}
            </div>

            <div class="text-xs font-normal opacity-80 leading-snug">
                ${item.detail}
            </div>
        </div>`;
        resultsDiv.innerHTML += html;
    });
}

// Search Logic
searchInput.addEventListener('input', (e) => {
    let query = e.target.value.toLowerCase().trim();
    
    // Show/Hide Clear Button
    clearBtn.classList.toggle('hidden', query.length === 0);

    if (query.length === 0) {
        renderCards(DELAY_CODES);
        return;
    }

    // 2. Perform Search directly
    const results = fuse.search(query);
    const flatResults = results.map(r => r.item);
    renderCards(flatResults);
});

// Clear Search
clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    renderCards(DELAY_CODES);
    clearBtn.classList.add('hidden');
    searchInput.focus();
});

// Filter Buttons
window.filterCat = function(cat) {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    if (cat === 'ALL') {
        renderCards(DELAY_CODES);
    } else {
        const filtered = DELAY_CODES.filter(d => d.cat === cat || (cat === 'RAMP' && (d.cat === 'RAMP' || d.cat === 'OPS'))); 
        renderCards(filtered);
    }
}

// Initial Render
renderCards(DELAY_CODES);