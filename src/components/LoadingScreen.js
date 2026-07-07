import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Text, Image, StyleSheet, Platform } from 'react-native';
import { colors, fontSizes } from '../styles/globalStyles';

const LoadingScreen = ({ message = 'Memuat...' }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.5,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ])
    ).start();
  }, [pulseAnim, opacityAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }], opacity: opacityAnim }}>
        <Image 
          source={require('../../assets/Asset 2.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
      </Animated.View>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 24,
  },
  text: {
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : 'System',
    fontWeight: '600',
    fontSize: fontSizes.base,
    color: colors.primary,
    opacity: 0.8,
  }
});

export default LoadingScreen;
