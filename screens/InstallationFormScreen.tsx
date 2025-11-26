import React, { useState, useLayoutEffect } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/store/AppContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { InstallationsStackParamList } from "@/navigation/InstallationsStackNavigator";
import { InstallationStatus, InterventionType, DetailType, InstallationItem } from "@/types";

type InstallationFormNavProp = NativeStackNavigationProp<
  InstallationsStackParamList,
  "InstallationForm"
>;
type InstallationFormRouteProp = RouteProp<InstallationsStackParamList, "InstallationForm">;

interface Props {
  navigation: InstallationFormNavProp;
  route: InstallationFormRouteProp;
}

const INTERVENTION_TYPES: { value: InterventionType; label: string }[] = [
  { value: "intervento_tecnico", label: "Intervento Tecnico 24/7" },
  { value: "caldaia", label: "Caldaia" },
  { value: "scaldabagno", label: "Scaldabagno" },
  { value: "climatizzatore", label: "Climatizzatore" },
  { value: "elettrodomestico", label: "Elettrodomestico" },
  { value: "varie", label: "Varie" },
];

const DETAIL_TYPES: { value: DetailType; label: string }[] = [
  { value: "uscita_ore_comprese", label: "Uscita e ore comprese nel Servizio" },
  { value: "uscita_ore_pagamento", label: "Uscita e ore a pagamento" },
  { value: "pezzi_ricambio", label: "Pezzi di ricambio/materiali" },
  { value: "preventivo", label: "Preventivo" },
  { value: "riparazione", label: "Riparazione" },
  { value: "manutenzione", label: "Manutenzione" },
];

