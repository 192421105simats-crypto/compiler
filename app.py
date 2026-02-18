import os
import subprocess
import tempfile
import uuid
import re
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

def run_python(code):
    try:
        # Run python code and capture output
        result = subprocess.run(
            ['python', '-c', code],
            capture_output=True,
            text=True,
            timeout=10
        )
        return {
            "success": result.returncode == 0,
            "output": result.stdout if result.returncode == 0 else result.stderr
        }
    except subprocess.TimeoutExpired:
        return {"success": False, "output": "Review Error: Execution Timed Out (10s limit)"}
    except Exception as e:
        return {"success": False, "output": str(e)}

def run_java(code):
    # Create a temporary directory for Java files
    with tempfile.TemporaryDirectory() as tmpdir:
        # Try to find the class name
        class_match = re.search(r'public\s+class\s+(\w+)', code)
        if class_match:
            class_name = class_match.group(1)
        else:
            # Fallback to Main if no public class found, though javac might complain
            class_name = "Main"
            # If "class Main" is not in code, we might need to wrap it or just hope it's there
            if "class Main" not in code:
               return {"success": False, "output": "Error: Could not find public class name. Please use 'public class Main'."}

        file_path = os.path.join(tmpdir, f"{class_name}.java")
        with open(file_path, 'w') as f:
            f.write(code)

        try:
            # Compile
            compile_process = subprocess.run(
                ['javac', file_path],
                capture_output=True,
                text=True,
                timeout=10
            )

            if compile_process.returncode != 0:
                return {"success": False, "output": compile_process.stderr}

            # Run
            run_process = subprocess.run(
                ['java', '-cp', tmpdir, class_name],
                capture_output=True,
                text=True,
                timeout=10
            )

            return {
                "success": run_process.returncode == 0,
                "output": run_process.stdout if run_process.returncode == 0 else run_process.stderr
            }

        except subprocess.TimeoutExpired:
            return {"success": False, "output": "Review Error: Execution Timed Out (10s limit)"}
        except Exception as e:
            return {"success": False, "output": str(e)}

@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/compiler')
def index():
    return render_template('index.html')

@app.route('/run', methods=['POST'])
def run_code():
    data = request.json
    language = data.get('language')
    code = data.get('code')

    if not code:
        return jsonify({"success": False, "output": "No code provided!"})

    if language == 'python':
        result = run_python(code)
    elif language == 'java':
        result = run_java(code)
    else:
        return jsonify({"success": False, "output": "Unsupported language!"})

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
