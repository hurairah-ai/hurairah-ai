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

// ✅ Code highlighting + copy + run button
function formatMessage(text) {
  text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'code';
    const escapedCode = code.trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const isRunnable = ['javascript', 'js', 'html'].includes(language.toLowerCase());
    const runBtn = isRunnable
      ? `<button class="run-btn" onclick="runCode(this)">▶ Run</button>`
      : '';

    return `<pre><div class="code-header"><span class="code-lang">${language}</span><div style="display:flex;gap:6px;">${runBtn}<button class="copy-btn" onclick="copyCode(this)">📋 Copy</button></div></div><code>${escapedCode}</code></pre>`;
  });

  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  text = text.replace(/\n/g, '<br>');
  return text;
}

function copyCode(btn) {
  const code = btn.closest('pre').querySelector('code').innerText;
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '✅ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = '📋 Copy';
      btn.classList.remove('copied');
    }, 2000);
  });
}

// ✅ Run button function
function runCode(btn) {
  const pre = btn.closest('pre');
  const lang = pre.querySelector('.code-lang').textContent.toLowerCase();
  const code = pre.querySelector('code').innerText;

  // Purana output hatao
  const oldOutput = pre.nextElementSibling;
  if (oldOutput && oldOutput.classList.contains('code-output')) {
    oldOutput.remove();
  }

  const output = document.createElement('div');
  output.className = 'code-output';

  if (lang === 'html') {
    const escaped = code.replace(/"/g, '&quot;');
    output.innerHTML = `
      <div class="output-header">🌐 HTML Preview</div>
      <iframe srcdoc="${escaped}" style="width:100%;height:200px;border:none;background:white;"></iframe>
    `;
  } else {
    output.innerHTML = `<div class="output-header">⚡ Output</div><div class="output-text"></div>`;
    const outputText = output.querySelector('.output-text');

    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
      originalLog(...args);
    };

    try {
      const result = eval(code);
      console.log = originalLog;

      if (logs.length > 0) {
        outputText.textContent = logs.join('\n');
      } else if (result !== undefined) {
        outputText.textContent = String(result);
      } else {
        outputText.textContent = '✅ Code ran successfully (no output)';
      }
    } catch (err) {
      console.log = originalLog;
      outputText.textContent = '❌ Error: ' + err.message;
      outputText.style.color = '#f38ba8';
    }
  }

  pre.insertAdjacentElement('afterend', output);
  output.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
      imageHTML = `<img src="${imageData}" class="msg-image" />`;
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
    if (textEl) textEl.appendChild(cursor);

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        cursor.insertAdjacentText("beforebegin", text[i]);
        i++;
        chatBox.scrollTop = chatBox.scrollHeight;
      } else {
        clearInterval(interval);
        cursor.remove();
        if (textEl) textEl.innerHTML = formatMessage(text);
        speakBtn.style.display = "inline-block";
        speakBtn.addEventListener("click", () => {
          speakWithElevenLabs(text, speakBtn);
        });
      }
    }, 22);

  } else if (type === "bot") {
    if (textEl) textEl.innerHTML = formatMessage(text);
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

function showImagePreview(imageData, fileName) {
  removeImagePreview();

  const preview = document.createElement("div");
  preview.id = "imagePreview";
  preview.innerHTML = `
    <div class="preview-inner">
      <img src="${imageData}" />
      <button class="preview-remove" onclick="removeImagePreview()">✕</button>
    </div>
    <span class="preview-name">📷 ${fileName}</span>
  `;

  const inputArea = document.querySelector(".input-area");
  inputArea.parentNode.insertBefore(preview, inputArea);
}

function removeImagePreview() {
  const preview = document.getElementById("imagePreview");
  if (preview) {
    preview.remove();
    selectedImage = null;
    imageInput.value = "";
  }
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
