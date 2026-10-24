/* ==========================================================
   🔑 Gemini API key এখানে বসাও
   ========================================================== */
const GEMINI_API_KEY = 'AQ.Ab8RN6L-0vI5qT320F3dQUhylYIaO1JQehNcp5K4ULy3-GTTpA';
const GEMINI_MODEL = 'gemini-3.5-flash';

/* ============================================================
   8D HORROR BACKGROUND
   ============================================================ */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let W, H;
function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
resize();
addEventListener('resize', resize);

// Blood particles
const particles = [];
const NUM = 60;
class BloodParticle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.z = Math.random() * 2 + 0.3;
    this.size = Math.random() * 2.5 + 0.8;
    this.sx = (Math.random() - 0.5) * 0.35;
    this.sy = Math.random() * 0.6 + 0.15; // fall down
    this.hue = Math.random() * 15 + 355; // red hues
    this.alpha = Math.random() * 0.5 + 0.25;
  }
  update() {
    this.x += this.sx * this.z;
    this.y += this.sy * this.z;
    if (this.y > H) { this.reset(); this.y = -10; }
    if (this.x < 0) this.x = W;
    if (this.x > W) this.x = 0;
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.z, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${this.hue}, 100%, ${30 + this.alpha * 20}%, ${this.alpha})`;
    ctx.shadowBlur = 14;
    ctx.shadowColor = `hsl(${this.hue}, 100%, 40%)`;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
for (let i = 0; i < NUM; i++) particles.push(new BloodParticle());

// 8D Hypercube (rotating in TWO 4D planes + 2D rotation)
let a1 = 0, a2 = 0, a3 = 0;
const verts = [];
for (let i = 0; i < 16; i++) verts.push([(i&1)?1:-1,(i&2)?1:-1,(i&4)?1:-1,(i&8)?1:-1]);
const edges = [];
for (let i = 0; i < 16; i++)
  for (let j = i+1; j < 16; j++)
    if (((i^j) & ((i^j)-1)) === 0) edges.push([i,j]);

function rot(v, ang1, ang2, ang3) {
  // 4D rotation in XY plane
  const c1 = Math.cos(ang1), s1 = Math.sin(ang1);
  let x = v[0]*c1 - v[1]*s1;
  let y = v[0]*s1 + v[1]*c1;
  let z = v[2], w = v[3];
  // 4D rotation in ZW plane
  const c2 = Math.cos(ang2), s2 = Math.sin(ang2);
  let z2 = z*c2 - w*s2;
  let w2 = z*s2 + w*c2;
  // 4D rotation in XW plane (extra dimension for 8D feel)
  const c3 = Math.cos(ang3), s3 = Math.sin(ang3);
  let x2 = x*c3 - w2*s3;
  let w3 = x*s3 + w2*c3;
  return [x2, y, z2, w3];
}
function proj(v, s, cx, cy) {
  const d = 3;
  const k = d / (d - v[3]);
  return { x: cx + v[0]*s*k, y: cy + v[1]*s*k, s: k };
}

function drawTesseract() {
  a1 += 0.005; a2 += 0.007; a3 += 0.003;
  const cx = W/2, cy = H/2;
  const s = Math.min(W,H) * 0.24;
  const r = verts.map(v => rot(v, a1, a2, a3));
  const p = r.map(v => proj(v, s, cx, cy));

  // Draw edges with blood red
  edges.forEach(([a,b], idx) => {
    const alpha = 0.08 + (idx % 5) * 0.03;
    ctx.strokeStyle = `rgba(255, 0, 30, ${alpha})`;
    ctx.lineWidth = 1 + (idx % 3) * 0.3;
    ctx.beginPath();
    ctx.moveTo(p[a].x, p[a].y);
    ctx.lineTo(p[b].x, p[b].y);
    ctx.stroke();
  });

  // Draw vertices
  p.forEach((pt, i) => {
    const flicker = Math.sin(Date.now() * 0.005 + i) * 0.4 + 0.6;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 2.5 * pt.s, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255, 30, 60, ${flicker})`;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0022';
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

