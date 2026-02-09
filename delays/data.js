const DELAY_CODES = [
    // --- SYSTEM (00-09) ---
    { code: "002", sub: "", desc: "SYSTEM DOWN", cat: "SYS", tags: "system", detail: "" },
    { code: "002", sub: "A", desc: "CHECK-IN/BOARDING", cat: "SYS", tags: "computer offline navitaire", detail: "Navitaire booking system down" },
    { code: "002", sub: "B", desc: "OPS/AIMS/REDCREW/REDWATCH", cat: "SYS", tags: "navtech aims", detail: "Navtech, Redwatch, Redcrew, AIMS down" },
    { code: "002", sub: "C", desc: "NETWORK/INTERNET", cat: "SYS", tags: "wifi connection offline", detail: "no network connection" },
    { code: "002", sub: "D", desc: "PLANNED POWER OUTAGE", cat: "SYS", tags: "blackout electricity", detail: "unscheduled extension of planned works" },

    { code: "003", sub: "", desc: "MANDATORY SECURITY CHECK BY AIRLINE", cat: "SEC", tags: "security", detail: "Security process required - regulation security check (for Cpt. request use code 69, for Aiport security use code 85)" },
    { code: "003", sub: "A", desc: "Late Airline security staff", cat: "SEC", tags: "security check staff", detail: "Airline security staff come late to A/C for A/C antisabotage process or any mandatory security process" },
    { code: "003", sub: "B", desc: "Security Process", cat: "SEC", tags: "security search antisabotage", detail: "A/C Antisabotage check taking longer time because Airline security personal found suspicious item" },

    { code: "004", sub: "", desc: "GATE NO SHOW PASSENGER BAG NOT FOUND", cat: "PAX", tags: "offload missing bag", detail: "pax offloaded but bag is not found (awaiting Security at aircraft, awaiting Security procedures)" },
    { code: "005", sub: "", desc: "GATE NO SHOW PASSENGER DELAY 5MINS OR LESS", cat: "PAX", tags: "offload quick", detail: "if offload procedures started ontime and ends within 15 minutes" },
    { code: "006", sub: "", desc: "RAMP CONGESTION (SELF INDUCED)", cat: "RAMP", tags: "apron bay blocked", detail: "shortage of gates/stands and restricting movements (due to too many a/c at the same time)" },
    { code: "007", sub: "", desc: "GATE NO SHOW PASSANGER DELAY FOR GS", cat: "PAX", tags: "ground staff error", detail: "Gate to be closed and offload procedure to commence at STD/ETD-10 minutes" },
    { code: "008", sub: "", desc: "GATE NO SHOW PASSENGER DELAY FOR RAMP", cat: "RAMP", tags: "baggage offload slow", detail: "Ramp must proceed offloading within 15 minutes of being notified" },

    // --- PAX & CHECK-IN (10-29) ---
    { code: "011", sub: "", desc: "LATE CHECK-IN", cat: "PAX", tags: "counter cutoff", detail: "pax check-in accepted after cut-off time" },
    
    { code: "013", sub: "", desc: "CHECK-IN ERRORS PAX/BAGGAGE", cat: "PAX", tags: "wrong name tag", detail: "printing of incorrect boarding cards, incorrect baggage tags, no check documents booking errors, name errors, overbooking, rebooking, ID90 clash" },
    
    { code: "014", sub: "", desc: "BOOKING ERRORS", cat: "PAX", tags: "booking", detail: "" },
    { code: "014", sub: "A", desc: "OVERBOOKING", cat: "PAX", tags: "oversold", detail: "Advance Overbooking" },
    { code: "014", sub: "B", desc: "OVERBOOKING DUE TO AIRCRAFT DOWNSIZE", cat: "PAX", tags: "swap smaller aircraft", detail: "Downsize happens 60mins before STD/ETD" },

    { code: "015", sub: "", desc: "BOARDING AND DEBOARDING DISRCREPANCIES", cat: "PAX", tags: "boarding", detail: "DO NOT USE without SUB CODE" },
    { code: "015", sub: "A", desc: "PAX FIGURE DISCREPANCY", cat: "PAX", tags: "headcount count error", detail: "incorrect TOB by gs at the gate (incorrect headcount by cabin crew use 66c)" },
    { code: "015", sub: "B", desc: "LATE COMPLETION OF DEBOARDING", cat: "PAX", tags: "slow deplane", detail: "no PAX assistance, blocked walkway, congested gate area, deboarding taking longer time than it should be, NOT if late PBB or late equipment" },
    { code: "015", sub: "C", desc: "SLOW BOARDING", cat: "PAX", tags: "slow pax", detail: "long boarding duration (if not affected by PRM handling)" },
    { code: "015", sub: "D", desc: "EXCESS CABIN LUGGAGE", cat: "PAX", tags: "gate bag overhead", detail: "offload cabin bags to cargo" },
    { code: "015", sub: "E", desc: "LATE GATE CLOSURE", cat: "PAX", tags: "gate open", detail: "acceptance of PAX at STD/ETD 10 minutes" },
    { code: "015", sub: "F", desc: "DOCUMENTATION ISSUES", cat: "PAX", tags: "lost bp manifest", detail: "PAX lost boarding pass, incorrect manifest, missing forms" },
    { code: "015", sub: "G", desc: "GS PERSONNEL LATE TO AIRCRAFT", cat: "PAX", tags: "ground staff missing", detail: "not showing up at aircraft in time" },
    { code: "015", sub: "H", desc: "LATE INITIATION OF BOARDING", cat: "PAX", tags: "boarding start", detail: "late start of boarding despite crew and aircraft ready" },
    { code: "015", sub: "I", desc: "WRONGLY BOARDED PAX", cat: "PAX", tags: "wrong flight", detail: "PAX on wrong flight" },
    { code: "015", sub: "K", desc: "DEBOARDING LF MORE THAN 85% WITHIN 25 OR LESS AVAILABLE GROUND TIME & AERO BRIDGE", cat: "PAX", tags: "full flight deplane", detail: "long deboarding duration due to high load factor. Pax number should be in the Memo. Max 5min delay only" },
    { code: "015", sub: "L", desc: "BOARDING LF MORE THAN 85% WITHIN 25 OR LESS AVAILABLE GROUND TIME & AERO BRIDGE", cat: "PAX", tags: "full flight board", detail: "long boarding duration due to high load factor. Pax number should be in the Memo. Max 5min delay only" },
    { code: "015", sub: "M", desc: "SLOW BOARDING CCD", cat: "PAX", tags: "zone boarding", detail: "The last guest is out from Gates at D-7 with Zone boarding & handcarry" },

    { code: "016", sub: "", desc: "COMMERCIAL PUBLICITY/VIP HANDLING", cat: "OPS", tags: "publicity", detail: "" },
    { code: "016", sub: "A", desc: "PUBLICITY/PRESS EVENT", cat: "OPS", tags: "media press", detail: "publicity e.g. route launch" },
    { code: "016", sub: "B", desc: "VIP HANDLING", cat: "OPS", tags: "vip", detail: "special VIP handling at gate" },

    { code: "017", sub: "", desc: "CATERING (3RD PARTY ONLY)", cat: "RAMP", tags: "external caterer food", detail: "for external caterer" },

    { code: "018", sub: "", desc: "BAGGAGE PROCESSING", cat: "RAMP", tags: "baggage", detail: "" },
    { code: "018", sub: "A", desc: "PROCESSING AND SORTING OF BAGGAGE", cat: "RAMP", tags: "sorting belt", detail: "Processing and sorting of baggage" },
    { code: "018", sub: "B", desc: "MIXED LOCAL AND FLY-THRU BAGS", cat: "RAMP", tags: "transfer bag", detail: "late delivery of baggage (due to waiting fly-through use 91)" },
    { code: "018", sub: "C", desc: "LATE BREAK-UP PROVISION", cat: "RAMP", tags: "break up", detail: "late breakup to PIC delaying further processes" },
    { code: "018", sub: "D", desc: "LATE COLLECTION/PROVISION OF WC/STROLLERS", cat: "RAMP", tags: "gate check delivery", detail: "late end of deboarding due to PAX awaiting WC/stroller or late door close due to loading of strollers" },
   { code: "018", sub: "E", desc: "LATE COMPLETION OF LOADING", cat: "RAMP", tags: "loading baggage cargo", detail: "if no further breakdown known" },

    { code: "019", sub: "", desc: "PRM HANDLING (PAX WITH REDUCED MOBILITY)", cat: "PAX", tags: "prm", detail: "" },
    { code: "019", sub: "A", desc: "LATE DEBOARDING", cat: "PAX", tags: "wheelchair staff", detail: "lack of/late staff, late WC provision" },
    { code: "019", sub: "B", desc: "LATE BOARDING", cat: "PAX", tags: "wheelchair staff", detail: "lack of/late staff, late loading of WC" },
    { code: "019", sub: "C", desc: "LATE ASSISTANCE REQUEST FROM PAX", cat: "PAX", tags: "last minute wheelchair", detail: "last minute request from PAX, not pre-booked" },
    { code: "019", sub: "E", desc: "SLOW DEBOARDING OF PRM", cat: "PAX", tags: "slow wheelchair", detail: "slow PRM movement, blocking and deboarding" },
    { code: "019", sub: "F", desc: "SLOW BOARDING OF PRM", cat: "PAX", tags: "slow wheelchair", detail: "slow PRM movement, blocking and boarding" },
    { code: "019", sub: "G", desc: "LACK OF/LATE AMBULIFT", cat: "RAMP", tags: "lift truck highloader", detail: "Late ambulift" },

    { code: "020", sub: "", desc: "PAX ISSUES/DISRUPTIVE PAX", cat: "PAX", tags: "issues", detail: "" },
    { code: "020", sub: "A", desc: "DISRUPTIVE PAX", cat: "PAX", tags: "fight drunk police", detail: "at gate or aircraft" },
    { code: "020", sub: "B", desc: "PAX DOCUMENTS/ITEMS", cat: "PAX", tags: "lost passport", detail: "PAX lost documents (boarding pass, passport, ID card, etc) special hand carry items" },
    { code: "020", sub: "C", desc: "PAX CANCEL TRAVEL", cat: "PAX", tags: "passenger cancel offload", detail: "PAX last minute decides to cancel travel" },
    { code: "020", sub: "D", desc: "MEDICAL ISSUE", cat: "PAX", tags: "sick ill doctor", detail: "PAX requires medical assistance / offloading of sick or injured PAX" },
    { code: "020", sub: "E", desc: "EXCESSIVE NUMBER OF PRM", cat: "PAX", tags: "many wheelchairs", detail: "unusual high amount of PRM (more than 3 per turnaround A320)" },

    { code: "021", sub: "", desc: "CARGO", cat: "RAMP", tags: "cargo", detail: "" },
    { code: "021", sub: "A", desc: "DOCUMENTATION ERROR", cat: "RAMP", tags: "manifest error", detail: "cargo documentation, corrections required or mistakes on manifest" },
    { code: "021", sub: "B", desc: "LATE POSITIONING", cat: "RAMP", tags: "warehouse transfer", detail: "late transfer of cargo from warehouse to aircraft" },
    { code: "021", sub: "C", desc: "LATE ACCEPTANCE", cat: "RAMP", tags: "cutoff cargo", detail: "cut-off is 2 hours prior to STD" },
    { code: "021", sub: "D", desc: "INADEQUATE PACKING", cat: "RAMP", tags: "repack cargo", detail: "repack equired or refusal/offload of consignment" },
    { code: "021", sub: "E", desc: "LOAD DISCREPANCY", cat: "RAMP", tags: "wrong weight", detail: "incorrect weight/details of load provided to OCC/crew" },
    { code: "021", sub: "F", desc: "HIGH LOAD", cat: "RAMP", tags: "volume split", detail: "load being too large (volume/mass) requiring splitting/offloading or more than total deadload of 11.5 tonnes (In and Out)" },
    { code: "021", sub: "G", desc: "LATE/LACK OF PERSONNEL", cat: "RAMP", tags: "personnel", detail: "late arrival of cargo personnel" },

    { code: "091", sub: "", desc: "FLY-THRU (PAX/BAG/CARGO CONNECTION)", cat: "PAX", tags: "connecting pax transfer", detail: "awaiting load (pax/baggage/cargo) from another flight" },

    // --- RAMP (30-39) ---
    { code: "031", sub: "", desc: "FLIGHT DOCUMENTS", cat: "RAMP", tags: "docs", detail: "" },
    { code: "031", sub: "A", desc: "LATE OR INNACURATE PAX MANIFEST", cat: "RAMP", tags: "paperwork gd", detail: "late provision of pax manifest or inaccurate pax manifest from GS to Crew" },
    { code: "031", sub: "B", desc: "LATE GENERAL DECLARATION", cat: "RAMP", tags: "gd paperwork", detail: "late provision of GD from GS to crew" },
    { code: "031", sub: "C", desc: "LATE FINAL PAX FIGURE", cat: "RAMP", tags: "tob loadsheet", detail: "late provision of TOB or last minute TOB change" },

    { code: "032", sub: "", desc: "LOADING OF SPECIAL OR BULKY LOAD, LACK OF STAFF, LACK OF SPACE", cat: "RAMP", tags: "loading", detail: "" },
    { code: "032", sub: "A", desc: "LOADING/UNLOADING A BULKY OR SPECIAL LOAD", cat: "RAMP", tags: "heavy cargo", detail: "slow loading of exceptional items (large / delicate)" },
    { code: "032", sub: "B", desc: "LACK OF/LATE STAFF", cat: "RAMP", tags: "manpower", detail: "delays caused by lack of loading staff" },
    { code: "032", sub: "D", desc: "VOLUMETRIC/SPACE PROBLEMS", cat: "RAMP", tags: "no space", detail: "lack of space, rearrange of luggage" },
    { code: "032", sub: "E", desc: "WRONG LOADING", cat: "RAMP", tags: "instruction", detail: "not following instructions" },
    { code: "032", sub: "F", desc: "HIGH LOAD", cat: "RAMP", tags: "heavy bags", detail: "unusual high amount of bags (>11.5 tonnes)" },

    { code: "033", sub: "", desc: "LATE/LACK OR BREAKDOWN LOADING EQUIPMENT", cat: "RAMP", tags: "breakdown gse", detail: "delays due to loading equipment shortage/ breakdown" },

    { code: "034", sub: "", desc: "LATE/LACK OR BREAKDOWN OF SERVICING EQUIPMENT", cat: "RAMP", tags: "gse", detail: "" },
    { code: "034", sub: "A", desc: "AEROBRIDGE/PLB/AVIOBRIDGE OPERATOR", cat: "RAMP", tags: "bridge driver", detail: "late movement of aerobridge / PLB, causing either late door open or late pushback" },
    { code: "034", sub: "B", desc: "PAX STAIRS", cat: "RAMP", tags: "steps", detail: "late provision/disconnection, causing either late door open or late PB (late 3rd part staff: 87E)" },
    { code: "034", sub: "C", desc: "BUS/PAX TRANSPORT/AMBULIFT", cat: "RAMP", tags: "van coach", detail: "late lack of busses, transport, ambulift" },
    { code: "034", sub: "D", desc: "WATER SERVICE", cat: "RAMP", tags: "potable water", detail: "late/lack of water service equipment, Low quality of portable water supplied" },
    { code: "034", sub: "E", desc: "WASTE SERVICE", cat: "RAMP", tags: "lavatory toilet", detail: "late/lack of waste service equipment" },
    { code: "034", sub: "G", desc: "PUSHBACK TUG/TOWBAR", cat: "RAMP", tags: "truck broken", detail: "late provision of towbar or late connection / breakdown of tug" },
    { code: "034", sub: "H", desc: "DE-/ANTI-ICING", cat: "RAMP", tags: "winter ice", detail: "late arrival of de-icing equipment use 34H" },
    { code: "034", sub: "J", desc: "GPU/ASU", cat: "RAMP", tags: "power air start", detail: "late provision of ground power or air starter unit despite early request" },

    { code: "035", sub: "", desc: "AIRCRAFT CLEANING (3RD PARTY ONLY)", cat: "RAMP", tags: "cleaning", detail: "requirements of supplementary cleaning of aircraft interior" },
    { code: "035", sub: "A", desc: "LATE COMPLETION OF CLEANING", cat: "RAMP", tags: "cleaner grooming", detail: "cleaning process taking longer time than it supposed to be" },
    { code: "035", sub: "B", desc: "ADDITIONAL CLEANING PROCEDURE", cat: "RAMP", tags: "disinfectant", detail: "if additional procedure required (e.g mandatory disinfectant)" },
    { code: "035", sub: "C", desc: "BREAKDOWN OF CLEANING EQUIPMENT", cat: "RAMP", tags: "vacuum broken", detail: "if cleaning equipment breakdown during the cleaning process" },
    { code: "035", sub: "D", desc: "LATE/LACK OF PERSONNEL TO AIRCRAFT", cat: "RAMP", tags: "cleaner missing", detail: "cleaning staff not showing up at aircraft in time" },

    // --- FUEL (36 & 70) ---
    { code: "036", sub: "", desc: "FUELING/DEFUELING", cat: "RAMP", tags: "fuel petrol oil vendor", detail: "delay due to fuel vendor" },
    { code: "036", sub: "A", desc: "BREAKDOWN OF FUEL TRUCK", cat: "RAMP", tags: "fuel truck bowser broken", detail: "breakdown of bowser/bowser depleted" },
    { code: "036", sub: "B", desc: "LACK OF/LATE FUEL TRUCK/BOWSER", cat: "RAMP", tags: "fuel truck bowser waiting", detail: "late arrival of fuel truck" },
    { code: "036", sub: "C", desc: "SLOW FUELING", cat: "RAMP", tags: "pressure flow", detail: "late completion despite fueler on time" },
    { code: "036", sub: "D", desc: "DEFUELING", cat: "RAMP", tags: "remove fuel", detail: "Requirement to remove fuel" },
    { code: "036", sub: "E", desc: "FUELING ERROR/SPILL", cat: "RAMP", tags: "spill safety", detail: "Fueling error or spill cleanup" },

    { code: "070", sub: "", desc: "LATE COMPLETION OF FUELING", cat: "OPS", tags: "fuel airline crew", detail: "delay due to Airline" },
    { code: "070", sub: "A", desc: "LATE FUEL FIGURE", cat: "OPS", tags: "captain fuel", detail: "late fuel figure by PIC" },
    { code: "070", sub: "B", desc: "WRONG FUEL FIGURE/FUELING ERROR", cat: "OPS", tags: "error fuel", detail: "wrong fuel figure / second figure by PIC" },
    { code: "070", sub: "C", desc: "HIGH FINAL FUEL", cat: "OPS", tags: "uplift", detail: "Uplift 12.000 litres (A320) within 25min turnaround" },

    // --- CATERING (37) ---
    { code: "037", sub: "", desc: "CATERING", cat: "RAMP", tags: "catering", detail: "" },
    { code: "037", sub: "A", desc: "BREAKDOWN OF CATERING EQUIPMENT", cat: "RAMP", tags: "food truck broken", detail: "breakdown of catering equipment on stand" },
    { code: "037", sub: "B", desc: "LACK OF/LATE CATERING EQUIPMENT/STAFF", cat: "RAMP", tags: "food late", detail: "late arrival of standard catering order, slow loading of catering" },
    { code: "037", sub: "C", desc: "WRONG/MISSING CATERING", cat: "RAMP", tags: "food order error", detail: "incomplete catering" },

    { code: "038", sub: "", desc: "CARGO EQUIPMENT", cat: "RAMP", tags: "equipment", detail: "" },
    { code: "038", sub: "A", desc: "BREAKDOWN OF CARGO EQUIPMENT", cat: "RAMP", tags: "loader broken", detail: "breakdown of cargo equipment" },
    { code: "038", sub: "B", desc: "LACK OF/LATE CARGO EQUIPMENT", cat: "RAMP", tags: "loader late", detail: "of cargo equipment only if different from ramp equipment" },

    // --- TECH & CREW (40-69) ---
    { code: "040", sub: "", desc: "LATE ENGINEERING PERSONNEL", cat: "TECH", tags: "engineer fix", detail: "EOB late to board aircraft" },
    { code: "040", sub: "A", desc: "LATE TROUBLESHOOTING", cat: "TECH", tags: "fix problem", detail: "Late troubleshooting" },
    { code: "040", sub: "B", desc: "LATE SET FUEL PANEL/FUEL LOG", cat: "TECH", tags: "refuel engineer", detail: "Late Tech log arrival, Disinfection certificate request, Clearing 36 hours Check paperwork" },

    { code: "041", sub: "", desc: "AIRCRAFT DEFECTS", cat: "TECH", tags: "broken ecam", detail: "aircraft technical problems, troubleshooting, ECAM warnings" },
    { code: "041", sub: "A", desc: "REQUIRES GROUND SUPPORT (GTSU/ASU/FGS)", cat: "TECH", tags: "start cart air", detail: "GTSU/ASU/FGS takes time eqiputment arrived on time (late / lack or breakdown of GPU, ASU, FGS use code 34J)" },
    { code: "041", sub: "B", desc: "DDML LIMITATION", cat: "TECH", tags: "mel", detail: "require maintenance action" },

    { code: "042", sub: "", desc: "LATE POSITIONING OF AIRCRAFT", cat: "TECH", tags: "positioning", detail: "" },
    { code: "042", sub: "A", desc: "LATE RELEASE FROM SCHEDULED MAINTENANCE", cat: "TECH", tags: "check hangar", detail: "aircraft release late from planned maintenance (if late tow use 34G)" },
    { code: "042", sub: "B", desc: "INCOMPLETE DOCUMENTATION", cat: "TECH", tags: "logbook", detail: "Incomplete documentation" },

    { code: "043", sub: "", desc: "NON-SCHEDULED MAINTENANCE", cat: "TECH", tags: "unscheduled", detail: "non-routine maintenance or unscheduled maintenance" },
    { code: "044", sub: "", desc: "LACK OF SPARES & MAINTENANCE EQUIPMENT", cat: "TECH", tags: "spare part", detail: "shortage or spared and/or lack of required equipment e.g. GTSU/SPU" },
    { code: "045", sub: "", desc: "AOG SPARES CARRIED TO ANOTHER STATION", cat: "TECH", tags: "spare part flight", detail: "awaiting spares to be carried or loaded from another station" },
    { code: "046", sub: "", desc: "TECHNICAL SWAP", cat: "TECH", tags: "change ac", detail: "swapping aircraft due to technical reasons" },
    { code: "047", sub: "", desc: "LACK OF STANDBY AIRCRAFT", cat: "TECH", tags: "spare ac", detail: "no standby aircraft available due to being tech/under maintenance" },
    { code: "048", sub: "", desc: "INSUFFICIENT GROUND TIME FOR DAILY CHECK", cat: "TECH", tags: "daily check", detail: "late inbound flight resulting in insufficient ground time (<3 hours) for daily check till next sector" },
    { code: "049", sub: "", desc: "DOCUMENT DISCREPANCY", cat: "TECH", tags: "tech log error", detail: "discrepancies with aircraft technical docurnents e.g. entries on technical log" },

    { code: "051", sub: "", desc: "DAMAGE TO AIRCRAFT IN FLIGHT OR TAXI", cat: "TECH", tags: "damage", detail: "" },
    { code: "051", sub: "A", desc: "BIRDSTRIKE", cat: "TECH", tags: "bird hit", detail: "Damage in flight or taxi" },
    { code: "051", sub: "B", desc: "ACT OF NATURE", cat: "TECH", tags: "lightning hail", detail: "lightning strikes, hail strikes, turbulence" },
    { code: "051", sub: "C", desc: "OVERWEIGHT/HEAVY LANDING/TAILSTRIKE", cat: "TECH", tags: "hard landing", detail: "Damage in flight or taxi" },
    { code: "051", sub: "D", desc: "COLLISION DURING TAXIING", cat: "TECH", tags: "crash ground", detail: "Collision during taxiing" },
    { code: "051", sub: "E", desc: "COCKPIT AND/OR CABIN EQUIPMENT", cat: "TECH", tags: "slide oxygen", detail: "slide deployment, cabin damage (first aid, portable oxygen used) lavatory and sink block" },
    { code: "051", sub: "F", desc: "FOREIGN OBJECT DEBRIS (FOD)", cat: "TECH", tags: "debris", detail: "contamination" },

    { code: "052", sub: "", desc: "DAMAGE TO AIRCRAFT ON STAND", cat: "TECH", tags: "damage", detail: "" },
    { code: "052", sub: "A", desc: "LOADING EQUIPMENT", cat: "TECH", tags: "belt damage", detail: "belt, trolleys, highloader" },
    { code: "052", sub: "B", desc: "SERVICE EQUIPMENT", cat: "TECH", tags: "stairs damage", detail: "steps, PLB, water truck, waste truck, IFC" },
    { code: "052", sub: "C", desc: "TOWING", cat: "TECH", tags: "tug damage", detail: "Damage to aircraft on stand" },
    { code: "052", sub: "D", desc: "COLLISIONS (OTHER THAN DURING TAXIING)", cat: "TECH", tags: "crash", detail: "Damage to aircraft on stand" },
    { code: "052", sub: "E", desc: "CABIN EQUIPMENT", cat: "TECH", tags: "slide oxygen", detail: "slide deployment, cabin damage (first aid, portable oxygen used) lavatory and sink block" },

    { code: "053", sub: "F", desc: "SWAP DUE TO DAMAGED AIRCRAFT", cat: "TECH", tags: "swap", detail: "swapping aircraft due to a damage that occured to the aircraft" },

    { code: "061", sub: "", desc: "FLIGHT PLAN/FLIGHT DOCUMENTS", cat: "OPS", tags: "docs", detail: "" },
    { code: "061", sub: "A", desc: "INCORRECT FLIGHT DOCUMENTS", cat: "OPS", tags: "ofp error", detail: "wrong OFP, incorrect information on OFP" },
    { code: "061", sub: "B", desc: "CHANGE OF/LATE FLIGHT PLAN", cat: "OPS", tags: "reroute", detail: "late OFP, awaiting new OFP due to operational changes" },
    { code: "061", sub: "C", desc: "MANUAL LOADSHEET", cat: "OPS", tags: "system down", detail: "manual loadsheet" },
    { code: "061", sub: "D", desc: "MISSING/INCORRECT CHARTS", cat: "OPS", tags: "nav charts", detail: "wrong or missing charts" },
    { code: "061", sub: "E", desc: "MISSING/INCORRECT MANUALS", cat: "OPS", tags: "books", detail: "wrong or missing manuals" },
    { code: "061", sub: "F", desc: "EFB FAILURE", cat: "OPS", tags: "ipad tablet", detail: "wrong version of Ipc, wrong information, tablet breakdown, not receiving EFF/OFP" },

    { code: "062", sub: "", desc: "OPERATIONAL REQUIREMENTS", cat: "OPS", tags: "operational", detail: "" },
    { code: "062", sub: "A", desc: "CHANGE OF/LATE LOADSHEET", cat: "OPS", tags: "trim", detail: "change of Load sheet due to altretion of fuel uplift/pax/cargo, late loadsheet (due to EFB equipment down use 61F)" },
    { code: "062", sub: "B", desc: "FUEL ALTERATIONS", cat: "OPS", tags: "refuel", detail: "differences in fuel figures" },
    { code: "062", sub: "C", desc: "CARGO ALTERATIONS", cat: "OPS", tags: "offload", detail: "differences in actual cargo vs. planned cargo.offloading cargo due to aircraft limitations" },
    { code: "062", sub: "D", desc: "REQUIRE TOW DUE TO OVERSHOT STOP LINE", cat: "OPS", tags: "parking", detail: "fast taxi-in, require tow back on stop line" },
    { code: "062", sub: "Z", desc: "FLIGHT DUTY TIME LIMITATIONS", cat: "OPS", tags: "duty time", detail: "Flight duty time limitations" },

    { code: "063", sub: "", desc: "LATE CREW BOARDING", cat: "OPS", tags: "crew", detail: "" },
    { code: "063", sub: "A", desc: "FLIGHT DECK CREW", cat: "OPS", tags: "pilot late", detail: "late crew, crew activated from standby on-time (2 hours before sign-on) but still late" },
    { code: "063", sub: "B", desc: "CABIN CREW", cat: "OPS", tags: "fa late", detail: "late crew, crew activated from standby on-time (2 hours before sign-on) but still late" },
    { code: "063", sub: "C", desc: "ENTIRE CREW", cat: "OPS", tags: "all crew", detail: "whole set late at gate/ aircraft (if due to crew change use 66A)" },
    { code: "063", sub: "D", desc: "DUE TO AIRCRAFT/SECTOR CHANGE", cat: "OPS", tags: "swap", detail: "crew required to change aircraft" },
    { code: "063", sub: "E", desc: "DUE TO LATE TRANSPORT", cat: "OPS", tags: "bus van", detail: "late transport to aircraft / airport" },

    { code: "064", sub: "", desc: "CREW SHORTAGE/AWAITING STANDBY", cat: "OPS", tags: "crew", detail: "" },
    { code: "064", sub: "A", desc: "FLIGHT DECK CREW", cat: "OPS", tags: "no pilot", detail: "sickness, FDTL, manpower, awaitng standby crew (late activation)" },
    { code: "064", sub: "B", desc: "CABIN CREW", cat: "OPS", tags: "no fa", detail: "sickness, awaiting standby" },
    { code: "064", sub: "C", desc: "ENTIRE CREW", cat: "OPS", tags: "no crew", detail: "sickness, awaiting standby" },

    { code: "065", sub: "", desc: "FLT DECK CREW SPECIAL REQUEST", cat: "OPS", tags: "pilot special", detail: "non-operational request by flight deck crew" },

    { code: "066", sub: "", desc: "CREW PROCEDURES", cat: "OPS", tags: "crew", detail: "" },
    { code: "066", sub: "A", desc: "CREW CHANGE", cat: "OPS", tags: "swap", detail: "change of crew during 25 minutes turnaround. Max 5min delay only" },
    { code: "066", sub: "B", desc: "IMMIGRATION CLEARANCE", cat: "OPS", tags: "passport", detail: "crew required to clear immgration during 25 minutes tumaround" },
    { code: "066", sub: "C", desc: "HEADCOUNT", cat: "OPS", tags: "count", detail: "headcount discrepancies of cabin crew" },
    { code: "066", sub: "D", desc: "CREW DOCUMENTS", cat: "OPS", tags: "gd missing", detail: "missing GD/China forms, wrong information on GD, no ID, no airport pass" },
    { code: "066", sub: "E", desc: "LATE CLEARANCE FOR BOARDING", cat: "OPS", tags: "cabin ready", detail: "boarding clearance late by CC (consider deboarding and other earlier processes)" },
    { code: "066", sub: "F", desc: "LATE SERVICE REQUEST", cat: "OPS", tags: "water", detail: "IFC, water services requested later then ETD-14 minutes." },
    { code: "066", sub: "G", desc: "CLEANING", cat: "OPS", tags: "clean", detail: "late completion of cleaning" },

    { code: "069", sub: "", desc: "CAPT REQUEST SECURITY CHECK", cat: "SEC", tags: "search", detail: "additional/repeat security screen procedures for pax, baggage or aircraft" },

    // --- WEATHER & ATC (71-89) ---
    { code: "071", sub: "", desc: "DEPARTURE STATION WX BELOW MINIMA", cat: "WX", tags: "fog rain visibility", detail: "ceiling/visibility, runway condition (if slow ground handling due to weather use 77)" },
    { code: "072", sub: "", desc: "DESTINATION STATION WX BELOW MINIMA", cat: "WX", tags: "fog rain visibility runway", detail: "ceiling / visibility, runway condition" },
    { code: "073", sub: "", desc: "EN-ROUTE/ALTERNATE WEATHER MINIMA", cat: "WX", tags: "storm", detail: "ceiling/visibility, runway condition" },
    { code: "075", sub: "", desc: "DE-ICING", cat: "WX", tags: "ice snow", detail: "(if late arrival of de-icing equipment use 34H)" },
    { code: "076", sub: "", desc: "AIRPORT CONTAMINATED/ABNORMAL EVENTS", cat: "WX", tags: "flood ash haze", detail: "due to snow/ice/sand/flood/haze/volcanic ash at airport" },
    { code: "077", sub: "", desc: "STOP GROUND HANDLING", cat: "WX", tags: "red alert lightning", detail: "LWS/red alert (e.g. thunderstorm over airfield) causing loading or boarding stop" },
    { code: "078", sub: "", desc: "SLOW GROUND HANDLING", cat: "WX", tags: "rain equipment", detail: "insufficient, improper or broken equipment (e.g. covered belt loaders, umbrellas)" },

    { code: "081", sub: "", desc: "CLEARANCE/SEQUENCING FOR DEPARTURE", cat: "ATC", tags: "taxi queue", detail: "long taxi-out, queue at TWY/RWY, awaiting take off clearance" },
    { code: "082", sub: "", desc: "CLEARANCE EN-ROUTE (ATFM)", cat: "ATC", tags: "slot flow", detail: "awaiting departure clearance due to ATFM restrictions (late TSAT, airspace congestion,...)" },
    { code: "084", sub: "", desc: "CLEARANCE FOR ARRIVAL DUE TO WEATHER", cat: "ATC", tags: "hold weather", detail: "weather causing air traffic flow mangement delays" },

    { code: "085", sub: "", desc: "MANDATORY SECURITY", cat: "SEC", tags: "security", detail: "" },
    { code: "085", sub: "A", desc: "CONGESTION AT SCREENING MACHINES", cat: "SEC", tags: "queue security", detail: "long queue at security screening machines (if due to awaiting fly-thru use 91)" },
    { code: "085", sub: "B", desc: "SECURITY ITEMS", cat: "SEC", tags: "security", detail: "issues on security concerned devices/objects in cabin." },
    
    { code: "086", sub: "", desc: "CIQ (CUSTOMS, IMMIGRATION & QUARANTINE)", cat: "ATC", tags: "ciq", detail: "" },
    { code: "086", sub: "A", desc: "CUSTOMS", cat: "ATC", tags: "ciq", detail: "customs checks, crew required to clear customs, long queue at customs" },
    { code: "086", sub: "B", desc: "IMMIGRATION", cat: "ATC", tags: "ciq passport", detail: "documentation procedures, lack of immigration staff, long queue (crew immigration clear use 66B)" },
    { code: "086", sub: "C", desc: "QUARANTINE/HEALTH", cat: "ATC", tags: "health", detail: "Quarantine/Health" },

    { code: "087", sub: "", desc: "AIRPORT FACILITIES", cat: "ATC", tags: "airport", detail: "" },
    { code: "087", sub: "A", desc: "SHORTAGE OF STANDS/BAYS/GATES", cat: "ATC", tags: "bay occupied", detail: "ramp congestion, shortage of bays/gates, late ac due to tow from remote stand" },
    { code: "087", sub: "B", desc: "WRONG PARKING BAY", cat: "ATC", tags: "info error", detail: "either wrong information from tower/OCC or wrongly taxied by crew" },
    { code: "087", sub: "C", desc: "BREAKDOWN/SLOW BAGGAGE SYSTEM", cat: "ATC", tags: "belt broken", detail: "delayed baggage processing due to bagga system issues" },
    { code: "087", sub: "D", desc: "BREAKDOWN OF PLB/AEROBRIDGE", cat: "ATC", tags: "bridge broken", detail: "delayed deboarding/boardirig process due to PLB unusble (if late PLB operator use 87E" },
    { code: "087", sub: "E", desc: "LATE PLB/AEROBRIDGE STAFF", cat: "ATC", tags: "bridge operator", detail: "delayed deboarding/boarding process due to PLB operator (not at bay during anblock)" },
    { code: "087", sub: "F", desc: "BREAKDOWN OF STAND GUIDANCE SYSTEM (VDGS)", cat: "ATC", tags: "guidance", detail: "no aircraft guidance to bay, no TOBT/TSAT provision" },
    { code: "087", sub: "G", desc: "LATE GATE CHANGE", cat: "ATC", tags: "swap gate", detail: "late gate change and moving of PAX, staff and equipment" },
    { code: "087", sub: "H", desc: "GATE SHARING", cat: "ATC", tags: "wait", detail: "2 or mare flights sharing the same gate" },
    { code: "087", sub: "J", desc: "AIRPORT CONGESTION", cat: "ATC", tags: "road traffic", detail: "congested service roads, long waiting to clear taxiway" },
    { code: "087", sub: "K", desc: "BREAKDOWN OF HYDRANT SYSTEM", cat: "ATC", tags: "fuel system", detail: "unable to uplift the fuel from hydrant system" },
    { code: "087", sub: "L", desc: "LACK OF BUSSES", cat: "ATC", tags: "transport", detail: "Lack of busses" },
    { code: "087", sub: "M", desc: "POWER STRIP/BLACKOUT", cat: "ATC", tags: "blackout", detail: "Power strip/blackout" },
    { code: "087", sub: "N", desc: "CUTE/CUSS PLATFORM FAILURE", cat: "ATC", tags: "check in system", detail: "CUTE/CUSS platform failure impacting check in, kiosk and Self baggage drop." },

    { code: "088", sub: "", desc: "RESTRICTIONS AT DESTINATION/EN-ROUTE", cat: "ATC", tags: "restrictions", detail: "" },
    { code: "088", sub: "A", desc: "CAPACITY CONSTRAINTS", cat: "ATC", tags: "dest restrictions", detail: "unavailability of stands/gates" },
    { code: "088", sub: "B", desc: "RUNWAY OBSTRUCTION", cat: "ATC", tags: "blocked", detail: "runway blocked/unusable (if related to weather pleae use 72)" },
    { code: "088", sub: "C", desc: "AIRPORT CLOSURE", cat: "ATC", tags: "curfew", detail: "curfew, political unrest, industrial action" },
    { code: "088", sub: "D", desc: "VIP/MILITARY EXERCISE", cat: "ATC", tags: "royal airforce", detail: "temporary restrictions due to VIP or military exercises" },

    { code: "089", sub: "", desc: "RESTRICTIONS AT DEPARTURE AIRPORT", cat: "ATC", tags: "restrictions", detail: "" },
    { code: "089", sub: "A", desc: "LATE PUSHBACK OR START-UP CLEARANCE", cat: "ATC", tags: "clearance", detail: "start-up & push-back clearance, ATFM delays use to weather" },
    { code: "089", sub: "B", desc: "RUNWAY OBSTRUCTION", cat: "ATC", tags: "blocked", detail: "blocked/unusable (if related to weather please use 71)" },
    { code: "089", sub: "C", desc: "AIRPORT CLOSURE", cat: "ATC", tags: "curfew", detail: "curfew, political unrest, industrial action" },
    { code: "089", sub: "D", desc: "VIP/MILITARY EXERCISE", cat: "ATC", tags: "royal airforce", detail: "temporary restrictions due to VIP or military exercises" },
    { code: "089", sub: "E", desc: "CTOT/A-CDM", cat: "ATC", tags: "slot", detail: "temporary restrictions due to CTOT/A-CDM" },

    { code: "093", sub: "", desc: "AIRCRAFT ROTATION/CONSEQUENTIAL", cat: "ROT", tags: "consequential", detail: "late inbound aircraft, rotation delay due to available turnaround < 25mins(narrow type), <75mins (wide type)" },
    { code: "093", sub: "A", desc: "CONSEQUENTIAL DELAY DUE TO PAX, BAGGAGE & RAMP", cat: "ROT", tags: "turnaround", detail: "Previous sector delays due to Delay codes 004, 006, 007, 008, 011, 013, 014, 015(except 015M), 018, 019, 020, 031, 032, 033, 034 and Subs" },
    { code: "093", sub: "B", desc: "CONSEQUENTIAL DELAY DUE TO CARGO", cat: "ROT", tags: "turnaround", detail: "Previous sector delays due to Delay codes 021, 038 and Subs" },
    { code: "093", sub: "C", desc: "CONSEQUENTIAL DELAY DUE TO FUEL, IFC, CLEANING", cat: "ROT", tags: "turnaround", detail: "Previous sector delays due to Delay codes 017, 035, 036, 037, and Subs" },
    { code: "093", sub: "D", desc: "CONSEQUENTIAL DELAY DUE TO TECH & AC EQUIPMENT", cat: "ROT", tags: "turnaround", detail: "Previous sector delays due to Delay codes 040, 041, 042, 043, 044, 045, 046, 047,048, 049, 051, 052. 053 and Subs" },
    { code: "093", sub: "E", desc: "CONSEQUENTIAL DELAY DUE TO FOP, CCD & OCC", cat: "ROT", tags: "turnaround", detail: "Previous sector delays due to Delay codes 015M, 016B, 070, 061, 062, 063, 064, 065, 066(except 0668), 069 and Subs" },
    { code: "093", sub: "F", desc: "CONSEQUENTIAL DELAY DUE TO AIRPORT & CIQ", cat: "ROT", tags: "turnaround", detail: "Previous sector delays due to Delay codes 0668, 085, 086, 087 and Subs" },
    { code: "093", sub: "G", desc: "CONSEQUENTIAL DELAY DUE TO ATC & WEATHER", cat: "ROT", tags: "turnaround", detail: "Previous sector delays due to Delay codes 071,072, 073, 075, 076, 077, 078, 081, 082, 083, 084, 088, 089 and Subs" },

    { code: "094", sub: "", desc: "RETIME", cat: "OPS", tags: "schedule", detail: "rescheduled by Scheduling team within 48 hours only (SSM within 48 hours only)" },
    { code: "099", sub: "", desc: "MISCELLANEOUS", cat: "OPS", tags: "other", detail: "rare or one-off events that dont fit under any other code. Should be with MEMO" },

    // --- ARRIVAL CODES ---
    { code: "001", sub: "", desc: "INSUFFICIENT BLOCK TIME", cat: "ARR", tags: "schedule", detail: "VR code only-given blocktime not sufficient due to slot constraint" },
    { code: "083", sub: "", desc: "CLEARANCE/SEQUENCING FOR ARRIVAL", cat: "ARR", tags: "atc holding", detail: "VR code only awaiting arrival clearance due to ATFM restrictions" }
];