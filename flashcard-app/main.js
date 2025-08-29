import './style.css';
import lesson1Data from './lesson1.json';
import lesson2Data from './lesson2.json';
import lesson3Data from './lesson3.json';
import lesson4Data from './lesson4.json';
import lesson5Data from './lesson5.json';

// Store lesson data
const lessonData = {
    1: lesson1Data,
    2: lesson2Data,
    3: lesson3Data,
    4: lesson4Data,
    5: lesson5Data
};

// State management
let selectedLessons = new Set();
let selectedMode = 'ordered';
let translationDirection = 'thai-english';
let selectedContentType = 'words';
let showAssociations = false;
let associationLanguages = new Set();
let currentWords = [];
let currentIndex = 0;
let showingFront = true;
let isQuizMode = false;
let score = 0;
let attempts = 0;

// DOM Elements
const mainMenu = document.getElementById('mainMenu');
const settingsPanel = document.getElementById('settingsPanel');
const lessonCheckboxes = document.getElementById('lessonCheckboxes');
const startBtn = document.getElementById('startBtn');
const settingsBtn = document.getElementById('settingsBtn');
const backBtn = document.getElementById('backBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const studyMode = document.getElementById('studyMode');
const progressDiv = document.getElementById('progress');
const frontText = document.getElementById('frontText');
const backText = document.getElementById('backText');
const flashcard = document.getElementById('flashcard');
const flashcardMode = document.getElementById('flashcardMode');
const quizMode = document.getElementById('quizMode');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const flipBtn = document.getElementById('flipBtn');
const quizInput = document.getElementById('quizInput');
const quizSubmit = document.getElementById('quizSubmit');
const quizFeedback = document.getElementById('quizFeedback');
const scoreDiv = document.getElementById('score');
const returnBtn = document.getElementById('returnBtn');
const showAssociationsCheckbox = document.getElementById('showAssociations');
const frontAssociations = document.getElementById('frontAssociations');
const backAssociations = document.getElementById('backAssociations');

// Initialize
function init() {
    loadPreferences();
    initializeLessonCheckboxes();
    setupEventListeners();
    updateStartButton();
}

// Initialize lesson checkboxes
function initializeLessonCheckboxes() {
    lessonCheckboxes.innerHTML = '';
    
    [1, 2, 3, 4, 5].forEach(lessonNum => {
        const data = lessonData[lessonNum];
        const wordCount = data && data.vocabulary ? data.vocabulary.length : 0;
        const phraseCount = data && data.phrases ? data.phrases.length : 0;
        
        const label = document.createElement('label');
        label.className = 'lesson-checkbox';
        let countText = '';
        if (wordCount > 0 && phraseCount > 0) {
            countText = `${wordCount} words, ${phraseCount} phrases`;
        } else if (wordCount > 0) {
            countText = `${wordCount} words`;
        } else if (phraseCount > 0) {
            countText = `${phraseCount} phrases`;
        }
        
        label.innerHTML = `
            <input type="checkbox" value="${lessonNum}" 
                ${selectedLessons.has(lessonNum) ? 'checked' : ''}>
            <span>Lesson ${lessonNum} (${countText})</span>
        `;
        lessonCheckboxes.appendChild(label);
    });

    // Add change listeners
    lessonCheckboxes.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', handleLessonChange);
    });
}

// Handle lesson selection change
function handleLessonChange(e) {
    const lessonNum = parseInt(e.target.value);
    if (e.target.checked) {
        selectedLessons.add(lessonNum);
    } else {
        selectedLessons.delete(lessonNum);
    }
}

// Update start button state
function updateStartButton() {
    const mainStartBtn = document.querySelector('#mainMenu #startBtn');
    if (mainStartBtn) {
        mainStartBtn.disabled = selectedLessons.size === 0;
        if (selectedLessons.size === 0) {
            mainStartBtn.title = 'Please select lessons in Settings first';
        } else {
            mainStartBtn.title = '';
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Main menu buttons
    document.querySelector('#mainMenu #startBtn').addEventListener('click', () => {
        if (selectedLessons.size === 0) {
            alert('Please select lessons in Settings first!');
            showSettings();
        } else {
            startStudying();
        }
    });

    document.querySelector('#mainMenu #settingsBtn').addEventListener('click', showSettings);

    // Settings buttons
    backBtn.addEventListener('click', showMainMenu);
    saveSettingsBtn.addEventListener('click', () => {
        savePreferences();
        updateStartButton();
        showMainMenu();
    });

    // Study mode buttons
    prevBtn.addEventListener('click', previousCard);
    nextBtn.addEventListener('click', nextCard);
    flipBtn.addEventListener('click', flipCard);
    returnBtn.addEventListener('click', () => {
        showMainMenu();
        resetStudySession();
    });
    
    // Add click/tap to flip the flashcard
    flashcard.addEventListener('click', flipCard);
    
    quizSubmit.addEventListener('click', checkQuizAnswer);
    quizInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkQuizAnswer();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (studyMode.style.display !== 'none' && !isQuizMode) {
            if (e.key === 'ArrowLeft') previousCard();
            if (e.key === 'ArrowRight') nextCard();
            if (e.key === ' ') {
                e.preventDefault();
                flipCard();
            }
        }
    });
}

