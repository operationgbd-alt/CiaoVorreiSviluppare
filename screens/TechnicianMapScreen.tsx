import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Platform, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/store/AppContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Spacing, BorderRadius } from '@/constants/theme';
import { User } from '@/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

let MapView: any = null;
let Marker: any = null;
let Callout: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
}

const ITALY_CENTER = {
  latitude: 43.0,
  longitude: 12.0,
  latitudeDelta: 8,
  longitudeDelta: 8,
};

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

  if (Platform.OS === 'web') {
    return (
      <ScrollView 
        style={[styles.webContainer, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
      >
        <ThemedView style={[styles.webHeader, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="map-pin" size={24} color={theme.primary} />
          <ThemedText type="h3" style={{ marginLeft: Spacing.md }}>
            Posizione Tecnici
          </ThemedText>
        </ThemedView>
        
        <ThemedText type="caption" style={{ color: theme.textSecondary, paddingHorizontal: Spacing.md, marginBottom: Spacing.md }}>
          La mappa interattiva e disponibile solo su dispositivi mobili. Di seguito la lista dei tecnici con le loro posizioni.
        </ThemedText>

        <View style={styles.webLegend}>
          <View style={[styles.webLegendItem, { backgroundColor: theme.success + '15' }]}>
            <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
            <ThemedText type="body" style={{ color: theme.success, fontWeight: '600' }}>
              Online ({onlineTechnicians.length})
            </ThemedText>
          </View>
          <View style={[styles.webLegendItem, { backgroundColor: theme.textSecondary + '15' }]}>
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

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={ITALY_CENTER}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {technicians.map((tech) => {
          if (!tech.lastLocation) return null;
          const isOnline = tech.lastLocation.isOnline;
          
          return (
            <Marker
              key={tech.id}
              coordinate={{
                latitude: tech.lastLocation.latitude,
                longitude: tech.lastLocation.longitude,
              }}
              title={tech.name}
              description={tech.lastLocation.address}
              pinColor={isOnline ? theme.success : theme.textSecondary}
              onPress={() => setSelectedTech(tech)}
            >
              <Callout>
                <View style={styles.callout}>
                  <ThemedText type="h4" style={{ color: theme.text }}>
                    {tech.name}
                  </ThemedText>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    {tech.companyName}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color: theme.textTertiary }}>
                    {tech.lastLocation.address}
                  </ThemedText>
                  <View style={[styles.statusBadge, { backgroundColor: isOnline ? theme.success + '20' : theme.textSecondary + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: isOnline ? theme.success : theme.textSecondary }]} />
                    <ThemedText type="caption" style={{ color: isOnline ? theme.success : theme.textSecondary }}>
                      {isOnline ? 'Online' : 'Offline'} - {formatTimeAgo(tech.lastLocation.timestamp)}
                    </ThemedText>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <ThemedView style={[styles.legend, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: theme.success }]} />
          <ThemedText type="small">Online ({onlineTechnicians.length})</ThemedText>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: theme.textSecondary }]} />
          <ThemedText type="small">Offline ({offlineTechnicians.length})</ThemedText>
        </View>
      </ThemedView>

      {selectedTech ? (
        <Card style={[styles.infoCard, { backgroundColor: theme.backgroundRoot }]}>
          <Pressable 
            style={styles.closeButton}
            onPress={() => setSelectedTech(null)}
          >
            <Feather name="x" size={20} color={theme.textSecondary} />
          </Pressable>
          
          <View style={styles.techHeader}>
            <View style={[styles.avatar, { backgroundColor: theme.primaryLight }]}>
              <ThemedText type="h4" style={{ color: theme.primary }}>
                {selectedTech.name.split(' ').map(n => n[0]).join('')}
              </ThemedText>
            </View>
            <View style={styles.techInfo}>
              <ThemedText type="h4">{selectedTech.name}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {selectedTech.companyName}
              </ThemedText>
            </View>
            <View style={[
              styles.onlineStatus, 
              { backgroundColor: selectedTech.lastLocation?.isOnline ? theme.success + '20' : theme.textSecondary + '20' }
            ]}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: selectedTech.lastLocation?.isOnline ? theme.success : theme.textSecondary }
              ]} />
              <ThemedText type="caption" style={{ 
                color: selectedTech.lastLocation?.isOnline ? theme.success : theme.textSecondary 
              }}>
                {selectedTech.lastLocation?.isOnline ? 'Online' : 'Offline'}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.locationInfo}>
            <Feather name="map-pin" size={16} color={theme.primary} />
            <ThemedText type="small" style={{ marginLeft: Spacing.sm, flex: 1 }}>
              {selectedTech.lastLocation?.address || 'Posizione sconosciuta'}
            </ThemedText>
          </View>

          <View style={styles.locationInfo}>
            <Feather name="clock" size={16} color={theme.textSecondary} />
            <ThemedText type="small" style={{ marginLeft: Spacing.sm, color: theme.textSecondary }}>
              Ultimo aggiornamento: {selectedTech.lastLocation ? formatTimeAgo(selectedTech.lastLocation.timestamp) : 'N/D'}
            </ThemedText>
          </View>

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
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  callout: {
    padding: Spacing.sm,
    minWidth: 150,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  legend: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  infoCard: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.md,
    right: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.xs,
    zIndex: 1,
  },
  techHeader: {
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
  techInfo: {
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
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
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
  webContainer: {
    flex: 1,
  },
  webHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  webLegend: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  webLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
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
  techCardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  techCardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
});
