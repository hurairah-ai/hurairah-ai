const API_URL = "https://hurairah-ai.annu8857818.workers.dev";

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

function removeWelcomeScreen() {
  const welcome = document.querySelector(".welcome-screen");
  if (welcome) {
    welcome.style.opacity = "0";
    setTimeout(() => welcome.remove(), 300);
  }
}

// Image preview input ke upar
function createImagePreview(dataUrl, fileName) {
  removeImagePreview();
  const preview = document.createElement("div");
  preview.id = "imagePreview";
  preview.innerHTML = `
    <div class="preview-inner">
      <img src="${dataUrl}" alt="preview">
      <button class="preview-remove" id="removePreviewBtn">✕</button>
    </div>
    <span class="preview-name">${fileName}</span>
  `;
  const inputArea = document.querySelector(".input-area");
  inputArea.parentNode.insertBefore(preview, inputArea);
  document.getElementById("removePreviewBtn").addEventListener("click", () => {
    removeImagePreview();
    selectedImage = null;
    imageInput.value = "";
  });
}

function removeImagePreview() {
  const existing = document.getElementById("imagePreview");
  if (existing) existing.remove();
}

// Chat bubble mein image + text
function addMessage(text, type, imageData = null) {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.style.opacity = "0";
  msg.style.transform = type === "user" ? "translateX(20px)" : "translateX(-20px)";

  let content = "";

  if (imageData && type === "user") {
    content += `<img class="msg-image" src="${imageData}" alt="uploaded">`;
  }

  if (type === "bot") {
    content += `<div class="msg-text">${text}</div><button class="speak-btn">🔊</button>`;
  } else {
    content += `<div class="msg-text">${text}</div>`;
  }

  msg.innerHTML = content;
  chatBox.appendChild(msg);

  requestAnimationFrame(() => {
    msg.style.transition = "all 0.3s ease";
    msg.style.opacity = "1";
    msg.style.transform = "translateX(0)";
  });

  if (type === "bot") {
    msg.querySelector(".speak-btn").addEventListener("click", () => {
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = "en-IN";
      speech.rate = 1;
      speechSynthesis.speak(speech);
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
  thinking.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div>`;
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
  addMessage(text || "", "user", selectedImage);
  removeImagePreview();
  input.value = "";
  input.style.height = "24px";
  showThinking();

  const imageToSend = selectedImage;
  selectedImage = null;
  imageInput.value = "";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        message: text || "Is image mein kya hai?",
        image: imageToSend,
        hurairahMode
      })
    });
    const data = await res.json();
    removeThinking();
    addMessage(data.reply || "Koi response nahi mila", "bot");
  } catch (err) {
    removeThinking();
    addMessage("Error: " + err.message, "bot");
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
    createImagePreview(reader.result, file.name);
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
