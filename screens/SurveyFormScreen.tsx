import React, { useState, useLayoutEffect } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, ScrollView } from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { PhotoPicker } from "@/components/PhotoPicker";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/store/AppContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import { SurveysStackParamList } from "@/navigation/SurveysStackNavigator";
import { ProductSize, SurveyStatus, YesNoValue, ChecklistItem, Photo } from "@/types";

type SurveyFormNavProp = NativeStackNavigationProp<SurveysStackParamList, "SurveyForm">;
type SurveyFormRouteProp = RouteProp<SurveysStackParamList, "SurveyForm">;

interface Props {
  navigation: SurveyFormNavProp;
  route: SurveyFormRouteProp;
}

const PRODUCT_SIZES: ProductSize[] = [
  "SMALL", "MEDIUM", "LARGE", "XLARGE", "8kW", "10kW", "15kW", "20kW", "Altro"
];

const CHECKLIST_A1 = [
  { id: "A1.1", label: "Assente materiale contenente amianto?" },
  { id: "A1.2", label: "Possibile installazione nel rispetto vincoli urbanistici?" },
  { id: "A1.3", label: "Struttura portante del tetto consente installazione?" },
  { id: "A1.4", label: "Impianto installabile su unica falda? (SMALL/MEDIUM)" },
  { id: "A1.5", label: "Distanza uscita stringhe < 40m totali?" },
  { id: "A1.6", label: "Impianto e contatore trifase?" },
  { id: "A1.11", label: "Presente impianto di messa a terra?" },
];

const CHECKLIST_A2 = [
  { id: "A2.1", label: "Area inverter/storage idonea (chiuso, 6m2, aerato)?" },
  { id: "A2.2", label: "Superficie in grado di reggere il peso (130-160kg)?" },
  { id: "A2.3", label: "Possibile posizionare sensore CT a valle contatore?" },
  { id: "A2.4", label: "Presente copertura WiFi?" },
];

