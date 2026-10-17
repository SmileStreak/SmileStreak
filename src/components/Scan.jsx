import { useState, useRef, useEffect, useContext } from "react";
import {
Camera, Upload, X, History, ArrowLeft, ChevronRight,
AlertCircle, CheckCircle2, Smile, TrendingUp, Image as ImageIcon,
Download, Share2, Printer, Calendar, Clock, MapPin, Phone,
Mail, User, Star, FileText, BarChart3, Brain,
Activity, Shield, Award, Target,
Users, Globe, Lock, Eye, EyeOff, Bell, RefreshCw,
BookOpen
} from "lucide-react";
import { TranslationContext } from "../App";
import Presence from "./Presence";
import { translateBatch } from "../utils/translate.js";

export default function Scan() {
const { currentLanguage, translating } = useContext(TranslationContext);

const [mode, setMode] = useState("select"); // 'select', 'camera', 'upload', 'analyzing', 'results'
const [image, setImage] = useState(null);
const [loading, setLoading] = useState(false);
const [feedback, setFeedback] = useState(null);
const [cameraActive, setCameraActive] = useState(false);
const [guidanceStep, setGuidanceStep] = useState(0);
const [scanHistory, setScanHistory] = useState([]);
const [deletedScan, setDeletedScan] = useState(null);
const [scanConsent, setScanConsent] = useState(false);
const [saveScansLocally, setSaveScansLocally] = useState(false);
const [consentError, setConsentError] = useState("");
const [scanNotice, setScanNotice] = useState(null);
const [shareEmailError, setShareEmailError] = useState("");
const [historySaveFailed, setHistorySaveFailed] = useState(false);
const [showHistory, setShowHistory] = useState(false);
const [captureQuality, setCaptureQuality] = useState(null);
const [translatedText, setTranslatedText] = useState({});
const [showComparison, setShowComparison] = useState(false);
const [selectedScanForComparison, setSelectedScanForComparison] = useState(null);
const [showExportOptions, setShowExportOptions] = useState(false);
const [showShareModal, setShowShareModal] = useState(false);
const [shareEmail, setShareEmail] = useState("");
const [shareNotes, setShareNotes] = useState("");

const videoRef = useRef(null);
const canvasRef = useRef(null);
const streamRef = useRef(null);
const mountedRef = useRef(true);
const undoScanButtonRef = useRef(null);
const scanDialogReturnFocusRef = useRef(null);
const scanHistoryTriggerRef = useRef(null);

const formatScanTimestamp = (scan) => {
const date = new Date(scan.date || scan.timestamp);
return Number.isFinite(date.getTime())
  ? date.toLocaleString(currentLanguage, { dateStyle: "medium", timeStyle: "short" })
  : scan.timestamp || "";
};

// Translation keys - only what's actually used
const translationKeys = {
loading: "Loading…",
title: "Photo observations",
subtitle: "General habit feedback from a single photo",
howItWorks: "How it works",
howItWorksDesc: "A photo is sent to Google Gemini for general, habit-focused observations. It cannot assess your oral health or replace an examination by a dentist.",
photoConsent: "I agree to send this photo to Google Gemini for general educational feedback. It is not a dental exam or diagnosis.",
photoStorageConsent: "Save this photo and its feedback in this browser’s scan history (optional; off by default).",
photoConsentRequired: "Confirm how this photo will be used before continuing.",
guidancePositionTitle: "Position yourself",
guidancePositionInstruction: "Face the camera with good lighting",
guidancePositionTip: "Natural light works best",
guidanceOpenTitle: "Open wide",
guidanceOpenInstruction: "Open your mouth to show all teeth",
guidanceOpenTip: "Relax your jaw and smile naturally",
guidanceSteadyTitle: "Hold steady",
guidanceSteadyInstruction: "Keep still and get ready to take the photo",
guidanceSteadyTip: "When you’re ready, tap the capture button below",
photoTypeError: "Choose a JPEG, PNG, or WebP image.",
photoSizeError: "Choose an image smaller than 3 MB.",
currentOnly: "Mentioned only in this note",
earlierOnly: "Mentioned only in the earlier note",
differenceOnly: "This compares generated wording, not changes in your teeth or gums.",
takePhoto: "Take Photo",
takePhotoDesc: "Use camera with guided capture",
uploadPhoto: "Upload Photo",
uploadPhotoDesc: "Choose from gallery",
tipsTitle: "Tips for best results",
tip1: "\u2713 Use natural lighting or a well-lit room",
tip2: "\u2713 Show all your teeth clearly",
tip3: "\u2713 Keep the camera steady",
tip4: "\u2713 Avoid shadows on your teeth",
back: "Back",
nextStep: "Next Step",
analyzingTitle: "Preparing observations",
analyzingDesc: "The photo is being processed to provide general habit feedback.",
analyzingStep1: "Sending photo...",
analyzingStep2: "Reviewing visible areas...",
analyzingStep3: "Preparing general brushing tips...",
analyzingStep4: "Writing feedback...",
analysisComplete: "Analysis Complete",
analysisCompleteDesc: "General observations from one photo; not a dental examination.",
newScan: "New Scan",
viewHistory: "View History",
trackProgress: "Track Your Progress",
trackProgressDesc: "Save notes if you want to compare feedback over time.",
scanHistory: "Scan History",
noScans: "No scans yet",
scanRemoved: "Scan removed from this browser.",
exportJson: "Export as JSON",
viewDetails: "View Details",
delete: "Delete",
undo: "Undo",
imageTooDark: "Image is too dark",
imageTooBright: "Image is too bright",
goodLighting: "Good lighting!",
failedAnalysis: "Failed to analyze image. Please try again.",
cameraError: "Could not access camera. Please check permissions.",

// Real features
compareScans: "Compare Scans",
improvements: "Mentioned in current feedback",
declines: "Mentioned in earlier feedback",
exportResults: "Export Results",
shareWithDentist: "Share with Dentist",
printResults: "Print Results",
downloadPDF: "Download PDF",
emailResults: "Email Results",
addNotes: "Add notes for your dentist",

shareTitle: "Share with Your Dentist",
shareDesc: "Opens a text-only email draft with your feedback and notes. Your photo is not attached, and nothing is sent until you review and send the email.",
emailPlaceholder: "Dentist's email address",
notesPlaceholder: "Add any notes or questions for your dentist...",
sendEmail: "Open email draft",

comparisonTitle: "Scan Comparison",
comparisonDesc: "Review the feedback saved from two different dates",
currentScan: "Current Scan",
previousScan: "Previous Scan",

exportTitle: "Export Options",
exportDesc: "Download or share your scan results",
tapCapture: "Tap to take photo",
historySaveFailed: "Your browser could not save this scan. The feedback is still available until you leave this page.",
historyNotSaved: "This photo and feedback were not saved to this browser.",
privacyNote: "You can get feedback without saving it here. Optional copies stay in this browser until you delete them or clear site data. Google processes submitted photos under its Gemini API terms. Don’t send sensitive, confidential, or identifying photos.",
closeHistory: "Close scan history",
closeShareDialog: "Close share dialog",
closeExportOptions: "Close export options",
closeComparison: "Close scan comparison",
scanPhotoAlt: "Saved scan photo"
};

// Camera guidance steps
const guidanceSteps = [
{
id: 0,
title: "Position yourself",
titleKey: "guidancePositionTitle",
instruction: "Face the camera with good lighting",
instructionKey: "guidancePositionInstruction",
icon: Camera,
tip: "Natural light works best",
tipKey: "guidancePositionTip"
},
{
id: 1,
title: "Open wide",
titleKey: "guidanceOpenTitle",
instruction: "Open your mouth to show all teeth",
instructionKey: "guidanceOpenInstruction",
icon: Smile,
tip: "Relax your jaw and smile naturally",
tipKey: "guidanceOpenTip"
},
{
id: 2,
title: "Hold steady",
titleKey: "guidanceSteadyTitle",
instruction: "Keep still and get ready to take the photo",
instructionKey: "guidanceSteadyInstruction",
icon: Target,
tip: "When you’re ready, tap the capture button below",
tipKey: "guidanceSteadyTip"
}
];

// Load translations
useEffect(() => {
let active = true;
const loadTranslations = async () => {
const keys = Object.keys(translationKeys);
const values = await translateBatch(Object.values(translationKeys), currentLanguage, "en");
if (active) setTranslatedText(Object.fromEntries(keys.map((key, index) => [key, values[index]])));
};
loadTranslations().catch((error) => console.error("Could not load scan translations:", error));
return () => { active = false; };
}, [currentLanguage]);

// Load scan history from localStorage (real user data)
useEffect(() => {
try {
  const history = JSON.parse(localStorage.getItem('scanHistory') || '[]');
  if (!Array.isArray(history)) throw new TypeError("Scan history is not a list");
  setScanHistory(history);
} catch (error) {
  console.error("Could not read saved scan history:", error);
  setScanNotice({ type: "error", message: "Saved scan history couldn’t be opened. It hasn’t been removed." });
}
}, []);

// Save scan to history (real user data)
const saveScanToHistory = (imageData, feedbackData) => {
const scan = {
id: Date.now(),
date: new Date().toISOString(),
image: imageData,
feedback: feedbackData,
timestamp: new Date().toLocaleString(),
quality: captureQuality?.isGoodQuality ? 'good' : 'poor'
};

const updatedHistory = [scan, ...scanHistory].slice(0, 20);
try {
  localStorage.setItem('scanHistory', JSON.stringify(updatedHistory));
  setScanHistory(updatedHistory);
  return true;
} catch {
  return false;
}
};

useEffect(() => {
  mountedRef.current = true;
  return () => {
    mountedRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };
}, []);

// Compare note wording only. This is not a measure of oral health change.
const compareScans = (currentFeedback, previousFeedback) => {
if (!previousFeedback) return null;

const current = currentFeedback.toLowerCase();
const previous = previousFeedback.toLowerCase();

const currentOnly = [];
const earlierOnly = [];

// Simple text-based comparison based on keywords
const keywords = ['brushing', 'gumline', 'back molars', 'floss', 'cleaning', 'buildup'];

keywords.forEach(keyword => {
  const currentHas = current.includes(keyword);
  const previousHas = previous.includes(keyword);
  
  if (!previousHas && currentHas) {
    currentOnly.push(keyword);
  } else if (previousHas && !currentHas) {
    earlierOnly.push(keyword);
  }
});

return { currentOnly, earlierOnly };
};

// FIXED: set mode first so video element renders, then attach stream
const startCamera = async () => {
if (!scanConsent) {
  setConsentError(translatedText.photoConsentRequired || translationKeys.photoConsentRequired);
  return;
}
setConsentError("");
setScanNotice(null);
setMode('camera');
try {
const stream = await navigator.mediaDevices.getUserMedia({
video: {
facingMode: 'user',
width: { ideal: 1280 },
height: { ideal: 720 }
}
});
if (!mountedRef.current) {
  stream.getTracks().forEach((track) => track.stop());
  return;
}
streamRef.current = stream;
// Wait for video element to mount in DOM
await new Promise(resolve => setTimeout(resolve, 100));
if (mountedRef.current && videoRef.current) {
videoRef.current.srcObject = stream;
setCameraActive(true);
setGuidanceStep(0);
} else {
  stream.getTracks().forEach((track) => track.stop());
  streamRef.current = null;
  if (mountedRef.current) {
    setMode("select");
    setScanNotice({ type: "error", message: "The camera preview couldn’t start. Please try again." });
  }
}
} catch (err) {
if (!mountedRef.current) return;
console.error("Camera error:", err);
setMode('select');
setScanNotice({ type: "error", message: translatedText.cameraError || translationKeys.cameraError });
}
};

// Stop camera
const stopCamera = () => {
if (streamRef.current) {
streamRef.current.getTracks().forEach(track => track.stop());
streamRef.current = null;
}
setCameraActive(false);
setMode('select');
setGuidanceStep(0);
};

// Capture photo from camera
const capturePhoto = () => {
const canvas = canvasRef.current;
const video = videoRef.current;

if (canvas && video && video.videoWidth > 0 && video.videoHeight > 0) {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  const imageData = canvas.toDataURL('image/jpeg', 0.9);
  setImage(imageData);
  
  // Analyze image quality (real brightness calculation)
  analyzeImageQuality(ctx, canvas.width, canvas.height);
  
  // Stop camera first
  stopCamera();
  
  // Then analyze the photo
  setMode('analyzing');
  analyzePhoto(imageData);
} else {
  // Fallback if video dimensions aren't ready
  console.error("Camera not ready for capture");
  // Try again after a short delay
  setTimeout(() => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      capturePhoto();
    } else {
      setScanNotice({ type: "error", message: "Camera isn’t ready yet. Keep the preview open and try again." });
    }
  }, 500);
}
};

