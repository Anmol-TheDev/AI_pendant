import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { Text } from "@/components/ui/text";

export function RecorderButton() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const dotsAnim = useRef(new Animated.Value(0)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Create continuous pulsing animation for outer ring
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.6,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Create continuous glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );

    // Create faster staggered dots animation
    const dotsAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(dotsAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(dotsAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    // Create subtle breathing animation for the main circle
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1.1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    glowAnimation.start();
    dotsAnimation.start();
    breatheAnimation.start();

    return () => {
      pulseAnimation.stop();
      glowAnimation.stop();
      dotsAnimation.stop();
      breatheAnimation.stop();
    };
  }, [pulseAnim, glowAnim, dotsAnim, breatheAnim]);

  return (
    <View className="items-center gap-4 flex-row mx-4">
      
      {/* Main Recorder Circle */}
      <Animated.View
        style={{
          transform: [{ scale: breatheAnim }],
          shadowOpacity: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.2, 0.6],
          }),
          shadowRadius: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [4, 12],
          }),
        }}
        className="w-8 h-8 rounded-full items-center justify-center bg-primary border-2 border-primary/40 shadow-primary/50"
      >
        {/* 3 Pulse Dots inside the circle */}
        <View className="flex-row gap-1 items-center">
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={{
                opacity: dotsAnim.interpolate({
                  inputRange: [0, 0.33, 0.66, 1],
                  outputRange: index === 0 ? [0.4, 1, 0.4, 0.4] : 
                             index === 1 ? [0.4, 0.4, 1, 0.4] : 
                             [0.4, 0.4, 0.4, 1],
                }),
                transform: [{
                  scale: dotsAnim.interpolate({
                    inputRange: [0, 0.33, 0.66, 1],
                    outputRange: index === 0 ? [1, 1.5, 1, 1] : 
                               index === 1 ? [1, 1, 1.5, 1] : 
                               [1, 1, 1, 1.5],
                  })
                }]
              }}
              className="w-1 h-1 bg-primary-foreground rounded-full"
            />
          ))}
        </View>
      </Animated.View>

      {/* Status Text */}
      <View className="flex-1">
        <Text className="text-sm text-muted-foreground leading-5">
          Your AI companion is ready to capture your thoughts and conversations
        </Text>
      </View>
    </View>
  );
}