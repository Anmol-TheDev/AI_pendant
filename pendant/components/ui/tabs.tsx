import * as React from "react";
import { Text } from "@/components/ui/text";
import { cn } from "@/src/utils";
import * as TabsPrimitive from "@rn-primitives/tabs";
import { Platform } from "react-native";

function Tabs({
  className,
  ...props
}: TabsPrimitive.RootProps & React.RefAttributes<TabsPrimitive.RootRef>) {
  return (
    <TabsPrimitive.Root
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.ListProps & React.RefAttributes<TabsPrimitive.ListRef>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "flex-row p-2 bg-muted/20 rounded-xl",
        Platform.select({ web: "inline-flex w-fit", native: "w-full" }),
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  children,
  ...props
}: TabsPrimitive.TriggerProps & React.RefAttributes<TabsPrimitive.TriggerRef>) {
  const { value } = TabsPrimitive.useRootContext();
  const isSelected = value === props.value;

  return (
    <TabsPrimitive.Trigger
      className={cn(
        "flex-1 py-2 rounded-lg items-center justify-center",
        isSelected && "bg-background shadow-sm",
        props.disabled && "opacity-50",
        className
      )}
      {...props}
    >
      {typeof children === "function" ? (
        children
      ) : (
        <Text
          className={cn(
            "font-semibold text-sm",
            isSelected ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {children}
        </Text>
      )}
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({
  className,
  ...props
}: TabsPrimitive.ContentProps & React.RefAttributes<TabsPrimitive.ContentRef>) {
  return (
    <TabsPrimitive.Content
      className={cn("flex-1", Platform.select({ web: "outline-none" }), className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };


