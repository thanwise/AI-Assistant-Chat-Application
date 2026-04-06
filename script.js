document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const messagesContainer = document.getElementById('messages');
    const welcomeState = document.getElementById('welcome-state');
    const chatContainer = document.getElementById('chat-container');

    let chatHistory = [];
    let isGenerating = false;

    // Handle button state
    messageInput.addEventListener('input', function() {
        if (this.value.trim().length > 0 && !isGenerating) {
            sendBtn.classList.add('active');
        } else {
            sendBtn.classList.remove('active');
        }
        
        // Auto-resize textarea
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });

    // Handle Enter key
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn.addEventListener('click', () => {
        if (sendBtn.classList.contains('active') && !isGenerating) {
            sendMessage();
        }
    });

    // Click on suggestion cards
    document.querySelectorAll('.suggestion-card').forEach(card => {
        card.addEventListener('click', function() {
            if (isGenerating) return;
            const text = this.querySelector('p').innerText;
            messageInput.value = text;
            sendBtn.classList.add('active');
            sendMessage();
        });
    });

    // Clean out chat state if clicking New Chat
    document.querySelector('.new-chat-btn').addEventListener('click', () => {
        if (isGenerating) return;
        chatHistory = [];
        messagesContainer.innerHTML = '';
        welcomeState.style.display = 'flex';
    });

    async function sendMessage() {
        if (isGenerating) return;
        
        const text = messageInput.value.trim();
        if (!text) return;

        // Hide welcome state if it's visible
        if (welcomeState && welcomeState.style.display !== 'none') {
            welcomeState.style.display = 'none';
        }

        // Add user message
        addMessage(text, 'user');
        chatHistory.push({ role: 'user', content: text });

        // Clear input and reset height
        messageInput.value = '';
        messageInput.style.height = 'auto';
        sendBtn.classList.remove('active');
        
        isGenerating = true;
        messageInput.disabled = true;

        // Scroll to bottom
        scrollToBottom();

        // Create AI message container indicating typing state
        const { messageTextElement, wrapper } = createEmptyAIMessage();
        
        try {
            if (window.location.protocol === 'file:') {
                throw new Error("You are opening the HTML file directly instead of using the Python server! Please open your browser and go to http://127.0.0.1:5000 to use the chat.");
            }

            // Setup fetch request to Flask backend proxy
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama3.1:latest',
                    messages: chatHistory,
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok. Ensure Ollama is running and has CORS enabled.');
            }

            // Stream response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiFullResponse = '';
            let indicatorRemoved = false;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                // Clean up multiple JSON objects that may come in a single chunk via newline separation
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    try {
                        const parsed = JSON.parse(line);
                        if (parsed.message && parsed.message.content) {
                            if (!indicatorRemoved) {
                                messageTextElement.innerHTML = ''; // Remove typing indicator bubbles
                                indicatorRemoved = true;
                            }
                            aiFullResponse += parsed.message.content;
                            
                            // Use marked.js if available to parse Markdown format streamed from local LLM
                            if (typeof marked !== 'undefined') {
                                messageTextElement.innerHTML = marked.parse(aiFullResponse);
                            } else {
                                messageTextElement.innerText = aiFullResponse;
                            }
                            scrollToBottom();
                        }
                    } catch (e) {
                        console.error("Error parsing JSON chunk from local LLM stream", e);
                    }
                }
            }
            
            // Push complete ai response back to history to retain conversation context
            chatHistory.push({ role: 'assistant', content: aiFullResponse });

        } catch (error) {
            console.error('Error connecting to Ollama:', error);
            messageTextElement.innerHTML = `
                <div style="background: rgba(255, 107, 107, 0.1); border: 1px solid #ff6b6b; padding: 12px; border-radius: 8px;">
                    <p style="color: #ff6b6b; margin-bottom: 8px;"><strong>Connection Error</strong></p>
                    <p style="font-size: 14px; color: var(--text-primary); margin-bottom: 8px;">Could not connect to the local Ollama instance. Please ensure:</p>
                    <ul style="font-size: 14px; color: var(--text-secondary); margin-left: 20px;">
                        <li>Ollama is installed and running on this computer.</li>
                        <li>You have pulled the model using: <code>ollama run llama3.1:latest</code></li>
                    </ul>
                    <p style="font-size: 12px; color: #ff6b6b; margin-top: 8px;">Details: ${error.message}</p>
                </div>
            `;
        } finally {
            isGenerating = false;
            messageInput.disabled = false;
            messageInput.focus();
            if (messageInput.value.trim().length > 0) {
                sendBtn.classList.add('active');
            }
        }
    }

    function addMessage(text, sender) {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ${sender}`;
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const avatar = document.createElement('div');
        avatar.className = `avatar ${sender}`;
        avatar.innerHTML = sender === 'user' ? '<i class="fa-solid fa-user"></i>' : '<i class="fa-solid fa-wand-magic-sparkles"></i>';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
        if (sender === 'user') {
            const paragraphs = text.split('\n').filter(p => p.trim() !== '');
            paragraphs.forEach(p => {
                const para = document.createElement('p');
                para.innerText = p;
                messageText.appendChild(para);
            });
        }

        content.appendChild(avatar);
        content.appendChild(messageText);
        wrapper.appendChild(content);
        messagesContainer.appendChild(wrapper);

        scrollToBottom();
    }
    
    function createEmptyAIMessage() {
        const wrapper = document.createElement('div');
        wrapper.className = `message-wrapper ai`;
        
        const content = document.createElement('div');
        content.className = 'message-content';
        
        const avatar = document.createElement('div');
        avatar.className = `avatar ai`;
        avatar.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i>';
        
        const messageTextElement = document.createElement('div');
        messageTextElement.className = 'message-text';
        
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
        messageTextElement.appendChild(indicator);

        content.appendChild(avatar);
        content.appendChild(messageTextElement);
        wrapper.appendChild(content);
        messagesContainer.appendChild(wrapper);

        scrollToBottom();
        
        return { messageTextElement, wrapper };
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
});
