import React, { useState, useLayoutEffect } from "react";
import { StyleSheet, View, Pressable, Alert, Linking, Platform } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/store/AppContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { InterventionStatus } from "@/types";

type InterventionsStackParamList = {
  InterventionsList: undefined;
  InterventionDetail: { interventionId: string };
  InterventionDocumentation: { interventionId: string };
  ScheduleAppointment: { interventionId: string };
};

type InterventionDetailNavProp = NativeStackNavigationProp<InterventionsStackParamList, "InterventionDetail">;
type InterventionDetailRouteProp = RouteProp<InterventionsStackParamList, "InterventionDetail">;

interface Props {
  navigation: InterventionDetailNavProp;
  route: InterventionDetailRouteProp;
}

const STATUS_CONFIG: Record<InterventionStatus, { label: string; color: string; icon: string }> = {
  assegnato: { label: 'Assegnato', color: '#FF9500', icon: 'inbox' },
  appuntamento_fissato: { label: 'Appuntamento Fissato', color: '#007AFF', icon: 'calendar' },
  in_corso: { label: 'In Corso', color: '#5856D6', icon: 'play-circle' },
  completato: { label: 'Completato', color: '#34C759', icon: 'check-circle' },
};

const CATEGORY_LABELS: Record<string, string> = {
  installazione: 'Installazione',
  manutenzione: 'Manutenzione',
  riparazione: 'Riparazione',
  sopralluogo: 'Sopralluogo',
  assistenza: 'Assistenza',
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  bassa: { label: 'Bassa', color: '#8E8E93' },
  normale: { label: 'Normale', color: '#007AFF' },
  alta: { label: 'Alta', color: '#FF9500' },
  urgente: { label: 'Urgente', color: '#FF3B30' },
};

