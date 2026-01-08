document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements - Encryption Panel
    const encryptInput = document.getElementById('encrypt-input');
    const encryptKeyInput = document.getElementById('encrypt-key');
    const encryptKeyError = document.getElementById('encrypt-key-error');
    const encryptBtn = document.getElementById('encrypt-btn');
    const encryptOutput = document.getElementById('encrypt-output');

    // DOM Elements - Decryption Panel
    const decryptInput = document.getElementById('decrypt-input');
    const decryptKeyInput = document.getElementById('decrypt-key');
    const decryptKeyError = document.getElementById('decrypt-key-error');
    const decryptBtn = document.getElementById('decrypt-btn');
    const decryptOutput = document.getElementById('decrypt-output');

    // DOM Elements - Shared Visualization
    const outputSection = document.getElementById('output-section');
    const outputText = document.getElementById('output-text');
    const stepsGrid = document.getElementById('steps-grid');
    const alphabetMapping = document.getElementById('alphabet-mapping');

    // Helper: GCD
    function gcd(a, b) {
        if (!b) return a;
        return gcd(b, a % b);
    }

    // Helper: Modular Inverse
    function modInverse(a, m) {
        a = (a % m + m) % m;
        for (let x = 1; x < m; x++) {
            if ((a * x) % m === 1) return x;
        }
        return 1;
    }

    // Validation
    function validateKey(k) {
        if (isNaN(k)) return "Key must be a number";
        if (k < 1 || k > 25) return "Key must be between 1 and 25";
        if (gcd(k, 26) !== 1) return `Key ${k} is not coprime to 26. Try 3, 5, 7...`;
        return null;
    }

    // Input Listeners for Validation
    function setupValidation(input, errorMsg, btn) {
        input.addEventListener('input', () => {
            const k = parseInt(input.value);
            const error = validateKey(k);
            if (error) {
                errorMsg.textContent = error;
                btn.disabled = true;
            } else {
                errorMsg.textContent = "";
                btn.disabled = false;
            }
        });
    }

    setupValidation(encryptKeyInput, encryptKeyError, encryptBtn);
    setupValidation(decryptKeyInput, decryptKeyError, decryptBtn);

    // Char <-> Num
    function charToNum(c) {
        return c.toLowerCase().charCodeAt(0) - 97;
    }

    function numToChar(n) {
        return String.fromCharCode(n + 97);
    }

    // Core Logic
    function runCipher(text, key, isDecrypt) {
        let resultStr = "";
        let stepsHTML = "";

        let effectiveKey = key;

        if (isDecrypt) {
            effectiveKey = modInverse(key, 26);
        }

        const usedChars = new Set();

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (char.match(/[a-z]/i)) {
                const isUpper = char === char.toUpperCase();
                const x = charToNum(char.toLowerCase());

                // Cipher math: (x * effectiveKey) % 26
                const val = (x * effectiveKey) % 26;
                let newChar = numToChar(val);

                if (isUpper) newChar = newChar.toUpperCase();

                resultStr += newChar;
                usedChars.add(char.toLowerCase());

                // Visualization Step
                stepsHTML += `
                    <div class="step-card">
                        <span class="char">${char}</span>
                        <span class="val">${x}</span>
                        <span class="calc">${x} ${isDecrypt ? '× ' + effectiveKey + ' (inv)' : '× ' + key}</span>
                        <span class="result">= ${val} (${newChar})</span>
                    </div>
                `;
            } else {
                resultStr += char;
                stepsHTML += `
                    <div class="step-card" style="opacity: 0.5;">
                        <span class="char">${char}</span>
                        <span class="val">-</span>
                        <span class="calc">skip</span>
                        <span class="result">${char}</span>
                    </div>
                `;
            }
        }

        return { resultStr, stepsHTML, effectiveKey, usedChars };
    }

    function updateVisualization(text, resultStr, stepsHTML, effectiveKey, usedChars) {
        // Update Bottom Section
        outputText.textContent = resultStr; // Main large result
        stepsGrid.innerHTML = stepsHTML;

        // Render Alphabet Mapping
        let mappingHTML = "";
        for (let i = 0; i < 26; i++) {
            const c = numToChar(i);
            const cipherVal = (i * effectiveKey) % 26;
            const cipherChar = numToChar(cipherVal);

            const isUsed = usedChars.has(c);

            mappingHTML += `
                <div class="map-item ${isUsed ? 'highlight' : ''}">
                    <span style="color: var(--text-secondary); font-size: 0.8em;">${i}</span>
                    <b>${c}</b>
                    <span style="margin: 4px 0;">↓</span>
                    <b>${cipherChar}</b>
                    <span style="color: var(--text-secondary); font-size: 0.8em;">${cipherVal}</span>
                </div>
            `;
        }
        alphabetMapping.innerHTML = mappingHTML;

        // Show section
        outputSection.classList.remove('hidden');
        void outputSection.offsetWidth; // Trigger reflow
        outputSection.classList.add('visible');
    }

    // Button Handlers
    encryptBtn.addEventListener('click', () => {
        const text = encryptInput.value;
        const k = parseInt(encryptKeyInput.value);

        if (validateKey(k)) return; // Double check

        const { resultStr, stepsHTML, effectiveKey, usedChars } = runCipher(text, k, false);

        // 1. Show Result in Encrypt Box
        encryptOutput.textContent = resultStr;

        // 2. Auto-Transfer to Decrypt Box
        decryptInput.value = resultStr;
        decryptKeyInput.value = k; // Sync key

        // 3. Update Visualization (Opt: Show encryption steps)
        updateVisualization(text, resultStr, stepsHTML, effectiveKey, usedChars);

        // Reset Decrypt output to indicate new input is ready
        decryptOutput.textContent = "";
    });

    decryptBtn.addEventListener('click', () => {
        const text = decryptInput.value;
        const k = parseInt(decryptKeyInput.value);

        if (validateKey(k)) return;

        const { resultStr, stepsHTML, effectiveKey, usedChars } = runCipher(text, k, true);

        // 1. Show Result in Decrypt Box
        decryptOutput.textContent = resultStr;

        // 2. Update Visualization (Show decryption steps)
        updateVisualization(text, resultStr, stepsHTML, effectiveKey, usedChars);
    });

    // Initial State Check
    if (!validateKey(parseInt(encryptKeyInput.value))) {
        // Optional: Auto-run on load? Maybe not, cleaner to wait for user.
    }
});
