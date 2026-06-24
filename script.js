// ============================================================
// HURAIRAH AI — script.js (FIXED VERSION)
// ============================================================

// ── CONFIG ──────────────────────────────────────────────────
const WORKER_URL = "https://hurairah-ai.annu8857818.workers.dev/";
const ELEVENLABS_API_KEY = "sk_C06CHhWf5L2CIsFse1cFCwBeE9VRp3cs";
const ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

// ── STATE ────────────────────────────────────────────────────
let userName = "";
let chatHistory = [];
let hurairahHistory = [];
let selectedImage = null;
let isTyping = false;
let recognition = null;
let hurairahMode = false;

// ── INIT ─────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  loadHistory();
  initNameModal();
  initInputArea();
  initMic();
  initClearBtn();
  initAttachBtn();
});

// ── NAME MODAL ───────────────────────────────────────────────
function initNameModal() {
  const modal = document.getElementById("nameModal");
  const input = document.getElementById("nameInput");
  const btn = document.getElementById("nameSubmitBtn");

  const saved = localStorage.getItem("hurairah_username");
  if (saved) {
    userName = saved;
    modal.style.display = "none";
    greetUser();
    return;
  }

  modal.style.display = "flex";
  setTimeout(() => input.focus(), 300);

  btn.addEventListener("click", submitName);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitName();
  });
}

function submitName() {
  const input = document.getElementById("nameInput");
  const name = input.value.trim();
  if (!name) {
    input.classList.add("shake");
    setTimeout(() => input.classList.remove("shake"), 500);
    return;
  }
  userName = name;
  localStorage.setItem("hurairah_username", name);
  const modal = document.getElementById("nameModal");
  modal.style.opacity = "0";
  modal.style.transform = "scale(0.95)";
  setTimeout(() => {
    modal.style.display = "none";
    greetUser();
  }, 300);
}

function greetUser() {
  const welcome = document.querySelector(".welcome-screen");
  if (welcome) {
    const h1 = welcome.querySelector("h1");
    if (h1) h1.textContent = `Hello, ${userName}! 👋`;
  }
}

// ── CHAT HISTORY ─────────────────────────────────────────────
function saveHistory() {
  localStorage.setItem("hurairah_chat", JSON.stringify(chatHistory));
}

function loadHistory() {
  const saved = localStorage.getItem("hurairah_chat");
  if (!saved) return;
  try {
    chatHistory = JSON.parse(saved);
    if (chatHistory.length > 0) {
      const welcome = document.querySelector(".welcome-screen");
      if (welcome) welcome.style.display = "none";
      chatHistory.forEach((msg) => {
        renderMessage(msg.role === "user" ? "user" : "bot", msg.content, false);
      });
    }
  } catch (e) {
    chatHistory = [];
  }
}

// ── INPUT AREA ───────────────────────────────────────────────
function initInputArea() {
  const textarea = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");

  textarea.addEventListener("input", () => {
    textarea.style.height = "32px";
    textarea.style.height = Math.min(textarea.scrollHeight, 80) + "px";
  });

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener("click", sendMessage);
}

// ── SEND MESSAGE ─────────────────────────────────────────────
async function sendMessage() {
  if (isTyping) return;

  const textarea = document.getElementById("messageInput");
  const text = textarea.value.trim();
  if (!text && !selectedImage) return;

  const welcome = document.querySelector(".welcome-screen");
  if (welcome) welcome.style.display = "none";

  renderMessage("user", text, true, selectedImage);
  textarea.value = "";
  textarea.style.height = "32px";

  const imgData = selectedImage;
  clearImagePreview();

  const lower = text.toLowerCase();

  // Image generation — handle locally
  if (
    lower.includes("image banao") || lower.includes("image bana") ||
    lower.includes("photo banao") || lower.includes("generate image") ||
    lower.includes("draw") || lower.includes("create image") ||
    lower.includes("tasveer")
  ) {
    await handleImageGeneration(text);
    return;
  }

  // Hurairah Mode trigger
  if (
    lower.includes("hurairah mode") ||
    lower.includes("romantic mode") ||
    lower.includes("girlfriend mode")
  ) {
    openHurairahMode();
    return;
  }

  // All other messages — send to Worker
  await handleAIResponse(text, imgData);
}

// ── CHIP CLICK ───────────────────────────────────────────────
function chipClick(text) {
  document.getElementById("messageInput").value = text;
  sendMessage();
}

