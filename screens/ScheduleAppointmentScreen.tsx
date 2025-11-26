import React, { useState, useLayoutEffect } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, Platform } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/store/AppContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { 
  scheduleAppointmentNotification, 
  requestNotificationPermissions,
  cancelNotificationByAppointmentId
} from "@/utils/notifications";
import { Appointment } from "@/types";

type InterventionsStackParamList = {
  InterventionsList: undefined;
  InterventionDetail: { interventionId: string };
  ScheduleAppointment: { interventionId: string };
};

type ScheduleAppointmentNavProp = NativeStackNavigationProp<InterventionsStackParamList, "ScheduleAppointment">;
type ScheduleAppointmentRouteProp = RouteProp<InterventionsStackParamList, "ScheduleAppointment">;

interface Props {
  navigation: ScheduleAppointmentNavProp;
  route: ScheduleAppointmentRouteProp;
}

const NOTIFY_OPTIONS = [
  { label: "Nessuna", value: null },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 ora", value: 60 },
  { label: "1 giorno", value: 1440 },
];

export default function ScheduleAppointmentScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { getInterventionById, updateIntervention, addAppointment } = useApp();

  const intervention = getInterventionById(route.params.interventionId);

  const [date, setDate] = useState(
    intervention?.appointment?.date 
      ? new Date(intervention.appointment.date) 
      : new Date(Date.now() + 86400000)
  );
  const [notes, setNotes] = useState(intervention?.appointment?.notes || "");
  const [notifyBefore, setNotifyBefore] = useState<number | null>(30);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()}>
          <ThemedText type="body" style={{ color: theme.primary }}>
            Annulla
          </ThemedText>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={handleSave}>
          <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
            Conferma
          </ThemedText>
        </Pressable>
      ),
    });
  }, [navigation, theme, date, notes, notifyBefore]);

  if (!intervention) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ThemedText>Intervento non trovato</ThemedText>
      </View>
    );
  }

  const handleSave = async () => {
    const appointmentId = `apt-${intervention.id}-${Date.now()}`;
    
    updateIntervention(intervention.id, {
      status: 'appuntamento_fissato',
      appointment: {
        date: date.getTime(),
        confirmedAt: Date.now(),
        notes: notes.trim(),
      },
    });

    const address = `${intervention.client.address} ${intervention.client.civicNumber}, ${intervention.client.city}`;
    
    const appointmentData: Appointment = {
      id: appointmentId,
      type: 'intervento',
      interventionId: intervention.id,
      clientName: intervention.client.name,
      address,
      date: date.getTime(),
      notes: notes.trim(),
      notifyBefore,
    };

    addAppointment(appointmentData);

    if (notifyBefore && Platform.OS !== "web") {
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        await scheduleAppointmentNotification({
          id: appointmentId,
          type: 'intervento',
          interventionId: intervention.id,
          clientName: intervention.client.name,
          address,
          date: date.getTime(),
          notes: notes.trim(),
          notifyBefore,
        });
      }
    }

    Alert.alert(
      "Appuntamento Confermato",
      `Appuntamento fissato per ${date.toLocaleDateString('it-IT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })} alle ${date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  const adjustDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    setDate(newDate);
  };

  const adjustTime = (hours: number) => {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    setDate(newDate);
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.backgroundSecondary,
      color: theme.text,
    },
  ];

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.section}>
        <ThemedText type="h3" style={{ marginBottom: Spacing.md }}>
          Cliente
        </ThemedText>
        <View style={[styles.clientCard, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="user" size={20} color={theme.primary} />
          <View style={{ marginLeft: Spacing.md, flex: 1 }}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              {intervention.client.name}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {intervention.client.address} {intervention.client.civicNumber}, {intervention.client.city}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h3" style={{ marginBottom: Spacing.md }}>
          Data
        </ThemedText>
        
        <View style={[styles.dateDisplay, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="body" style={{ fontWeight: '600', flex: 1, textAlign: 'center' }}>
            {date.toLocaleDateString('it-IT', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </ThemedText>
        </View>

        <View style={styles.adjustButtons}>
          <Pressable
            style={[styles.adjustButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => adjustDate(-1)}
          >
            <Feather name="chevron-left" size={20} color={theme.text} />
            <ThemedText type="small">-1 giorno</ThemedText>
          </Pressable>
          
          <Pressable
            style={[styles.adjustButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => setDate(new Date(Date.now() + 86400000))}
          >
            <ThemedText type="small" style={{ color: theme.primary }}>Domani</ThemedText>
          </Pressable>
          
          <Pressable
            style={[styles.adjustButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => adjustDate(1)}
          >
            <ThemedText type="small">+1 giorno</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h3" style={{ marginBottom: Spacing.md }}>
          Ora
        </ThemedText>
        
        <View style={[styles.dateDisplay, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText type="h2" style={{ flex: 1, textAlign: 'center' }}>
            {date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>

        <View style={styles.adjustButtons}>
          <Pressable
            style={[styles.adjustButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => adjustTime(-1)}
          >
            <Feather name="minus" size={20} color={theme.text} />
            <ThemedText type="small">1 ora</ThemedText>
          </Pressable>
          
          <Pressable
            style={[styles.adjustButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => {
              const newDate = new Date(date);
              newDate.setHours(9, 0, 0, 0);
              setDate(newDate);
            }}
          >
            <ThemedText type="small" style={{ color: theme.primary }}>09:00</ThemedText>
          </Pressable>
          
          <Pressable
            style={[styles.adjustButton, { backgroundColor: theme.primary + '20' }]}
            onPress={() => {
              const newDate = new Date(date);
              newDate.setHours(14, 0, 0, 0);
              setDate(newDate);
            }}
          >
            <ThemedText type="small" style={{ color: theme.primary }}>14:00</ThemedText>
          </Pressable>
          
          <Pressable
            style={[styles.adjustButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={() => adjustTime(1)}
          >
            <ThemedText type="small">1 ora</ThemedText>
            <Feather name="plus" size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h3" style={{ marginBottom: Spacing.md }}>
          Promemoria
        </ThemedText>
        <View style={styles.notifyOptions}>
          {NOTIFY_OPTIONS.map((option) => (
            <Pressable
              key={option.label}
              style={[
                styles.notifyOption,
                {
                  backgroundColor:
                    notifyBefore === option.value ? theme.primary + "20" : theme.backgroundSecondary,
                  borderColor: notifyBefore === option.value ? theme.primary : "transparent",
                  borderWidth: 1,
                },
              ]}
              onPress={() => setNotifyBefore(option.value)}
            >
              <ThemedText
                type="caption"
                style={{
                  color: notifyBefore === option.value ? theme.primary : theme.text,
                }}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h3" style={{ marginBottom: Spacing.md }}>
          Note
        </ThemedText>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Note per l'appuntamento..."
          placeholderTextColor={theme.textTertiary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.lg }}>
        <Button onPress={handleSave}>
          Conferma Appuntamento
        </Button>
      </View>

      <View style={{ height: Spacing['3xl'] }} />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  adjustButtons: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  adjustButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  notifyOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  notifyOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.body.fontSize,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
  },
});
