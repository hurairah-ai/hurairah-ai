const API_URL = "https://hurairah-ai.annu8857818.workers.dev";
const ELEVENLABS_API_KEY = "sk_ba5c973ec598f00b7293cc1f37675eb24f52363489ea82be";
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

let username = localStorage.getItem("hurairah_username");
let currentAudioInstance = null;
let fxInterval = null;
const maxElements = 15; 
let selectedImage = null;

function injectRomanticStyles() {
  if (document.getElementById("romanticDynamicStyles")) return;
  const style = document.createElement("style");
  style.id = "romanticDynamicStyles";
  style.textContent = `
    body.romantic-mode-on { background: radial-gradient(circle at center, #2e0542 0%, #09090e 100%) !important; transition: background 2s ease; }
    body.romantic-mode-on::before { content: ""; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle at 50% 50%, rgba(255, 64, 129, 0.15) 0%, transparent 70%); animation: breathe 4s infinite alternate ease-in-out; pointer-events: none; z-index: 2; }
    @keyframes breathe { from { transform: scale(1); opacity: 0.5; } to { transform: scale(1.2); opacity: 0.9; } }
    body.romantic-mode-on #chatBox { background: transparent !important; }
    .romantic-reply { border: 1px solid rgba(255, 255, 255, 0.2) !important; background: rgba(255, 64, 129, 0.15) !important; backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); color: #fff !important; box-shadow: 0 0 20px rgba(255, 64, 129, 0.3) !important; padding: 16px 20px !important; border-radius: 24px !important; transform: translateZ(0); will-change: transform; animation: smoothFloat 2s infinite alternate ease-in-out; }
    @keyframes smoothFloat { 0% { transform: translateY(0) translateZ(0); } 100% { transform: translateY(-4px) translateZ(0); } }
    .vfx-layer { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1; }
    .sphere { position: absolute; border-radius: 50%; background: radial-gradient(circle at 30% 30%, rgba(255, 100, 150, 0.3), transparent 70%); transform: translateZ(0); will-change: transform; animation: floatUp 12s infinite linear; }
    @keyframes floatUp { from { transform: translateY(110vh) translateZ(0); } to { transform: translateY(-30vh) translateZ(0); } }
    .sparkle-fx { position: absolute; color: #ff85a2; text-shadow: 0 0 8px rgba(255, 64, 129, 0.5); transform: translateZ(0); will-change: transform, opacity; animation: smoothDrop 5s linear infinite; }
    @keyframes smoothDrop { 0% { transform: translateY(-10vh) rotate(0deg) scale(0.6); opacity: 0; } 10% { opacity: 0.7; } 90% { opacity: 0.7; } 100% { transform: translateY(110vh) rotate(360deg) scale(1.2); opacity: 0; } }
  `;
  document.head.appendChild(style);
}

function triggerRomanticUI() {
  injectRomanticStyles();
  document.body.classList.add("romantic-mode-on");
  const container = document.querySelector(".chat-container") || document.querySelector(".chat-wrapper") || (document.getElementById("chatBox") ? document.getElementById("chatBox").parentNode : null);
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
      s.style.width = size + "px"; s.style.height = size + "px";
      s.style.left = Math.random() * 100 + "%";
      s.style.animationDuration = (Math.random() * 5 + 9) + "s";
      s.style.animationDelay = (Math.random() * 6) + "s";
      layer.appendChild(s);
    }
  }
  if (!fxInterval) { fxInterval = setInterval(addSparkles, 400); }
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
  if(document.getElementById("nameModal")) document.getElementById("nameModal").style.display = "none";
} else {
  if(document.getElementById("nameModal")) document.getElementById("nameModal").style.display = "flex";
}

const nameBtn = document.getElementById("nameSubmitBtn");
if (nameBtn) {
  nameBtn.addEventListener("click", () => {
    const val = document.getElementById("nameInput").value.trim();
    if (!val) return;
    username = val;
    localStorage.setItem("hurairah_username", username);
    document.getElementById("nameModal").style.display = "none";
  });
}

let messages = JSON.parse(localStorage.getItem("hurairah_chat") || "[]");
let hurairahMode = sessionStorage.getItem("hurairah_mode") === "true";

if (hurairahMode) { setTimeout(triggerRomanticUI, 500); }

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const attachBtn = document.getElementById("attachBtn");
const imageInput = document.getElementById("imageInput");

function getTime() { return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); }

