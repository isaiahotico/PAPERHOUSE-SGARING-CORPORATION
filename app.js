
// --- DATABASE SETUP ---
const firebaseConfig = {
    apiKey: "AIzaSyBwpa8mA83JAv2A2Dj0rh5VHwodyv5N3dg",
    authDomain: "facebook-follow-to-follow.firebaseapp.com",
    databaseURL: "https://facebook-follow-to-follow-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "facebook-follow-to-follow",
    storageBucket: "facebook-follow-to-follow.firebasestorage.app",
    messagingSenderId: "589427984313",
    appId: "1:589427984313:web:a17b8cc851efde6dd79868"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

/* ================= TELEGRAM CORE ================= */
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const tgUser = tg?.initDataUnsafe?.user;
const realUsername = tgUser ? (tgUser.username || tgUser.first_name) : "GUEST_" + Math.floor(1000 + Math.random() * 9000);
document.getElementById('userBar').innerText = "👤 " + realUsername;

// --- App Global State ---
let currentUser = null;
let userData = { balance: 0, clicks: 0, lastAd: 0, lastPost: 0, totalEarned: 0 };
let adCounter = 20;
let adInterval = null;
const REWARD_VAL = 0.00014;
const TASK_COST = 0.018; 
const ADSTERRA_LINK = "https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca";

const psychologyQuotes = [
    "Small steps lead to big results. Keep going!",
    "Success is the sum of small efforts repeated daily.",
    "Invite your friends to build your Paperhouse legacy.",
    "Your brain is wired for progress. Keep earning!",
    "Psychology says: Consistency beats talent every time.",
    "Every ad you watch brings you closer to your goal.",
    "The secret of getting ahead is getting started."
];

// --- Initialization ---
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        syncUserData();
        loadGlobalStats();
    } else {
        auth.signInAnonymously();
    }
});

function syncUserData() {
    const ref = db.ref('users/' + currentUser.uid);
    ref.on('value', snap => {
        if (!snap.exists()) {
            ref.set({ username: realUsername, balance: 0, clicks: 0, lastAd: 0, lastPost: 0, totalEarned: 0 });
        } else {
            userData = snap.val();
            document.getElementById('mainBal').innerText = userData.balance.toFixed(5);
            document.getElementById('quoteDisplay').innerText = psychologyQuotes[Math.floor(Math.random() * psychologyQuotes.length)];
        }
    });
}

// --- Navigation ---
function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('-translate-x-full');
}

function nav(id) {
    document.querySelectorAll('.sec').forEach(s => s.classList.remove('sec-active'));
    document.getElementById('sec-' + id).classList.add('sec-active');
    toggleMenu();
}

/* ================= ADS ENGINE ================= */
function triggerAdFlow() {
    // 1. Check for Cooldown
    const now = Date.now();
    if (userData.clicks >= 30 && (now - userData.lastAd < 300000)) {
        alert("Please wait 5 minutes to rest.");
        return;
    }

    // 2. Show Monetag Interstitial IMMEDIATELY (Fix)
    try {
        if (typeof show_10555746 === 'function') {
            show_10555746().then(() => console.log("Interstitial shown"));
        }
        if (typeof show_10555663 === 'function') show_10555663();
        if (typeof show_10830602 === 'function') show_10830602();
    } catch(e) { console.warn("Ad SDK blocked"); }

    // 3. Open Adsterra in New Tab
    window.open(ADSTERRA_LINK, '_blank');

    // 4. Start Overlay Timer
    startTimer();
}

function startTimer() {
    adCounter = 20;
    const overlay = document.getElementById('adScreen');
    const clock = document.getElementById('adClock');
    const claimBtn = document.getElementById('claimBtn');
    const progress = document.getElementById('adProgress');

    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    claimBtn.classList.add('hidden');
    
    adInterval = setInterval(() => {
        // Auto-Pause Logic
        if (document.hidden) return;

        adCounter--;
        clock.innerText = adCounter;
        
        // Circular Progress calc
        let offset = 502 - ( (20 - adCounter) / 20 * 502);
        progress.style.strokeDashoffset = offset;

        if (adCounter <= 0) {
            clearInterval(adInterval);
            playSuccessBeep();
            claimBtn.classList.remove('hidden');
        }
    }, 1000);
}

