import { Alert, Platform } from 'react-native';
import { globalAlertRef } from '../components/GlobalAlert';

/**
 * Web-compatible confirmation dialog
 * Returns Promise<boolean>
 */
export const showConfirm = (title, message, confirmText = 'OK', cancelText = 'Batal') => {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      if (globalAlertRef.current) {
        globalAlertRef.current.showConfirm(title, message, confirmText, cancelText, resolve);
      } else {
        const result = window.confirm(message || title);
        resolve(result);
      }
    } else {
      Alert.alert(title, message, [
        { text: cancelText, onPress: () => resolve(false), style: 'cancel' },
        { text: confirmText, onPress: () => resolve(true), style: 'default' },
      ]);
    }
  });
};

/**
 * Web-compatible success/error notification
 */
export const showToast = (message, type = 'success') => {
  if (Platform.OS === 'web') {
    if (globalAlertRef.current) {
      globalAlertRef.current.showToast(message, type);
    } else {
      if (type === 'error') {
        console.error(message);
        window.alert('❌ ' + message);
      } else {
        console.log(message);
        window.alert('✓ ' + message);
      }
    }
  } else {
    Alert.alert(type === 'error' ? 'Error' : 'Sukses', message);
  }
};
