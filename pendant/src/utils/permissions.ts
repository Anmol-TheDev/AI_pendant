import * as Network from 'expo-network';
import { Platform, Alert, Linking } from 'react-native';

/**
 * Check if the device has network connectivity
 */
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return networkState.isConnected ?? false;
  } catch (error) {
    console.error('Failed to check network connectivity:', error);
    return false;
  }
}

/**
 * Get detailed network information
 */
export async function getNetworkDetails() {
  try {
    const networkState = await Network.getNetworkStateAsync();
    const ipAddress = await Network.getIpAddressAsync();

    return {
      isConnected: networkState.isConnected,
      isInternetReachable: networkState.isInternetReachable,
      type: networkState.type, // NetworkStateType: WIFI, CELLULAR, etc.
      ipAddress,
    };
  } catch (error) {
    console.error('Failed to get network details:', error);
    return null;
  }
}

/**
 * Check if connected to WiFi specifically
 */
export async function isConnectedToWiFi(): Promise<boolean> {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return (
      networkState.isConnected === true &&
      networkState.type === Network.NetworkStateType.WIFI
    );
  } catch (error) {
    console.error('Failed to check WiFi connection:', error);
    return false;
  }
}

/**
 * Request network permissions with user-friendly prompts
 */
export async function requestNetworkPermissions(): Promise<boolean> {
  try {
    // Check current network state
    const isConnected = await checkNetworkConnectivity();

    if (!isConnected) {
      Alert.alert(
        'No Network Connection',
        'This app requires a WiFi connection to sync data with your pendant. Please connect to WiFi and try again.',
        [
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to request network permissions:', error);
    return false;
  }
}

/**
 * Show WiFi connection prompt to user
 */
export function promptForWiFiConnection(
  onConnect?: () => void,
  onCancel?: () => void
) {
  Alert.alert(
    'WiFi Connection Required',
    'Please connect to the same WiFi network as your pendant device to enable data sync.',
    [
      {
        text: 'Open WiFi Settings',
        onPress: () => {
          Linking.openSettings();
          onConnect?.();
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
    ]
  );
}

/**
 * Monitor network state changes
 */
export async function monitorNetworkStateChanges(
  callback: (isConnected: boolean, type: string) => void
) {
  // Poll network state every 5 seconds
  const interval = setInterval(async () => {
    const networkState = await Network.getNetworkStateAsync();
    callback(
      networkState.isConnected ?? false,
      networkState.type ?? 'UNKNOWN'
    );
  }, 5000);

  return () => clearInterval(interval);
}
