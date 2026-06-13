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

function removeWelcomeScreen() {
  const welcome = document.querySelector(".welcome-screen");
  if (welcome) {
    welcome.style.opacity = "0";
    setTimeout(() => welcome.remove(), 300);
  }
}

// --- 🔥 UPGRADE: RICH TEXT, MARKDOWN & CODE BLOCK PARSER ---
function parseMarkdown(text) {
  if (!text) return "";
  
  let html = text;

  // 1. Multi-line Code Blocks with Copy Button (```code
```)
  html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
    const cleanCode = code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
    return `
      <div class="code-block-container" style="margin: 12px 0; border-radius: 10px; overflow: hidden; background: #1e1e2e; font-family: monospace; border: 1px solid rgba(255,255,255,0.1); text-align: left;">
        <div class="code-header" style="background: #11111b; padding: 8px 14px; font-size: 12px; color: #a6adc8; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05);">
          <span>Code</span>
          <button onclick="navigator.clipboard.writeText(\`${cleanCode.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`); this.textContent='Copied! 😎'; this.style.color='#a78bfa'; setTimeout(()=>{this.textContent='Copy'; this.style.color='white'}, 2000)" style="background: rgba(255,255,255,0.1); border: none; color: white; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 11px; transition: 0.2s;">Copy</button>
        </div>
        <pre style="padding: 14px; overflow-x: auto; color: #cdd6f4; font-size: 13px; line-height: 1.6; font-family: 'Courier New', Courier, monospace;"><code>${cleanCode}</code></pre>
      </div>
    `;
  });

  // 2. Inline Code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(124,58,237,0.18); color: #c084fc; padding: 2px 6px; border-radius: 6px; font-family: monospace; font-size: 13px;">$1</code>');

  // 3. Bold Text (**bold**)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="color: #ffffff; font-weight: 700;">$1</strong>');

  // 4. Bullet Lists (* list)
  html = html.replace(/^\*\s+(.+)$/gm, '<li style="margin-left: 20px; margin-bottom: 6px; color: #e2e8f0; text-align: left;">$1</li>');

  // 5. Line Breaks
  html = html.replace(/\n/g, "<br>");

  return html;
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
        voice_settings: { stability: 0.4, similarity_boost: 0.9, style: 0.5, use_speaker_boost: true }
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

// --- 🔥 UPGRADE: REAL-TIME STREAMING-STYLE TYPING ANIMATION ---
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
      <button class="speak-btn" style="display:none; margin-top: 8px;">🔊 Suno</button>
      <div class="time">${getTime()}</div>
    `;
  } else {
    let imageHTML = imageData ? `<img src="${imageData}" style="max-width:200px; max-height:200px; border-radius:12px; display:block; margin-bottom:6px;" />` : "";
    msg.innerHTML = `
      ${imageHTML}
      ${text ? `<div class="msg-text">${parseMarkdown(text)}</div>` : ""}
      <div class="time">${getTime()}</div>
    `;
  }

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  const textEl = msg.querySelector(".msg-text");

  if (type === "bot" && animate) {
    const speakBtn = msg.querySelector(".speak-btn");
    let currentText = "";
    let i = 0;

    const interval = setInterval(() => {
      if (i < text.length) {
        currentText += text[i];
        textEl.innerHTML = parseMarkdown(currentText) + '<span class="cursor" style="display: inline-block; width: 2px; height: 14px; background: #7c3aed; margin-left: 3px; animation: blink 0.6s infinite;">|</span>';
        i++;
        chatBox.scrollTop = chatBox.scrollHeight;
      } else {
        clearInterval(interval);
        const cursor = textEl.querySelector(".cursor");
        if (cursor) cursor.remove();
        textEl.innerHTML = parseMarkdown(text); 
        
        speakBtn.style.display = "inline-block";
        speakBtn.addEventListener("click", () => speakWithElevenLabs(text, speakBtn));
      }
    }, 15);

  } else if (type === "bot") {
    if (textEl) textEl.innerHTML = parseMarkdown(text);
    const speakBtn = msg.querySelector(".speak-btn");
    speakBtn.style.display = "inline-block";
    speakBtn.addEventListener("click", () => speakWithElevenLabs(text, speakBtn));
  }

  chatBox.scrollTop = chatBox.scrollHeight;
  messages.push({ text, type });
  localStorage.setItem("hurairah_chat", JSON.stringify(messages));
}

function showImagePreview(imageData, fileName) {
  removeImagePreview();

  const preview = document.createElement("div");
  preview.id = "imagePreview";
  preview.style.cssText = `position: relative; display: inline-block; margin: 8px 12px; border-radius: 12px; overflow: hidden;`;
  preview.innerHTML = `
    <img src="${imageData}" style="max-width:120px; max-height:120px; border-radius:12px; display:block;" />
    <button onclick="removeImagePreview()" style="position:absolute; top:4px; right:4px; background:rgba(0,0,0,0.6); border:none; color:white; border-radius:50%; width:22px; height:22px; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
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
    <span class="thinking-text">Hurairah AI likh raha hai...😎</span>
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
  showThinking();

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, message: text || "Is image mein kya hai?", image: selectedImage, hurairahMode })
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
if (SpeechRecognition && micBtn) {
  const recognition = new SpeechRecognition();
  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.onstart = () => { if (recordingPopup) recordingPopup.style.display = "flex"; };
  recognition.onend = () => { if (recordingPopup) recordingPopup.style.display = "none"; };
  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = 0; i < event.results.length; i++) { transcript += event.results[i][0].transcript; }
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
