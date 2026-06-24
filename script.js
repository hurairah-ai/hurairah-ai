const WORKER_URL = "https://hurairah-ai.annu8857818.workers.dev";

// Global App State
let state = {
    user: localStorage.getItem("username") || "",
    mode: localStorage.getItem("hurairah_mode") === "true" ? "romantic" : "normal",
    currentChatId: null,
    base64Image: null,
    chats: JSON.parse(localStorage.getItem("chat_history")) || []
};

// DOM References
const normalApp = document.getElementById("normal-app");
const romanticApp = document.getElementById("romantic-app");
const chatMessages = document.getElementById("chat-messages");
const romanticMessages = document.getElementById("romantic-messages");
const userInput = document.getElementById("user-input");
const romanticInput = document.getElementById("romantic-input");
const rTyping = document.getElementById("romantic-typing");

// App Init
window.addEventListener("DOMContentLoaded", () => {
    if (!state.user) {
        document.getElementById("username-modal").classList.remove("hidden");
    } else {
        document.getElementById("user-display").innerHTML = `<i class="fa-solid fa-user"></i> ${state.user}`;
    }
    renderHistory();
    applyModeUI();
    setupEventListeners();
});

function applyModeUI() {
    if (state.mode === "romantic") {
        normalApp.classList.add("hidden");
        romanticApp.classList.remove("hidden");
        localStorage.setItem("hurairah_mode", "true");
    } else {
        romanticApp.classList.add("hidden");
        normalApp.classList.remove("hidden");
        localStorage.setItem("hurairah_mode", "false");
    }
}

// Event Listeners Setup
function setupEventListeners() {
    // Normal Send
    document.getElementById("send-btn").addEventListener("click", handleNormalSend);
    userInput.addEventListener("keydown", (e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleNormalSend(); } });

    // Romantic Send
    document.getElementById("romantic-send-btn").addEventListener("click", handleRomanticSend);
    romanticInput.addEventListener("keydown", (e) => { if(e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRomanticSend(); } });

    // Username Save
    document.getElementById("save-username-btn").addEventListener("click", () => {
        const name = document.getElementById("username-input").value.trim();
        if(name) {
            state.user = name;
            localStorage.setItem("username", name);
            document.getElementById("username-modal").classList.add("hidden");
            document.getElementById("user-display").innerHTML = `<i class="fa-solid fa-user"></i> ${name}`;
            saveChatLog("System", `User profile created: ${name}`);
        }
    });

    // Image Upload Handler
    document.getElementById("image-upload").addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                state.base64Image = evt.target.result;
                document.getElementById("image-preview").src = state.base64Image;
                document.getElementById("image-preview-container").classList.remove("hidden");
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById("remove-image-btn").addEventListener("click", () => {
        state.base64Image = null;
        document.getElementById("image-preview-container").classList.add("hidden");
        document.getElementById("image-upload").value = "";
    });

    // New Chat Setup
    document.getElementById("new-chat-btn").addEventListener("click", () => {
        state.currentChatId = Date.now().toString();
        chatMessages.innerHTML = '';
        document.getElementById("welcome-card").classList.remove("hidden");
    });

    // Mic Input (Speech to Text)
    const micBtn = document.getElementById("mic-btn");
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'hi-IN'; 
        
        micBtn.addEventListener("click", () => {
            micBtn.style.color = "#ef4444";
            recognition.start();
        });

        recognition.onresult = (event) => {
            const resultText = event.results[0][0].transcript;
            userInput.value = resultText;
            micBtn.style.color = "var(--text-muted)";
        };
        recognition.onerror = () => { micBtn.style.color = "var(--text-muted)"; };
        recognition.onend = () => { micBtn.style.color = "var(--text-muted)"; };
    } else {
        micBtn.style.display = "none";
    }

    // Sidebar Toggle Mobile
    document.getElementById("toggle-sidebar-btn").addEventListener("click", () => document.getElementById("sidebar").classList.add("open"));
    document.getElementById("close-sidebar-btn").addEventListener("click", () => document.getElementById("sidebar").classList.remove("open"));
}

