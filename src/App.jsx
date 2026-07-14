import { useEffect, useState, createContext, useCallback, useRef } from "react";
import NavTabs from "./components/NavTabs";
import Home from "./components/Home";
import Today from "./components/Today";
import Progress from "./components/Progress";
import Tips from "./components/Tips";
import Reminders from "./components/Reminders";
import Scan from "./components/Scan";
import Dentists from "./components/Dentists";
import Report from "./components/Report";
import Insights from "./components/Insights";
import Mission from "./components/Mission";
import Legal from "./components/Legal";
import Leaderboard from "./components/Leaderboard";
import { storage } from "./utils/storage";
import { scheduleDailyNotifications } from "./utils/scheduleNotifications";
import { auth, provider, db } from "./firebase";
import { setupFCMToken, onForegroundMessage } from "./utils/notifications";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";
import { LogOut, RefreshCw, MessageCircle, X, Globe, Check, Languages, Moon, Sun, User, Edit3, BarChart2, Award, Trophy } from "lucide-react";
import { LANGUAGES, getStoredLanguage, saveLanguagePreference, detectBrowserLanguage, translateText } from "./utils/translate";
import { calculateStreaks, isDayComplete } from "./utils/progress";
import { ACHIEVEMENTS } from "./data/achievements";
import { subscribeToLeaderboard } from "./services/leaderboardService";
import "./App.css";

export const TranslationContext = createContext();
export const ThemeContext = createContext();

