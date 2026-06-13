const API_URL = "https://hurairah-ai.annu8857818.workers.dev";

let username = localStorage.getItem("hurairah_username");

if (!username) {

username = prompt("Apna Naam Likho");

while (!username || username.trim() === "") {

username = prompt("Naam dalna zaroori hai");

}

username = username.trim();

localStorage.setItem(
"hurairah_username",
username
);
}

let messages = JSON.parse(
localStorage.getItem("hurairah_chat") || "[]"
);

let hurairahMode =
localStorage.getItem("hurairah_mode") === "true";

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const attachBtn = document.getElementById("attachBtn");
const imageInput = document.getElementById("imageInput");

let selectedImage = null;

const recordingPopup =
document.getElementById("recordingPopup");

function removeWelcomeScreen() {

const welcome =
document.querySelector(".welcome-screen");

if (welcome) {
welcome.remove();
}

}

function addMessage(text, type) {

const msg =
document.createElement("div");

msg.className =
"message ${type}";

if (type === "bot") {

msg.innerHTML = `
  <div>${text}</div>
  <button class="speak-btn">🔊</button>
`;

} else {

msg.textContent = text;

}

chatBox.appendChild(msg);

if (type === "bot") {

const speakBtn =
msg.querySelector(".speak-btn");

speakBtn.addEventListener(
  "click",
  () => {

    const speech =
    new SpeechSynthesisUtterance(text);

    speech.lang = "en-IN";
    speech.rate = 1;

    speechSynthesis.speak(speech);

  }
);

}

chatBox.scrollTop =
chatBox.scrollHeight;

messages.push({
text,
type
});

localStorage.setItem(
"hurairah_chat",
JSON.stringify(messages)
);

}

function showThinking() {

const thinking =
document.createElement("div");

thinking.className =
"thinking";

thinking.id =
"thinking";

thinking.innerHTML = "<div class="dot"></div> <div class="dot"></div> <div class="dot"></div>";

chatBox.appendChild(thinking);

chatBox.scrollTop =
chatBox.scrollHeight;

}

function removeThinking() {

const t =
document.getElementById("thinking");

if (t) t.remove();

}

async function sendMessage() {

const text =
input.value.trim();

if (!text) return;

if (
text.toLowerCase() ===
"mehajabeen pgl hu"
) {

hurairahMode = true;

localStorage.setItem(
  "hurairah_mode",
  "true"
);

}

removeWelcomeScreen();

addMessage(text, "user");

input.value = "";

showThinking();

try {

const res = await fetch(
  API_URL,
  {
    method: "POST",
    headers: {
      "Content-Type":
      "application/json"
    },
    body: JSON.stringify({
      username: username,
      message: text,
      image: selectedImage,
      hurairahMode:
      hurairahMode
    })
  }
);

const data =
await res.json();

removeThinking();

addMessage(
  data.reply ||
  "Koi response nahi mila",
  "bot"
);

selectedImage = null;

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

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

if (
SpeechRecognition &&
micBtn
) {

const recognition =
new SpeechRecognition();

recognition.lang =
"en-IN";

recognition.continuous =
false;

recognition.interimResults =
true;

recognition.onstart = () => {

if (recordingPopup) {

  recordingPopup.style.display =
  "block";

}

};

recognition.onend = () => {

if (recordingPopup) {

  recordingPopup.style.display =
  "none";

}

};

recognition.onresult =
(event) => {

let transcript = "";

for (
  let i = 0;
  i < event.results.length;
  i++
) {

  transcript +=
  event.results[i][0]
  .transcript;

}

input.value =
transcript;

};

micBtn.addEventListener(
"click",
() => {

  try {

    recognition.start();

  } catch (err) {

    console.log(err);

  }

}

);

} else {

if (micBtn) {

micBtn.style.display =
"none";

}

}

attachBtn.addEventListener(
"click",
() => {

imageInput.click();

}
);

imageInput.addEventListener(
"change",
() => {

const file =
imageInput.files[0];

if (!file) return;

const reader =
new FileReader();

reader.onload = () => {

  selectedImage =
  reader.result;

  addMessage(
    "📷 Image Selected: " +
    file.name,
    "user"
  );

};

reader.readAsDataURL(
  file
);

}
);

const clearBtn =
document.getElementById(
"clearBtn"
);

clearBtn.addEventListener(
"click",
() => {

localStorage.removeItem(
  "hurairah_chat"
);

messages = [];

chatBox.innerHTML = "";

alert("Chat Deleted");

location.reload();

}
);
