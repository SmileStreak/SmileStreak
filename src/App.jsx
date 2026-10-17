import { useEffect, useState, createContext, useCallback, useRef, lazy, Suspense } from "react";
import { flushSync } from "react-dom";
import "@fontsource-variable/source-sans-3";
import "@fontsource-variable/newsreader";
import NavTabs from "./components/NavTabs";
import Presence from "./components/Presence";
const pageLoaders = {
  home: () => import("./components/Home"),
  today: () => import("./components/Today"),
  progress: () => import("./components/Progress"),
  tips: () => import("./components/Tips"),
  reminders: () => import("./components/Reminders"),
  scan: () => import("./components/Scan"),
  dentists: () => import("./components/Dentists"),
  report: () => import("./components/Report"),
  insights: () => import("./components/Insights"),
  mission: () => import("./components/Mission"),
  legal: () => import("./components/Legal"),
};
const Home = lazy(pageLoaders.home);
const Today = lazy(pageLoaders.today);
const Progress = lazy(pageLoaders.progress);
const Tips = lazy(pageLoaders.tips);
const Reminders = lazy(pageLoaders.reminders);
const Scan = lazy(pageLoaders.scan);
const Dentists = lazy(pageLoaders.dentists);
const Report = lazy(pageLoaders.report);
const Insights = lazy(pageLoaders.insights);
const Mission = lazy(pageLoaders.mission);
const Legal = lazy(pageLoaders.legal);
const Leaderboard = lazy(() => import("./components/Leaderboard"));
import { storage } from "./utils/storage";
import { scheduleDailyNotifications } from "./utils/scheduleNotifications";
import { auth, provider, db, setAnalyticsConsent } from "./firebase";
import { setupFCMToken, onForegroundMessage } from "./utils/notifications";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { LogOut, RefreshCw, MessageCircle, X, Globe, Check, Moon, Sun, User, Edit3, BarChart2, Award, Trophy } from "lucide-react";
import { LANGUAGES, getStoredLanguage, saveLanguagePreference, detectBrowserLanguage, translateText, translateBatch } from "./utils/translate";
import { calculateStreaks, isDayComplete } from "./utils/progress";
import { ACHIEVEMENTS } from "./data/achievements";
import { subscribeToLeaderboard } from "./services/leaderboardService";
import "./App.css";
import "./motion-tokens.css";

export const TranslationContext = createContext();
export const ThemeContext = createContext();

