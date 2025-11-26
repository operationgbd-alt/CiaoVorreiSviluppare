import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/store/AppContext';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Company } from '@/types';

export function ManageCompaniesScreen() {
  const { theme } = useTheme();
  const { companies, addCompany, deleteCompany, getUsersByCompany } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Inserisci il nome della ditta');
      } else {
        Alert.alert('Errore', 'Inserisci il nome della ditta');
      }
      return;
    }

    addCompany({
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
    });

    setFormData({ name: '', address: '', phone: '', email: '' });
    setShowForm(false);
  };

  const handleDelete = (company: Company) => {
    const users = getUsersByCompany(company.id);
    const confirmMessage = users.length > 0
      ? `Eliminare "${company.name}"? Ci sono ${users.length} utenti associati.`
      : `Eliminare "${company.name}"?`;

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        deleteCompany(company.id);
      }
    } else {
      Alert.alert('Conferma', confirmMessage, [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: () => deleteCompany(company.id) },
      ]);
    }
  };

  const renderCompanyCard = (company: Company) => {
    const users = getUsersByCompany(company.id);
    const technicians = users.filter(u => u.role === 'tecnico');

    return (
      <Card key={company.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
            <Feather name="home" size={24} color={theme.primary} />
          </View>
          <View style={styles.cardInfo}>
            <ThemedText type="h4">{company.name}</ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {technicians.length} tecnici
            </ThemedText>
          </View>
          <Pressable
            onPress={() => handleDelete(company)}
            style={[styles.deleteButton, { backgroundColor: theme.danger + '20' }]}
          >
            <Feather name="trash-2" size={18} color={theme.danger} />
          </Pressable>
        </View>
        
        {company.address ? (
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={[styles.detailText, { color: theme.textSecondary }]}>
              {company.address}
            </ThemedText>
          </View>
        ) : null}
        
        {company.phone ? (
          <View style={styles.detailRow}>
            <Feather name="phone" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={[styles.detailText, { color: theme.textSecondary }]}>
              {company.phone}
            </ThemedText>
          </View>
        ) : null}
        
        {company.email ? (
          <View style={styles.detailRow}>
            <Feather name="mail" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={[styles.detailText, { color: theme.textSecondary }]}>
              {company.email}
            </ThemedText>
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText type="h2">Gestione Ditte</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {companies.length} ditte registrate
        </ThemedText>
      </View>

      <Pressable
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() => setShowForm(!showForm)}
      >
        <Feather name={showForm ? 'x' : 'plus'} size={20} color="#FFFFFF" />
        <ThemedText style={styles.addButtonText}>
          {showForm ? 'Annulla' : 'Nuova Ditta'}
        </ThemedText>
      </Pressable>

      {showForm ? (
        <Card style={styles.formCard}>
          <ThemedText type="h4" style={styles.formTitle}>Nuova Ditta</ThemedText>
          
          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>Nome Ditta *</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Es. Solar Tech S.r.l."
              placeholderTextColor={theme.textSecondary}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>Indirizzo</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Es. Via Roma 123, Milano"
              placeholderTextColor={theme.textSecondary}
              value={formData.address}
              onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>Telefono</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Es. +39 02 12345678"
              placeholderTextColor={theme.textSecondary}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Es. info@solartech.it"
              placeholderTextColor={theme.textSecondary}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Pressable
            style={[styles.submitButton, { backgroundColor: theme.success }]}
            onPress={handleSubmit}
          >
            <Feather name="check" size={20} color="#FFFFFF" />
            <ThemedText style={styles.submitButtonText}>Crea Ditta</ThemedText>
          </Pressable>
        </Card>
      ) : null}

      <View style={styles.list}>
        {companies.map(renderCompanyCard)}
      </View>

      {companies.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="home" size={48} color={theme.textSecondary} />
          <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            Nessuna ditta registrata
          </ThemedText>
        </View>
      ) : null}
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: Typography.body.fontSize,
  },
  formCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  formTitle: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.body.fontSize,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: Typography.body.fontSize,
  },
  list: {
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  detailText: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
});
