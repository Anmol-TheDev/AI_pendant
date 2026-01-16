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
import { Audio } from "expo-av";
import { Send, Mic, StopCircle, Bot, ArrowLeft } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { useColorScheme } from "nativewind";
import { api } from "@/src/services/api.service";
import { useUser } from "@clerk/clerk-expo";
import { useChat } from "@/src/hooks/useChat";
import { SOCKET_URL } from "@/src/constants";

// Unified message type
interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [input, setInput] = useState("");
  const [historyMessages, setHistoryMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useUser();

  // Socket.IO chat hook (for live chat)
  const {
    messages: socketMessages,
    isConnected,
    isTyping,
    streamingText,
    sendMessage,
    connect,
    disconnect,
  } = useChat();

  const isHistoryView = !!id;
  
  // Convert socket messages to unified format
  const liveMessages: ChatMessage[] = socketMessages.map(msg => ({
    id: msg.id,
    content: msg.content,
    role: msg.messageType === 'user' ? 'user' : 'assistant',
    timestamp: msg.createdAt,
  }));
  
  const messages = isHistoryView ? historyMessages : liveMessages;
  const isLoading = isHistoryView ? isLoadingHistory : false;

  // Initial Data Load
  useEffect(() => {
    if (!user?.id) return;

    if (isHistoryView) {
      // Historical View: Fetch via REST
      loadHistoryMessages();
    } else {
      // Live View: Connect Socket
      console.log('🔌 Connecting to Socket.IO:', SOCKET_URL);
      connect(SOCKET_URL);
    }

    return () => {
      if (!isHistoryView) {
        disconnect();
      }
    };
  }, [user?.id, id, isHistoryView, connect, disconnect]);

  const loadHistoryMessages = async () => {
    try {
      if (!id) return;
      const msgs = await api.getChatroomMessages(id);
      // Convert to unified format
      const chatMessages: ChatMessage[] = msgs.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role === 'system' ? 'assistant' : msg.role,
        timestamp: msg.timestamp,
      }));
      setHistoryMessages(chatMessages);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Audio Recording Cleanup
  useEffect(() => {
    return () => {
      if (recording) {
        stopRecording();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll on messages change
  useEffect(() => {
    if (messages.length > 0 || streamingText) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages, streamingText]);

  // Auto-scroll when keyboard opens
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === "granted") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
      }
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        const chunkNumber = Math.floor(Date.now() / 1000);
        await api.uploadAudioChunk(uri, chunkNumber, new Date().toISOString());
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
    }
  }

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
            {isHistoryView ? "History" : "AI Assistant"}
          </Text>
          {!isHistoryView && (
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
          )}
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
        >
          {isLoading ? (
            <ActivityIndicator className="mt-4" />
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
                      AI is typing...
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
        </ScrollView>

        {/* Input Area */}
        {!isHistoryView && (
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

              {input.length > 0 ? (
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!isConnected}
                  className={`w-12 h-12 rounded-full items-center justify-center ${isConnected ? "bg-blue-600" : "bg-gray-400"}`}
                >
                  <Send size={20} color="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPressIn={startRecording}
                  onPressOut={stopRecording}
                  disabled={!isConnected}
                  className={`w-12 h-12 rounded-full items-center justify-center ${isRecording ? "bg-red-500" : isConnected ? "bg-secondary" : "bg-gray-400"}`}
                >
                  {isRecording ? (
                    <StopCircle size={24} color="white" />
                  ) : (
                    <Mic size={24} color={iconColor} />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
