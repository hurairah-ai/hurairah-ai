const API_URL = "https://hurairah-ai.annu8857818.workers.dev";
const ELEVENLABS_API_KEY = "sk_ba5c973ec598f00b7293cc1f37675eb24f52363489ea82be";
const ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

let username = localStorage.getItem("hurairah_username");

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

let messages = JSON.parse(sessionStorage.getItem("hurairah_chat") || "[]");
let hurairahMode = sessionStorage.getItem("hurairah_mode") === "true";

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const attachBtn = document.getElementById("attachBtn");
const imageInput = document.getElementById("imageInput");
const recordingPopup = document.getElementById("recordingPopup");

let selectedImage = null;

function getTime() {
  const now = new Date();
  return now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function getCurrentDate() {
  const now = new Date();
  return now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function getDirectDateTimeReply(text) {
  const msg = text.toLowerCase().trim();
  const dateKeywords = ["date", "tarikh", "tareekh", "aaj ki date", "today's date", "todays date"];
  const timeKeywords = ["time", "samay", "kitne baje", "kitna baj", "current time", "ajka time", "abhi kya time"];
  const isDateQuery = dateKeywords.some(k => msg.includes(k));
  const isTimeQuery = timeKeywords.some(k => msg.includes(k));
  if (isDateQuery && isTimeQuery) {
    return `Aaj ki date ${getCurrentDate()} hai aur abhi ka time ${getTime()} hai.`;
  }
  if (isDateQuery) return `Aaj ki date ${getCurrentDate()} hai.`;
  if (isTimeQuery) return `Abhi ka time ${getTime()} hai.`;
  return null;
}

function isWeatherQuery(text) {
  const msg = text.toLowerCase();
  const weatherKeywords = ["weather", "mausam", "temperature", "tapman", "baarish", "barish"];
  return weatherKeywords.some(k => msg.includes(k));
}

function extractCityName(text) {
  const cleaned = text.replace(/[?.!]/g, "");
  const patterns = [
    /weather\s+(?:in|of|for)\s+([a-zA-Z\s]+)/i,
    /([a-zA-Z\s]+?)\s+(?:ka|ki|ke)\s+(?:weather|mausam|temperature|tapman)/i,
    /([a-zA-Z\s]+?)\s+mein\s+(?:weather|mausam)/i,
    /([a-zA-Z\s]+?)\s+(?:weather|mausam)/i
  ];
  const STOPWORDS = ["today", "now", "abhi", "aaj", "kaisa", "kaisi", "hai", "please", "batao", "kya", "ka", "ki", "ke", "mein", "me", "mausam", "weather", "temperature", "tapman", "is", "the", "whats", "what", "tell", "current"];
  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      let words = match[1].trim().split(/\s+/);
      while (words.length > 0 && STOPWORDS.includes(words[words.length - 1].toLowerCase())) words.pop();
      while (words.length > 0 && STOPWORDS.includes(words[0].toLowerCase())) words.shift();
      const city = words.join(" ");
      if (city.length > 1) return city;
    }
  }
  return null;
}

function getWeatherDescription(code) {
  const map = {
    0: "saaf aasman ☀️", 1: "mostly saaf ☀️", 2: "halka badal ⛅", 3: "badal ☁️",
    45: "kohra 🌫️", 48: "kohra 🌫️",
    51: "halki baarish 🌦️", 53: "baarish 🌦️", 55: "tez baarish 🌧️",
    61: "halki baarish 🌧️", 63: "baarish 🌧️", 65: "tez baarish 🌧️",
    71: "halki barfbaari ❄️", 73: "barfbaari ❄️", 75: "tez barfbaari ❄️",
    80: "halki shower 🌦️", 81: "shower 🌧️", 82: "tez shower ⛈️",
    95: "toofan ⛈️", 96: "toofan with hail ⛈️", 99: "tez toofan with hail ⛈️"
  };
  return map[code] || "mixed weather 🌥️";
}

