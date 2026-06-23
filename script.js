const API_URL = "https://hurairah-ai.annu8857818.workers.dev";
const ELEVENLABS_API_KEY = "sk_ba5c973ec598f00b7293cc1f37675eb24f52363489ea82be";
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

let username = localStorage.getItem("hurairah_username");
let currentAudioInstance = null;

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
  modal.style.opacity = "0";
  modal.style.transform = "scale(0.95)";
  setTimeout(() => modal.style.display = "none", 300);
});

document.getElementById("nameInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("nameSubmitBtn").click();
});

function chipClick(text) {
  document.getElementById("messageInput").value = text;
  sendMessage();
}

// 🔐 SMART CHAT STORAGE: Tab validation to clear memory when closed entirely
if (!sessionStorage.getItem("hurairah_session_active")) {
  localStorage.removeItem("hurairah_chat");
  sessionStorage.setItem("hurairah_session_active", "true");
}

let messages = JSON.parse(localStorage.getItem("hurairah_chat") || "[]");
let hurairahMode = sessionStorage.getItem("hurairah_mode") === "true";

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const attachBtn = document.getElementById("attachBtn");
const imageInput = document.getElementById("imageInput");
const recordingPopup = document.getElementById("recordingPopup");

let selectedImage = null;

// Render existing messages smoothly on back button/refresh
if (messages.length > 0) {
  const welcome = document.querySelector(".welcome-screen");
  if (welcome) welcome.remove();
  
  messages.forEach(msg => {
    const msgEl = document.createElement("div");
    msgEl.className = `message ${msg.type}`;
    if (msg.type === "bot") {
      if (msg.text.startsWith("[Image:")) {
        const rawPrompt = msg.text.replace("[Image: ", "").slice(0, -1);
        const encPrompt = encodeURIComponent(rawPrompt);
        const imgUrl = `https://image.pollinations.ai/prompt/${encPrompt}?width=512&height=512&nologo=true`;
        msgEl.innerHTML = `
          <div class="bot-header"><div class="bot-avatar">✨</div><div class="bot-name">Hurairah AI</div></div>
          <div class="msg-text" style="margin-bottom:8px;">Ye rahi teri image 🎨</div>
          <img src="${imgUrl}" alt="${rawPrompt}" onclick="window.open('${imgUrl}', '_blank')" style="max-width:260px; width:100%; border-radius:14px; display:block; margin-top:4px; cursor:pointer;" />
          <button onclick="downloadImage('${imgUrl}')" style="display:inline-block; margin-top:8px; padding:6px 12px; background:#7c3aed; color:white; border:none; border-radius:8px; font-size:12px; cursor:pointer;">⬇️ Download Image</button>
        `;
      } else {
        msgEl.innerHTML = `
          <div class="bot-header"><div class="bot-avatar">✨</div><div class="bot-name">Hurairah AI</div></div>
          <div class="msg-text">${msg.text}</div>
          <div class="audio-controls-row" style="display:flex; gap:6px; margin-top:4px;">
            <button class="speak-btn">🔊 Suno</button>
            <button class="stop-audio-btn" style="display:none; background:#ef4444; color:white; border:none; border-radius:6px; padding:2px 8px; font-size:12px; cursor:pointer;">🛑 Roko</button>
          </div>
        `;
        const sBtn = msgEl.querySelector(".speak-btn");
        const stBtn = msgEl.querySelector(".stop-audio-btn");
        if(sBtn) sBtn.addEventListener("click", () => speakWithElevenLabs(msg.text, sBtn, stBtn));
        if(stBtn) stBtn.addEventListener("click", () => stopAllAudio(sBtn, stBtn));
      }
    } else {
      msgEl.innerHTML = `<div class="msg-text">${msg.text}</div>`;
    }
    chatBox.appendChild(msgEl);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

function getTime() {
  const now = new Date();
  return now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function getCurrentDate() {
  const now = new Date();
  return now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

function getDirectDateTimeReply(text) {
  const msg = text.toLowerCase().trim();
  const dateKeywords = ["date", "tarikh", "tareekh", "aaj ki date", "today's date", "todays date"];
  const timeKeywords = ["time", "samay", "kitne baje", "kitna baj", "current time", "ajka time", "abhi kya time"];
  const isDateQuery = dateKeywords.some(k => msg.includes(k));
  const isTimeQuery = timeKeywords.some(k => msg.includes(k));
  if (isDateQuery && isTimeQuery) { return `Aaj ki date ${getCurrentDate()} hai aur abhi ka time ${getTime()} hai.`; }
  if (isDateQuery) return `Aaj ki date ${getCurrentDate()} hai.`;
  if (isTimeQuery) return `Abhi ka time ${getTime()} hai.`;
  return null;
}

function isWeatherQuery(text) {
  const msg = text.toLowerCase();
  const weatherKeywords = ["weather", "mausam", "temperature", "tapman", "baarish", "barish", "rain", "clouds", "badal"];
  return weatherKeywords.some(k => msg.includes(k));
}

function extractCityName(text) {
  let msg = text.toLowerCase().replace(/[?.!]/g, "").trim();
  const patterns = [
    /weather\s+(?:in|of|for)\s+([a-zA-Z\s]+)/i,
    /([a-zA-Z\s]+?)\s+(?:ka|ki|ke)\s+(?:weather|mausam|temperature|tapman|barish|baarish)/i,
    /([a-zA-Z\s]+?)\s+(?:mein|me)\s+(?:weather|mausam|temperature|tapman|barish|baarish)/i,
    /(?:weather|mausam|temperature|tapman|barish|baarish)\s+(?:in|mein|me)\s+([a-zA-Z\s]+)/i
  ];

  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match && match[1]) {
      let city = match[1].trim();
      if(city) return city;
    }
  }

  const words = msg.split(/\s+/);
  const STOPWORDS = ["today", "now", "abhi", "aaj", "kaisa", "kaisi", "hai", "please", "batao", "kya", "ka", "ki", "ke", "mein", "me", "mausam", "weather", "temperature", "tapman", "is", "the", "whats", "what", "tell", "current", "barish", "baarish", "hogi"];
  let filtered = words.filter(w => !STOPWORDS.includes(w));
  if (filtered.length > 0) return filtered[0]; 

  return null;
}

function getWeatherDescription(code) {
  const map = {
    0: "saaf aasman ☀️", 1: "mostly saaf ☀️", 2: "halka badal ⛅", 3: "badal ☁️",
    45: "kohra 🌫️", 48: "kohra 🌫️", 51: "halki drizzling 🌦️", 53: "halki baarish 🌦️", 55: "tez baarish 🌧️",
    61: "halki baarish 🌧️", 63: "baarish 🌧️", 65: "tez baarish 🌧️", 71: "halki barfbaari ❄️", 73: "barfbaari ❄️", 75: "tez barfbaari ❄️",
    80: "halki shower 🌦️", 81: "shower 🌧️", 82: "tez shower ⛈️", 95: "toofan ⛈️", 96: "toofan with hail ⛈️", 99: "tez toofan with hail ⛈️"
  };
  return map[code] || "mixed weather 🌥️";
}

async function getDirectWeatherReply(text) {
  let city = extractCityName(text);
  let lat = 18.5204; // Default Pune
  let lon = 73.8567;
  let placeName = "Pune, India";

  if (city) {
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
      const geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        const place = geoData.results[0];
        lat = place.latitude;
        lon = place.longitude;
        placeName = place.country ? `${place.name}, ${place.country}` : place.name;
      } else {
        placeName = city.charAt(0).toUpperCase() + city.slice(1);
      }
    } catch (err) {}
  }

  try {
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const weatherData = await weatherRes.json();
    const cw = weatherData.current_weather;
    const desc = getWeatherDescription(cw.weathercode);
    
    let rainAlert = "";
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(cw.weathercode)) {
      rainAlert = " Haan bhai, aaj baarish ke poore chances hain ya baarish ho rahi hai, umbrella sath rakhna! 🌧️☔";
    } else if ([2, 3].includes(cw.weathercode)) {
      rainAlert = " Aasman mein badal chaye hain, halki fulki boondabandi ho sakti hai. ⛅";
    } else {
      rainAlert = " Nahi, aaj baarish ke chances nahi hain, mausam clear rahega! ☀️";
    }

    return `${placeName} mein abhi temperature ${cw.temperature}°C hai aur ${desc} hai.${rainAlert} Wind speed ${cw.windspeed} km/h hai.`;
  } catch (err) { return "Weather fetch karne mein problem aa gayi. Thodi der baad try karo."; }
}

