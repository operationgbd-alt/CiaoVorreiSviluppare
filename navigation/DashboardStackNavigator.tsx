import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "@/screens/DashboardScreen";
import CalendarScreen from "@/screens/CalendarScreen";
import AppointmentFormScreen from "@/screens/AppointmentFormScreen";
import { CompanyInterventionsScreen } from "@/screens/CompanyInterventionsScreen";
import { CreateInterventionScreen } from "@/screens/CreateInterventionScreen";
import { BulkAssignScreen } from "@/screens/BulkAssignScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { Appointment } from "@/types";

export type DashboardStackParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  AppointmentForm: { appointment?: Appointment; date?: number };
  CompanyInterventions: { companyId: string; companyName: string };
  CreateIntervention: undefined;
  BulkAssign: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerTitle: () => <HeaderTitle title="SolarTech" />,
        }}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ headerTitle: "Calendario" }}
      />
      <Stack.Screen
        name="AppointmentForm"
        component={AppointmentFormScreen}
        options={({ route }) => ({
          headerTitle: route.params?.appointment ? "Modifica Appuntamento" : "Nuovo Appuntamento",
          presentation: "modal",
        })}
      />
      <Stack.Screen
        name="CompanyInterventions"
        component={CompanyInterventionsScreen}
        options={({ route }) => ({
          headerTitle: route.params.companyName,
        })}
      />
      <Stack.Screen
        name="CreateIntervention"
        component={CreateInterventionScreen}
        options={{
          headerTitle: "Nuovo Intervento",
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="BulkAssign"
        component={BulkAssignScreen}
        options={{
          headerTitle: "Assegna Interventi",
          presentation: "modal",
        }}
      />
    </Stack.Navigator>
  );
}
