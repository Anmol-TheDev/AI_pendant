import React, { useEffect, useState, useCallback } from "react";
import { View, ActivityIndicator, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { ArrowLeft, Calendar, TrendingUp } from "lucide-react-native";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { api } from "@/src/services/api.service";
import { WeeklyTable } from "@/components/features/history/WeeklyTable";

export default function WeeklyHistoryScreen() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [weeklyHistory, setWeeklyHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWeekly = useCallback(async () => {
    if (!userId) return;
    try {
      // Generate last 4 weeks end dates (Sundays)
      const weeks = [];
      const today = new Date();
      // Adjust to last Sunday
      const lastSunday = new Date(
        today.setDate(today.getDate() - today.getDay())
      );

      for (let i = 0; i < 4; i++) {
        const date = new Date(lastSunday);
        date.setDate(lastSunday.getDate() - i * 7);
        weeks.push(date.toISOString().split("T")[0]);
      }

      const promises = weeks.map((date) =>
        api.getWeeklySummary(date)
      );
      const results = await Promise.all(promises);
      
      // Filter out nulls and map to expected format
      const validResults = results
        .filter((item) => item && item.summary)
        .map((item, index) => ({
          date: weeks[index],
          summary: item!.summary,
          sentiment: 'positive', // Default sentiment
          topTopics: item!.topTopics || [],
          trends: item!.trends || [],
          startDate: item!.startDate,
          endDate: item!.endDate,
        }));
      
      setWeeklyHistory(validResults);
    } catch (error) {
      console.error("Failed to fetch weekly history", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWeekly();
  }, [fetchWeekly]);

  useEffect(() => {
    if (isLoaded && userId) {
      fetchWeekly();
    }
  }, [isLoaded, userId, fetchWeekly]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border bg-background">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Icon as={ArrowLeft} className="size-6 text-foreground" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold">Weekly History</Text>
        </View>
      </View>

      {/* View Selector */}
      <View className="flex-row gap-3 p-4">
        <TouchableOpacity
          className="flex-1 bg-card border border-border rounded-xl p-4 active:opacity-70"
          onPress={() => router.back()}
        >
          <View className="flex-row items-center gap-2 mb-1">
            <Icon as={Calendar} className="size-5 text-foreground" />
            <Text className="text-foreground font-semibold">Daily View</Text>
          </View>
          <Text className="text-muted-foreground text-xs">Tap to switch</Text>
        </TouchableOpacity>

        <View className="flex-1 bg-primary rounded-xl p-4 shadow-sm">
          <View className="flex-row items-center gap-2 mb-1">
            <Icon as={TrendingUp} className="size-5 text-primary-foreground" />
            <Text className="text-primary-foreground font-semibold">
              Weekly View
            </Text>
          </View>
          <Text className="text-primary-foreground/80 text-xs">
            Currently viewing
          </Text>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <WeeklyTable
          data={weeklyHistory}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </SafeAreaView>
  );
}