// Analyze image quality (real brightness calculation)
const analyzeImageQuality = (ctx, width, height) => {
const imageData = ctx.getImageData(0, 0, width, height);
const data = imageData.data;
let brightness = 0;

for (let i = 0; i < data.length; i += 4) {
  brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
}

brightness = brightness / (data.length / 4);

let message = translatedText.goodLighting || translationKeys.goodLighting;
if (brightness < 50) message = translatedText.imageTooDark || translationKeys.imageTooDark;
if (brightness > 200) message = translatedText.imageTooBright || translationKeys.imageTooBright;

const quality = {
  brightness: Math.round(brightness),
  isGoodQuality: brightness > 50 && brightness < 200,
  message: message
};

setCaptureQuality(quality);
};

// Handle file upload
const handleUpload = (e) => {
const file = e.target.files[0];
if (!file) return;
if (!scanConsent) {
  setConsentError(translatedText.photoConsentRequired || translationKeys.photoConsentRequired);
  e.target.value = "";
  return;
}
if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
  setConsentError(translatedText.photoTypeError || translationKeys.photoTypeError);
  e.target.value = "";
  return;
}
if (file.size > 3 * 1024 * 1024) {
  setConsentError(translatedText.photoSizeError || translationKeys.photoSizeError);
  e.target.value = "";
  return;
}
setConsentError("");

