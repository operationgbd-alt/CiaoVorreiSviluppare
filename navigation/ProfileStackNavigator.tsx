import React from "react";
import { Pressable } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation, useNavigationState } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import ProfileScreen from "@/screens/ProfileScreen";
import { ManageCompaniesScreen } from "@/screens/ManageCompaniesScreen";
import { ManageUsersScreen } from "@/screens/ManageUsersScreen";
import { CreateInterventionScreen } from "@/screens/CreateInterventionScreen";
import { CompanyAccountScreen } from "@/screens/CompanyAccountScreen";
import { CloseInterventionsScreen } from "@/screens/CloseInterventionsScreen";
import { ManageTechniciansScreen } from "@/screens/ManageTechniciansScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { Spacing } from "@/constants/theme";

function BackButton() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const routes = useNavigationState((state) => state.routes);
  const stackIndex = useNavigationState((state) => state.index);

  const handleBack = () => {
    if (stackIndex > 0 && routes[stackIndex - 1]?.name !== routes[stackIndex]?.name) {
      navigation.goBack();
    } else {
      const parent = navigation.getParent();
      if (parent?.canGoBack()) {
        parent.goBack();
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Profile' }],
        });
      }
    }
  };

  return (
    <Pressable onPress={handleBack} style={{ padding: Spacing.xs }}>
      <Feather name="chevron-left" size={24} color={theme.text} />
    </Pressable>
  );
}

export type ProfileStackParamList = {
  Profile: undefined;
  ManageCompanies: undefined;
  ManageUsers: undefined;
  CreateIntervention: undefined;
  CompanyAccount: undefined;
  CloseInterventions: undefined;
  ManageTechnicians: undefined;
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
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="ManageUsers"
        component={ManageUsersScreen}
        options={{
          title: "Gestione Utenti",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="CreateIntervention"
        component={CreateInterventionScreen}
        options={{
          title: "Nuovo Intervento",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="CompanyAccount"
        component={CompanyAccountScreen}
        options={{
          title: "Account Ditta",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="CloseInterventions"
        component={CloseInterventionsScreen}
        options={{
          title: "Chiudi Interventi",
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="ManageTechnicians"
        component={ManageTechniciansScreen}
        options={{
          title: "Gestione Tecnici",
          headerLeft: () => <BackButton />,
        }}
      />
    </Stack.Navigator>
  );
}
