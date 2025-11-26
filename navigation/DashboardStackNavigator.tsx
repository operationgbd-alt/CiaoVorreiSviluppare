import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DashboardScreen from "@/screens/DashboardScreen";
import CalendarScreen from "@/screens/CalendarScreen";
import AppointmentFormScreen from "@/screens/AppointmentFormScreen";
import { CompanyInterventionsScreen } from "@/screens/CompanyInterventionsScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { Appointment } from "@/types";

export type DashboardStackParamList = {
  Dashboard: undefined;
  Calendar: undefined;
  AppointmentForm: { appointment?: Appointment; date?: number };
  CompanyInterventions: { companyId: string; companyName: string };
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
    </Stack.Navigator>
  );
}