async function getDirectWeatherReply(text) {
  const city = extractCityName(text);
  if (!city) {
    return "Kis shehar ka weather batau? Jaise likho: 'Delhi ka weather' ya 'weather in Mumbai'.";
  }
  try {
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      return `Mujhe "${city}" naam ka shehar nahi mila. Sahi spelling check karo.`;
    }
    const place = geoData.results[0];
    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current_weather=true`);
    const weatherData = await weatherRes.json();
    const cw = weatherData.current_weather;
    const desc = getWeatherDescription(cw.weathercode);
    const placeName = place.country ? `${place.name}, ${place.country}` : place.name;
    return `${placeName} mein abhi temperature ${cw.temperature}°C hai aur ${desc} hai. Wind speed ${cw.windspeed} km/h hai.`;
  } catch (err) {
    return "Weather fetch karne mein problem aa gayi. Thodi der baad try karo.";
  }
}

function isImageRequest(text) {
  const msg = text.toLowerCase();
  const keywords = [
    "image banao", "image bana", "photo banao", "photo bana",
    "picture banao", "picture bana", "tasveer banao", "tasveer bana",
    "generate image", "image generate", "image of", "draw"
  ];
  return keywords.some(k => msg.includes(k));
}

function extractImagePrompt(text) {
  return text
    .replace(/image banao|image bana|photo banao|photo bana|picture banao|picture bana|tasveer banao|tasveer bana|generate image|image generate|image of|draw/gi, "")
    .replace(/[:\-]/g, "")
    .trim();
}

async function generateImage(prompt) {
  return new Promise((resolve, reject) => {
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true&seed=${Date.now()}`;
    const img = new Image();
    img.onload = () => resolve(imageUrl);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = imageUrl;
  });
}

function addGeneratedImage(imageUrl, prompt) {
  const msg = document.createElement("div");
  msg.className = "message bot";
  msg.innerHTML = `
    <div class="bot-header">
      <div class="bot-avatar">✨</div>
      <div class="bot-name">Hurairah AI</div>
    </div>
    <div class="msg-text" style="margin-bottom:8px;">Ye rahi teri image 🎨</div>
    <img src="${imageUrl}" 
         alt="${prompt}" 
         style="max-width:260px; width:100%; border-radius:14px; display:block; margin-top:4px;" 
         loading="lazy" />
    <a href="${imageUrl}" download="hurairah-ai-image.jpg" 
       style="display:inline-block; margin-top:8px; font-size:12px; color:#a78bfa; text-decoration:none;">
      ⬇️ Download
    </a>
    <div class="time">${getTime()}</div>
  `;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  messages.push({ text: `[Image: ${prompt}]`, type: "bot" });
  sessionStorage.setItem("hurairah_chat", JSON.stringify(messages));
}

function removeWelcomeScreen() {
  const welcome = document.querySelector(".welcome-screen");
  if (welcome) {
    welcome.style.opacity = "0";
    setTimeout(() => welcome.remove(), 300);
  }
}

async function speakWithElevenLabs(text, btn) {
  try {
    btn.textContent = "⏳ Loading...";
    btn.disabled = true;
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_turbo_v2_5",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.9,
          style: 0.5,
          use_speaker_boost: true
        }
      })
    });
    if (!res.ok) throw new Error("ElevenLabs error");
    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    btn.textContent = "🔊 Suno";
    btn.disabled = false;
    audio.play();
    audio.onended = () => URL.revokeObjectURL(audioUrl);
  } catch (err) {
    btn.textContent = "🔊 Suno";
    btn.disabled = false;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    speech.rate = 1;
    speechSynthesis.speak(speech);
  }
}

function addMessage(text, type, animate = false, imageData = null) {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;

  if (type === "bot") {
    msg.innerHTML = `
      <div class="bot-header">
        <div class="bot-avatar">✨</div>
        <div class="bot-name">Hurairah AI</div>
      </div>
      <div class="msg-text"></div>
      <button class="speak-btn" style="display:none">🔊 Suno</button>
      <div class="time">${getTime()}</div>
    `;
  } else {
    let imageHTML = "";
    if (imageData) {
      imageHTML = `<img src="${imageData}" style="max-width:200px; max-height:200px; border-radius:12px; display:block; margin-bottom:6px;" />`;
    }
    msg.innerHTML = `
      ${imageHTML}
      ${text ? `<div class="msg-text">${text}</div>` : ""}
      <div class="time">${getTime()}</div>
    `;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  const textEl = msg.querySelector(".msg-text");

  if (type === "bot" && animate) {
    const speakBtn = msg.querySelector(".speak-btn");
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    textEl.appendChild(cursor);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        cursor.insertAdjacentText("beforebegin", text[i]);
        i++;
        chatBox.scrollTop = chatBox.scrollHeight;
      } else {
        clearInterval(interval);
        cursor.remove();
        speakBtn.style.display = "inline-block";
        speakBtn.addEventListener("click", () => {
          speakWithElevenLabs(text, speakBtn);
        });
      }
    }, 22);
  } else if (type === "bot") {
    if (textEl) textEl.textContent = text;
    const speakBtn = msg.querySelector(".speak-btn");
    speakBtn.style.display = "inline-block";
    speakBtn.addEventListener("click", () => {
      speakWithElevenLabs(text, speakBtn);
    });
  }

  chatBox.scrollTop = chatBox.scrollHeight;
  messages.push({ text, type });
  sessionStorage.setItem("hurairah_chat", JSON.stringify(messages));
}

