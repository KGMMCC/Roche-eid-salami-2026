// script.js

// ---------- Firebase configuration (from user) ----------
const firebaseConfig = {
  apiKey: "AIzaSyDpndw0djy35-mAEO9qvkP42KVktDiV42Q",
  authDomain: "security-payment-portal.firebaseapp.com",
  projectId: "security-payment-portal",
  storageBucket: "security-payment-portal.firebasestorage.app",
  messagingSenderId: "525202381849",
  appId: "1:525202381849:web:fe45e85953be3685bd5e88",
  measurementId: "G-Q42JM9MF44"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const analytics = firebase.analytics();
const db = firebase.firestore();

// ---------- Global variables ----------
let submissions = [];              // local cache
let paymentNumbers = {
  bKash: '01817475950',
  Nagad: '01603334751'
};

// DOM elements
const wallDiv = document.getElementById('salamiWall');
const form = document.getElementById('salamiForm');
const modal = document.getElementById('successModal');
const closeModal = document.getElementById('closeModal');
const heroBtn = document.getElementById('heroSendBtn');
const themeToggle = document.getElementById('themeToggle');
const adminBtn = document.getElementById('adminLoginBtn');
const adminPanel = document.getElementById('adminPanel');
const adminSubmissionsDiv = document.getElementById('adminSubmissions');
const totalStat = document.getElementById('totalStat');
const pendingStat = document.getElementById('pendingStat');
const exportBtn = document.getElementById('exportBtn');
const updatePayBtn = document.getElementById('updatePayBtn');
const editBkash = document.getElementById('editBkash');
const editNagad = document.getElementById('editNagad');
const adminLogout = document.getElementById('adminLogout');
const bkashNumberDiv = document.getElementById('bkashNumber');
const nagadNumberDiv = document.getElementById('nagadNumber');

// ---------- Admin password (updated to "Rachebancod") ----------
const ADMIN_PASSWORD = "Rachebancod";

// ---------- Load data from Firestore ----------
async function loadSubmissions() {
  const snapshot = await db.collection('salamis').orderBy('timestamp', 'desc').get();
  submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderWall();
  renderAdmin(); // admin uses same data
}

// Save new submission to Firestore
async function saveSubmission(data) {
  const docRef = await db.collection('salamis').add({
    ...data,
    approved: false,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });
  return docRef.id;
}

// Update approval status
async function updateApproval(id, approved) {
  await db.collection('salamis').doc(id).update({ approved });
}

// Delete submission
async function deleteSubmission(id) {
  await db.collection('salamis').doc(id).delete();
}

// ---------- Render wall (only approved) ----------
function renderWall() {
  const approved = submissions.filter(s => s.approved).slice(0, 10);
  wallDiv.innerHTML = approved.map(s => `
    <div class="entry-card">
      <span><strong>${s.name || 'Anonymous'}</strong> <span style="color:gold;">৳${s.amount}</span><br><small>${s.msg || 'Eid Mubarak'}</small></span>
      <span>🌙</span>
    </div>
  `).join('');
  if (approved.length === 0) {
    wallDiv.innerHTML = '<div class="entry-card">Be the first to send Salami ✨</div>';
  }
}

// ---------- Render admin submissions ----------
function renderAdmin() {
  if (adminPanel.style.display !== 'block') return;
  adminSubmissionsDiv.innerHTML = submissions.map(s => `
    <div style="display:flex; align-items:center; gap:0.5rem; margin:0.5rem 0; background: rgba(255,255,240,0.2); border-radius: 50px; padding: 0.5rem 1rem;">
      <span style="flex:1">${s.name} - ৳${s.amount} (${s.method}) ${s.approved ? '✅' : '⏳'}</span>
      ${!s.approved ? `<button class="copy-btn" onclick="window.approveEntry('${s.id}')">Approve</button>` : ''}
      <button class="copy-btn" style="background:crimson;" onclick="window.deleteEntry('${s.id}')">Delete</button>
    </div>
  `).join('');
  totalStat.innerText = submissions.length;
  pendingStat.innerText = submissions.filter(s => !s.approved).length;
}

// Approve (global for onclick)
window.approveEntry = async (id) => {
  await updateApproval(id, true);
  await loadSubmissions(); // reload
};

window.deleteEntry = async (id) => {
  if (confirm('Delete this submission?')) {
    await deleteSubmission(id);
    await loadSubmissions();
  }
};

// ---------- Copy button handler ----------
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  const phone = btn.dataset.phone;
  if (phone) {
    navigator.clipboard.writeText(phone).then(() => {
      alert('📋 Copied!');
    });
  }
});

// ---------- Form submit ----------
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('senderName').value;
  const amount = document.getElementById('amount').value;
  const method = document.getElementById('paymentMethod').value;
  const txn = document.getElementById('txnId').value;
  const msg = document.getElementById('shortMsg').value;

  if (!name || !amount || !method || !txn) return alert('Please fill required fields');

  const newEntry = { name, amount, method, txn, msg, approved: false };

  // Save to Firebase
  await saveSubmission(newEntry);
  await loadSubmissions();

  // Show modal & confetti
  modal.classList.add('show');
  for (let i = 0; i < 30; i++) {
    let conf = document.createElement('div');
    conf.classList.add('confetti');
    conf.style.left = Math.random() * 100 + '%';
    conf.style.animationDelay = Math.random() * 2 + 's';
    conf.style.background = `hsl(${Math.random() * 60 + 40}, 80%, 60%)`;
    document.body.appendChild(conf);
    setTimeout(() => conf.remove(), 3000);
  }
  form.reset();
});

closeModal.addEventListener('click', () => modal.classList.remove('show'));
heroBtn.addEventListener('click', () => document.getElementById('sendSection').scrollIntoView({ behavior: 'smooth' }));

// ---------- Dark mode ----------
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggle.innerHTML = document.body.classList.contains('dark') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// ---------- Admin login with password "Rachebancod" ----------
adminBtn.addEventListener('click', () => {
  const pwd = prompt('Enter admin password:');
  if (pwd === ADMIN_PASSWORD) {
    adminPanel.style.display = 'block';
    loadSubmissions(); // refresh admin view
  } else {
    alert('Incorrect password');
  }
});

adminLogout.addEventListener('click', () => {
  adminPanel.style.display = 'none';
});

// ---------- Update payment numbers ----------
updatePayBtn.addEventListener('click', () => {
  paymentNumbers.bKash = editBkash.value;
  paymentNumbers.Nagad = editNagad.value;
  bkashNumberDiv.innerText = paymentNumbers.bKash;
  nagadNumberDiv.innerText = paymentNumbers.Nagad;

  // Update data-phone on copy buttons
  document.querySelectorAll('.pay-item').forEach((item, idx) => {
    const copyBtn = item.querySelector('.copy-btn');
    if (item.querySelector('h3').innerText === 'bKash') {
      copyBtn.dataset.phone = paymentNumbers.bKash;
    } else {
      copyBtn.dataset.phone = paymentNumbers.Nagad;
    }
  });
  alert('Numbers updated');
});

// ---------- Export CSV ----------
exportBtn.addEventListener('click', () => {
  let csv = "Name,Amount,Method,Txn,Message,Approved\n";
  submissions.forEach(s => csv += `${s.name},${s.amount},${s.method},${s.txn},${s.msg},${s.approved}\n`);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'salami_submissions.csv'; a.click();
  window.URL.revokeObjectURL(url);
});

// ---------- Initial load ----------
loadSubmissions();

// Optional: listen to realtime updates
db.collection('salamis').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
  submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderWall();
  if (adminPanel.style.display === 'block') renderAdmin();
});
