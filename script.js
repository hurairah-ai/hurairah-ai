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

// FIX: Scroll to bottom — works even when keyboard is open on mobile
function scrollToBottom() {
  setTimeout(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
    // Also try scrollIntoView on last message for mobile keyboard
    const lastMsg = chatBox.lastElementChild;
    if (lastMsg && lastMsg.scrollIntoView) {
      lastMsg.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, 100);
}

function addMessage(text, type, imgData = null) {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  // FIX: Image in chat — max 160px, same as CSS
  let imageHTML = imgData ? `<img src="${imgData}" style="max-width:160px; max-height:160px; border-radius:12px; display:block; margin-bottom:6px; cursor:pointer;" onclick="window.open('${imgData}','_blank')" />` : "";

  if (type === "bot") {
    const isRomanticText = hurairahMode || text.includes("Meri jaan") || text.includes("babu") || text.includes("Assalamualaikum");
    const rClass = isRomanticText ? "romantic-reply" : "";
    msg.innerHTML = `
      <div class="bot-header"><div class="bot-avatar">✨</div><div class="bot-name">Hurairah AI</div></div>
      <div class="msg-text ${rClass}">${text}</div>
      <div class="audio-controls-row" style="display:flex; gap:6px; margin-top:6px;">
        <button class="speak-btn">🔊 Suno</button>
        <button class="stop-audio-btn" style="display:none;">🛑 Roko</button>
      </div>
      <div class="time">${getTime()}</div>
    `;
    const sBtn = msg.querySelector(".speak-btn");
    const stBtn = msg.querySelector(".stop-audio-btn");
    sBtn.addEventListener("click", () => speakWithElevenLabs(text, sBtn, stBtn));
    stBtn.addEventListener("click", () => stopAllAudio(sBtn, stBtn));
  } else {
    msg.innerHTML = `${imageHTML} ${text ? `<div class="msg-text">${text}</div>` : ""} <div class="time">${getTime()}</div>`;
  }
  chatBox.appendChild(msg);
  scrollToBottom(); // FIX: use improved scroll
  
  if(text || imgData){
    messages.push({ text, type, imgData });
    localStorage.setItem("hurairah_chat", JSON.stringify(messages));
  }
}

function stopAllAudio(speakBtn, stopBtn) {
  if (currentAudioInstance) { currentAudioInstance.pause(); currentAudioInstance.currentTime = 0; }
  if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
  if (speakBtn) speakBtn.textContent = "🔊 Suno";
  if (stopBtn) stopBtn.style.display = "none";
}

async function speakWithElevenLabs(text, btn, stopBtn) {
  stopAllAudio(null, null);
  try {
    if (btn) btn.textContent = "⏳ Loading...";
    if (stopBtn) stopBtn.style.display = "inline-block";
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ text: text, model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.4, similarity_boost: 0.9 } })
    });
    if (!res.ok) throw new Error("ElevenLabs failed");
    const blob = await res.blob();
    currentAudioInstance = new Audio(URL.createObjectURL(blob));
    if (btn) btn.textContent = "🎙️ Bol raha..";
    currentAudioInstance.play();
    currentAudioInstance.onended = () => {
      if (btn) btn.textContent = "🔊 Suno";
      if (stopBtn) stopBtn.style.display = "none";
    };
  } catch (err) {
    // Fallback to Web Speech API
    if (btn) btn.textContent = "🎙️ Bol raha..";
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    window.speechSynthesis.speak(speech);
    speech.onend = () => {
      if (btn) btn.textContent = "🔊 Suno";
      if (stopBtn) stopBtn.style.display = "none";
    };
  }
}

