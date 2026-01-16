import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import * as Network from "expo-network";
import {
  checkNetworkConnectivity,
  getNetworkDetails,
  isConnectedToWiFi,
} from "../utils/permissions";

interface NetworkContextType {
  isConnected: boolean;
  isWiFi: boolean;
  isInternetReachable: boolean | null;
  ipAddress: string | null;
  networkType: string;
  refreshNetworkState: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isWiFi, setIsWiFi] = useState(false);
  const [isInternetReachable, setIsInternetReachable] = useState<
    boolean | null
  >(null);
  const [ipAddress, setIpAddress] = useState<string | null>(null);
  const [networkType, setNetworkType] = useState("UNKNOWN");

  const refreshNetworkState = async () => {
    const details = await getNetworkDetails();
    const wifiStatus = await isConnectedToWiFi();

    if (details) {
      setIsConnected(details.isConnected ?? false);
      setIsInternetReachable(details.isInternetReachable ?? null);
      setIpAddress(details.ipAddress);
      setNetworkType(details.type ?? "UNKNOWN");
    }

    setIsWiFi(wifiStatus);
  };

  useEffect(() => {
    // Initial load
    refreshNetworkState();

    // Poll for network changes every 10 seconds
    const interval = setInterval(refreshNetworkState, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NetworkContext.Provider
      value={{
        isConnected,
        isWiFi,
        isInternetReachable,
        ipAddress,
        networkType,
        refreshNetworkState,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}
