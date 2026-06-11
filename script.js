const API_URL = "https://hurairah-ai.annu8857818.workers.dev";

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");

function addMessage(text, type) {
  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.textContent = text;

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showThinking() {
  const thinking = document.createElement("div");

const API_URL = "https://hurairah-ai.annu8857818.workers.dev";

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");

function hideWelcome() {
  const welcome = document.querySelector(".welcome-screen");
  if (welcome) welcome.style.display = "none";
}

function addMessage(text, type) {

  hideWelcome();

  const msg = document.createElement("div");
  msg.className = `message ${type}`;
  msg.textContent = text;

  chatBox.appendChild(msg);

  chatBox.scrollTop = chatBox.scrollHeight;
}

function showThinking() {

  const thinking = document.createElement("div");

  thinking.className = "thinking";
  thinking.id = "thinking";

  thinking.innerHTML = `
    <div class="dot"></div>
    <div class="dot"></div>
    <div class="dot"></div>
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

  if (!text) return;

  addMessage(text, "user");

  input.value = "";

  showThinking();

  try {

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text
      })
    });

    const data = await res.json();

    removeThinking();

    addMessage(
      data.reply || "No response",
      "bot"
    );

  } catch (err) {

    removeThinking();

    addMessage(
      "Error: " + err.message,
      "bot"
    );
  }
}

sendBtn.addEventListener(
  "click",
  sendMessage
);

input.addEventListener(
  "keydown",
  (e) => {

    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {

      e.preventDefault();

      sendMessage();
    }
  }
);

// ===== MIC =====

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn) {

  const recognition =
  new SpeechRecognition();

  recognition.lang = "hi-IN";

  recognition.onresult = (event) => {

    const text =
    event.results[0][0].transcript;

    input.value = text;
  };

  micBtn.addEventListener(
    "click",
    () => {

      recognition.start();
    }
  );

} else {

  console.log(
    "Speech Recognition Not Supported"
  );

  micBtn.style.display = "none";
}
