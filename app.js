// app.js - Main Application Logic (Web Speech, TTS, Chat, Gestures)
document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // 0. Navigation View Logic
    // ============================================
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const appSections = document.querySelectorAll('.app-section');
    const pageTitle = document.getElementById('current-page-title');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            appSections.forEach(section => section.classList.remove('active'));
            const targetId = item.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) targetSection.classList.add('active');
            if (pageTitle) {
                const label = item.querySelector('.nav-label');
                if (label) pageTitle.textContent = label.textContent;
            }
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (window.innerWidth <= 992 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            }
        });
    });

    // ============================================
    // 1. Speech to Text
    // ============================================
    const startSttBtn = document.getElementById('start-stt-btn');
    const sttLiveText = document.getElementById('stt-live-text');
    const recordingIndicator = document.getElementById('recording-indicator');
    const copySttBtn = document.getElementById('stt-copy-btn');
    const clearSttBtn = document.getElementById('stt-clear-btn');

    let recognition;
    let isRecording = false;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isRecording = true;
            startSttBtn?.classList.add('recording');
            startSttBtn?.setAttribute('aria-label', 'Stop recording');
            recordingIndicator?.classList.remove('hidden');
            if (sttLiveText?.querySelector('.placeholder-text')) sttLiveText.innerHTML = '';
        };

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            if (sttLiveText) sttLiveText.textContent = transcript;
            sttLiveText.scrollTop = sttLiveText.scrollHeight;
        };

        recognition.onerror = (event) => {
            console.error('STT error', event.error);
            if (sttLiveText) {
                sttLiveText.innerHTML = '<span class="placeholder-text error-color">Microphone error or permission blocked.</span>';
            }
            stopRecording();
        };
        recognition.onend = () => { if (isRecording) stopRecording(); };
    } else {
        startSttBtn.disabled = true;
        startSttBtn.innerHTML = '<i class="fas fa-times"></i>';
        sttLiveText.innerHTML = '<span class="placeholder-text error-color">Speech Recognition not supported.</span>';
    }

    function stopRecording() {
        isRecording = false;
        recognition?.stop();
        startSttBtn?.classList.remove('recording');
        startSttBtn?.setAttribute('aria-label', 'Start recording speech');
        recordingIndicator?.classList.add('hidden');
    }

    startSttBtn?.addEventListener('click', () => {
        if (!isRecording) recognition?.start();
        else stopRecording();
    });

    clearSttBtn?.addEventListener('click', () => {
        sttLiveText.innerHTML = '<span class="placeholder-text">Transcribed text will appear here...</span>';
    });

    copySttBtn?.addEventListener('click', async () => {
        const textToCopy = sttLiveText.textContent.replace('Transcribed text will appear here...', '').trim();
        if (!textToCopy) return;
        try { await navigator.clipboard.writeText(textToCopy); } catch (err) { console.error(err); }
    });

    // ============================================
    // 2. Text to Speech
    // ============================================
    const ttsInput = document.getElementById('tts-input');
    const voiceSelect = document.getElementById('voice-select');
    const speakBtn = document.getElementById('speak-btn');
    const stopTtsBtn = document.getElementById('stop-tts-btn');
    let voices = [];

    function populateVoiceList() {
        voices = window.speechSynthesis.getVoices();
        voiceSelect.innerHTML = '';
        voices.forEach(v => {
            const opt = document.createElement('option');
            opt.textContent = `${v.name} (${v.lang})${v.default ? ' -- DEFAULT' : ''}`;
            opt.setAttribute('data-name', v.name);
            voiceSelect.appendChild(opt);
        });
    }
    populateVoiceList();
    speechSynthesis.onvoiceschanged = populateVoiceList;

    speakBtn?.addEventListener('click', () => {
        window.speechSynthesis.cancel();
        if (!ttsInput.value.trim()) return;
        const utter = new SpeechSynthesisUtterance(ttsInput.value);
        const selected = voiceSelect.selectedOptions[0]?.getAttribute('data-name');
        if (selected) utter.voice = voices.find(v => v.name === selected);
        window.speechSynthesis.speak(utter);
    });
    stopTtsBtn?.addEventListener('click', () => window.speechSynthesis.cancel());

    // ============================================
    // 3. AI Smart Reply Chat
    // ============================================
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    function addMessageToChat(text, sender, isError = false) {
        if (!chatWindow) return;
        const wrapper = document.createElement('div');
        wrapper.classList.add('message-wrapper', sender === 'user' ? 'user-wrapper' : 'ai-wrapper');
        const bubble = document.createElement('div');
        bubble.classList.add('message-bubble', sender === 'user' ? 'user-bubble' : 'ai-bubble');
        if (isError) bubble.classList.add('error-bubble');
        bubble.textContent = text;
        const time = document.createElement('span');
        time.classList.add('message-time');
        time.textContent = 'Now';
        bubble.appendChild(time);
        wrapper.appendChild(bubble);
        chatWindow.appendChild(wrapper);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    async function sendMessage() {
        if (!chatInput?.value.trim()) return;
        const message = chatInput.value.trim();
        addMessageToChat(message, 'user');
        chatInput.value = '';
        const typingWrapper = document.createElement('div');
        typingWrapper.classList.add('message-wrapper', 'ai-wrapper');
        const typing = document.createElement('div');
        typing.classList.add('typing-indicator');
        typing.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
        typingWrapper.appendChild(typing);
        chatWindow.appendChild(typingWrapper);

        try {
            const res = await fetch('/api/generate-response', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ message })
            });
            if (!res.ok) throw new Error(res.status);
            const data = await res.json();
            typingWrapper.remove();
            addMessageToChat(data.reply || 'Empty reply', 'ai');
        } catch (err) {
            typingWrapper.remove();
            addMessageToChat('Connection Error: Unable to reach backend AI.', 'ai', true);
            console.error(err);
        }
    }

    sendBtn?.addEventListener('click', sendMessage);
    chatInput?.addEventListener('keypress', e => { if (e.key==='Enter') sendMessage(); });

    // ============================================
    // 4. Gesture Recognition (MediaPipe Hands)
    // ============================================
    const startCameraBtn = document.getElementById('start-camera-btn');
    const video = document.getElementById('video');
    let cameraOn = false;

    if (startCameraBtn && video) {
        const hands = new Hands({locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
        hands.setOptions({ maxNumHands:1, modelComplexity:1, minDetectionConfidence:0.7, minTrackingConfidence:0.5 });

        hands.onResults(results => {
            if (results.multiHandLandmarks?.length) {
                const landmarks = results.multiHandLandmarks[0];
                // TODO: Map landmarks → ASL letters here
                sttLiveText.textContent = `Hand detected: ${landmarks.length} points`;
            } else {
                sttLiveText.textContent = '';
            }
        });

        const camera = new Camera(video, {
            onFrame: async () => await hands.send({image: video}),
            width: 640, height: 480
        });

        startCameraBtn.addEventListener('click', () => {
            if (!cameraOn) {
                camera.start();
                video.style.display = 'block';
                const placeholderText = document.getElementById('camera-placeholder-text');
                if (placeholderText) placeholderText.textContent = 'Camera running...';
                startCameraBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Camera';
            } else {
                camera.stop();
                video.style.display = 'none';
                const placeholderText = document.getElementById('camera-placeholder-text');
                if (placeholderText) placeholderText.textContent = 'Camera feed will appear here.';
                startCameraBtn.innerHTML = '<i class="fas fa-camera"></i> Start Camera';
                sttLiveText.textContent = '';
            }
            cameraOn = !cameraOn;
        });
    }
});
