import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/store/AppContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Spacing, BorderRadius } from '@/constants/theme';
import { User } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  
  if (minutes < 1) return 'Adesso';
  if (minutes < 60) return `${minutes} min fa`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ore fa`;
  
  const days = Math.floor(hours / 24);
  return `${days} giorni fa`;
}

export function TechnicianMapScreen() {
  const { theme } = useTheme();
  const { users } = useApp();
  const [selectedTech, setSelectedTech] = useState<User | null>(null);
  const insets = useSafeAreaInsets();
  
  const technicians = useMemo(() => 
    users.filter(u => u.role === 'tecnico' && u.lastLocation),
    [users]
  );

  const onlineTechnicians = technicians.filter(t => t.lastLocation?.isOnline);
  const offlineTechnicians = technicians.filter(t => !t.lastLocation?.isOnline);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
    >
      <ThemedView style={[styles.header, { backgroundColor: theme.backgroundDefault }]}>
        <Feather name="map-pin" size={24} color={theme.primary} />
        <ThemedText type="h3" style={{ marginLeft: Spacing.md }}>
          Posizione Tecnici
        </ThemedText>
      </ThemedView>

      <View style={styles.legend}>
        <View style={[styles.legendItem, { backgroundColor: theme.success + '15' }]}>
          <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
          <ThemedText type="body" style={{ color: theme.success, fontWeight: '600' }}>
            Online ({onlineTechnicians.length})
          </ThemedText>
        </View>
        <View style={[styles.legendItem, { backgroundColor: theme.textSecondary + '15' }]}>
          <View style={[styles.legendDot, { backgroundColor: theme.textSecondary }]} />
          <ThemedText type="body" style={{ color: theme.textSecondary, fontWeight: '600' }}>
            Offline ({offlineTechnicians.length})
          </ThemedText>
        </View>
      </View>

      {technicians.map((tech) => {
        const isOnline = tech.lastLocation?.isOnline;
        return (
          <Pressable
            key={tech.id}
            style={({ pressed }) => [
              styles.techCard,
              { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 }
            ]}
            onPress={() => setSelectedTech(selectedTech?.id === tech.id ? null : tech)}
          >
            <View style={styles.techCardHeader}>
              <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
                <ThemedText type="h4" style={{ color: theme.primary }}>
                  {tech.name.split(' ').map(n => n[0]).join('')}
                </ThemedText>
              </View>
              <View style={styles.techCardInfo}>
                <ThemedText type="h4">{tech.name}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {tech.companyName}
                </ThemedText>
              </View>
              <View style={[
                styles.onlineStatus, 
                { backgroundColor: isOnline ? theme.success + '20' : theme.textSecondary + '20' }
              ]}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: isOnline ? theme.success : theme.textSecondary }
                ]} />
                <ThemedText type="caption" style={{ color: isOnline ? theme.success : theme.textSecondary }}>
                  {isOnline ? 'Online' : 'Offline'}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.techCardLocation}>
              <Feather name="map-pin" size={14} color={theme.primary} />
              <ThemedText type="small" style={{ marginLeft: Spacing.sm, flex: 1 }}>
                {tech.lastLocation?.address || 'Posizione sconosciuta'}
              </ThemedText>
            </View>
            
            <View style={styles.techCardLocation}>
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <ThemedText type="caption" style={{ marginLeft: Spacing.sm, color: theme.textSecondary }}>
                Ultimo aggiornamento: {tech.lastLocation ? formatTimeAgo(tech.lastLocation.timestamp) : 'N/D'}
              </ThemedText>
            </View>

            {selectedTech?.id === tech.id ? (
              <View style={styles.actionButtons}>
                <Pressable style={[styles.actionButton, { backgroundColor: theme.primary }]}>
                  <Feather name="phone" size={16} color={theme.buttonText} />
                  <ThemedText type="small" style={{ color: theme.buttonText, marginLeft: Spacing.xs }}>
                    Chiama
                  </ThemedText>
                </Pressable>
                <Pressable style={[styles.actionButton, { backgroundColor: theme.primaryLight }]}>
                  <Feather name="message-circle" size={16} color={theme.primary} />
                  <ThemedText type="small" style={{ color: theme.primary, marginLeft: Spacing.xs }}>
                    Messaggio
                  </ThemedText>
                </Pressable>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  legend: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  techCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  techCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  techCardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  techCardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});
