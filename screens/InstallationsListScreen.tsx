import React, { useState, useMemo } from "react";
import { StyleSheet, View, Pressable, TextInput, FlatList } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useHeaderHeight } from "@react-navigation/elements";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/store/AppContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { InstallationsStackParamList } from "@/navigation/InstallationsStackNavigator";
import { Installation, InstallationStatus } from "@/types";

type InstallationsListNavProp = NativeStackNavigationProp<
  InstallationsStackParamList,
  "InstallationsList"
>;

interface Props {
  navigation: InstallationsListNavProp;
}

type FilterType = "tutti" | "programmata" | "in_corso" | "completata";

export default function InstallationsListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { installations } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("tutti");

  const filteredInstallations = useMemo(() => {
    let result = installations;

    if (activeFilter !== "tutti") {
      result = result.filter((i) => i.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.client.name.toLowerCase().includes(query) ||
          i.client.city.toLowerCase().includes(query) ||
          i.interventionNumber.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => b.date - a.date);
  }, [installations, activeFilter, searchQuery]);

  const getStatusColor = (status: InstallationStatus) => {
    switch (status) {
      case "completata":
        return theme.success;
      case "in_corso":
        return theme.primary;
      default:
        return theme.secondary;
    }
  };

  const getStatusLabel = (status: InstallationStatus) => {
    switch (status) {
      case "completata":
        return "Completata";
      case "in_corso":
        return "In corso";
      default:
        return "Programmata";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const renderInstallation = ({ item }: { item: Installation }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={() => navigation.navigate("InstallationForm", { installation: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <View style={styles.cardTitleLeft}>
            <ThemedText type="caption" style={{ color: theme.textSecondary }}>
              {item.interventionNumber}
            </ThemedText>
            <ThemedText type="h4">{item.client.name}</ThemedText>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}
          >
            <ThemedText
              type="caption"
              style={{ color: getStatusColor(item.status), fontWeight: "600" }}
            >
              {getStatusLabel(item.status)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.cardAddress}>
          <Feather name="map-pin" size={14} color={theme.textSecondary} />
          <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
            {item.client.address} {item.client.civicNumber}, {item.client.city}
          </ThemedText>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.cardInfo}>
          <View style={styles.dateRow}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText type="small" style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}>
              {new Date(item.date).toLocaleDateString("it-IT")}
            </ThemedText>
          </View>
          {item.totalAmount > 0 ? (
            <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
              {formatCurrency(item.totalAmount)}
            </ThemedText>
          ) : null}
        </View>
        <Feather name="chevron-right" size={20} color={theme.textTertiary} />
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="tool" size={48} color={theme.textTertiary} />
      <ThemedText type="h4" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
        Nessuna installazione
      </ThemedText>
      <ThemedText
        type="small"
        style={{ color: theme.textTertiary, marginTop: Spacing.sm, textAlign: "center" }}
      >
        {searchQuery
          ? "Nessun risultato per la ricerca"
          : "Tocca il pulsante + per creare il primo ordine di lavoro"}
      </ThemedText>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.header,
          { paddingTop: headerHeight + Spacing.lg, backgroundColor: theme.backgroundRoot },
        ]}
      >
        <View style={[styles.searchBar, { backgroundColor: theme.backgroundDefault }]}>
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cerca cliente o numero ODL..."
            placeholderTextColor={theme.textTertiary}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filters}>
          {(["tutti", "programmata", "in_corso", "completata"] as FilterType[]).map((filter) => (
            <Pressable
              key={filter}
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    activeFilter === filter ? theme.primary : theme.backgroundDefault,
                },
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <ThemedText
                type="caption"
                style={{
                  color: activeFilter === filter ? "#FFFFFF" : theme.text,
                }}
              >
                {filter === "tutti"
                  ? "Tutti"
                  : filter === "programmata"
                  ? "Programmate"
                  : filter === "in_corso"
                  ? "In corso"
                  : "Completate"}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredInstallations}
        renderItem={renderInstallation}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + Spacing.xl + 60 },
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.primary,
            bottom: tabBarHeight + Spacing.xl,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
        onPress={() => navigation.navigate("InstallationForm", {})}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  filters: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    marginBottom: Spacing.md,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xs,
  },
  cardTitleLeft: {
    flex: 1,
  },
  cardAddress: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  fab: {
    position: "absolute",
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 4,
  },
});
