import React, { useState, useLayoutEffect } from "react";
import { StyleSheet, View, Pressable, Alert, Linking, Platform, TextInput, ScrollView, Image } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/store/AppContext";
import { useAuth } from "@/store/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { InterventionStatus, Photo } from "@/types";

type InterventionsStackParamList = {
  InterventionsList: undefined;
  InterventionDetail: { interventionId: string };
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
  chiuso: { label: 'Chiuso', color: '#8E8E93', icon: 'archive' },
};

const CATEGORY_LABELS: Record<string, string> = {
  sopralluogo: 'Sopralluogo',
  installazione: 'Installazione',
  manutenzione: 'Manutenzione',
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  bassa: { label: 'Bassa', color: '#8E8E93' },
  normale: { label: 'Normale', color: '#007AFF' },
  alta: { label: 'Alta', color: '#FF9500' },
  urgente: { label: 'Urgente', color: '#FF3B30' },
};

const STATUS_OPTIONS: { value: InterventionStatus; label: string }[] = [
  { value: 'assegnato', label: 'Assegnato' },
  { value: 'appuntamento_fissato', label: 'Appuntamento Fissato' },
  { value: 'in_corso', label: 'In Corso' },
  { value: 'completato', label: 'Completato' },
];

export default function InterventionDetailScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { getInterventionById, updateIntervention, addAppointment, users } = useApp();
  const { user } = useAuth();
  
  const intervention = getInterventionById(route.params.interventionId);
  
  const isTecnico = user?.role === 'tecnico';
  const isMasterOrDitta = user?.role === 'master' || user?.role === 'ditta';
  const canEdit = isTecnico;
  const canAssignTechnician = isMasterOrDitta;
  
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [notes, setNotes] = useState(intervention?.documentation.notes || '');
  const [appointmentDate, setAppointmentDate] = useState<Date>(
    intervention?.appointment?.date ? new Date(intervention.appointment.date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [appointmentNotes, setAppointmentNotes] = useState(intervention?.appointment?.notes || '');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(intervention?.technicianId || null);

  const availableTechnicians = users.filter(u => {
    if (u.role !== 'tecnico') return false;
    if (user?.role === 'master') {
      return u.companyId === intervention?.companyId;
    }
    if (user?.role === 'ditta') {
      return u.companyId === user.companyId;
    }
    return false;
  });

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
      weekday: 'short',
      day: 'numeric',
      month: 'short',
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

  const handleNavigate = () => {
    const address = `${intervention.client.address} ${intervention.client.civicNumber}, ${intervention.client.cap} ${intervention.client.city}`;
    const encodedAddress = encodeURIComponent(address);
    
    if (Platform.OS === 'ios') {
      Linking.openURL(`maps://maps.apple.com/?daddr=${encodedAddress}`);
    } else {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(appointmentDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setAppointmentDate(newDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(appointmentDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setAppointmentDate(newDate);
    }
  };

  const handleSaveAppointment = () => {
    updateIntervention(intervention.id, {
      appointment: {
        date: appointmentDate.getTime(),
        confirmedAt: Date.now(),
        notes: appointmentNotes,
      },
      status: intervention.status === 'assegnato' ? 'appuntamento_fissato' : intervention.status,
    });

    addAppointment({
      id: `apt-${Date.now()}`,
      type: 'intervento',
      interventionId: intervention.id,
      clientName: intervention.client.name,
      address: `${intervention.client.address} ${intervention.client.civicNumber}, ${intervention.client.city}`,
      date: appointmentDate.getTime(),
      notes: appointmentNotes,
      notifyBefore: 60,
    });

    Alert.alert('Appuntamento Salvato', 'L\'appuntamento e stato fissato con successo.');
  };

  const handleSendLocation = async () => {
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
      } catch (e) {}

      updateIntervention(intervention.id, {
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: addressString,
          timestamp: Date.now(),
        },
      });

      Alert.alert('Posizione Inviata', 'La tua posizione GPS e stata registrata con successo.');
    } catch (error) {
      Alert.alert('Errore', 'Impossibile ottenere la posizione. Riprova.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permesso Negato', 'Abilita i permessi della fotocamera nelle impostazioni.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newPhoto: Photo = {
          id: `photo-${Date.now()}`,
          uri: result.assets[0].uri,
          timestamp: Date.now(),
        };

        updateIntervention(intervention.id, {
          documentation: {
            ...intervention.documentation,
            photos: [...intervention.documentation.photos, newPhoto],
          },
        });
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile scattare la foto.');
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permesso Negato', 'Abilita i permessi della galleria nelle impostazioni.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newPhotos: Photo[] = result.assets.map((asset, index) => ({
          id: `photo-${Date.now()}-${index}`,
          uri: asset.uri,
          timestamp: Date.now(),
        }));

        updateIntervention(intervention.id, {
          documentation: {
            ...intervention.documentation,
            photos: [...intervention.documentation.photos, ...newPhotos],
          },
        });
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile caricare le immagini.');
    }
  };

  const handleSaveNotes = () => {
    updateIntervention(intervention.id, {
      documentation: {
        ...intervention.documentation,
        notes: notes,
      },
    });
    Alert.alert('Note Salvate', 'Le note sono state salvate con successo.');
  };

  const handleChangeStatus = (newStatus: InterventionStatus) => {
    if (newStatus === 'completato' && intervention.documentation.photos.length === 0) {
      Alert.alert(
        'Documentazione Mancante',
        'Aggiungi almeno una foto prima di completare l\'intervento.',
        [{ text: 'OK' }]
      );
      return;
    }

    const updates: any = { status: newStatus };
    
    if (newStatus === 'in_corso' && !intervention.documentation.startedAt) {
      updates.documentation = {
        ...intervention.documentation,
        startedAt: Date.now(),
      };
    }
    
    if (newStatus === 'completato') {
      updates.documentation = {
        ...intervention.documentation,
        completedAt: Date.now(),
      };
    }

    updateIntervention(intervention.id, updates);
    Alert.alert('Stato Aggiornato', `Intervento ora: ${STATUS_CONFIG[newStatus].label}`);
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Elimina Foto',
      'Sei sicuro di voler eliminare questa foto?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            updateIntervention(intervention.id, {
              documentation: {
                ...intervention.documentation,
                photos: intervention.documentation.photos.filter(p => p.id !== photoId),
              },
            });
          },
        },
      ]
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleAssignTechnician = (technicianId: string | null) => {
    setSelectedTechnicianId(technicianId);
    
    if (technicianId) {
      const technician = availableTechnicians.find(t => t.id === technicianId);
      updateIntervention(intervention.id, {
        technicianId: technicianId,
        technicianName: technician?.name || null,
      });
      
      const msg = `Intervento assegnato a ${technician?.name}`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Tecnico Assegnato', msg);
      }
    } else {
      updateIntervention(intervention.id, {
        technicianId: null,
        technicianName: null,
      });
      
      const msg = 'Assegnazione tecnico rimossa';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Assegnazione Rimossa', msg);
      }
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

      {/* 1. DETTAGLIO INTERVENTO */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="file-text" size={18} color={theme.primary} />
          <ThemedText type="h3" style={{ marginLeft: Spacing.sm }}>
            Dettaglio Intervento
          </ThemedText>
        </View>
        
        <View style={styles.detailRow}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Categoria</ThemedText>
          <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '15' }]}>
            <ThemedText type="body" style={{ color: theme.primary, fontWeight: '600' }}>
              {CATEGORY_LABELS[intervention.category]}
            </ThemedText>
          </View>
        </View>

        <View style={styles.detailRow}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Descrizione</ThemedText>
          <ThemedText type="body">{intervention.description}</ThemedText>
        </View>

        <View style={styles.detailRow}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Assegnato il</ThemedText>
          <ThemedText type="body">{formatDate(intervention.assignedAt)}</ThemedText>
        </View>

        {intervention.technicianName ? (
          <View style={styles.detailRow}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>Tecnico Assegnato</ThemedText>
            <View style={[styles.categoryBadge, { backgroundColor: theme.success + '15' }]}>
              <Feather name="user" size={14} color={theme.success} style={{ marginRight: Spacing.xs }} />
              <ThemedText type="body" style={{ color: theme.success, fontWeight: '600' }}>
                {intervention.technicianName}
              </ThemedText>
            </View>
          </View>
        ) : null}
      </Card>

      {/* ASSEGNAZIONE TECNICO - Solo per MASTER e DITTA */}
      {canAssignTechnician && intervention.companyId ? (
        <Card style={styles.section} onPress={() => toggleSection('assegnazione')}>
          <View style={styles.sectionHeader}>
            <Feather name="user-plus" size={18} color={theme.primary} />
            <ThemedText type="h3" style={{ marginLeft: Spacing.sm, flex: 1 }}>
              Assegna Tecnico
            </ThemedText>
            <Feather 
              name={expandedSection === 'assegnazione' ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.textSecondary} 
            />
          </View>

          {intervention.technicianName ? (
            <View style={styles.currentTechnician}>
              <Feather name="user-check" size={16} color={theme.success} />
              <ThemedText type="body" style={{ marginLeft: Spacing.sm, color: theme.success, fontWeight: '600' }}>
                Assegnato a: {intervention.technicianName}
              </ThemedText>
            </View>
          ) : (
            <View style={styles.currentTechnician}>
              <Feather name="alert-circle" size={16} color={theme.secondary} />
              <ThemedText type="body" style={{ marginLeft: Spacing.sm, color: theme.secondary }}>
                Nessun tecnico assegnato
              </ThemedText>
            </View>
          )}

          {expandedSection === 'assegnazione' ? (
            <View style={styles.technicianList}>
              {availableTechnicians.length === 0 ? (
                <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: 'center', padding: Spacing.md }}>
                  Nessun tecnico disponibile per questa ditta
                </ThemedText>
              ) : (
                <>
                  {availableTechnicians.map(tech => (
                    <Pressable
                      key={tech.id}
                      style={[
                        styles.technicianItem,
                        { backgroundColor: theme.backgroundSecondary },
                        selectedTechnicianId === tech.id && { 
                          backgroundColor: theme.primary + '20',
                          borderColor: theme.primary,
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => handleAssignTechnician(tech.id)}
                    >
                      <View style={[
                        styles.technicianAvatar,
                        { backgroundColor: selectedTechnicianId === tech.id ? theme.primary : theme.textTertiary },
                      ]}>
                        <ThemedText style={{ color: '#FFFFFF', fontWeight: '600' }}>
                          {tech.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </ThemedText>
                      </View>
                      <View style={{ flex: 1, marginLeft: Spacing.md }}>
                        <ThemedText type="body" style={{ fontWeight: '600' }}>
                          {tech.name}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {tech.email}
                        </ThemedText>
                      </View>
                      {selectedTechnicianId === tech.id ? (
                        <Feather name="check-circle" size={24} color={theme.primary} />
                      ) : (
                        <Feather name="circle" size={24} color={theme.textTertiary} />
                      )}
                    </Pressable>
                  ))}

                  {selectedTechnicianId ? (
                    <Pressable
                      style={[styles.removeAssignmentButton, { backgroundColor: theme.danger + '15' }]}
                      onPress={() => handleAssignTechnician(null)}
                    >
                      <Feather name="user-x" size={18} color={theme.danger} />
                      <ThemedText type="body" style={{ color: theme.danger, marginLeft: Spacing.sm, fontWeight: '600' }}>
                        Rimuovi Assegnazione
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>
          ) : null}
        </Card>
      ) : null}

      {/* 2. CLIENTE */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="user" size={18} color={theme.primary} />
          <ThemedText type="h3" style={{ marginLeft: Spacing.sm }}>
            Cliente
          </ThemedText>
        </View>

        <ThemedText type="body" style={{ fontWeight: '600', fontSize: 18 }}>
          {intervention.client.name}
        </ThemedText>
        
        <View style={styles.addressContainer}>
          <Feather name="map-pin" size={14} color={theme.textSecondary} />
          <View style={{ marginLeft: Spacing.xs, flex: 1 }}>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {intervention.client.address} {intervention.client.civicNumber}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {intervention.client.cap} {intervention.client.city}
            </ThemedText>
          </View>
        </View>

        <View style={styles.contactButtons}>
          <Pressable 
            style={[styles.contactButton, { backgroundColor: theme.primary }]}
            onPress={handleCall}
          >
            <Feather name="phone" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm, fontWeight: '600' }}>
              Chiama
            </ThemedText>
          </Pressable>

          <Pressable 
            style={[styles.contactButton, { backgroundColor: theme.success }]}
            onPress={handleNavigate}
          >
            <Feather name="navigation" size={20} color="#FFFFFF" />
            <ThemedText type="body" style={{ color: '#FFFFFF', marginLeft: Spacing.sm, fontWeight: '600' }}>
              Naviga
            </ThemedText>
          </Pressable>
        </View>
      </Card>

      {/* 3. CALENDARIO */}
      <Card style={styles.section} onPress={() => toggleSection('calendario')}>
        <View style={styles.sectionHeader}>
          <Feather name="calendar" size={18} color={theme.primary} />
          <ThemedText type="h3" style={{ marginLeft: Spacing.sm, flex: 1 }}>
            Calendario
          </ThemedText>
          <Feather 
            name={expandedSection === 'calendario' ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={theme.textSecondary} 
          />
        </View>

        {intervention.appointment ? (
          <View style={styles.appointmentInfo}>
            <Feather name="check-circle" size={16} color={theme.success} />
            <ThemedText type="body" style={{ marginLeft: Spacing.sm, fontWeight: '600' }}>
              {formatDateTime(intervention.appointment.date)}
            </ThemedText>
          </View>
        ) : null}

        {expandedSection === 'calendario' ? (
          <View style={styles.calendarContent}>
            <View style={styles.dateTimeRow}>
              <Pressable 
                style={[styles.dateButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Feather name="calendar" size={16} color={theme.primary} />
                <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
                  {appointmentDate.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                </ThemedText>
              </Pressable>

              <Pressable 
                style={[styles.dateButton, { backgroundColor: theme.backgroundSecondary }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Feather name="clock" size={16} color={theme.primary} />
                <ThemedText type="body" style={{ marginLeft: Spacing.sm }}>
                  {appointmentDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </ThemedText>
              </Pressable>
            </View>

            {showDatePicker ? (
              <DateTimePicker
                value={appointmentDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            ) : null}

            {showTimePicker ? (
              <DateTimePicker
                value={appointmentDate}
                mode="time"
                display="default"
                onChange={handleTimeChange}
                is24Hour={true}
              />
            ) : null}

            <TextInput
              style={[styles.notesInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
              placeholder="Note appuntamento..."
              placeholderTextColor={theme.textTertiary}
              value={appointmentNotes}
              onChangeText={setAppointmentNotes}
              multiline
            />

            <Button onPress={handleSaveAppointment} style={{ marginTop: Spacing.md }}>
              Salva Appuntamento
            </Button>
          </View>
        ) : null}
      </Card>

      {/* 4. GESTISCI INTERVENTO */}
      <Card style={styles.section} onPress={() => toggleSection('gestisci')}>
        <View style={styles.sectionHeader}>
          <Feather name="tool" size={18} color={theme.primary} />
          <ThemedText type="h3" style={{ marginLeft: Spacing.sm, flex: 1 }}>
            Gestisci Intervento
          </ThemedText>
          <Feather 
            name={expandedSection === 'gestisci' ? 'chevron-up' : 'chevron-down'} 
            size={20} 
            color={theme.textSecondary} 
          />
        </View>

        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Feather name="camera" size={16} color={theme.textSecondary} />
            <ThemedText type="body" style={{ marginLeft: Spacing.xs }}>
              {intervention.documentation.photos.length} foto
            </ThemedText>
          </View>
          {intervention.location ? (
            <View style={styles.statItem}>
              <Feather name="map-pin" size={16} color={theme.success} />
              <ThemedText type="body" style={{ marginLeft: Spacing.xs, color: theme.success }}>
                GPS inviato
              </ThemedText>
            </View>
          ) : null}
        </View>

        {expandedSection === 'gestisci' ? (
          <View style={styles.manageContent}>
            {/* Foto */}
            <ThemedText type="body" style={{ fontWeight: '600', marginBottom: Spacing.sm }}>
              Documenti e Foto
            </ThemedText>
            
            {canEdit ? (
              <View style={styles.photoButtons}>
                <Pressable 
                  style={[styles.photoButton, { backgroundColor: theme.primary }]}
                  onPress={handleTakePhoto}
                >
                  <Feather name="camera" size={20} color="#FFFFFF" />
                  <ThemedText type="small" style={{ color: '#FFFFFF', marginTop: Spacing.xs }}>
                    Scatta Foto
                  </ThemedText>
                </Pressable>

                <Pressable 
                  style={[styles.photoButton, { backgroundColor: theme.secondary }]}
                  onPress={handlePickImage}
                >
                  <Feather name="image" size={20} color="#FFFFFF" />
                  <ThemedText type="small" style={{ color: '#FFFFFF', marginTop: Spacing.xs }}>
                    Galleria
                  </ThemedText>
                </Pressable>
              </View>
            ) : null}

            {intervention.documentation.photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
                {intervention.documentation.photos.map((photo) => (
                  <Pressable 
                    key={photo.id} 
                    style={styles.photoThumbnail}
                    onLongPress={canEdit ? () => handleDeletePhoto(photo.id) : undefined}
                  >
                    <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              !canEdit ? (
                <View style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="image" size={24} color={theme.textTertiary} />
                  <ThemedText type="caption" style={{ color: theme.textTertiary, marginTop: Spacing.xs }}>
                    Nessuna foto caricata
                  </ThemedText>
                </View>
              ) : null
            )}

            {/* Posizione GPS */}
            <ThemedText type="body" style={{ fontWeight: '600', marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
              Posizione GPS
            </ThemedText>

            {intervention.location ? (
              <View style={[styles.locationInfo, { backgroundColor: theme.success + '15' }]}>
                <Feather name="check-circle" size={16} color={theme.success} />
                <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                  <ThemedText type="small" style={{ color: theme.success, fontWeight: '600' }}>
                    Posizione registrata
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    {intervention.location.address || `${intervention.location.latitude.toFixed(4)}, ${intervention.location.longitude.toFixed(4)}`}
                  </ThemedText>
                </View>
              </View>
            ) : (
              !canEdit ? (
                <View style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="map-pin" size={24} color={theme.textTertiary} />
                  <ThemedText type="caption" style={{ color: theme.textTertiary, marginTop: Spacing.xs }}>
                    Posizione non ancora registrata
                  </ThemedText>
                </View>
              ) : null
            )}

            {canEdit ? (
              <Button 
                onPress={handleSendLocation} 
                disabled={isLoadingLocation}
                style={{ backgroundColor: theme.success }}
              >
                {isLoadingLocation ? 'Acquisizione GPS...' : 'Invia Posizione'}
              </Button>
            ) : null}

            {/* Note */}
            <ThemedText type="body" style={{ fontWeight: '600', marginTop: Spacing.lg, marginBottom: Spacing.sm }}>
              Note Intervento
            </ThemedText>

            {canEdit ? (
              <>
                <TextInput
                  style={[styles.notesInputLarge, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
                  placeholder="Inserisci note sull'intervento..."
                  placeholderTextColor={theme.textTertiary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={4}
                />
                <Button onPress={handleSaveNotes} style={{ marginTop: Spacing.sm }}>
                  Salva Note
                </Button>
              </>
            ) : (
              <View style={[styles.notesDisplay, { backgroundColor: theme.backgroundSecondary }]}>
                <ThemedText type="body" style={{ color: notes ? theme.text : theme.textTertiary }}>
                  {notes || 'Nessuna nota inserita'}
                </ThemedText>
              </View>
            )}
          </View>
        ) : null}
      </Card>

      {/* 5. ESITA INTERVENTO - Solo per Tecnici */}
      {canEdit ? (
        <Card style={styles.section} onPress={() => toggleSection('esita')}>
          <View style={styles.sectionHeader}>
            <Feather name="check-square" size={18} color={theme.primary} />
            <ThemedText type="h3" style={{ marginLeft: Spacing.sm, flex: 1 }}>
              Esita Intervento
            </ThemedText>
            <Feather 
              name={expandedSection === 'esita' ? 'chevron-up' : 'chevron-down'} 
              size={20} 
              color={theme.textSecondary} 
            />
          </View>

          {expandedSection === 'esita' ? (
            <View style={styles.statusOptions}>
              {STATUS_OPTIONS.map((option) => {
                const config = STATUS_CONFIG[option.value];
                const isSelected = intervention.status === option.value;
                
                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.statusOption,
                      { 
                        backgroundColor: isSelected ? config.color + '20' : theme.backgroundSecondary,
                        borderColor: isSelected ? config.color : 'transparent',
                      }
                    ]}
                    onPress={() => handleChangeStatus(option.value)}
                  >
                    <Feather 
                      name={config.icon as any} 
                      size={20} 
                      color={isSelected ? config.color : theme.textSecondary} 
                    />
                    <ThemedText 
                      type="body" 
                      style={{ 
                        marginLeft: Spacing.sm, 
                        color: isSelected ? config.color : theme.text,
                        fontWeight: isSelected ? '600' : '400',
                      }}
                    >
                      {option.label}
                    </ThemedText>
                    {isSelected ? (
                      <Feather 
                        name="check" 
                        size={18} 
                        color={config.color} 
                        style={{ marginLeft: 'auto' }}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Card>
      ) : null}

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
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.md,
  },
  contactButtons: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  appointmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  calendarContent: {
    marginTop: Spacing.sm,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  notesInput: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  quickStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageContent: {
    marginTop: Spacing.md,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  photosScroll: {
    marginTop: Spacing.md,
  },
  photoThumbnail: {
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  photoImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  notesInputLarge: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  statusOptions: {
    gap: Spacing.sm,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  notesDisplay: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    minHeight: 60,
  },
  currentTechnician: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  technicianList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  technicianItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  technicianAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeAssignmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
});
