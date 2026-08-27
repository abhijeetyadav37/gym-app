import { useState, useEffect } from "react";
import apiClient from "../../api/client";
import TopNavBar from "../../components/TopNavBar";
import MembershipStatusCard from "../../components/MembershipStatusCard";
import NotificationsPanel from "../../components/NotificationsPanel";
import ExerciseWeekView from "../../components/ExerciseWeekView";
import MyAttendanceCard from "../../components/MyAttendanceCard";

function MemberDashboard() {
  const [membership, setMembership] = useState(null);
  const [exerciseSchedule, setExerciseSchedule] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ current_streak: 0, summary: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
  const [membershipResult, exercisesResult, notificationsResult, attendanceResult] =
    await Promise.allSettled([
      apiClient.get("/me/membership"),
      apiClient.get("/me/exercises"),
      apiClient.get("/me/notifications"),
      apiClient.get("/me/attendance"),
    ]);

  if (membershipResult.status === "fulfilled") {
    setMembership(membershipResult.value.data);
  }
  if (exercisesResult.status === "fulfilled") {
    setExerciseSchedule(exercisesResult.value.data);
  }
  if (notificationsResult.status === "fulfilled") {
    setNotifications(notificationsResult.value.data);
  }
  if (attendanceResult.status === "fulfilled") {
    setAttendanceData(attendanceResult.value.data);
  } else {
    // This will show up in the browser console (F12 -> Console tab)
    // if the /me/attendance call is failing for any reason.
    console.error("Could not load attendance data:", attendanceResult.reason);
  }

  setIsLoading(false);
}

  async function handleDismissNotification(notificationId) {
    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, is_read: true }
          : notification
      )
    );

    await apiClient.post(`/me/notifications/${notificationId}/read`);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-ink-muted">
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNavBar pageTitle="My Dashboard" />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <NotificationsPanel
          notifications={notifications}
          onDismiss={handleDismissNotification}
        />

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <MembershipStatusCard membership={membership} />
          <ExerciseWeekView exerciseSchedule={exerciseSchedule} />
        </div>

        <MyAttendanceCard
          currentStreak={attendanceData.current_streak}
          summaryData={attendanceData.summary}
        />
      </main>
    </div>
  );
}

export default MemberDashboard;