/ app.js - Main Application Logic (Web Speech, TTS, Chat, Gestures)

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

            // Remove active from all nav items
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            // Add active to clicked item
            item.classList.add('active');

            // Hide all sections
            appSections.forEach(section => section.classList.remove('active'));

            // Show target section
            const targetId = item.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Update Header Title
            if (pageTitle) {
                const label = item.querySelector('.nav-label');
                if (label) {
                    pageTitle.textContent = label.textContent;
                }
            }

            // Close mobile menu if open
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            if (window.innerWidth <= 992 && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                overlay.classList.remove('active');
            }
        });
    });

    // ============================================
    // 1. Speech to Text (Web Speech API)
    // ============================================
    const startSttBtn = document.getElementById('start-stt-btn');
    const sttLiveText = document.getElementById('stt-live-text');
    const recordingIndicator = document.getElementById('recording-indicator');
    const copySttBtn = document.getElementById('stt-copy-btn');
    const clearSttBtn = document.getElementById('stt-clear-btn');

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
            if (startSttBtn) {
                startSttBtn.classList.add('recording');
                startSttBtn.setAttribute('aria-label', 'Stop recording');
            }
            if (recordingIndicator) recordingIndicator.classList.remove('hidden');

            // Clear placeholder text if first time
            if (sttLiveText && sttLiveText.querySelector('.placeholder-text')) {
                sttLiveText.innerHTML = '';
            }
        };

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            if (sttLiveText) {
                // If it was placeholder, replace. Otherwise append visually
                if (sttLiveText.querySelector('.placeholder-text')) {
                    sttLiveText.textContent = transcript;
                } else {
                    sttLiveText.textContent = transcript;
                }
                // Scroll to bottom
                sttLiveText.scrollTop = sttLiveText.scrollHeight;
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            stopRecording();
        };

        recognition.onend = () => {
            if (isRecording) {
                // Restart logic could be placed here if it dies unexpectedly
                stopRecording();
            }
        };
    } else {
        if (startSttBtn) {
            startSttBtn.disabled = true;
            startSttBtn.innerHTML = '<div class="mic-icon-wrapper"><i class="fas fa-times"></i></div>';
            startSttBtn.title = "Not Supported";
        }
        if (sttLiveText) sttLiveText.innerHTML = '<span class="placeholder-text error-color">Your browser does not support Speech Recognition.</span>';
    }

    function stopRecording() {
        isRecording = false;
        if (recognition) recognition.stop();
        if (startSttBtn) {
            startSttBtn.classList.remove('recording');
            startSttBtn.setAttribute('aria-label', 'Start recording speech');
        }
        if (recordingIndicator) recordingIndicator.classList.add('hidden');
    }

    if (startSttBtn) {
        startSttBtn.addEventListener('click', () => {
            if (!isRecording) {
                // Start tracking
                recognition.start();
            } else {
                stopRecording();
            }
        });
    }

    if (clearSttBtn && sttLiveText) {
        clearSttBtn.addEventListener('click', () => {
            sttLiveText.innerHTML = '<span class="placeholder-text">Transcribed text will appear here automatically as people speak...</span>';
        });
    }

    if (copySttBtn && sttLiveText) {
        copySttBtn.addEventListener('click', async () => {
            const textToCopy = sttLiveText.textContent.replace('Transcribed text will appear here automatically as people speak...', '').trim();
            if (!textToCopy) return;

            try {
                await navigator.clipboard.writeText(textToCopy);

                // Visual feedback
                const icon = copySttBtn.querySelector('i');
                icon.classList.remove('fa-copy', 'far');
                icon.classList.add('fa-check', 'fas');
                copySttBtn.style.color = 'var(--secondary-color)';

                setTimeout(() => {
                    icon.classList.remove('fa-check', 'fas');
                    icon.classList.add('fa-copy', 'far');
                    copySttBtn.style.color = '';
                }, 2000);
            } catch (err) {
                console.error("Failed to copy", err);
            }
        });
    }

    // ============================================
    // 2. Text to Speech (speechSynthesis API)
    // ============================================
    const ttsInput = document.getElementById('tts-input');
    const voiceSelect = document.getElementById('voice-select');
    const speakBtn = document.getElementById('speak-btn');
    const stopTtsBtn = document.getElementById('stop-tts-btn');
    let voices = [];

    function populateVoiceList() {
        if (!voiceSelect) return;
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

    if (speakBtn && ttsInput) {
        speakBtn.addEventListener('click', () => {
            // Cancel any ongoing speech before starting a new one
            window.speechSynthesis.cancel();

            if (ttsInput.value.trim() !== '') {
                const utterThis = new SpeechSynthesisUtterance(ttsInput.value);

                // Visual feedback that we are speaking
                speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Speaking...';
                speakBtn.classList.add('pulse-glow');

                utterThis.onend = () => {
                    speakBtn.innerHTML = '<i class="fas fa-play"></i> Speak Aloud';
                    speakBtn.classList.remove('pulse-glow');
                };

                utterThis.onerror = () => {
                    speakBtn.innerHTML = '<i class="fas fa-play"></i> Speak Aloud';
                    speakBtn.classList.remove('pulse-glow');
                };

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
    }

    if (stopTtsBtn) {
        stopTtsBtn.addEventListener('click', () => {
            window.speechSynthesis.cancel();
            if (speakBtn) {
                speakBtn.innerHTML = '<i class="fas fa-play"></i> Speak Aloud';
                speakBtn.classList.remove('pulse-glow');
            }
        });
    }

    // ============================================
    // 3. AI Smart Reply Chat (Fetch API)
    // ============================================
    const chatWindow = document.getElementById('chat-window');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    function addMessageToChat(text, sender, isError = false) {
        if (!chatWindow) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-bubble', sender);
        if (isError) messageDiv.classList.add('error');
        messageDiv.textContent = text;
        chatWindow.appendChild(messageDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll to bottom
        return messageDiv;
    }

    async function sendMessage() {
        if (!chatInput) return;
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

            if (chatWindow && loadingDiv && chatWindow.contains(loadingDiv)) {
                chatWindow.removeChild(loadingDiv);
            }

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            const replyText = data.reply || data.response || "Received an empty reply from AI.";
            addMessageToChat(replyText, 'ai');

        } catch (error) {
            if (chatWindow && loadingDiv && chatWindow.contains(loadingDiv)) {
                chatWindow.removeChild(loadingDiv);
            }

            // Graceful error handling
            addMessageToChat(
                "Connection Error: Unable to reach the backend AI. Please make sure your server is running.",
                'ai',
                true
            );
            console.error('Fetch error:', error);
        }
    }

    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // ============================================
    // 4. Gesture Recognition Placeholder
    // ============================================
    const startCameraBtn = document.getElementById('start-camera-btn');
    const video = document.getElementById('video');
    const cameraPlaceholderText = document.getElementById('camera-placeholder-text');
    const cameraPlaceholder = document.getElementById('camera-placeholder');

    let stream = null;
    let isCameraOn = false;

    if (startCameraBtn && video && cameraPlaceholder) {
        startCameraBtn.addEventListener('click', async () => {
            if (!isCameraOn) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    video.srcObject = stream;
                    video.style.display = 'block';
                    if (cameraPlaceholderText) cameraPlaceholderText.style.display = 'none';
                    cameraPlaceholder.style.borderStyle = 'none';
                    cameraPlaceholder.style.padding = '0';
                    video.play();

                    startCameraBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Camera Feed';
                    startCameraBtn.classList.replace('secondary-btn', 'danger-btn');
                    isCameraOn = true;
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
                if (cameraPlaceholderText) cameraPlaceholderText.style.display = 'block';
                cameraPlaceholder.style.borderStyle = 'dashed';
                cameraPlaceholder.style.padding = '20px';

                startCameraBtn.innerHTML = '<i class="fas fa-camera"></i> Start Camera Feed';
                startCameraBtn.classList.replace('danger-btn', 'secondary-btn');
                isCameraOn = false;
            }
        });
    }
}); 