// Show settings panel
function showSettings() {
    mainMenu.style.display = 'none';
    settingsPanel.style.display = 'block';
    studyMode.style.display = 'none';
}

// Show main menu
function showMainMenu() {
    mainMenu.style.display = 'block';
    settingsPanel.style.display = 'none';
    studyMode.style.display = 'none';
}

// Start studying
function startStudying() {
    // Get selected mode
    const modeRadio = document.querySelector('input[name="studyMode"]:checked');
    selectedMode = modeRadio ? modeRadio.value : 'ordered';
    
    currentWords = getSelectedContent();
    if (currentWords.length === 0) {
        alert('No content available! Please select lessons in Settings.');
        return;
    }
    
    // Apply mode
    if (selectedMode === 'shuffled' || selectedMode === 'quiz') {
        currentWords.sort(() => Math.random() - 0.5);
    }
    
    currentIndex = 0;
    showingFront = true;
    isQuizMode = (selectedMode === 'quiz');
    
    // Show study mode
    mainMenu.style.display = 'none';
    settingsPanel.style.display = 'none';
    studyMode.style.display = 'block';
    
    if (isQuizMode) {
        flashcardMode.style.display = 'none';
        quizMode.style.display = 'block';
        score = 0;
        attempts = 0;
        displayQuizQuestion();
    } else {
        flashcardMode.style.display = 'block';
        quizMode.style.display = 'none';
        displayCard();
    }
}

// Reset study session
function resetStudySession() {
    currentWords = [];
    currentIndex = 0;
    showingFront = true;
    isQuizMode = false;
    score = 0;
    attempts = 0;
    quizInput.style.display = 'block';
    quizSubmit.style.display = 'inline-block';
}

// Get selected content based on content type setting
function getSelectedContent() {
    const content = [];
    selectedLessons.forEach(lessonNum => {
        const data = lessonData[lessonNum];
        if (!data) return;
        
        // Add words if selected
        if ((selectedContentType === 'words' || selectedContentType === 'both') && data.vocabulary) {
            data.vocabulary.forEach(item => {
                content.push({ ...item, type: 'word' });
            });
        }
        
        // Add phrases if selected
        if ((selectedContentType === 'phrases' || selectedContentType === 'both') && data.phrases) {
            data.phrases.forEach(item => {
                content.push({ ...item, type: 'phrase' });
            });
        }
    });
    return content;
}

// Fit text to card by adjusting font size
function fitTextToCard(cardElement, textElement) {
    if (!textElement || !cardElement) return;
    
    // Reset font size to maximum
    textElement.style.fontSize = '2.5em';
    
    // Get the container height (card height minus padding)
    const containerHeight = cardElement.offsetHeight - 40; // 40px for padding
    
    // Start with max font size and reduce until it fits
    let fontSize = 2.5;
    const minFontSize = 1.0;
    const step = 0.1;
    
    // Check if content fits
    while (textElement.scrollHeight > containerHeight && fontSize > minFontSize) {
        fontSize -= step;
        textElement.style.fontSize = `${fontSize}em`;
    }
}

