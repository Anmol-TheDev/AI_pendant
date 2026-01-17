import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Wifi, WifiOff, Signal } from "lucide-react-native";
import * as Network from "expo-network";

interface WiFiStatusProps {
  className?: string;
}

export function WiFiStatus({ className }: WiFiStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [networkState, setNetworkState] = useState<Network.NetworkState | null>(null);

  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        setNetworkState(state);
        setIsConnected(state.isConnected);
      } catch (error) {
        console.error("Error checking network status:", error);
        setIsConnected(false);
      }
    };

    // Check initial status
    checkNetworkStatus();

    // Set up interval to check network status periodically
    const interval = setInterval(checkNetworkStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (isConnected === null) return "text-muted-foreground";
    return isConnected ? "text-green-500" : "text-red-500";
  };

  const getStatusText = () => {
    if (isConnected === null) return "Checking...";
    if (!isConnected) return "Disconnected";
    
    if (networkState) {
      switch (networkState.type) {
        case Network.NetworkStateType.WIFI:
          return "WiFi Connected";
        case Network.NetworkStateType.CELLULAR:
          return "Mobile Data";
        case Network.NetworkStateType.ETHERNET:
          return "Ethernet";
        case Network.NetworkStateType.OTHER:
          return "Connected";
        default:
          return "Connected";
      }
    }
    
    return "Connected";
  };

  const getIcon = () => {
    if (isConnected === null) return Signal;
    if (!isConnected) return WifiOff;
    
    if (networkState?.type === Network.NetworkStateType.WIFI) {
      return Wifi;
    }
    
    return Signal;
  };

  return (
    <View className={`flex-row items-center gap-3 p-3 bg-card/50 rounded-lg border border-border/30 ${className}`}>
      <View className={`p-2 rounded-full ${
        isConnected === null ? 'bg-muted' : 
        isConnected ? 'bg-green-500/20' : 'bg-red-500/20'
      }`}>
        <Icon
          as={getIcon()}
          className={`size-4 ${getStatusColor()}`}
        />
      </View>
      
      <View className="flex-1">
        <Text className="text-sm font-medium text-foreground">
          Network Status
        </Text>
        <Text className={`text-xs ${getStatusColor()}`}>
          {getStatusText()}
        </Text>
      </View>
      
      {/* Connection indicator dot */}
      <View className={`w-2 h-2 rounded-full ${
        isConnected === null ? 'bg-muted-foreground' :
        isConnected ? 'bg-green-500' : 'bg-red-500'
      }`} />
    </View>
  );
}