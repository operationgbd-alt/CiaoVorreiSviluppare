import React, { useState, useMemo } from "react";
import { StyleSheet, View, Pressable, FlatList } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/store/AppContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Intervention, InterventionStatus } from "@/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScreenInsets } from "@/hooks/useScreenInsets";

type InterventionsStackParamList = {
  InterventionsList: undefined;
  InterventionDetail: { interventionId: string };
};

type InterventionsListNavProp = NativeStackNavigationProp<InterventionsStackParamList, "InterventionsList">;

interface Props {
  navigation: InterventionsListNavProp;
}

type FilterType = 'tutti' | InterventionStatus;

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'Tutti', value: 'tutti' },
  { label: 'Assegnati', value: 'assegnato' },
  { label: 'Appuntamento', value: 'appuntamento_fissato' },
  { label: 'In Corso', value: 'in_corso' },
  { label: 'Completati', value: 'completato' },
];

const STATUS_CONFIG: Record<InterventionStatus, { label: string; color: string; icon: string }> = {
  assegnato: { label: 'Assegnato', color: '#FF9500', icon: 'inbox' },
  appuntamento_fissato: { label: 'Appuntamento', color: '#007AFF', icon: 'calendar' },
  in_corso: { label: 'In Corso', color: '#5856D6', icon: 'play-circle' },
  completato: { label: 'Completato', color: '#34C759', icon: 'check-circle' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  bassa: { label: 'Bassa', color: '#8E8E93' },
  normale: { label: 'Normale', color: '#007AFF' },
  alta: { label: 'Alta', color: '#FF9500' },
  urgente: { label: 'Urgente', color: '#FF3B30' },
};

const CATEGORY_LABELS: Record<string, string> = {
  sopralluogo: 'Sopralluogo',
  installazione: 'Installazione',
};

export default function InterventionsListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { interventions } = useApp();
  const [activeFilter, setActiveFilter] = useState<FilterType>('tutti');
  const { paddingBottom } = useScreenInsets();

  const filteredInterventions = useMemo(() => {
    let filtered = [...interventions];
    
    if (activeFilter !== 'tutti') {
      filtered = filtered.filter(i => i.status === activeFilter);
    }
    
    const statusOrder: InterventionStatus[] = ['assegnato', 'appuntamento_fissato', 'in_corso', 'completato'];
    const priorityOrder = ['urgente', 'alta', 'normale', 'bassa'];
    
    filtered.sort((a, b) => {
      const statusDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      if (statusDiff !== 0) return statusDiff;
      
      const priorityDiff = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
      if (priorityDiff !== 0) return priorityDiff;
      
      return b.assignedAt - a.assignedAt;
    });
    
    return filtered;
  }, [interventions, activeFilter]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderIntervention = ({ item }: { item: Intervention }) => {
    const statusConfig = STATUS_CONFIG[item.status];
    const priorityConfig = PRIORITY_CONFIG[item.priority];

    return (
      <Card 
        style={styles.card}
        onPress={() => navigation.navigate('InterventionDetail', { interventionId: item.id })}
      >
          <View style={styles.cardHeader}>
            <View style={styles.numberBadge}>
              <ThemedText type="caption" style={{ fontWeight: '600' }}>
                {item.number}
              </ThemedText>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.color + '20' }]}>
              <ThemedText type="caption" style={{ color: priorityConfig.color, fontWeight: '600' }}>
                {priorityConfig.label}
              </ThemedText>
            </View>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.clientRow}>
              <Feather name="user" size={16} color={theme.textSecondary} />
              <ThemedText type="body" style={styles.clientName}>
                {item.client.name}
              </ThemedText>
            </View>

            <View style={styles.addressRow}>
              <Feather name="map-pin" size={14} color={theme.textTertiary} />
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: Spacing.xs, flex: 1 }}>
                {item.client.address} {item.client.civicNumber}, {item.client.city}
              </ThemedText>
            </View>

            <View style={styles.categoryRow}>
              <View style={[styles.categoryBadge, { backgroundColor: theme.backgroundSecondary }]}>
                <ThemedText type="caption">
                  {CATEGORY_LABELS[item.category]}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="small" numberOfLines={2} style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
              {item.description}
            </ThemedText>
          </View>

          <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
            <View style={styles.statusContainer}>
              <Feather name={statusConfig.icon as any} size={14} color={statusConfig.color} />
              <ThemedText type="caption" style={{ color: statusConfig.color, marginLeft: Spacing.xs }}>
                {statusConfig.label}
              </ThemedText>
            </View>

            {item.appointment ? (
              <View style={styles.appointmentInfo}>
                <Feather name="clock" size={12} color={theme.textSecondary} />
                <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                  {formatDate(item.appointment.date)} {formatTime(item.appointment.date)}
                </ThemedText>
              </View>
            ) : (
              <ThemedText type="caption" style={{ color: theme.textTertiary }}>
                Assegnato {formatDate(item.assignedAt)}
              </ThemedText>
            )}
          </View>
        </Card>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.value}
          contentContainerStyle={styles.filtersContent}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.filterButton,
                {
                  backgroundColor: activeFilter === item.value 
                    ? theme.primary + '20' 
                    : theme.backgroundSecondary,
                  borderColor: activeFilter === item.value ? theme.primary : 'transparent',
                },
              ]}
              onPress={() => setActiveFilter(item.value)}
            >
              <ThemedText
                type="caption"
                style={{
                  color: activeFilter === item.value ? theme.primary : theme.text,
                  fontWeight: activeFilter === item.value ? '600' : '400',
                }}
              >
                {item.label}
              </ThemedText>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filteredInterventions}
        keyExtractor={(item) => item.id}
        renderItem={renderIntervention}
        contentContainerStyle={[styles.listContent, { paddingBottom }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="inbox" size={48} color={theme.textTertiary} />
            <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: Spacing.md, textAlign: 'center' }}>
              Nessun intervento trovato
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: Spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  card: {
    marginBottom: Spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  numberBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  cardBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientName: {
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.xs,
  },
  categoryRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
});
