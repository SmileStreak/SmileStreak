import { useState, useEffect, useContext } from "react";
import { Trophy, Search, Shield, Clock } from "lucide-react";
import { collection, doc, getDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { calculateStreaks } from "../utils/progress";
import { TranslationContext } from "../App";

export default function Leaderboard({ user, darkMode }) {
  const { t, currentLanguage } = useContext(TranslationContext);
  const [texts, setTexts] = useState({});
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });

  const copy = {
    loading: "Loading leaderboard",
    unavailable: "Leaderboard unavailable",
    loadError: "We couldn’t load this week’s rankings. Your streak and task tracking are still available.",
    retry: "Try again",
    title: "League leaderboard",
    rankedBy: "Ranked by weekly points",
    yourLeague: "Your league",
    yourPlace: "Your place",
    weeklyPoints: "Weekly points",
    currentStreak: "Current streak",
    seasonOutlook: "Season outlook",
    rankPosition: "Rank position in league",
    searchUsers: "Search usernames",
    searchPlaceholder: "Search username…",
    leagueRankings: "League rankings",
    noPlayers: "No players found in your league",
    dayStreak: "day streak",
    daysLabel: "days",
    pointsShort: "pts",
    players: "players in this league",
    seasonEnds: "Season ends in:",
    days: "d",
    hours: "h",
    minutes: "m",
    pending: "Position pending",
    promotion: "Promotion zone",
    maintaining: "Maintaining position",
    belowLine: "Below promotion line",
  };

  useEffect(() => {
    let active = true;
    const translate = async () => {
      const entries = await Promise.all(Object.entries(copy).map(async ([key, value]) => [key, await t(value)]));
      if (active) setTexts(Object.fromEntries(entries));
    };
    translate().catch((error) => console.error("Could not load leaderboard translations:", error));
    return () => { active = false; };
  }, [currentLanguage, t]);

  const T = (key) => texts[key] || copy[key];

  // ── TIME REMAINING CALCULATION ──
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday
      const daysUntilSunday = (7 - dayOfWeek) % 7;
      const nextSunday = new Date(now);
      nextSunday.setDate(now.getDate() + daysUntilSunday);
      nextSunday.setHours(23, 59, 59, 999);

      const diff = nextSunday - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining({ days, hours, minutes });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // ── FETCH LEAGUE PLAYERS ──
  useEffect(() => {
    let active = true;
    const fetchLeaguePlayers = async () => {
      if (!user) {
        setPlayers([]);
        setLoadError(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(false);
      try {
        // Read only the signed-in user's document to determine their league.
        const currentUserSnapshot = await getDoc(doc(db, "users", user.uid));
        if (!active) return;
        const currentUserData = currentUserSnapshot.exists() ? currentUserSnapshot.data() : null;

        if (!currentUserData) {
          setPlayers([]);
          setLoading(false);
          return;
        }

        const league = currentUserData.leaderboard?.league || "Bronze";
        const leagueGroup = currentUserData.leaderboard?.leagueGroup || "default";
        const weekId = currentUserData.leaderboard?.weekId || "";

        // Query users in the same league
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("leaderboard.league", "==", league),
          where("leaderboard.leagueGroup", "==", leagueGroup),
          where("leaderboard.weekId", "==", weekId)
        );
        
        const querySnapshot = await getDocs(q);
        if (!active) return;
        const playersData = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const leaderboard = data.leaderboard || {};
          
          // Calculate streak
          const { currentStreak, longestStreak } = calculateStreaks(data.habitData || {});

          playersData.push({
            uid: doc.id,
            username: data.username || "Anonymous",
            displayName: data.displayName || data.username || "Anonymous",
            photoURL: data.photoURL || data.userProfile?.photoURL || "",
            currentStreak: currentStreak,
            longestStreak: longestStreak,
            weeklyPoints: leaderboard.weeklyPoints || 0,
            league: leaderboard.league || "Bronze",
            leagueGroup: leaderboard.leagueGroup || "default",
            weekId: leaderboard.weekId || "",
            rank: 0
          });
        });

        // Sort by weeklyPoints (highest first)
        playersData.sort((a, b) => b.weeklyPoints - a.weeklyPoints);

        // Assign ranks
        playersData.forEach((player, index) => {
          player.rank = index + 1;
        });

        if (active) setPlayers(playersData);

      } catch (error) {
        console.error("Unable to load the leaderboard.", error);
        if (active) {
          setPlayers([]);
          setLoadError(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchLeaguePlayers();
    return () => { active = false; };
  }, [user, loadAttempt]);

  // ── FILTER PLAYERS BY SEARCH ──
  const filteredPlayers = players.filter(player =>
    player.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── GET CURRENT USER ──
  const currentUser = players.find(p => p.uid === user?.uid);

  // ── PROMOTION STATUS ──
  const getPromotionStatus = (rank, totalPlayers) => {
    if (totalPlayers === 0) return { status: T("pending"), color: "is-neutral" };
    const percentile = rank / totalPlayers;
    if (percentile <= 0.2) {
      return { status: T("promotion"), color: "is-positive" };
    } else if (percentile <= 0.8) {
      return { status: T("maintaining"), color: "is-neutral" };
    } else {
      return { status: T("belowLine"), color: "is-caution" };
    }
  };

  if (loading) {
    return (
      <div className={`leaderboard-loading w-full rounded-2xl p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`} role="status" aria-label={T("loading")}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <section className={`leaderboard-error ${darkMode ? "is-dark" : ""}`} role="alert" aria-labelledby="leaderboard-error-title">
        <h2 id="leaderboard-error-title">{T("unavailable")}</h2>
        <p>{T("loadError")}</p>
        <button type="button" onClick={() => setLoadAttempt(attempt => attempt + 1)}>{T("retry")}</button>
      </section>
    );
  }

  return (
    <section className={`leaderboard-panel w-full overflow-hidden rounded-xl border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-slate-200'} mb-6`} aria-labelledby="leaderboard-title">
      
      {/* ── HEADER ── */}
      <div className={`leaderboard-header border-b p-5 ${darkMode ? 'border-gray-700' : 'border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <div>
            <h2 id="leaderboard-title" className={`font-serif text-xl font-medium tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{T("title")}</h2>
            <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{T("rankedBy")}</p>
          </div>
        </div>
      </div>

      {/* ── LEAGUE HEADER ── */}
      {currentUser && (() => {
        const position = getPromotionStatus(currentUser.rank, players.length);
        const percentile = players.length ? Math.round((currentUser.rank / players.length) * 100) : 0;
        return (
          <div className={`leaderboard-overview ${darkMode ? "is-dark" : ""}`}>
            <div className="leaderboard-overview-heading">
              <div className="leaderboard-league-name">
                <Trophy aria-hidden="true" />
                <div><span>{T("yourLeague")}</span><strong>{currentUser.league || "Bronze"}</strong></div>
              </div>
              <div className="leaderboard-position">
                <span>{T("yourPlace")}</span><strong>#{currentUser.rank}</strong>
              </div>
            </div>
            <dl className="leaderboard-overview-stats">
              <div><dt>{T("weeklyPoints")}</dt><dd>{currentUser.weeklyPoints || 0}</dd></div>
              <div><dt>{T("currentStreak")}</dt><dd>{currentUser.currentStreak} {T("daysLabel")}</dd></div>
              <div><dt>{T("seasonOutlook")}</dt><dd className={position.color}><Shield aria-hidden="true" />{position.status}</dd></div>
            </dl>
            <div className="leaderboard-standing-track" role="progressbar" aria-label={T("rankPosition")} aria-valuemin="1" aria-valuemax={players.length || 1} aria-valuenow={currentUser.rank}>
              <span style={{ width: `${percentile}%` }} />
            </div>
          </div>
        );
      })()}

      {/* ── SEARCH ── */}
      <div className="px-4 mt-4">
        <div className={`leaderboard-search flex items-center rounded-xl px-4 py-2 ${
          darkMode ? "bg-gray-700" : "bg-gray-100"
        }`}>
          <Search className="w-4 h-4 mr-2 text-gray-400" />
          <input
            aria-label={T("searchUsers")}
            placeholder={T("searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`bg-transparent outline-none flex-1 text-sm ${
              darkMode ? "text-gray-200 placeholder-gray-400" : "text-gray-900 placeholder-gray-500"
            }`}
          />
        </div>
      </div>

      {/* ── RANKED LIST ── */}
      <ol className="leaderboard-ranking-list mt-4 max-h-[360px] overflow-y-auto px-4 pb-4" aria-label={T("leagueRankings")}>
        {filteredPlayers.length === 0 && (
          <li className={`leaderboard-empty text-center py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {T("noPlayers")}
          </li>
        )}
        {filteredPlayers.map((player) => (
          <li
            key={player.uid}
            aria-current={player.uid === user?.uid ? "true" : undefined}
            className={`leaderboard-player-row ${player.rank <= 3 ? "is-leading" : ""} ${player.uid === user?.uid ? "is-current" : ""}`}
          >
            <div className="flex items-center gap-3">
              <span className="leaderboard-player-rank">{player.rank}</span>
              {player.photoURL ? (
                <img src={player.photoURL} alt="" className="leaderboard-player-avatar w-8 h-8 rounded-full border border-slate-200 object-cover" />
              ) : (
                <span className="leaderboard-player-avatar is-placeholder" aria-hidden="true">{player.username.slice(0, 1).toUpperCase()}</span>
              )}
              <div>
                <p className="font-bold text-sm">@{player.username}</p>
                <p className="leaderboard-player-streak">{player.currentStreak} {T("dayStreak")}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="leaderboard-player-points">
                {player.weeklyPoints} <span>{T("pointsShort")}</span>
              </p>
            </div>
          </li>
        ))}
      </ol>

      {/* ── FOOTER ── */}
      <div className={`leaderboard-footer px-4 py-3 text-center border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col items-center gap-1">
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {players.length} {T("players")}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{T("seasonEnds")} {timeRemaining.days}{T("days")} {timeRemaining.hours}{T("hours")} {timeRemaining.minutes}{T("minutes")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
