import {
  Shield, FileText, Lock, AlertTriangle,
  Download, Trash2, Database, CheckCircle
} from "lucide-react";
import { useState, useContext, useEffect, useRef } from "react";
import { deleteUser, reauthenticateWithPopup } from "firebase/auth";
import { auth, db, provider } from "../firebase";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { TranslationContext } from "../App";
import { calculateStreaks } from "../utils/progress";
import Presence from "./Presence";

export default function Legal({ onAnalyticsChoice, analyticsChoice, savingAnalyticsChoice = false }) {
  const { t, currentLanguage, translating } = useContext(TranslationContext);
  const [open, setOpen] = useState(null);
  const [exported, setExported] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [sent, setSent] = useState(false);
  const [supportError, setSupportError] = useState(false);
  const [translatedText, setTranslatedText] = useState({});
  const deleteTriggerRef = useRef(null);
  const deleteCancelRef = useRef(null);
  const deleteConfirmRef = useRef(null);
  const deletePendingRef = useRef(false);
  deletePendingRef.current = deletePending;

  // Translation keys
  const translationKeys = {
    title: "Legal & Privacy",
    subtitle: "Transparency, safety, and control over your data.",
    educationalPurpose: "Educational Purpose",
    educationalContent: "SmileStreak is an educational habit-building tool. Any AI feedback, reports, or insights are informational only and do not replace professional dental advice, diagnosis, or treatment.",
    userResponsibility: "User Responsibility",
    userResponsibilityContent: "You are responsible for your health decisions. Always consult a licensed dental professional for medical concerns.",
    imageProcessing: "Image & Scan Processing",
    imageProcessingContent: "Only after you confirm in the scan flow, the selected photo is sent to Google's Gemini service for general educational observations. Saving the photo and feedback in this browser is a separate choice and is off by default. Avoid photos with faces or identifying details. This feedback is not a dental examination, diagnosis, or treatment recommendation.",
    privacyData: "Privacy & Data Use",
    privacyDataContent: "Habit progress is stored in this browser and, when you sign in, synced to Firebase Firestore with your profile details. The 18+ age-check result is saved only in this browser; your date of birth is not saved or sent to Firebase Analytics. Optional Firebase Analytics is off unless you choose Allow analytics. You can change this choice below.",
    liability: "Using SmileStreak",
    liabilityContent: "SmileStreak provides habit tracking and general educational information. It is not a dental exam, diagnosis, or treatment plan. Contact a licensed dental professional about symptoms or concerns.",
    termsOfUse: "Terms of Use",
    termsOfUseContent: "Use SmileStreak for personal dental-habit tracking and general education. The app is not a dental service and does not provide examinations, diagnoses, treatment recommendations, or emergency care. AI and directory information can be inaccurate or out of date; verify important information with a licensed dental professional or the dental office. This version has no paid subscription or checkout. Google Maps Platform terms apply when you use the dentist directory; Google, Firebase, Gemini, and Formspree have separate service terms and privacy practices linked below.",
    cookiePolicy: "Cookies & Browser Storage",
    cookiePolicyContent: "Browser storage supports app settings, saved progress, sign-in, reminders, and a local 18+ confirmation so you do not need to repeat the check on this device. Your date of birth is not stored. Optional Firebase Analytics is off unless you opt in and may use analytics identifiers or cookies; the age confirmation is not sent as an Analytics event or user property. The current app does not use advertising cookies. Use the controls below to allow or disable optional analytics; your choice is stored on this device.",
    yourDataControls: "Your Data Controls",
    exportReport: "Export browser habit and scan data",
    resetApp: "Delete SmileStreak data",
    confirmTitle: "Delete SmileStreak data?",
    cancel: "Cancel",
    deleting: "Deleting…",
    deleteFailure: "We couldn’t finish deleting your data. Some synced records may already have been removed. Try again, or contact support if the problem continues.",
    contactSupport: "Contact Support",
    messageSent: "Message sent successfully.",
    yourEmail: "Your email",
    describeIssue: "Describe your issue...",
    sendMessage: "Send Message",
    hide: "Hide",
    view: "View",
    version: "SmileStreak v1.1.1",
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
    confirmReset: "This permanently deletes your SmileStreak Firebase account and profile, removes saved notification tokens, clears this browser's SmileStreak data, and signs you out. It does not delete your Google Account or copies held by third-party providers or support services. Continue?",
    exportSuccess: "Report exported successfully!",
    exportFailure: "SmileStreak couldn’t read your saved data for export. Your browser data has not been changed.",
    deleteSuccess: "SmileStreak data deleted. Refreshing...",
    
    // Data control descriptions
    exportDesc: "Download habit progress and scan history saved in this browser",
    resetDesc: "Delete your SmileStreak Firebase profile and notification tokens, then clear this browser's app data. This does not delete your Google Account or information already held by support or service providers."
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

  useEffect(() => {
    if (!showDeleteConfirm) return undefined;
    const previousFocus = document.activeElement;
    deleteCancelRef.current?.focus();
    const handleDialogKeyDown = (event) => {
      if (event.key === "Escape" && !deletePendingRef.current) {
        event.preventDefault();
        setShowDeleteConfirm(false);
      }
      if (event.key !== "Tab") return;
      const focusable = [deleteCancelRef.current, deleteConfirmRef.current].filter((element) => element && !element.disabled);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !focusable.includes(document.activeElement))) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleDialogKeyDown);
    return () => {
      document.removeEventListener("keydown", handleDialogKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [showDeleteConfirm]);

  const toggle = (section) => {
    setOpen(open === section ? null : section);
  };

  /* ---------------------------
     ADVANCED EXPORT
  --------------------------- */
  const exportData = () => {
    setExportError(false);
    try {
    const habits = JSON.parse(localStorage.getItem("habitData") || "{}");
    const scans = JSON.parse(localStorage.getItem("scanHistory") || "[]");
    if (!habits || typeof habits !== "object" || Array.isArray(habits) || !Array.isArray(scans)) {
      throw new TypeError("Saved export data has an unexpected shape");
    }
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
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);

    setExported(true);
    setTimeout(() => setExported(false), 4000);
    } catch (error) {
      console.error("Could not export SmileStreak data:", error);
      setExportError(true);
    }
  };

  /* ---------------------------
     TRUE RESET
  --------------------------- */
  const deleteData = async () => {
    setDeleteError(false);
    setDeletePending(true);
    try {
      if (auth.currentUser) {
        localStorage.setItem("smilestreak-deleting-profile", "true");
        await reauthenticateWithPopup(auth.currentUser, provider);
        const notificationTokens = await getDocs(collection(db, "users", auth.currentUser.uid, "notificationTokens"));
        await Promise.all(notificationTokens.docs.map((tokenDoc) => deleteDoc(tokenDoc.ref)));
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
      setShowDeleteConfirm(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      try { localStorage.removeItem("smilestreak-deleting-profile"); } catch (storageError) {
        console.error("Could not clear the account-deletion marker:", storageError);
      }
      console.error("Could not delete SmileStreak data:", error);
      setDeleteError(true);
    } finally {
      setDeletePending(false);
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
    <div className="legal-page space-y-6 pb-10">

      {/* HERO */}
      <div className="page-heading-surface relative overflow-hidden">
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
      <div className="legal-terms-index overflow-hidden rounded-xl border border-slate-200 bg-white">
        {sections.map((s) => (
          <div key={s.id} className="border-b last:border-none border-gray-100">
            <button
              onClick={() => toggle(s.id)}
              aria-expanded={open === s.id}
              aria-controls={`legal-section-${s.id}`}
              className="w-full flex items-center justify-between p-5 text-left transition-colors duration-200 ease-out hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#52777b]"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="text-slate-500">{s.icon}</div>
                <span className="font-semibold text-slate-900 text-sm">
                  {s.id}. {translatedText[s.titleKey]}
                </span>
              </div>
              <span className="text-gray-400 text-xs">
                {open === s.id ? translatedText.hide : translatedText.view}
              </span>
            </button>

            {open === s.id && (
              <div id={`legal-section-${s.id}`} className="px-5 pb-5 pl-14 text-sm leading-6 text-slate-700">
                {translatedText[s.contentKey]}
              </div>
            )}
          </div>
        ))}
      </div>

      <section className="legal-details-panel rounded-xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="privacy-details-title">
        <h3 id="privacy-details-title" className="text-lg font-semibold text-slate-900">What the app uses</h3>
        <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
          <p><strong>Account and synced data.</strong> Google sign-in provides your account identity. SmileStreak stores your email, display name, profile photo URL, username, language, theme, habit progress (which can include mood selections, reflections, aligner schedules, and dentist visit dates), leaderboard values, and notification token in Firebase services.</p>
          <p><strong>On this device.</strong> The app uses browser local storage for preferences, habit records, dentist favorites, reminders, the self-reported 18+ confirmation, and any scan history you choose to save. The date of birth itself is not stored. Scan history saving is off by default; you can delete saved scans individually or clear site data. Clearing site data removes this browser copy and signs you out; it does not delete your Google account or the synced Firebase profile.</p>
          <p><strong>Scans and AI questions.</strong> After you confirm in the scan flow, the selected image is sent to Google's Gemini API for general educational observations. It is saved in browser history only if you separately turn on that option. Questions entered in the dentist assistant (up to 1,200 characters) are also sent to Gemini. Google’s handling differs between paid and unpaid API service; SmileStreak does not currently tell you which quota is active. Do not submit sensitive, confidential, or identifying information. AI output can be wrong and must not guide diagnosis or treatment.</p>
          <p><strong>Location and directory listings.</strong> When you search for nearby dentists, the browser requests your location and sends the coordinates through SmileStreak's server to Google Places after you grant location permission. Business details, photos, and ratings shown in the directory come from Google Maps and may be incomplete or outdated; confirm information with the office.</p>
          <p><strong>Cookies and local storage.</strong> SmileStreak uses browser storage for settings, reminders, progress, scan history, and a local self-reported 18+ confirmation. The date of birth is not stored; the confirmation is not sent to Firebase Analytics. Optional Firebase Analytics is disabled unless you accept it; its app events cover Today screen visits and duration plus basic timer and sharing interactions. Habit check-ins, mood selections, reflections, aligner details, dentist visit dates, and the age confirmation are not sent in those custom events or as Analytics user properties. When enabled, Analytics may use analytics identifiers or cookies. This app does not currently run ad-cookie or advertising systems. Your choice is saved in browser storage, and you can change it here or with Cookie preferences in the footer. If browser storage is unavailable, analytics stays off unless an existing saved opt-in can be read.</p>
          <p><strong>Notifications.</strong> If you enable browser notifications, Firebase Cloud Messaging creates a notification token that is saved with your profile so reminders can be delivered.</p>
          <p><strong>Feedback.</strong> Messages sent through the feedback or support forms are submitted to Formspree and routed to SmileStreak support. Include only information needed to describe the issue; do not send health records or sensitive dental details.</p>
          <p><strong>Payments and age access.</strong> This version has no in-app checkout or subscription flow. Before the interactive app loads, SmileStreak asks for a self-reported date of birth, checks it in memory, and saves only an “18+ confirmed” flag in this browser. The date is not saved or independently verified. Visitors who report being under 18 see general brushing tips only. The check can be bypassed and is not identity verification or a reliable age-assurance system; access controls and provider eligibility may require further review.</p>
          <p><strong>Contact and provider policies.</strong> Support messages can be sent using the form below. Provider terms and privacy practices apply to their services: <a className="underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google Privacy Policy</a>, <a className="underline" href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Gemini API Additional Terms</a>, <a className="underline" href="https://cloud.google.com/maps-platform/terms" target="_blank" rel="noreferrer">Google Maps Platform Terms</a>, <a className="underline" href="https://firebase.google.com/support/privacy" target="_blank" rel="noreferrer">Firebase Privacy and Security</a>, <a className="underline" href="https://firebase.google.com/terms" target="_blank" rel="noreferrer">Firebase Terms</a>, and <a className="underline" href="https://formspree.io/legal/privacy-policy/" target="_blank" rel="noreferrer">Formspree Privacy Policy</a>.</p>
          <p className="text-xs text-slate-500">This notice describes behavior visible in the current app code. It is not legal advice, does not establish legal compliance, and does not specify provider retention periods. Last updated October 17, 2026.</p>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <span className="text-sm text-slate-700">Optional Firebase Analytics: <strong>{analyticsChoice === "granted" ? "Allowed" : analyticsChoice === "denied" ? "Off" : "Not enabled"}</strong></span>
          <button type="button" disabled={savingAnalyticsChoice} aria-busy={savingAnalyticsChoice} onClick={() => onAnalyticsChoice?.(false)} className="legal-consent-choice rounded-md border border-slate-300 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">Reject optional analytics</button>
          <button type="button" disabled={savingAnalyticsChoice} aria-busy={savingAnalyticsChoice} onClick={() => onAnalyticsChoice?.(true)} className="legal-consent-choice rounded-md border border-slate-300 px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60">Accept optional analytics</button>
        </div>
      </section>

      {/* DATA CONTROLS */}
      <section className="legal-controls-panel" aria-labelledby="legal-controls-title">
        <h3 className="mb-4 font-serif text-xl font-medium tracking-tight text-slate-900">
          <span id="legal-controls-title">{translatedText.yourDataControls}</span>
        </h3>

        <div className="grid gap-3">
          <button type="button" onClick={exportData} className="legal-data-action">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-slate-600" />
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
            ref={deleteTriggerRef}
            type="button"
            onClick={() => { setDeleteError(false); setShowDeleteConfirm(true); }}
            className="legal-data-action legal-data-action--destructive"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-slate-600" />
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
        {exportError && <p className="legal-data-error" role="alert">{translatedText.exportFailure || "SmileStreak couldn’t read your saved data for export. Your browser data has not been changed."}</p>}
        <p className="mt-3 text-xs leading-5 text-slate-600">Deleting removes your SmileStreak Firebase account, synced profile, and data saved in this browser. It does not delete the Google Account used to sign in or messages already submitted to support.</p>
      </section>

      {/* SUPPORT FORM */}
      <section className="legal-support-panel" aria-labelledby="legal-support-title">
        <h3 className="mb-4 font-serif text-xl font-medium tracking-tight text-slate-900">
          <span id="legal-support-title">{translatedText.contactSupport}</span>
        </h3>

        {sent ? (
          <div className="legal-support-success bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
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
              className="w-full p-4 rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none transition-colors"
            />

            <label htmlFor="support-message" className="sr-only">{translatedText.describeIssue}</label>
            <textarea
              id="support-message"
              name="message" 
              placeholder={translatedText.describeIssue} 
              required 
              rows={4}
              className="w-full p-4 rounded-xl border border-gray-200 focus:border-blue-400 focus:outline-none resize-none transition-colors"
            />

            <label className="flex items-start gap-2 text-xs leading-5 text-slate-600">
              <input type="checkbox" required className="mt-1" />
              <span>I understand my email and message will be sent to Formspree and SmileStreak support to respond to this request.</span>
            </label>

            <button 
              type="submit"
              className="legal-primary-action w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-xl font-bold transition-all"
            >
              {translatedText.sendMessage}
            </button>
            {supportError && <p role="alert" className="text-sm font-medium text-red-700">Your message could not be sent. Please try again.</p>}
          </form>
        )}
      </section>

      <Presence open={showDeleteConfirm}>
        {showDeleteConfirm && (
          <div
            className="t-modal-backdrop legal-delete-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={(event) => {
              if (event.target === event.currentTarget && !deletePending) setShowDeleteConfirm(false);
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="legal-delete-title"
              aria-describedby="legal-delete-description"
              className="legal-delete-dialog rounded-xl"
            >
              <p className="legal-delete-eyebrow">{translatedText.yourDataControls}</p>
              <h3 id="legal-delete-title">{translatedText.confirmTitle || "Delete SmileStreak data?"}</h3>
              <p id="legal-delete-description">{translatedText.confirmReset || "This permanently deletes your SmileStreak account and profile, saved notification tokens, and this browser’s SmileStreak data. It does not delete your Google Account or copies held by third parties."}</p>
              {deletePending && <p className="legal-delete-progress" role="status">{translatedText.deleting || "Deleting…"}</p>}
              {deleteError && <p className="legal-delete-error" role="alert">{translatedText.deleteFailure || "We couldn’t finish deleting your data. Some synced records may already have been removed. Try again, or contact support if the problem continues."}</p>}
              <div className="legal-delete-actions">
                <button
                  ref={deleteCancelRef}
                  type="button"
                  aria-disabled={deletePending}
                  onClick={() => { if (!deletePending) setShowDeleteConfirm(false); }}
                  className="legal-delete-cancel"
                >
                  {translatedText.cancel || "Cancel"}
                </button>
                <button
                  ref={deleteConfirmRef}
                  type="button"
                  disabled={deletePending}
                  aria-busy={deletePending}
                  onClick={deleteData}
                  className="legal-delete-submit"
                >
                  {deletePending ? (translatedText.deleting || "Deleting…") : (translatedText.resetApp || "Delete data")}
                </button>
              </div>
            </div>
          </div>
        )}
      </Presence>

      {/* EXPORT SUCCESS MESSAGE */}
      {exported && (
        <div className="legal-export-toast" role="status" aria-live="polite">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">{translatedText.exportSuccess}</span>
        </div>
      )}

      {/* FOOTER */}
      <div className="border-t border-slate-200 pt-4 text-center">
        <p className="text-xs text-slate-600">
          {translatedText.version} • {translatedText.lastUpdated} {new Date().toLocaleDateString()}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-2">
          <Lock className="w-3 h-3 text-slate-500" />
          <span className="text-xs text-slate-600">For general education and habit tracking. Not a diagnosis or treatment recommendation.</span>
          <span className="text-xs text-slate-500">•</span>
          <Shield className="w-3 h-3 text-slate-500" />
          <span className="text-xs text-slate-600">Contact a licensed dental professional about personal concerns.</span>
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
