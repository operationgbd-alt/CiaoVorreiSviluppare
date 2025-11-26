import React from "react";
import { StyleSheet, View, Pressable, Alert, Switch } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/store/AppContext";
import { Spacing, BorderRadius } from "@/constants/theme";

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { technician, logout } = useApp();

  const handleLogout = () => {
    Alert.alert("Esci", "Sei sicuro di voler uscire da SolarTech?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Esci",
        style: "destructive",
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    subtitle?: string,
    rightElement?: React.ReactNode,
    onPress?: () => void,
    danger?: boolean
  ) => (
    <Pressable
      style={({ pressed }) => [
        styles.settingItem,
        { backgroundColor: theme.backgroundDefault, opacity: pressed && onPress ? 0.8 : 1 },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View
        style={[
          styles.settingIcon,
          { backgroundColor: danger ? theme.danger + "20" : theme.primaryLight },
        ]}
      >
        <Feather name={icon as any} size={18} color={danger ? theme.danger : theme.primary} />
      </View>
      <View style={styles.settingContent}>
        <ThemedText type="body" style={danger ? { color: theme.danger } : undefined}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {rightElement ? (
        rightElement
      ) : onPress ? (
        <Feather name="chevron-right" size={20} color={theme.textTertiary} />
      ) : null}
    </Pressable>
  );

  return (
    <ScreenScrollView>
      <View style={[styles.profileCard, { backgroundColor: theme.backgroundDefault }]}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.avatarText}>
            {technician?.name.split(" ").map((n) => n[0]).join("")}
          </ThemedText>
        </View>
        <ThemedText type="h2" style={styles.name}>
          {technician?.name}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {technician?.email}
        </ThemedText>
        <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
          <Feather name="briefcase" size={14} color={theme.primary} />
          <ThemedText type="caption" style={{ color: theme.primary, marginLeft: Spacing.xs }}>
            {technician?.companyName}
          </ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Account
        </ThemedText>
        <View style={styles.settingGroup}>
          {renderSettingItem(
            "user",
            "Profilo",
            "Modifica i tuoi dati personali",
            undefined,
            () => Alert.alert("Info", "Funzionalita in arrivo")
          )}
          {renderSettingItem(
            "lock",
            "Sicurezza",
            "Password e autenticazione",
            undefined,
            () => Alert.alert("Info", "Funzionalita in arrivo")
          )}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Notifiche
        </ThemedText>
        <View style={styles.settingGroup}>
          {renderSettingItem(
            "bell",
            "Notifiche Push",
            "Ricevi avvisi per appuntamenti",
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          )}
          {renderSettingItem(
            "volume-2",
            "Suoni",
            "Attiva suoni notifiche",
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: theme.border, true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Preferenze
        </ThemedText>
        <View style={styles.settingGroup}>
          {renderSettingItem(
            "globe",
            "Lingua",
            "Italiano",
            undefined,
            () => Alert.alert("Info", "Funzionalita in arrivo")
          )}
          {renderSettingItem(
            "moon",
            "Tema",
            "Automatico",
            undefined,
            () => Alert.alert("Info", "Funzionalita in arrivo")
          )}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Informazioni
        </ThemedText>
        <View style={styles.settingGroup}>
          {renderSettingItem(
            "file-text",
            "Termini di Servizio",
            undefined,
            undefined,
            () => Alert.alert("Info", "Funzionalita in arrivo")
          )}
          {renderSettingItem(
            "shield",
            "Privacy Policy",
            undefined,
            undefined,
            () => Alert.alert("Info", "Funzionalita in arrivo")
          )}
          {renderSettingItem(
            "info",
            "Versione App",
            "1.0.0"
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.settingGroup}>
          {renderSettingItem(
            "log-out",
            "Esci",
            undefined,
            undefined,
            handleLogout,
            true
          )}
        </View>
      </View>

      <View style={{ height: Spacing["3xl"] }} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: "center",
    padding: Spacing["2xl"],
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 28,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  settingGroup: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    marginBottom: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});