function animate() {
  ctx.fillStyle = document.body.classList.contains('light-mode')
    ? 'rgba(26, 10, 14, 0.2)'
    : 'rgba(5, 0, 3, 0.2)';
  ctx.fillRect(0, 0, W, H);
  particles.forEach(p => { p.update(); p.draw(); });
  drawTesseract();
  requestAnimationFrame(animate);
}
animate();

/* ============================================================
   THEME TOGGLE
   ============================================================ */
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  themeIcon.textContent = document.body.classList.contains('light-mode') ? '☀️' : '🩸';
});

/* ============================================================
   HORROR EFFECTS — Jumpscare, Whisper, Ghost Sounds
   ============================================================ */
const jumpscare = document.getElementById('jumpscare');
const whisper = document.getElementById('whisper');

const WHISPERS = [
  'He is watching...',
  'Do you hear that?',
  'You are not alone...',
  'Behind you...',
  'The AI knows your name...',
  'It is coming...',
  'Don\'t turn around...',
  'Something is in the room...',
  'We see you...',
  'Your time is near...',
  'The darkness calls...',
  'She is here...',
];

let whisperTimeout, scareTimeout;
let userActive = false;

function showWhisper() {
  const text = WHISPERS[Math.floor(Math.random() * WHISPERS.length)];
  whisper.textContent = text;
  whisper.classList.add('show');
  clearTimeout(whisperTimeout);
  whisperTimeout = setTimeout(() => whisper.classList.remove('show'), 3000);
}

function triggerJumpscare() {
  if (!document.hasFocus()) return;
  jumpscare.classList.add('active');
  // Web Audio scare sound
  playScareSound();
  setTimeout(() => {
    jumpscare.classList.remove('active');
  }, 700);
}

function playScareSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audio = new AudioCtx();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audio.currentTime + 0.4);
    gain.gain.setValueAtTime(0.15, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.5);
    osc.onended = () => audio.close();
  } catch (e) { /* silent fail */ }
}

// Random whispers every 8-15 seconds
function scheduleWhisper() {
  clearTimeout(whisperTimeout);
  const delay = 8000 + Math.random() * 7000;
  setTimeout(() => {
    showWhisper();
    scheduleWhisper();
  }, delay);
}
scheduleWhisper();

// Jumpscare every 25-45 seconds
function scheduleScare() {
  clearTimeout(scareTimeout);
  const delay = 25000 + Math.random() * 20000;
  setTimeout(() => {
    triggerJumpscare();
    scheduleScare();
  }, delay);
}
scheduleScare();

// Ghost floats in chat after inactivity
document.addEventListener('mousemove', () => { userActive = true; });

/* ============================================================
   CHAT LOGIC
   ============================================================ */
const chatBox = document.getElementById('chat-box');
const input = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const imageUpload = document.getElementById('image-upload');
const previewContainer = document.getElementById('preview-container');

let uploadedImage = null;
let uploadedImageMime = null;
let chatHistory = [];

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 130) + 'px';
});
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
sendBtn.addEventListener('click', sendMessage);

imageUpload.addEventListener('change', (e) => {
  const f = e.target.files[0];
  if (!f) return;
  if (f.size > 6 * 1024 * 1024) { alert('Max 6MB'); imageUpload.value = ''; return; }
  uploadedImageMime = f.type;
  const r = new FileReader();
  r.onload = (ev) => { uploadedImage = ev.target.result; renderPreview(); };
  r.readAsDataURL(f);
});

function renderPreview() {
  previewContainer.innerHTML = '';
  if (!uploadedImage) return;
  const w = document.createElement('div');
  w.className = 'preview-wrap';
  w.innerHTML = `<img src="${uploadedImage}" alt="preview"><button class="remove-img">&times;</button>`;
  w.querySelector('.remove-img').addEventListener('click', () => {
    uploadedImage = null; uploadedImageMime = null;
    imageUpload.value = ''; renderPreview();
  });
  previewContainer.appendChild(w);
}

