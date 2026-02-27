document.addEventListener('DOMContentLoaded', () => {

    // ============================================
    // 1. Speech to Text (Web Speech API)
    // ============================================
    const startSttBtn = document.getElementById('start-stt-btn');
    const sttOutput = document.getElementById('stt-output');
    const recordingIndicator = document.getElementById('recording-indicator');

    let recognition;
    let isRecording = false;

    // Check for browser support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            isRecording = true;
            startSttBtn.innerHTML = '⏹ Stop Recording';
            startSttBtn.classList.replace('primary-btn', 'secondary-btn');
            startSttBtn.setAttribute('aria-label', 'Stop recording');
            recordingIndicator.classList.remove('hidden');
        };

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            sttOutput.value = transcript;
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            stopRecording();
        };

        recognition.onend = () => {
            if (isRecording) {
                // Auto-stop or keep stopped depending on intent
                stopRecording();
            }
        };
    } else {
        startSttBtn.disabled = true;
        startSttBtn.textContent = 'Not Supported';
        sttOutput.value = 'Your browser does not support Speech Recognition.';
    }

    function stopRecording() {
        isRecording = false;
        if (recognition) recognition.stop();
        startSttBtn.innerHTML = '🎤 Start Recording';
        startSttBtn.classList.replace('secondary-btn', 'primary-btn');
        startSttBtn.setAttribute('aria-label', 'Start recording speech');
        recordingIndicator.classList.add('hidden');
    }

    startSttBtn.addEventListener('click', () => {
        if (!isRecording) {
            sttOutput.value = '';
            recognition.start();
        } else {
            stopRecording();
        }
    });

    // ============================================
    // 2. Text to Speech (speechSynthesis API)
    // ============================================
    const ttsInput = document.getElementById('tts-input');
    const voiceSelect = document.getElementById('voice-select');
    const speakBtn = document.getElementById('speak-btn');
    let voices = [];

    function populateVoiceList() {
        voices = window.speechSynthesis.getVoices();
        voiceSelect.innerHTML = '';
        voices.forEach((voice) => {
            const option = document.createElement('option');
            option.textContent = `${voice.name} (${voice.lang})`;
            if (voice.default) {
                option.textContent += ' -- DEFAULT';
            }
            option.setAttribute('data-lang', voice.lang);
            option.setAttribute('data-name', voice.name);
            voiceSelect.appendChild(option);
        });
    }

    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }

    speakBtn.addEventListener('click', () => {
        if (ttsInput.value.trim() !== '') {
            const utterThis = new SpeechSynthesisUtterance(ttsInput.value);
            if (voiceSelect.selectedOptions[0]) {
                const selectedOption = voiceSelect.selectedOptions[0].getAttribute('data-name');
                for (let i = 0; i < voices.length; i++) {
                    if (voices[i].name === selectedOption) {
                        utterThis.voice = voices[i];
                        break;
                    }
                }
            }
            window.speechSynthesis.speak(utterThis);
        }
    });

    // ============================================
    // 3. AI Smart Reply Chat (Fetch API)
    // ============================================
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    function addMessageToChat(text, sender, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-bubble', sender);
        if (isError) messageDiv.classList.add('error');
        messageDiv.textContent = text;
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll to bottom
        return messageDiv;
    }

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Display user message in chat
        addMessageToChat(message, 'user');
        chatInput.value = '';

        // Display loading animation mapping to 'loading'
        const loadingDiv = addMessageToChat('AI is typing...', 'loading');

        try {
            const response = await fetch('http://127.0.0.1:5000/api/generate-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            // Remove loading indicator
            chatWindow.removeChild(loadingDiv);

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            // Checking both common key structures, falling back
            const replyText = data.reply || data.response || "Received an empty reply from AI.";
            addMessageToChat(replyText, 'ai');

        } catch (error) {
            // Remove loading indicator if not already removed (failsafe)
            if (chatWindow.contains(loadingDiv)) {
                chatWindow.removeChild(loadingDiv);
            }

            // Graceful error handling
            addMessageToChat(
                "Connection Error: Unable to reach the backend AI. Please make sure your server is running at http://127.0.0.1:5000.",
                'ai',
                true
            );
            console.error('Fetch error:', error);
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // ============================================
    // 4. Gesture Recognition Placeholder
    // ============================================
    // ============================================
    // Real Camera System
    // ============================================

    const startCameraBtn = document.getElementById('start-camera-btn');
    const video = document.getElementById('video');
    const cameraPlaceholderText = document.getElementById('camera-placeholder-text');
    const cameraPlaceholder = document.getElementById('camera-placeholder');

    let stream = null;
    let isCameraOn = false;

    startCameraBtn.addEventListener('click', async () => {

        if (!isCameraOn) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });

                video.srcObject = stream;
                video.style.display = 'block';
                cameraPlaceholderText.style.display = 'none';
                cameraPlaceholder.style.borderStyle = 'none';
                cameraPlaceholder.style.padding = '0';
                video.play();

                startCameraBtn.textContent = '⏹ Stop Camera';
                startCameraBtn.style.backgroundColor = 'var(--error-color)';
                isCameraOn = true;

                console.log("Camera started successfully");

            } catch (error) {
                console.error("Camera Error:", error);
                alert("Camera access denied or not available");
            }

        } else {

            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            video.srcObject = null;
            video.style.display = 'none';
            cameraPlaceholderText.style.display = 'block';
            cameraPlaceholder.style.borderStyle = 'dashed';
            cameraPlaceholder.style.padding = '20px';

            startCameraBtn.textContent = '📷 Start Camera';
            startCameraBtn.style.backgroundColor = 'var(--secondary-color)';
            isCameraOn = false;

            console.log("Camera stopped");
        }

    });
});