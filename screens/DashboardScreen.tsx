import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/store/AppContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { DashboardStackParamList } from "@/navigation/DashboardStackNavigator";
import { SurveysStackParamList } from "@/navigation/SurveysStackNavigator";
import { InstallationsStackParamList } from "@/navigation/InstallationsStackNavigator";

type DashboardNavProp = NativeStackNavigationProp<DashboardStackParamList, "Dashboard">;

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavProp>();
  const { theme } = useTheme();
  const { technician, surveys, installations, appointments } = useApp();

  const today = new Date();
  const formattedDate = today.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const todayStart = new Date(today.setHours(0, 0, 0, 0)).getTime();
  const todayEnd = new Date(today.setHours(23, 59, 59, 999)).getTime();

  const todayAppointments = appointments.filter(
    (a) => a.date >= todayStart && a.date <= todayEnd
  );

  const pendingSurveys = surveys.filter((s) => s.status === "da_completare").length;
  const scheduledInstallations = installations.filter(
    (i) => i.status === "programmata"
  ).length;

  const recentActivities = [...surveys, ...installations]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 5);

  return (
    <ScreenScrollView>
      <View style={[styles.welcomeCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={styles.welcomeHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.avatarText}>
              {technician?.name.split(" ").map((n) => n[0]).join("")}
            </ThemedText>
          </View>
          <View style={styles.welcomeText}>
            <ThemedText type="h3">Ciao, {technician?.name.split(" ")[0]}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {formattedDate}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.statCard,
            { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => {
            const nav = navigation.getParent() as any;
            nav?.navigate("SurveysTab");
          }}
        >
          <View style={[styles.statIcon, { backgroundColor: theme.secondary + "20" }]}>
            <Feather name="clipboard" size={20} color={theme.secondary} />
          </View>
          <ThemedText type="h2">{pendingSurveys}</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Sopralluoghi da fare
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.statCard,
            { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => {
            const nav = navigation.getParent() as any;
            nav?.navigate("InstallationsTab");
          }}
        >
          <View style={[styles.statIcon, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="tool" size={20} color={theme.primary} />
          </View>
          <ThemedText type="h2">{scheduledInstallations}</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Installazioni programmate
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h3">Appuntamenti Oggi</ThemedText>
          <Pressable
            onPress={() => navigation.navigate("Calendar")}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Feather name="calendar" size={22} color={theme.primary} />
          </Pressable>
        </View>

        {todayAppointments.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="calendar" size={32} color={theme.textTertiary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              Nessun appuntamento per oggi
            </ThemedText>
          </View>
        ) : (
          todayAppointments.map((appointment) => (
            <Pressable
              key={appointment.id}
              style={({ pressed }) => [
                styles.appointmentCard,
                { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => navigation.navigate("AppointmentForm", { appointment })}
            >
              <View
                style={[
                  styles.appointmentType,
                  {
                    backgroundColor:
                      appointment.type === "sopralluogo"
                        ? theme.secondary + "20"
                        : theme.primary + "20",
                  },
                ]}
              >
                <Feather
                  name={appointment.type === "sopralluogo" ? "clipboard" : "tool"}
                  size={16}
                  color={appointment.type === "sopralluogo" ? theme.secondary : theme.primary}
                />
              </View>
              <View style={styles.appointmentInfo}>
                <ThemedText type="h4">{appointment.clientName}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {new Date(appointment.date).toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  - {appointment.address}
                </ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textTertiary} />
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Attivita Recenti
        </ThemedText>

        {recentActivities.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="activity" size={32} color={theme.textTertiary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              Nessuna attivita recente
            </ThemedText>
          </View>
        ) : (
          recentActivities.map((activity) => {
            const isSurvey = "checklistA1" in activity;
            const status = isSurvey
              ? (activity as any).status
              : (activity as any).status;
            const statusColor =
              status === "completato" || status === "completata"
                ? theme.success
                : status === "in_corso"
                ? theme.primary
                : theme.secondary;

            return (
              <Pressable
                key={activity.id}
                style={({ pressed }) => [
                  styles.activityCard,
                  { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => {
                  const nav = navigation.getParent() as any;
                  if (isSurvey) {
                    nav?.navigate("SurveysTab", {
                      screen: "SurveyForm",
                      params: { survey: activity },
                    });
                  } else {
                    nav?.navigate("InstallationsTab", {
                      screen: "InstallationForm",
                      params: { installation: activity },
                    });
                  }
                }}
              >
                <View style={styles.activityLeft}>
                  <Feather
                    name={isSurvey ? "clipboard" : "tool"}
                    size={18}
                    color={theme.textSecondary}
                  />
                  <View style={styles.activityInfo}>
                    <ThemedText type="body">{activity.client.name}</ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {isSurvey ? "Sopralluogo" : "Installazione"} -{" "}
                      {new Date(activity.updatedAt).toLocaleDateString("it-IT")}
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                  <ThemedText type="caption" style={{ color: statusColor, fontWeight: "600" }}>
                    {status === "da_completare"
                      ? "Da completare"
                      : status === "programmata"
                      ? "Programmata"
                      : status === "in_corso"
                      ? "In corso"
                      : "Completato"}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <View style={{ height: Spacing["3xl"] }} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  welcomeCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  welcomeHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
  welcomeText: {
    marginLeft: Spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: "center",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  emptyCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  appointmentCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  appointmentType: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  appointmentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activityInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
});
