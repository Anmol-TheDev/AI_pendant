import * as React from "react";
import { Animated, View, type ViewProps } from "react-native";
import { cn } from "@/src/utils";

function Skeleton({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof View>) {
  const fadeAnim = React.useRef(new Animated.Value(0.5)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim]);

  return (
    <Animated.View
      className={cn("rounded-md bg-muted", className)}
      style={[{ opacity: fadeAnim }]}
      {...props}
    />
  );
}

export { Skeleton };
