import {
  Shield, FileText, Lock, AlertTriangle,
  Download, Trash2, Database, CheckCircle
} from "lucide-react";
import { useState, useContext, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { TranslationContext } from "../App";

export default function Legal() {
  const { t, currentLanguage, translating } = useContext(TranslationContext);
  const [open, setOpen] = useState(null);
  const [exported, setExported] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [sent, setSent] = useState(false);
  const [translatedText, setTranslatedText] = useState({});

  // Translation keys
  const translationKeys = {
    title: "Legal & Privacy",
    subtitle: "Transparency, safety, and control over your data.",
    educationalPurpose: "Educational Purpose",
    educationalContent: "SmileStreak is an educational habit-building tool. Any AI feedback, reports, or insights are informational only and do not replace professional dental advice, diagnosis, or treatment.",
    userResponsibility: "User Responsibility",
    userResponsibilityContent: "You are responsible for your health decisions. Always consult a licensed dental professional for medical concerns.",
    imageProcessing: "Image & Scan Processing",
    imageProcessingContent: "Images uploaded for scans are processed only to generate feedback. SmileStreak does not sell or share scan images.",
    privacyData: "Privacy & Data Use",
    privacyDataContent: "We collect only minimal usage data needed for the app to function. This data improves your experience and app stability.",
    liability: "Liability Limitation",
    liabilityContent: "SmileStreak is not responsible for medical or dental outcomes. Use of this software is voluntary.",
    yourDataControls: "Your Data Controls",
    exportReport: "Export My Full Report",
    resetApp: "Reset SmileStreak Completely",
    contactSupport: "Contact Support",
    messageSent: "Message sent successfully.",
    yourEmail: "Your email",
    describeIssue: "Describe your issue...",
    sendMessage: "Send Message",
    hide: "Hide",
    view: "View",
    version: "SmileStreak v1.0.0",
    lastUpdated: "Last updated",
    
    // Export report sections
    profile: "Profile",
    exportedAt: "Exported at",
    app: "App",
    summary: "Summary",
    habitsTracked: "Habits Tracked",
    longestStreak: "Longest Streak",
    averageStreak: "Average Streak",
    scansUploaded: "Scans Uploaded",
    insights: "Insights",
    consistency: "Consistency",
    high: "High",
    moderate: "Moderate",
    developing: "Developing",
    rawData: "Raw Data",
    
    // Confirmation messages
    confirmReset: "This will completely reset SmileStreak. Continue?",
    exportSuccess: "Report exported successfully!",
    deleteSuccess: "Data deleted successfully! Refreshing...",
    
    // Data control descriptions
    exportDesc: "Download a complete JSON report of all your data",
    resetDesc: "Permanently delete all local data and sign out"
  };

  // Sections data with translation keys
  const sections = [
    {
      id: 1,
      titleKey: "educationalPurpose",
      contentKey: "educationalContent",
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 2,
      titleKey: "userResponsibility",
      contentKey: "userResponsibilityContent",
      icon: <AlertTriangle className="w-5 h-5" />
    },
    {
      id: 3,
      titleKey: "imageProcessing",
      contentKey: "imageProcessingContent",
      icon: <Database className="w-5 h-5" />
    },
    {
      id: 4,
      titleKey: "privacyData",
      contentKey: "privacyDataContent",
      icon: <Lock className="w-5 h-5" />
    },
    {
      id: 5,
      titleKey: "liability",
      contentKey: "liabilityContent",
      icon: <Shield className="w-5 h-5" />
    }
  ];

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

  const toggle = (section) => {
    setOpen(open === section ? null : section);
  };

  /* ---------------------------
     ADVANCED EXPORT
  --------------------------- */
  const exportData = () => {
    const habits = JSON.parse(localStorage.getItem("habits") || "[]");
    const streaks = JSON.parse(localStorage.getItem("streaks") || "[]");
    const scans = JSON.parse(localStorage.getItem("scans") || "[]");

    const longestStreak = Math.max(0, ...streaks.map(s => s.length || 0));
    const avgStreak =
      streaks.length === 0
        ? 0
        : streaks.reduce((a, b) => a + (b.length || 0), 0) / streaks.length;

    const report = {
      profile: {
        exportedAt: new Date().toISOString(),
        app: "SmileStreak"
      },
      summary: {
        habitsTracked: habits.length,
        longestStreak,
        averageStreak: Math.round(avgStreak * 10) / 10,
        scansUploaded: scans.length
      },
      insights: {
        consistency:
          longestStreak > 14 ? translatedText.high || "High"
          : longestStreak > 5 ? translatedText.moderate || "Moderate"
          : translatedText.developing || "Developing"
      },
      rawData: { habits, streaks, scans }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smilestreak-report.json";
    a.click();

    setExported(true);
    setTimeout(() => setExported(false), 4000);
  };

  /* ---------------------------
     TRUE RESET
  --------------------------- */
  const deleteData = async () => {
    if (!confirm(translatedText.confirmReset || "This will completely reset SmileStreak. Continue?")) return;

    localStorage.clear();

    indexedDB.databases?.().then(dbs => {
      dbs.forEach(db => indexedDB.deleteDatabase(db.name));
    });

    try { await signOut(auth); } catch {}

    setDeleted(true);
    setTimeout(() => window.location.reload(), 1500);
  };

  /* ---------------------------
     FORM FIX (REACT SAFE)
  --------------------------- */
  const submitForm = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);

    await fetch("https://formspree.io/f/mqedoavq", {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" }
    });

    setSent(true);
    e.target.reset();
  };

  // Show loading state while translating
  if (translating || Object.keys(translatedText).length === 0) {
    return (
      <div className="space-y-6 pb-10">
        <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-500 text-white rounded-3xl p-6 shadow-xl">
          <div className="animate-pulse flex items-center gap-2">
            <Shield className="w-6 h-6" />
            <h2 className="text-2xl font-black">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">

      {/* HERO */}
      <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-500 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6" />
            <h2 className="text-2xl font-black">{translatedText.title}</h2>
          </div>
          <p className="text-sm opacity-90">
            {translatedText.subtitle}
          </p>
        </div>
      </div>

      {/* ACCORDION TERMS */}
      <div className="bg-white rounded-3xl shadow-lg border border-blue-100 overflow-hidden">
        {sections.map((s) => (
          <div key={s.id} className="border-b last:border-none border-gray-100">
            <button
              onClick={() => toggle(s.id)}
              className="w-full flex items-center justify-between p-5 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="text-blue-600">{s.icon}</div>
                <span className="font-bold text-gray-900 text-sm">
                  {s.id}. {translatedText[s.titleKey]}
                </span>
              </div>
              <span className="text-gray-400 text-xs">
                {open === s.id ? translatedText.hide : translatedText.view}
              </span>
            </button>

            {open === s.id && (
              <div className="px-5 pb-5 text-sm text-gray-700 leading-relaxed">
                {translatedText[s.contentKey]}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* DATA CONTROLS */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-blue-100">
        <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          {translatedText.yourDataControls}
        </h3>

        <div className="grid gap-3">
          <button 
            onClick={exportData}
            className="group flex items-center justify-between p-5 rounded-2xl bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="font-bold text-gray-900 text-sm block">
                  {translatedText.exportReport}
                </span>
                <span className="text-xs text-gray-600">
                  {translatedText.exportDesc}
                </span>
              </div>
            </div>
            {exported && <CheckCircle className="text-green-500 w-5 h-5 animate-bounce" />}
          </button>

          <button 
            onClick={deleteData}
            className="group flex items-center justify-between p-5 rounded-2xl bg-red-50 border-2 border-red-200 hover:bg-red-100 hover:border-red-300 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <span className="font-bold text-gray-900 text-sm block">
                  {translatedText.resetApp}
                </span>
                <span className="text-xs text-gray-600">
                  {translatedText.resetDesc}
                </span>
              </div>
            </div>
            {deleted && <CheckCircle className="text-green-500 w-5 h-5 animate-bounce" />}
          </button>
        </div>
      </div>

      {/* SUPPORT FORM */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-3xl p-6 shadow-lg">
        <h3 className="font-black text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-600" />
          {translatedText.contactSupport}
        </h3>

        {sent ? (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-green-600 font-semibold text-sm">
              {translatedText.messageSent}
            </p>
          </div>
        ) : (
          <form onSubmit={submitForm} className="space-y-3">
            <input 
              type="email" 
              name="email" 
              placeholder={translatedText.yourEmail} 
              required
              className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors" 
            />

            <textarea 
              name="message" 
              placeholder={translatedText.describeIssue} 
              required 
              rows={4}
              className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none resize-none transition-colors" 
            />

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              {translatedText.sendMessage}
            </button>
          </form>
        )}
      </div>

      {/* EXPORT SUCCESS MESSAGE */}
      {exported && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-2 animate-[slideUp_0.3s_ease-out]">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">{translatedText.exportSuccess}</span>
        </div>
      )}

      {/* FOOTER */}
      <div className="text-center pt-4">
        <p className="text-xs text-gray-400">
          {translatedText.version} • {translatedText.lastUpdated} {new Date().toLocaleDateString()}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <Lock className="w-3 h-3 text-gray-300" />
          <span className="text-xs text-gray-300">This app is purely for educational purposes and should not be used for medical advice. </span>
          <span className="text-xs text-gray-300">•</span>
          <Shield className="w-3 h-3 text-gray-300" />
          <span className="text-xs text-gray-300">If you have real medical concerns, contact a dentist. </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