const reader = new FileReader();
reader.onloadend = () => {
  setImage(reader.result);
  setMode('analyzing');
  analyzePhoto(reader.result);
};
reader.onerror = () => setConsentError(translatedText.photoTypeError || translationKeys.photoTypeError);
reader.readAsDataURL(file);
};

// Analyze photo with API
const analyzePhoto = async (imageData) => {
if (!scanConsent) {
  setConsentError(translatedText.photoConsentRequired || translationKeys.photoConsentRequired);
  setMode('select');
  return;
}
setLoading(true);
setFeedback(null);

try {
  const res = await fetch("/api/scan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ image: imageData || image }),
  });

  if (!res.ok) throw new Error("Scan request failed");
  const data = await res.json();
  const feedbackText = data.feedback || data.error || "No response";
  setFeedback(feedbackText);

  // Save to history
  if (saveScansLocally) setHistorySaveFailed(!saveScanToHistory(imageData || image, feedbackText));
  else setHistorySaveFailed(false);
  
  setMode('results');
} catch (err) {
  setFeedback(translatedText.failedAnalysis || translationKeys.failedAnalysis);
  setMode('results');
}

setLoading(false);
};

// Progress through guidance steps
const nextGuidanceStep = () => {
if (guidanceStep < guidanceSteps.length - 1) {
setGuidanceStep(guidanceStep + 1);
}
};