export default function InterventionDetailScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { getInterventionById, updateIntervention } = useApp();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const intervention = getInterventionById(route.params.interventionId);

  useLayoutEffect(() => {
    if (intervention) {
      navigation.setOptions({
        title: intervention.number,
      });
    }
  }, [navigation, intervention]);

  if (!intervention) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ThemedText>Intervento non trovato</ThemedText>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[intervention.status];
  const priorityConfig = PRIORITY_CONFIG[intervention.priority];

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleCall = () => {
    Linking.openURL(`tel:${intervention.client.phone}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${intervention.client.email}`);
  };

  const handleNavigate = () => {
    const address = `${intervention.client.address} ${intervention.client.civicNumber}, ${intervention.client.cap} ${intervention.client.city}`;
    const encodedAddress = encodeURIComponent(address);
    
    if (Platform.OS === 'ios') {
      Linking.openURL(`maps://maps.apple.com/?daddr=${encodedAddress}`);
    } else {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`);
    }
  };

  const handleScheduleAppointment = () => {
    navigation.navigate('ScheduleAppointment', { interventionId: intervention.id });
  };

  const handleStartWork = async () => {
    setIsLoadingLocation(true);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permesso Negato',
          'Per registrare la posizione, abilita i permessi di localizzazione nelle impostazioni.',
          [{ text: 'OK' }]
        );
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      let addressString = '';
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (address) {
          addressString = `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}`.trim();
        }
      } catch (e) {
      }

      updateIntervention(intervention.id, {
        status: 'in_corso',
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: addressString,
          timestamp: Date.now(),
        },
        documentation: {
          ...intervention.documentation,
          startedAt: Date.now(),
        },
      });

      Alert.alert(
        'Intervento Avviato',
        'La tua posizione e stata registrata. Ora puoi procedere con la documentazione.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Errore', 'Impossibile ottenere la posizione. Riprova.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleDocumentation = () => {
    navigation.navigate('InterventionDocumentation', { interventionId: intervention.id });
  };

  const handleComplete = () => {
    if (intervention.documentation.photos.length === 0) {
      Alert.alert(
        'Documentazione Mancante',
        'Aggiungi almeno una foto prima di completare l\'intervento.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Completa Intervento',
      'Sei sicuro di voler completare questo intervento? Verra generato il report finale.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Completa',
          onPress: () => {
            updateIntervention(intervention.id, {
              status: 'completato',
              documentation: {
                ...intervention.documentation,
                completedAt: Date.now(),
              },
            });
            Alert.alert('Intervento Completato', 'Il report e stato generato con successo.');
          },
        },
      ]
    );
  };

  const renderActionButton = () => {
    switch (intervention.status) {
      case 'assegnato':
        return (
          <Button onPress={handleScheduleAppointment}>
            Fissa Appuntamento
          </Button>
        );
      case 'appuntamento_fissato':
        return (
          <Button onPress={handleStartWork} disabled={isLoadingLocation}>
            {isLoadingLocation ? 'Acquisizione GPS...' : 'Avvia Intervento'}
          </Button>
        );
      case 'in_corso':
        return (
          <View style={styles.actionButtons}>
            <Button 
              onPress={handleDocumentation}
              style={{ flex: 1, marginRight: Spacing.sm }}
            >
              Documentazione
            </Button>
            <Button 
              onPress={handleComplete}
              style={{ flex: 1, marginLeft: Spacing.sm, backgroundColor: theme.success }}
            >
              Completa
            </Button>
          </View>
        );
      case 'completato':
        return (
          <Button onPress={handleDocumentation}>
            Visualizza Report
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={[styles.statusBanner, { backgroundColor: statusConfig.color + '15' }]}>
        <Feather name={statusConfig.icon as any} size={20} color={statusConfig.color} />
        <ThemedText type="body" style={{ color: statusConfig.color, marginLeft: Spacing.sm, fontWeight: '600' }}>
          {statusConfig.label}
        </ThemedText>
        <View style={{ flex: 1 }} />
        <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.color + '20' }]}>
          <ThemedText type="caption" style={{ color: priorityConfig.color, fontWeight: '600' }}>
            {priorityConfig.label}
          </ThemedText>
        </View>
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="file-text" size={18} color={theme.primary} />
          <ThemedText type="h3" style={{ marginLeft: Spacing.sm }}>
            Dettagli Intervento
          </ThemedText>
        </View>
        
        <View style={styles.detailRow}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Categoria</ThemedText>
          <ThemedText type="body">{CATEGORY_LABELS[intervention.category]}</ThemedText>
        </View>

        <View style={styles.detailRow}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Descrizione</ThemedText>
          <ThemedText type="body">{intervention.description}</ThemedText>
        </View>

        <View style={styles.detailRow}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Assegnato il</ThemedText>
          <ThemedText type="body">{formatDate(intervention.assignedAt)}</ThemedText>
        </View>
      </Card>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="user" size={18} color={theme.primary} />
          <ThemedText type="h3" style={{ marginLeft: Spacing.sm }}>
            Cliente
          </ThemedText>
        </View>

        <ThemedText type="body" style={{ fontWeight: '600' }}>
          {intervention.client.name}
        </ThemedText>
        
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          {intervention.client.address} {intervention.client.civicNumber}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {intervention.client.cap} {intervention.client.city}
        </ThemedText>

        <View style={styles.contactButtons}>
          <Pressable 
            style={[styles.contactButton, { backgroundColor: theme.primary + '15' }]}
            onPress={handleCall}
          >
            <Feather name="phone" size={18} color={theme.primary} />
            <ThemedText type="small" style={{ color: theme.primary, marginLeft: Spacing.xs }}>
              Chiama
            </ThemedText>
          </Pressable>

          <Pressable 
            style={[styles.contactButton, { backgroundColor: theme.primary + '15' }]}
            onPress={handleEmail}
          >
            <Feather name="mail" size={18} color={theme.primary} />
            <ThemedText type="small" style={{ color: theme.primary, marginLeft: Spacing.xs }}>
              Email
            </ThemedText>
          </Pressable>

          <Pressable 
            style={[styles.contactButton, { backgroundColor: theme.success + '15' }]}
            onPress={handleNavigate}
          >
            <Feather name="navigation" size={18} color={theme.success} />
            <ThemedText type="small" style={{ color: theme.success, marginLeft: Spacing.xs }}>
              Naviga
            </ThemedText>
          </Pressable>
        </View>
      </Card>

      {intervention.appointment ? (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="calendar" size={18} color={theme.primary} />
            <ThemedText type="h3" style={{ marginLeft: Spacing.sm }}>
              Appuntamento
            </ThemedText>
          </View>

          <ThemedText type="body" style={{ fontWeight: '600' }}>
            {formatDateTime(intervention.appointment.date)}
          </ThemedText>
          
          {intervention.appointment.notes ? (
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              {intervention.appointment.notes}
            </ThemedText>
          ) : null}
        </Card>
      ) : null}

      {intervention.location ? (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="map-pin" size={18} color={theme.success} />
            <ThemedText type="h3" style={{ marginLeft: Spacing.sm }}>
              Posizione Registrata
            </ThemedText>
          </View>

          <ThemedText type="body">
            {intervention.location.address || `${intervention.location.latitude.toFixed(6)}, ${intervention.location.longitude.toFixed(6)}`}
          </ThemedText>
          
          <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
            {formatDateTime(intervention.location.timestamp)}
          </ThemedText>
        </Card>
      ) : null}

      {intervention.documentation.photos.length > 0 || intervention.documentation.notes ? (
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="file" size={18} color={theme.primary} />
            <ThemedText type="h3" style={{ marginLeft: Spacing.sm }}>
              Documentazione
            </ThemedText>
          </View>

          <View style={styles.docStats}>
            <View style={styles.docStat}>
              <Feather name="camera" size={16} color={theme.textSecondary} />
              <ThemedText type="body" style={{ marginLeft: Spacing.xs }}>
                {intervention.documentation.photos.length} foto
              </ThemedText>
            </View>
          </View>

          {intervention.documentation.notes ? (
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              {intervention.documentation.notes}
            </ThemedText>
          ) : null}

          {intervention.documentation.completedAt ? (
            <ThemedText type="caption" style={{ color: theme.success, marginTop: Spacing.md }}>
              Completato il {formatDateTime(intervention.documentation.completedAt)}
            </ThemedText>
          ) : null}
        </Card>
      ) : null}

      <View style={styles.actionContainer}>
        {renderActionButton()}
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  detailRow: {
    marginBottom: Spacing.sm,
  },
  contactButtons: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  docStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  docStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
  },
});
