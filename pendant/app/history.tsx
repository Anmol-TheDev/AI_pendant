import React, { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { ArrowLeft, Calendar, TrendingUp } from "lucide-react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { api, Chatroom } from "@/src/services/api.service";
import { DailyTable } from "@/components/features/history/DailyTable";

export default function HistoryScreen() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [dailyHistory, setDailyHistory] = useState<Chatroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDaily = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api.getUserChatrooms();
      setDailyHistory(data);
    } catch (error) {
      console.error("Failed to fetch daily history", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDaily();
  }, [fetchDaily]);

  useEffect(() => {
    if (isLoaded && userId) {
      fetchDaily();
    }
  }, [isLoaded, userId, fetchDaily]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border bg-background">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Icon as={ArrowLeft} className="size-6 text-foreground" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold">Daily History</Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              className="mb-4 p-4 border border-border rounded-xl bg-card"
            >
              <View className="flex-row justify-between mb-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </View>
              <Skeleton className="h-16 w-full rounded-md" />
            </View>
          ))}
        </View>
      ) : (
        <DailyTable
          data={dailyHistory}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </SafeAreaView>
  );
}
