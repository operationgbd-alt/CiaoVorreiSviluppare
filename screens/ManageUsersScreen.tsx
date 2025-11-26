import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ScreenScrollView } from '@/components/ScreenScrollView';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/store/AppContext';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { User } from '@/types';

export function ManageUsersScreen() {
  const { theme } = useTheme();
  const { users, companies, addUser, deleteUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    role: 'tecnico' as 'ditta' | 'tecnico',
    companyId: '',
  });

  const technicians = users.filter(u => u.role === 'tecnico');
  const companyAccounts = users.filter(u => u.role === 'ditta');

  const handleSubmit = () => {
    if (!formData.username.trim() || !formData.name.trim()) {
      const msg = 'Inserisci username e nome';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Errore', msg);
      }
      return;
    }

    if (!formData.companyId) {
      const msg = 'Seleziona una ditta';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Errore', msg);
      }
      return;
    }

    const company = companies.find(c => c.id === formData.companyId);

    addUser({
      username: formData.username.trim().toLowerCase(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      companyId: formData.companyId,
      companyName: company?.name || null,
    });

    setFormData({
      username: '',
      name: '',
      email: '',
      phone: '',
      role: 'tecnico',
      companyId: '',
    });
    setShowForm(false);
  };

  const handleDelete = (user: User) => {
    const confirmMessage = `Eliminare l'utente "${user.name}"?`;
    if (Platform.OS === 'web') {
      if (window.confirm(confirmMessage)) {
        deleteUser(user.id);
      }
    } else {
      Alert.alert('Conferma', confirmMessage, [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: () => deleteUser(user.id) },
      ]);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'master':
        return theme.danger;
      case 'ditta':
        return theme.secondary;
      case 'tecnico':
        return theme.primary;
      default:
        return theme.textSecondary;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'master':
        return 'Amministratore';
      case 'ditta':
        return 'Ditta';
      case 'tecnico':
        return 'Tecnico';
      default:
        return role;
    }
  };

  const renderUserCard = (user: User) => (
    <Card key={user.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getRoleColor(user.role) + '20' }]}>
          <Feather
            name={user.role === 'tecnico' ? 'tool' : user.role === 'ditta' ? 'home' : 'shield'}
            size={24}
            color={getRoleColor(user.role)}
          />
        </View>
        <View style={styles.cardInfo}>
          <ThemedText type="h4">{user.name}</ThemedText>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: getRoleColor(user.role) + '20' }]}>
              <ThemedText type="caption" style={{ color: getRoleColor(user.role) }}>
                {getRoleLabel(user.role)}
              </ThemedText>
            </View>
          </View>
        </View>
        {user.role !== 'master' ? (
          <Pressable
            onPress={() => handleDelete(user)}
            style={[styles.deleteButton, { backgroundColor: theme.danger + '20' }]}
          >
            <Feather name="trash-2" size={18} color={theme.danger} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.detailRow}>
        <Feather name="user" size={14} color={theme.textSecondary} />
        <ThemedText type="small" style={[styles.detailText, { color: theme.textSecondary }]}>
          @{user.username}
        </ThemedText>
      </View>

      {user.email ? (
        <View style={styles.detailRow}>
          <Feather name="mail" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={[styles.detailText, { color: theme.textSecondary }]}>
            {user.email}
          </ThemedText>
        </View>
      ) : null}

      {user.companyName ? (
        <View style={styles.detailRow}>
          <Feather name="briefcase" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={[styles.detailText, { color: theme.textSecondary }]}>
            {user.companyName}
          </ThemedText>
        </View>
      ) : null}
    </Card>
  );

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <ThemedText type="h2">Gestione Utenti</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {technicians.length} tecnici, {companyAccounts.length} account ditta
        </ThemedText>
      </View>

      <Pressable
        style={[styles.addButton, { backgroundColor: theme.primary }]}
        onPress={() => setShowForm(!showForm)}
      >
        <Feather name={showForm ? 'x' : 'plus'} size={20} color="#FFFFFF" />
        <ThemedText style={styles.addButtonText}>
          {showForm ? 'Annulla' : 'Nuovo Utente'}
        </ThemedText>
      </Pressable>

      {showForm ? (
        <Card style={styles.formCard}>
          <ThemedText type="h4" style={styles.formTitle}>Nuovo Utente</ThemedText>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>Tipo Utente *</ThemedText>
            <View style={styles.roleButtons}>
              <Pressable
                style={[
                  styles.roleButton,
                  { borderColor: theme.border },
                  formData.role === 'tecnico' && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
                onPress={() => setFormData(prev => ({ ...prev, role: 'tecnico' }))}
              >
                <Feather name="tool" size={16} color={formData.role === 'tecnico' ? '#FFFFFF' : theme.text} />
                <ThemedText style={[styles.roleButtonText, formData.role === 'tecnico' && { color: '#FFFFFF' }]}>
                  Tecnico
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.roleButton,
                  { borderColor: theme.border },
                  formData.role === 'ditta' && { backgroundColor: theme.secondary, borderColor: theme.secondary },
                ]}
                onPress={() => setFormData(prev => ({ ...prev, role: 'ditta' }))}
              >
                <Feather name="home" size={16} color={formData.role === 'ditta' ? '#FFFFFF' : theme.text} />
                <ThemedText style={[styles.roleButtonText, formData.role === 'ditta' && { color: '#FFFFFF' }]}>
                  Account Ditta
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>Ditta *</ThemedText>
            <View style={styles.companyButtons}>
              {companies.map(company => (
                <Pressable
                  key={company.id}
                  style={[
                    styles.companyButton,
                    { borderColor: theme.border },
                    formData.companyId === company.id && { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, companyId: company.id }))}
                >
                  <ThemedText
                    type="small"
                    style={[
                      styles.companyButtonText,
                      formData.companyId === company.id && { color: theme.primary, fontWeight: '600' },
                    ]}
                  >
                    {company.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>Username *</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Es. mario.rossi"
              placeholderTextColor={theme.textSecondary}
              value={formData.username}
              onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>Nome Completo *</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Es. Mario Rossi"
              placeholderTextColor={theme.textSecondary}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>Email</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Es. mario@azienda.it"
              placeholderTextColor={theme.textSecondary}
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="small" style={styles.label}>Telefono</ThemedText>
            <TextInput
              style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
              placeholder="Es. +39 333 1234567"
              placeholderTextColor={theme.textSecondary}
              value={formData.phone}
              onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />
          </View>

          <Pressable
            style={[styles.submitButton, { backgroundColor: theme.success }]}
            onPress={handleSubmit}
          >
            <Feather name="check" size={20} color="#FFFFFF" />
            <ThemedText style={styles.submitButtonText}>Crea Utente</ThemedText>
          </Pressable>
        </Card>
      ) : null}

      {technicians.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>Tecnici</ThemedText>
          <View style={styles.list}>
            {technicians.map(renderUserCard)}
          </View>
        </View>
      ) : null}

      {companyAccounts.length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>Account Ditta</ThemedText>
          <View style={styles.list}>
            {companyAccounts.map(renderUserCard)}
          </View>
        </View>
      ) : null}

      {users.filter(u => u.role === 'master').length > 0 ? (
        <View style={styles.section}>
          <ThemedText type="h4" style={styles.sectionTitle}>Amministratori</ThemedText>
          <View style={styles.list}>
            {users.filter(u => u.role === 'master').map(renderUserCard)}
          </View>
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
  roleButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  roleButtonText: {
    fontWeight: '500',
  },
  companyButtons: {
    gap: Spacing.sm,
  },
  companyButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  companyButtonText: {},
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
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
    marginBottom: Spacing.sm,
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
  badges: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
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
});
