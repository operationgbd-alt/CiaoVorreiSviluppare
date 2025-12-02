import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTheme } from '@/hooks/useTheme';
import { ThemedText } from '@/components/ThemedText';
import { Spacing, BorderRadius } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { User } from '@/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAP_HEIGHT = SCREEN_HEIGHT * 0.45;

interface TechnicianMapProps {
  technicians: User[];
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onMarkerPress: (tech: User) => void;
  onCallTech: (phone?: string | null) => void;
  mapRef: React.RefObject<MapView | null>;
  onlineTechnicians: User[];
  offlineTechnicians: User[];
}

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

export function TechnicianMap({
  technicians,
  initialRegion,
  onMarkerPress,
  onCallTech,
  mapRef,
  onlineTechnicians,
  offlineTechnicians,
}: TechnicianMapProps) {
  const { theme } = useTheme();

  const safeRegion = {
    latitude: isFinite(initialRegion?.latitude) ? initialRegion.latitude : 42.5,
    longitude: isFinite(initialRegion?.longitude) ? initialRegion.longitude : 12.5,
    latitudeDelta: isFinite(initialRegion?.latitudeDelta) && initialRegion.latitudeDelta > 0 ? initialRegion.latitudeDelta : 8,
    longitudeDelta: isFinite(initialRegion?.longitudeDelta) && initialRegion.longitudeDelta > 0 ? initialRegion.longitudeDelta : 8,
  };

  const validTechnicians = (technicians || []).filter((tech) => {
    if (!tech || !tech.lastLocation) return false;
    const lat = tech.lastLocation.latitude;
    const lng = tech.lastLocation.longitude;
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      isFinite(lat) &&
      isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  });

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={safeRegion}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        rotateEnabled={false}
      >
        {validTechnicians.map((tech) => {
          try {
            const location = tech.lastLocation!;
            const lat = Number(location.latitude);
            const lng = Number(location.longitude);
            
            if (!isFinite(lat) || !isFinite(lng)) {
              return null;
            }
            
            const isOnline = Boolean(location.isOnline);
            const techName = String(tech.name || '?');
            const initials = techName.split(' ').map(n => (n && n[0]) || '').join('') || '?';
            
            return (
              <Marker
                key={tech.id}
                coordinate={{
                  latitude: lat,
                  longitude: lng,
                }}
                onPress={() => onMarkerPress(tech)}
                pinColor={isOnline ? '#34C759' : '#8E8E93'}
              >
                <View style={[
                  styles.customMarker,
                  { backgroundColor: isOnline ? '#34C759' : '#8E8E93' }
                ]}>
                  <ThemedText style={styles.markerText}>
                    {initials}
                  </ThemedText>
                </View>
                <Callout tooltip onPress={() => onCallTech(tech.phone)}>
                  <View style={[styles.callout, { backgroundColor: theme.backgroundDefault }]}>
                    <ThemedText type="h4" style={{ marginBottom: 4 }}>{techName}</ThemedText>
                    <ThemedText type="small" style={{ color: theme.textSecondary }}>
                      {tech.companyName || ''}
                    </ThemedText>
                    <View style={[styles.calloutStatus, { backgroundColor: isOnline ? '#34C75920' : '#8E8E9320' }]}>
                      <View style={[styles.calloutDot, { backgroundColor: isOnline ? '#34C759' : '#8E8E93' }]} />
                      <ThemedText type="caption" style={{ color: isOnline ? '#34C759' : '#8E8E93' }}>
                        {isOnline ? 'Online' : 'Offline'}
                      </ThemedText>
                    </View>
                    <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 4 }}>
                      {location.timestamp ? formatTimeAgo(location.timestamp) : ''}
                    </ThemedText>
                    {tech.phone ? (
                      <View style={[styles.calloutAction, { backgroundColor: theme.primary }]}>
                        <Feather name="phone" size={12} color="#FFF" />
                        <ThemedText type="caption" style={{ color: '#FFF', marginLeft: 4 }}>
                          Chiama
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                </Callout>
              </Marker>
            );
          } catch (e) {
            console.warn('[TechnicianMap] Error rendering marker:', e);
            return null;
          }
        })}
      </MapView>
      
      <View style={[styles.mapLegend, { backgroundColor: theme.backgroundDefault + 'E6' }]}>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
          <ThemedText type="caption">Online ({onlineTechnicians.length})</ThemedText>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: '#8E8E93' }]} />
          <ThemedText type="caption">Offline ({offlineTechnicians.length})</ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: MAP_HEIGHT,
  },
  mapLegend: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  customMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  callout: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
  },
  calloutDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  calloutAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
});