// ── AI RESPONSE via Worker ───────────────────────────────────
async function handleAIResponse(text, imgData = null) {
  isTyping = true;
  const thinkingEl = showThinking("chatBox");

  chatHistory.push({ role: "user", content: text });
  if (chatHistory.length > 40) chatHistory.splice(0, 2);

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        username: userName || "GuestUser",
        image: imgData || null,
        hurairahMode: false
      })
    });

    const data = await response.json();
    thinkingEl.remove();

    const reply = data.reply || "Kuch gadbad ho gayi, dobara try karo!";
    chatHistory.push({ role: "assistant", content: reply });
    saveHistory();
    renderMessage("bot", reply, true);
    scrollBottom("chatBox");

  } catch (err) {
    thinkingEl.remove();
    renderMessage("bot", "⚠️ Network error. Internet check karo!", true);
    chatHistory.pop();
  }

  isTyping = false;
}

// ── IMAGE GENERATION ─────────────────────────────────────────
async function handleImageGeneration(text) {
  const thinkingEl = showThinking("chatBox");
  isTyping = true;

  const prompt = text
    .replace(/image banao|image bana|photo banao|generate image|draw|create image|tasveer|ki|ka|ek/gi, "")
    .trim() || "beautiful landscape";

  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${Date.now()}`;

  thinkingEl.remove();

  const chatBox = document.getElementById("chatBox");
  const msgDiv = document.createElement("div");
  msgDiv.className = "message bot";

  msgDiv.innerHTML = `
    <div class="bot-header">
      <div class="bot-avatar">✨</div>
      <span class="bot-name">Hurairah AI</span>
    </div>
    <p style="margin-bottom:10px;color:#c4b5fd;">🎨 "${prompt}" — yeh raha!</p>
    <img src="${url}" alt="Generated" style="width:100%;max-width:280px;border-radius:14px;border:1px solid rgba(124,58,237,0.4);" onerror="this.parentElement.innerHTML+='<p style=color:#ef4444>⚠️ Image generate nahi hui.</p>'">
    <div class="time">${getTime()}</div>
  `;

  chatBox.appendChild(msgDiv);
  scrollBottom("chatBox");
  isTyping = false;
}

// ── RENDER MESSAGE ───────────────────────────────────────────
function renderMessage(role, text, save = true, imgData = null) {
  const chatBox = document.getElementById("chatBox");
  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${role}`;

  if (role === "user") {
    let content = "";
    if (imgData) content += `<img src="${imgData}" class="msg-image" alt="uploaded">`;
    if (text) content += `<div>${escapeHtml(text)}</div>`;
    content += `<div class="time">${getTime()}</div>`;
    msgDiv.innerHTML = content;
  } else {
    msgDiv.innerHTML = `
      <div class="bot-header">
        <div class="bot-avatar">✨</div>
        <span class="bot-name">Hurairah AI</span>
      </div>
      <div class="bot-content">${formatBotText(text)}</div>
      <div class="time">${getTime()}</div>
      <button class="speak-btn" onclick="speakText(this, \`${text.replace(/`/g, "'")}\`)">🔊 Sunao</button>
    `;
  }

  chatBox.appendChild(msgDiv);
  scrollBottom("chatBox");
}

// ── FORMAT BOT TEXT ──────────────────────────────────────────
function formatBotText(text) {
  text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (_, lang, code) => {
    const l = lang || "code";
    const id = "code_" + Math.random().toString(36).slice(2, 7);
    return `<pre><div class="code-header"><span class="code-lang">${l}</span><button class="copy-btn" onclick="copyCode('${id}',this)">📋 Copy</button></div><code id="${id}">${escapeHtml(code.trim())}</code></pre>`;
  });
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  text = text.replace(/^### (.+)$/gm, '<h4 style="color:#a78bfa;margin:8px 0 4px">$1</h4>');
  text = text.replace(/^## (.+)$/gm, '<h3 style="color:#c4b5fd;margin:10px 0 4px">$1</h3>');
  text = text.replace(/^# (.+)$/gm, '<h2 style="color:#e9d5ff;margin:10px 0 6px">$1</h2>');
  text = text.replace(/^[-*] (.+)$/gm, '<li style="margin:3px 0;padding-left:4px">• $1</li>');
  text = text.replace(/^(\d+)\. (.+)$/gm, '<li style="margin:3px 0;padding-left:4px">$1. $2</li>');
  text = text.replace(/\n/g, '<br>');
  return text;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── COPY CODE ────────────────────────────────────────────────
function copyCode(id, btn) {
  const code = document.getElementById(id);
  if (!code) return;
  navigator.clipboard.writeText(code.innerText).then(() => {
    btn.textContent = "✅ Copied!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = "📋 Copy";
      btn.classList.remove("copied");
    }, 2000);
  });
}

// ── TTS (ElevenLabs) ────────────────────────────────────────
async function speakText(btn, text) {
  const plain = text.replace(/<[^>]+>/g, "").trim();
  if (!plain) return;

  btn.textContent = "⏳ Loading...";
  btn.disabled = true;

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: plain.slice(0, 500),
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!res.ok) throw new Error("TTS failed");

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
    btn.textContent = "🔊 Bol raha hai...";
    audio.onended = () => {
      btn.textContent = "🔊 Sunao";
      btn.disabled = false;
    };
  } catch (e) {
    const utter = new SpeechSynthesisUtterance(plain.slice(0, 500));
    utter.lang = "hi-IN";
    speechSynthesis.speak(utter);
    btn.textContent = "🔊 Sunao";
    btn.disabled = false;
  }
}