function isImageRequest(text) {
  const msg = text.toLowerCase();
  const keywords = ["image", "banao", "bana", "photo", "picture", "tasveer", "generate", "draw", "painting", "illustration"];
  return keywords.some(k => msg.includes(k));
}

async function generateImage(prompt) {
  return new Promise((resolve, reject) => {
    const randomSeed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${randomSeed}`;
    const img = new Image();
    const timeout = setTimeout(() => { img.src = ""; reject(new Error("Timeout")); }, 15000);
    img.onload = () => { clearTimeout(timeout); resolve(imageUrl); };
    img.onerror = () => { clearTimeout(timeout); reject(new Error("Image load failed")); };
    img.src = imageUrl;
  });
}

function addGeneratedImage(imageUrl, prompt) {
  const msg = document.createElement("div");
  msg.className = "message bot";
  msg.innerHTML = `
    <div class="bot-header"><div class="bot-avatar">✨</div><div class="bot-name">Hurairah AI</div></div>
    <div class="msg-text" style="margin-bottom:8px;">Ye rahi teri image 🎨</div>
    <img src="${imageUrl}" alt="${prompt}" onclick="window.open('${imageUrl}', '_blank')" style="max-width:260px; width:100%; border-radius:14px; display:block; margin-top:4px; cursor:pointer;" loading="lazy" />
    <button onclick="downloadImage('${imageUrl}')" style="display:inline-block; margin-top:8px; padding:6px 12px; background:#7c3aed; color:white; border:none; border-radius:8px; font-size:12px; cursor:pointer;">⬇️ Download Image</button>
    <div class="time">${getTime()}</div>
  `;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  messages.push({ text: `[Image: ${prompt}]`, type: "bot" });
  localStorage.setItem("hurairah_chat", JSON.stringify(messages));
}

async function downloadImage(url) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'hurairah-ai-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    alert("Download fail hua, aap image par tap karke full screen open karke bhi long press se save kar sakte ho!");
  }
}

function removeWelcomeScreen() {
  const welcome = document.querySelector(".welcome-screen");
  if (welcome) { welcome.style.opacity = "0"; setTimeout(() => welcome.remove(), 300); }
}

function stopAllAudio(speakBtn, stopBtn) {
  if (currentAudioInstance) { currentAudioInstance.pause(); currentAudioInstance.currentTime = 0; }
  if (window.speechSynthesis) { window.speechSynthesis.cancel(); }
  if(speakBtn) speakBtn.textContent = "🔊 Suno";
  if(stopBtn) stopBtn.style.display = "none";
}

async function speakWithElevenLabs(text, btn, stopBtn) {
  stopAllAudio(null, null);
  try {
    if(btn) btn.textContent = "⏳ Loading...";
    if(stopBtn) stopBtn.style.display = "inline-block";

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: { "xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ text: text, model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.4, similarity_boost: 0.9, style: 0.5, use_speaker_boost: true } })
    });
    if (!res.ok) throw new Error("ElevenLabs error");
    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    
    currentAudioInstance = new Audio(audioUrl);
    if(btn) btn.textContent = "🎙️ Bol raha..";
    currentAudioInstance.play();
    
    return new Promise((resolve) => {
      currentAudioInstance.onended = () => {
        URL.revokeObjectURL(audioUrl);
        if(btn) btn.textContent = "🔊 Suno";
        if(stopBtn) stopBtn.style.display = "none";
        resolve();
      };
      currentAudioInstance.onerror = () => { if(stopBtn) stopBtn.style.display = "none"; resolve(); };
    });
  } catch (err) {
    if(btn) btn.textContent = "🎙️ Bol raha..";
    return new Promise((resolve) => {
      const speech = new SpeechSynthesisUtterance(text); speech.lang = "en-IN"; speech.rate = 1;
      window.speechSynthesis.speak(speech);
      speech.onend = () => { if(btn) btn.textContent = "🔊 Suno"; if(stopBtn) stopBtn.style.display = "none"; resolve(); };
      speech.onerror = () => { if(stopBtn) stopBtn.style.display = "none"; resolve(); };
    });
  }
}

function addMessage(text, type, animate = false, imageData = null) {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;

  if (type === "bot") {
    msg.innerHTML = `
      <div class="bot-header"><div class="bot-avatar">✨</div><div class="bot-name">Hurairah AI</div></div>
      <div class="msg-text"></div>
      <div class="audio-controls-row" style="display:flex; gap:6px; margin-top:4px;">
        <button class="speak-btn" style="display:none">🔊 Suno</button>
        <button class="stop-audio-btn" style="display:none; background:#ef4444; color:white; border:none; border-radius:6px; padding:2px 8px; font-size:12px; cursor:pointer;">🛑 Roko</button>
      </div>
      <div class="time">${getTime()}</div>
    `;
  } else {
    let imageHTML = "";
    if (imageData) { imageHTML = `<img src="${imageData}" style="max-width:200px; max-height:200px; border-radius:12px; display:block; margin-bottom:6px;" />`; }
    msg.innerHTML = `${imageHTML} ${text ? `<div class="msg-text">${text}</div>` : ""} <div class="time">${getTime()}</div>`;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  const textEl = msg.querySelector(".msg-text");

  if (type === "bot" && animate) {
    const speakBtn = msg.querySelector(".speak-btn");
    const stopBtn = msg.querySelector(".stop-audio-btn");
    const cursor = document.createElement("span"); cursor.className = "cursor"; textEl.appendChild(cursor);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) { cursor.insertAdjacentText("beforebegin", text[i]); i++; chatBox.scrollTop = chatBox.scrollHeight; } 
      else { 
        clearInterval(interval); cursor.remove(); speakBtn.style.display = "inline-block"; 
        speakBtn.addEventListener("click", () => speakWithElevenLabs(text, speakBtn, stopBtn)); 
        stopBtn.addEventListener("click", () => stopAllAudio(speakBtn, stopBtn));
      }
    }, 22);
  } else if (type === "bot") {
    if (textEl) textEl.textContent = text;
    const speakBtn = msg.querySelector(".speak-btn");
    const stopBtn = msg.querySelector(".stop-audio-btn");
    speakBtn.style.display = "inline-block";
    speakBtn.addEventListener("click", () => speakWithElevenLabs(text, speakBtn, stopBtn));
    stopBtn.addEventListener("click", () => stopAllAudio(speakBtn, stopBtn));
  }

  if (text) {
    messages.push({ text, type });
    localStorage.setItem("hurairah_chat", JSON.stringify(messages));
  }
}

function showImagePreview(imageData, fileName) {
  removeImagePreview();
  const preview = document.createElement("div");
  preview.id = "imagePreview"; preview.style.cssText = `position: relative; display: inline-block; margin: 8px 12px; border-radius: 12px; overflow: hidden;`;
  preview.innerHTML = `
    <img src="${imageData}" style="max-width:120px; max-height:120px; border-radius:12px; display:block;" />
    <button onclick="removeImagePreview()" style="position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.6); border:none; color:white; border-radius:50%; width:22px; height:22px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
  `;
  const inputArea = document.querySelector(".input-area");
  inputArea.parentNode.insertBefore(preview, inputArea);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeImagePreview() { const preview = document.getElementById("imagePreview"); if (preview) preview.remove(); }
function showThinking() { const thinking = document.createElement("div"); thinking.className = "thinking"; thinking.id = "thinking"; thinking.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div><span class="thinking-text">Hurairah AI likh raha hai...</span>`; chatBox.appendChild(thinking); chatBox.scrollTop = chatBox.scrollHeight; }
function removeThinking() { const t = document.getElementById("thinking"); if (t) t.remove(); }

async function getBotResponseDirect(textInput) {
  try {
    const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, message: textInput, image: null, hurairahMode }) });
    const data = await res.json();
    return data.reply || "Koi response nahi mila";
  } catch (err) { return "Error: " + err.message; }
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text && !selectedImage) return;

  if (text.toLowerCase() === "mehazabeen pgl hu") {
    hurairahMode = true;
    sessionStorage.setItem("hurairah_mode", "true");
  }

  removeWelcomeScreen();
  addMessage(text, "user", false, selectedImage);
  removeImagePreview();
  input.value = ""; input.style.height = "24px";

  if (!selectedImage) {
    const directReply = getDirectDateTimeReply(text);
    if (directReply) { addMessage(directReply, "bot", true); return; }

    if (isWeatherQuery(text)) {
      showThinking();
      const weatherReply = await getDirectWeatherReply(text);
      removeThinking(); addMessage(weatherReply, "bot", true); return;
    }

    if (isImageRequest(text) && !hurairahMode) {
      showThinking();
      const loadingMsg = document.createElement("div");
      loadingMsg.className = "message bot"; loadingMsg.id = "imgLoadingMsg";
      loadingMsg.innerHTML = `<div class="bot-header"><div class="bot-avatar">✨</div><div class="bot-name">Hurairah AI</div></div><div class="msg-text">🎨 Image bana raha hoon... thoda wait karo!</div><div class="time">${getTime()}</div>`;
      chatBox.appendChild(loadingMsg); chatBox.scrollTop = chatBox.scrollHeight;

      try {
        const imageUrl = await generateImage(text);
        removeThinking(); const oldMsg = document.getElementById("imgLoadingMsg"); if (oldMsg) oldMsg.remove();
        addGeneratedImage(imageUrl, text);
      } catch (err) {
        removeThinking(); const oldMsg = document.getElementById("imgLoadingMsg"); if (oldMsg) oldMsg.remove();
        addMessage("Image generation me time lag rha h 😔 Dobara different prompt try karo.", "bot", true);
      }
      return;
    }
  }

  showThinking();

  try {
    const res = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, message: text || "Is image mein kya hai?", image: selectedImage, hurairahMode }) });
    const data = await res.json();
    removeThinking();
    addMessage(data.reply || "Koi response nahi mila", "bot", true);
    selectedImage = null; imageInput.value = "";
  } catch (err) {
    removeThinking(); addMessage("Error: " + err.message, "bot", true);
  }
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
input.addEventListener("input", () => { input.style.height = "24px"; input.style.height = Math.min(input.scrollHeight, 80) + "px"; });

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN"; recognition.continuous = false; recognition.interimResults = true;
  recognition.onstart = () => { if (recordingPopup) recordingPopup.style.display = "flex"; };
  recognition.onend = () => { if (recordingPopup) recordingPopup.style.display = "none"; };
  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = 0; i < event.results.length; i++) { transcript += event.results[i][0].transcript; }
    input.value = transcript;
  };
  micBtn.addEventListener("click", () => { try { recognition.start(); } catch (err) { console.log("Mic error:", err); } });
} else {
  if (micBtn) micBtn.style.display = "none";
}