function addMessage(text, type, imgData = null) {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  let imageHTML = imgData ? `<img src="${imgData}" style="max-width:200px; max-height:200px; border-radius:12px; display:block; margin-bottom:6px; cursor:pointer;" onclick="window.open('${imgData}','_blank')" />` : "";

  if (type === "bot") {
    const isRomanticText = hurairahMode || text.includes("Meri jaan") || text.includes("babu") || text.includes("Assalamualaikum");
    const rClass = isRomanticText ? "romantic-reply" : "";
    msg.innerHTML = `
      <div class="bot-header"><div class="bot-avatar">✨</div><div class="bot-name">Hurairah AI</div></div>
      <div class="msg-text ${rClass}">${text}</div>
      <div class="time">${getTime()}</div>
    `;
  } else {
    msg.innerHTML = `${imageHTML} ${text ? `<div class="msg-text">${text}</div>` : ""} <div class="time">${getTime()}</div>`;
  }
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  
  if(text || imgData){
    messages.push({ text, type, imgData });
    localStorage.setItem("hurairah_chat", JSON.stringify(messages));
  }
}

function showThinking() {
  const thinking = document.createElement("div");
  thinking.className = "thinking"; thinking.id = "thinking";
  thinking.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div><span>Likh raha hai...</span>`;
  chatBox.appendChild(thinking); chatBox.scrollTop = chatBox.scrollHeight;
}
function removeThinking() { const t = document.getElementById("thinking"); if (t) t.remove(); }

// 🖼️ GALLERY PHOTO SELECTOR WORKING PIPELINE
if(attachBtn && imageInput) {
  attachBtn.addEventListener("click", () => imageInput.click());
  imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      selectedImage = reader.result;
      let existingPreview = document.getElementById("imagePreview");
      if (existingPreview) existingPreview.remove();
      const preview = document.createElement("div");
      preview.id = "imagePreview";
      preview.style.cssText = `position: relative; display: inline-block; margin: 8px 12px; border-radius: 12px;`;
      preview.innerHTML = `
        <img src="${selectedImage}" style="max-width:100px; border-radius:12px;" />
        <button type="button" onclick="selectedImage=null; document.getElementById('imagePreview').remove();" style="position:absolute; top:2px; right:2px; background:black; color:white; border-radius:50%; border:none; width:20px; height:20px; cursor:pointer;">✕</button>
      `;
      input.parentNode.insertBefore(preview, input);
    };
    reader.readAsDataURL(file);
  });
}

// 🎤 MIC RECORDING BUTTON LISTENER
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition && micBtn) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.onresult = (event) => {
    input.value = event.results[0][0].transcript;
  };
  micBtn.addEventListener("click", () => {
    try { recognition.start(); micBtn.style.opacity = "0.4"; } catch(e){}
  });
  recognition.onend = () => { micBtn.style.opacity = "1"; };
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text && !selectedImage) return;

  if (text.toLowerCase() === "mehajabeen pgl hu") {
    hurairahMode = true;
    sessionStorage.setItem("hurairah_mode", "true");
    localStorage.setItem("hurairah_chat_romantic", "true");
    injectRomanticStyles();
  }

  const welcome = document.querySelector(".welcome-screen");
  if (welcome) welcome.remove();

  addMessage(text, "user", selectedImage);
  input.value = ""; 
  if(document.getElementById("imagePreview")) document.getElementById("imagePreview").remove();
  showThinking();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, message: text, image: selectedImage, hurairahMode })
    });
    const data = await res.json();
    removeThinking();
    addMessage(data.reply || "Kuch samajh nahi aaya.", "bot");
    if (hurairahMode) { triggerRomanticUI(); }
    selectedImage = null;
  } catch (err) {
    removeThinking(); addMessage("Server se connect karne mein issue aaya.", "bot");
  }
}

if(sendBtn) sendBtn.addEventListener("click", sendMessage);
if(input) input.addEventListener("keydown", (e) => { if(e.key === "Enter") { e.preventDefault(); sendMessage(); } });
if(document.getElementById("clearBtn")) {
  document.getElementById("clearBtn").addEventListener("click", () => {
    if (confirm("Chat delete karna chahte ho?")) {
      localStorage.removeItem("hurairah_chat"); localStorage.removeItem("hurairah_chat_romantic"); sessionStorage.removeItem("hurairah_mode");
      messages = []; location.reload();
    }
  });
}
