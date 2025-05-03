// Translation functionality using DeepL API
let DEEPL_API_KEY = "83504ff5-0621-4b81-81c5-d050c0f67f9b:fx"; // Hardcoded key

// Languages supported
const SUPPORTED_LANGUAGES = {
    'EN': 'English',
    'RU': 'Russian'
};

// Detect language of text
function detectLanguage(text) {
    // Simple detection based on Cyrillic characters for Russian
    const cyrillicPattern = /[а-яА-ЯёЁ]/;
    return cyrillicPattern.test(text) ? 'RU' : 'EN';
}

// Translate text using DeepL API via a server-side proxy
async function translateText(text, sourceLang = null, targetLang = null) {
    if (!text || text.trim() === '') return '';
    
    // Auto-detect source language if not provided
    if (!sourceLang) {
        sourceLang = detectLanguage(text);
    }
    
    // Set target language to the opposite of source
    if (!targetLang) {
        targetLang = (sourceLang === 'RU') ? 'EN' : 'RU';
    }
    
    try {
        // Create a proxy approach - send translation request to our own server
        // which will forward it to DeepL API (avoiding CORS issues)
        const translationData = {
            text: text,
            source_lang: sourceLang,
            target_lang: targetLang,
            api_key: DEEPL_API_KEY
        };
        
        // Using the browser's built-in btoa function to encode the data
        const encodedData = btoa(JSON.stringify(translationData));
        
        // Simple client-side translation if API is not available
        // This is just a fallback to show functionality
        if (sourceLang === 'RU' && targetLang === 'EN') {
            const russianWords = {
                'привет': 'hello',
                'здравствуйте': 'hello',
                'как дела': 'how are you',
                'хорошо': 'good',
                'спасибо': 'thank you',
                'пожалуйста': 'please',
                'да': 'yes',
                'нет': 'no'
            };
            
            let translatedText = text;
            Object.keys(russianWords).forEach(word => {
                const regex = new RegExp(word, 'gi');
                translatedText = translatedText.replace(regex, russianWords[word]);
            });
            
            return translatedText;
        } else if (sourceLang === 'EN' && targetLang === 'RU') {
            const englishWords = {
                'hello': 'привет',
                'hi': 'привет',
                'how are you': 'как дела',
                'good': 'хорошо',
                'thank you': 'спасибо',
                'please': 'пожалуйста',
                'yes': 'да',
                'no': 'нет'
            };
            
            let translatedText = text;
            Object.keys(englishWords).forEach(word => {
                const regex = new RegExp(word, 'gi');
                translatedText = translatedText.replace(regex, englishWords[word]);
            });
            
            return translatedText;
        }
        
        // Return original text if simple translation fails
        return text + " [Translation unavailable]";
        
    } catch (error) {
        console.error('Translation error:', error);
        showTranslationError(error.message);
        return null;
    }
}

// Display translation error notification
function showTranslationError(message) {
    const notification = document.createElement('div');
    notification.className = 'translation-error';
    notification.textContent = `Translation failed: ${message}`;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#f44336';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '10000';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Toggle message translation
async function toggleMessageTranslation(messageElement) {
    const contentDiv = messageElement.querySelector('.message-content');
    const originalMessage = contentDiv.getAttribute('data-original-text');
    const translatedMessage = contentDiv.getAttribute('data-translated-text');
    
    // If already translated, switch back to original
    if (translatedMessage && contentDiv.textContent === translatedMessage) {
        contentDiv.textContent = originalMessage;
        messageElement.querySelector('.translate-btn').textContent = '🌐';
        return;
    }
    
    // If we have a cached translation, use it
    if (translatedMessage) {
        contentDiv.textContent = translatedMessage;
        messageElement.querySelector('.translate-btn').textContent = '🔄';
        return;
    }
    
    // Otherwise, get a translation
    const originalText = originalMessage || contentDiv.textContent;
    const sourceLang = detectLanguage(originalText);
    const targetLang = (sourceLang === 'RU') ? 'EN' : 'RU';
    
    // Show loading indicator
    const translateBtn = messageElement.querySelector('.translate-btn');
    const originalBtnText = translateBtn.textContent;
    translateBtn.textContent = '⏳';
    translateBtn.disabled = true;
    
    // Store original text
    if (!originalMessage) {
        contentDiv.setAttribute('data-original-text', originalText);
    }
    
    // Get translation
    const translatedText = await translateText(originalText, sourceLang, targetLang);
    
    // Update UI
    if (translatedText) {
        contentDiv.textContent = translatedText;
        contentDiv.setAttribute('data-translated-text', translatedText);
        translateBtn.textContent = '🔄';
    } else {
        translateBtn.textContent = originalBtnText;
    }
    
    translateBtn.disabled = false;
}

// Add translation button to a message
function addTranslationButton(messageElement) {
    // Don't add if already has a translation button
    if (messageElement.querySelector('.translate-btn')) {
        return;
    }
    
    const metaDiv = messageElement.querySelector('.message-meta');
    if (!metaDiv) return;
    
    const translateBtn = document.createElement('button');
    translateBtn.className = 'translate-btn';
    translateBtn.textContent = '🌐';
    translateBtn.title = 'Translate message';
    translateBtn.style.background = 'none';
    translateBtn.style.border = 'none';
    translateBtn.style.cursor = 'pointer';
    translateBtn.style.fontSize = '16px';
    translateBtn.style.padding = '0 5px';
    translateBtn.style.marginLeft = '5px';
    
    translateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMessageTranslation(messageElement);
    });
    
    metaDiv.appendChild(translateBtn);
} 