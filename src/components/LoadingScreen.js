import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet, Platform, Text } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fontSizes } from '../styles/globalStyles';

const BLUE = "#3B9AE1";
const GOLD = colors.primary; // Menggunakan warna utama NataArtha agar serasi

const useTileAnimation = (delay) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.loop(
        Animated.timing(anim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, [anim, delay]);

  return {
    opacity: anim.interpolate({ inputRange: [0, 0.22, 0.68, 0.84, 1], outputRange: [0, 1, 1, 0, 0] }),
    scale: anim.interpolate({ inputRange: [0, 0.22, 0.68, 0.84, 1], outputRange: [0.68, 1, 1, 0.68, 0.68] }),
    tlTrans: anim.interpolate({ inputRange: [0, 0.22, 0.68, 0.84, 1], outputRange: [-32, 0, 0, -32, -32] }),
    trTransX: anim.interpolate({ inputRange: [0, 0.22, 0.68, 0.84, 1], outputRange: [32, 0, 0, 32, 32] }),
    trTransY: anim.interpolate({ inputRange: [0, 0.22, 0.68, 0.84, 1], outputRange: [-32, 0, 0, -32, -32] }),
    blTransX: anim.interpolate({ inputRange: [0, 0.22, 0.68, 0.84, 1], outputRange: [-32, 0, 0, -32, -32] }),
    blTransY: anim.interpolate({ inputRange: [0, 0.22, 0.68, 0.84, 1], outputRange: [32, 0, 0, 32, 32] }),
    brTrans: anim.interpolate({ inputRange: [0, 0.22, 0.68, 0.84, 1], outputRange: [32, 0, 0, 32, 32] }),
  };
};

const useLinearAnimation = (delay) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.loop(
        Animated.timing(anim, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })
      ).start();
    }, delay);
    return () => clearTimeout(timeout);
  }, [anim, delay]);
  return anim;
};

