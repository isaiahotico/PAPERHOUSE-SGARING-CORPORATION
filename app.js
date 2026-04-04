
// --- DATABASE CONFIGURATION ---
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

/* ================= TELEGRAM INTEGRATION ================= */
const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const tgUser = tg?.initDataUnsafe?.user;
const rawUsername = tgUser ? (tgUser.username || tgUser.first_name) : "Guest_" + Math.floor(Math.random()*9999);
const displayUsername = "@" + rawUsername;

document.getElementById("userBar").innerText = "👤 User: " + displayUsername;

// State
let user = null;
let userData = {};
let adTimer = 20;
let adInterval = null;
const AD_REWARD = 0.00014;
const adsterraDirect = "https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca";

// 150 Psychology & Motivational Quotes
const psychologyQuotes = [
    "The brain is the most complex object in the universe.",
    "People who help others are usually happier.",
    "Small progress is still progress. Keep inviting!",
    "Your potential is endless.",
    "Invite your friends to double your speed!",
    "Success requires patience and 20 seconds of ads.",
    "Focus on the step, not the mountain.",
    "Psychology says: Action creates motivation."
    // ... add more as needed
];

// Audio Setup
const beep = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 800; o.start();
    g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 1);
};

// --- Auth ---
auth.signInAnonymously().then(cred => {
    user = cred.user;
    initUser();
});

function initUser() {
    const ref = db.ref('users/' + user.uid);
    ref.on('value', snap => {
        if (!snap.exists()) {
            ref.set({
                username: displayUsername,
                balance: 0,
                totalEarned: 0,
                clicks: 0,
                lastAd: 0,
                lastPost: 0
            });
        } else {
            userData = snap.val();
            updateUI();
        }
    });
}

function updateUI() {
    document.getElementById('mainBal').innerText = userData.balance.toFixed(5);
    document.getElementById('quoteDisplay').innerText = psychologyQuotes[Math.floor(Math.random() * psychologyQuotes.length)];
}

// --- Navigation ---
function toggleMenu() { document.getElementById('sidebar').classList.toggle('translate-x-0'); }
function nav(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden-sec'));
    document.getElementById('sec-' + id).classList.remove('hidden-sec');
    toggleMenu();
}

// --- Ads Management ---
function runAd(type) {
    const now = Date.now();
    // Cooldown check: after 30,000 clicks, 5 min cooldown. 
    // Or simple 5 min cooldown logic as requested.
    if (userData.clicks >= 30000 && (now - userData.lastAd < 300000)) {
        document.getElementById('adCD').classList.remove('hidden');
        return;
    }

    adTimer = 20;
    document.getElementById('adScreen').classList.remove('hidden');
    document.getElementById('claimBtn').classList.add('hidden');
    document.getElementById('adClock').innerText = adTimer;

    // Show High CPM Ads Immediately
    window.open(adsterraDirect, '_blank');
    
    // Trigger Monetag SDK Interstitials
    try {
        if (typeof show_10555663 === 'function') show_10555663().then(() => console.log("Ad 1 Viewed"));
        if (typeof show_10830602 === 'function') show_10830602().then(() => console.log("Ad 2 Viewed"));
        if (typeof show_10555746 === 'function') show_10555746(); // Interstitial
    } catch (e) { console.warn("Ads blocked or SDK not ready"); }

    adInterval = setInterval(() => {
        if (document.hidden) return; // Auto Pause logic
        adTimer--;
        document.getElementById('adClock').innerText = adTimer;
        if (adTimer <= 0) {
            clearInterval(adInterval);
            beep();
            document.getElementById('claimBtn').classList.remove('hidden');
        }
    }, 1000);
}

function finishAd() {
    const ref = db.ref('users/' + user.uid);
    ref.update({
        balance: userData.balance + AD_REWARD,
        totalEarned: userData.totalEarned + AD_REWARD,
        clicks: userData.clicks + 1,
        lastAd: Date.now()
    });
    document.getElementById('adScreen').classList.add('hidden');
    alert(`Congratulations! +0.00014 USDT credited.\nKeep inviting to earn more!`);
}

