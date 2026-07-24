export const mockUser = {
  name: "Việt Anh",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=VietAnh",
  xpToday: 235,
  streak: 26,
  bestStreak: 58,
  totalStreak: 143,
  studyTimeTodayMins: 42,
  lexiCredit: {
    balance: 2350,
    earnedToday: 65,
    spent: 120,
    level: "Silver",
  },
  dailyTarget: 20,
};

export const mockVocabAnalytics = {
  total: 4352,
  new: 180,
  learning: 520,
  passive: 2180,
  active: 1102,
  mastered: 370,
};

export const mockVocabDNA = [
  { subject: 'Academic', A: 92, fullMark: 100 },
  { subject: 'Business', A: 84, fullMark: 100 },
  { subject: 'Technology', A: 71, fullMark: 100 },
  { subject: 'Science', A: 63, fullMark: 100 },
  { subject: 'Arts', A: 51, fullMark: 100 },
];

export const mockSpeakingAnalytics = [
  { day: 'Mon', fluency: 65, pronunciation: 70, grammar: 72, confidence: 60, time: 20 },
  { day: 'Tue', fluency: 68, pronunciation: 75, grammar: 75, confidence: 62, time: 25 },
  { day: 'Wed', fluency: 70, pronunciation: 72, grammar: 78, confidence: 65, time: 30 },
  { day: 'Thu', fluency: 72, pronunciation: 80, grammar: 79, confidence: 67, time: 35 },
  { day: 'Fri', fluency: 75, pronunciation: 82, grammar: 80, confidence: 68, time: 40 },
  { day: 'Sat', fluency: 76, pronunciation: 84, grammar: 81, confidence: 69, time: 38 },
  { day: 'Sun', fluency: 78, pronunciation: 85, grammar: 81, confidence: 69, time: 38 },
];

export const mockDailyMissions = [
  { id: 1, title: "Learn 20 new words", completed: true, reward: "+40 XP" },
  { id: 2, title: "Review 30 flashcards", completed: true, reward: "+60 XP" },
  { id: 3, title: "Complete Speaking Practice", completed: false, reward: "+30 LexiCredit" },
  { id: 4, title: "Activate 5 Passive Words", completed: false, reward: "+20 XP" },
];

export const mockBadges = [
  { id: 'spark', name: "Spark", icon: "Zap", color: "text-orange-500", bg: "bg-orange-500/10", unlocked: true, legendary: false, mythic: false },
  { id: 'flame', name: "Flame", icon: "Flame", color: "text-red-500", bg: "bg-red-500/10", unlocked: true, legendary: false, mythic: false },
  { id: 'first_coin', name: "First Coin", icon: "Coins", color: "text-yellow-500", bg: "bg-yellow-500/10", unlocked: true, legendary: true, mythic: false },
  { id: 'focus_master', name: "Focus Master", icon: "Target", color: "text-purple-500", bg: "bg-purple-500/10", unlocked: true, legendary: false, mythic: false },
  { id: 'academic_dna', name: "Academic DNA", icon: "Dna", color: "text-blue-500", bg: "bg-blue-500/10", unlocked: true, legendary: false, mythic: true },
  { id: 'scholar', name: "Scholar", icon: "BookOpen", color: "text-gray-400", bg: "bg-gray-400/10", unlocked: false, legendary: false, mythic: false },
  { id: 'polyglot', name: "Polyglot", icon: "Globe", color: "text-gray-400", bg: "bg-gray-400/10", unlocked: false, legendary: false, mythic: false },
];

export const mockRecentActivity = [
  { id: 1, action: "Learned \"meticulous\"", reward: "+15 XP", time: "2 hours ago", type: "learn" },
  { id: 2, action: "Completed Speaking Practice", reward: "+45 XP", time: "5 hours ago", type: "speaking" },
  { id: 3, action: "Unlocked Focus Master", reward: "Badge", time: "1 day ago", type: "badge" },
  { id: 4, action: "Reviewed Business Deck", reward: "+30 XP", time: "1 day ago", type: "review" },
];

export const mockRecommendations = [
  { id: 1, title: "Academic Set 5", time: "15 min", type: "New Words", color: "bg-blue-500/10 text-blue-500", icon: "BookOpen" },
  { id: 2, title: "Speaking Practice", time: "10 min", type: "Pronunciation", color: "bg-purple-500/10 text-purple-500", icon: "Mic" },
  { id: 3, title: "Activate Passive Words", time: "8 min", type: "Review", color: "bg-green-500/10 text-green-500", icon: "Zap" },
  { id: 4, title: "Business Review", time: "12 min", type: "Spaced Repetition", color: "bg-orange-500/10 text-orange-500", icon: "Briefcase" },
];

export const mockWeeklyReport = {
  studyTime: "5h 42m",
  newWords: 164,
  activeWords: "+38",
  speakingTime: "52m",
  xp: "+1320",
};

// Generate GitHub-style heatmap data (365 days)
export const generateHeatmapData = () => {
  const data = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    // Random activity, higher probability in recent days
    const isActive = Math.random() > 0.4;
    const value = isActive ? Math.floor(Math.random() * 4) + 1 : 0;
    const studyMinutes = isActive ? value * 15 + Math.floor(Math.random() * 10) : 0;
    const xp = studyMinutes * 3;
    
    data.push({
      date: date.toISOString().split('T')[0],
      value, // 0-4 scale for color intensity
      studyMinutes,
      xp
    });
  }
  return data;
};

export const mockHeatmapData = generateHeatmapData();