function showThinking() {
  const thinking = document.createElement("div");
  thinking.className = "thinking"; thinking.id = "thinking";
  thinking.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div><span>Likh raha hai...</span>`;
  chatBox.appendChild(thinking);
  scrollToBottom();
}
function removeThinking() { const t = document.getElementById("thinking"); if (t) t.remove(); }

// 🖼️ IMAGE ATTACH
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
      // FIX: smaller preview thumbnail
      preview.style.cssText = `position: relative; display: inline-block; margin: 6px 10px; border-radius: 10px;`;
      preview.innerHTML = `
        <img src="${selectedImage}" style="max-width:70px; max-height:70px; border-radius:10px; object-fit:cover;" />
        <button type="button" onclick="selectedImage=null; document.getElementById('imagePreview').remove();" style="position:absolute; top:2px; right:2px; background:#ef4444; color:white; border-radius:50%; border:none; width:18px; height:18px; cursor:pointer; font-size:10px;">✕</button>
      `;
      input.parentNode.insertBefore(preview, input);
    };
    reader.readAsDataURL(file);
  });
}

// 🎤 MIC BUTTON
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
  recognition.onend = () => {
    micBtn.style.opacity = "1";
    if (input.value.trim() !== "") { sendMessage(); }
  };
}

// 🎧 VOICE CALL MODE
const headphoneBtn = document.getElementById("headphoneBtn");
const voiceOverlay = document.getElementById("voiceOverlay");
const voiceStatusText = document.getElementById("voiceStatusText");
const closeVoiceBtn = document.getElementById("closeVoiceBtn");
const waveBars = document.querySelectorAll(".w-bar");

if (SpeechRecognition && headphoneBtn) {
  const voiceRecog = new SpeechRecognition();
  voiceRecog.lang = "en-IN";
  voiceRecog.continuous = false;
  voiceRecog.interimResults = false;
  let isVoiceModeActive = false;
  let voiceIsListening = false;
  let voiceGotResult = false;

  headphoneBtn.addEventListener("click", async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch(e) {
      alert("Microphone permission do pehle!");
      return;
    }
    isVoiceModeActive = true;
    if (voiceOverlay) voiceOverlay.style.display = "flex";
    startListeningCycle();
  });

  if (closeVoiceBtn) {
    closeVoiceBtn.addEventListener("click", () => {
      isVoiceModeActive = false;
      voiceIsListening = false;
      if (voiceOverlay) voiceOverlay.style.display = "none";
      try { voiceRecog.stop(); } catch(e){}
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (currentAudioInstance) { currentAudioInstance.pause(); currentAudioInstance.currentTime = 0; }
    });
  }

  function startListeningCycle() {
    if (!isVoiceModeActive || voiceIsListening) return;
    voiceGotResult = false;
    voiceIsListening = true;
    if (voiceStatusText) voiceStatusText.innerText = "Listening...";
    waveBars.forEach(bar => bar.classList.add("v-streaming"));
    try { voiceRecog.start(); } catch(e){ voiceIsListening = false; }
  }

  voiceRecog.onresult = async (event) => {
    voiceGotResult = true;
    voiceIsListening = false;
    const spokenText = event.results[0][0].transcript;
    if (!spokenText.trim()) { startListeningCycle(); return; }
    if (voiceStatusText) voiceStatusText.innerText = "Thinking...";
    waveBars.forEach(bar => bar.classList.remove("v-streaming"));
    addMessage(spokenText, "user");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, message: spokenText, hurairahMode })
      });
      const data = await res.json();
      const replyText = data.reply || "Samajh nahi paya.";
      addMessage(replyText, "bot");
      if (voiceStatusText) voiceStatusText.innerText = "Speaking...";

      // Try ElevenLabs first, fallback to Web Speech
      let spokenViaElevenLabs = false;
      try {
        const audioRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
          method: "POST",
          headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({ text: replyText, model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.4, similarity_boost: 0.9 } })
        });
        if (audioRes.ok) {
          const blob = await audioRes.blob();
          currentAudioInstance = new Audio(URL.createObjectURL(blob));
          currentAudioInstance.play();
          spokenViaElevenLabs = true;
          currentAudioInstance.onended = () => { if (isVoiceModeActive) startListeningCycle(); };
        }
      } catch (e) { spokenViaElevenLabs = false; }

      if (!spokenViaElevenLabs) {
        const utterance = new SpeechSynthesisUtterance(replyText);
        utterance.lang = "en-IN";
        window.speechSynthesis.speak(utterance);
        utterance.onend = () => { if (isVoiceModeActive) startListeningCycle(); };
      }
    } catch (err) {
      if (voiceStatusText) voiceStatusText.innerText = "Error...";
      setTimeout(startListeningCycle, 2000);
    }
  };

  voiceRecog.onend = () => {
    voiceIsListening = false;
    if (isVoiceModeActive && !voiceGotResult) {
      setTimeout(startListeningCycle, 500);
    }
  };

  voiceRecog.onerror = (e) => {
    voiceIsListening = false;
    voiceGotResult = false;
    if (isVoiceModeActive && e.error !== "aborted") {
      setTimeout(startListeningCycle, 1000);
    }
  };
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
  input.blur(); // FIX: close keyboard after send on mobile, then re-focus
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
    removeThinking();
    addMessage("Server se connect karne mein issue aaya.", "bot");
  }
}

// FIX: Send button — click + touchend both
if(sendBtn) {
  sendBtn.addEventListener("click", sendMessage);
  sendBtn.addEventListener("touchend", (e) => { e.preventDefault(); sendMessage(); });
}

// FIX: Enter key — keydown + touchend for mobile keyboards
if(input) {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  // Extra: some Android keyboards fire keyup not keydown
  input.addEventListener("keyup", (e) => {
    if (e.key === "Enter" || e.keyCode === 13) {
      e.preventDefault();
      sendMessage();
    }
  });
}

if(document.getElementById("clearBtn")) {
  document.getElementById("clearBtn").addEventListener("click", () => {
    if (confirm("Chat delete karna chahte ho?")) {
      localStorage.removeItem("hurairah_chat");
      localStorage.removeItem("hurairah_chat_romantic");
      sessionStorage.removeItem("hurairah_mode");
      messages = [];
      location.reload();
    }
  });
}