attachBtn.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0]; if (!file) return;
  const reader = new FileReader(); reader.onload = () => { selectedImage = reader.result; showImagePreview(selectedImage, file.name); };
  reader.readAsDataURL(file);
});

document.getElementById("clearBtn").addEventListener("click", () => {
  if (confirm("Chat delete karna chahte ho?")) {
    localStorage.removeItem("hurairah_chat"); sessionStorage.removeItem("hurairah_mode");
    messages = []; location.reload();
  }
});

// =========================================================
// Live Voice-to-Voice Chat Mode
// =========================================================

function injectVoiceModeStyles() {
  if (document.getElementById("voiceModeStyles")) return;
  const style = document.createElement("style");
  style.id = "voiceModeStyles";
  style.textContent = `
    .voice-mode-btn { background: none; border: none; cursor: pointer; font-size: 22px; display: flex; align-items: center; justify-content: center; color: inherit; flex-shrink: 0; margin-left: 6px; }
    .voice-mode-overlay { display: none; position: fixed; inset: 0; z-index: 9999; background: linear-gradient(135deg, #1a0a2e, #0a0a14); flex-direction: column; align-items: center; justify-content: center; gap: 22px; }
    .voice-orb { width: 140px; height: 140px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #4f6cf7); display: flex; align-items: center; justify-content: center; font-size: 56px; box-shadow: 0 0 60px rgba(124, 58, 237, 0.6); transition: all 0.3s ease; }
    .voice-orb.thinking { animation: hurairah-spin 1.4s linear infinite; }
    .voice-orb.speaking { animation: hurairah-pulse 0.6s infinite ease-in-out; }
    @keyframes hurairah-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
    @keyframes hurairah-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .voice-status { color: #ece9f7; font-size: 18px; font-weight: 600; text-align: center; padding: 0 24px; }
    .voice-transcript { color: #9590b3; font-size: 14px; text-align: center; padding: 0 32px; min-height: 20px; }
    .voice-exit-btn { margin-top: 10px; padding: 12px 28px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.08); color: #ece9f7; font-size: 14px; font-weight: 600; cursor: pointer; }
  `;
  document.head.appendChild(style);
}

