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
import { InterventionStatus } from "@/types";

type DashboardNavProp = NativeStackNavigationProp<DashboardStackParamList, "Dashboard">;

const STATUS_CONFIG: Record<InterventionStatus, { label: string; color: string }> = {
  assegnato: { label: 'Assegnato', color: '#FF9500' },
  appuntamento_fissato: { label: 'Appuntamento', color: '#007AFF' },
  in_corso: { label: 'In Corso', color: '#5856D6' },
  completato: { label: 'Completato', color: '#34C759' },
};

const PRIORITY_CONFIG: Record<string, { color: string }> = {
  bassa: { color: '#8E8E93' },
  normale: { color: '#007AFF' },
  alta: { color: '#FF9500' },
  urgente: { color: '#FF3B30' },
};

export default function DashboardScreen() {
  const navigation = useNavigation<DashboardNavProp>();
  const { theme } = useTheme();
  const { technician, interventions, appointments } = useApp();

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

  const pendingInterventions = interventions.filter(
    (i) => i.status === "assegnato"
  ).length;
  
  const scheduledInterventions = interventions.filter(
    (i) => i.status === "appuntamento_fissato"
  ).length;

  const inProgressInterventions = interventions.filter(
    (i) => i.status === "in_corso"
  ).length;

  const recentInterventions = [...interventions]
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
            nav?.navigate("InterventionsTab");
          }}
        >
          <View style={[styles.statIcon, { backgroundColor: '#FF9500' + "20" }]}>
            <Feather name="inbox" size={20} color="#FF9500" />
          </View>
          <ThemedText type="h2">{pendingInterventions}</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Nuovi assegnati
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.statCard,
            { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => {
            const nav = navigation.getParent() as any;
            nav?.navigate("InterventionsTab");
          }}
        >
          <View style={[styles.statIcon, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="calendar" size={20} color={theme.primary} />
          </View>
          <ThemedText type="h2">{scheduledInterventions}</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            Con appuntamento
          </ThemedText>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.statCard,
            { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => {
            const nav = navigation.getParent() as any;
            nav?.navigate("InterventionsTab");
          }}
        >
          <View style={[styles.statIcon, { backgroundColor: '#5856D6' + "20" }]}>
            <Feather name="play-circle" size={20} color="#5856D6" />
          </View>
          <ThemedText type="h2">{inProgressInterventions}</ThemedText>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            In corso
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
          todayAppointments.map((appointment) => {
            const intervention = interventions.find(i => i.id === appointment.interventionId);
            const priorityColor = intervention ? PRIORITY_CONFIG[intervention.priority]?.color : theme.primary;
            
            return (
              <Pressable
                key={appointment.id}
                style={({ pressed }) => [
                  styles.appointmentCard,
                  { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => {
                  if (intervention) {
                    const nav = navigation.getParent() as any;
                    nav?.navigate("InterventionsTab", {
                      screen: "InterventionDetail",
                      params: { interventionId: intervention.id },
                    });
                  }
                }}
              >
                <View
                  style={[
                    styles.appointmentType,
                    { backgroundColor: priorityColor + "20" },
                  ]}
                >
                  <Feather name="briefcase" size={16} color={priorityColor} />
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
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <ThemedText type="h3" style={styles.sectionTitle}>
          Interventi Recenti
        </ThemedText>

        {recentInterventions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.backgroundDefault }]}>
            <Feather name="briefcase" size={32} color={theme.textTertiary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              Nessun intervento recente
            </ThemedText>
          </View>
        ) : (
          recentInterventions.map((intervention) => {
            const statusConfig = STATUS_CONFIG[intervention.status];

            return (
              <Pressable
                key={intervention.id}
                style={({ pressed }) => [
                  styles.activityCard,
                  { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => {
                  const nav = navigation.getParent() as any;
                  nav?.navigate("InterventionsTab", {
                    screen: "InterventionDetail",
                    params: { interventionId: intervention.id },
                  });
                }}
              >
                <View style={styles.activityLeft}>
                  <Feather name="briefcase" size={18} color={theme.textSecondary} />
                  <View style={styles.activityInfo}>
                    <ThemedText type="body">{intervention.client.name}</ThemedText>
                    <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                      {intervention.number} - {intervention.client.city}
                    </ThemedText>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + "20" }]}>
                  <ThemedText type="caption" style={{ color: statusConfig.color, fontWeight: "600" }}>
                    {statusConfig.label}
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
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
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