// Reset to start
const reset = () => {
setImage(null);
setFeedback(null);
setScanNotice(null);
setMode('select');
setCaptureQuality(null);
setShowComparison(false);
setSelectedScanForComparison(null);
stopCamera();
};

// View scan from history
const viewHistoryScan = (scan) => {
setImage(scan.image);
setFeedback(scan.feedback);
setMode('results');
setShowHistory(false);
};

// Delete scan from history
const deleteScan = (scanId) => {
const index = scanHistory.findIndex((scan) => scan.id === scanId);
if (index < 0) return;
const scan = scanHistory[index];
const updated = scanHistory.filter((item) => item.id !== scanId);
try {
  localStorage.setItem('scanHistory', JSON.stringify(updated));
  setScanHistory(updated);
  setDeletedScan({ scan, index });
} catch (error) {
  console.error("Could not update saved scan history:", error);
  setScanNotice({ type: "error", message: "This scan couldn’t be deleted from saved history. Try again." });
}
};

const undoDeleteScan = () => {
if (!deletedScan) return;
const restored = [...scanHistory];
restored.splice(Math.min(deletedScan.index, restored.length), 0, deletedScan.scan);
try {
  localStorage.setItem('scanHistory', JSON.stringify(restored));
  setScanHistory(restored);
  setDeletedScan(null);
} catch (error) {
  console.error("Could not restore saved scan:", error);
  setScanNotice({ type: "error", message: "This scan couldn’t be restored. Your saved history is unchanged." });
}
};

useEffect(() => {
if (deletedScan) undoScanButtonRef.current?.focus();
}, [deletedScan]);

useEffect(() => {
const titleId = showHistory ? "scan-history-title" : showShareModal ? "scan-share-title" : showExportOptions ? "scan-export-title" : null;
const dialog = titleId ? document.getElementById(titleId)?.closest('[role="dialog"]') : null;

if (!dialog) {
  const returnTo = scanDialogReturnFocusRef.current;
  if (returnTo?.isConnected && !returnTo.closest("[inert]")) returnTo.focus();
  else scanHistoryTriggerRef.current?.focus();
  scanDialogReturnFocusRef.current = null;
  return undefined;
}

if (!scanDialogReturnFocusRef.current) scanDialogReturnFocusRef.current = document.activeElement;
const getFocusable = () => [...dialog.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')]
  .filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
const focusable = getFocusable();
(focusable[0] || dialog).focus();

const handleDialogKeys = (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    if (showHistory) setShowHistory(false);
    else if (showShareModal) { setShowShareModal(false); setShareEmailError(""); }
    else if (showExportOptions) setShowExportOptions(false);
    return;
  }
  if (event.key !== "Tab") return;
  const items = getFocusable();
  if (!items.length) { event.preventDefault(); dialog.focus(); return; }
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
};

document.addEventListener("keydown", handleDialogKeys);
return () => document.removeEventListener("keydown", handleDialogKeys);
}, [showHistory, showShareModal, showExportOptions]);

