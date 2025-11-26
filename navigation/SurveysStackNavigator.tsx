import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SurveysListScreen from "@/screens/SurveysListScreen";
import SurveyFormScreen from "@/screens/SurveyFormScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import { Survey } from "@/types";

export type SurveysStackParamList = {
  SurveysList: undefined;
  SurveyForm: { survey?: Survey };
};

const Stack = createNativeStackNavigator<SurveysStackParamList>();

export default function SurveysStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark }),
      }}
    >
      <Stack.Screen
        name="SurveysList"
        component={SurveysListScreen}
        options={{ headerTitle: "Sopralluoghi" }}
      />
      <Stack.Screen
        name="SurveyForm"
        component={SurveyFormScreen}
        options={({ route }) => ({
          headerTitle: route.params?.survey ? "Modifica Sopralluogo" : "Nuovo Sopralluogo",
          presentation: "modal",
        })}
      />
    </Stack.Navigator>
  );
}
