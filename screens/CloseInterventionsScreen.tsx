import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, Alert, Platform, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/store/AuthContext';
import { useApp } from '@/store/AppContext';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Intervention, InterventionCategory } from '@/types';

const CATEGORY_CONFIG: Record<InterventionCategory, { icon: string; color: string }> = {
  sopralluogo: { icon: 'search', color: '#5856D6' },
  installazione: { icon: 'tool', color: '#007AFF' },
  manutenzione: { icon: 'settings', color: '#FF9500' },
};

export function CloseInterventionsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { interventions, updateIntervention } = useApp();

  const [selectedInterventions, setSelectedInterventions] = useState<string[]>([]);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const completedInterventions = useMemo(() => 
    interventions.filter(i => i.status === 'completato'),
    [interventions]
  );

  const toggleIntervention = (id: string) => {
    setSelectedInterventions(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedInterventions(completedInterventions.map(i => i.id));
  };

  const deselectAll = () => {
    setSelectedInterventions([]);
  };

  const handleClose = () => {
    if (selectedInterventions.length === 0) {
      const msg = 'Seleziona almeno un intervento da chiudere';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Attenzione', msg);
      }
      return;
    }

    const confirmMsg = `Stai per chiudere definitivamente ${selectedInterventions.length} interventi.${emailRecipient ? ` Un report verrà inviato a ${emailRecipient}.` : ''} Procedere?`;

    const doClose = () => {
      setIsProcessing(true);
      
      selectedInterventions.forEach(id => {
        updateIntervention(id, { 
          status: 'chiuso',
          closedAt: Date.now(),
          closedBy: user?.name || 'Sistema',
          emailSentTo: emailRecipient || undefined,
        });
      });

      setTimeout(() => {
        setIsProcessing(false);
        const successMsg = `${selectedInterventions.length} interventi chiusi con successo!${emailRecipient ? ` Report inviato a ${emailRecipient}.` : ''}`;
        if (Platform.OS === 'web') {
          window.alert(successMsg);
        } else {
          Alert.alert('Successo', successMsg);
        }
        navigation.goBack();
      }, 500);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        doClose();
      }
    } else {
      Alert.alert('Conferma Chiusura', confirmMsg, [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Chiudi', style: 'destructive', onPress: doClose },
      ]);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderInterventionCard = (intervention: Intervention) => {
    const isSelected = selectedInterventions.includes(intervention.id);
    const categoryConfig = CATEGORY_CONFIG[intervention.category];
    const completedDate = intervention.documentation.completedAt || intervention.updatedAt;

    return (
      <Card
        key={intervention.id}
        style={[
          styles.interventionCard,
          isSelected && { borderColor: theme.success, borderWidth: 2 },
        ]}
        onPress={() => toggleIntervention(intervention.id)}
      >
        <View style={styles.cardRow}>
          <View style={[
            styles.checkbox,
            { borderColor: isSelected ? theme.success : theme.border },
            isSelected && { backgroundColor: theme.success },
          ]}>
            {isSelected ? (
              <Feather name="check" size={14} color="#FFFFFF" />
            ) : null}
          </View>

          <View style={[styles.categoryIcon, { backgroundColor: categoryConfig.color + '20' }]}>
            <Feather name={categoryConfig.icon as any} size={16} color={categoryConfig.color} />
          </View>

          <View style={styles.cardInfo}>
            <ThemedText type="body" style={{ fontWeight: '600' }}>
              {intervention.client.name}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {intervention.number} - {intervention.client.city}
            </ThemedText>
            <View style={styles.completedInfo}>
              <Feather name="check-circle" size={12} color={theme.success} />
              <ThemedText type="caption" style={{ color: theme.success, marginLeft: 4 }}>
                Completato il {formatDate(completedDate)}
              </ThemedText>
            </View>
          </View>
        </View>

        {intervention.technicianName ? (
          <View style={[styles.technicianRow, { borderTopColor: theme.border }]}>
            <Feather name="user" size={12} color={theme.textSecondary} />
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
              {intervention.technicianName}
            </ThemedText>
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText type="h2">Chiudi Interventi</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          Chiudi definitivamente gli interventi completati e invia report via email
        </ThemedText>
      </View>

      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h4">Interventi Completati</ThemedText>
          <View style={[styles.selectionBadge, { backgroundColor: theme.success + '20' }]}>
            <ThemedText type="caption" style={{ color: theme.success, fontWeight: '600' }}>
              {selectedInterventions.length}/{completedInterventions.length}
            </ThemedText>
          </View>
        </View>

        <View style={styles.selectionActions}>
          <Pressable
            style={[styles.selectionButton, { borderColor: theme.border }]}
            onPress={selectAll}
          >
            <Feather name="check-square" size={14} color={theme.success} />
            <ThemedText type="caption" style={{ color: theme.success }}>Seleziona tutti</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.selectionButton, { borderColor: theme.border }]}
            onPress={deselectAll}
          >
            <Feather name="square" size={14} color={theme.textSecondary} />
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>Deseleziona</ThemedText>
          </Pressable>
        </View>

        {completedInterventions.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="check-circle" size={32} color={theme.textTertiary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              Nessun intervento completato da chiudere
            </ThemedText>
          </View>
        ) : (
          <View style={styles.interventionsList}>
            {completedInterventions.map(renderInterventionCard)}
          </View>
        )}
      </Card>

      <Card style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>Invia Report via Email</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
          Inserisci un indirizzo email per ricevere il report degli interventi chiusi (opzionale)
        </ThemedText>
        <View style={[styles.inputContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <Feather name="mail" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="email@esempio.it"
            placeholderTextColor={theme.textTertiary}
            value={emailRecipient}
            onChangeText={setEmailRecipient}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </Card>

      <Pressable
        style={[
          styles.submitButton,
          { 
            backgroundColor: selectedInterventions.length > 0 ? theme.success : theme.textTertiary,
            opacity: isProcessing ? 0.7 : 1,
          },
        ]}
        onPress={handleClose}
        disabled={selectedInterventions.length === 0 || isProcessing}
      >
        <Feather name="archive" size={20} color="#FFFFFF" />
        <ThemedText style={styles.submitButtonText}>
          {isProcessing ? 'Chiusura in corso...' : `Chiudi ${selectedInterventions.length} Interventi`}
        </ThemedText>
      </Pressable>

      <View style={{ height: Spacing.xl }} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.sm,
  },
  selectionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  interventionsList: {
    gap: Spacing.sm,
  },
  interventionCard: {
    padding: Spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  technicianRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
