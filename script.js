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

function getTime() {
  const now = new Date();
  return now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

// ✅ NEW: Date/Time ko AI se mat puchwao, seedha device se nikalo (100% sahi rahega)
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
  if (isDateQuery) {
    return `Aaj ki date ${getCurrentDate()} hai.`;
  }
  if (isTimeQuery) {
    return `Abhi ka time ${getTime()} hai.`;
  }
  return null;
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

// ✅ NEW: generatedImage param add kiya bot messages ke liye
function addMessage(text, type, animate = false, imageData = null, generatedImage = null) {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;

  if (type === "bot") {
    msg.innerHTML = `
      <div class="bot-header">
        <div class="bot-avatar">✨</div>
        <div class="bot-name">Hurairah AI</div>
      </div>
      <div class="msg-text"></div>
      ${generatedImage ? `
        <div class="generated-img-wrap" style="display:none; margin-top:8px;">
          <div class="img-loading">🎨 Image load ho rahi hai...</div>
          <img class="generated-img" style="max-width:100%; border-radius:12px; display:none;" />
        </div>
      ` : ""}
      <button class="speak-btn" style="display:none">🔊 Suno</button>
      <div class="time">${getTime()}</div>
    `;
  } else {
    // ✅ FIXED: Image preview chatbox mein dikhao
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

  // ✅ NEW: Generated image ko reveal karne ka function - single seamless load
  function revealGeneratedImage() {
    const wrap = msg.querySelector(".generated-img-wrap");
    if (!wrap) return;
    wrap.style.display = "block";

    const imgEl = wrap.querySelector(".generated-img");
    const loadingEl = wrap.querySelector(".img-loading");

    imgEl.addEventListener("load", () => {
      loadingEl.style.display = "none";
      imgEl.style.display = "block";
      chatBox.scrollTop = chatBox.scrollHeight;
    });

    imgEl.addEventListener("error", () => {
      loadingEl.innerHTML = `❌ Image generate nahi ho payi. <a href="${generatedImage}" target="_blank" style="color:#a78bfa;">Yahan tap karo</a>`;
    });

    imgEl.src = generatedImage;
    chatBox.scrollTop = chatBox.scrollHeight;
  }

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
        if (generatedImage) revealGeneratedImage();
      }
    }, 22);

  } else if (type === "bot") {
    if (textEl) textEl.textContent = text;
    const speakBtn = msg.querySelector(".speak-btn");
    speakBtn.style.display = "inline-block";
    speakBtn.addEventListener("click", () => {
      speakWithElevenLabs(text, speakBtn);
    });
    if (generatedImage) revealGeneratedImage();
  }

  chatBox.scrollTop = chatBox.scrollHeight;
  messages.push({ text, type, generatedImage });
  localStorage.setItem("hurairah_chat", JSON.stringify(messages));
}

// ✅ FIXED: Image preview input area mein dikhao
function showImagePreview(imageData, fileName) {
  // Pehle purana preview hatao
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
  // ✅ FIXED: Image preview chatbox mein dikhao aur input preview hatao
  addMessage(text, "user", false, selectedImage);
  removeImagePreview();
  input.value = "";
  input.style.height = "24px";

  // ✅ NEW: Agar date/time pucha hai, AI ko call hi mat karo - seedha sahi jawab do
  if (!selectedImage) {
    const directReply = getDirectDateTimeReply(text);
    if (directReply) {
      addMessage(directReply, "bot", true);
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
    // ✅ NEW: generatedImage ko addMessage mein pass karo
    addMessage(data.reply || "Koi response nahi mila", "bot", true, null, data.generatedImage || null);
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
if (SpeechRecognition && micBtn) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.onstart = () => { if (recordingPopup) recordingPopup.style.display = "flex"; };
  recognition.onend = () => { if (recordingPopup) recordingPopup.style.display = "none"; };
  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    input.value = transcript;
  };
  micBtn.addEventListener("click", () => {
    try { recognition.start(); } catch (err) { console.log(err); }
  });
} else {
  if (micBtn) micBtn.style.display = "none";
}

attachBtn.addEventListener("click", () => imageInput.click());

// ✅ FIXED: Image select hone pe preview dikhao, direct send mat karo
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
    localStorage.removeItem("hurairah_chat");
    sessionStorage.removeItem("hurairah_mode");
    messages = [];
    location.reload();
  }
});
