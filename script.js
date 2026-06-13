const API_URL = "https://hurairah-ai.annu8857818.workers.dev";

let username = localStorage.getItem("hurairah_username");

if (username) {
  document.getElementById("nameModal").style.display = "none";
const API_URL = "https://hurairah-ai.annu8857818.workers.dev";
const ELEVENLABS_API_KEY = "sk_ba5c973ec598f00b7293cc1f37675eb24f52363489ea82be";
const ELEVENLABS_VOICE_ID = "4wf10lgibMnboGJGCLrP";

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
let hurairahMode = localStorage.getItem("hurairah_mode") === "true";

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
  return now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
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
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          style: 0.3,
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

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };

  } catch (err) {
    // Fallback to browser voice
    btn.textContent = "🔊 Suno";
    btn.disabled = false;
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-IN";
    speech.rate = 1;
    speechSynthesis.speak(speech);
  }
}

function addMessage(text, type, animate = false) {
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
    msg.innerHTML = `
      <div class="msg-text">${text}</div>
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
    textEl.textContent = text;
    const speakBtn = msg.querySelector(".speak-btn");
    speakBtn.style.display = "inline-block";
    speakBtn.addEventListener("click", () => {
      speakWithElevenLabs(text, speakBtn);
    });
  }

  chatBox.scrollTop = chatBox.scrollHeight;
  messages.push({ text, type });
  localStorage.setItem("hurairah_chat", JSON.stringify(messages));
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
    localStorage.setItem("hurairah_mode", "true");
  }

  removeWelcomeScreen();
  if (text) addMessage(text, "user");
  input.value = "";
  input.style.height = "24px";
  showThinking();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        message: text,
        image: selectedImage,
        hurairahMode
      })
    });
    const data = await res.json();
    removeThinking();
    addMessage(data.reply || "Koi response nahi mila", "bot", true);
    selectedImage = null;
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

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    selectedImage = reader.result;
    addMessage("📷 Image: " + file.name, "user");
  };
  reader.readAsDataURL(file);
});

document.getElementById("clearBtn").addEventListener("click", () => {
  if (confirm("Chat delete karna chahte ho?")) {
    localStorage.removeItem("hurairah_chat");
    messages = [];
    location.reload();
  }
});
