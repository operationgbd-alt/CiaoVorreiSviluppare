import React, { useState, useLayoutEffect } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, Image, ScrollView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { PhotoPicker } from "@/components/PhotoPicker";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/store/AppContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { Photo } from "@/types";

type InterventionsStackParamList = {
  InterventionsList: undefined;
  InterventionDetail: { interventionId: string };
  InterventionDocumentation: { interventionId: string };
};

type InterventionDocNavProp = NativeStackNavigationProp<InterventionsStackParamList, "InterventionDocumentation">;
type InterventionDocRouteProp = RouteProp<InterventionsStackParamList, "InterventionDocumentation">;

interface Props {
  navigation: InterventionDocNavProp;
  route: InterventionDocRouteProp;
}

export default function InterventionDocumentationScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { getInterventionById, updateIntervention } = useApp();

  const intervention = getInterventionById(route.params.interventionId);

  const [photos, setPhotos] = useState<Photo[]>(intervention?.documentation.photos || []);
  const [notes, setNotes] = useState(intervention?.documentation.notes || "");
  const [hasChanges, setHasChanges] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        hasChanges ? (
          <Pressable onPress={handleSave}>
            <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
              Salva
            </ThemedText>
          </Pressable>
        ) : null
      ),
    });
  }, [navigation, theme, hasChanges, photos, notes]);

  if (!intervention) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ThemedText>Intervento non trovato</ThemedText>
      </View>
    );
  }

  const handlePhotosChange = (newPhotos: Photo[]) => {
    setPhotos(newPhotos);
    setHasChanges(true);
  };

  const handleNotesChange = (text: string) => {
    setNotes(text);
    setHasChanges(true);
  };

  const handleSave = () => {
    updateIntervention(intervention.id, {
      documentation: {
        ...intervention.documentation,
        photos,
        notes: notes.trim(),
      },
    });
    setHasChanges(false);
    Alert.alert("Salvato", "La documentazione e stata aggiornata.");
  };

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isCompleted = intervention.status === 'completato';

  return (
    <ScreenKeyboardAwareScrollView>
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="info" size={18} color={theme.primary} />
          <ThemedText type="h3" style={{ marginLeft: Spacing.sm }}>
            Riepilogo Intervento
          </ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Numero</ThemedText>
          <ThemedText type="body">{intervention.number}</ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Cliente</ThemedText>
          <ThemedText type="body">{intervention.client.name}</ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>Indirizzo</ThemedText>
          <ThemedText type="body">
            {intervention.client.address} {intervention.client.civicNumber}, {intervention.client.city}
          </ThemedText>
        </View>

        {intervention.location ? (
          <View style={styles.infoRow}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>Posizione GPS</ThemedText>
            <ThemedText type="small" style={{ color: theme.success }}>
              Registrata il {formatDateTime(intervention.location.timestamp)}
            </ThemedText>
          </View>
        ) : null}

        {intervention.documentation.startedAt ? (
          <View style={styles.infoRow}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>Avviato il</ThemedText>
            <ThemedText type="body">{formatDateTime(intervention.documentation.startedAt)}</ThemedText>
          </View>
        ) : null}

        {intervention.documentation.completedAt ? (
          <View style={styles.infoRow}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>Completato il</ThemedText>
            <ThemedText type="body" style={{ color: theme.success }}>{formatDateTime(intervention.documentation.completedAt)}</ThemedText>
          </View>
        ) : null}
      </Card>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="camera" size={18} color={theme.primary} />
          <ThemedText type="h3" style={{ marginLeft: Spacing.sm }}>
            Foto Documentazione
          </ThemedText>
        </View>

        <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
          Aggiungi foto dell'intervento, del lavoro svolto e delle condizioni finali
        </ThemedText>

        <PhotoPicker
          photos={photos}
          onPhotosChange={handlePhotosChange}
          maxPhotos={20}
          disabled={isCompleted}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Feather name="file-text" size={18} color={theme.primary} />
          <ThemedText type="h3" style={{ marginLeft: Spacing.sm }}>
            Note Intervento
          </ThemedText>
        </View>

        <TextInput
          style={[
            styles.textArea,
            {
              backgroundColor: theme.backgroundSecondary,
              color: theme.text,
            },
          ]}
          value={notes}
          onChangeText={handleNotesChange}
          placeholder="Descrivi il lavoro svolto, materiali utilizzati, eventuali problemi riscontrati..."
          placeholderTextColor={theme.textTertiary}
          multiline
          numberOfLines={8}
          textAlignVertical="top"
          editable={!isCompleted}
        />
      </View>

      {isCompleted ? (
        <Card style={[styles.section, { backgroundColor: theme.success + '10' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="check-circle" size={24} color={theme.success} />
            <View style={{ marginLeft: Spacing.md }}>
              <ThemedText type="body" style={{ fontWeight: '600', color: theme.success }}>
                Intervento Completato
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Il report e stato generato e salvato
              </ThemedText>
            </View>
          </View>
        </Card>
      ) : (
        <View style={styles.section}>
          {hasChanges ? (
            <Button onPress={handleSave}>
              Salva Documentazione
            </Button>
          ) : null}
          
          <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.md }}>
            Ricorda di salvare prima di completare l'intervento
          </ThemedText>
        </View>
      )}

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
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  infoRow: {
    marginBottom: Spacing.sm,
  },
  textArea: {
    minHeight: 150,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: Typography.body.fontSize,
  },
});