function showImagePreview(imageData, fileName) {
  removeImagePreview();
  const preview = document.createElement("div");
  preview.id = "imagePreview";
  preview.style.cssText = `
    position: relative;
    display: inline-block;
    margin: 8px 12px;
    border-radius: 12px;
    overflow: hidden;
  `;
  preview.innerHTML = `
    <img src="${imageData}" style="max-width:120px; max-height:120px; border-radius:12px; display:block;" />
    <button onclick="removeImagePreview()" style="
      position:absolute; top:4px; right:4px;
      background:rgba(0,0,0,0.6); border:none;
      color:white; border-radius:50%;
      width:22px; height:22px;
      font-size:12px; cursor:pointer;
      display:flex; align-items:center; justify-content:center;
    ">✕</button>
  `;
  const inputArea = document.querySelector(".input-area");
  inputArea.parentNode.insertBefore(preview, inputArea);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeImagePreview() {
  const preview = document.getElementById("imagePreview");
  if (preview) preview.remove();
}

function showThinking() {
  const thinking = document.createElement("div");
  thinking.className = "thinking";
  thinking.id = "thinking";
  thinking.innerHTML = `
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
    <span class="thinking-text">Hurairah AI likh raha hai...</span>
  `;
  chatBox.appendChild(thinking);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeThinking() {
  const t = document.getElementById("thinking");
  if (t) t.remove();
}

async function sendMessage() {
  const text = input.value.trim();
  if (!text && !selectedImage) return;

  if (text.toLowerCase() === "mehajabeen pgl hu") {
    hurairahMode = true;
    sessionStorage.setItem("hurairah_mode", "true");
  }

  removeWelcomeScreen();
  addMessage(text, "user", false, selectedImage);
  removeImagePreview();
  input.value = "";
  input.style.height = "24px";

  if (!selectedImage) {
    const directReply = getDirectDateTimeReply(text);
    if (directReply) {
      addMessage(directReply, "bot", true);
      return;
    }

    if (isWeatherQuery(text)) {
      showThinking();
      const weatherReply = await getDirectWeatherReply(text);
      removeThinking();
      addMessage(weatherReply, "bot", true);
      return;
    }

    if (isImageRequest(text)) {
      const prompt = extractImagePrompt(text) || text;
      showThinking();
      const loadingMsg = document.createElement("div");
      loadingMsg.className = "message bot";
      loadingMsg.id = "imgLoadingMsg";
      loadingMsg.innerHTML = `
        <div class="bot-header">
          <div class="bot-avatar">✨</div>
          <div class="bot-name">Hurairah AI</div>
        </div>
        <div class="msg-text">🎨 Image bana raha hoon... thoda wait karo!</div>
        <div class="time">${getTime()}</div>
      `;
      chatBox.appendChild(loadingMsg);
      chatBox.scrollTop = chatBox.scrollHeight;

      try {
        const imageUrl = await generateImage(prompt);
        removeThinking();
        const oldMsg = document.getElementById("imgLoadingMsg");
        if (oldMsg) oldMsg.remove();
        addGeneratedImage(imageUrl, prompt);
      } catch (err) {
        removeThinking();
        const oldMsg = document.getElementById("imgLoadingMsg");
        if (oldMsg) oldMsg.remove();
        addMessage("Image generate nahi ho payi 😔 Dobara try karo ya alag prompt likho.", "bot", true);
      }
      return;
    }
  }

  showThinking();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        message: text || "Is image mein kya hai?",
        image: selectedImage,
        hurairahMode
      })
    });
    const data = await res.json();
    removeThinking();
    addMessage(data.reply || "Koi response nahi mila", "bot", true);
    selectedImage = null;
    imageInput.value = "";
  } catch (err) {
    removeThinking();
    addMessage("Error: " + err.message, "bot", true);
  }
}

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

