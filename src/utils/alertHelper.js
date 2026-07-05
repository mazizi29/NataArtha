import { Alert, Platform } from 'react-native';

/**
 * Web-compatible confirmation dialog
 * Returns Promise<boolean>
 */
export const showConfirm = (title, message, confirmText = 'OK', cancelText = 'Cancel') => {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      const result = window.confirm(message || title);
      resolve(result);
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
    // Simple browser alert for now, could be upgraded to a toast library
    if (type === 'error') {
      console.error(message);
      window.alert('❌ ' + message);
    } else {
      console.log(message);
      window.alert('✓ ' + message);
    }
  } else {
    Alert.alert(type === 'error' ? 'Error' : 'Sukses', message);
  }
};
