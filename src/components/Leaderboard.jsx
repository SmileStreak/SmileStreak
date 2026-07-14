import { useState, useEffect } from "react";
import { X, Trophy, Medal, Flame, Search, Crown, Shield, ArrowUp, ArrowDown, Minus, Clock } from "lucide-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { calculateStreaks } from "../utils/progress";

export default function Leaderboard({ user, username, habitData, darkMode }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });

  // ── LEAGUE CONFIG ──
  const LEAGUE_EMOJIS = {
    Bronze: "🥉",
    Silver: "🥈",
    Gold: "🥇",
    Diamond: "💎",
    Champion: "👑"
  };

  const LEAGUE_COLORS = {
    Bronze: "from-amber-600 to-amber-800",
    Silver: "from-gray-400 to-gray-600",
    Gold: "from-yellow-400 to-yellow-600",
    Diamond: "from-cyan-400 to-blue-600",
    Champion: "from-purple-500 to-pink-600"
  };

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
    const fetchLeaguePlayers = async () => {
      if (!user) {
        console.log("No user logged in, skipping leaderboard fetch");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // First, get the current user's league data
        const userRef = collection(db, "users");
        const userQuery = query(userRef);
        const userSnapshot = await getDocs(userQuery);
        
        let currentUserData = null;
        userSnapshot.forEach((doc) => {
          if (doc.id === user.uid) {
            currentUserData = doc.data();
          }
        });

        if (!currentUserData) {
          console.log("User data not found");
          setLoading(false);
          return;
        }

        const league = currentUserData.leaderboard?.league || "Bronze";
        const leagueGroup = currentUserData.leaderboard?.leagueGroup || "default";
        const weekId = currentUserData.leaderboard?.weekId || "";

        console.log(`🔍 Fetching players in league: ${league}, group: ${leagueGroup}, week: ${weekId}`);

        // Query users in the same league
        const usersRef = collection(db, "users");
        const q = query(
          usersRef,
          where("leaderboard.league", "==", league),
          where("leaderboard.leagueGroup", "==", leagueGroup),
          where("leaderboard.weekId", "==", weekId)
        );
        
        const querySnapshot = await getDocs(q);
        console.log(`📊 Found ${querySnapshot.size} players in this league`);

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

        console.log("🏆 Final players array:", playersData);
        setPlayers(playersData);

      } catch (error) {
        console.error("❌ Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaguePlayers();
  }, [user]);

  // ── FILTER PLAYERS BY SEARCH ──
  const filteredPlayers = players.filter(player =>
    player.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── GET CURRENT USER ──
  const currentUser = players.find(p => p.uid === user?.uid);

  // ── PROMOTION STATUS ──
  const getPromotionStatus = (rank, totalPlayers) => {
    if (totalPlayers === 0) return { status: "Unknown", icon: "❓", color: "text-gray-400" };
    const percentile = rank / totalPlayers;
    if (percentile <= 0.2) {
      return { status: "Promotion Zone ↑", icon: "⬆️", color: "text-green-600" };
    } else if (percentile <= 0.8) {
      return { status: "Safe ✓", icon: "✅", color: "text-blue-600" };
    } else {
      return { status: "Demotion Zone ↓", icon: "⬇️", color: "text-red-600" };
    }
  };

  // ── TOP 3 AND REST ──
  const topThree = filteredPlayers.slice(0, 3);
  const rest = filteredPlayers.slice(3);

  // ── MEDAL EMOJI ──
  const medal = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };

  if (loading) {
    return (
      <div className={`w-full rounded-2xl p-8 text-center ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-2xl overflow-hidden shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} mb-6`}>
      
      {/* ── HEADER ── */}
      <div className={`bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 p-5 text-white`}>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black">League Leaderboard</h2>
            <p className="text-white/90 text-xs">Ranked by weekly points</p>
          </div>
        </div>
      </div>

      {/* ── LEAGUE HEADER ── */}
      {currentUser && (
        <div className={`mx-4 mt-4 rounded-xl p-4 border ${
          darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{LEAGUE_EMOJIS[currentUser.league] || "🏆"}</span>
              <div>
                <p className={`text-xs font-bold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Your League</p>
                <h3 className={`text-xl font-black bg-gradient-to-r ${LEAGUE_COLORS[currentUser.league] || 'from-gray-400 to-gray-600'} bg-clip-text text-transparent`}>
                  {currentUser.league || "Bronze"}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Weekly Points</p>
              <p className="text-xl font-black text-blue-600">{currentUser.weeklyPoints || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── YOUR RANK ── */}
      {currentUser && (
        <div className={`mx-4 mt-4 rounded-xl p-4 border ${
          darkMode ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-200"
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-bold uppercase text-blue-500">Your Rank</p>
              <h3 className="text-2xl font-black">#{currentUser.rank}</h3>
            </div>
            <div className="text-right">
              <p className="font-bold">@{currentUser.username}</p>
              <p className="text-sm text-gray-500">
                🔥 {currentUser.currentStreak} day streak
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── PROMOTION STATUS ── */}
      {currentUser && (
        <div className={`mx-4 mt-4 rounded-xl p-4 border ${
          darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <span className={`text-sm font-bold ${getPromotionStatus(currentUser.rank, players.length).color}`}>
                {getPromotionStatus(currentUser.rank, players.length).status}
              </span>
            </div>
            <span className="text-xs text-gray-400">
              {Math.round((currentUser.rank / players.length) * 100)}th percentile
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(currentUser.rank / players.length) * 100}%`,
                background: currentUser.rank / players.length <= 0.2 
                  ? "linear-gradient(90deg, #22c55e, #16a34a)"
                  : currentUser.rank / players.length <= 0.8
                  ? "linear-gradient(90deg, #3b82f6, #06b6d4)"
                  : "linear-gradient(90deg, #ef4444, #dc2626)"
              }}
            />
          </div>
        </div>
      )}

      {/* ── SEARCH ── */}
      <div className="px-4 mt-4">
        <div className={`flex items-center rounded-xl px-4 py-2 ${
          darkMode ? "bg-gray-700" : "bg-gray-100"
        }`}>
          <Search className="w-4 h-4 mr-2 text-gray-400" />
          <input
            placeholder="Search username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`bg-transparent outline-none flex-1 text-sm ${
              darkMode ? "text-gray-200 placeholder-gray-400" : "text-gray-900 placeholder-gray-500"
            }`}
          />
        </div>
      </div>

      {/* ── TOP 3 ── */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-3 gap-3">
          {topThree.map((player, index) => (
            <div
              key={player.uid}
              className={`rounded-xl p-3 text-center border ${
                index === 0
                  ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30"
                  : darkMode
                  ? "border-gray-700 bg-gray-700/50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="text-2xl mb-1">{medal(index + 1)}</div>
              <img
                src={player.photoURL}
                alt={player.username}
                className="w-12 h-12 rounded-full mx-auto border-2 border-white shadow-lg"
              />
              <h4 className="mt-2 font-bold text-sm truncate">@{player.username}</h4>
              <p className="text-xs text-gray-500">⭐ {player.weeklyPoints} pts</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FULL LIST ── */}
      <div className="mt-4 max-h-[300px] overflow-y-auto px-4 pb-4">
        {rest.length === 0 && topThree.length === 0 && (
          <p className={`text-center py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No players found in your league
          </p>
        )}
        {rest.map((player) => (
          <div
            key={player.uid}
            className={`flex items-center justify-between rounded-xl px-3 py-2 mb-2 transition ${
              player.uid === user?.uid
                ? "bg-blue-500 text-white"
                : darkMode
                ? "bg-gray-700/50 hover:bg-gray-700"
                : "bg-gray-50 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className={`font-black w-6 text-sm ${player.uid === user?.uid ? 'text-white' : ''}`}>
                {player.rank}
              </span>
              <img
                src={player.photoURL}
                alt={player.username}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="font-bold text-sm">@{player.username}</p>
                <p className="text-xs text-gray-400">🔥 {player.currentStreak} day streak</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold text-sm ${player.uid === user?.uid ? 'text-white' : 'text-blue-600'}`}>
                ⭐ {player.weeklyPoints}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOTER ── */}
      <div className={`px-4 py-3 text-center border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col items-center gap-1">
          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {players.length} players in this league
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>Season ends in: {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m</span>
          </div>
        </div>
      </div>

    </div>
  );
}
