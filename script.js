const API_URL = "https://hurairah-ai.annu8857818.workers.dev";
const ELEVENLABS_API_KEY = "sk_ba5c973ec598f00b7293cc1f37675eb24f52363489ea82be";
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

let username = localStorage.getItem("hurairah_username");
let currentAudioInstance = null;
let fxInterval = null;
const maxElements = 15; 

// Ultra-Premium Cinematic Studio Graphics
function injectRomanticStyles() {
  if (document.getElementById("romanticDynamicStyles")) return;
  const style = document.createElement("style");
  style.id = "romanticDynamicStyles";
  style.textContent = `
    body.romantic-mode-on {
      background: radial-gradient(circle at center, #2e0542 0%, #09090e 100%) !important;
      transition: background 2s ease;
    }
    body.romantic-mode-on::before {
      content: "";
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: radial-gradient(circle at 50% 50%, rgba(255, 64, 129, 0.15) 0%, transparent 70%);
      animation: breathe 4s infinite alternate ease-in-out;
      pointer-events: none;
      z-index: 2;
    }
    @keyframes breathe {
      from { transform: scale(1); opacity: 0.5; }
      to { transform: scale(1.2); opacity: 0.9; }
    }
    body.romantic-mode-on #chatBox {
      background: transparent !important;
    }
    .romantic-reply {
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
      background: rgba(255, 64, 129, 0.15) !important;
      backdrop-filter: blur(15px);
      -webkit-backdrop-filter: blur(15px);
      color: #fff !important;
      box-shadow: 0 0 20px rgba(255, 64, 129, 0.3) !important;
      padding: 16px 20px !important;
      border-radius: 24px !important;
      transform: translateZ(0);
      will-change: transform;
      animation: smoothFloat 2s infinite alternate ease-in-out;
    }
    @keyframes smoothFloat {
      0% { transform: translateY(0) translateZ(0); }
      100% { transform: translateY(-4px) translateZ(0); }
    }
    .vfx-layer {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 1;
    }
    .sphere {
      position: absolute; border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, rgba(255, 100, 150, 0.3), transparent 70%);
      transform: translateZ(0); will-change: transform;
      animation: floatUp 12s infinite linear;
    }
    @keyframes floatUp {
      from { transform: translateY(110vh) translateZ(0); }
      to { transform: translateY(-30vh) translateZ(0); }
    }
    .sparkle-fx {
      position: absolute; color: #ff85a2;
      text-shadow: 0 0 8px rgba(255, 64, 129, 0.5);
      transform: translateZ(0); will-change: transform, opacity;
      animation: smoothDrop 5s linear infinite;
    }
    @keyframes smoothDrop {
      0% { transform: translateY(-10vh) rotate(0deg) scale(0.6); opacity: 0; }
      10% { opacity: 0.7; }
      90% { opacity: 0.7; }
      100% { transform: translateY(110vh) rotate(360deg) scale(1.2); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

function triggerRomanticUI() {
  injectRomanticStyles();
  document.body.classList.add("romantic-mode-on");
  
  const container = document.querySelector(".chat-container") || document.querySelector(".chat-wrapper");
  if (container) {
    container.style.background = "rgba(255, 255, 255, 0.02)";
    container.style.border = "1px solid rgba(255, 64, 129, 0.3)";
    container.style.boxShadow = "0 25px 60px rgba(82, 5, 59, 0.3), 0 0 30px rgba(255, 64, 129, 0.5)";
  }
  
  const header = document.getElementById("appHeader") || document.querySelector(".chat-header");
  if (header) {
    header.innerHTML = "Meri jaan 💕";
    header.style.color = "#ff85a2";
    header.style.textShadow = "0 0 15px #ff4081";
  }

  if (!document.getElementById("vfxLayer")) {
    const layer = document.createElement("div");
    layer.id = "vfxLayer";
    layer.className = "vfx-layer";
    document.body.appendChild(layer);
    
    for(let i = 0; i < 7; i++) {
      const s = document.createElement("div");
      s.className = "sphere";
      const size = Math.random() * 90 + 60;
      s.style.width = size + "px";
      s.style.height = size + "px";
      s.style.left = Math.random() * 100 + "%";
      s.style.animationDuration = (Math.random() * 5 + 9) + "s";
      s.style.animationDelay = (Math.random() * 6) + "s";
      layer.appendChild(s);
    }
  }

  if (!fxInterval) {
    fxInterval = setInterval(addSparkles, 400);
  }
}

function addSparkles() {
  const layer = document.getElementById("vfxLayer");
  if (!layer || layer.children.length >= maxElements + 7) return;

  const item = document.createElement("div");
  item.className = "sparkle-fx";
  const pool = ["💖", "✨", "💕", "🌸", "❤️"];
  item.innerHTML = pool[Math.floor(Math.random() * pool.length)];
  
  item.style.left = Math.random() * 95 + "vw";
  item.style.animationDuration = (Math.random() * 2 + 4) + "s";
  item.style.fontSize = (Math.random() * 10 + 16) + "px"; 
  
  layer.appendChild(item);
  setTimeout(() => item.remove(), 5000);
}

if (username) {
  document.getElementById("nameModal").style.display = "none";
} else {
  document.getElementById("nameModal").style.display = "flex";
}

document.getElementById("nameSubmitBtn").addEventListener("click", () => {
  const val = document.getElementById("nameInput").value.trim();
  if (!val) {
    document.getElementById("nameInput").classList.add("shake");
    document.getElementById("nameInput").placeholder = "Naam dalna zaroori hai! ⚠️";
    setTimeout(() => document.getElementById("nameInput").classList.remove("shake"), 500);
    return;
  }
  username = val;
  localStorage.setItem("hurairah_username", username);
  const modal = document.getElementById("nameModal");
  modal.style.opacity = "0"; modal.style.transform = "scale(0.95)";
  setTimeout(() => modal.style.display = "none", 300);
});

if (!sessionStorage.getItem("hurairah_session_active")) {
  localStorage.removeItem("hurairah_chat");
  sessionStorage.setItem("hurairah_session_active", "true");
}

let messages = JSON.parse(localStorage.getItem("hurairah_chat") || "[]");
let hurairahMode = sessionStorage.getItem("hurairah_mode") === "true";

if (hurairahMode) {
  setTimeout(triggerRomanticUI, 500);
}

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

if (messages.length > 0) {
  const welcome = document.querySelector(".welcome-screen");
  if (welcome) welcome.remove();
  
  messages.forEach(msg => {
    const msgEl = document.createElement("div");
    msgEl.className = `message ${msg.type}`;
    if (msg.type === "bot") {
      const isRomanticActive = localStorage.getItem("hurairah_chat_romantic") === "true" || hurairahMode;
      const extraClass = isRomanticActive ? "romantic-reply" : "";
      msgEl.innerHTML = `
        <div class="bot-header"><div class="bot-avatar">✨</div><div class="bot-name">Hurairah AI</div></div>
        <div class="msg-text ${extraClass}">${msg.text}</div>
        <div class="audio-controls-row" style="display:flex; gap:6px; margin-top:4px;"><button class="speak-btn">🔊 Suno</button></div>
      `;
    } else {
      msgEl.innerHTML = `<div class="msg-text">${msg.text}</div>`;
    }
    chatBox.appendChild(msgEl);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

function getTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;

  if (type === "bot") {
    const isRomanticText = hurairahMode || text.includes("Meri jaan") || text.includes("babu") || text.includes("Assalamualaikum");
    const rClass = isRomanticText ? "romantic-reply" : "";
    msg.innerHTML = `
      <div class="bot-header"><div class="bot-avatar">✨</div><div class="bot-name">Hurairah AI</div></div>
      <div class="msg-text ${rClass}">${text}</div>
      <div class="time">${getTime()}</div>
    `;
  } else {
    msg.innerHTML = `<div class="msg-text">${text}</div> <div class="time">${getTime()}</div>`;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  messages.push({ text, type });
  localStorage.setItem("hurairah_chat", JSON.stringify(messages));
}

function showThinking() { 
  const thinking = document.createElement("div"); 
  thinking.className = "thinking"; thinking.id = "thinking"; 
  thinking.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div><span class="thinking-text">Likh raha hai...</span>`; 
  chatBox.appendChild(thinking); chatBox.scrollTop = chatBox.scrollHeight; 
}
function removeThinking() { const t = document.getElementById("thinking"); if (t) t.remove(); }

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  const isWeatherQuery = ["weather", "mausam", "mosam", "tapman", "baarish", "barish", "rain", "temperature", "vedar", "wheather"].some(k => text.toLowerCase().includes(k));

  if (text.toLowerCase() === "mehajabeen pgl hu") {
    hurairahMode = true;
    sessionStorage.setItem("hurairah_mode", "true");
    localStorage.setItem("hurairah_chat_romantic", "true");
    injectRomanticStyles();
  }

  const welcome = document.querySelector(".welcome-screen");
  if (welcome) welcome.remove();

  addMessage(text, "user");
  input.value = ""; chatBox.scrollTop = chatBox.scrollHeight;
  showThinking();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, message: text, hurairahMode, weatherQuery: isWeatherQuery })
    });
    const data = await res.json();
    removeThinking();
    
    addMessage(data.reply || "Response nahi mila", "bot");

    if (hurairahMode) { triggerRomanticUI(); }

  } catch (err) {
    removeThinking();
    addMessage("Error: " + err.message, "bot");
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } });
document.getElementById("clearBtn").addEventListener("click", () => {
  localStorage.removeItem("hurairah_chat"); localStorage.removeItem("hurairah_chat_romantic"); sessionStorage.removeItem("hurairah_mode");
  messages = []; location.reload();
});
    
