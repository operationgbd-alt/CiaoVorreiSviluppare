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
import { SurveysStackParamList } from "@/navigation/SurveysStackNavigator";
import { Survey, SurveyStatus } from "@/types";

type SurveysListNavProp = NativeStackNavigationProp<SurveysStackParamList, "SurveysList">;

interface Props {
  navigation: SurveysListNavProp;
}

type FilterType = "tutti" | "da_completare" | "completato";

export default function SurveysListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { surveys } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("tutti");

  const filteredSurveys = useMemo(() => {
    let result = surveys;

    if (activeFilter !== "tutti") {
      result = result.filter((s) => s.status === activeFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.client.name.toLowerCase().includes(query) ||
          s.client.city.toLowerCase().includes(query) ||
          s.client.address.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [surveys, activeFilter, searchQuery]);

  const getStatusColor = (status: SurveyStatus) => {
    return status === "completato" ? theme.success : theme.secondary;
  };

  const getStatusLabel = (status: SurveyStatus) => {
    return status === "completato" ? "Completato" : "Da completare";
  };

  const renderSurvey = ({ item }: { item: Survey }) => (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.8 : 1 },
      ]}
      onPress={() => navigation.navigate("SurveyForm", { survey: item })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <ThemedText type="h4">{item.client.name}</ThemedText>
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
          {item.productSize ? (
            <View style={[styles.tag, { backgroundColor: theme.primaryLight }]}>
              <ThemedText type="caption" style={{ color: theme.primary }}>
                {item.productSize}
              </ThemedText>
            </View>
          ) : null}
          <ThemedText type="caption" style={{ color: theme.textSecondary }}>
            {new Date(item.updatedAt).toLocaleDateString("it-IT")}
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textTertiary} />
      </View>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="clipboard" size={48} color={theme.textTertiary} />
      <ThemedText type="h4" style={{ color: theme.textSecondary, marginTop: Spacing.lg }}>
        Nessun sopralluogo
      </ThemedText>
      <ThemedText
        type="small"
        style={{ color: theme.textTertiary, marginTop: Spacing.sm, textAlign: "center" }}
      >
        {searchQuery
          ? "Nessun risultato per la ricerca"
          : "Tocca il pulsante + per creare il primo sopralluogo"}
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
            placeholder="Cerca cliente o citta..."
            placeholderTextColor={theme.textTertiary}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.filters}>
          {(["tutti", "da_completare", "completato"] as FilterType[]).map((filter) => (
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
                type="small"
                style={{
                  color: activeFilter === filter ? "#FFFFFF" : theme.text,
                }}
              >
                {filter === "tutti"
                  ? "Tutti"
                  : filter === "da_completare"
                  ? "Da completare"
                  : "Completati"}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredSurveys}
        renderItem={renderSurvey}
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
        onPress={() => navigation.navigate("SurveyForm", {})}
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
    alignItems: "center",
    marginBottom: Spacing.xs,
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
    gap: Spacing.md,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
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