// Export results as text (real export)
const exportAsText = () => {
const data = {
scanDate: new Date().toISOString(),
feedback: feedback,
imageQuality: captureQuality
};

const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `scan-results-${new Date().toISOString().split('T')[0]}.json`;
a.click();
window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Share with dentist via email
const shareWithDentist = () => {
const email = shareEmail.trim();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
setShareEmailError("Enter a valid email address.");
return;
}

const subject = encodeURIComponent('Dental Scan Results from Smile Streak');
const body = encodeURIComponent(
  `Scan Results:\n\n${feedback}\n\nDate: ${new Date().toLocaleDateString(currentLanguage)}\n\n${shareNotes ? `Notes: ${shareNotes}\n\n` : ''}`
);
window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;

setShowShareModal(false);
setShareEmailError("");
setShareEmail('');
setShareNotes('');
setScanNotice({ type: "status", message: "Your email app should open with a draft. Review it before sending." });
};

const openShareModal = () => {
setShareEmailError("");
setShowShareModal(true);
};

const activeGuidanceStep = guidanceSteps[guidanceStep] || guidanceSteps[0];
const GuidanceIcon = activeGuidanceStep.icon;

// Show loading state while translating
if (translating || Object.keys(translatedText).length === 0) {
return (
<div className="scan-page space-y-6 pb-8">
<div className="page-heading-surface">
<div className="animate-pulse flex items-center gap-2">
<Camera className="w-6 h-6" aria-hidden="true" />
        <h2 className="text-2xl font-black">{translatedText.loading || translationKeys.loading}</h2>
</div>
</div>
</div>
);
}

