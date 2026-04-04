
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

// App State
let userData = {};
let adActive = false;
let adTime = 20;
let adInterval;
let isAdmin = false;
const adReward = 0.00014;
const adsterraLink = "https://www.profitablecpmratenetwork.com/i2rx8svvds?key=ec449a85ea63cb0b7adf4cd90009cbca";

// 150 Psychology/Motivational Quotes
const quotes = [
    "The only way to do great work is to love what you do.",
    "Your potential is endless. Go do what you were created to do.",
    "Small steps lead to big results.",
    "Keep inviting friends to multiply your earnings!",
    "Success is a journey, not a destination.",
    "Psychology says: Action leads to motivation, not the other way around.",
    "Behavior is the mirror in which everyone shows their image.",
    "Don't stop when you're tired, stop when you're done.",
    "Invite others and build your Paperhouse empire!"
    // ... truncated for brevity, but you can add all 150 here
];

// Sound Effect (Beep)
const playBeep = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    osc.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
};

// --- Initialization ---
auth.signInAnonymously().catch(err => alert("Auth Error: " + err.message));

auth.onAuthStateChanged(user => {
    if (user) {
        initUser(user.uid);
        setupStats();
    }
});

function initUser(uid) {
    const userRef = db.ref('users/' + uid);
    userRef.on('value', snap => {
        if (!snap.exists()) {
            const username = prompt("Enter Telegram Username:") || "Guest" + Math.floor(Math.random() * 1000);
            userRef.set({
                username: username,
                balance: 0,
                totalEarned: 0,
                adClicks: 0,
                lastPost: 0,
                lastAdDate: 0
            });
        } else {
            userData = snap.val();
            userData.uid = uid;
            updateUI();
        }
    });
}

function updateUI() {
    document.getElementById('topUsername').innerText = "@" + (userData.username || "user");
    document.getElementById('mainBalance').innerText = userData.balance.toFixed(5) + " USDT";
    document.getElementById('quoteBox').innerText = quotes[Math.floor(Math.random() * quotes.length)];
}

// --- Navigation ---
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('menu-active');
}

function showSection(id) {
    const sections = ['home', 'ads', 'withdraw', 'tasks', 'settings', 'admin'];
    sections.forEach(s => document.getElementById('sec-' + s).classList.add('hidden-section'));
    document.getElementById('sec-' + id).classList.remove('hidden-section');
    toggleMenu();
}

// --- Ads Logic ---
function startAdProcess(title) {
    const now = Date.now();
    if (userData.adClicks >= 30000 && (now - userData.lastAdDate < 300000)) {
        document.getElementById('cooldownMsg').classList.remove('hidden');
        return;
    }

    adActive = true;
    adTime = 20;
    document.getElementById('adOverlay').classList.remove('hidden');
    document.getElementById('claimBtn').classList.add('hidden');
    document.getElementById('adTimer').innerText = adTime;
    
    // Open External Ads
    window.open(adsterraLink, '_blank');
    if (window.show_10555663) show_10555663().catch(() => {});
    if (window.show_10830602) show_10830602().catch(() => {});

    adInterval = setInterval(() => {
        if (document.hidden) return; // Auto Pause Logic

        adTime--;
        document.getElementById('adTimer').innerText = adTime;
        if (adTime <= 0) {
            clearInterval(adInterval);
            playBeep();
            document.getElementById('claimBtn').classList.remove('hidden');
        }
    }, 1000);
}

function claimReward() {
    const updates = {};
    updates['users/' + userData.uid + '/balance'] = userData.balance + adReward;
    updates['users/' + userData.uid + '/totalEarned'] = (userData.totalEarned || 0) + adReward;
    updates['users/' + userData.uid + '/adClicks'] = (userData.adClicks || 0) + 1;
    updates['users/' + userData.uid + '/lastAdDate'] = Date.now();

    db.ref().update(updates);
    
    adActive = false;
    document.getElementById('adOverlay').classList.add('hidden');
    alert(`Congratulations! You earned ${adReward} USDT. Keep inviting!`);
}

