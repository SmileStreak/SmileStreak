import {
  Shield, FileText, Lock, AlertTriangle,
  Download, Trash2, Database, CheckCircle
} from "lucide-react";
import { useState, useContext, useEffect } from "react";
import { deleteUser, reauthenticateWithPopup, signOut } from "firebase/auth";
import { auth, db, provider } from "../firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { TranslationContext } from "../App";
import { calculateStreaks } from "../utils/progress";

export default function Legal({ onAnalyticsChoice }) {
  const { t, currentLanguage, translating } = useContext(TranslationContext);
  const [open, setOpen] = useState(null);
  const [exported, setExported] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [sent, setSent] = useState(false);
  const [supportError, setSupportError] = useState(false);
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
    imageProcessingContent: "Scan photos are sent to Google's Gemini service to generate educational feedback and are also kept in your browser's scan history until you remove them or clear local app data. Do not upload an image you do not have permission to share.",
    privacyData: "Privacy & Data Use",
    privacyDataContent: "Habit progress is stored in this browser and, when you sign in, synced to Firebase Firestore with your profile details. Optional Firebase Analytics is off unless you choose Allow analytics. You can change this choice below.",
    liability: "Using SmileStreak",
    liabilityContent: "SmileStreak provides habit tracking and general educational information. It is not a dental exam, diagnosis, or treatment plan. Contact a licensed dental professional about symptoms or concerns.",
    termsOfUse: "Terms of Use",
    termsOfUseContent: "Use SmileStreak for personal dental-habit tracking and general educational information. Do not rely on the app for diagnosis, treatment decisions, or emergency care. Directory listings, ratings, and opening details can change; verify them directly with the provider. The current app has no paid subscription or checkout flow. Google Maps Platform terms apply to Places data in the directory and are incorporated by reference; Google, Firebase, Gemini, and Formspree services are also subject to their own terms.",
    cookiePolicy: "Cookies & Browser Storage",
    cookiePolicyContent: "Necessary browser storage supports app settings, saved progress, sign-in, and reminders. Optional Firebase Analytics is off unless you opt in and may use analytics identifiers or cookies. The current app does not use advertising cookies. Use the controls below to allow or disable optional analytics; your choice is stored on this device.",
    yourDataControls: "Your Data Controls",
    exportReport: "Export browser habit and scan data",
    resetApp: "Delete SmileStreak data",
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
    habitsTracked: "Days with saved habit data",
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
    confirmReset: "This deletes the signed-in SmileStreak Firebase account and synced profile, if present, clears this browser's app data, and signs you out. Your Google Account is not deleted. Continue?",
    exportSuccess: "Report exported successfully!",
    deleteSuccess: "SmileStreak data deleted. Refreshing...",
    
    // Data control descriptions
    exportDesc: "Download habit progress and scan history saved in this browser",
    resetDesc: "If signed in, delete your SmileStreak profile and synced data. Also clears this browser's app data; your Google Account remains."
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
    },
    {
      id: 6,
      titleKey: "termsOfUse",
      contentKey: "termsOfUseContent",
      icon: <FileText className="w-5 h-5" />
    },
    {
      id: 7,
      titleKey: "cookiePolicy",
      contentKey: "cookiePolicyContent",
      icon: <Lock className="w-5 h-5" />
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
    const habits = JSON.parse(localStorage.getItem("habitData") || "{}");
    const scans = JSON.parse(localStorage.getItem("scanHistory") || "[]");
    const { longestStreak } = calculateStreaks(habits);

    const report = {
      profile: {
        exportedAt: new Date().toISOString(),
        app: "SmileStreak"
      },
      summary: {
        daysTracked: Object.keys(habits).filter((key) => !key.startsWith("__")).length,
        longestStreak,
        scansUploaded: scans.length
      },
      insights: {
        consistency:
          longestStreak > 14 ? translatedText.high || "High"
          : longestStreak > 5 ? translatedText.moderate || "Moderate"
          : translatedText.developing || "Developing"
      },
      rawData: { habits, scans }
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

    setDeleteError(false);
    try {
      if (auth.currentUser) {
        localStorage.setItem("smilestreak-deleting-profile", "true");
        await reauthenticateWithPopup(auth.currentUser, provider);
        await deleteDoc(doc(db, "users", auth.currentUser.uid));
        await deleteUser(auth.currentUser);
      }
      localStorage.clear();
      if (indexedDB.databases) {
        const databases = await indexedDB.databases();
        databases.forEach((database) => {
          if (database.name) indexedDB.deleteDatabase(database.name);
        });
      }
      setDeleted(true);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      localStorage.removeItem("smilestreak-deleting-profile");
      try { await signOut(auth); } catch {}
      console.error("Could not delete SmileStreak data:", error);
      setDeleteError(true);
    }
  };

  /* ---------------------------
     FORM FIX (REACT SAFE)
  --------------------------- */
  const submitForm = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    setSupportError(false);
    try {
      const response = await fetch("https://formspree.io/f/mqedoavq", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("Support request failed");
      setSent(true);
      e.target.reset();
    } catch {
      setSupportError(true);
    }
  };

  // Show loading state while translating
  if (translating || Object.keys(translatedText).length === 0) {
    return (
      <div className="space-y-6 pb-10">
        <div className="page-heading-surface">
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
      <div className="page-heading-surface relative overflow-hidden">
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
              aria-expanded={open === s.id}
              aria-controls={`legal-section-${s.id}`}
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
              <div id={`legal-section-${s.id}`} className="px-5 pb-5 text-sm text-gray-700 leading-relaxed">
                {translatedText[s.contentKey]}
              </div>
            )}
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="privacy-details-title">
        <h3 id="privacy-details-title" className="text-lg font-semibold text-slate-900">What the app uses</h3>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
          <p><strong>Account and synced data.</strong> Google sign-in provides your account identity. SmileStreak stores your email, display name, profile photo URL, username, language, theme, habit progress (which can include mood selections, reflections, aligner schedules, and dentist visit dates), leaderboard values, and notification token in Firebase services.</p>
          <p><strong>On this device.</strong> The app uses browser local storage for preferences, habit records, dentist favorites, reminders, and scan history (including scan images and generated feedback). Clearing site data removes this browser copy and signs you out; it does not delete your Google account or the synced Firebase profile.</p>
          <p><strong>Scans and AI questions.</strong> When you request a scan, the selected image is sent to Google's Gemini service to generate educational feedback and is also kept in your browser's scan history until you remove it or clear local app data. Questions entered in the dentist AI assistant are also sent to Gemini. Avoid entering identifying or sensitive health information.</p>
          <p><strong>Location and directory listings.</strong> When you search for nearby dentists, the browser shares your location with Google Places after you grant location permission. Business details and ratings shown in the directory come from Google Maps and may be incomplete or outdated; confirm information with the office.</p>
          <p><strong>Cookies and local storage.</strong> SmileStreak uses browser storage for settings, reminders, progress, and scan history. Firebase Analytics is disabled until you choose “Allow analytics”; its app events cover Today screen visits and duration plus basic timer and sharing interactions. Habit check-ins, mood selections, reflections, aligner details, and dentist visit dates are not sent in those custom events. When enabled, Analytics may use analytics identifiers or cookies. This app does not currently run ad-cookie or advertising systems. You can change the analytics choice here at any time.</p>
          <p><strong>Notifications.</strong> If you enable browser notifications, Firebase Cloud Messaging creates a notification token that is saved with your profile so reminders can be delivered.</p>
          <p><strong>Feedback.</strong> Messages sent through the feedback or support forms are submitted to Formspree and routed to SmileStreak support. Include only information needed to describe the issue; do not send health records or sensitive dental details.</p>
          <p><strong>Payments and younger visitors.</strong> This version has no in-app checkout or subscription flow. Before the interactive app loads, SmileStreak asks for a date of birth and uses it only in memory to choose an experience; the date is not saved. Visitors under 13 see general brushing tips only. This view has no account, saved progress, scans, location search, reminders, or support submission. Verified parental consent is not currently available, so those interactive features are not offered to under-13 visitors.</p>
          <p><strong>Contact and provider policies.</strong> Support messages can be sent using the form below. Data handled by third-party providers is also subject to their policies: <a className="underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google Privacy Policy</a>, <a className="underline" href="https://cloud.google.com/maps-platform/terms" target="_blank" rel="noreferrer">Google Maps Platform Terms</a>, and <a className="underline" href="https://formspree.io/legal/privacy-policy/" target="_blank" rel="noreferrer">Formspree Privacy Policy</a>.</p>
          <p className="text-xs text-slate-500">This page describes behavior visible in the current app code. It does not establish legal compliance or specify provider retention periods. Last updated October 16, 2026.</p>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <span className="text-sm text-slate-700">Optional analytics:</span>
          <button type="button" onClick={() => onAnalyticsChoice?.(true)} className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Allow analytics</button>
          <button type="button" onClick={() => onAnalyticsChoice?.(false)} className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">Turn analytics off</button>
        </div>
      </section>

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
            {exported && <CheckCircle className="text-green-500 w-5 h-5" />}
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
            {deleted && <CheckCircle className="text-green-500 w-5 h-5" />}
          </button>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-600">Deleting removes your SmileStreak Firebase account, synced profile, and data saved in this browser. It does not delete the Google Account used to sign in or messages already submitted to support.</p>
        {deleteError && <p role="alert" className="mt-3 text-sm font-medium text-red-700">SmileStreak could not delete the synced profile. Check your connection and try again.</p>}
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
            <p className="text-sm text-slate-600">Your message and email are sent to Formspree and SmileStreak support. Please do not include dental or other sensitive health details.</p>
            <label htmlFor="support-email" className="sr-only">{translatedText.yourEmail}</label>
            <input
              id="support-email"
              type="email" 
              name="email" 
              placeholder={translatedText.yourEmail} 
              required
              className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors" 
            />

            <label htmlFor="support-message" className="sr-only">{translatedText.describeIssue}</label>
            <textarea
              id="support-message"
              name="message" 
              placeholder={translatedText.describeIssue} 
              required 
              rows={4}
              className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none resize-none transition-colors" 
            />

            <label className="flex items-start gap-2 text-xs leading-5 text-slate-600">
              <input type="checkbox" required className="mt-1" />
              <span>I understand my email and message will be sent to Formspree and SmileStreak support to respond to this request.</span>
            </label>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              {translatedText.sendMessage}
            </button>
            {supportError && <p role="alert" className="text-sm font-medium text-red-700">Your message could not be sent. Please try again.</p>}
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
