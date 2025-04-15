import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import { TouchableOpacity, View, TextInput } from 'react-native';

interface ChatTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSendPress: () => void;
  placeholder?: string;
}

const ChatTextInput = ({
  value,
  onChangeText,
  onSendPress,
  placeholder = 'Reply',
}: ChatTextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const canSend = value.trim() !== '';

  return (
    <View className={` flex-row items-end justify-between gap-4 p-4`}>
      <TextInput
        className=" max-h-28 min-h-10 w-4/5 flex-grow rounded-3xl bg-slate-100 px-3 py-2 color-slate-700"
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9a9a9a"
        multiline
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        underlineColorAndroid="transparent"
      />
      <TouchableOpacity
        className=" aspect-square h-9 w-10 items-center justify-center p-2  "
        onPress={onSendPress}
        disabled={!canSend}>
        <FontAwesome name="send" size={20} color={canSend ? '#007AFF' : '#b0b0b0'} />
      </TouchableOpacity>
    </View>
  );
};

export default ChatTextInput;
