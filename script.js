const API_URL = "https://hurairah-ai.annu8857818.workers.dev";

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");

function removeWelcomeScreen() {
  const welcome = document.querySelector(".welcome-screen");
  if (welcome) {
    welcome.remove();
  }
}

function addMessage(text, type) {
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

  removeWelcomeScreen();

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
      data.reply || "Koi response nahi mila",
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

sendBtn.addEventListener("click", sendMessage);

input.addEventListener("keydown", (e) => {

  if (e.key === "Enter" && !e.shiftKey) {

    e.preventDefault();
    sendMessage();

  }

});

// ===== Voice Input =====

const SpeechRecognition =
window.SpeechRecognition ||
window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn) {

  const recognition = new SpeechRecognition();

  recognition.lang = "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;
recognition.onresult = async (event) => {

  let text =
    event.results[0][0].transcript;

  if(/[ऀ-ॿ]/.test(text)){

    try{

      const res = await fetch(API_URL,{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          message:
          "Convert this Hindi text into Hinglish only. Do not explain anything. Text: " + text
        })
      });

      const data = await res.json();

      input.value =
        data.reply || text;

    }catch{

      input.value = text;

    }

  }else{

    input.value = text;

  }

};

  micBtn.addEventListener("click", () => {

    try {
      recognition.start();
    } catch(err) {
      console.log(err);
    }

  });

} else {

  console.log("Speech Recognition Not Supported");

  if (micBtn) {
    micBtn.style.display = "none";
  }

}
