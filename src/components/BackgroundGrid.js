import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { colors } from '../styles/globalStyles';

const BackgroundGrid = ({ opacity = 0.72 }) => {
  return <View pointerEvents="none" style={[styles.gridLayer, { opacity }]} />;
};

const styles = StyleSheet.create({
  gridLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    ...Platform.select({
      web: {
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px), radial-gradient(circle at 50% 8%, rgba(201,168,76,0.10), transparent 28%)',
        backgroundSize: '64px 64px, 64px 64px, 100% 100%',
      },
      default: {},
    }),
  },
});

export default BackgroundGrid;
