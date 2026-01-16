import React from "react";
import { View, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { ChevronRight, MessageSquare, Hash } from "lucide-react-native";
import { useRouter } from "expo-router";
import { Chatroom } from "@/src/types";

interface DailyTableProps {
  data: Chatroom[];
  refreshing: boolean;
  onRefresh: () => void;
}

export function DailyTable({ data, refreshing, onRefresh }: DailyTableProps) {
  const router = useRouter();

  return (
    <View className="flex-1 px-4">
      {/* Table Header */}
      <View className="flex-row py-3 border-b border-border bg-muted/30 px-2 rounded-t-lg">
        <Text className="flex-[0.25] font-semibold text-muted-foreground text-xs">
          Date
        </Text>
        <Text className="flex-[0.55] font-semibold text-muted-foreground text-xs">
          Chat Info
        </Text>
        <Text className="flex-[0.2] font-semibold text-muted-foreground text-xs text-right">
          Details
        </Text>
      </View>

      {data.length === 0 ? (
        <View className="p-8 items-center">
          <Text className="text-muted-foreground">No daily records found.</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {data.map((item) => (
            <TouchableOpacity
              key={item.id}
              className="flex-row py-4 border-b border-border/50 items-center px-2 active:bg-muted/10"
              onPress={() =>
                router.push({ pathname: "/chat", params: { id: item.id } })
              }
            >
              <View className="flex-[0.25]">
                <Text className="font-medium text-sm">
                  {new Date(item.date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {new Date(item.date).toLocaleDateString(undefined, {
                    weekday: "short",
                  })}
                </Text>
              </View>
              
              <View className="flex-[0.55] pr-2 gap-1.5">
                {/* Chatroom Name */}
                <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                  {item.name}
                </Text>
                
                {/* Stats */}
                <View className="flex-row items-center gap-3">
                  <View className="flex-row items-center gap-1">
                    <Icon as={MessageSquare} className="size-3 text-primary" />
                    <Text className="text-xs text-muted-foreground">
                      {item.stats.totalMessages} msgs
                    </Text>
                  </View>
                  
                  {item.lastMessage && (
                    <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
                      Last: {new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  )}
                </View>
                
                {/* Last Message Preview */}
                {item.lastMessage && (
                  <Text className="text-xs text-muted-foreground italic" numberOfLines={1}>
                    "{item.lastMessage.content}"
                  </Text>
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