function claimReward() {
    if (adCounter > 0) return;

    const userRef = db.ref('users/' + currentUser.uid);
    userRef.transaction(current => {
        if (current) {
            current.balance = (current.balance || 0) + REWARD_VAL;
            current.totalEarned = (current.totalEarned || 0) + REWARD_VAL;
            current.clicks = (current.clicks || 0) + 1;
            current.lastAd = Date.now();
        }
        return current;
    }).then(() => {
        document.getElementById('adScreen').classList.add('hidden');
        document.getElementById('adScreen').classList.remove('flex');
        alert("Reward Added: +0.00014 USDT");
    });
}

/* ================= WITHDRAWAL ================= */
function handleWithdrawal() {
    const amt = parseFloat(document.getElementById('wdAmt').value);
    const meth = document.getElementById('wdMethod').value;
    const det = document.getElementById('wdDetails').value;

    if (amt < 0.02 || amt > userData.balance) return alert("Invalid amount (Min 0.02)");
    if (det.length < 5) return alert("Enter valid account details");

    const id = db.ref('payouts').push().key;
    const request = {
        id, uid: currentUser.uid, username: realUsername,
        amount: amt, method: meth, details: det,
        status: 'pending', time: Date.now()
    };

    db.ref('payouts/' + id).set(request);
    db.ref('users/' + currentUser.uid + '/balance').set(userData.balance - amt);
    alert("Withdrawal request submitted!");
}

/* ================= TASKS ================= */
function handleTask() {
    const url = document.getElementById('taskUrl').value;
    if (!url.includes('t.me')) return alert("Enter a valid Telegram link");
    if (userData.balance < TASK_COST) return alert("Insufficient Balance");

    const id = db.ref('tasks').push().key;
    db.ref('tasks/' + id).set({ id, url, time: Date.now() });
    db.ref('users/' + currentUser.uid).update({
        balance: userData.balance - TASK_COST,
        lastPost: Date.now()
    });
    alert("Task Posted!");
}

db.ref('tasks').on('value', snap => {
    let html = "";
    snap.forEach(child => {
        const t = child.val();
        html += `<div class="bg-gray-800 p-3 rounded-xl flex justify-between items-center border border-gray-700">
            <span class="text-xs truncate w-2/3 text-gray-400">${t.url}</span>
            <button onclick="window.open('${t.url}'); this.disabled=true;" class="bg-blue-600 px-4 py-1 rounded-lg text-xs font-bold">JOIN</button>
        </div>`;
    });
    document.getElementById('taskList').innerHTML = html;
});

/* ================= ADMIN CORE ================= */
function checkAdmin() {
    if (document.getElementById('adminPass').value === "Propetas12") {
        document.getElementById('adminAuth').classList.add('hidden');
        document.getElementById('adminContent').classList.remove('hidden');
        loadAdminData();
    }
}

function loadAdminData() {
    db.ref('payouts').orderByChild('status').equalTo('pending').on('value', snap => {
        let html = "";
        snap.forEach(child => {
            const p = child.val();
            html += `<div class="bg-gray-800 p-4 rounded-xl border border-red-500/30 text-[10px]">
                <p>USER: ${p.username} | AMT: ${p.amount} USDT</p>
                <p>METH: ${p.method} | ${p.details}</p>
                <div class="flex gap-2 mt-2">
                    <button onclick="db.ref('payouts/${p.id}/status').set('Approved')" class="bg-green-600 flex-1 py-2 rounded">APPROVE</button>
                    <button onclick="db.ref('payouts/${p.id}/status').set('Denied')" class="bg-red-600 flex-1 py-2 rounded">DENY</button>
                </div>
            </div>`;
        });
        document.getElementById('adminPending').innerHTML = html || "<p class='text-center text-gray-600'>No pending requests</p>";
    });
}

// --- Utils ---
function playSuccessBeep() {
    const actx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    osc.connect(gain); gain.connect(actx.destination);
    osc.type = 'sine'; osc.frequency.value = 880;
    gain.gain.setValueAtTime(0, actx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, actx.currentTime + 0.1);
    osc.start(); osc.stop(actx.currentTime + 0.4);
}

function loadGlobalStats() {
    db.ref('users').on('value', snap => {
        document.getElementById('statUsers').innerText = snap.numChildren();
    });
    setInterval(() => {
        document.getElementById('statOnline').innerText = Math.floor(Math.random() * 15) + 3;
    }, 5000);
}

// Auto In-App Ads every 3 minutes
setInterval(() => {
    if (typeof show_10555746 === 'function') show_10555746();
}, 180000);
