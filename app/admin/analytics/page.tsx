import { getEventsByDay, getTopEvents, getFunnelData } from "@/lib/queries/admin-events";
import AnalyticsClient from "./AnalyticsClient";

export const metadata = {
  title: "Analytics",
};

export default async function AdminAnalyticsPage() {
  const [eventsByDay, topEvents, funnel] = await Promise.all([
    getEventsByDay(30),
    getTopEvents(30),
    getFunnelData(30),
  ]);

  return (
    <AnalyticsClient
      initialEventsByDay={eventsByDay}
      initialTopEvents={topEvents}
      initialFunnel={funnel}
      initialPeriod="30d"
    />
  );
}