// ── HELPER: Find available league group for new users ──
const getAvailableLeagueGroup = async (league = "Bronze") => {
  const LEAGUE_GROUP_SIZE = 50;
  
  try {
    const snapshot = await getDocs(
      query(
        collection(db, "users"),
        where("leaderboard.league", "==", league)
      )
    );

    const groups = {};

    snapshot.forEach((doc) => {
      const group = doc.data().leaderboard?.leagueGroup;
      if (group) {
        groups[group] = (groups[group] || 0) + 1;
      }
    });

    let number = 1;
    while (true) {
      const groupName = `${league}-${String(number).padStart(3, "0")}`;
      if (!groups[groupName] || groups[groupName] < LEAGUE_GROUP_SIZE) {
        return groupName;
      }
      number++;
    }
  } catch (error) {
    console.error("Error finding available league group:", error);
    return `${league}-001`;
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
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
        console.log("No user document found, creating new one");
        const joined = new Date().toISOString();
        setJoinedDate(joined);
        
        // ── CREATE NEW USER WITH INTELLIGENT LEAGUE GROUP ──
        const createNewUser = async () => {
          const leagueGroup = await getAvailableLeagueGroup("Bronze");
          
          // Get current week ID
          const now = new Date();
          const year = now.getFullYear();
          const jan1 = new Date(year, 0, 1);
          const days = Math.floor((now - jan1) / (24 * 60 * 60 * 1000));
          const weekNumber = Math.ceil((days + jan1.getDay() + 1) / 7);
          const currentWeekId = `${year}-W${String(weekNumber).padStart(2, "0")}`;

          setDoc(ref, { 
            joinedDate: joined,
            habitData: {},
            leaderboard: {
              weeklyPoints: 0,
              league: "Bronze",
              leagueRank: 0,
              weekId: currentWeekId,
              leagueGroup: leagueGroup,
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
        };
        
        createNewUser();
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

  function login() {
    signInWithPopup(auth, provider)
      .catch((error) => {
        console.error(error);
      });
  }

  function logout() {
    signOut(auth)
      .then(() => {
        setShowAccountMenu(false);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  function switchAccount() {
    signOut(auth).then(() => {
      setShowAccountMenu(false);
      setTimeout(() => login(), 100);
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
    return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const UsernameStatusIcon = ({ status }) => {
    if (status === "checking") return <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />;
    if (status === "available") return <span className="text-green-500 text-sm font-bold">✓</span>;
    if (status === "taken" || status === "invalid" || status === "short" || status === "long") return <span className="text-red-500 text-sm font-bold">✗</span>;
    return null;
  };

  console.log("RENDER - authLoading:", authLoading, "usernameLoaded:", usernameLoaded, "username:", username, "showModal:", showUsernameModal, "hasUser:", !!user);

  // ── Don't render anything until auth is done loading ──
  if (authLoading) {
    return null;
  }

  return (
    <TranslationContext.Provider value={{ t, currentLanguage, translating }}>
      <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
          <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50'}`}>
            <header className={`sticky top-0 z-50 transition-colors duration-300 ${
              darkMode
                ? 'bg-gray-800/95 backdrop-blur-sm border-b border-gray-700'
                : 'bg-gradient-to-r from-blue-50 via-white to-cyan-50 shadow-sm'
            }`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center gap-3">
                    <img
                      src="/icon-511.png"
                      alt="Smile Streak"
                      className="w-10 h-10 rounded-xl shadow-md"
                    />
                    <div>
                      <h1 className="text-xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        Smile Streak
                      </h1>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} hidden sm:block`}>
                        Build better dental habits
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* ── LEADERBOARD BUTTON ── */}
                    {user && (
                      <button
                        onClick={() => setShowLeaderboard(!showLeaderboard)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-semibold ${
                          showLeaderboard
                            ? darkMode
                              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                              : 'bg-yellow-50 border-yellow-400 text-yellow-600'
                            : darkMode
                              ? 'bg-gray-700 border-gray-600 text-gray-200 hover:border-yellow-500 hover:shadow-md'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-yellow-400 hover:shadow-md'
                        }`}
                        title="Leaderboard"
                      >
                        <Trophy className={`w-4 h-4 ${showLeaderboard ? 'text-yellow-500' : ''}`} />
                        <span className="hidden sm:inline">Leaderboard</span>
                      </button>
                    )}

                    <button
                      onClick={toggleDarkMode}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-semibold ${
                        darkMode
                          ? 'bg-gray-700 border-gray-600 text-yellow-400 hover:border-yellow-500 hover:shadow-md'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md'
                      }`}
                      title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                    >
                      {darkMode ? (
                        <>
                          <Sun className="w-4 h-4" />
                          <span className="hidden sm:inline">Light</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-4 h-4" />
                          <span className="hidden sm:inline">Dark</span>
                        </>
                      )}
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-semibold ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-200 hover:border-blue-500 hover:shadow-md'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md'
                        }`}
                        title="Change Language"
                      >
                        <Globe className="w-4 h-4" />
                        <span className="hidden sm:inline">{LANGUAGES[currentLanguage].flag}</span>
                        <span className="text-xs">{currentLanguage.toUpperCase()}</span>
                      </button>

                      {showLanguageMenu && (
                        <div className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border py-2 z-50 max-h-96 overflow-y-auto ${
                          darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                          <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <p className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Select Language</p>
                          </div>
                          {Object.entries(LANGUAGES).map(([code, lang]) => (
                            <button
                              key={code}
                              onClick={() => changeLanguage(code)}
                              className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                                darkMode
                                  ? currentLanguage === code ? 'bg-gray-700' : 'hover:bg-gray-700'
                                  : currentLanguage === code ? 'bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{lang.flag}</span>
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
                    </div>

                    {user ? (
                      <div className="relative">
                        <button
                          onClick={() => setShowAccountMenu(!showAccountMenu)}
                          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
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
                            className="w-10 h-10 rounded-full border-2 border-blue-200 shadow-md cursor-pointer"
                          />
                        </button>

                        {showAccountMenu && (
                          <div className={`absolute right-0 mt-2 w-64 rounded-2xl shadow-2xl border py-2 z-50 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                          }`}>
                            <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                              <div className="flex items-center gap-3">
                                <img
                                  src={user.photoURL}
                                  alt={user.displayName}
                                  className="w-12 h-12 rounded-full border-2 border-blue-200"
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

                            <div className="py-1">
                              <button
                                onClick={() => { setShowProfileModal(true); setShowAccountMenu(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                }`}
                              >
                                <User className="w-4 h-4 text-blue-600" />
                                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>View Profile</span>
                              </button>

                              <button
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
                                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Edit Username</span>
                              </button>

                              <button
                                onClick={() => { setActiveTab("progress"); setShowAccountMenu(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                }`}
                              >
                                <BarChart2 className="w-4 h-4 text-green-600" />
                                <Award className="w-4 h-4 text-yellow-500 -ml-1" />
                                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Statistics & Badges</span>
                              </button>

                              <div className={`my-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`} />

                              <button
                                onClick={switchAccount}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                                }`}
                              >
                                <RefreshCw className="w-4 h-4 text-blue-600" />
                                <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Switch Account</span>
                              </button>

                              <button
                                onClick={logout}
                                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-red-50'
                                }`}
                              >
                                <LogOut className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-medium text-red-600">Sign Out</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={login}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all font-semibold text-sm ${
                          darkMode
                            ? 'bg-gray-700 border-gray-600 text-gray-200 hover:border-blue-500 hover:shadow-md'
                            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="hidden sm:inline">Sign in with Google</span>
                        <span className="sm:hidden">Sign in</span>
                      </button>
                    )}
                  </div>
                </div>

                <NavTabs activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>
            </header>

            {(showAccountMenu || showLanguageMenu) && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setShowAccountMenu(false);
                  setShowLanguageMenu(false);
                }}
              />
            )}

            {translating && (
              <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2">
                <Languages className="w-5 h-5 animate-spin" />
                <span className="font-semibold">Translating...</span>
              </div>
            )}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
              {/* ── LEADERBOARD ── */}
              {showLeaderboard && user && (
                <Leaderboard
                  user={user}
                  username={username}
                  habitData={habitData}
                  darkMode={darkMode}
                />
              )}

              {activeTab === "home" && <Home setActiveTab={setActiveTab} user={user} habitData={habitData} />}
              {activeTab === "today" && <Today habitData={habitData} setHabitData={setHabitData} user={user} />}
              {activeTab === "progress" && <Progress habitData={habitData} />}
              {activeTab === "tips" && <Tips />}
              {activeTab === "reminders" && <Reminders />}
              {activeTab === "scan" && <Scan habitData={habitData} setHabitData={setHabitData} />}
              {activeTab === "dentists" && <Dentists />}
              {activeTab === "report" && <Report habitData={habitData} />}
              {activeTab === "insights" && <Insights habitData={habitData} />}
              {activeTab === "mission" && <Mission />}
              {activeTab === "legal" && <Legal />}
            </main>

            <button
              onClick={() => setShowFeedback(true)}
              className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-full shadow-2xl hover:shadow-xl hover:scale-110 transition-all duration-200 group"
              title="Give Feedback"
            >
              <MessageCircle className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            </button>

            {showFeedback && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className={`rounded-3xl max-w-lg w-full p-6 shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                      <h3 className={`text-xl font-black ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Share Your Feedback</h3>
                    </div>
                    <button onClick={() => setShowFeedback(false)} className={`transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <p className={`text-sm mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Your feedback helps make SmileStreak better for everyone! What do you think?
                  </p>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target;
                      const formData = new FormData(form);
                      try {
                        const response = await fetch('https://formspree.io/f/mqedoavq', {
                          method: 'POST',
                          body: formData,
                          headers: { 'Accept': 'application/json' }
                        });
                        if (response.ok) {
                          alert('Thank you for your feedback!');
                          form.reset();
                          setShowFeedback(false);
                        } else {
                          alert('Oops! Something went wrong. Please try again.');
                        }
                      } catch (error) {
                        alert('Network error. Please check your connection and try again.');
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Name (optional)</label>
                      <input type="text" name="name" placeholder="Your name"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' : 'bg-white border-gray-200 focus:border-blue-400'}`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email (optional)</label>
                      <input type="email" name="email" placeholder="your@email.com"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' : 'bg-white border-gray-200 focus:border-blue-400'}`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Your Feedback <span className="text-red-500">*</span></label>
                      <textarea name="feedback" required rows={5} placeholder="What do you like? What should we improve? Any bugs?"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none resize-none ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-500' : 'bg-white border-gray-200 focus:border-blue-400'}`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>How useful is SmileStreak?</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <label key={rating} className="cursor-pointer">
                            <input type="radio" name="rating" value={rating} className="sr-only peer" />
                            <div className={`w-12 h-12 flex items-center justify-center border-2 rounded-xl transition-all ${darkMode ? 'border-gray-600 peer-checked:border-blue-500 peer-checked:bg-blue-900/30 hover:border-blue-500' : 'border-gray-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 hover:border-blue-300'}`}>
                              <span className={`text-lg font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{rating}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>1 = Not useful, 5 = Very useful</p>
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
                      Send Feedback
                    </button>
                  </form>
                  <p className={`text-xs text-center mt-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Thanks for helping us improve! 💙</p>
                </div>
              </div>
            )}

            {/* ── USERNAME MODAL ── */}
            {usernameLoaded && showUsernameModal && user && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className={`rounded-3xl w-full max-w-sm p-6 shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="text-center mb-6">
                    <img src={user.photoURL} alt={user.displayName} className="w-16 h-16 rounded-full border-4 border-blue-200 mx-auto mb-3 shadow-lg" />
                    <h2 className={`text-xl font-black ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Welcome, {user.displayName.split(" ")[0]}! 👋</h2>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Choose a unique username to get started</p>
                  </div>

                  <div className="mb-4">
                    <div className={`flex items-center gap-2 border-2 rounded-2xl px-4 py-3 transition-all ${
                      usernameStatus === "available" ? "border-green-400 bg-green-50" :
                      usernameStatus === "taken" || usernameStatus === "invalid" || usernameStatus === "short" || usernameStatus === "long" ? "border-red-300 bg-red-50" :
                      darkMode ? "border-gray-600 bg-gray-700" : "border-gray-200 bg-gray-50"
                    }`}>
                      <span className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>@</span>
                      <input
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
                      <p className="text-xs text-red-500 font-medium mt-1.5 px-1">{usernameError}</p>
                    )}
                    {usernameStatus === "available" && usernameInput && (
                      <p className="text-xs text-green-600 font-medium mt-1.5 px-1">✓ Username available!</p>
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

            {/* ── EDIT USERNAME MODAL ── */}
            {showEditUsername && user && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowEditUsername(false)}>
                <div className={`rounded-3xl w-full max-w-sm p-6 shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className={`text-lg font-black ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Edit Username</h2>
                    <button onClick={() => setShowEditUsername(false)} className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}>
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
                    <p className="text-xs text-red-500 font-medium mb-1.5 px-1">{editUsernameError}</p>
                  )}
                  {editUsernameStatus === "available" && editUsernameInput && editUsernameInput !== username && (
                    <p className="text-xs text-green-600 font-medium mb-1.5 px-1">✓ Username available!</p>
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

            {/* ── PROFILE MODAL ── */}
            {showProfileModal && user && (() => {
              const { currentStreak, longestStreak, perfectDays, completionRate, unlockedAchievements } = getProfileStats();
              return (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowProfileModal(false)}>
                  <div
                    className={`rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl overflow-y-auto max-h-[90vh] ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-3 sm:hidden" />

                    <div className="bg-gradient-to-br from-blue-600 via-cyan-500 to-blue-500 p-6 text-white text-center relative">
                      <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 text-white/70 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-20 h-20 rounded-full border-4 border-white/40 mx-auto mb-3 shadow-xl"
                      />
                      <h2 className="text-xl font-black">{user.displayName}</h2>
                      {username && (
                        <p className="text-blue-100 text-sm font-medium mt-0.5">@{username}</p>
                      )}
                      <p className="text-blue-200 text-xs mt-1">Joined {formatJoinedDate(joinedDate)}</p>
                    </div>

                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { emoji: "🔥", label: "Current Streak", value: `${currentStreak}d`, color: "from-orange-50 to-red-50", border: "border-orange-100", text: "text-orange-600" },
                          { emoji: "🏅", label: "Longest Streak", value: `${longestStreak}d`, color: "from-yellow-50 to-orange-50", border: "border-yellow-100", text: "text-yellow-600" },
                          { emoji: "✅", label: "Perfect Days", value: perfectDays, color: "from-green-50 to-emerald-50", border: "border-green-100", text: "text-green-600" },
                          { emoji: "📈", label: "Completion", value: `${completionRate}%`, color: "from-blue-50 to-cyan-50", border: "border-blue-100", text: "text-blue-600" },
                        ].map(s => (
                          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 border ${s.border} text-center`}>
                            <p className="text-2xl mb-1">{s.emoji}</p>
                            <p className={`text-xl font-black ${s.text}`}>{s.value}</p>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className={`rounded-2xl p-4 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>🏆 Achievements</p>
                          <p className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{unlockedAchievements.length}/{ACHIEVEMENTS.length}</p>
                        </div>
                        {unlockedAchievements.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {unlockedAchievements.map(a => (
                              <span key={a.id} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-200 rounded-xl text-xs font-bold text-yellow-800">
                                {a.icon} {a.label}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Complete your first perfect day to earn your first achievement! 🌅</p>
                        )}
                      </div>

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

          </div>
        </div>
      </ThemeContext.Provider>
    </TranslationContext.Provider>
  );
}
