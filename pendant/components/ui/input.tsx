import * as React from "react";
import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/src/utils";
import { useColorScheme } from "nativewind";

const Input = React.forwardRef<
  React.ElementRef<typeof TextInput>,
  TextInputProps
>(({ className, placeholderTextColor, ...props }, ref) => {
  const { colorScheme } = useColorScheme();
  const placeholderColor = colorScheme === "dark" ? "#a1a1aa" : "#71717a"; // zinc-400 / zinc-500

  return (
    <TextInput
      ref={ref}
      className={cn(
        "h-12 w-full rounded-md border border-input bg-background px-3 text-base leading-[1.25] text-foreground",
        className
      )}
      placeholderTextColor={placeholderTextColor || placeholderColor}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
