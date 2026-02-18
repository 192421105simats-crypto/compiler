document.addEventListener('DOMContentLoaded', () => {
    const themeCheckbox = document.getElementById('checkbox');
    const body = document.body;
    const codeEditor = document.getElementById('code-editor');
    const lineNumbers = document.getElementById('line-numbers');
    const runBtn = document.getElementById('run-btn');
    const btnText = runBtn.querySelector('.btn-text');
    const loader = runBtn.querySelector('.loader');
    const languageSelect = document.getElementById('language-select');
    const outputDisplay = document.getElementById('output-display');
    const clearBtn = document.getElementById('clear-btn');

    // Default Code Snippets
    const snippets = {
        python: '# Print Hello World\nprint("Hello, CodeFlow!")\n\n# Try a loop\nfor i in range(5):\n    print(f"Count: {i}")',
        java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n        \n        for(int i=0; i<5; i++) {\n            System.out.println("Count: " + i);\n        }\n    }\n}'
    };

    // Initialize Editor with default snippet
    codeEditor.value = snippets[languageSelect.value];

    // Theme Logic
    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themeCheckbox.checked = true;
    }

    themeCheckbox.addEventListener('change', () => {
        if (themeCheckbox.checked) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        }
    });

    // Language change logic
    languageSelect.addEventListener('change', () => {
        const lang = languageSelect.value;
        codeEditor.value = snippets[lang];
        updateLineNumbers();
    });

    // Line Number Logic
    const updateLineNumbers = () => {
        const lines = codeEditor.value.split('\n').length;
        lineNumbers.innerHTML = Array(lines).fill(0).map((_, i) => `<span>${i + 1}</span>`).join('');
    };

    codeEditor.addEventListener('input', updateLineNumbers);
    codeEditor.addEventListener('scroll', () => {
        lineNumbers.scrollTop = codeEditor.scrollTop;
    });

    // Initial line numbers
    updateLineNumbers();

    // Run Code Logic
    const runCode = async () => {
        const code = codeEditor.value;
        const language = languageSelect.value;

        if (!code.trim()) {
            showOutput('Please write some code first!', 'error');
            return;
        }

        // UI State: Loading
        runBtn.disabled = true;
        btnText.textContent = 'Running...';
        loader.classList.remove('hidden');
        outputDisplay.className = '';
        outputDisplay.textContent = 'Executing...';

        try {
            const response = await fetch('/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, language })
            });

            const data = await response.json();

            if (data.success) {
                showOutput(data.output, 'success');
            } else {
                showOutput(data.output, 'error');
            }
        } catch (error) {
            showOutput('Failed to connect to backend. Is the Flask server running?', 'error');
        } finally {
            runBtn.disabled = false;
            btnText.textContent = 'Run';
            loader.classList.add('hidden');
        }
    };

    const showOutput = (text, status) => {
        outputDisplay.textContent = text || 'No output received.';
        outputDisplay.className = status;
    };

    runBtn.addEventListener('click', runCode);

    clearBtn.addEventListener('click', () => {
        outputDisplay.textContent = 'Ready to run...';
        outputDisplay.className = 'idle';
    });

    // Ctrl + Enter shortcut
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            runCode();
        }
    });

    // Tab support for editor
    codeEditor.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = codeEditor.selectionStart;
            const end = codeEditor.selectionEnd;

            codeEditor.value = codeEditor.value.substring(0, start) + "    " + codeEditor.value.substring(end);
            codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
            updateLineNumbers();
        }
    });
});
