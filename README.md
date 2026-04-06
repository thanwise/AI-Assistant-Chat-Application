# AI Assistant Chat Application

A modern, ChatGPT-like web interface for interacting with local AI models via Ollama. Features a sleek design, real-time streaming responses, and an agentic backend with tool integration capabilities.

## 📋 Features

- **Modern Chat Interface** - Clean, responsive design inspired by ChatGPT
- **Real-time Streaming** - Responses stream in real-time as they're generated
- **Chat History** - Organized chat history with sections (Today, Previous 7 Days)
- **Suggestion Cards** - Quick-start prompts to help users get started
- **Markdown Support** - Full markdown rendering for formatted responses
- **Agent Tools** - Backend integration with Ollama tool calling
  - Current time retrieval
  - Mathematical calculations
  - Extensible tool framework for adding more capabilities
- **Responsive Design** - Mobile-friendly layout with collapsible sidebar
- **Dark/Light Theme Ready** - CSS variables for easy theme customization
- **Typing Indicators** - Visual feedback while waiting for responses

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Python Flask
- **AI Model**: Ollama (llama3.1:latest)
- **Styling**: Custom CSS with CSS variables
- **Icons**: Font Awesome 6.4.0
- **Markdown Rendering**: marked.js
- **Fonts**: Google Fonts (Inter)

## 📦 Project Structure

```
├── index.html        # Main HTML structure
├── style.css         # Styling and layout
├── script.js         # Frontend logic and chat functionality
├── app.py            # Flask backend server
├── logo.png          # Application logo
└── README.md         # This file
```

## 🚀 Getting Started

### Prerequisites

