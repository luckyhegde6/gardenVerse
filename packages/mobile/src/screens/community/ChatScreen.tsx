import React, { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { MessageBubble } from "@components/community/MessageBubble";
import { useAuthStore } from "@stores/authStore";
import { Message } from "@/types";

export function ChatScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const user = useAuthStore((s) => s.user);
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hey everyone! How are your gardens doing?",
      senderId: "user2",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      groupId,
    },
    {
      id: "2",
      content: "Great! My tomatoes are finally sprouting 🌱",
      senderId: "user1",
      createdAt: new Date(Date.now() - 3500000).toISOString(),
      groupId,
    },
    {
      id: "3",
      content: "Anyone have tips for dealing with aphids?",
      senderId: "user3",
      createdAt: new Date(Date.now() - 3400000).toISOString(),
      groupId,
    },
    {
      id: "4",
      content: "Try neem oil spray! Works wonders ✨",
      senderId: "user1",
      createdAt: new Date(Date.now() - 3300000).toISOString(),
      groupId,
    },
    {
      id: "5",
      content: "Thanks for the tip! Will try it today",
      senderId: "user3",
      createdAt: new Date(Date.now() - 3200000).toISOString(),
      groupId,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping] = useState(false);

  const handleSend = () => {
    if (!inputText.trim() || !user) return;
    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputText.trim(),
      senderId: user.id,
      groupId,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-gray-50"
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        className="flex-1 px-4"
        data={messages}
        keyExtractor={(item: Message) => item.id}
        renderItem={({ item }: { item: Message }) => (
          <MessageBubble
            message={item}
            isOwnMessage={item.senderId === user?.id}
            senderName={
              item.senderId === "user1"
                ? "You"
                : `User_${item.senderId.slice(-4)}`
            }
          />
        )}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 12 }}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View className="px-4 pb-2">
          <Text className="text-xs text-gray-400 italic">
            Someone is typing...
          </Text>
        </View>
      )}

      {/* Input Bar */}
      <View className="flex-row items-center px-4 py-3 bg-white border-t border-gray-200">
        <TouchableOpacity className="mr-2">
          <Text className="text-2xl text-gray-400">📷</Text>
        </TouchableOpacity>
        <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
          <TextInput
            className="text-base text-gray-900 max-h-20"
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
        </View>
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim()}
          className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${
            inputText.trim() ? "bg-primary-600" : "bg-gray-200"
          }`}
        >
          <Text className="text-white text-lg">↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
