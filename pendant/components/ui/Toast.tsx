import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, Animated, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast as toastEmitter } from "@/src/utils/toast";
import { Icon } from "./icon";
import { AlertCircle, CheckCircle, Info } from "lucide-react-native";

const TOAST_DURATION = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [activeToast, setActiveToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return toastEmitter.subscribe((event) => {
      showToast(event.message, event.type);
    });
  }, []);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info") => {
      if (timerRef.current) clearTimeout(timerRef.current);

      setActiveToast({ message, type });

      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(TOAST_DURATION),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setActiveToast(null);
      });
    },
    [fadeAnim]
  );

  const getIcon = () => {
    if (!activeToast) return null;
    switch (activeToast.type) {
      case "success":
        return <Icon as={CheckCircle} className="text-green-500 size-5" />;
      case "error":
        return <Icon as={AlertCircle} className="text-destructive size-5" />;
      default:
        return <Icon as={Info} className="text-blue-500 size-5" />;
    }
  };

  const getBorderColor = () => {
    if (!activeToast) return "border-border";
    switch (activeToast.type) {
      case "success":
        return "border-green-500/50";
      case "error":
        return "border-destructive/50";
      default:
        return "border-blue-500/50";
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      {activeToast && (
        <View
          className="absolute top-0 left-0 right-0 items-center z-50 pointer-events-none"
          style={{
            paddingTop: Platform.OS === "ios" ? 60 : 40,
          }}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            }}
            className={`flex-row items-center bg-card border ${getBorderColor()} px-4 py-3 rounded-full shadow-lg gap-3 mx-4 max-w-[90%]`}
          >
            {getIcon()}
            <Text className="text-foreground font-medium text-sm">
              {activeToast.message}
            </Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}
