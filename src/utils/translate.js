import axios from 'axios';

const GOOGLE_TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_KEY;

// Cache for translations
const translationCache = new Map();

// Supported languages with native names
export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  ar: { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  nl: { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  pl: { name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  tr: { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  vi: { name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  th: { name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  uk: { name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  ro: { name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' }
};

// Detect user's browser language
export function detectBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage;
  const langCode = browserLang.split('-')[0];
  return LANGUAGES[langCode] ? langCode : 'en';
}

// Translate text using Google Translate API
export async function translateText(text, targetLang, sourceLang = 'en') {
  if (!text || targetLang === sourceLang) return text;
  
  // Check cache
  const cacheKey = `${text}_${sourceLang}_${targetLang}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
      {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (response.data && response.data.data && response.data.data.translations && response.data.data.translations[0]) {
      const translated = response.data.data.translations[0].translatedText;
      translationCache.set(cacheKey, translated);
      return translated;
    }
    
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// Batch translate multiple texts
export async function translateBatch(texts, targetLang, sourceLang = 'en') {
  if (targetLang === sourceLang) return texts;

  try {
    const response = await axios.post(
      `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`,
      {
        q: texts,
        source: sourceLang,
        target: targetLang,
        format: 'text'
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (response.data && response.data.data && response.data.data.translations) {
      return response.data.data.translations.map(t => t.translatedText);
    }
    
    return texts;
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts;
  }
}

// Get language from localStorage or browser
export function getStoredLanguage() {
  return localStorage.getItem('appLanguage') || detectBrowserLanguage();
}

// Save language preference
export function saveLanguagePreference(langCode) {
  localStorage.setItem('appLanguage', langCode);
}

// Clear translation cache
export function clearTranslationCache() {
  translationCache.clear();
}