function handleMenuArrowKeys(event) {
  const keySteps = { ArrowDown: 1, ArrowUp: -1 };
  const items = [...event.currentTarget.querySelectorAll('[role="menuitem"]')]
    .filter((item) => !item.disabled && item.getAttribute("aria-disabled") !== "true");
  if (!items.length) return;
  const current = items.indexOf(document.activeElement);
  let nextIndex;
  if (keySteps[event.key] !== undefined) {
    nextIndex = current < 0
      ? (event.key === "ArrowDown" ? 0 : items.length - 1)
      : (current + keySteps[event.key] + items.length) % items.length;
  }
  else if (event.key === "Home") nextIndex = 0;
  else if (event.key === "End") nextIndex = items.length - 1;
  else return;
  event.preventDefault();
  items[nextIndex]?.focus();
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const navigateToTab = useCallback((tab) => {
    const update = () => flushSync(() => setActiveTab(tab));
    const transition = () => {
      if (document.startViewTransition) document.startViewTransition(update);
      else setActiveTab(tab);
    };
    if (pageLoaders[tab]) pageLoaders[tab]().then(transition, transition);
    else transition();
  }, []);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authPending, setAuthPending] = useState(false);
  const [authError, setAuthError] = useState("");
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState("idle");
  const appDialogReturnFocusRef = useRef(null);
  const [analyticsChoice, setAnalyticsChoice] = useState(() => {
    try {
      const saved = localStorage.getItem("smilestreak-analytics-consent");
      return saved === "granted" || saved === "denied" ? saved : null;
    }
    catch { return null; }
  });
  const [analyticsPreferenceNotice, setAnalyticsPreferenceNotice] = useState("");
  const [savingAnalyticsChoice, setSavingAnalyticsChoice] = useState(false);
  const [analyticsConsentCopy, setAnalyticsConsentCopy] = useState({
    heading: "Cookie and analytics choices",
    message: "SmileStreak stores app settings and progress in your browser. Optional Firebase Analytics may use analytics cookies or identifiers to understand app use; it stays off unless you allow it. You can change your choice in Cookie preferences.",
    reject: "Reject optional analytics",
    accept: "Accept optional analytics",
    saving: "Saving your preference…",
    preferences: "Cookie preferences",
    statusLabel: "Optional Firebase Analytics:",
    statusAllowed: "Allowed",
    statusOff: "Off",
    statusUnknown: "Not enabled",
    leaderboard: "Leaderboard",
    lightMode: "Light",
    darkMode: "Dark",
    switchToLight: "Switch to light mode",
    switchToDark: "Switch to dark mode",
    changeLanguage: "Change language",
    selectLanguage: "Select Language",
    viewProfile: "View Profile",
    editUsername: "Edit Username",
    statisticsBadges: "Statistics & Badges",
    switchAccount: "Switch Account",
    signOut: "Sign Out",
    updatingLanguage: "Updating language…",
    loadingPage: "Loading page…",
    privacyTerms: "Privacy & terms",
    skipToContent: "Skip to main content",
    sendFeedback: "Send feedback",
    giveFeedback: "Give Feedback",
    saveAllowedFailed: "Your preference couldn’t be saved, so optional analytics stayed off. Check browser storage settings and try again.",
    saveDeniedFailed: "Optional analytics is off for this visit, but your choice couldn’t be saved in browser storage."
  });
  const [currentLanguage, setCurrentLanguage] = useState(getStoredLanguage());
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [habitData, setHabitData] = useState(() =>
    storage.get("habitData", {})
  );

  // ── USERNAME STATE ──
  const [username, setUsername] = useState(null);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [savingUsername, setSavingUsername] = useState(false);
  const usernameCheckTimeout = useRef(null);
  
  // ── TRACK IF USERNAME HAS BEEN LOADED ──
  const [usernameLoaded, setUsernameLoaded] = useState(false);

  // ── PROFILE MODAL STATE ──
  const [showProfileModal, setShowProfileModal] = useState(false);

  // ── EDIT USERNAME STATE ──
  const [showEditUsername, setShowEditUsername] = useState(false);
  const [editUsernameInput, setEditUsernameInput] = useState("");
  const [editUsernameStatus, setEditUsernameStatus] = useState(null);
  const [editUsernameError, setEditUsernameError] = useState("");
  const [editUsernameSuggestions, setEditUsernameSuggestions] = useState([]);
  const [savingEditUsername, setSavingEditUsername] = useState(false);
  const editUsernameCheckTimeout = useRef(null);

  // ── JOINED DATE STATE ──
  const [joinedDate, setJoinedDate] = useState(null);

  // ── LEADERBOARD STATE ──
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [players, setPlayers] = useState([]);
  const [leagueGroup, setLeagueGroup] = useState(null);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  useEffect(() => {
    if (!showAccountMenu && !showLanguageMenu) return undefined;
    const closeMenusOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setShowAccountMenu(false);
      setShowLanguageMenu(false);
      document.getElementById(showAccountMenu ? "account-menu-trigger" : "language-menu-trigger")?.focus();
    };
    document.addEventListener("keydown", closeMenusOnEscape);
    return () => document.removeEventListener("keydown", closeMenusOnEscape);
  }, [showAccountMenu, showLanguageMenu]);

  useEffect(() => {
    if (!showLanguageMenu) return undefined;
    const frame = requestAnimationFrame(() => document.querySelector(`#language-menu [data-language-option="${currentLanguage}"]`)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [showLanguageMenu, currentLanguage]);

  useEffect(() => {
    if (!showAccountMenu) return undefined;
    const frame = requestAnimationFrame(() => document.querySelector("#account-menu [role='menuitem']")?.focus());
    return () => cancelAnimationFrame(frame);
  }, [showAccountMenu]);

  useEffect(() => {
    const titleId = showFeedback ? "feedback-dialog-title"
      : usernameLoaded && showUsernameModal && user ? "username-setup-title"
      : showEditUsername && user ? "edit-username-title"
      : showProfileModal && user ? "profile-modal-title"
      : null;
    const dialog = titleId ? document.getElementById(titleId)?.closest('[role="dialog"]') : null;

    if (!dialog) {
      const returnTo = appDialogReturnFocusRef.current;
      if (returnTo?.isConnected) returnTo.focus();
      else if (showProfileModal || showEditUsername) document.getElementById("account-menu-trigger")?.focus();
      appDialogReturnFocusRef.current = null;
      return undefined;
    }

    if (!appDialogReturnFocusRef.current) appDialogReturnFocusRef.current = document.activeElement;
    const getFocusable = () => [...dialog.querySelectorAll('a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')]
      .filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
    const focusable = getFocusable();
    (focusable[0] || dialog).focus();

    const handleDialogKeys = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (showFeedback) { setShowFeedback(false); setFeedbackStatus("idle"); }
        else if (showEditUsername) setShowEditUsername(false);
        else if (showProfileModal) setShowProfileModal(false);
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
  }, [showFeedback, showUsernameModal, showEditUsername, showProfileModal, usernameLoaded, user]);

  const isRemoteUpdate = useRef(false);
  const currentLanguageRef = useRef(currentLanguage);
  const habitDataRef = useRef(habitData);

  useEffect(() => {
    currentLanguageRef.current = currentLanguage;
  }, [currentLanguage]);

  useEffect(() => {
    habitDataRef.current = habitData;
  }, [habitData]);

  const t = useCallback(async (text) => {
    if (currentLanguage === 'en') return text;
    return await translateText(text, currentLanguage, 'en');
  }, [currentLanguage]);

  useEffect(() => {
    let active = true;
    const defaults = {
      heading: "Cookie and analytics choices",
      message: "SmileStreak stores app settings and progress in your browser. Optional Firebase Analytics may use analytics cookies or identifiers to understand app use; it stays off unless you allow it. You can change your choice in Cookie preferences.",
      reject: "Reject optional analytics",
      accept: "Accept optional analytics",
      saving: "Saving your preference…",
      preferences: "Cookie preferences",
      statusLabel: "Optional Firebase Analytics:",
      statusAllowed: "Allowed",
      statusOff: "Off",
      statusUnknown: "Not enabled",
      leaderboard: "Leaderboard",
      lightMode: "Light",
      darkMode: "Dark",
      switchToLight: "Switch to light mode",
      switchToDark: "Switch to dark mode",
      changeLanguage: "Change language",
      selectLanguage: "Select Language",
      viewProfile: "View Profile",
      editUsername: "Edit Username",
      statisticsBadges: "Statistics & Badges",
      switchAccount: "Switch Account",
      signOut: "Sign Out",
      updatingLanguage: "Updating language…",
      loadingPage: "Loading page…",
      privacyTerms: "Privacy & terms",
      skipToContent: "Skip to main content",
      sendFeedback: "Send feedback",
      giveFeedback: "Give Feedback",
      saveAllowedFailed: "Your preference couldn’t be saved, so optional analytics stayed off. Check browser storage settings and try again.",
      saveDeniedFailed: "Optional analytics is off for this visit, but your choice couldn’t be saved in browser storage."
    };
    translateBatch(Object.values(defaults), currentLanguage, "en").then((values) => {
      if (active) setAnalyticsConsentCopy(Object.fromEntries(Object.keys(defaults).map((key, index) => [key, values[index]])));
    }).catch((error) => console.error("Could not translate app shell labels:", error));
    return () => { active = false; };
  }, [currentLanguage]);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const chooseAnalytics = async (allowed) => {
    if (savingAnalyticsChoice) return;
    setSavingAnalyticsChoice(true);
    setAnalyticsPreferenceNotice("");
    try {
      const saved = await setAnalyticsConsent(allowed);
      setAnalyticsChoice(allowed && !saved ? null : allowed ? "granted" : "denied");
      if (!saved) {
        setAnalyticsPreferenceNotice(allowed
          ? analyticsConsentCopy.saveAllowedFailed || "Your preference couldn’t be saved, so optional analytics stayed off. Check browser storage settings and try again."
          : analyticsConsentCopy.saveDeniedFailed || "Optional analytics is off for this visit, but your choice couldn’t be saved in browser storage.");
      }
    } catch (error) {
      console.error("Could not update analytics preference:", error);
      setAnalyticsChoice(allowed ? null : "denied");
      setAnalyticsPreferenceNotice(allowed
        ? analyticsConsentCopy.saveAllowedFailed || "Your preference couldn’t be saved, so optional analytics stayed off. Check browser storage settings and try again."
        : analyticsConsentCopy.saveDeniedFailed || "Optional analytics is off for this visit, but your choice couldn’t be saved in browser storage.");
    } finally {
      setSavingAnalyticsChoice(false);
    }
  };

  const openCookiePreferences = async () => {
    setAnalyticsPreferenceNotice("");
    try { await pageLoaders.legal(); } catch { /* navigateToTab still renders its fallback on a chunk error */ }
    navigateToTab("legal");
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const controls = document.getElementById("legal-analytics-preferences");
      if (!controls) return;
      controls.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "center",
      });
      controls.focus({ preventScroll: true });
    }));
  };

  // SAVE LOCALLY
  useEffect(() => {
    storage.set("habitData", habitData);
  }, [habitData]);

  // ── FIRESTORE LISTENER ──
  useEffect(() => {
    if (!user) {
      setUsernameLoaded(false);
      return;
    }

    const ref = doc(db, "users", user.uid);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // Update habit data
        const incoming = JSON.stringify(data.habitData || {});
        const current = JSON.stringify(habitDataRef.current);
        if (incoming !== current) {
          isRemoteUpdate.current = true;
          setHabitData(data.habitData || {});
        }
        
        // Update language
        if (data.userProfile?.language && data.userProfile.language !== currentLanguageRef.current) {
          setCurrentLanguage(data.userProfile.language);
          saveLanguagePreference(data.userProfile.language);
        }
        
        // Update dark mode
        if (data.userProfile?.darkMode !== undefined && data.userProfile.darkMode !== darkMode) {
          setDarkMode(data.userProfile.darkMode);
        }
        
        // Load username
        if (snap.metadata.fromCache && !data.username) {
          console.log("Waiting for server data...");
          setCloudLoaded(true);
          return;
        }
        
        if (data.username) {
          setUsername(data.username);
          setShowUsernameModal(false);
          setUsernameLoaded(true);
        } else {
          setShowUsernameModal(true);
          setUsernameLoaded(true);
        }
        
        if (data.joinedDate) {
          setJoinedDate(data.joinedDate);
        } else {
          const joined = new Date().toISOString();
          setJoinedDate(joined);
          setDoc(ref, { joinedDate: joined }, { merge: true });
        }
      } else {
        if (localStorage.getItem("smilestreak-deleting-profile") === "true") return;
        console.log("No user document found, creating new one");
        const joined = new Date().toISOString();
        setJoinedDate(joined);
        setDoc(ref, { 
          joinedDate: joined,
          habitData: {},
          leaderboard: {
            weeklyPoints: 0,
            league: "Bronze",
            leagueRank: 0,
            weekId: "",
            leagueGroup: "default",
            currentStreak: 0,
            longestStreak: 0,
            perfectDays: 0,
            promotionStatus: "stay"
          },
          userProfile: {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            uid: user.uid,
            language: currentLanguage,
            darkMode: darkMode,
            lastUpdated: new Date().toISOString()
          }
        }, { merge: true });
        setShowUsernameModal(true);
        setUsernameLoaded(true);
      }
      
      setCloudLoaded(true);
    });

    return () => unsub();
  }, [user]);

  // ── LEADERBOARD SUBSCRIPTION ──
  useEffect(() => {
    if (!user) {
      setPlayers([]);
      setLeagueGroup(null);
      setLeaderboardLoading(false);
      return;
    }

    let unsubscribe = null;
    setLeaderboardLoading(true);

    const fetchLeagueGroup = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          const group = data.leaderboard?.leagueGroup || "default";
          setLeagueGroup(group);

          unsubscribe = subscribeToLeaderboard(group, (playersData) => {
            setPlayers(playersData);
            setLeaderboardLoading(false);
          });
        }
      } catch (error) {
        console.error("Error fetching league group:", error);
        setLeaderboardLoading(false);
      }
    };

    fetchLeagueGroup();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  // SAVE TO FIRESTORE WHEN DATA CHANGES
  useEffect(() => {
    if (!user || !cloudLoaded) return;
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }

    const ref = doc(db, "users", user.uid);
    setDoc(ref, {
      habitData,
      userProfile: {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid,
        language: currentLanguage,
        darkMode: darkMode,
        lastUpdated: new Date().toISOString()
      }
    }, { merge: true });
  }, [habitData, user, cloudLoaded, currentLanguage, darkMode]);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      scheduleDailyNotifications();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setUsername(null);
        setJoinedDate(null);
        setShowUsernameModal(false);
        setUsernameLoaded(false);
        setCloudLoaded(false);
        setPlayers([]);
        setLeagueGroup(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      setupFCMToken(user).catch((err) =>
        console.error("Error setting up FCM token on auth change:", err)
      );
    }

    const unsubscribeFCM = onForegroundMessage((payload) => {
      console.log("Foreground FCM message received in App:", payload);
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        new Notification(payload.notification?.title || "Smile Streak", {
          body: payload.notification?.body || "Time to brush 🪥",
          icon: payload.notification?.icon || "/icon-511.png",
          badge: "/icon-511.png",
        });
      }
    });

    return () => {
      if (unsubscribeFCM) unsubscribeFCM();
    };
  }, [user]);

  useEffect(() => {
    const hasDetected = localStorage.getItem('languageDetected');
    if (!hasDetected) {
      const detected = detectBrowserLanguage();
      if (detected !== 'en') {
        setCurrentLanguage(detected);
        saveLanguagePreference(detected);
        localStorage.setItem('languageDetected', 'true');
      }
    }
  }, []);

  const changeLanguage = async (langCode) => {
    setTranslating(true);
    setCurrentLanguage(langCode);
    saveLanguagePreference(langCode);
    setShowLanguageMenu(false);
    if (user && cloudLoaded) {
      const ref = doc(db, "users", user.uid);
      await setDoc(ref, {
        userProfile: {
          language: langCode,
          lastUpdated: new Date().toISOString()
        }
      }, { merge: true });
    }
    setTimeout(() => setTranslating(false), 500);
  };

  async function login() {
    setAuthError("");
    setAuthPending(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      if (error?.code !== "auth/popup-closed-by-user" && error?.code !== "auth/cancelled-popup-request") {
        setAuthError(error?.code === "auth/popup-blocked"
          ? "Your browser blocked the sign-in window. Allow pop-ups and try again."
          : "Google sign-in didn’t finish. Please try again.");
      }
    } finally {
      setAuthPending(false);
    }
  }

  function logout() {
    signOut(auth)
      .then(() => {
        setAuthError("");
        setShowAccountMenu(false);
      })
      .catch((error) => {
        console.error(error);
        setAuthError("We couldn’t sign you out. Check your connection and try again.");
      });
  }

  function switchAccount() {
    signOut(auth)
      .then(() => {
        setAuthError("");
        setShowAccountMenu(false);
        window.setTimeout(() => login(), 100);
      })
      .catch((error) => {
        console.error(error);
        setAuthError("We couldn’t switch accounts. Check your connection and try again.");
      });
  }

  // ── USERNAME VALIDATION ──
  const validateUsernameFormat = (val) => {
    const cleaned = val.toLowerCase().replace(/\s/g, "");
    if (cleaned.length < 3) return { valid: false, reason: "short", cleaned };
    if (cleaned.length > 20) return { valid: false, reason: "long", cleaned };
    if (!/^[a-z0-9_]+$/.test(cleaned)) return { valid: false, reason: "invalid", cleaned };
    return { valid: true, reason: null, cleaned };
  };

  const generateSuggestions = (base) => {
    const b = base.toLowerCase().replace(/\s/g, "").slice(0, 17);
    return [
      `${b}${Math.floor(Math.random() * 99) + 1}`,
      `${b}_${Math.floor(Math.random() * 9) + 1}`,
      `${b}${new Date().getFullYear().toString().slice(-2)}`,
    ];
  };

  const checkUsernameAvailable = async (uname) => {
    const q = query(collection(db, "users"), where("username", "==", uname));
    const snap = await getDocs(q);
    if (snap.empty) return true;
    if (snap.docs.length === 1 && snap.docs[0].id === user?.uid) return true;
    return false;
  };

  const handleUsernameInput = (val) => {
    setUsernameInput(val);
    setUsernameSuggestions([]);
    clearTimeout(usernameCheckTimeout.current);

    const { valid, reason, cleaned } = validateUsernameFormat(val);
    if (!valid) {
      if (reason === "short" && val.length === 0) {
        setUsernameStatus(null);
        setUsernameError("");
      } else if (reason === "short") {
        setUsernameStatus("short");
        setUsernameError("Username must be at least 3 characters");
      } else if (reason === "long") {
        setUsernameStatus("long");
        setUsernameError("Username must be 20 characters or fewer");
      } else {
        setUsernameStatus("invalid");
        setUsernameError("Only letters, numbers, and underscores allowed");
      }
      return;
    }

    setUsernameStatus("checking");
    setUsernameError("");

    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(cleaned);
        if (available) {
          setUsernameStatus("available");
          setUsernameError("");
        } else {
          setUsernameStatus("taken");
          setUsernameError("This username is already taken");
          setUsernameSuggestions(generateSuggestions(cleaned));
        }
      } catch {
        setUsernameStatus(null);
        setUsernameError("Could not check availability");
      }
    }, 500);
  };

  const saveUsername = async (uname) => {
    const { valid, cleaned } = validateUsernameFormat(uname);
    if (!valid || !user) return;
    setSavingUsername(true);
    try {
      const available = await checkUsernameAvailable(cleaned);
      if (!available) {
        setUsernameStatus("taken");
        setUsernameError("This username is already taken");
        setUsernameSuggestions(generateSuggestions(cleaned));
        setSavingUsername(false);
        return;
      }
      const ref = doc(db, "users", user.uid);
      await setDoc(ref, {
        username: cleaned,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      }, { merge: true });
      setUsername(cleaned);
      setShowUsernameModal(false);
      setUsernameInput("");
      setUsernameStatus(null);
    } catch (e) {
      setUsernameError("Failed to save. Please try again.");
    }
    setSavingUsername(false);
  };

  const handleEditUsernameInput = (val) => {
    setEditUsernameInput(val);
    setEditUsernameSuggestions([]);
    clearTimeout(editUsernameCheckTimeout.current);

    const { valid, reason, cleaned } = validateUsernameFormat(val);
    if (!valid) {
      if (reason === "short" && val.length === 0) {
        setEditUsernameStatus(null);
        setEditUsernameError("");
      } else if (reason === "short") {
        setEditUsernameStatus("short");
        setEditUsernameError("Username must be at least 3 characters");
      } else if (reason === "long") {
        setEditUsernameStatus("long");
        setEditUsernameError("Username must be 20 characters or fewer");
      } else {
        setEditUsernameStatus("invalid");
        setEditUsernameError("Only letters, numbers, and underscores allowed");
      }
      return;
    }

    if (cleaned === username) {
      setEditUsernameStatus("available");
      setEditUsernameError("That's your current username");
      return;
    }

    setEditUsernameStatus("checking");
    setEditUsernameError("");

    editUsernameCheckTimeout.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(cleaned);
        if (available) {
          setEditUsernameStatus("available");
          setEditUsernameError("");
        } else {
          setEditUsernameStatus("taken");
          setEditUsernameError("This username is already taken");
          setEditUsernameSuggestions(generateSuggestions(cleaned));
        }
      } catch {
        setEditUsernameStatus(null);
        setEditUsernameError("Could not check availability");
      }
    }, 500);
  };

  const saveEditUsername = async () => {
    const { valid, cleaned } = validateUsernameFormat(editUsernameInput);
    if (!valid || !user) return;
    setSavingEditUsername(true);
    try {
      const available = await checkUsernameAvailable(cleaned);
      if (!available) {
        setEditUsernameStatus("taken");
        setEditUsernameError("This username is already taken");
        setEditUsernameSuggestions(generateSuggestions(cleaned));
        setSavingEditUsername(false);
        return;
      }
      const ref = doc(db, "users", user.uid);
      await setDoc(ref, { username: cleaned }, { merge: true });
      setUsername(cleaned);
      setShowEditUsername(false);
      setEditUsernameInput("");
      setEditUsernameStatus(null);
    } catch {
      setEditUsernameError("Failed to save. Please try again.");
    }
    setSavingEditUsername(false);
  };

  const getProfileStats = () => {
    const { currentStreak, longestStreak } = calculateStreaks(habitData || {});
    const keys = Object.keys(habitData || {}).filter(k => !k.startsWith("__"));
    const perfectDays = keys.filter(k => isDayComplete(habitData[k])).length;
    const totalDays = keys.length;
    const completionRate = totalDays > 0 ? Math.round((perfectDays / totalDays) * 100) : 0;
    const unlockedAchievements = ACHIEVEMENTS.filter(a => perfectDays >= a.requirement);
    return { currentStreak, longestStreak, perfectDays, completionRate, unlockedAchievements };
  };

  const formatJoinedDate = (iso) => {
    if (!iso) return "—";
    const date = new Date(iso);
    return Number.isFinite(date.getTime())
      ? date.toLocaleDateString(currentLanguage, { month: "long", year: "numeric" })
      : "—";
  };

  const UsernameStatusIcon = ({ status }) => {
    if (status === "checking") return <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
    if (status === "available") return <span className="text-green-500 text-sm font-bold">✓</span>;
    if (status === "taken" || status === "invalid" || status === "short" || status === "long") return <span className="text-red-500 text-sm font-bold">✗</span>;
    return null;
  };

  // ── Don't render anything until auth is done loading ──
  if (authLoading) {
    return (
      <div className={`app-bootstrap ${darkMode ? "is-dark" : ""}`} role="status" aria-live="polite">
        <span className="app-bootstrap__wordmark" aria-hidden="true">smile<span>streak</span></span>
        <span className="app-bootstrap__status">{analyticsConsentCopy.loadingPage}</span>
      </div>
    );
  }

  return (
    <TranslationContext.Provider value={{ t, currentLanguage, translating }}>
      <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
          <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-slate-50'}`}>
            <a className="skip-to-content" href="#main-content">{analyticsConsentCopy.skipToContent}</a>
            <header className={`sticky top-0 z-50 transition-colors duration-300 ${
              darkMode
                ? 'bg-gray-800 border-b border-gray-700'
                : 'bg-white border-b border-slate-200'
            }`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center">
                    <h1 className="brand-wordmark" aria-label="SmileStreak">
                      <span>smile</span><span>streak</span>
                    </h1>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* ── LEADERBOARD BUTTON ── */}
                    {user && (
                      <button
                        onClick={() => setShowLeaderboard(!showLeaderboard)}
                        aria-label="Toggle leaderboard"
                        aria-expanded={showLeaderboard}
                        className={`app-header-control flex items-center gap-2 px-3 py-2 rounded-md border transition-colors text-sm font-medium ${
                          showLeaderboard
                            ? darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-100'
                              : 'bg-gray-50 border-gray-300 text-gray-700'
                            : darkMode
                              ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                        title={analyticsConsentCopy.leaderboard}
                      >
                        <Trophy className={`w-4 h-4 ${showLeaderboard ? 'text-[var(--brand)]' : ''}`} />
                        <span className="hidden sm:inline">{analyticsConsentCopy.leaderboard}</span>
                      </button>
                    )}

                    <button
                      onClick={toggleDarkMode}
                      aria-label={darkMode ? analyticsConsentCopy.switchToLight : analyticsConsentCopy.switchToDark}
                      className={`app-header-control flex items-center gap-2 px-3 py-2 rounded-md border transition-colors text-sm font-medium ${
                        darkMode
                          ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                      title={darkMode ? analyticsConsentCopy.switchToLight : analyticsConsentCopy.switchToDark}
                    >
                      {darkMode ? (
                        <>
                          <Sun className="w-4 h-4" />
                          <span className="hidden sm:inline">{analyticsConsentCopy.lightMode}</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4" />
                          <span className="hidden sm:inline">{analyticsConsentCopy.darkMode}</span>
                        </>
                      )}
                    </button>

                    <div className="relative">
                      <button
                        id="language-menu-trigger"
                        onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                        aria-label={`${analyticsConsentCopy.changeLanguage}: ${LANGUAGES[currentLanguage].name}`}
                        aria-haspopup="menu"
                        aria-expanded={showLanguageMenu}
                        aria-controls="language-menu"
                        className={`app-header-control flex items-center gap-2 px-3 py-2 rounded-md border transition-colors text-sm font-medium ${
                          darkMode
                            ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                        title={analyticsConsentCopy.changeLanguage}
                      >
                        <Globe className="w-4 h-4" />
                        <span className="hidden sm:inline">{LANGUAGES[currentLanguage].flag}</span>
                        <span className="text-xs">{currentLanguage.toUpperCase()}</span>
                      </button>

                      <Presence open={showLanguageMenu}>
                      {showLanguageMenu && (
                        <div id="language-menu" role="menu" onKeyDown={handleMenuArrowKeys} data-origin="top-right" className={`app-header-menu t-dropdown absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border py-2 z-50 max-h-96 overflow-y-auto ${
                          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                          <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <p className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{analyticsConsentCopy.selectLanguage}</p>
                          </div>
                          {Object.entries(LANGUAGES).map(([code, lang]) => (
                            <button
                              key={code}
                              role="menuitem"
                              data-language-option={code}
                              onClick={() => changeLanguage(code)}
                              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                                darkMode
                                  ? currentLanguage === code ? 'bg-gray-700' : 'hover:bg-gray-700'
                                  : currentLanguage === code ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-base">{lang.flag}</span>
                                <div className="text-left">
                                  <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{lang.nativeName}</p>
                                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{lang.name}</p>
                                </div>
                              </div>
                              {currentLanguage === code && (
                                <Check className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      </Presence>
                    </div>

                    {user ? (
                      <div className="relative">
                        <button
                          id="account-menu-trigger"
                          onClick={() => setShowAccountMenu(!showAccountMenu)}
                          aria-label="Open account menu"
                          aria-haspopup="menu"
                          aria-expanded={showAccountMenu}
                          aria-controls="account-menu"
                          className="app-account-control flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                          <div className="hidden sm:block text-right">
                            <p className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{user.displayName}</p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {username ? `@${username}` : 'Logged in'}
                            </p>
                          </div>
                          <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="w-10 h-10 rounded-full border border-slate-300 shadow-none cursor-pointer"
                          />
                        </button>

                        <Presence open={showAccountMenu}>
                        {showAccountMenu && (
                          <div id="account-menu" role="menu" data-origin="top-right" className={`app-header-menu t-dropdown absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border py-2 z-50 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                          }`}>
                            <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                              <div className="flex items-center gap-3">
                                <img
                                  src={user.photoURL}
                                  alt={user.displayName}
                                  className="w-12 h-12 rounded-full border border-slate-300"
                                />
                                <div className="flex-1 overflow-hidden">
                                  <p className={`font-bold truncate ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>{user.displayName}</p>
                                  {username && (
                                    <p className={`text-xs font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>@{username}</p>
                                  )}
                                  <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user.email}</p>
                                </div>
                              </div>
                            </div>

                            <div className="py-1" onKeyDown={handleMenuArrowKeys}>
                              <button
                                role="menuitem"
                                onClick={() => { setShowProfileModal(true); setShowAccountMenu(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                }`}
                              >
                                <User className="w-4 h-4 text-blue-600" />
                                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{analyticsConsentCopy.viewProfile}</span>
                              </button>

                              <button
                                role="menuitem"
                                onClick={() => {
                                  setEditUsernameInput(username || "");
                                  setEditUsernameStatus(null);
                                  setEditUsernameError("");
                                  setEditUsernameSuggestions([]);
                                  setShowEditUsername(true);
                                  setShowAccountMenu(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                }`}
                              >
                                <Edit3 className="w-4 h-4 text-purple-600" />
                                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{analyticsConsentCopy.editUsername}</span>
                              </button>

                              <button
                                role="menuitem"
                                onClick={() => { setActiveTab("progress"); setShowAccountMenu(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                }`}
                              >
                                <BarChart2 className="w-4 h-4 text-green-600" />
                                <Award className="w-4 h-4 text-yellow-500 -ml-1" />
                                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{analyticsConsentCopy.statisticsBadges}</span>
                              </button>

                              <div className={`my-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />

                              <button
                                role="menuitem"
                                onClick={switchAccount}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                }`}
                              >
                                <RefreshCw className="w-4 h-4 text-blue-600" />
                                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{analyticsConsentCopy.switchAccount}</span>
                              </button>

                              <button
                                role="menuitem"
                                onClick={logout}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-red-50'
                                }`}
                              >
                                <LogOut className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-medium text-red-600">{analyticsConsentCopy.signOut}</span>
                              </button>
                            </div>
                          </div>
                        )}
                        </Presence>
                      </div>
                    ) : (
                      <button
                        onClick={login}
                        aria-label="Sign in with Google"
                        aria-busy={authPending}
                        disabled={authPending}
                        className={`app-header-control flex items-center gap-2 px-4 py-2 rounded-md border transition-colors font-medium text-sm ${
                          darkMode
                            ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="hidden sm:inline">{authPending ? "Opening Google…" : "Sign in with Google"}</span>
                        <span className="sm:hidden">{authPending ? "Opening…" : "Sign in"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {authError && (
                  <p className="auth-signin-error" role="alert">{authError}</p>
                )}

                <NavTabs activeTab={activeTab} setActiveTab={navigateToTab} />
              </div>
            </header>

            <Presence open={showAccountMenu || showLanguageMenu} duration={150}>
            {(showAccountMenu || showLanguageMenu) && (
              <div
                className="t-modal-backdrop fixed inset-0 z-40"
                onClick={() => {
                  setShowAccountMenu(false);
                  setShowLanguageMenu(false);
                }}
              />
            )}
            </Presence>

            {translating && (
              <div className="app-language-progress" role="status" aria-live="polite">
                <span className="app-language-progress__indicator" aria-hidden="true" />
                <span>{analyticsConsentCopy.updatingLanguage}</span>
              </div>
            )}

            <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-10">
              {/* ── LEADERBOARD ── */}
              <Presence open={showLeaderboard && !!user}>
              {showLeaderboard && user && (
                <Suspense fallback={null}>
                  <Leaderboard user={user} darkMode={darkMode} />
                </Suspense>
              )}
              </Presence>

              <div className={`app-page app-page--${activeTab}`} style={{ viewTransitionName: "page-content" }}>
                <Suspense fallback={<div className="page-loading" role="status">{analyticsConsentCopy.loadingPage}</div>}>
                  {activeTab === "home" && <Home setActiveTab={navigateToTab} user={user} habitData={habitData} />}
                  {activeTab === "today" && <Today habitData={habitData} setHabitData={setHabitData} user={user} />}
                  {activeTab === "progress" && <Progress habitData={habitData} />}
                  {activeTab === "tips" && <Tips />}
                  {activeTab === "reminders" && <Reminders />}
                  {activeTab === "scan" && <Scan habitData={habitData} setHabitData={setHabitData} />}
                  {activeTab === "dentists" && <Dentists />}
                  {activeTab === "report" && <Report habitData={habitData} />}
                  {activeTab === "insights" && <Insights habitData={habitData} />}
                  {activeTab === "mission" && <Mission />}
                  {activeTab === "legal" && <Legal onAnalyticsChoice={chooseAnalytics} analyticsChoice={analyticsChoice} savingAnalyticsChoice={savingAnalyticsChoice} consentCopy={analyticsConsentCopy} />}
                </Suspense>
              </div>
            </main>

            <footer className={`app-footer max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t flex items-center justify-between text-xs ${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
              <span>SmileStreak</span>
              <div className="flex items-center gap-4">
                <button onClick={() => navigateToTab("legal")} className="py-1 underline-offset-2 hover:underline">{analyticsConsentCopy.privacyTerms}</button>
                <button onClick={openCookiePreferences} className="py-1 underline-offset-2 hover:underline">{analyticsConsentCopy.preferences}</button>
                <button onClick={() => { setFeedbackStatus("idle"); setShowFeedback(true); }} className="inline-flex items-center gap-2 py-1 transition-colors hover:text-blue-700" title={analyticsConsentCopy.giveFeedback}>
                  <MessageCircle className="w-4 h-4" />
                  <span>{analyticsConsentCopy.sendFeedback}</span>
                </button>
              </div>
            </footer>

            <Presence open={analyticsChoice === null} duration={180}>
            {analyticsChoice === null && (
              <aside aria-labelledby="analytics-consent-title" aria-describedby="analytics-consent-message" className={`analytics-consent fixed inset-x-0 bottom-0 z-40 border-t px-4 py-4 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] ${darkMode ? "bg-gray-900 border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"}`}>
                <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="max-w-3xl">
                    <h2 id="analytics-consent-title" className="text-sm font-semibold">{analyticsConsentCopy.heading}</h2>
                    <p id="analytics-consent-message" className="mt-1 text-sm leading-relaxed">
                      {analyticsConsentCopy.message}
                    </p>
                    {analyticsPreferenceNotice && <p role="status" className="mt-2 text-sm">{analyticsPreferenceNotice}</p>}
                    {savingAnalyticsChoice && <p role="status" className="mt-2 text-sm">{analyticsConsentCopy.saving}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" disabled={savingAnalyticsChoice} aria-busy={savingAnalyticsChoice} onClick={() => chooseAnalytics(false)} className={`analytics-consent-choice rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-200 disabled:cursor-wait disabled:opacity-60 ${darkMode ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-50"}`}>{analyticsConsentCopy.reject}</button>
                    <button type="button" disabled={savingAnalyticsChoice} aria-busy={savingAnalyticsChoice} onClick={() => chooseAnalytics(true)} className={`analytics-consent-choice rounded-md border px-3 py-2 text-sm font-medium transition-colors duration-200 disabled:cursor-wait disabled:opacity-60 ${darkMode ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-50"}`}>{analyticsConsentCopy.accept}</button>
                  </div>
                </div>
              </aside>
            )}
            </Presence>

            {analyticsPreferenceNotice && analyticsChoice !== null && (
              <p role="status" className={`fixed bottom-4 left-4 z-50 max-w-sm rounded-lg border px-4 py-3 text-sm shadow-sm ${darkMode ? "border-gray-600 bg-gray-900 text-gray-100" : "border-gray-300 bg-white text-gray-800"}`}>
                {analyticsPreferenceNotice}
              </p>
            )}

            <Presence open={showFeedback}>
            {showFeedback && (
                <div className="t-modal-backdrop feedback-modal-backdrop fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowFeedback(false)}>
                <div role="dialog" aria-modal="true" aria-labelledby="feedback-dialog-title" className={`app-feedback-dialog rounded-3xl max-w-lg w-full p-6 shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <h3 id="feedback-dialog-title" className={`text-xl font-black ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Share Your Feedback</h3>
                    </div>
                    <button onClick={() => { setShowFeedback(false); setFeedbackStatus("idle"); }} aria-label="Close feedback dialog" className={`feedback-dialog-close transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Your feedback helps make SmileStreak better for everyone! What do you think?
                  </p>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (feedbackStatus === "sending") return;
                      setFeedbackStatus("sending");
                      const form = e.target;
                      const formData = new FormData(form);
                      try {
                        const response = await fetch('https://formspree.io/f/mqedoavq', {
                          method: 'POST',
                          body: formData,
                          headers: { 'Accept': 'application/json' }
                        });
                        if (response.ok) {
                          form.reset();
                          setFeedbackStatus("success");
                        } else {
                          setFeedbackStatus("error");
                        }
                      } catch (error) {
                        setFeedbackStatus("error");
                      }
                    }}
                    className={`feedback-form space-y-4 ${feedbackStatus === "success" ? "is-sent" : ""}`}
                    aria-busy={feedbackStatus === "sending"}
                  >
                    <div>
                      <label htmlFor="feedback-name" className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name (optional)</label>
                      <input id="feedback-name" type="text" name="name" placeholder="Your name"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' : 'bg-white border-gray-200 focus:border-blue-400'}`} />
                    </div>
                    <div>
                      <label htmlFor="feedback-email" className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email (optional)</label>
                      <input id="feedback-email" type="email" name="email" placeholder="your@email.com"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' : 'bg-white border-gray-200 focus:border-blue-400'}`} />
                    </div>
                    <div>
                      <label htmlFor="feedback-message" className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Your Feedback <span className="text-red-500">*</span></label>
                      <textarea id="feedback-message" name="feedback" required rows={5} placeholder="What do you like? What should we improve? Any bugs?"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none resize-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' : 'bg-white border-gray-200 focus:border-blue-400'}`} />
                    </div>
                    <p className={`text-xs leading-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your name, email, feedback, and selected rating are sent to Formspree and SmileStreak support. Please do not include dental or other sensitive health details.</p>
                    <label className={`flex items-start gap-2 text-xs leading-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      <input type="checkbox" name="feedbackConsent" value="yes" required className="mt-1" />
                      <span>I agree to send this feedback and contact information for SmileStreak support to respond.</span>
                    </label>
                    <fieldset className="feedback-rating-fieldset">
                      <legend className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>How useful is SmileStreak?</legend>
                      <div className="feedback-rating-options flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <label key={rating} className="cursor-pointer">
                            <input type="radio" name="rating" value={rating} aria-label={`${rating} out of 5`} className="sr-only peer" />
                            <div className={`w-12 h-12 flex items-center justify-center border-2 rounded-xl transition-all ${darkMode ? 'border-gray-600 peer-checked:border-blue-500 peer-checked:bg-blue-900/30 hover:border-blue-500' : 'border-gray-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-blue-300'}`}>
                              <span className={`text-lg font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{rating}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>1 = Not useful, 5 = Very useful</p>
                    </fieldset>
                    <button type="submit" disabled={feedbackStatus === "sending" || feedbackStatus === "success"} className="feedback-submit w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-bold shadow-lg transition-all">
                      {feedbackStatus === "sending" ? "Sending…" : "Send feedback"}
                    </button>
                  </form>
                  {feedbackStatus === "success" && <p role="status" className="feedback-form-status is-success">Thanks — your feedback was sent.</p>}
                  {feedbackStatus === "error" && <p role="alert" className="feedback-form-status is-error">We couldn’t send your feedback. Check your connection and try again.</p>}
                  {feedbackStatus === "idle" && <p className={`text-xs text-center mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Thanks for helping us improve.</p>}
                </div>
              </div>
            )}
            </Presence>

            {/* ── USERNAME MODAL ── */}
            <Presence open={usernameLoaded && showUsernameModal && !!user}>
            {usernameLoaded && showUsernameModal && user && (
              <div className="t-modal-backdrop account-modal-backdrop fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
                <div className={`account-modal account-username-modal rounded-3xl w-full max-w-sm p-6 shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} role="dialog" aria-modal="true" aria-labelledby="username-setup-title" aria-describedby="username-setup-description">
                  <div className="account-modal-intro text-center mb-6">
                    {user.photoURL && <img src={user.photoURL} alt="" className="account-avatar w-16 h-16 rounded-full mx-auto mb-3 object-cover" />}
                    <h2 id="username-setup-title" className={`text-xl font-black ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Welcome, {(user.displayName || "there").split(" ")[0]}</h2>
                    <p id="username-setup-description" className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose a unique username to get started</p>
                  </div>

                  <div className="mb-4">
                    <div className={`flex items-center gap-2 border-2 rounded-2xl px-4 py-3 transition-all ${
                      usernameStatus === "available" ? "border-green-400 bg-green-50" :
                      usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "short" || usernameStatus === "long" ? "border-red-300 bg-red-50" :
                      darkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50"
                    }`}>
                      <span className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>@</span>
                      <input
                        aria-label="Choose a username"
                        type="text"
                        placeholder="yourname"
                        value={usernameInput}
                        onChange={e => handleUsernameInput(e.target.value)}
                        maxLength={20}
                        className={`flex-1 bg-transparent text-sm font-semibold focus:outline-none ${darkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                        autoFocus
                      />
                      <UsernameStatusIcon status={usernameStatus} />
                    </div>

                    {usernameError && (
                      <p role="alert" className="text-xs text-red-500 font-medium mt-1.5 px-1">{usernameError}</p>
                    )}
                    {usernameStatus === "available" && usernameInput && (
                      <p role="status" className="text-xs text-green-600 font-medium mt-1.5 px-1">Username available</p>
                    )}
                    <p className={`text-xs mt-1.5 px-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Letters, numbers, underscores · 3–20 characters
                    </p>
                  </div>

                  {usernameSuggestions.length > 0 && (
                    <div className="mb-4">
                      <p className={`text-xs font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try one of these:</p>
                      <div className="flex flex-wrap gap-2">
                        {usernameSuggestions.map(s => (
                          <button
                            key={s}
                            onClick={() => {
                              setUsernameInput(s);
                              handleUsernameInput(s);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                              darkMode ? 'bg-gray-700 border-gray-600 text-blue-400 hover:border-blue-500' : 'bg-blue-50 border-blue-200 text-blue-600 hover:border-blue-400'
                            }`}
                          >
                            @{s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => saveUsername(usernameInput)}
                    disabled={usernameStatus !== "available" || savingUsername}
                    className={`w-full py-3.5 rounded-2xl text-sm font-black transition-all ${
                      usernameStatus === "available" && !savingUsername
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {savingUsername ? "Saving..." : "Claim Username →"}
                  </button>
                </div>
              </div>
            )}
            </Presence>

            {/* ── EDIT USERNAME MODAL ── */}
            <Presence open={showEditUsername && !!user}>
            {showEditUsername && user && (
                <div className="t-modal-backdrop account-modal-backdrop fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowEditUsername(false)}>
                <div className={`account-modal account-username-modal rounded-3xl w-full max-w-sm p-6 shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} role="dialog" aria-modal="true" aria-labelledby="edit-username-title" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 id="edit-username-title" className={`text-lg font-black ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Edit username</h2>
                    <button aria-label="Close username editor" onClick={() => setShowEditUsername(false)} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {username && (
                    <p className={`text-xs mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Current: <span className="font-bold text-blue-600">@{username}</span></p>
                  )}

                  <div className={`flex items-center gap-2 border-2 rounded-2xl px-4 py-3 mb-2 transition-all ${
                    editUsernameStatus === "available" ? "border-green-400 bg-green-50" :
                    editUsernameStatus === "taken" || editUsernameStatus === "invalid" ? "border-red-300 bg-red-50" :
                    darkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50"
                  }`}>
                    <span className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>@</span>
                    <input
                      aria-label="New username"
                      type="text"
                      placeholder="newusername"
                      value={editUsernameInput}
                      onChange={e => handleEditUsernameInput(e.target.value)}
                      maxLength={20}
                      className={`flex-1 bg-transparent text-sm font-semibold focus:outline-none ${darkMode ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                      autoFocus
                    />
                    <UsernameStatusIcon status={editUsernameStatus} />
                  </div>

                  {editUsernameError && (
                    <p role="alert" className="text-xs text-red-500 font-medium mb-1.5 px-1">{editUsernameError}</p>
                  )}
                  {editUsernameStatus === "available" && editUsernameInput && editUsernameInput !== username && (
                    <p role="status" className="text-xs text-green-600 font-medium mb-1.5 px-1">Username available</p>
                  )}

                  {editUsernameSuggestions.length > 0 && (
                    <div className="mb-3">
                      <p className={`text-xs font-bold mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Try one of these:</p>
                      <div className="flex flex-wrap gap-2">
                        {editUsernameSuggestions.map(s => (
                          <button key={s} onClick={() => { setEditUsernameInput(s); handleEditUsernameInput(s); }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-blue-400 hover:border-blue-500' : 'bg-blue-50 border-blue-200 text-blue-600 hover:border-blue-400'}`}>
                            @{s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button onClick={() => setShowEditUsername(false)}
                      className={`flex-1 py-3 rounded-2xl text-sm font-bold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                      Cancel
                    </button>
                    <button
                      onClick={saveEditUsername}
                      disabled={editUsernameStatus !== "available" || savingEditUsername || editUsernameInput === username}
                      className={`flex-1 py-3 rounded-2xl text-sm font-black transition-all ${
                        editUsernameStatus === "available" && !savingEditUsername && editUsernameInput !== username
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {savingEditUsername ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            </Presence>

            {/* ── PROFILE MODAL ── */}
            <Presence open={showProfileModal && !!user}>
            {showProfileModal && user && (() => {
              const { currentStreak, longestStreak, perfectDays, completionRate, unlockedAchievements } = getProfileStats();
              return (
                <div className="t-modal-backdrop account-modal-backdrop fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowProfileModal(false)}>
                  <div
                    className={`account-modal account-profile-modal rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl overflow-y-auto max-h-[90vh] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                    role="dialog" aria-modal="true" aria-labelledby="profile-modal-title"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 sm:hidden" />

                    <div className="account-profile-heading p-6 relative">
                      <button aria-label="Close profile" onClick={() => setShowProfileModal(false)} className="account-dialog-close absolute top-4 right-4">
                        <X className="w-5 h-5" />
                      </button>
                      {user.photoURL && <img
                        src={user.photoURL}
                        alt=""
                        className="account-avatar w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                      />}
                      <h2 id="profile-modal-title" className="text-xl font-medium">{user.displayName || username || "SmileStreak member"}</h2>
                      {username && (
                        <p className="text-sm font-medium mt-0.5">@{username}</p>
                      )}
                      <p className="text-xs mt-1">Joined {formatJoinedDate(joinedDate)}</p>
                    </div>

                    <div className="account-profile-content p-5 space-y-4">
                      <dl className="account-profile-stats">
                        {[
                          { label: "Current streak", value: `${currentStreak} days` },
                          { label: "Longest streak", value: `${longestStreak} days` },
                          { label: "Perfect days", value: perfectDays },
                          { label: "Completion", value: `${completionRate}%` },
                        ].map(s => (
                          <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>
                        ))}
                      </dl>

                      <section className="account-achievements">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>Achievements</h3>
                          <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{unlockedAchievements.length}/{ACHIEVEMENTS.length}</p>
                        </div>
                        {unlockedAchievements.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {unlockedAchievements.map(a => (
                              <span key={a.id} className="account-achievement inline-flex items-center gap-1 px-2.5 py-1.5 border rounded-xl text-xs font-bold">
                                {a.icon} {a.label}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Complete your first perfect day to earn your first achievement.</p>
                        )}
                      </section>

                      <button
                        onClick={() => setShowProfileModal(false)}
                        className={`w-full py-3 rounded-2xl text-sm font-bold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
            </Presence>

          </div>
        </div>
      </ThemeContext.Provider>
    </TranslationContext.Provider>
  );
}
