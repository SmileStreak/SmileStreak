import {
  Heart, Shield, Target, Users, Lightbulb, Mail, Github, Award, Sparkles,
  CheckCircle2, Globe, Star, TrendingUp, Clock, Zap, Brain, BookOpen, Code,
  Coffee, Palette, Rocket, Smile, ThumbsUp, HelpCircle, MessageCircle, Share2,
  Download, ExternalLink, Lock, Eye, EyeOff, Bell, Calendar, Filter, RefreshCw,
  AlertTriangle, Gift, Crown, Medal, Users2, Building, Microscope, Newspaper,
  BookMarked, Video, Headphones, Instagram, Twitter, Linkedin, Youtube, Facebook,
  MapPin, Camera, Flame, X
} from "lucide-react";
import { useState, useContext, useEffect } from "react";
import { TranslationContext } from "../App";

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
  const { t, currentLanguage, translating } = useContext(TranslationContext);
  const [showFeedback, setShowFeedback] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [translatedText, setTranslatedText] = useState({});
  
  // Feedback form state
  const [feedbackType, setFeedbackType] = useState('general');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackEmail, setFeedbackEmail] = useState('');

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
    disclaimerText: "Smile Streak is designed for education and habit awareness only. It does not provide medical diagnosis or treatment recommendations. Users should always consult a licensed dental professional for personalized advice or concerns about their oral health.",
    version: "Smile Streak v1.0.0",
    madeWith: "Made with ❤️ for better dental health",
    
    exploreFeatures: "Explore Features",
    featureTitle1: "Smart Reminders",
    featureDesc1: "Intelligent notifications that adapt to your schedule and habits",
    featureTitle2: "AI-Powered Insights",
    featureDesc2: "Personalized analytics to help you understand your dental health patterns",
    featureTitle3: "Dentist Finder",
    featureDesc3: "Find top-rated dental professionals near you with our integrated directory",
    featureTitle4: "Progress Tracking",
    featureDesc4: "Visualize your journey with beautiful charts and milestone celebrations",
    featureTitle5: "Scan & Analyze",
    featureDesc5: "Upload photos for AI analysis of your dental hygiene",
    featureTitle6: "Multi-Language Support",
    featureDesc6: "Available in 20+ languages to serve our global community",
    
    badges: "Achievement Badges",
    badge1: "Early Adopter",
    badge2: "Perfect Week",
    badge3: "Streak Master",
    badge4: "Community Hero",
    badge5: "Beta Tester",
    
    connect: "Connect With Us",
    followTwitter: "Follow on Twitter",
    joinDiscord: "Join Discord Community",
    watchYoutube: "Watch on YouTube",
    followInstagram: "Follow on Instagram",
    
    testimonials: "What Our Users Say",
    testimonial1: "This app helped me build a consistent routine for the first time in my life!",
    testimonial2: "The AI scan gave me insights I never would have noticed on my own.",
    testimonial3: "Finally, a dental app that doesn't make me feel guilty about missed days.",
    
    faq: "Frequently Asked Questions",
    faq1q: "Is Smile Streak really free?",
    faq1a: "Yes! Smile Streak is completely free to use with no hidden costs. We believe dental health tools should be accessible to everyone.",
    faq2q: "How does the AI scan work?",
    faq2a: "Our AI analyzes uploaded photos to identify potential areas of concern and provides educational feedback. It's not a diagnostic tool, but helps you understand what to discuss with your dentist.",
    faq3q: "Is my data private?",
    faq3a: "Absolutely. All your data is stored locally on your device by default. Cloud sync is optional and encrypted. We never sell your data to third parties.",
    faq4q: "Can I use Smile Streak with my dentist?",
    faq4a: "Yes! You can export your habit data and share reports directly with your dentist to inform your appointments.",
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
    thankYou: "Thank you for your feedback!"
  };

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      const translations = {};
      for (const [key, value] of Object.entries(translationKeys)) {
        translations[key] = await t(value);
      }
      setTranslatedText(translations);
    };
    
    loadTranslations();
  }, [currentLanguage, t]);

  // Features
  const features = [
    { icon: <Bell className="w-5 h-5" />, title: 'featureTitle1', desc: 'featureDesc1', color: 'blue' },
    { icon: <Brain className="w-5 h-5" />, title: 'featureTitle2', desc: 'featureDesc2', color: 'purple' },
    { icon: <MapPin className="w-5 h-5" />, title: 'featureTitle3', desc: 'featureDesc3', color: 'green' },
    { icon: <TrendingUp className="w-5 h-5" />, title: 'featureTitle4', desc: 'featureDesc4', color: 'orange' },
    { icon: <Camera className="w-5 h-5" />, title: 'featureTitle5', desc: 'featureDesc5', color: 'cyan' },
    { icon: <Globe className="w-5 h-5" />, title: 'featureTitle6', desc: 'featureDesc6', color: 'indigo' }
  ];

  // Badges
  const badges = [
    { name: 'badge1', icon: <Rocket className="w-4 h-4" />, color: 'purple' },
    { name: 'badge2', icon: <Star className="w-4 h-4" />, color: 'yellow' },
    { name: 'badge3', icon: <Flame className="w-4 h-4" />, color: 'orange' },
    { name: 'badge4', icon: <Heart className="w-4 h-4" />, color: 'red' },
    { name: 'badge5', icon: <Award className="w-4 h-4" />, color: 'green' }
  ];

  // Social links - keeping only the GitHub link which exists
  const socialLinks = [
    { icon: <Github className="w-5 h-5" />, label: 'GitHub', url: 'https://github.com/EddieCherian/smile-streak', color: 'gray' }
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
        <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-500 text-white rounded-3xl p-6 shadow-xl">
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
      <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-500 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-6 h-6" />
            <h2 className="text-2xl font-black">{translatedText.title}</h2>
          </div>
          <p className="text-sm opacity-90">{translatedText.subtitle}</p>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="bg-white p-6 rounded-3xl shadow-lg border border-blue-100">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 mb-2">{translatedText.missionTitle}</h3>
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          {translatedText.missionDesc1}
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          {translatedText.missionDesc2}
        </p>
      </div>

      {/* Features Grid */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-blue-100">
        <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-600" />
          {translatedText.exploreFeatures}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {features.map((feature, i) => (
            <div key={i} className={`p-4 rounded-xl bg-${feature.color}-50 border-2 border-${feature.color}-200`}>
              <div className={`w-10 h-10 rounded-xl bg-${feature.color}-500 flex items-center justify-center mb-3 text-white`}>
                {feature.icon}
              </div>
              <h4 className="font-bold text-gray-900 text-sm mb-1">{translatedText[feature.title]}</h4>
              <p className="text-xs text-gray-600">{translatedText[feature.desc]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The Problem We're Solving */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-3xl p-6 shadow-lg">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-black text-gray-900">{translatedText.problemTitle}</h3>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          {translatedText.problemDesc1}
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          {translatedText.problemDesc2}
        </p>
      </div>

      {/* Design Principles */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-blue-100">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-black text-gray-900">{translatedText.designPrinciples}</h3>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[
            { icon: <Lightbulb className="w-4 h-4" />, text: translatedText.principle1, color: "blue" },
            { icon: <Target className="w-4 h-4" />, text: translatedText.principle2, color: "green" },
            { icon: <Heart className="w-4 h-4" />, text: translatedText.principle3, color: "pink" },
            { icon: <Lock className="w-4 h-4" />, text: translatedText.principle4, color: "purple" },
            { icon: <Sparkles className="w-4 h-4" />, text: translatedText.principle5, color: "cyan" },
            { icon: <Eye className="w-4 h-4" />, text: translatedText.principle6, color: "orange" }
          ].map((principle, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl bg-${principle.color}-50 border border-${principle.color}-200`}>
              <div className={`text-${principle.color}-600`}>{principle.icon}</div>
              <p className="text-sm text-gray-700 font-medium">{principle.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-3xl p-6 shadow-lg">
        <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
          <Crown className="w-6 h-6 text-yellow-600" />
          {translatedText.badges}
        </h3>
        
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, i) => (
            <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-full bg-${badge.color}-100 border border-${badge.color}-300`}>
              <span className={`text-${badge.color}-600`}>{badge.icon}</span>
              <span className="text-xs font-medium text-gray-700">{translatedText[badge.name]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Research-Informed */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-6 shadow-lg border-2 border-purple-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Microscope className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-black text-gray-900">{translatedText.researchTitle}</h3>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          {translatedText.researchDesc1}
        </p>
        <p className="text-sm text-gray-700 leading-relaxed">
          {translatedText.researchDesc2}
        </p>
      </div>

      {/* Testimonials */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-blue-100">
        <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          {translatedText.testimonials}
        </h3>
        
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-700 italic">"{translatedText[`testimonial${i}`]}"</p>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-blue-100">
        <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          {translatedText.faq}
        </h3>
        
        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const i = index + 1;
            return (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
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
                
                {expandedFaq === i && (
                  <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                    {translatedText[item.answer]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Get Involved */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-blue-100">
        <h3 className="text-lg font-black text-gray-900 mb-4">{translatedText.getInvolved}</h3>
        <div className="space-y-3">
          <button
            onClick={() => setShowFeedback(true)}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900 text-sm">{translatedText.shareFeedback}</p>
                <p className="text-xs text-gray-600">{translatedText.shareFeedbackDesc}</p>
              </div>
            </div>
          </button>

          <a
            href="https://github.com/EddieCherian/smile-streak"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50 border-2 border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Github className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-900 text-sm">{translatedText.openSource}</p>
                <p className="text-xs text-gray-600">{translatedText.openSourceDesc}</p>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Feedback Modal - FIXED with clean UI */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-black text-gray-900">{translatedText.feedbackTitle}</h3>
              </div>
              <button onClick={() => setShowFeedback(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {translatedText.feedbackType}
                </label>
                <select
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {translatedText.feedbackRating}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <label key={rating} className="cursor-pointer">
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={feedbackRating === rating}
                        onChange={(e) => setFeedbackRating(parseInt(e.target.value))}
                        className="sr-only peer"
                      />
                      <div className={`w-12 h-12 flex items-center justify-center border-2 rounded-xl transition-all ${
                        feedbackRating === rating
                          ? 'border-yellow-400 bg-yellow-50'
                          : 'border-gray-200 hover:border-yellow-300'
                      }`}>
                        <Star className={`w-6 h-6 ${
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {translatedText.feedbackEmail}
                </label>
                <input
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
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

      {/* Disclaimer */}
      <div className="bg-yellow-50 p-6 rounded-3xl border-2 border-yellow-200 shadow-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-gray-900 text-sm mb-2">{translatedText.medicalDisclaimer}</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {translatedText.disclaimerText}
            </p>
          </div>
        </div>
      </div>

      {/* Version & Credits */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400 mb-1">{translatedText.version}</p>
        <p className="text-xs text-gray-400">{translatedText.madeWith}</p>
      </div>
    </div>
  );
}