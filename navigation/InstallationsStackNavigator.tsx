import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import InstallationsListScreen from "@/screens/InstallationsListScreen";
import InstallationFormScreen from "@/screens/InstallationFormScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { Installation } from "@/types";

export type InstallationsStackParamList = {
  InstallationsList: undefined;
  InstallationForm: { installation?: Installation };
};

const Stack = createNativeStackNavigator<InstallationsStackParamList>();

export default function InstallationsStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="InstallationsList"
        component={InstallationsListScreen}
        options={{ headerTitle: "Installazioni" }}
      />
      <Stack.Screen
        name="InstallationForm"
        component={InstallationFormScreen}
        options={({ route }) => ({
          headerTitle: route.params?.installation ? "Modifica ODL" : "Nuovo ODL",
          presentation: "modal",
        })}
      />
    </Stack.Navigator>
  );
}