- **Python 3.7+** installed
- **Ollama** installed and running ([Download Ollama](https://ollama.ai))
- **pip** (Python package manager)

### Installation

1. **Clone or download this project** to your local machine

2. **Install Python dependencies**:
   ```bash
   pip install flask requests
   ```

3. **Download an Ollama model** (if not already done):
   ```bash
   ollama pull llama3.1:latest
   ```

   Make sure Ollama is running:
   ```bash
   ollama serve
   ```

4. **Start the Flask server**:
   ```bash
   python app.py
   ```

5. **Open your browser** and navigate to:
   ```
   http://127.0.0.1:5000
   ```

## 🎯 Usage

### Sending Messages

1. Type your message in the input box at the bottom
2. Press **Enter** or click the send button (plane icon)
3. Watch as the AI streams its response in real-time

### Using Suggestion Cards

Click any of the suggestion cards on the welcome screen to quickly populate the input with pre-written prompts:
- Write an HTML template for a chat interface
- Brainstorm names for a new tech startup
- Translate a business email to Spanish
- Summarize the latest trends in AI

### Starting a New Chat

Click the **"+ New Chat"** button in the sidebar to clear the chat history and start fresh.

### Agent Tools

The backend can automatically use tools when needed:
- **`get_current_time`** - Retrieves the current date and time
- **`calculate`** - Evaluates mathematical expressions

The AI will use these tools automatically when appropriate and show notifications in the chat.

## 🔧 Configuration

### Changing the AI Model

Edit `app.py` line 73 to use a different Ollama model:
```python
model = data.get('model', 'llama2:latest')  # Change to your desired model
```

Available models can be listed with: `ollama list`

### Customizing Theme

Edit the CSS variables in `style.css`:
```css
:root {
    --bg-main: #ffffff;
    --bg-sidebar: #f7f7f8;
    --text-primary: #0d0d0d;
    --text-secondary: #8e8ea0;
    --accent-color: #10a37f;
    --accent-hover: #1a7f64;
    --surface: #f4f4f4;
    --surface-hover: #ececec;
    --border: #e5e5e5;
}
```

### Adding New Agent Tools

1. **Define the tool function** in `app.py`:
   ```python
   def my_new_tool(param1, param2):
       """Tool description"""
       return result
   ```

2. **Add to AVAILABLE_TOOLS dictionary**:
   ```python
   AVAILABLE_TOOLS = {
       "my_new_tool": my_new_tool,
       ...
   }
   ```

3. **Add to TOOL_DEFINITIONS**:
   ```python
   {
       "type": "function",
       "function": {
           "name": "my_new_tool",
           "description": "What this tool does",
           "parameters": {
               "type": "object",
               "properties": {
                   "param1": {"type": "string", "description": "..."},
                   "param2": {"type": "string", "description": "..."}
               },
               "required": ["param1", "param2"]
           }
       }
   }
   ```

## 🐛 Troubleshooting

### "Connection Error - Could not connect to Ollama"

- **Ensure Ollama is running**: Open a terminal and run `ollama serve`
- **Check model is pulled**: Run `ollama run llama3.1:latest`
- **Verify localhost access**: Open `http://localhost:11434/api/tags` in your browser

### "You are opening the HTML file directly"

- Do **not** open `index.html` directly in your browser
- Always use the Flask server: `http://127.0.0.1:5000`

### Slow responses

- Check Ollama is using GPU (see Ollama documentation)
- Consider using a smaller model: `ollama pull mistral:latest`

### CORS errors

- Ensure Ollama is properly configured to accept connections
- The Flask backend acts as a proxy to avoid CORS issues

## 📱 Responsive Design

The application is fully responsive:
- **Desktop**: Full sidebar + main chat area
- **Tablet**: Adjusted layout with collapsible sidebar
- **Mobile**: Single-column layout with hidden sidebar toggle

## 🎨 Customization Tips

### Change the Logo
Replace `logo.png` with your own image (recommended: 64x64px)

### Modify Welcome Greeting
Edit the `<h1>` tag in `index.html`:
```html
<h1>How can I help you today?</h1>
```

### Update Suggestion Cards
Edit the suggestion card content in `index.html` (lines ~55-68)

### Adjust Input Area
Modify styling in `style.css` under `.input-container` and related classes

## 🔒 Security Notes

- The `calculate` tool uses a restricted eval environment
- Never expose this application to untrusted networks without authentication
- The Flask server runs in debug mode by default - disable for production:
  ```python
  app.run(debug=False, port=5000)
  ```

## 📄 File Descriptions

### index.html
Main HTML structure with semantic markup, featuring:
- Sidebar with chat history
- Main chat container with welcome state
- Message display area with markdown support
- Input area with action buttons

### style.css
Complete styling system with:
- CSS variables for theming
- Flexbox/Grid layouts
- Animations and transitions
- Responsive media queries
- Markdown element styling

### script.js
Frontend JavaScript handling:
- Message sending and receiving
- Textarea auto-resize
- Real-time response streaming
- DOM manipulation
- Event listeners for user interactions
- Markdown parsing with marked.js

### app.py
Flask backend server providing:
- Static file serving
- `/api/chat` endpoint for streaming responses
- Ollama API integration
- Agent tool execution framework
- Tool calling loop (max 5 iterations)

## 🚀 Deployment

For production deployment:

1. **Disable Flask debug mode** in `app.py`
2. **Use a production WSGI server** (Gunicorn, uWSGI)
3. **Set up HTTPS** with a reverse proxy (Nginx)
4. **Implement authentication** for access control
5. **Add logging and monitoring**
6. **Secure the backend** - don't expose to the internet without proper security

Example with Gunicorn:
```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 📝 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Feel free to fork, modify, and improve this application. Consider:
- Adding more agent tools
- Implementing user authentication
- Adding conversation export/import
- Creating a dark mode toggle
- Integrating additional LLM providers

## 📞 Support

For issues with:
- **Ollama**: Visit [ollama.ai](https://ollama.ai)
- **Flask**: See [Flask documentation](https://flask.palletsprojects.com/)
- **This project**: Check the troubleshooting section above

## 🎓 Learning Resources

- [Ollama Documentation](https://github.com/ollama/ollama)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [JavaScript Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Markdown Guide](https://www.markdownguide.org/)

---

**Made with ❤️ for AI enthusiasts and developers**
