import HeroCard from "@/components/dashboard/HeroCard";
import DailyMissions from "@/components/dashboard/DailyMissions";
import AICoachCard from "@/components/dashboard/AICoachCard";
import VocabularyChart from "@/components/dashboard/VocabularyChart";
import ActivePassiveCard from "@/components/dashboard/ActivePassiveCard";
import VocabularyDNA from "@/components/dashboard/VocabularyDNA";
import SpeakingChart from "@/components/dashboard/SpeakingChart";
import Heatmap from "@/components/dashboard/Heatmap";
import StreakCard from "@/components/dashboard/StreakCard";
import LexiCreditCard from "@/components/dashboard/LexiCreditCard";
import BadgeCarousel from "@/components/dashboard/BadgeCarousel";
import RecentActivity from "@/components/dashboard/RecentActivity";
import Recommendations from "@/components/dashboard/Recommendations";
import WeeklyReport from "@/components/dashboard/WeeklyReport";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-12">
      {/* Row 1: Hero (Span 2/3) + Streak (Span 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <HeroCard />
        </div>
        <div className="lg:col-span-1">
          <StreakCard />
        </div>
      </div>

      {/* Row 2: AI Coach (Full width priority) */}
      <div className="w-full">
        <AICoachCard />
      </div>

      {/* Row 3: Daily Missions + Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-1">
          <DailyMissions />
        </div>
        <div className="lg:col-span-1">
          <VocabularyChart />
        </div>
        <div className="lg:col-span-1">
          <ActivePassiveCard />
        </div>
      </div>

      {/* Row 4: DNA + Speaking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div>
          <VocabularyDNA />
        </div>
        <div>
          <SpeakingChart />
        </div>
      </div>

      {/* Row 5: Heatmap + LexiCredit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <Heatmap />
        </div>
        <div className="lg:col-span-1">
          <LexiCreditCard />
        </div>
      </div>

      {/* Row 6: Badges (Full Width) */}
      <div className="w-full">
        <BadgeCarousel />
      </div>

      {/* Row 7: Activity + Recommendations + Weekly Report */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
        <div className="lg:col-span-1">
          <Recommendations />
        </div>
        <div className="lg:col-span-1">
          <WeeklyReport />
        </div>
      </div>
    </div>
  );
}