// Display current card
function displayCard() {
    if (currentWords.length === 0) return;
    
    const item = currentWords[currentIndex];
    
    // Clear associations first
    frontAssociations.textContent = '';
    backAssociations.textContent = '';
    
    // Handle phrases (which might have multiline content)
    const formatText = (text) => {
        if (!text) return '';
        // Replace newlines with <br> for phrases
        return text.includes('\n') ? text.replace(/\n/g, '<br>') : text;
    };
    
    // Swap front/back based on translation direction
    if (translationDirection === 'thai-english') {
        // Use innerHTML for phrases to preserve line breaks
        if (item.thai && item.thai.includes('\n')) {
            frontText.innerHTML = formatText(item.thai);
        } else {
            frontText.textContent = item.thai;
        }
        
        if (item.english && item.english.includes('\n')) {
            backText.innerHTML = formatText(item.english);
        } else {
            backText.textContent = item.english;
        }
        // No associations shown in Thai → English direction (would spoil the answer)
    } else {
        // Use innerHTML for phrases to preserve line breaks
        if (item.english && item.english.includes('\n')) {
            frontText.innerHTML = formatText(item.english);
        } else {
            frontText.textContent = item.english;
        }
        
        if (item.thai && item.thai.includes('\n')) {
            backText.innerHTML = formatText(item.thai);
        } else {
            backText.textContent = item.thai;
        }
        
        // Show associations only on the Thai side (back) in English → Thai direction
        // Only for words, not phrases
        if (item.type === 'word' && showAssociations && associationLanguages.size > 0) {
            const associations = [];
            if (associationLanguages.has('en') && item.associationEn) {
                associations.push(item.associationEn);
            }
            if (associationLanguages.has('ru') && item.associationRu) {
                associations.push(item.associationRu);
            }
            if (associations.length > 0) {
                backAssociations.innerHTML = associations.join('<br>');
            }
        }
    }
    
    flashcard.classList.remove('flipped');
    showingFront = true;
    
    // Fit text to cards
    const frontCard = document.querySelector('.flashcard-front');
    const backCard = document.querySelector('.flashcard-back');
    fitTextToCard(frontCard, frontText);
    fitTextToCard(backCard, backText);
    
    progressDiv.textContent = `${currentIndex + 1} / ${currentWords.length}`;
    
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === currentWords.length - 1;
}

// Display quiz question
function displayQuizQuestion() {
    if (currentIndex >= currentWords.length) {
        endQuiz();
        return;
    }
    
    const item = currentWords[currentIndex];
    const questionElement = document.querySelector('.quiz-question');
    
    // Show question based on translation direction
    if (translationDirection === 'thai-english') {
        // Handle multiline content for phrases
        if (item.thai && item.thai.includes('\n')) {
            questionElement.innerHTML = item.thai.replace(/\n/g, '<br>');
        } else {
            questionElement.textContent = item.thai;
        }
        quizInput.placeholder = 'Enter English translation...';
    } else {
        // Handle multiline content for phrases
        if (item.english && item.english.includes('\n')) {
            questionElement.innerHTML = item.english.replace(/\n/g, '<br>');
        } else {
            questionElement.textContent = item.english;
        }
        quizInput.placeholder = 'Enter Thai translation (phonetic)...';
    }
    
    // Fit quiz question text
    const quizContainer = document.querySelector('.quiz-mode');
    if (quizContainer) {
        // Reset and adjust font size for quiz question
        questionElement.style.fontSize = '2.5em';
        const maxHeight = 150; // Maximum height for quiz question area
        
        let fontSize = 2.5;
        const minFontSize = 1.2;
        const step = 0.1;
        
        while (questionElement.scrollHeight > maxHeight && fontSize > minFontSize) {
            fontSize -= step;
            questionElement.style.fontSize = `${fontSize}em`;
        }
    }
    
    quizInput.value = '';
    quizFeedback.textContent = '';
    quizInput.focus();
    
    progressDiv.textContent = `Question ${currentIndex + 1} / ${currentWords.length}`;
    scoreDiv.textContent = `Score: ${score} / ${attempts}`;
}

// Check quiz answer
function checkQuizAnswer() {
    const item = currentWords[currentIndex];
    const answer = quizInput.value.trim().toLowerCase();
    
    let correct, correctDisplay;
    if (translationDirection === 'thai-english') {
        // For phrases, we might need to be more flexible with the answer
        correct = item.english.toLowerCase();
        correctDisplay = item.english;
    } else {
        correct = item.thai.toLowerCase();
        correctDisplay = item.thai;
    }
    
    attempts++;
    
    if (answer === correct || correct.includes(answer) || answer.includes(correct)) {
        score++;
        quizFeedback.textContent = 'Correct! ✓';
        quizFeedback.style.color = '#10b981';
        
        setTimeout(() => {
            currentIndex++;
            displayQuizQuestion();
        }, 1500);
    } else {
        quizFeedback.textContent = `Incorrect. The answer is: ${correctDisplay}`;
        quizFeedback.style.color = '#ef4444';
        
        setTimeout(() => {
            currentIndex++;
            displayQuizQuestion();
        }, 3000);
    }
    
    scoreDiv.textContent = `Score: ${score} / ${attempts}`;
}