// ── MIC ──────────────────────────────────────────────────────
function initMic() {
  const micBtn = document.getElementById("micBtn");
  if (!micBtn) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micBtn.style.opacity = "0.4";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "hi-IN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let listening = false;
  const popup = document.getElementById("recordingPopup");

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    document.getElementById("messageInput").value = transcript;
    stopListening();
    sendMessage();
  };

  recognition.onerror = () => stopListening();
  recognition.onend = () => stopListening();

  function startListening() {
    listening = true;
    micBtn.textContent = "⏹️";
    if (popup) popup.style.display = "flex";
    recognition.start();
  }

  function stopListening() {
    listening = false;
    micBtn.textContent = "🎙️";
    if (popup) popup.style.display = "none";
    try { recognition.stop(); } catch (e) {}
  }

  micBtn.addEventListener("click", () => {
    if (listening) stopListening();
    else startListening();
  });
}

// ── ATTACH IMAGE ─────────────────────────────────────────────
function initAttachBtn() {
  const attachBtn = document.getElementById("attachBtn");
  const imageInput = document.getElementById("imageInput");

  attachBtn.addEventListener("click", () => imageInput.click());

  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      selectedImage = ev.target.result;
      showImagePreview(file.name, selectedImage);
    };
    reader.readAsDataURL(file);
    imageInput.value = "";
  });
}

function showImagePreview(name, src) {
  let preview = document.getElementById("imagePreview");
  if (!preview) {
    preview = document.createElement("div");
    preview.id = "imagePreview";
    document.querySelector(".app").appendChild(preview);
  }
  preview.innerHTML = `
    <div class="preview-inner">
      <img src="${src}" alt="preview">
      <button class="preview-remove" onclick="clearImagePreview()">✕</button>
    </div>
    <span class="preview-name">${escapeHtml(name)}</span>
  `;
  preview.style.display = "flex";
}

function clearImagePreview() {
  selectedImage = null;
  const preview = document.getElementById("imagePreview");
  if (preview) preview.style.display = "none";
}

// ── CLEAR CHAT ───────────────────────────────────────────────
function initClearBtn() {
  document.getElementById("clearBtn").addEventListener("click", () => {
    if (confirm("Saari chat delete karni hai?")) {
      chatHistory = [];
      localStorage.removeItem("hurairah_chat");
      const chatBox = document.getElementById("chatBox");
      chatBox.innerHTML = `
        <div class="welcome-screen">
          <div class="online-badge">🟢 Online</div>
          <div class="logo-wrap">
            <img src="logo.png" alt="Hurairah AI">
            <div class="logo-ring"></div>
          </div>
          <h1>Hello, ${userName}! 👋</h1>
          <h2>I'm Hurairah AI</h2>
          <p>How can I help you today?</p>
          <div class="welcome-chips">
            <span onclick="chipClick('Tumse kuch poochna tha')">💬 Baat karo</span>
            <span onclick="chipClick('Meri madad karo')">🤝 Madad lo</span>
            <span onclick="chipClick('Kuch interesting batao')">✨ Explore</span>
          </div>
        </div>`;
    }
  });
}

