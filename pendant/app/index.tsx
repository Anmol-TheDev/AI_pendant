import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { api, Summary } from "@/src/services/api.service";
import { DailySummaryCard } from "@/components/features/home/DailySummaryCard";
import { RecorderButton } from "@/components/features/home/RecorderButton";
import { WiFiStatus } from "@/components/features/home/WiFiStatus";
import {
  MessageSquarePlus,
  History,
  Settings,
} from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { useFocusEffect } from "expo-router";

export default function HomeScreen() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!userId) return;
    try {
      // Use today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];
      const data = await api.getDailySummary(today);
      setSummary(data);
    } catch (error) {
      console.error("Failed to fetch summary", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  // Fetch when screen comes into focus or user signs in
  useFocusEffect(
    useCallback(() => {
      if (isLoaded && userId) {
        setLoading(true);
        fetchSummary();
      }
    }, [isLoaded, userId, fetchSummary])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSummary();
  }, [fetchSummary]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (!isLoaded || !userId) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-background">
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with WiFi Status */}
        <View className="gap-4">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-2xl font-bold text-foreground">
                {getGreeting()}
              </Text>
              <Text className="text-muted-foreground">
                Ready to capture your day?
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              className="p-2 bg-secondary/30 rounded-full"
            >
              <Icon as={Settings} className="size-6 text-foreground" />
            </TouchableOpacity>
          </View>
          
          {/* WiFi Status */}
          <WiFiStatus />
        </View>

        {/* Main Recorder Section */}
        <View className="items-center py-8 bg-card/30 rounded-2xl border border-border/50">
          <RecorderButton />
        </View>

        {/* Daily Summary */}
        <View className="gap-4">
          <Text className="text-xl font-semibold">Today's Insights</Text>
          <DailySummaryCard
            summary={summary}
            loading={loading && !refreshing}
          />
        </View>

        {/* Quick Actions */}
        <View className="gap-4">
          <Text className="text-xl font-semibold">Quick Actions</Text>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-primary rounded-xl gap-4 shadow-sm active:opacity-90"
            onPress={() => router.push("/chat")}
          >
            <View className="p-3 bg-primary-foreground/20 rounded-full">
              <Icon
                as={MessageSquarePlus}
                className="size-6 text-primary-foreground"
              />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-primary-foreground">
                Start New Chat
              </Text>
              <Text className="text-sm text-primary-foreground/80">
                Record a conversation or note
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-card border border-border rounded-xl gap-4 active:opacity-90"
            onPress={() => router.push("/history")}
          >
            <View className="p-3 bg-secondary rounded-full">
              <Icon as={History} className="size-6 text-secondary-foreground" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">
                View History
              </Text>
              <Text className="text-sm text-muted-foreground">
                Check past conversations
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