// Logic: Process Normal Chat
async function handleNormalSend() {
    const text = userInput.value.trim();
    if (!text && !state.base64Image) return;

    // Check Trigger Commands
    const trigger = text.toLowerCase();
    if (trigger === "mehajabeen pgl hu" || trigger === "mehajabeen pgl") {
        state.mode = "romantic";
        userInput.value = "";
        applyModeUI();
        saveChatLog(state.user, text);
        return;
    }

    document.getElementById("welcome-card").classList.add("hidden");
    if(!state.currentChatId) state.currentChatId = Date.now().toString();

    // Render User Msg
    appendMessage("user", text, state.base64Image);
    userInput.value = "";
    saveChatLog(state.user, text);

    const imgToSend = state.base64Image;
    // Clear preview
    state.base64Image = null;
    document.getElementById("image-preview-container").classList.add("hidden");

    // Network Call to Worker
    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: text,
                mode: "normal",
                image: imgToSend,
                username: state.user
            })
        });
        const data = await response.json();
        appendMessage("ai", data.reply);
        saveChatLog("Hurairah AI (Normal)", data.reply);
    } catch (err) {
        appendMessage("ai", "Server processing error. Baad me try karein!");
    }
}

// Logic: Process Romantic Chat
async function handleRomanticSend() {
    const text = romanticInput.value.trim();
    if (!text) return;

    if (text.toLowerCase() === "normal mode" || text.toLowerCase() === "hurairah mode off") {
        state.mode = "normal";
        romanticInput.value = "";
        applyModeUI();
        saveChatLog("Mehajabeen", text);
        return;
    }

    appendRomanticMessage("user", text);
    romanticInput.value = "";
    rTyping.classList.remove("hidden");
    saveChatLog("Mehajabeen", text);

    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: text,
                mode: "romantic",
                username: "Mehajabeen"
            })
        });
        const data = await response.json();
        rTyping.classList.add("hidden");
        appendRomanticMessage("ai", data.reply);
        saveChatLog("Hurairah (Romantic)", data.reply);
    } catch (err) {
        rTyping.classList.add("hidden");
        appendRomanticMessage("ai", "Kuch dikkat aa gayi jaan... firse bolo ❤️");
    }
}

// UI Helpers
function appendMessage(sender, text, img = null) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("msg", sender === "user" ? "user-msg" : "ai-msg");
    
    if (img) {
        const imageElement = document.createElement("img");
        imageElement.src = img;
        imageElement.classList.add("msg-img");
        msgDiv.appendChild(imageElement);
    }
    
    if (text) {
        const textSpan = document.createElement("span");
        textSpan.innerText = text;
        msgDiv.appendChild(textSpan);
    }

    if (sender === "ai") {
        const spkBtn = document.createElement("button");
        spkBtn.classList.add("speak-btn");
        spkBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> Listen`;
        spkBtn.onclick = () => speakText(text);
        msgDiv.appendChild(spkBtn);
    }

    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendRomanticMessage(sender, text) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("r-msg", sender === "user" ? "r-user" : "r-ai");
    msgDiv.innerText = text;
    romanticMessages.appendChild(msgDiv);
    romanticMessages.scrollTop = romanticMessages.scrollHeight;
}

// Text to Speech Function
function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new高级SpeechSynthesisUtterance || new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN';
        window.speechSynthesis.speak(utterance);
    }
}

// Save Logs Functionality for Admin dashboard via localStorage
function saveChatLog(sender, text) {
    let globalLogs = JSON.parse(localStorage.getItem("admin_global_logs")) || [];
    globalLogs.push({
        id: Date.now().toString(),
        sender: sender,
        message: text,
        timestamp: new Date().toLocaleTimeString()
    });
    localStorage.setItem("admin_global_logs", JSON.stringify(globalLogs));
    
    // Update structural history sidebar
    if (sender !== "System" && state.mode === "normal") {
        if(!state.chats.includes(text.substring(0, 20))) {
            state.chats.push(text.substring(0, 20));
            localStorage.setItem("chat_history", JSON.stringify(state.chats));
            renderHistory();
        }
    }
}

function renderHistory() {
    const list = document.getElementById("history-list");
    list.innerHTML = "";
    state.chats.forEach(chatTitle => {
        const div = document.createElement("div");
        div.classList.add("history-item");
        div.innerHTML = `<i class="fa-solid fa-message"></i> ${chatTitle}...`;
        list.appendChild(div);
    });
}
