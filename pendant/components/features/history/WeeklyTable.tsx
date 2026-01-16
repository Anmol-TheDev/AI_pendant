import React from "react";
import { View, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { ChevronRight } from "lucide-react-native";
import { toast } from "@/src/utils/toast";

interface WeeklySummary {
  date: string;
  summary: string;
  sentiment?: string;
  topTopics?: string[];
}

interface WeeklyTableProps {
  data: WeeklySummary[];
  refreshing: boolean;
  onRefresh: () => void;
}

export function WeeklyTable({ data, refreshing, onRefresh }: WeeklyTableProps) {
  return (
    <View className="flex-1 px-4">
      {/* Table Header */}
      <View className="flex-row py-3 border-b border-border bg-muted/30 px-2 rounded-t-lg">
        <Text className="flex-[0.3] font-semibold text-muted-foreground text-xs">
          Week Ending
        </Text>
        <Text className="flex-[0.5] font-semibold text-muted-foreground text-xs">
          Insights
        </Text>
        <Text className="flex-[0.2] font-semibold text-muted-foreground text-xs text-right">
          Details
        </Text>
      </View>

      {data.length === 0 ? (
        <View className="p-8 items-center">
          <Text className="text-muted-foreground">
            No weekly records generated yet.
          </Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {data.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="flex-row py-4 border-b border-border/50 items-center px-2 active:bg-muted/10"
              onPress={() => toast.show("Weekly details coming soon")}
            >
              <View className="flex-[0.3]">
                <Text className="font-medium text-sm">
                  {new Date(item.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                {item.sentiment && (
                  <View className="mt-1 bg-primary/10 self-start px-2 py-0.5 rounded">
                    <Text className="text-[10px] text-primary">
                      {item.sentiment}
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-[0.5] gap-2 pr-2">
                <Text className="text-sm text-foreground font-medium">
                  {item.summary}
                </Text>
                {item.topTopics && (
                  <View className="flex-row flex-wrap gap-1">
                    {item.topTopics.map((t: string, i: number) => (
                      <Text
                        key={i}
                        className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded"
                      >
                        #{t}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
              <View className="flex-[0.2] items-end">
                <Icon
                  as={ChevronRight}
                  className="size-4 text-muted-foreground"
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