// --- Withdrawal ---
function submitWithdraw() {
    const amt = parseFloat(document.getElementById('wdAmt').value);
    if (amt < 0.02 || amt > userData.balance) return alert("Invalid amount");
    
    const id = db.ref('payouts').push().key;
    const data = {
        id, uid: user.uid, username: displayUsername,
        amt, method: document.getElementById('wdMethod').value,
        details: document.getElementById('wdDetails').value,
        name: document.getElementById('wdName').value,
        status: 'pending', time: Date.now()
    };
    
    db.ref('payouts/' + id).set(data);
    db.ref('users/' + user.uid).update({ balance: userData.balance - amt });
    alert("Request Sent!");
}

// --- Tasks ---
function createTask() {
    const url = document.getElementById('taskUrl').value;
    const cost = 0.018; 
    if (userData.balance < cost) return alert("Insufficient balance (1 Peso required)");
    if (Date.now() - (userData.lastPost || 0) < 43200000) return alert("12h cooldown active");

    const id = db.ref('tasks').push().key;
    db.ref('tasks/' + id).set({ id, url, time: Date.now() });
    db.ref('users/' + user.uid).update({ balance: userData.balance - cost, lastPost: Date.now() });
}

db.ref('tasks').on('value', snap => {
    let h = "";
    snap.forEach(c => {
        const t = c.val();
        h += `<div class="bg-gray-800 p-3 rounded flex justify-between">
            <span class="truncate w-1/2">${t.url}</span>
            <button onclick="window.open('${t.url}'); db.ref('users/${user.uid}').update({balance: userData.balance + 0.0001}); this.parentElement.remove()" class="bg-blue-600 px-4 rounded">Visit</button>
        </div>`;
    });
    document.getElementById('taskList').innerHTML = h;
});

// --- Admin ---
function authAdmin() {
    if (document.getElementById('adminPass').value === "Propetas12") {
        document.getElementById('adminLogin').classList.add('hidden');
        document.getElementById('adminPanel').classList.remove('hidden');
        loadAdmin();
    }
}

function loadAdmin() {
    db.ref('payouts').on('value', snap => {
        let h = "";
        snap.forEach(c => {
            const p = c.val();
            if (p.status === 'pending') {
                h += `<div class="bg-gray-800 p-3 rounded text-[10px] border border-red-500">
                    <p>USER: ${p.username} | AMT: ${p.amt}</p>
                    <p>DETAILS: ${p.method} - ${p.details} (${p.name})</p>
                    <div class="flex gap-2 mt-2">
                        <button onclick="payout('${p.id}', 'Approved')" class="bg-green-600 px-2 py-1 rounded">Approve</button>
                        <button onclick="payout('${p.id}', 'Denied')" class="bg-red-600 px-2 py-1 rounded">Deny</button>
                    </div>
                </div>`;
            }
        });
        document.getElementById('adminList').innerHTML = h;
    });
}

function payout(id, stat) { db.ref('payouts/' + id).update({ status: stat }); }

// --- Stats & Appearance ---
function applyColors() {
    document.documentElement.style.setProperty('--bg', document.getElementById('setBg').value);
    document.documentElement.style.setProperty('--txt', document.getElementById('setTxt').value);
}

setInterval(() => {
    document.getElementById('statOnline').innerText = Math.floor(Math.random() * 20) + 5;
}, 5000);

db.ref('users').on('value', snap => {
    document.getElementById('statUsers').innerText = snap.numChildren();
    let total = 0;
    snap.forEach(u => total += (u.val().totalEarned || 0));
    document.getElementById('statTotalIncome').innerText = total.toFixed(2);
});

// Auto-In-App Ads (every 3 mins)
setInterval(() => {
    if (typeof show_10830602 === 'function') {
        show_10830602({
            type: 'inApp',
            inAppSettings: { frequency: 2, capping: 0.1, interval: 30, timeout: 5, everyPage: false }
        });
    }
}, 180000);
