import React, { Suspense, lazy } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/globalStyles';

const FallbackLoader = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

const withSuspense = (Component) => (props) => (
  <Suspense fallback={<FallbackLoader />}>
    <Component {...props} />
  </Suspense>
);

const LoginScreen = withSuspense(lazy(() => import('../screens/LoginScreen')));
const RegisterScreen = withSuspense(lazy(() => import('../screens/RegisterScreen')));
const DashboardScreen = withSuspense(lazy(() => import('../screens/DashboardScreen')));
const AddTransactionScreen = withSuspense(lazy(() => import('../screens/AddTransactionScreen')));
const TransactionHistoryScreen = withSuspense(lazy(() => import('../screens/TransactionHistoryScreen')));
  
const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const AppStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          shadowColor: 'transparent',
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.dark,
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 16,
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          title: 'Tambah Transaksi',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 15,
          },
          contentStyle: { backgroundColor: colors.background },
        }}
      />
      <Stack.Screen
        name="TransactionHistory"
        component={TransactionHistoryScreen}
        options={{
          title: 'Riwayat Transaksi',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 15,
          },
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { state } = useAuth();
  const { isLoading, isSignedIn } = state;

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      documentTitle={{
        formatter: (options, route) => {
          if (!route) return 'NataArtha | Kelola keuanganmu';
          const title = options?.title ?? route?.name;
          
          if (title === 'Dashboard') {
            return 'NataArtha | Kelola keuanganmu';
          } else if (title === 'Login') {
            return 'Masuk | NataArtha';
          } else if (title === 'Register') {
            return 'Daftar | NataArtha';
          }
          
          return `${title} | NataArtha`;
        },
      }}
    >
      {isSignedIn ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