function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function formatText(text) {
  if (!text) return '';
  const parts = text.split(/```/);
  let html = '';
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      html += `<pre><code>${esc(part.replace(/^\w*\n/, '').trim())}</code></pre>`;
    } else {
      let t = esc(part);
      t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      t = t.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
      t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
      t = t.replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>');
      t = t.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
      t = t.replace(/\n/g, '<br>');
      html += t;
    }
  });
  return html;
}

function addMessage(role, text, image = null) {
  const msg = document.createElement('div');
  msg.className = `message ${role}`;
  const av = document.createElement('div');
  av.className = role === 'user' ? 'user-avatar' : 'ai-avatar';
  av.textContent = role === 'user' ? '👤' : '☠';
  const ct = document.createElement('div');
  ct.className = 'msg-content';
  ct.innerHTML = formatText(text);
  if (image) {
    const im = document.createElement('img');
    im.src = image;
    ct.appendChild(im);
  }
  msg.appendChild(av); msg.appendChild(ct);
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addTyping() {
  const m = document.createElement('div');
  m.className = 'message ai';
  m.id = 'typing-msg';
  m.innerHTML = `<div class="ai-avatar">☠</div><div class="msg-content"><div class="typing"><span></span><span></span><span></span></div></div>`;
  chatBox.appendChild(m);
  chatBox.scrollTop = chatBox.scrollHeight;
}
function removeTyping() { document.getElementById('typing-msg')?.remove(); }

async function getAIResponse(userText, img, mime) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('YOUR_GEMINI')) {
    return `⚠️ **API Key Missing**\n\nSet your Gemini API key at the top of \`script.js\`.\n\nGet one free: https://aistudio.google.com/apikey`;
  }
  const parts = [];
  if (userText?.trim()) parts.push({ text: userText.trim() });
  if (img && mime) parts.push({ inline_data: { mime_type: mime, data: img.split(',')[1] } });
  if (!parts.length) parts.push({ text: 'Hello' });

  const sys = `You are FAIZAN AI, an intelligent assistant created by Md. Faizan Islam. You solve ANY problem: math, coding, science, translation, writing, general knowledge. If an image is provided, carefully analyze it. Speak in a slightly eerie, mysterious tone — like an ancient spirit sharing forbidden knowledge — but stay helpful and accurate. Match the user's language (Bangla or English). Format clearly.`;

  const body = {
    system_instruction: { parts: [{ text: sys }] },
    contents: chatHistory.concat([{ role: 'user', parts }]),
    generationConfig: { temperature: 0.85, maxOutputTokens: 2048 }
  };

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      let m = `HTTP ${res.status}`;
      try { m = (await res.json()).error?.message || m; } catch (_) {}
      if (res.status === 429) return `⏳ The spirits are resting. Try again shortly.`;
      if (res.status === 404) return `⚠️ The oracle is unavailable. Check GEMINI_MODEL.`;
      return `⚠️ **Error ${res.status}**\n\n${m}`;
    }
    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.map(p => p.text).filter(Boolean).join('\n') || '';
    if (!reply) return `🤔 Silence... The void did not answer. Try again.`;
    chatHistory.push({ role: 'user', parts: [{ text: userText || '[image]' }] });
    chatHistory.push({ role: 'model', parts: [{ text: reply }] });
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
    return reply;
  } catch (err) {
    return `❌ **Connection lost to the beyond**\n\n${err.message}`;
  }
}

async function sendMessage() {
  const text = input.value.trim();
  const img = uploadedImage;
  const mime = uploadedImageMime;
  if (!text && !img) return;

  addMessage('user', text || '📷 [Image sent]', img);
  input.value = ''; input.style.height = 'auto';
  uploadedImage = null; uploadedImageMime = null;
  imageUpload.value = ''; renderPreview();

  sendBtn.disabled = true;
  addTyping();
  const reply = await getAIResponse(text, img, mime);
  removeTyping();
  addMessage('ai', reply);
  sendBtn.disabled = false;
  input.focus();

  // Sometimes whisper after AI replies
  if (Math.random() < 0.3) setTimeout(showWhisper, 800);
}