// ── HURAIRAH (ROMANTIC) MODE ─────────────────────────────────
function openHurairahMode() {
  if (document.getElementById("hurairahOverlay")) return;

  hurairahHistory = [];

  const overlay = document.createElement("div");
  overlay.id = "hurairahOverlay";
  overlay.className = "hurairah-mode-overlay";
  overlay.innerHTML = `
    <div class="h-floating-hearts" id="hHearts"></div>
    <div class="hurairah-topbar">
      <div class="hurairah-brand">💕 Hurairah Mode</div>
      <button class="hurairah-exit-btn" onclick="closeHurairahMode()">✕ Exit</button>
    </div>
    <div class="hurairah-chat-box" id="hurairahChatBox">
      <div class="hurairah-welcome">
        <div class="hurairah-heart-anim">💕</div>
        <h2>Main hoon tumhari Hurairah 🌸</h2>
        <p>Aao, dil ki baatein karte hain...<br>Sirf tum aur main 💖</p>
      </div>
    </div>
    <div class="hurairah-input-area">
      <textarea id="hInput" placeholder="Dil ki baat likho..." rows="1"
        style="flex:1;background:transparent;border:none;outline:none;color:white;font-size:15px;resize:none;padding:6px 4px;min-height:32px;max-height:80px;"></textarea>
      <button class="h-send-btn" id="hSendBtn">💌</button>
    </div>
  `;

  document.body.appendChild(overlay);
  hurairahMode = true;

  spawnHeartsIn(document.getElementById("hHearts"));

  const hInput = document.getElementById("hInput");
  const hSendBtn = document.getElementById("hSendBtn");

  hInput.addEventListener("input", () => {
    hInput.style.height = "32px";
    hInput.style.height = Math.min(hInput.scrollHeight, 80) + "px";
  });

  hInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendHurairahMessage();
    }
  });

  hSendBtn.addEventListener("click", sendHurairahMessage);
  setTimeout(() => hInput.focus(), 300);
}

function closeHurairahMode() {
  const overlay = document.getElementById("hurairahOverlay");
  if (overlay) overlay.remove();
  hurairahMode = false;
}

async function sendHurairahMessage() {
  const hInput = document.getElementById("hInput");
  const text = hInput.value.trim();
  if (!text || isTyping) return;

  hInput.value = "";
  hInput.style.height = "32px";

  const chatBox = document.getElementById("hurairahChatBox");
  const welcome = chatBox.querySelector(".hurairah-welcome");
  if (welcome) welcome.remove();

  // User message
  const uDiv = document.createElement("div");
  uDiv.className = "h-msg h-user";
  uDiv.innerHTML = `${escapeHtml(text)}<div class="time">${getTime()}</div>`;
  chatBox.appendChild(uDiv);
  scrollBottom("hurairahChatBox");

  // Thinking dots
  const thinkEl = document.createElement("div");
  thinkEl.className = "h-thinking";
  thinkEl.innerHTML = `<div class="h-dot"></div><div class="h-dot"></div><div class="h-dot"></div>`;
  chatBox.appendChild(thinkEl);
  scrollBottom("hurairahChatBox");
  isTyping = true;

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        username: "Mehajabeen",
        hurairahMode: true
      })
    });

    const data = await res.json();
    thinkEl.remove();
    const reply = data.reply || "💕 Tumhare liye hamesha hoon...";
    hurairahHistory.push({ role: "assistant", content: reply });

    const bDiv = document.createElement("div");
    bDiv.className = "h-msg h-bot";
    bDiv.innerHTML = `
      <div class="h-bot-header">
        <div class="h-bot-avatar">💕</div>
        <span class="h-bot-name">Hurairah</span>
      </div>
      <div>${formatBotText(reply)}</div>
      <div class="time">${getTime()}</div>
      <button class="h-speak-btn" onclick="speakText(this, \`${reply.replace(/`/g, "'")}\`)">🔊 Sunao</button>
    `;
    chatBox.appendChild(bDiv);
    scrollBottom("hurairahChatBox");

  } catch (e) {
    thinkEl.remove();
    const bDiv = document.createElement("div");
    bDiv.className = "h-msg h-bot";
    bDiv.textContent = "⚠️ Network gadbad hai jaan...";
    chatBox.appendChild(bDiv);
  }

  isTyping = false;
}

// ── FLOATING HEARTS ──────────────────────────────────────────
function spawnHeartsIn(container) {
  if (!container) return;
  const hearts = ["💕", "❤️", "💖", "💗", "🌸", "✨", "💝"];
  setInterval(() => {
    if (!container.isConnected) return;
    const h = document.createElement("div");
    h.className = "h-heart";
    h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    h.style.left = Math.random() * 100 + "%";
    h.style.animationDuration = (4 + Math.random() * 4) + "s";
    h.style.fontSize = (14 + Math.random() * 18) + "px";
    container.appendChild(h);
    setTimeout(() => h.remove(), 8000);
  }, 1200);
}

// ── HELPERS ──────────────────────────────────────────────────
function showThinking(boxId) {
  const chatBox = document.getElementById(boxId);
  const el = document.createElement("div");
  el.className = "thinking";
  el.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div>`;
  chatBox.appendChild(el);
  scrollBottom(boxId);
  return el;
}

function scrollBottom(boxId) {
  const box = document.getElementById(boxId);
  if (box) box.scrollTop = box.scrollHeight;
}

function getTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
