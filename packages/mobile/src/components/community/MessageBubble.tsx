import React from 'react';
import { View, Text } from 'react-native';
import { Message } from '../../types';
import { Avatar } from '../ui/Avatar';
import { formatTime } from '../../utils/formatting';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderName?: string;
  senderAvatar?: string;
}

export function MessageBubble({
  message,
  isOwnMessage,
  senderName,
  senderAvatar,
}: MessageBubbleProps) {
  return (
    <View
      className={`flex-row mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
    >
      {!isOwnMessage && (
        <View className="mr-2 self-end">
          <Avatar uri={senderAvatar} name={senderName} size="sm" />
        </View>
      )}
      <View className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {!isOwnMessage && senderName && (
          <Text className="text-xs text-gray-500 mb-1 ml-1">{senderName}</Text>
        )}
        <View
          className={`rounded-2xl px-4 py-2.5 ${
            isOwnMessage
              ? 'bg-primary-600 rounded-tr-sm'
              : 'bg-gray-100 rounded-tl-sm'
          }`}
        >
          <Text
            className={`text-sm ${
              isOwnMessage ? 'text-white' : 'text-gray-900'
            }`}
          >
            {message.content}
          </Text>
        </View>
        <Text className="text-xs text-gray-400 mt-1 mx-1">
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}
