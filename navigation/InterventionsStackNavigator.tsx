import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { useTheme } from "@/hooks/useTheme";
import InterventionsListScreen from "@/screens/InterventionsListScreen";
import InterventionDetailScreen from "@/screens/InterventionDetailScreen";
import ScheduleAppointmentScreen from "@/screens/ScheduleAppointmentScreen";
import InterventionDocumentationScreen from "@/screens/InterventionDocumentationScreen";

export type InterventionsStackParamList = {
  InterventionsList: undefined;
  InterventionDetail: { interventionId: string };
  ScheduleAppointment: { interventionId: string };
  InterventionDocumentation: { interventionId: string };
};

const Stack = createNativeStackNavigator<InterventionsStackParamList>();

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
        }}
      />
      <Stack.Screen
        name="InterventionDetail"
        component={InterventionDetailScreen}
        options={{
          title: "Dettaglio",
        }}
      />
      <Stack.Screen
        name="ScheduleAppointment"
        component={ScheduleAppointmentScreen}
        options={{
          title: "Fissa Appuntamento",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="InterventionDocumentation"
        component={InterventionDocumentationScreen}
        options={{
          title: "Documentazione",
        }}
      />
    </Stack.Navigator>
  );
}
