import {
  Heart, Target, Users, Mail, Github, Award, Sparkles,
  CheckCircle2, Globe, Star, TrendingUp, Clock, Zap, Brain, BookOpen, Code,
  Coffee, Palette, Rocket, Smile, ThumbsUp, HelpCircle, MessageCircle, Share2,
  Download, ExternalLink, Lock, Eye, EyeOff, Bell, Calendar, Filter, RefreshCw,
  AlertTriangle, Gift, Crown, Medal, Users2, Building, Newspaper,
  BookMarked, Video, Headphones, Instagram, Twitter, Linkedin, Youtube, Facebook,
  MapPin, Camera, Flame, X
} from "lucide-react";
import { useState, useContext, useEffect, useRef } from "react";
import { TranslationContext } from "../App";
import Presence from "./Presence";
import { translateBatch } from "../utils/translate.js";

// Fallback components for icons not in your lucide-react version
const Apple = ({ className }) => <span className={className} role="img" aria-label="Apple">🍎</span>;
const Android = ({ className }) => <span className={className} role="img" aria-label="Android">🤖</span>;
const Smartphone = ({ className }) => <span className={className} role="img" aria-label="Smartphone">📱</span>;
const Database = ({ className }) => <span className={className} role="img" aria-label="Database">💾</span>;
const ChevronDown = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export default function Mission() {
  const { currentLanguage, translating } = useContext(TranslationContext);
  const [showFeedback, setShowFeedback] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [translatedText, setTranslatedText] = useState({});
  
  // Feedback form state
  const [feedbackType, setFeedbackType] = useState('general');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const feedbackTriggerRef = useRef(null);
  const feedbackDialogRef = useRef(null);

  useEffect(() => {
    if (!showFeedback) return undefined;
    const dialog = feedbackDialogRef.current;
    const getFocusable = () => [...(dialog?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]') || [])]
      .filter((element) => element.getAttribute("type") !== "hidden");
    const first = getFocusable()[0];
    first?.focus();

    const handleDialogKeys = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowFeedback(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) return;
      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === firstElement || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (document.activeElement === lastElement || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      document.removeEventListener("keydown", handleDialogKeys);
      feedbackTriggerRef.current?.focus();
    };
  }, [showFeedback]);

  // Translation keys - only what's actually used
  const translationKeys = {
    title: "Our Mission",
    subtitle: "Building better dental habits, together",
    missionTitle: "Why Smile Streak Exists",
    missionDesc1: "Smile Streak was built to help people develop consistent oral health habits without guilt, pressure, or misinformation.",
    missionDesc2: "Rather than focusing on perfection or streak anxiety, the goal is to encourage sustainable routines that align with real human behavior and evidence-based dental guidance.",
    problemTitle: "The Real Problem",
    problemDesc1: "Many dental health apps focus heavily on reminders and streaks, but fail to address why habits break down in the first place. Missed days are often caused by stress, schedule changes, fatigue, or lack of awareness — not lack of motivation.",
    problemDesc2: "Smile Streak was created to emphasize reflection, pattern recognition, and long-term progress over short-term perfection. By helping users understand their habits, the app aims to make healthy routines easier to maintain over time.",
    designPrinciples: "Our Design Principles",
    principle1: "Education over diagnosis",
    principle2: "Trends over daily pressure",
    principle3: "Reflection over punishment",
    principle4: "Privacy-first, local-only data storage",
    principle5: "Insights shown only when data is meaningful",
    principle6: "Transparency about limitations and uncertainty",
    researchTitle: "Research-Informed Design",
    researchDesc1: "The structure of this app is informed by published dental research and public health guidance from organizations such as the American Dental Association and the Centers for Disease Control and Prevention.",
    researchDesc2: "Habit tracking, reflection prompts, and delayed insights are designed to prioritize consistency, reduce cognitive overload, and avoid drawing conclusions from insufficient data.",
    getInvolved: "Get Involved",
    shareFeedback: "Share Feedback",
    shareFeedbackDesc: "Help us improve the app",
    openSource: "Open Source",
    openSourceDesc: "View code on GitHub",
    medicalDisclaimer: "Medical Disclaimer",
    disclaimerText: "SmileStreak supports dental-habit tracking and general education. It is not a dental practice and does not examine, diagnose, or recommend treatment. Do not use the app for urgent care or personal treatment decisions; contact a licensed dental professional about symptoms or concerns.",
    version: "Smile Streak v1.1.2",
    madeWith: "Made with ❤️ for better dental health",
    
    exploreFeatures: "Explore Features",
    featureTitle1: "Smart Reminders",
    featureDesc1: "Set reminders for the times that fit your day",
    featureTitle2: "Habit Insights",
    featureDesc2: "See patterns in the brushing and flossing habits you log",
    featureTitle3: "Dentist Finder",
    featureDesc3: "Search a nearby dentist directory and review office details",
    featureTitle4: "Progress Tracking",
    featureDesc4: "Review saved habits, streaks, and routine patterns over time",
    featureTitle5: "Scan & Analyze",
    featureDesc5: "Request general educational observations from an uploaded photo",
    featureTitle6: "Multi-Language Support",
    featureDesc6: "Available in 20+ languages to serve our global community",
    
    faq: "Frequently Asked Questions",
    faq1q: "Is Smile Streak really free?",
    faq1a: "There is no in-app checkout in this version. Check the current terms for any changes to features or pricing.",
    faq2q: "How does the AI scan work?",
    faq2a: "A photo can be sent to Google's Gemini service to return educational feedback. It is not a diagnostic tool; discuss dental concerns with a licensed professional.",
    faq3q: "Where is my data stored?",
    faq3a: "Habit and profile information is kept in this browser and synced to Firebase when you sign in. Scan photos and history are stored in this browser. See Legal & Privacy for the data controls and service details.",
    faq4q: "Can I use Smile Streak with my dentist?",
    faq4a: "You can export a report and choose whether to share it with your dentist. Review it first and send only the information you’re comfortable sharing.",
    faq5q: "How do I change my language?",
    faq5a: "Click the globe icon in the top right corner and select your preferred language from the dropdown menu.",
    
    feedbackTitle: "Share Your Feedback",
    feedbackType: "Feedback Type",
    feedbackGeneral: "General Feedback",
    feedbackBug: "Bug Report",
    feedbackFeature: "Feature Request",
    feedbackRating: "How would you rate your experience?",
    feedbackEmail: "Email (optional)",
    feedbackPlaceholder: "Share your thoughts, suggestions, or report issues...",
    cancel: "Cancel",
    submit: "Submit",
    closeFeedback: "Close feedback form",
  };

  // Load translations when language changes
  useEffect(() => {
    let active = true;
    const loadTranslations = async () => {
      const keys = Object.keys(translationKeys);
      const values = await translateBatch(Object.values(translationKeys), currentLanguage, "en");
      if (active) setTranslatedText(Object.fromEntries(keys.map((key, index) => [key, values[index]])));
    };
    
    loadTranslations().catch((error) => {
      console.error("Could not load mission page translations:", error);
      if (active) setTranslatedText(translationKeys);
    });
    return () => { active = false; };
  }, [currentLanguage]);

  // Features
  const features = [
    { icon: <Bell className="w-4 h-4" />, title: 'featureTitle1', desc: 'featureDesc1' },
    { icon: <Brain className="w-4 h-4" />, title: 'featureTitle2', desc: 'featureDesc2' },
    { icon: <MapPin className="w-4 h-4" />, title: 'featureTitle3', desc: 'featureDesc3' },
    { icon: <TrendingUp className="w-4 h-4" />, title: 'featureTitle4', desc: 'featureDesc4' },
    { icon: <Camera className="w-4 h-4" />, title: 'featureTitle5', desc: 'featureDesc5' },
    { icon: <Globe className="w-4 h-4" />, title: 'featureTitle6', desc: 'featureDesc6' }
  ];

  // Social links - keeping only the GitHub link which exists
  const socialLinks = [
    { icon: <Github className="w-5 h-5" />, label: 'GitHub', url: 'https://github.com/SmileStreak/SmileStreak', color: 'gray' }
  ];

  // FAQ items
  const faqItems = [
    { question: 'faq1q', answer: 'faq1a' },
    { question: 'faq2q', answer: 'faq2a' },
    { question: 'faq3q', answer: 'faq3a' },
    { question: 'faq4q', answer: 'faq4a' },
    { question: 'faq5q', answer: 'faq5a' }
  ];

  // Show loading state while translating
  if (translating || Object.keys(translatedText).length === 0) {
    return (
      <div className="space-y-6 pb-8">
        <div className="page-heading-surface">
          <div className="animate-pulse flex items-center gap-2">
            <Heart className="w-6 h-6" />
            <h2 className="text-2xl font-black">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="mission-heading">
        <div>
          <h2>{translatedText.title}</h2>
          <p className="text-sm opacity-90">{translatedText.subtitle}</p>
        </div>
      </div>

      {/* Mission Statement */}
      <section className="mission-editorial">
        <h3 className="mb-4 font-serif text-2xl font-medium tracking-tight text-slate-900">{translatedText.missionTitle}</h3>
        <p className="mb-3 max-w-3xl text-base leading-7 text-slate-700">
          {translatedText.missionDesc1}
        </p>
        <p className="max-w-3xl text-base leading-7 text-slate-700">
          {translatedText.missionDesc2}
        </p>
      </section>

      {/* Features Grid */}
      <section className="mission-features">
        <h3 className="mb-2 font-serif text-xl font-medium tracking-tight text-slate-900">
          {translatedText.exploreFeatures}
        </h3>
        <div className="mt-4 divide-y divide-slate-200">
          {features.map((feature) => (
            <div key={feature.title} className="flex gap-4 py-4 first:pt-2 last:pb-0">
              <span className="mt-1 text-slate-500">{feature.icon}</span>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{translatedText[feature.title]}</h4>
                <p className="mt-1 text-sm leading-6 text-slate-600">{translatedText[feature.desc]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The Problem We're Solving */}
      <section className="mission-problem">
        <h3 className="mb-4 text-xl font-black text-gray-900">{translatedText.problemTitle}</h3>
        <p className="mb-3 max-w-3xl text-sm leading-6 text-slate-700">
          {translatedText.problemDesc1}
        </p>
        <p className="max-w-3xl text-sm leading-6 text-slate-700">
          {translatedText.problemDesc2}
        </p>
      </section>

      {/* Design Principles */}
      <section className="mission-principles">
        <h3 className="mb-3 font-serif text-xl font-medium tracking-tight text-slate-900">{translatedText.designPrinciples}</h3>
        <ol className="divide-y divide-slate-200">
          {[translatedText.principle1, translatedText.principle2, translatedText.principle3, translatedText.principle4, translatedText.principle5, translatedText.principle6].map((principle, i) => (
            <li key={i} className="flex gap-4 py-3 text-sm leading-6 text-slate-700">
              <span className="w-6 shrink-0 font-mono text-xs text-slate-400">0{i + 1}</span>{principle}
            </li>
          ))}
        </ol>
      </section>

      {/* Research-Informed */}
      <section className="mission-research">
        <h3 className="mb-4 font-serif text-xl font-medium tracking-tight text-slate-900">{translatedText.researchTitle}</h3>
        <p className="mb-3 max-w-3xl text-sm leading-6 text-slate-700">
          {translatedText.researchDesc1}
        </p>
        <p className="max-w-3xl text-sm leading-6 text-slate-700">
          {translatedText.researchDesc2}
        </p>
      </section>

      {/* FAQ Section */}
      <section className="mission-faq">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {translatedText.faq}
        </h3>
        
        <div className="mission-faq-list">
          {faqItems.map((item, index) => {
            const i = index + 1;
            return (
          <div key={i} className="mission-faq__item">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  aria-expanded={expandedFaq === i}
                  aria-controls={`mission-faq-${i}`}
                  className="mission-faq-trigger w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-sm">
                    {translatedText[item.question]}
                  </span>
                  <ChevronDown 
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      expandedFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                <div
                  id={`mission-faq-${i}`}
                  className={`mission-faq-answer-panel ${expandedFaq === i ? "is-open" : ""}`}
                  aria-hidden={expandedFaq !== i}
                >
                  <div className="mission-faq-answer-inner">
                    <div className="mission-faq-answer text-sm text-gray-600 leading-relaxed">
                      {translatedText[item.answer]}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Get Involved */}
      <section className="mission-involved">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{translatedText.getInvolved}</h3>
        <div className="space-y-3">
          <button
            onClick={(event) => { feedbackTriggerRef.current = event.currentTarget; setShowFeedback(true); }}
            className="mission-involved__action"
          >
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-500" />
              <div className="text-left">
                <p className="font-bold text-gray-900 text-sm">{translatedText.shareFeedback}</p>
                <p className="text-xs text-gray-600">{translatedText.shareFeedbackDesc}</p>
              </div>
            </div>
          </button>

          <a
            href="https://github.com/SmileStreak/SmileStreak"
            target="_blank"
            rel="noopener noreferrer"
            className="mission-involved__action"
          >
            <div className="flex items-center gap-3">
              <Github className="w-4 h-4 text-slate-500" />
              <div className="text-left">
                <p className="font-bold text-gray-900 text-sm">{translatedText.openSource}</p>
                <p className="text-xs text-gray-600">{translatedText.openSourceDesc}</p>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* Feedback Modal - FIXED with clean UI */}
      <Presence open={showFeedback}>
{showFeedback && (
        <div className="t-modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div ref={feedbackDialogRef} role="dialog" aria-modal="true" aria-labelledby="mission-feedback-title" className="mission-feedback-dialog bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <h3 id="mission-feedback-title" className="text-xl font-black text-gray-900">{translatedText.feedbackTitle}</h3>
              </div>
              <button type="button" aria-label={translatedText.closeFeedback || "Close feedback form"} onClick={() => setShowFeedback(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              action="https://formspree.io/f/mqedoavq"
              method="POST"
              className="space-y-4"
            >
              {/* Feedback Type */}
              <div>
                <label htmlFor="mission-feedback-type" className="block text-sm font-semibold text-gray-700 mb-2">
                  {translatedText.feedbackType}
                </label>
                <select
                  id="mission-feedback-type"
                  name="type"
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none bg-white"
                >
                  <option value="general">{translatedText.feedbackGeneral}</option>
                  <option value="bug">{translatedText.feedbackBug}</option>
                  <option value="feature">{translatedText.feedbackFeature}</option>
                </select>
              </div>

              {/* Rating */}
              <div>
                <label id="feedback-rating-label" className="block text-sm font-semibold text-gray-700 mb-2">
                  {translatedText.feedbackRating}
                </label>
                <div className="feedback-rating-options flex gap-2" role="radiogroup" aria-labelledby="feedback-rating-label">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className="cursor-pointer rounded-lg focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-slate-700">
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        aria-label={`${rating} out of 5`}
                        checked={feedbackRating === rating}
                        onChange={(e) => setFeedbackRating(parseInt(e.target.value))}
                        className="sr-only peer"
                      />
                      <div className={`w-12 h-12 flex items-center justify-center border-2 rounded-xl transition-all ${
                        feedbackRating === rating
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-gray-200 hover:border-yellow-300'
                      }`}>
                        <Star aria-hidden="true" className={`w-6 h-6 ${
                          feedbackRating === rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-400'
                        }`} />
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">1 = Not satisfied, 5 = Very satisfied</p>
              </div>

              {/* Email (optional) */}
              <div>
                <label htmlFor="mission-feedback-email" className="block text-sm font-semibold text-gray-700 mb-2">
                  {translatedText.feedbackEmail}
                </label>
                <input
                  id="mission-feedback-email"
                  type="email"
                  name="email"
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="feedbackBox" className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="feedback"
                  id="feedbackBox"
                  required
                  rows={4}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-400 focus:outline-none resize-none"
                  placeholder={translatedText.feedbackPlaceholder}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedback(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {translatedText.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold hover:shadow-lg transition-all hover:scale-[1.02]"
                >
                  {translatedText.submit}
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4">
              Your feedback helps us improve Smile Streak!
            </p>
          </div>
        </div>
      )}
</Presence>

      {/* Disclaimer */}
      <aside className="mission-disclaimer">
        <p>{translatedText.medicalDisclaimer}</p>
        <p>{translatedText.disclaimerText}</p>
      </aside>

      {/* Version & Credits */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400 mb-1">{translatedText.version}</p>
        <p className="text-xs text-gray-400">{translatedText.madeWith}</p>
      </div>
    </div>
  );
}