export default function InstallationFormScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { technician, addInstallation, updateInstallation, deleteInstallation } = useApp();

  const existingInstallation = route.params?.installation;

  const [clientName, setClientName] = useState(existingInstallation?.client.name || "");
  const [address, setAddress] = useState(existingInstallation?.client.address || "");
  const [civicNumber, setCivicNumber] = useState(existingInstallation?.client.civicNumber || "");
  const [cap, setCap] = useState(existingInstallation?.client.cap || "");
  const [city, setCity] = useState(existingInstallation?.client.city || "");
  const [phone, setPhone] = useState(existingInstallation?.client.phone || "");
  const [email, setEmail] = useState(existingInstallation?.client.email || "");

  const [interventionNumber, setInterventionNumber] = useState(
    existingInstallation?.interventionNumber || `ODL-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
  );
  const [interventionType, setInterventionType] = useState<InterventionType | null>(
    existingInstallation?.interventionType || null
  );
  const [detailTypes, setDetailTypes] = useState<DetailType[]>(
    existingInstallation?.detailTypes || []
  );
  const [extraHours, setExtraHours] = useState(String(existingInstallation?.extraHours || "0"));
  const [plantDetails, setPlantDetails] = useState(existingInstallation?.plantDetails || "");
  const [interventionDetails, setInterventionDetails] = useState(
    existingInstallation?.interventionDetails || ""
  );
  const [items, setItems] = useState<InstallationItem[]>(existingInstallation?.items || []);
  const [prescriptionOk, setPrescriptionOk] = useState(existingInstallation?.prescriptionOk ?? true);
  const [prescriptionReason, setPrescriptionReason] = useState(
    existingInstallation?.prescriptionReason || ""
  );
  const [observations, setObservations] = useState(existingInstallation?.observations || "");
  const [status, setStatus] = useState<InstallationStatus>(
    existingInstallation?.status || "programmata"
  );

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <Pressable onPress={() => navigation.goBack()}>
          <ThemedText type="body" style={{ color: theme.primary }}>
            Annulla
          </ThemedText>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable onPress={handleSave}>
          <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
            Salva
          </ThemedText>
        </Pressable>
      ),
    });
  }, [navigation, theme, clientName, address, city, status, items]);

  const toggleDetailType = (type: DetailType) => {
    setDetailTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: String(Date.now()), description: "", amount: 0 },
    ]);
  };

  const updateItem = (id: string, field: "description" | "amount", value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, [field]: field === "amount" ? parseFloat(value) || 0 : value }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = () => {
    if (!clientName.trim()) {
      Alert.alert("Errore", "Inserisci il nome del cliente");
      return;
    }
    if (!address.trim() || !city.trim()) {
      Alert.alert("Errore", "Inserisci l'indirizzo completo");
      return;
    }

    const installationData = {
      interventionNumber,
      date: existingInstallation?.date || Date.now(),
      client: {
        name: clientName.trim(),
        address: address.trim(),
        civicNumber: civicNumber.trim(),
        cap: cap.trim(),
        city: city.trim(),
        phone: phone.trim(),
        email: email.trim(),
      },
      technicianId: technician?.id || "",
      technicianName: technician?.name || "",
      companyName: technician?.companyName || "",
      interventionType,
      detailTypes,
      extraHours: parseInt(extraHours) || 0,
      plantDetails: plantDetails.trim(),
      interventionDetails: interventionDetails.trim(),
      items,
      totalAmount,
      prescriptionOk,
      prescriptionReason: prescriptionReason.trim(),
      observations: observations.trim(),
      photos: existingInstallation?.photos || [],
      status,
      createdAt: existingInstallation?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    if (existingInstallation) {
      updateInstallation(existingInstallation.id, installationData);
    } else {
      addInstallation({
        id: "",
        ...installationData,
      });
    }

    navigation.goBack();
  };

  const handleDelete = () => {
    if (!existingInstallation) return;

    Alert.alert("Elimina Installazione", "Sei sicuro di voler eliminare questo ordine di lavoro?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: () => {
          deleteInstallation(existingInstallation.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundSecondary, color: theme.text },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.statusRow}>
        {(["programmata", "in_corso", "completata"] as InstallationStatus[]).map((s) => (
          <Pressable
            key={s}
            style={[
              styles.statusButton,
              {
                backgroundColor:
                  status === s
                    ? (s === "completata"
                        ? theme.success
                        : s === "in_corso"
                        ? theme.primary
                        : theme.secondary) + "20"
                    : theme.backgroundSecondary,
                borderColor:
                  status === s
                    ? s === "completata"
                      ? theme.success
                      : s === "in_corso"
                      ? theme.primary
                      : theme.secondary
                    : "transparent",
                borderWidth: 2,
              },
            ]}
            onPress={() => setStatus(s)}
          >
            <ThemedText
              type="caption"
              style={{
                color:
                  status === s
                    ? s === "completata"
                      ? theme.success
                      : s === "in_corso"
                      ? theme.primary
                      : theme.secondary
                    : theme.textSecondary,
              }}
            >
              {s === "programmata" ? "Programmata" : s === "in_corso" ? "In corso" : "Completata"}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Ordine di Lavoro
        </ThemedText>
        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>
            Numero Intervento
          </ThemedText>
          <TextInput
            style={inputStyle}
            value={interventionNumber}
            onChangeText={setInterventionNumber}
            placeholder="ODL-2024-0001"
            placeholderTextColor={theme.textTertiary}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Dati Cliente
        </ThemedText>
        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>
            Nome e Cognome
          </ThemedText>
          <TextInput
            style={inputStyle}
            value={clientName}
            onChangeText={setClientName}
            placeholder="Nome cliente"
            placeholderTextColor={theme.textTertiary}
          />
        </View>
        <View style={styles.row}>
          <View style={[styles.field, { flex: 3 }]}>
            <ThemedText type="small" style={styles.label}>
              Indirizzo
            </ThemedText>
            <TextInput
              style={inputStyle}
              value={address}
              onChangeText={setAddress}
              placeholder="Via"
              placeholderTextColor={theme.textTertiary}
            />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <ThemedText type="small" style={styles.label}>
              N.
            </ThemedText>
            <TextInput
              style={inputStyle}
              value={civicNumber}
              onChangeText={setCivicNumber}
              placeholder="N."
              placeholderTextColor={theme.textTertiary}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <ThemedText type="small" style={styles.label}>
              CAP
            </ThemedText>
            <TextInput
              style={inputStyle}
              value={cap}
              onChangeText={setCap}
              placeholder="CAP"
              placeholderTextColor={theme.textTertiary}
              keyboardType="number-pad"
            />
          </View>
          <View style={[styles.field, { flex: 2 }]}>
            <ThemedText type="small" style={styles.label}>
              Comune
            </ThemedText>
            <TextInput
              style={inputStyle}
              value={city}
              onChangeText={setCity}
              placeholder="Citta"
              placeholderTextColor={theme.textTertiary}
            />
          </View>
        </View>
        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>
            Telefono
          </ThemedText>
          <TextInput
            style={inputStyle}
            value={phone}
            onChangeText={setPhone}
            placeholder="Telefono"
            placeholderTextColor={theme.textTertiary}
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>
            Email
          </ThemedText>
          <TextInput
            style={inputStyle}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={theme.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Tipologia di Intervento
        </ThemedText>
        <View style={styles.typeGrid}>
          {INTERVENTION_TYPES.map((type) => (
            <Pressable
              key={type.value}
              style={[
                styles.typeChip,
                {
                  backgroundColor:
                    interventionType === type.value
                      ? theme.primary + "20"
                      : theme.backgroundSecondary,
                  borderColor: interventionType === type.value ? theme.primary : "transparent",
                  borderWidth: 2,
                },
              ]}
              onPress={() =>
                setInterventionType(interventionType === type.value ? null : type.value)
              }
            >
              <ThemedText
                type="small"
                style={{ color: interventionType === type.value ? theme.primary : theme.text }}
              >
                {type.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Dettaglio Prestazione
        </ThemedText>
        <View style={styles.typeGrid}>
          {DETAIL_TYPES.map((type) => (
            <Pressable
              key={type.value}
              style={[
                styles.typeChip,
                {
                  backgroundColor: detailTypes.includes(type.value)
                    ? theme.primary + "20"
                    : theme.backgroundSecondary,
                  borderColor: detailTypes.includes(type.value) ? theme.primary : "transparent",
                  borderWidth: 2,
                },
              ]}
              onPress={() => toggleDetailType(type.value)}
            >
              <ThemedText
                type="small"
                style={{ color: detailTypes.includes(type.value) ? theme.primary : theme.text }}
              >
                {type.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Dettagli
        </ThemedText>
        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>
            Dettaglio Impianti
          </ThemedText>
          <TextInput
            style={[inputStyle, styles.textArea]}
            value={plantDetails}
            onChangeText={setPlantDetails}
            placeholder="Descrizione impianti..."
            placeholderTextColor={theme.textTertiary}
            multiline
            textAlignVertical="top"
          />
        </View>
        <View style={styles.field}>
          <ThemedText type="small" style={styles.label}>
            Dettaglio Intervento
          </ThemedText>
          <TextInput
            style={[inputStyle, styles.textArea]}
            value={interventionDetails}
            onChangeText={setInterventionDetails}
            placeholder="Descrizione intervento..."
            placeholderTextColor={theme.textTertiary}
            multiline
            textAlignVertical="top"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText type="h4">Elenco Interventi/Componenti</ThemedText>
          <Pressable
            style={[styles.addButton, { backgroundColor: theme.primary }]}
            onPress={addItem}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemInputs}>
              <TextInput
                style={[inputStyle, { flex: 2 }]}
                value={item.description}
                onChangeText={(text) => updateItem(item.id, "description", text)}
                placeholder="Descrizione"
                placeholderTextColor={theme.textTertiary}
              />
              <TextInput
                style={[inputStyle, { flex: 1 }]}
                value={item.amount > 0 ? String(item.amount) : ""}
                onChangeText={(text) => updateItem(item.id, "amount", text)}
                placeholder="EUR"
                placeholderTextColor={theme.textTertiary}
                keyboardType="decimal-pad"
              />
            </View>
            <Pressable onPress={() => removeItem(item.id)} style={styles.removeButton}>
              <Feather name="x" size={18} color={theme.danger} />
            </Pressable>
          </View>
        ))}
        <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
          <ThemedText type="h4">Totale IVA inclusa</ThemedText>
          <ThemedText type="h3" style={{ color: theme.primary }}>
            {formatCurrency(totalAmount)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Prescrizioni
        </ThemedText>
        <ThemedText type="small" style={{ marginBottom: Spacing.sm, color: theme.textSecondary }}>
          L'apparecchio/impianto puo funzionare in sicurezza?
        </ThemedText>
        <View style={styles.row}>
          <Pressable
            style={[
              styles.yesNoButton,
              {
                backgroundColor: prescriptionOk ? theme.success + "20" : theme.backgroundSecondary,
                borderColor: prescriptionOk ? theme.success : "transparent",
                borderWidth: 2,
              },
            ]}
            onPress={() => setPrescriptionOk(true)}
          >
            <ThemedText
              type="small"
              style={{ color: prescriptionOk ? theme.success : theme.text }}
            >
              SI
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.yesNoButton,
              {
                backgroundColor: !prescriptionOk ? theme.danger + "20" : theme.backgroundSecondary,
                borderColor: !prescriptionOk ? theme.danger : "transparent",
                borderWidth: 2,
              },
            ]}
            onPress={() => setPrescriptionOk(false)}
          >
            <ThemedText
              type="small"
              style={{ color: !prescriptionOk ? theme.danger : theme.text }}
            >
              NO
            </ThemedText>
          </Pressable>
        </View>
        {!prescriptionOk ? (
          <View style={[styles.field, { marginTop: Spacing.md }]}>
            <ThemedText type="small" style={styles.label}>
              Motivo
            </ThemedText>
            <TextInput
              style={inputStyle}
              value={prescriptionReason}
              onChangeText={setPrescriptionReason}
              placeholder="Motivo della prescrizione..."
              placeholderTextColor={theme.textTertiary}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={styles.sectionTitle}>
          Osservazioni
        </ThemedText>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={observations}
          onChangeText={setObservations}
          placeholder="Osservazioni e annotazioni..."
          placeholderTextColor={theme.textTertiary}
          multiline
          textAlignVertical="top"
        />
      </View>

      {existingInstallation ? (
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            { backgroundColor: theme.danger + "15", opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleDelete}
        >
          <Feather name="trash-2" size={18} color={theme.danger} />
          <ThemedText style={{ color: theme.danger, marginLeft: Spacing.sm }}>
            Elimina Ordine di Lavoro
          </ThemedText>
        </Pressable>
      ) : null}

      <View style={{ height: Spacing["3xl"] }} />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  statusRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statusButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  field: {
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  label: {
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  input: {
    height: Spacing.inputHeight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.body.fontSize,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.md,
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  itemInputs: {
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  removeButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
  },
  yesNoButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
});
