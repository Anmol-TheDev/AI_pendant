import React, { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { ArrowLeft, Calendar, TrendingUp } from "lucide-react-native";
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

      {/* View Selector */}
      <View className="flex-row gap-3 p-4">
        <View className="flex-1 bg-primary rounded-xl p-4 shadow-sm">
          <View className="flex-row items-center gap-2 mb-1">
            <Icon as={Calendar} className="size-5 text-primary-foreground" />
            <Text className="text-primary-foreground font-semibold">
              Daily View
            </Text>
          </View>
          <Text className="text-primary-foreground/80 text-xs">
            Currently viewing
          </Text>
        </View>

        <TouchableOpacity
          className="flex-1 bg-card border border-border rounded-xl p-4 active:opacity-70"
          onPress={() => router.push("/weekly-history")}
        >
          <View className="flex-row items-center gap-2 mb-1">
            <Icon as={TrendingUp} className="size-5 text-foreground" />
            <Text className="text-foreground font-semibold">Weekly View</Text>
          </View>
          <Text className="text-muted-foreground text-xs">Tap to switch</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
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