const LoadingScreen = ({ message }) => {
  const tl = useTileAnimation(0);
  const tr = useTileAnimation(100);
  const bl = useTileAnimation(200);
  const br = useTileAnimation(300);
  
  const timer = useLinearAnimation(0);
  
  const d1 = useLinearAnimation(1100);
  const d2 = useLinearAnimation(1250);
  const d3 = useLinearAnimation(1400);

  const shimmerX = timer.interpolate({
    inputRange: [0, 0.24, 0.3, 0.46, 1],
    outputRange: [0, 0, 92.7, 340, 340]
  });
  const shimmerOp = timer.interpolate({
    inputRange: [0, 0.24, 0.3, 0.46, 1],
    outputRange: [0, 0, 1, 0, 0]
  });

  const glowOp = timer.interpolate({
    inputRange: [0, 0.18, 0.28, 0.65, 0.8, 1],
    outputRange: [0, 0, 1, 1, 0, 0]
  });

  const getDotStyle = (dotTimer) => ({
    opacity: dotTimer.interpolate({ inputRange: [0, 0.22, 0.40, 0.56, 0.75, 1], outputRange: [0.25, 0.25, 1, 0.55, 0.25, 0.25] }),
    transform: [{
      translateY: dotTimer.interpolate({ inputRange: [0, 0.22, 0.40, 0.56, 0.75, 1], outputRange: [0, 0, -5, 0, 0, 0] })
    }]
  });

  return (
    <View style={styles.container}>
      {/* GLOW EFFECT */}
      <Animated.View style={[styles.glow, { opacity: glowOp }]}>
        <Svg width="256" height="256">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor={BLUE} stopOpacity="0.18" />
              <Stop offset="45%" stopColor={GOLD} stopOpacity="0.10" />
              <Stop offset="70%" stopColor={BLUE} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="256" height="256" fill="url(#glow)" />
        </Svg>
      </Animated.View>

      {/* MAIN LOGO */}
      <View style={styles.logoWrapper}>
        <View style={styles.logoInner}>
          
          <Animated.View style={[styles.tile, { left: 0, top: 0, width: 116, height: 80, opacity: tl.opacity, transform: [{translateX: tl.tlTrans}, {translateY: tl.tlTrans}, {scale: tl.scale}] }]}>
            <Svg width="116" height="80" viewBox="0 0 116 80">
              <Rect x="0" y="0" width="116" height="80" rx="13" fill={BLUE} />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.tile, { left: 134, top: 7, width: 66, height: 66, opacity: tr.opacity, transform: [{translateX: tr.trTransX}, {translateY: tr.trTransY}, {scale: tr.scale}] }]}>
            <Svg width="66" height="66" viewBox="134 7 66 66">
              <Rect x="158" y="7" width="18" height="66" rx="7" fill={GOLD} />
              <Rect x="134" y="31" width="66" height="18" rx="7" fill={GOLD} />
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.tile, { left: 0, top: 92, width: 116, height: 108, opacity: bl.opacity, transform: [{translateX: bl.blTransX}, {translateY: bl.blTransY}, {scale: bl.scale}] }]}>
            <Svg width="116" height="108" viewBox="0 92 116 108">
              <Rect x="0" y="92" width="116" height="108" rx="13" fill={GOLD} />
              <SvgText x="58" y="164" textAnchor="middle" fontSize="66" fill="white" fontWeight="800" fontFamily={Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : 'System'}>
                $
              </SvgText>
            </Svg>
          </Animated.View>

          <Animated.View style={[styles.tile, { left: 128, top: 92, width: 72, height: 108, opacity: br.opacity, transform: [{translateX: br.brTrans}, {translateY: br.brTrans}, {scale: br.scale}] }]}>
            <Svg width="72" height="108" viewBox="128 92 72 108">
              <Rect x="128" y="92" width="72" height="108" rx="13" fill={BLUE} />
            </Svg>
          </Animated.View>

          {/* SHIMMER EFFECT */}
          <Animated.View style={[styles.shimmer, { opacity: shimmerOp, transform: [{translateX: shimmerX}] }]}>
            <Svg width="90" height="200">
              <Defs>
                <LinearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="white" stopOpacity="0" />
                  <Stop offset="0.4" stopColor="white" stopOpacity="0.4" />
                  <Stop offset="0.6" stopColor="white" stopOpacity="0.4" />
                  <Stop offset="1" stopColor="white" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width="90" height="200" fill="url(#shimmer)" />
            </Svg>
          </Animated.View>
        </View>
      </View>

      {/* TEXT & DOTS */}
      {message && (
        <View style={styles.textContainer}>
          <Text style={styles.text}>{message}</Text>
          <View style={styles.dots}>
            <Animated.View style={[styles.dot, { backgroundColor: BLUE }, getDotStyle(d1)]} />
            <Animated.View style={[styles.dot, { backgroundColor: GOLD }, getDotStyle(d2)]} />
            <Animated.View style={[styles.dot, { backgroundColor: BLUE }, getDotStyle(d3)]} />
          </View>
        </View>
      )}
      {!message && (
        <View style={[styles.dots, { marginTop: 24 }]}>
          <Animated.View style={[styles.dot, { backgroundColor: BLUE }, getDotStyle(d1)]} />
          <Animated.View style={[styles.dot, { backgroundColor: GOLD }, getDotStyle(d2)]} />
          <Animated.View style={[styles.dot, { backgroundColor: BLUE }, getDotStyle(d3)]} />
        </View>
      )}
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
  glow: {
    position: 'absolute',
    width: 256,
    height: 256,
  },
  logoWrapper: {
    width: 168,
    height: 168,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInner: {
    width: 200,
    height: 200,
    transform: [{ scale: 0.84 }],
    borderRadius: 4,
    overflow: 'hidden',
  },
  tile: {
    position: 'absolute',
  },
  shimmer: {
    position: 'absolute',
    left: -70,
    top: 0,
    width: 90,
    height: 200,
  },
  textContainer: {
    marginTop: 44,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontFamily: Platform.OS === 'web' ? 'system-ui, -apple-system, sans-serif' : 'System',
    fontWeight: '600',
    fontSize: fontSizes.base,
    color: colors.primary,
    opacity: 0.8,
  },
  dots: {
    flexDirection: 'row',
    gap: 9,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  }
});

export default LoadingScreen;