function createVoiceModeUI() {
  if (document.getElementById("voiceModeBtn")) return;
  if (!SpeechRecognition) return;

  injectVoiceModeStyles();

  const btn = document.createElement("button");
  btn.id = "voiceModeBtn"; btn.className = "voice-mode-btn"; btn.title = "Live Voice Chat"; btn.innerHTML = "🎧";
  
  const inputArea = document.querySelector(".input-area");
  if(inputArea) inputArea.appendChild(btn);

  const overlay = document.createElement("div");
  overlay.id = "voiceModeOverlay"; overlay.className = "voice-mode-overlay";
  overlay.innerHTML = `<div class="voice-orb" id="voiceOrb">🎙️</div><div class="voice-status" id="voiceStatus">Sun raha hoon... Boliye!</div><div class="voice-transcript" id="voiceTranscript"></div><button class="voice-exit-btn" id="voiceExitBtn">Band Karein</button>`;
  document.body.appendChild(overlay);

  const orb = document.getElementById("voiceOrb");
  const statusText = document.getElementById("voiceStatus");
  const transcriptText = document.getElementById("voiceTranscript");
  const exitBtn = document.getElementById("voiceExitBtn");

  const liveRec = new SpeechRecognition();
  liveRec.lang = "en-IN"; liveRec.continuous = false;

  let shouldContinueVoice = false;
  let isAIVoicePlaying = false;

  btn.addEventListener("click", () => {
    overlay.style.display = "flex"; transcriptText.textContent = ""; statusText.textContent = "Sun raha hoon... Boliye!";
    orb.className = "voice-orb speaking"; shouldContinueVoice = true; isAIVoicePlaying = false; liveRec.start();
  });

  exitBtn.addEventListener("click", () => {
    shouldContinueVoice = false; isAIVoicePlaying = false; overlay.style.display = "none"; liveRec.stop(); orb.className = "voice-orb";
    stopAllAudio(null, null);
  });

  liveRec.onresult = async (event) => {
    if (isAIVoicePlaying) return;
    const userSpeech = event.results[0][0].transcript;
    if (!userSpeech.trim()) return;
    
    transcriptText.textContent = userSpeech; isAIVoicePlaying = true; liveRec.stop();
    orb.className = "voice-orb thinking"; statusText.textContent = "Hurairah AI soch raha hai...";
    
    const botText = await getBotResponseDirect(userSpeech);
    addMessage(userSpeech, "user"); addMessage(botText, "bot", false);

    orb.className = "voice-orb speaking"; statusText.textContent = "Hurairah AI bol raha hai...";
    
    const mockSpeakBtn = { textContent: "" };
    const mockStopBtn = { style: { display: "none" } };
    await speakWithElevenLabs(botText, mockSpeakBtn, mockStopBtn);

    isAIVoicePlaying = false;
    if (shouldContinueVoice) {
      statusText.textContent = "Sun raha hoon... Boliye!"; orb.className = "voice-orb speaking";
      try { liveRec.start(); } catch(e) {}
    }
  };

  liveRec.onerror = () => { if (shouldContinueVoice && !isAIVoicePlaying) { try { liveRec.start(); } catch(e) {} } };
  liveRec.onend = () => { if (shouldContinueVoice && !isAIVoicePlaying) { try { liveRec.start(); } catch(e) {} } };
}

createVoiceModeUI();
