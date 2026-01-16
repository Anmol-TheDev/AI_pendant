import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Summary } from "@/lib/api";
import { SmileIcon } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";

interface DailySummaryCardProps {
  summary: Summary | null;
  loading?: boolean;
}

export function DailySummaryCard({ summary, loading }: DailySummaryCardProps) {
  if (loading) {
    return (
      <View className="bg-card border border-border rounded-xl p-4 gap-4">
        <Text className="text-muted-foreground text-center">
          Loading summary...
        </Text>
      </View>
    );
  }

  if (!summary) {
    return (
      <View className="bg-card border border-border rounded-xl p-4 gap-4">
        <Text className="text-muted-foreground text-center">
          No summary available for today
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-card border border-border rounded-xl p-4 gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold">Daily Digest</Text>
        <View className="flex-row gap-2">
          <View className="px-2 py-1 bg-primary/10 rounded-md flex-row items-center gap-1">
            <Icon as={SmileIcon} className="size-3 text-primary" />
            <Text className="text-xs text-primary font-medium">
              {summary.sentiment || "Neutral"}
            </Text>
          </View>
        </View>
      </View>

      <Text className="text-base text-foreground leading-6">
        {summary.summary}
      </Text>

      {summary.highlights && summary.highlights.length > 0 && (
        <View className="mt-2 gap-1">
          {summary.highlights.map((highlight, i) => (
            <View key={i} className="flex-row gap-2">
              <Text className="text-primary">•</Text>
              <Text className="text-sm text-muted-foreground flex-1">
                {highlight}
              </Text>
            </View>
          ))}
        </View>
      )}

      {summary.topTopics && summary.topTopics.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-3">
          {summary.topTopics.map((topic, i) => (
            <View key={i} className="px-2 py-1 bg-secondary rounded-md">
              <Text className="text-xs text-secondary-foreground">
                #{topic}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
