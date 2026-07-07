import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, useWindowDimensions } from 'react-native';
import AppIcon from './AppIcon';
import { colors, spacing, borderRadius, fontSizes } from '../styles/globalStyles';

export const globalAlertRef = React.createRef();

const GlobalAlert = forwardRef((props, ref) => {
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'confirm', // 'confirm' | 'toast-success' | 'toast-error'
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
  });

  const [fadeAnim] = useState(new Animated.Value(0));
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useImperativeHandle(ref, () => ({
    showConfirm: (title, message, confirmText, cancelText, resolve) => {
      setAlertState({
        visible: true,
        title,
        message,
        type: 'confirm',
        confirmText,
        cancelText,
        onConfirm: resolve,
      });
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    showToast: (message, type) => {
      setAlertState({
        visible: true,
        title: type === 'error' ? 'Error' : 'Sukses',
        message,
        type: type === 'error' ? 'toast-error' : 'toast-success',
        onConfirm: null,
      });
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Auto hide toast after 3 seconds
      setTimeout(() => {
        closeAlert();
      }, 3000);
    },
  }));

  const closeAlert = (result = false) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (alertState.onConfirm) {
        alertState.onConfirm(result);
      }
      setAlertState((prev) => ({ ...prev, visible: false }));
    });
  };

  if (!alertState.visible) return null;

  const isToast = alertState.type.startsWith('toast');
  const isError = alertState.type === 'toast-error';

  if (isToast) {
    return (
      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', zIndex: 9999, elevation: 9999 }]} pointerEvents="box-none">
        <Animated.View style={[styles.toastContainer, isMobile && styles.toastMobile, { opacity: fadeAnim }]}>
          <View style={[styles.toastIcon, { backgroundColor: isError ? colors.dangerSoft : colors.successSoft }]}>
            <AppIcon name={isError ? "close" : "dashboard"} size={16} color={isError ? colors.danger : colors.success} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>{alertState.title}</Text>
            <Text style={styles.toastMessage}>{alertState.message}</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay, { zIndex: 9999, elevation: 9999 }]}>
      <Animated.View style={[styles.modalContent, { opacity: fadeAnim }]}>
        <View style={styles.modalIcon}>
          <AppIcon name="dashboard" size={24} color={colors.primary} />
        </View>
        <Text style={styles.modalTitle}>{alertState.title}</Text>
        <Text style={styles.modalText}>{alertState.message}</Text>
        
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.modalCancelButton}
            onPress={() => closeAlert(false)}
          >
            <Text style={styles.modalCancelText}>{alertState.cancelText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalConfirmButton}
            onPress={() => closeAlert(true)}
          >
            <Text style={styles.modalConfirmText}>{alertState.confirmText}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.24)' },
      default: { shadowColor: colors.black, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.24, shadowRadius: 16 },
    }),
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  modalText: {
    fontSize: fontSizes.sm,
    color: colors.mediumGray,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
  modalConfirmButton: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: fontSizes.sm,
  },
  
  toastContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 350,
    minWidth: 250,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)' },
      default: { shadowColor: colors.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
    }),
  },
  toastMobile: {
    right: spacing.md,
    left: spacing.md,
    bottom: spacing.xl + 60,
    maxWidth: '100%',
  },
  toastIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.white,
  },
  toastMessage: {
    fontSize: fontSizes.xs,
    color: colors.mediumGray,
    marginTop: 2,
  },
});

export default GlobalAlert;
