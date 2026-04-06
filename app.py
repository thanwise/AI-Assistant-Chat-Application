from flask import Flask, send_from_directory, request, Response
import requests
import json
from datetime import datetime

# Serve static files from the current directory
app = Flask(__name__, static_folder='.', static_url_path='')

# ----------------------------------------------------
# Agent Tools Definition
# ----------------------------------------------------
def get_current_time():
    """Returns the current local date and time."""
    return datetime.now().strftime("%A, %Y-%m-%d %H:%M:%S")

def calculate(expression):
    """Evaluates a mathematical expression."""
    try:
        # Simple eval for math, limited to avoid huge security risks
        allowed_names = {"__builtins__": None}
        return str(eval(expression, allowed_names, {}))
    except Exception as e:
        return f"Error evaluating expression: {e}"

AVAILABLE_TOOLS = {
    "get_current_time": get_current_time,
    "calculate": calculate
}

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_current_time",
            "description": "Get the exact current date and time",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "Evaluate a mathematical expression. ONLY use for math or calculations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "The math expression (e.g., '2 + 2', '25 * 4')"
                    }
                },
                "required": ["expression"]
            }
        }
    }
]

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    client_messages = data.get('messages', [])
    model = data.get('model', 'llama3.1:latest')

    def generate():
        messages = client_messages.copy()
        
        try:
            # We enforce a maximum number of steps to prevent infinite tool loops
            for step in range(5):
                response = requests.post(
                    'http://localhost:11434/api/chat',
                    json={
                        "model": model,
                        "messages": messages,
                        "tools": TOOL_DEFINITIONS,
                        "stream": False # Disable streaming for tool parsing ease
                    }
                )
                
                if response.status_code != 200:
                    yield (json.dumps({"message": {"content": f"\n\n**Ollama Error:** {response.text}"}}) + '\n').encode('utf-8')
                    break
                    
                resp_json = response.json()
                message = resp_json.get("message", {})
                
                # Check if model wants to call tools
                if "tool_calls" in message and message["tool_calls"]:
                    # Append the tool call message to context history
                    messages.append(message)
                    
                    for tool_call in message["tool_calls"]:
                        func = tool_call["function"]
                        func_name = func["name"]
                        arguments = func.get("arguments", {})
                        
                        # Tell the fronted what the agent is doing over the stream
                        notification = f"\n*🔧 Agent executing tool: `{func_name}` with arguments `{json.dumps(arguments)}`...*\n\n"
                        yield (json.dumps({"message": {"content": notification}}) + '\n').encode('utf-8')
                        
                        # Execute the tool safely
                        if func_name in AVAILABLE_TOOLS:
                            print(f"Executing {func_name} ...")
                            try:
                                result = AVAILABLE_TOOLS[func_name](**arguments)
                            except Exception as e:
                                result = str(e)
                        else:
                            result = f"Error: Tool {func_name} not found"
                            
                        # Feed the result back into the message history as a 'tool' role
                        messages.append({
                            "role": "tool",
                            "name": func_name,
                            "content": str(result)
                        })
                    
                    # The loop continues, sending the updated history back to the model
                    continue
                else:
                    # No tool calls, this is the final message to stream to the user
                    content = message.get("content", "")
                    yield (json.dumps({"message": {"content": content}}) + '\n').encode('utf-8')
                    break
        except Exception as e:
            error_msg = {"message": {"content": f"\n\n**Backend Error:** {str(e)}"}}
            yield (json.dumps(error_msg) + '\n').encode('utf-8')

    return Response(generate(), content_type='application/json')

if __name__ == '__main__':
    print("Starting Agentic Flask server on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