// --- Withdrawal Logic ---
function submitWithdrawal() {
    const amount = parseFloat(document.getElementById('wdAmount').value);
    const method = document.getElementById('wdMethod').value;
    const account = document.getElementById('wdAccount').value;
    const name = document.getElementById('wdName').value;

    if (amount < 0.02 || amount > userData.balance) return alert("Invalid amount");
    if (!account || !name) return alert("Fill all fields");

    const wdKey = db.ref('withdrawals').push().key;
    const request = {
        id: wdKey,
        uid: userData.uid,
        username: userData.username,
        amount: amount,
        method: method,
        account: account,
        name: name,
        status: 'pending',
        time: Date.now()
    };

    const updates = {};
    updates['withdrawals/' + wdKey] = request;
    updates['users/' + userData.uid + '/balance'] = userData.balance - amount;
    
    db.ref().update(updates).then(() => {
        alert("Withdrawal submitted for manual approval!");
        loadWdHistory();
    });
}

function loadWdHistory() {
    db.ref('withdrawals').orderByChild('uid').equalTo(userData.uid).on('value', snap => {
        let html = "";
        snap.forEach(child => {
            const w = child.val();
            html += `<div class="p-2 bg-gray-800 rounded border-l-4 ${w.status === 'pending' ? 'border-yellow-500' : 'border-green-500'}">
                ${w.amount} USDT via ${w.method} - <b>${w.status}</b>
            </div>`;
        });
        document.getElementById('wdHistory').innerHTML = html;
    });
}

// --- Family Tasks ---
function postTask() {
    const link = document.getElementById('taskLink').value;
    const cost = 0.018; // 1 Peso
    if (userData.balance < cost) return alert("Insufficient balance");
    if (Date.now() - (userData.lastPost || 0) < 43200000) return alert("Wait 12 hours");

    const taskKey = db.ref('tasks').push().key;
    const updates = {};
    updates['tasks/' + taskKey] = { id: taskKey, link: link, time: Date.now() };
    updates['users/' + userData.uid + '/balance'] = userData.balance - cost;
    updates['users/' + userData.uid + '/lastPost'] = Date.now();

    db.ref().update(updates);
}

db.ref('tasks').on('value', snap => {
    let html = "";
    snap.forEach(child => {
        const t = child.val();
        html += `<div class="bg-gray-800 p-3 rounded flex justify-between items-center">
            <span class="text-xs truncate w-2/3">${t.link}</span>
            <button onclick="window.open('${t.link}'); this.parentElement.remove()" class="bg-blue-600 px-3 py-1 rounded text-xs">Join</button>
        </div>`;
    });
    document.getElementById('taskList').innerHTML = html;
});

// --- Settings ---
function updateColors() {
    const bg = document.getElementById('colorBg').value;
    const text = document.getElementById('colorText').value;
    document.documentElement.style.setProperty('--main-bg', bg);
    document.documentElement.style.setProperty('--main-text', text);
}

// --- Admin Panel ---
function checkAdmin() {
    if (document.getElementById('adminPass').value === "Propetas12") {
        document.getElementById('adminAuth').classList.add('hidden');
        document.getElementById('adminContent').classList.remove('hidden');
        loadAdminData();
    } else {
        alert("Wrong Password");
    }
}

function loadAdminData() {
    db.ref('withdrawals').orderByChild('status').equalTo('pending').on('value', snap => {
        let html = "";
        snap.forEach(child => {
            const w = child.val();
            html += `<div class="bg-gray-800 p-4 rounded border border-red-900">
                <p>User: ${w.username} | Amt: ${w.amount}</p>
                <p>${w.method}: ${w.account} (${w.name})</p>
                <div class="flex gap-2 mt-2">
                    <button onclick="adminAction('${w.id}', 'approved')" class="bg-green-600 px-4 py-1 rounded">Approve</button>
                    <button onclick="adminAction('${w.id}', 'denied')" class="bg-red-600 px-4 py-1 rounded">Deny</button>
                </div>
            </div>`;
        });
        document.getElementById('adminPending').innerHTML = html;
    });
}

function adminAction(id, status) {
    db.ref('withdrawals/' + id).update({ status: status });
}

// --- Global Stats ---
function setupStats() {
    setInterval(() => {
        document.getElementById('statOnline').innerText = Math.floor(Math.random() * 10) + 1; // Simulated online
    }, 5000);

    db.ref('users').on('value', snap => {
        document.getElementById('statTotalUsers').innerText = snap.numChildren();
        let totalIncome = 0;
        snap.forEach(u => { totalIncome += (u.val().totalEarned || 0); });
        document.getElementById('statTotalIncome').innerText = totalIncome.toFixed(2);
    });
}

// In-App Ad Auto Show (every 3 mins)
setInterval(() => {
    if (window.show_10555746) {
        show_10555746({
            type: 'inApp',
            inAppSettings: { frequency: 2, capping: 0.1, interval: 30, timeout: 5, everyPage: false }
        });
    }
}, 180000);