input.addEventListener("input", () => {
  input.style.height = "24px";
  input.style.height = Math.min(input.scrollHeight, 80) + "px";
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// 🎤 MIC BUTTON FIX
if (SpeechRecognition && micBtn) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = true;
  
  recognition.onstart = () => { 
    if (recordingPopup) recordingPopup.style.display = "flex"; 
  };
  
  recognition.onend = () => { 
    if (recordingPopup) recordingPopup.style.display = "none"; 
  };
  
  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    input.value = transcript; // Jo bolenge wo input me type ho jayega
  };
  
  micBtn.addEventListener("click", () => {
    try { 
      recognition.start(); 
    } catch (err) { 
      console.log("Mic error:", err); 
    }
  });
} else {
  if (micBtn) micBtn.style.display = "none"; // Agar browser support na kare to hide kar do
}

attachBtn.addEventListener("click", () => imageInput.click());

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    selectedImage = reader.result;
    showImagePreview(selectedImage, file.name);
  };
  reader.readAsDataURL(file);
});

document.getElementById("clearBtn").addEventListener("click", () => {
  if (confirm("Chat delete karna chahte ho?")) {
    sessionStorage.removeItem("hurairah_chat");
    sessionStorage.removeItem("hurairah_mode");
    messages = [];
    location.reload();
  }
});

// =========================================================
// Voice Chat Mode (COMPLETELY FIXED)
// =========================================================

function injectVoiceModeStyles() {
  if (document.getElementById("voiceModeStyles")) return;
  const style = document.createElement("style");
  style.id = "voiceModeStyles";
  style.textContent = `
    .voice-mode-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: inherit;
      flex-shrink: 0;
      margin-left: 6px;
    }
    .voice-mode-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: linear-gradient(135deg, #1a0a2e, #0a0a14);
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 22px;
    }
    .voice-orb {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c3aed, #4f6cf7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 56px;
      box-shadow: 0 0 60px rgba(124, 58, 237, 0.6);
      transition: all 0.3s ease;
    }
    .voice-orb.thinking { animation: hurairah-spin 1.4s linear infinite; }
    .voice-orb.speaking { animation: hurairah-pulse 0.6s infinite ease-in-out; }
    @keyframes hurairah-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.12); }
    }
    @keyframes hurairah-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .voice-status {
      color: #ece9f7;
      font-size: 18px;
      font-weight: 600;
      text-align: center;
      padding: 0 24px;
    }
    .voice-transcript {
      color: #9590b3;
      font-size: 14px;
      text-align: center;
      padding: 0 32px;
      min-height: 20px;
    }
    .voice-exit-btn {
      margin-top: 10px;
      padding: 12px 28px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,0.2);
      background: rgba(255,255,255,0.08);
      color: #ece9f7;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
  `;
  document.head.appendChild(style);
}

function createVoiceModeUI() {
  if (document.getElementById("voiceModeBtn")) return;

  if (!SpeechRecognition) {
    if (document.getElementById("micBtn")) {
      document.getElementById("micBtn").style.display = "none";
    }
    return;
  }

  injectVoiceModeStyles();

  // Create Button inside input area
  const btn = document.createElement("button");
  btn.id = "voiceModeBtn";
  btn.className = "voice-mode-btn";
  btn.title = "Voice Chat Mode";
  btn.innerHTML = "🎧";
  
  const inputArea = document.querySelector(".input-area");
  if(inputArea) {
      inputArea.appendChild(btn);
  }

  // Create Full-Screen Overlay
  const overlay = document.createElement("div");
  overlay.id = "voiceModeOverlay";
  overlay.className = "voice-mode-overlay";
  
  overlay.innerHTML = `
    <div class="voice-orb" id="voiceOrb">🎙️</div>
    <div class="voice-status" id="voiceStatus">Sun raha hoon... Boliye!</div>
    <div class="voice-transcript" id="voiceTranscript"></div>
    <button class="voice-exit-btn" id="voiceExitBtn">Band Karein</button>
  `;
  
  document.body.appendChild(overlay);

  const transcriptText = document.getElementById("voiceTranscript");
  const exitBtn = document.getElementById("voiceExitBtn");

  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";

  btn.addEventListener("click", () => {
    overlay.style.display = "flex";
    transcriptText.textContent = "";
    recognition.start();
  });

  exitBtn.addEventListener("click", () => {
    overlay.style.display = "none";
    recognition.stop();
  });

  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    transcriptText.textContent = text;
    input.value = text;
    overlay.style.display = "none";
    sendMessage();
  };

  recognition.onerror = () => {
    overlay.style.display = "none";
  };

  recognition.onend = () => {
    overlay.style.display = "none";
  };
}

createVoiceModeUI();
