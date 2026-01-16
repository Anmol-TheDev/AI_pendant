import React, { useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-expo";
import { api, ContextItem } from "@/src/services/api.service";
import { Search as SearchIcon, ArrowLeft } from "lucide-react-native";
import { Icon } from "@/components/ui/icon";
import { useRouter } from "expo-router";

export default function SearchScreen() {
  const { userId } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContextItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || !userId) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await api.semanticSearch(query);
      setResults(data);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ContextItem }) => (
    <View className="bg-card border border-border rounded-xl p-4 mb-3 gap-2">
      <Text className="text-base text-foreground leading-6">{item.text}</Text>
      <View className="flex-row justify-between items-center">
        <Text className="text-xs text-muted-foreground">
          {new Date(item.timestamp).toLocaleString()}
        </Text>
        <View className="bg-secondary px-2 py-1 rounded">
          <Text className="text-xs text-secondary-foreground">
            Relevance: {(item.relevance * 100).toFixed(0)}%
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="p-4 border-b border-border flex-row items-center gap-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Icon as={ArrowLeft} className="size-6 text-foreground" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Search Memories</Text>
      </View>

      <View className="p-4 gap-4">
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input
              placeholder="Search for something you said..."
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
          </View>
          <Button size="icon" onPress={handleSearch} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Icon
                as={SearchIcon}
                className="size-4 text-primary-foreground"
              />
            )}
          </Button>
        </View>
      </View>

      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ListEmptyComponent={
          hasSearched && !loading ? (
            <View className="mt-8 items-center">
              <Text className="text-muted-foreground">No matches found</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
