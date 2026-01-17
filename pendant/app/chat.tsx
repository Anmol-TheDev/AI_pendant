import React, { useState, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Send, Bot, ArrowLeft } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useColorScheme } from "nativewind";
import { api } from "@/src/services/api.service";
import { useUser } from "@clerk/clerk-expo";
import { useChat } from "@/src/hooks/useChat";
import { SOCKET_URL } from "@/src/constants";

// Unified message type
interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: string;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatroomId = Array.isArray(id) ? id[0] : id;
  const [input, setInput] = useState("");

  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useUser();

  // Socket.IO chat hook (for live chat)
  const {
    messages: socketMessages,
    chatroom,
    isConnected,
    isTyping,
    streamingText,
    sendMessage,
    connect,
    disconnect,
  } = useChat();

  const isHistoryView = !!chatroomId;

  // Convert socket messages to unified format
  const messages: ChatMessage[] = socketMessages.map((msg) => ({
    id: msg.id,
    content: msg.content,
    role: msg.messageType === "user" ? "user" : "assistant",
    timestamp: msg.createdAt,
  }));

  const isLoading = !isConnected && messages.length === 0;

  // Initial Data Load
  useEffect(() => {
    if (!user?.id) return;

    // Disconnect any existing connection first
    disconnect();

    console.log("🔌 Connecting to Socket.IO:", SOCKET_URL);
    if (chatroomId) {
      console.log("📜 Joining specific chatroom:", chatroomId);
      connect(SOCKET_URL, { query: { chatroomId } });
    } else {
      console.log("👋 Joining daily chatroom");
      connect(SOCKET_URL);
    }

    return () => {
      disconnect();
    };
  }, [user?.id, chatroomId, connect, disconnect]);

  useEffect(() => {
    if (!isLoading || isConnected) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isLoading, isConnected]);

  // Auto-scroll when keyboard opens
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;

    if (isConnected) {
      sendMessage(input, user?.fullName || "User");
      setInput("");
    } else {
      console.warn("Socket not connected");
    }
  };

  const iconColor = colorScheme === "dark" ? "#FFFFFF" : "#000000";
  const placeholderColor = colorScheme === "dark" ? "#9CA3AF" : "#6B7280";

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={iconColor} />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="font-semibold text-lg">
            {isHistoryView ? chatroom?.name || "History" : "AI Assistant"}
          </Text>
          {
            <>
              <View className="flex-row items-center gap-1 mt-0.5">
                <View
                  className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                />
                <Text className="text-xs text-muted-foreground">
                  {isConnected ? "Connected" : "Disconnected"}
                </Text>
              </View>
            </>
          }
        </View>
        <View className="w-6 h-6" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        className="flex-1"
        enabled
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 20, paddingBottom: 10 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {isLoading ? (
            <View className="mt-4 px-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  className={`flex-row mb-6 ${
                    i % 2 === 0 ? "justify-end" : "justify-start"
                  }`}
                >
                  {i % 2 !== 0 && (
                    <Skeleton className="w-8 h-8 rounded-full mr-2 mt-1" />
                  )}
                  <Skeleton
                    className={`w-[70%] h-20 rounded-2xl ${
                      i % 2 === 0 ? "rounded-tr-sm" : "rounded-tl-sm"
                    }`}
                  />
                </View>
              ))}
            </View>
          ) : (
            <>
              {/* Chatroom Info Card (History View Only) */}
              {isHistoryView && chatroom && (
                <View className="mb-6 bg-card border border-border rounded-xl p-4">
                  <Text className="text-lg font-semibold text-foreground mb-2">
                    {chatroom.name}
                  </Text>

                  <View className="flex-row items-center gap-4 mb-2">
                    <View className="flex-row items-center gap-1">
                      <Text className="text-xs text-muted-foreground">
                        Messages:
                      </Text>
                      <Text className="text-xs font-semibold text-foreground">
                        {chatroom.stats?.totalMessages || 0}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-1">
                      <Text className="text-xs text-muted-foreground">
                        Date:
                      </Text>
                      <Text className="text-xs font-semibold text-foreground">
                        {new Date(chatroom.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-2 pt-2 border-t border-border">
                    <Text className="text-[10px] text-muted-foreground font-mono">
                      ID: {chatroom.id}
                    </Text>
                  </View>
                </View>
              )}

              {messages.length === 0 && isHistoryView ? (
                <View className="flex-1 justify-center items-center mt-20">
                  <Bot size={48} color="#9CA3AF" />
                  <Text className="text-muted-foreground mt-4 text-center font-semibold">
                    No messages available
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-2 text-center px-8">
                    Start chatting to add to this day's history!
                  </Text>
                  {chatroom && (
                    <Text className="text-xs text-primary mt-4">
                      {chatroom.stats?.totalMessages || 0} messages recorded
                    </Text>
                  )}
                </View>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <View
                      key={msg.id || index}
                      className={`flex-row mb-6 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "assistant" && (
                        <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center mr-2 mt-1">
                          <Bot size={16} color="white" />
                        </View>
                      )}

                      <View
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-blue-600 rounded-tr-sm"
                            : "bg-secondary rounded-tl-sm"
                        }`}
                      >
                        <Text
                          className={`text-base leading-6 ${msg.role === "user" ? "text-white" : "text-foreground"}`}
                        >
                          {msg.content}
                        </Text>
                        <Text
                          className={`text-[10px] mt-1 ${msg.role === "user" ? "text-blue-200" : "text-muted-foreground"}`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                    </View>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && !streamingText && (
                    <View className="flex-row mb-6 justify-start">
                      <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center mr-2 mt-1">
                        <Bot size={16} color="white" />
                      </View>
                      <View className="rounded-2xl px-4 py-3 bg-secondary rounded-tl-sm">
                        <Text className="text-muted-foreground text-sm">
                          ...
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Streaming Response Bubble */}
                  {streamingText && (
                    <View className="flex-row mb-6 justify-start">
                      <View className="w-8 h-8 rounded-full bg-green-500 items-center justify-center mr-2 mt-1">
                        <Bot size={16} color="white" />
                      </View>
                      <View className="max-w-[80%] rounded-2xl px-4 py-3 bg-secondary rounded-tl-sm">
                        <Text className="text-base leading-6 text-foreground">
                          {streamingText}
                          <Text className="text-primary"> ●</Text>
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </>
          )}
        </ScrollView>

        {/* Input Area */}
        <View className="border-t border-border bg-background p-4">
          <View className="flex-row items-end gap-2">
            <View className="flex-1 bg-secondary rounded-3xl flex-row items-center px-4 min-h-[50px]">
              <Input
                className="flex-1 border-0 bg-transparent h-full text-base"
                placeholder="Message AI..."
                placeholderTextColor={placeholderColor}
                value={input}
                onChangeText={setInput}
                multiline
                editable={isConnected}
              />
            </View>

            <TouchableOpacity
              onPress={handleSend}
              disabled={!isConnected || !input.trim()}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                isConnected && input.trim() ? "bg-blue-600" : "bg-gray-400"
              }`}
            >
              <Send size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
