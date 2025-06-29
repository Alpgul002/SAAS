(function() {
  'use strict';
  
  // Check if widget is already loaded
  if (window.ChatbotWidget) {
    return;
  }
  
  // Get configuration
  const config = window.ChatbotConfig || {};
  const apiKey = config.apiKey;
  const webhookUrl = config.webhookUrl;
  const theme = config.theme || {};
  
  if (!apiKey || !webhookUrl) {
    console.error('ChatBot Widget: Missing apiKey or webhookUrl');
    return;
  }
  
  // Widget state
  let isOpen = false;
  let messages = [];
  
  // Create widget elements
  function createWidget() {
    // Widget button
    const button = document.createElement('button');
    button.id = 'chatbot-button';
    button.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
        <path d="M7 9H17V11H7V9ZM7 12H13V14H7V12Z" fill="currentColor"/>
      </svg>
    `;
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: none;
      background-color: ${theme.primaryColor || '#3B82F6'};
      color: white;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    `;
    
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });
    
    button.addEventListener('click', toggleWidget);
    
    // Widget window
    const widget = document.createElement('div');
    widget.id = 'chatbot-widget';
    widget.style.cssText = `
      position: fixed;
      bottom: 90px;
      right: 20px;
      width: 350px;
      height: 500px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 5px 25px rgba(0, 0, 0, 0.15);
      z-index: 1001;
      display: none;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    widget.innerHTML = `
      <div style="background: ${theme.primaryColor || '#3B82F6'}; color: white; padding: 15px; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0; font-size: 16px;">Chat Support</h3>
        <button id="chatbot-close" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0;">×</button>
      </div>
      <div id="chatbot-messages" style="flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;"></div>
      <div style="padding: 15px; border-top: 1px solid #eee;">
        <div style="display: flex; gap: 10px;">
          <input id="chatbot-input" type="text" placeholder="Type your message..." style="flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; outline: none;" />
          <button id="chatbot-send" style="background: ${theme.primaryColor || '#3B82F6'}; color: white; border: none; padding: 10px 15px; border-radius: 20px; cursor: pointer;">Send</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(button);
    document.body.appendChild(widget);
    
    // Event listeners
    document.getElementById('chatbot-close').addEventListener('click', toggleWidget);
    document.getElementById('chatbot-send').addEventListener('click', sendMessage);
    document.getElementById('chatbot-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
  
  // Toggle widget visibility
  function toggleWidget() {
    const widget = document.getElementById('chatbot-widget');
    const button = document.getElementById('chatbot-button');
    
    if (isOpen) {
      widget.style.display = 'none';
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
          <path d="M7 9H17V11H7V9ZM7 12H13V14H7V12Z" fill="currentColor"/>
        </svg>
      `;
    } else {
      widget.style.display = 'flex';
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
        </svg>
      `;
      document.getElementById('chatbot-input').focus();
    }
    
    isOpen = !isOpen;
  }
  
  // Add message to chat
  function addMessage(text, isUser = false) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    
    messageDiv.style.cssText = `
      display: flex;
      justify-content: ${isUser ? 'flex-end' : 'flex-start'};
      margin-bottom: 10px;
    `;
    
    const messageBubble = document.createElement('div');
    messageBubble.style.cssText = `
      max-width: 80%;
      padding: 10px 15px;
      border-radius: 18px;
      background-color: ${isUser ? (theme.primaryColor || '#3B82F6') : '#f1f5f9'};
      color: ${isUser ? 'white' : '#374151'};
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
    `;
    
    messageBubble.textContent = text;
    messageDiv.appendChild(messageBubble);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Send message to backend
  async function sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessage(message, true);
    input.value = '';
    
    // Show typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div style="display: flex; justify-content: flex-start; margin-bottom: 10px;">
        <div style="max-width: 80%; padding: 10px 15px; border-radius: 18px; background-color: #f1f5f9; color: #374151; font-size: 14px;">
          <div style="display: flex; gap: 4px;">
            <div style="width: 8px; height: 8px; background-color: #9ca3af; border-radius: 50%; animation: typing 1.4s infinite ease-in-out;"></div>
            <div style="width: 8px; height: 8px; background-color: #9ca3af; border-radius: 50%; animation: typing 1.4s infinite ease-in-out 0.2s;"></div>
            <div style="width: 8px; height: 8px; background-color: #9ca3af; border-radius: 50%; animation: typing 1.4s infinite ease-in-out 0.4s;"></div>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('chatbot-messages').appendChild(typingDiv);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify({ message })
      });
      
      const data = await response.json();
      
      // Remove typing indicator
      const typingIndicator = document.getElementById('typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
      
      // Add bot response
      if (data.reply) {
        addMessage(data.reply, false);
      } else {
        addMessage('Sorry, I could not process your request.', false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove typing indicator
      const typingIndicator = document.getElementById('typing-indicator');
      if (typingIndicator) {
        typingIndicator.remove();
      }
      
      addMessage('Sorry, there was an error processing your message. Please try again.', false);
    }
  }
  
  // Add CSS animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
      }
      30% {
        transform: translateY(-10px);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Initialize widget
  createWidget();
  
  // Add welcome message
  setTimeout(() => {
    addMessage('Hello! How can I help you today?', false);
  }, 500);
  
  // Expose widget globally
  window.ChatbotWidget = {
    toggle: toggleWidget,
    sendMessage: sendMessage,
    addMessage: addMessage
  };
})(); 