export default function SurveyFormScreen({ navigation, route }: Props) {
  const { theme, isDark } = useTheme();
  const { technician, addSurvey, updateSurvey, deleteSurvey } = useApp();

  const existingSurvey = route.params?.survey;

  const [clientName, setClientName] = useState(existingSurvey?.client.name || "");
  const [address, setAddress] = useState(existingSurvey?.client.address || "");
  const [civicNumber, setCivicNumber] = useState(existingSurvey?.client.civicNumber || "");
  const [cap, setCap] = useState(existingSurvey?.client.cap || "");
  const [city, setCity] = useState(existingSurvey?.client.city || "");
  const [phone, setPhone] = useState(existingSurvey?.client.phone || "");
  const [email, setEmail] = useState(existingSurvey?.client.email || "");
  const [productSize, setProductSize] = useState<ProductSize | null>(
    existingSurvey?.productSize || null
  );
  const [status, setStatus] = useState<SurveyStatus>(existingSurvey?.status || "da_completare");
  const [notes, setNotes] = useState(existingSurvey?.notes || "");

  const [checklistA1, setChecklistA1] = useState<Record<string, ChecklistItem>>(
    existingSurvey?.checklistA1 || {}
  );
  const [checklistA2, setChecklistA2] = useState<Record<string, ChecklistItem>>(
    existingSurvey?.checklistA2 || {}
  );
  const [photos, setPhotos] = useState<Photo[]>(existingSurvey?.photos || []);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    cliente: true,
    prodotto: false,
    a1: false,
    a2: false,
  });

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
  }, [navigation, theme, clientName, address, city, productSize, status, notes, checklistA1, checklistA2]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateChecklistItem = (
    checklist: "A1" | "A2",
    id: string,
    value: YesNoValue,
    notesText?: string
  ) => {
    const setter = checklist === "A1" ? setChecklistA1 : setChecklistA2;
    setter((prev) => ({
      ...prev,
      [id]: {
        id,
        value: notesText !== undefined ? prev[id]?.value || null : value,
        notes: notesText !== undefined ? notesText : prev[id]?.notes || "",
      },
    }));
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

    const surveyData = {
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
      productSize,
      status,
      checklistA1,
      checklistA2,
      checklistB: {},
      photos,
      notes: notes.trim(),
      createdAt: existingSurvey?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    if (existingSurvey) {
      updateSurvey(existingSurvey.id, surveyData);
    } else {
      addSurvey({
        id: "",
        ...surveyData,
      });
    }

    navigation.goBack();
  };

  const handleDelete = () => {
    if (!existingSurvey) return;

    Alert.alert("Elimina Sopralluogo", "Sei sicuro di voler eliminare questo sopralluogo?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Elimina",
        style: "destructive",
        onPress: () => {
          deleteSurvey(existingSurvey.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundSecondary, color: theme.text },
  ];

  const renderSection = (
    title: string,
    key: string,
    content: React.ReactNode
  ) => (
    <View style={styles.section}>
      <Pressable
        style={styles.sectionHeader}
        onPress={() => toggleSection(key)}
      >
        <ThemedText type="h4">{title}</ThemedText>
        <Feather
          name={expandedSections[key] ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.textSecondary}
        />
      </Pressable>
      {expandedSections[key] && (
        <View style={styles.sectionContent}>{content}</View>
      )}
    </View>
  );

  const renderYesNoItem = (
    checklist: "A1" | "A2",
    id: string,
    label: string,
    items: Record<string, ChecklistItem>
  ) => (
    <View key={id} style={styles.checklistItem}>
      <ThemedText type="small" style={styles.checklistLabel}>
        {id}: {label}
      </ThemedText>
      <View style={styles.yesNoRow}>
        <Pressable
          style={[
            styles.yesNoButton,
            {
              backgroundColor:
                items[id]?.value === "SI" ? theme.success + "20" : theme.backgroundSecondary,
              borderColor: items[id]?.value === "SI" ? theme.success : "transparent",
              borderWidth: 2,
            },
          ]}
          onPress={() => updateChecklistItem(checklist, id, "SI")}
        >
          <ThemedText
            type="small"
            style={{ color: items[id]?.value === "SI" ? theme.success : theme.text }}
          >
            SI
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.yesNoButton,
            {
              backgroundColor:
                items[id]?.value === "NO" ? theme.danger + "20" : theme.backgroundSecondary,
              borderColor: items[id]?.value === "NO" ? theme.danger : "transparent",
              borderWidth: 2,
            },
          ]}
          onPress={() => updateChecklistItem(checklist, id, "NO")}
        >
          <ThemedText
            type="small"
            style={{ color: items[id]?.value === "NO" ? theme.danger : theme.text }}
          >
            NO
          </ThemedText>
        </Pressable>
      </View>
      <TextInput
        style={[styles.notesInput, { backgroundColor: theme.backgroundSecondary, color: theme.text }]}
        value={items[id]?.notes || ""}
        onChangeText={(text) => updateChecklistItem(checklist, id, null, text)}
        placeholder="Note..."
        placeholderTextColor={theme.textTertiary}
      />
    </View>
  );

  return (
    <ScreenKeyboardAwareScrollView>
      <View style={styles.statusRow}>
        <Pressable
          style={[
            styles.statusButton,
            {
              backgroundColor:
                status === "da_completare" ? theme.secondary + "20" : theme.backgroundSecondary,
              borderColor: status === "da_completare" ? theme.secondary : "transparent",
              borderWidth: 2,
            },
          ]}
          onPress={() => setStatus("da_completare")}
        >
          <Feather
            name="clock"
            size={16}
            color={status === "da_completare" ? theme.secondary : theme.textSecondary}
          />
          <ThemedText
            type="small"
            style={{
              color: status === "da_completare" ? theme.secondary : theme.textSecondary,
              marginLeft: Spacing.xs,
            }}
          >
            Da completare
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.statusButton,
            {
              backgroundColor:
                status === "completato" ? theme.success + "20" : theme.backgroundSecondary,
              borderColor: status === "completato" ? theme.success : "transparent",
              borderWidth: 2,
            },
          ]}
          onPress={() => setStatus("completato")}
        >
          <Feather
            name="check-circle"
            size={16}
            color={status === "completato" ? theme.success : theme.textSecondary}
          />
          <ThemedText
            type="small"
            style={{
              color: status === "completato" ? theme.success : theme.textSecondary,
              marginLeft: Spacing.xs,
            }}
          >
            Completato
          </ThemedText>
        </Pressable>
      </View>

      {renderSection(
        "Dati Cliente",
        "cliente",
        <>
          <View style={styles.field}>
            <ThemedText type="small" style={styles.label}>Nome / Ragione Sociale</ThemedText>
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
              <ThemedText type="small" style={styles.label}>Via</ThemedText>
              <TextInput
                style={inputStyle}
                value={address}
                onChangeText={setAddress}
                placeholder="Indirizzo"
                placeholderTextColor={theme.textTertiary}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <ThemedText type="small" style={styles.label}>N.</ThemedText>
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
              <ThemedText type="small" style={styles.label}>CAP</ThemedText>
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
              <ThemedText type="small" style={styles.label}>Comune</ThemedText>
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
            <ThemedText type="small" style={styles.label}>Telefono</ThemedText>
            <TextInput
              style={inputStyle}
              value={phone}
              onChangeText={setPhone}
              placeholder="Numero di telefono"
              placeholderTextColor={theme.textTertiary}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.field}>
            <ThemedText type="small" style={styles.label}>Email</ThemedText>
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
        </>
      )}

      {renderSection(
        "Prodotto",
        "prodotto",
        <View style={styles.productGrid}>
          {PRODUCT_SIZES.map((size) => (
            <Pressable
              key={size}
              style={[
                styles.productChip,
                {
                  backgroundColor:
                    productSize === size ? theme.primary + "20" : theme.backgroundSecondary,
                  borderColor: productSize === size ? theme.primary : "transparent",
                  borderWidth: 2,
                },
              ]}
              onPress={() => setProductSize(productSize === size ? null : size)}
            >
              <ThemedText
                type="small"
                style={{ color: productSize === size ? theme.primary : theme.text }}
              >
                {size}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}

      {renderSection(
        "A1 - Verifica Installabilita",
        "a1",
        <>
          {CHECKLIST_A1.map((item) =>
            renderYesNoItem("A1", item.id, item.label, checklistA1)
          )}
        </>
      )}

      {renderSection(
        "A2 - Verifica SunStorage",
        "a2",
        <>
          {CHECKLIST_A2.map((item) =>
            renderYesNoItem("A2", item.id, item.label, checklistA2)
          )}
        </>
      )}

      <View style={styles.section}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
          Note
        </ThemedText>
        <TextInput
          style={[inputStyle, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Note aggiuntive..."
          placeholderTextColor={theme.textTertiary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
          Foto
        </ThemedText>
        <PhotoPicker photos={photos} onPhotosChange={setPhotos} maxPhotos={10} />
      </View>

      {existingSurvey ? (
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            { backgroundColor: theme.danger + "15", opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={handleDelete}
        >
          <Feather name="trash-2" size={18} color={theme.danger} />
          <ThemedText style={{ color: theme.danger, marginLeft: Spacing.sm }}>
            Elimina Sopralluogo
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
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statusButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  sectionContent: {
    paddingTop: Spacing.sm,
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
    height: 100,
    paddingTop: Spacing.md,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  productChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  checklistItem: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(128,128,128,0.1)",
  },
  checklistLabel: {
    marginBottom: Spacing.sm,
  },
  yesNoRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  yesNoButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
  },
  notesInput: {
    height: 36,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
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
