import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ProfileScreen from "@/screens/ProfileScreen";
import { ManageCompaniesScreen } from "@/screens/ManageCompaniesScreen";
import { ManageUsersScreen } from "@/screens/ManageUsersScreen";
import { CreateInterventionScreen } from "@/screens/CreateInterventionScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type ProfileStackParamList = {
  Profile: undefined;
  ManageCompanies: undefined;
  ManageUsers: undefined;
  CreateIntervention: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator screenOptions={getCommonScreenOptions({ theme, isDark })}>
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profilo",
        }}
      />
      <Stack.Screen
        name="ManageCompanies"
        component={ManageCompaniesScreen}
        options={{
          title: "Gestione Ditte",
        }}
      />
      <Stack.Screen
        name="ManageUsers"
        component={ManageUsersScreen}
        options={{
          title: "Gestione Utenti",
        }}
      />
      <Stack.Screen
        name="CreateIntervention"
        component={CreateInterventionScreen}
        options={{
          title: "Nuovo Intervento",
        }}
      />
    </Stack.Navigator>
  );
}