return (
<div className="scan-page space-y-6 pb-8">
{/* Header */}
<div className="page-heading-surface relative overflow-hidden">
<div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
<div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />

    <div className="relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-black">{translatedText.title}</h2>
          </div>
          <p className="text-sm opacity-90">{translatedText.subtitle}</p>
        </div>
        
        {scanHistory.length > 0 && (
          <button
            ref={scanHistoryTriggerRef}
            onClick={() => setShowHistory(!showHistory)}
            className="scan-history-toggle rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 transition-colors"
            aria-label={showHistory ? "Close scan history" : "Open scan history"}
          >
            <History className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  </div>

  {scanNotice && <p className={`scan-inline-notice scan-inline-notice--${scanNotice.type}`} role={scanNotice.type === "error" ? "alert" : "status"}>{scanNotice.message}</p>}

  {/* Scan History Modal - Shows real user data */}
  <Presence open={showHistory}>
{showHistory && (
    <div className="t-modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease-out]">
      <div role="dialog" aria-modal="true" aria-labelledby="scan-history-title" className="scan-dialog bg-white rounded-3xl max-w-lg w-full max-h-[80vh] overflow-hidden animate-[scaleBounce_0.3s_ease-out]">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h3 id="scan-history-title" className="font-black text-gray-900">{translatedText.scanHistory}</h3>
          </div>
          <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600" aria-label={translatedText.closeHistory || "Close scan history"}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
          {deletedScan && (
            <div className="scan-history-undo" role="status">
              <span>{translatedText.scanRemoved || translationKeys.scanRemoved}</span>
              <button ref={undoScanButtonRef} type="button" onClick={undoDeleteScan}>{translatedText.undo || "Undo"}</button>
            </div>
          )}
          {scanHistory.length === 0 ? (
            <p className="text-center text-gray-500 py-8">{translatedText.noScans}</p>
          ) : (
            scanHistory.map((scan) => (
              <div key={scan.id} className="scan-history-row group flex gap-3 p-3 rounded-xl bg-gray-50 transition-colors">
                <img 
                  src={scan.image} 
                  alt={translatedText.scanPhotoAlt || "Saved scan photo"}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{formatScanTimestamp(scan)}</p>
                  <p className="text-xs text-gray-600 line-clamp-2 mt-1">{scan.feedback}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => viewHistoryScan(scan)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {translatedText.viewDetails}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedScanForComparison(scan);
                        setShowHistory(false);
                        setShowComparison(true);
                      }}
                      className="text-xs text-green-600 hover:text-green-700 font-medium"
                    >
                      Compare
                    </button>
                    <button
                      onClick={() => deleteScan(scan.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      {translatedText.delete}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )}
</Presence>

  {/* Share Modal */}
  <Presence open={showShareModal}>
{showShareModal && (
    <div className="t-modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="scan-share-title" className="scan-dialog bg-white rounded-3xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 id="scan-share-title" className="text-xl font-black text-gray-900">{translatedText.shareTitle}</h3>
          <button onClick={() => { setShowShareModal(false); setShareEmailError(""); }} className="text-gray-400 hover:text-gray-600" aria-label={translatedText.closeShareDialog || "Close share dialog"}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">{translatedText.shareDesc}</p>
        
        <div className="mb-4">
          <label htmlFor="scan-share-email" className="block text-sm font-semibold text-gray-700 mb-2">
            {translatedText.emailPlaceholder}
          </label>
          <input
            id="scan-share-email"
            type="email"
            required
            value={shareEmail}
            onChange={(e) => { setShareEmail(e.target.value); setShareEmailError(""); }}
            aria-invalid={Boolean(shareEmailError)}
            aria-describedby={shareEmailError ? "scan-share-email-error" : undefined}
            placeholder="dentist@example.com"
            className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none"
          />
          {shareEmailError && <p id="scan-share-email-error" className="scan-inline-field-error" role="alert">{shareEmailError}</p>}
        </div>
        
        <div className="mb-4">
          <label htmlFor="scan-share-notes" className="block text-sm font-semibold text-gray-700 mb-2">
            {translatedText.notesPlaceholder}
          </label>
          <textarea
            id="scan-share-notes"
            value={shareNotes}
            onChange={(e) => setShareNotes(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-blue-400 focus:outline-none resize-none"
          />
        </div>
        
        <button
          onClick={shareWithDentist}
          className="scan-dialog-primary w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-semibold transition-all"
        >
          {translatedText.sendEmail}
        </button>
      </div>
    </div>
  )}
</Presence>

  {/* Export Options Modal */}
  <Presence open={showExportOptions}>
{showExportOptions && (
    <div className="t-modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-labelledby="scan-export-title" className="scan-dialog bg-white rounded-3xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 id="scan-export-title" className="text-xl font-black text-gray-900">{translatedText.exportTitle}</h3>
          <button onClick={() => setShowExportOptions(false)} className="text-gray-400 hover:text-gray-600" aria-label={translatedText.closeExportOptions || "Close export options"}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">{translatedText.exportDesc}</p>
        
        <div className="space-y-3">
          <button
            onClick={exportAsText}
            className="scan-export-option w-full flex items-center gap-3 p-4 bg-blue-50 rounded-xl transition-colors"
          >
            <Download className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">{translatedText.exportJson || translationKeys.exportJson}</span>
          </button>
          
          <button
            onClick={() => {
              setShowExportOptions(false);
              openShareModal();
            }}
            className="scan-export-option w-full flex items-center gap-3 p-4 bg-green-50 rounded-xl transition-colors"
          >
            <Mail className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-gray-900">{translatedText.emailResults}</span>
          </button>
          
          <button
            onClick={() => window.print()}
            className="scan-export-option w-full flex items-center gap-3 p-4 bg-purple-50 rounded-xl transition-colors"
          >
            <Printer className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-gray-900">{translatedText.printResults}</span>
          </button>
        </div>
      </div>
    </div>
  )}
</Presence>

  {/* Comparison View - Based on real scan data */}
  {showComparison && selectedScanForComparison && mode === 'results' && (
    <div className="scan-comparison-panel bg-white rounded-3xl p-6 shadow-lg border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          {translatedText.comparisonTitle}
        </h3>
        <button
          onClick={() => setShowComparison(false)}
          className="text-gray-400 hover:text-gray-600"
          aria-label={translatedText.closeComparison || "Close scan comparison"}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">{translatedText.comparisonDesc}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">{translatedText.currentScan}</p>
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img src={image} alt={translatedText.currentScan || "Current Scan"} className="w-full h-full object-cover" />
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">{translatedText.previousScan}</p>
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
            <img src={selectedScanForComparison.image} alt={translatedText.previousScan || "Previous Scan"} className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
      
      {compareScans(feedback, selectedScanForComparison.feedback) && (
        <div className="space-y-3">
          <p className="text-xs leading-5 text-slate-500">{translatedText.differenceOnly}</p>
          {compareScans(feedback, selectedScanForComparison.feedback).currentOnly.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="font-semibold text-slate-700 text-sm mb-2">{translatedText.improvements}</p>
              <ul className="space-y-1">
                {compareScans(feedback, selectedScanForComparison.feedback).currentOnly.map((item, i) => (
                  <li key={i} className="text-xs text-gray-600">• {item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {compareScans(feedback, selectedScanForComparison.feedback).earlierOnly.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="font-semibold text-slate-700 text-sm mb-2">{translatedText.declines}</p>
              <ul className="space-y-1">
                {compareScans(feedback, selectedScanForComparison.feedback).earlierOnly.map((item, i) => (
                  <li key={i} className="text-xs text-gray-600">• {item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )}

  {/* MODE: SELECT */}
  {mode === 'select' && (
    <div className="space-y-4">
      <div className="scan-how-note">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-gray-900 mb-1">{translatedText.howItWorks}</p>
            <p>{translatedText.howItWorksDesc}</p>
          </div>
        </div>
      </div>

      {/* Consent and local retention choices are explicit and default to off. */}
      <div className="scan-privacy-controls">
        <label className="scan-privacy-option">
          <input type="checkbox" checked={scanConsent} onChange={(event) => { setScanConsent(event.target.checked); setConsentError(""); }} />
          <span>{translatedText.photoConsent}</span>
        </label>
        <label className="scan-privacy-option scan-privacy-option--secondary">
          <input type="checkbox" checked={saveScansLocally} onChange={(event) => setSaveScansLocally(event.target.checked)} />
          <span>{translatedText.photoStorageConsent}</span>
        </label>
        {consentError && <p className="scan-privacy-error" role="alert">{consentError}</p>}
        <p className="scan-privacy-note">{translatedText.privacyNote || translationKeys.privacyNote}</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={startCamera}
          disabled={!scanConsent}
          className="scan-start-action"
        >
          <div className="flex items-center gap-4">
            <Camera className="w-5 h-5 shrink-0" strokeWidth={1.6} />
            <div className="text-left flex-1">
              <p className="font-semibold text-base mb-1">{translatedText.takePhoto}</p>
              <p className="text-sm opacity-85">{translatedText.takePhotoDesc}</p>
            </div>
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        <label className={`scan-upload-label ${scanConsent ? "" : "is-disabled"}`}>
          <div className="scan-upload-action">
            <div className="flex items-center gap-4">
              <Upload className="w-5 h-5 shrink-0 text-slate-600" strokeWidth={1.6} />
              <div className="text-left flex-1">
                <p className="font-semibold text-base text-gray-900 mb-1">{translatedText.uploadPhoto}</p>
                <p className="text-sm text-gray-600">{translatedText.uploadPhotoDesc}</p>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            disabled={!scanConsent}
            className="sr-only"
          />
        </label>
      </div>

      {/* Tips - Educational, not fake data */}
      <aside className="scan-tips-note">
        <h3>{translatedText.tipsTitle}</h3>
        <ul>
          <li>{translatedText.tip1}</li>
          <li>{translatedText.tip2}</li>
          <li>{translatedText.tip3}</li>
          <li>{translatedText.tip4}</li>
        </ul>
      </aside>
    </div>
  )}

  {/* MODE: CAMERA */}
  {mode === 'camera' && (
    <div className="space-y-4">
      <button
        onClick={stopCamera}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        {translatedText.back}
      </button>

      {/* Camera Preview */}
      <div className="scan-camera-preview relative rounded-3xl overflow-hidden bg-black shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
        />
        
        {/* Guidance Overlay - Visual guide only, not data */}
        <div className="scan-camera-overlay absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50 pointer-events-none">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="scan-camera-reticle" aria-hidden="true" />
          </div>
        </div>

        {/* Guidance Instructions */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="text-center text-white space-y-3">
            <div className="scan-guidance-icon mb-2" aria-hidden="true"><GuidanceIcon className="h-6 w-6" strokeWidth={1.6} /></div>
            <h3 className="text-xl font-black">{translatedText[activeGuidanceStep.titleKey] || activeGuidanceStep.title}</h3>
            <p className="text-sm opacity-90">{translatedText[activeGuidanceStep.instructionKey] || activeGuidanceStep.instruction}</p>
            <p className="text-xs opacity-75">{translatedText[activeGuidanceStep.tipKey] || activeGuidanceStep.tip}</p>
            
            {/* Progress dots */}
            <div className="flex justify-center gap-2 pt-2">
              {guidanceSteps.map((step, i) => (
                <div
                  key={step.id}
                  className={`h-2 rounded-full transition-all ${
                    i === guidanceStep 
                      ? 'w-8 bg-white' 
                      : i < guidanceStep 
                      ? 'w-2 bg-green-400' 
                      : 'w-2 bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Capture Button */}
      <div className="flex justify-center">
        {guidanceStep < guidanceSteps.length - 1 ? (
          <button
            onClick={nextGuidanceStep}
            className="scan-step-action bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
          >
            {translatedText.nextStep}
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={capturePhoto}
            aria-label={translatedText.takePhoto || "Take photo"}
            className="scan-capture-action"
          >
            <span aria-hidden="true" />
            <p className="absolute -bottom-8 text-xs text-gray-500 font-medium whitespace-nowrap">{translatedText.tapCapture || translationKeys.tapCapture}</p>
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )}

  {/* MODE: ANALYZING */}
  {mode === 'analyzing' && (
    <div className="space-y-6">
      {image && (
        <div className="scan-image-preview relative rounded-3xl overflow-hidden shadow-xl">
          <img
            src={image}
            alt="Captured"
            className="w-full h-auto"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {captureQuality && (
        <div className={`scan-quality-note rounded-2xl p-4 border-2 ${
          captureQuality.isGoodQuality 
            ? 'bg-green-50 border-green-300' 
            : 'bg-yellow-50 border-yellow-300'
        }`}>
          <div className="flex items-center gap-2">
            {captureQuality.isGoodQuality ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            )}
            <p className="text-sm font-semibold text-gray-900">{captureQuality.message}</p>
          </div>
        </div>
      )}

      <div className="scan-analyzing-panel bg-white rounded-3xl p-8 shadow-xl text-center" role="status" aria-live="polite">
        <div className="scan-analyzing-mark mx-auto mb-4 flex items-center justify-center">
          <Activity className="w-5 h-5" aria-hidden="true" />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">{translatedText.analyzingTitle}</h3>
        <p className="text-sm text-gray-600 mb-4">{translatedText.analyzingDesc}</p>
        
        <div className="space-y-2 text-left max-w-xs mx-auto">
          {[
            translatedText.analyzingStep1,
            translatedText.analyzingStep2, 
            translatedText.analyzingStep3,
            translatedText.analyzingStep4
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* MODE: RESULTS - Shows real API feedback */}
  {mode === 'results' && feedback && (
    <div className="space-y-6">
      {image && (
        <div className="scan-image-preview relative rounded-3xl overflow-hidden shadow-xl">
          <img
            src={image}
            alt="Analyzed"
            className="w-full h-auto"
          />
        </div>
      )}

      <div className="scan-result-panel bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="h-5 w-5 text-[var(--brand)]" aria-hidden="true" />
          <div>
            <h3 className="font-black text-gray-900 text-lg">{translatedText.analysisComplete}</h3>
            <p className="text-sm text-gray-600">{translatedText.analysisCompleteDesc}</p>
          </div>
        </div>

        <div className="scan-result-copy rounded-2xl p-5">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{feedback}</p>
        </div>
      </div>

      {/* Post-scan disclaimer */}
      <div className="scan-result-disclaimer bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-800">
          General, educational observation only, not a diagnosis. See a licensed dentist for anything you're concerned about.
        </p>
      </div>

      {historySaveFailed ? (
        <p className="text-xs leading-5 text-amber-800" role="status">{translatedText.historySaveFailed || translationKeys.historySaveFailed}</p>
      ) : !saveScansLocally ? (
        <p className="text-xs leading-5 text-slate-500">{translatedText.historyNotSaved || translationKeys.historyNotSaved}</p>
      ) : null}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={reset}
          className="scan-result-action scan-result-action--primary bg-white border-2 border-gray-200 text-gray-900 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
        >
          <Camera className="w-5 h-5" />
          {translatedText.newScan}
        </button>
        
        <button
          ref={scanHistoryTriggerRef}
          onClick={() => setShowHistory(true)}
          className="scan-result-action bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
        >
          <History className="w-5 h-5" />
          {translatedText.viewHistory}
        </button>

        <button
          onClick={() => setShowExportOptions(true)}
          className="scan-result-action bg-purple-50 border-2 border-purple-200 text-purple-700 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export
        </button>

        <button
          onClick={openShareModal}
          className="scan-result-action bg-green-50 border-2 border-green-200 text-green-700 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
        >
          <Mail className="w-5 h-5" />
          Share
        </button>
      </div>

      {/* Compare with Previous - Uses real scan history */}
      {scanHistory.length > 1 && (
        <button
          onClick={() => {
            const previousScans = scanHistory.filter(s => s.id !== scanHistory[0]?.id);
            if (previousScans.length > 0) {
              setSelectedScanForComparison(previousScans[0]);
              setShowComparison(true);
            }
          }}
          className="scan-result-action w-full bg-white border-2 border-blue-200 text-blue-700 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
        >
          <BarChart3 className="w-5 h-5" />
          {translatedText.compareScans}
        </button>
      )}

      {/* Improvement Tips - Educational content only */}
      <aside className="scan-progress-note bg-slate-50 border border-purple-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-gray-900 text-sm mb-2">{translatedText.trackProgress}</p>
            <p className="text-xs text-gray-600">{translatedText.trackProgressDesc}</p>
          </div>
        </div>
      </aside>
    </div>
  )}
</div>
);
}
