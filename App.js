import 'react-native-gesture-handler';

import React from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { useFonts, DMSans_400Regular, DMSans_400Regular_Italic, DMSans_500Medium, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import GlobalAlert, { globalAlertRef } from './src/components/GlobalAlert';
import { colors } from './src/styles/globalStyles';

export default function App() {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_400Regular_Italic,
    DMSans_500Medium,
    DMSans_700Bold,
  });

  if (!Text.defaultProps) {
    Text.defaultProps = {};
  }

  if (!TextInput.defaultProps) {
    TextInput.defaultProps = {};
  }

  Text.defaultProps.style = [{ fontFamily: 'DMSans_400Regular' }, Text.defaultProps.style];
  TextInput.defaultProps.style = [{ fontFamily: 'DMSans_400Regular' }, TextInput.defaultProps.style];

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
      <GlobalAlert ref={globalAlertRef} />
    </View>
  );
}