// End quiz
function endQuiz() {
    const percentage = attempts > 0 ? Math.round((score / attempts) * 100) : 0;
    quizFeedback.textContent = `Quiz complete! Final score: ${score}/${attempts} (${percentage}%)`;
    quizFeedback.style.color = '#3b82f6';
    document.querySelector('.quiz-question').textContent = '';
    quizInput.style.display = 'none';
    quizSubmit.style.display = 'none';
}

// Navigation functions
function previousCard() {
    if (currentIndex > 0) {
        currentIndex--;
        displayCard();
    }
}

function nextCard() {
    if (currentIndex < currentWords.length - 1) {
        currentIndex++;
        displayCard();
    }
}

function flipCard() {
    flashcard.classList.toggle('flipped');
    showingFront = !showingFront;
}

// Save/Load preferences
function savePreferences() {
    localStorage.setItem('selectedLessons', JSON.stringify(Array.from(selectedLessons)));
    localStorage.setItem('selectedMode', selectedMode);
    localStorage.setItem('translationDirection', translationDirection);
    
    // Update content type from radio buttons
    const contentRadio = document.querySelector('input[name="contentType"]:checked');
    if (contentRadio) {
        selectedContentType = contentRadio.value;
        localStorage.setItem('selectedContentType', selectedContentType);
    }
    
    // Update selected mode from radio buttons
    const modeRadio = document.querySelector('input[name="studyMode"]:checked');
    if (modeRadio) {
        selectedMode = modeRadio.value;
        localStorage.setItem('selectedMode', selectedMode);
    }
    
    // Update translation direction from radio buttons
    const directionRadio = document.querySelector('input[name="translationDirection"]:checked');
    if (directionRadio) {
        translationDirection = directionRadio.value;
        localStorage.setItem('translationDirection', translationDirection);
    }
    
    // Save association settings
    showAssociations = showAssociationsCheckbox.checked;
    localStorage.setItem('showAssociations', showAssociations);
    
    // Save selected association languages
    associationLanguages.clear();
    document.querySelectorAll('input[name="associationLanguage"]:checked').forEach(checkbox => {
        associationLanguages.add(checkbox.value);
    });
    localStorage.setItem('associationLanguages', JSON.stringify(Array.from(associationLanguages)));
}

function loadPreferences() {
    const savedLessons = localStorage.getItem('selectedLessons');
    const savedMode = localStorage.getItem('selectedMode');
    const savedDirection = localStorage.getItem('translationDirection');
    const savedContentType = localStorage.getItem('selectedContentType');
    const savedShowAssociations = localStorage.getItem('showAssociations');
    const savedAssociationLanguages = localStorage.getItem('associationLanguages');
    
    if (savedLessons) {
        selectedLessons = new Set(JSON.parse(savedLessons));
    }
    
    if (savedContentType) {
        selectedContentType = savedContentType;
        const contentRadio = document.querySelector(`input[name="contentType"][value="${savedContentType}"]`);
        if (contentRadio) {
            contentRadio.checked = true;
        }
    }
    
    if (savedMode) {
        selectedMode = savedMode;
        const modeRadio = document.querySelector(`input[name="studyMode"][value="${savedMode}"]`);
        if (modeRadio) {
            modeRadio.checked = true;
        }
    }
    
    if (savedDirection) {
        translationDirection = savedDirection;
        const directionRadio = document.querySelector(`input[name="translationDirection"][value="${savedDirection}"]`);
        if (directionRadio) {
            directionRadio.checked = true;
        }
    }
    
    // Load association settings
    if (savedShowAssociations !== null) {
        showAssociations = savedShowAssociations === 'true';
        showAssociationsCheckbox.checked = showAssociations;
    }
    
    if (savedAssociationLanguages) {
        associationLanguages = new Set(JSON.parse(savedAssociationLanguages));
        associationLanguages.forEach(lang => {
            const langCheckbox = document.querySelector(`input[name="associationLanguage"][value="${lang}"]`);
            if (langCheckbox) {
                langCheckbox.checked = true;
            }
        });
    }
}

// Initialize app
init();