import React, { useMemo } from "react";
import { StyleSheet, View, Pressable, SectionList } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/store/AppContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Intervention, InterventionStatus, InterventionCategory } from "@/types";
import { InterventionsStackParamList } from "@/navigation/InterventionsStackNavigator";

type InterventionsListNavProp = NativeStackNavigationProp<InterventionsStackParamList, "InterventionsList">;
type InterventionsListRouteProp = RouteProp<InterventionsStackParamList, "InterventionsList">;

interface Props {
  navigation: InterventionsListNavProp;
}

const STATUS_CONFIG: Record<InterventionStatus, { label: string; color: string; icon: string }> = {
  assegnato: { label: 'Assegnato', color: '#FF9500', icon: 'inbox' },
  appuntamento_fissato: { label: 'Appuntamento', color: '#007AFF', icon: 'calendar' },
  in_corso: { label: 'In Corso', color: '#5856D6', icon: 'play-circle' },
  completato: { label: 'Completato', color: '#34C759', icon: 'check-circle' },
  chiuso: { label: 'Chiuso', color: '#8E8E93', icon: 'lock' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  bassa: { label: 'Bassa', color: '#8E8E93' },
  normale: { label: 'Normale', color: '#007AFF' },
  alta: { label: 'Alta', color: '#FF9500' },
  urgente: { label: 'Urgente', color: '#FF3B30' },
};

const CATEGORY_CONFIG: Record<InterventionCategory, { label: string; icon: string; color: string }> = {
  sopralluogo: { label: 'Sopralluoghi', icon: 'search', color: '#5856D6' },
  installazione: { label: 'Installazioni', icon: 'tool', color: '#007AFF' },
  manutenzione: { label: 'Manutenzioni', icon: 'settings', color: '#FF9500' },
};

interface SectionData {
  title: string;
  category: InterventionCategory;
  icon: string;
  color: string;
  data: Intervention[];
}

const STATUS_LABELS: Record<InterventionStatus, string> = {
  assegnato: 'Nuovi',
  appuntamento_fissato: 'Programmati',
  in_corso: 'In Corso',
  completato: 'Completati',
  chiuso: 'Chiusi',
};

export default function InterventionsListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { interventions } = useApp();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const route = useRoute<InterventionsListRouteProp>();
  
  const paddingTop = headerHeight + Spacing.md;
  const paddingBottom = tabBarHeight + Spacing.xl;
  
  const filterStatus = route.params?.filterStatus;

  const sections = useMemo(() => {
    const categories: InterventionCategory[] = ['sopralluogo', 'installazione', 'manutenzione'];
    
    return categories.map(category => {
      const categoryInterventions = interventions
        .filter(i => {
          if (i.category !== category) return false;
          if (i.status === 'completato' || i.status === 'chiuso') return false;
          if (filterStatus && i.status !== filterStatus) return false;
          return true;
        })
        .sort((a, b) => {
          const statusOrder: InterventionStatus[] = ['assegnato', 'appuntamento_fissato', 'in_corso', 'completato'];
          const priorityOrder = ['urgente', 'alta', 'normale', 'bassa'];
          
          const statusDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
          if (statusDiff !== 0) return statusDiff;
          
          const priorityDiff = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
          if (priorityDiff !== 0) return priorityDiff;
          
          return b.assignedAt - a.assignedAt;
        });

      const config = CATEGORY_CONFIG[category];
      return {
        title: config.label,
        category,
        icon: config.icon,
        color: config.color,
        data: categoryInterventions,
      };
    });
  }, [interventions, filterStatus]);

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

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconContainer, { backgroundColor: section.color + '15' }]}>
        <Feather name={section.icon as any} size={20} color={section.color} />
      </View>
      <ThemedText type="h2" style={styles.sectionTitle}>
        {section.title}
      </ThemedText>
      <View style={[styles.countBadge, { backgroundColor: section.color + '20' }]}>
        <ThemedText type="caption" style={{ color: section.color, fontWeight: '600' }}>
          {section.data.length}
        </ThemedText>
      </View>
    </View>
  );

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

  const renderSectionFooter = ({ section }: { section: SectionData }) => {
    if (section.data.length === 0) {
      return (
        <View style={styles.emptySectionState}>
          <ThemedText type="caption" style={{ color: theme.textTertiary }}>
            Nessun intervento in questa categoria
          </ThemedText>
        </View>
      );
    }
    return <View style={styles.sectionSpacer} />;
  };

  return (
    <ThemedView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderIntervention}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
        contentContainerStyle={[styles.listContent, { paddingTop, paddingBottom }]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
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
  emptySectionState: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  sectionSpacer: {
    height: Spacing.sm,
  },
});
