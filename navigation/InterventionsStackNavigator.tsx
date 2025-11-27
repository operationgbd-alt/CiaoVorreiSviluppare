import React from "react";
import { Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { useTheme } from "@/hooks/useTheme";
import InterventionsListScreen from "@/screens/InterventionsListScreen";
import InterventionDetailScreen from "@/screens/InterventionDetailScreen";
import { InterventionStatus } from "@/types";
import { Spacing } from "@/constants/theme";

export type InterventionsStackParamList = {
  InterventionsList: { filterStatus?: InterventionStatus } | undefined;
  InterventionDetail: { interventionId: string };
};

const Stack = createNativeStackNavigator<InterventionsStackParamList>();

function BackToDashboardButton() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();

  return (
    <Pressable
      onPress={() => navigation.navigate("DashboardTab")}
      style={{ padding: Spacing.xs }}
    >
      <Feather name="chevron-left" size={24} color={theme.text} />
    </Pressable>
  );
}

export default function InterventionsStackNavigator() {
  const { theme, isDark } = useTheme();
  const commonOptions = getCommonScreenOptions({ theme, isDark });

  return (
    <Stack.Navigator screenOptions={commonOptions}>
      <Stack.Screen
        name="InterventionsList"
        component={InterventionsListScreen}
        options={{
          title: "Interventi",
          headerLeft: () => <BackToDashboardButton />,
        }}
      />
      <Stack.Screen
        name="InterventionDetail"
        component={InterventionDetailScreen}
        options={{
          title: "Dettaglio",
        }}
      />
    </Stack.Navigator>
  );
}
