'use client';

import { useEffect } from "react";
import { DashboardHeader } from "./DashboardHeader";
import { HabitsList } from "./HabitsList";
import { StepsCard } from "./StepsCard";
import { WeightLossPlan } from "./WeightLossPlan";
import { WorkoutResults } from "./WorkoutResults";
import NotificationStack from "./NotificationStack"

export function HealthDashboard() {
  useEffect(() => {
    document.title = "kaiyo";
  }, []);

  return (
    <>
      <DashboardHeader />

      <div className="grid gap-6 xl:grid-cols-[1.68fr_1fr] [@media(max-height:950px)]:gap-4">
        <WorkoutResults />
        <NotificationStack />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.65fr] [@media(max-height:950px)]:gap-4">
        <div className="grid gap-6 [@media(max-height:950px)]:gap-4">
          <StepsCard />
          <WeightLossPlan />
        </div>
        <HabitsList />
      </div>
    </>
  );
}
