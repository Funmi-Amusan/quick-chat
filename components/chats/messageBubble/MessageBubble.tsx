import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  UIManager,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated from 'react-native-reanimated';

import { reactToMessage } from '~/lib/firebase-sevice';
import { formatTimestamp } from '~/lib/helpers';
import { ReplyMessageInfo } from '~/lib/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🥳', '😍', '🥶', '🤯'];

const MessageBubble = ({
  content,
  isFromSelf,
  timestamp,
  read = false,
  id,
  chatId,
  reaction,
  updateRef,
  senderId,
  onReply,
}: {
  content: string;
  isFromSelf: boolean;
  timestamp?: number;
  read: boolean;
  id: string;
  chatId: string;
  reaction: string | null;
  senderId: string;
  updateRef: React.RefObject<any>;
  onReply: (replyInfo: ReplyMessageInfo) => void;
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);
  const bubbleRef = useRef<TouchableOpacity>(null);
  const swipeableRef = useRef<Swipeable>(null);

  const handleLongPress = useCallback(() => {
    if (id && bubbleRef.current) {
      const currentBubbleRef = bubbleRef.current;
      currentBubbleRef.measure(
        (fx: any, fy: any, width: any, height: any, px: number, py: number) => {
          if (isNaN(px) || isNaN(py) || !px || !py) {
            console.warn(
              `[Measure Callback] Invalid px/py measurement for ID: ${id}. (px: ${px}, py: ${py}). View might be recycled or off-screen.`
            );
            return;
          }
          const pickerHeight = 50;
          const pickerMargin = 10;
          let top = py - pickerHeight - pickerMargin;
          const left = px;

          if (top < (Platform.OS === 'ios' ? 40 : 20)) {
            top = py + height + pickerMargin;
          }
          setPickerPosition({ top, left });
          setShowEmojiPicker(true);
        }
      );
    } else {
      console.warn(
        `[HandleLongPress] Skipped measure for ID: ${id}. Ref Missing: ${!bubbleRef.current}`
      );
    }
  }, [id]);

  const handleCloseModal = () => {
    setShowEmojiPicker(false);
    setPickerPosition(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    if (id && chatId) {
      reactToMessage(id, emoji, chatId);
    }
    setShowEmojiPicker(false);
    setPickerPosition(null);
  };

  const renderEmojiPicker = () => (
    <View onStartShouldSetResponder={() => true}>
      <View className="relative mx-2 flex-row overflow-x-scroll rounded-full bg-white px-2 shadow-lg">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ alignItems: 'center', paddingRight: 40, paddingLeft: 10 }}>
          {EMOJI_REACTIONS.map((emoji) => (
            <TouchableOpacity key={emoji} onPress={() => handleEmojiSelect(emoji)} className="p-2">
              <Text
                className={` rounded-full text-3xl ${reaction === emoji ? 'bg-slate-200 p-2' : ''}`}>
                {emoji}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          className="absolute  right-0 flex h-full items-center justify-center rounded-full bg-white px-2 "
          onPress={handleCloseModal}>
          <FontAwesome name="plus-circle" size={30} color="grey" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReadStatus = () => {
    if (!isFromSelf) return null;
    return (
      <Text className="ml-1 mt-[-1px] ">
        <FontAwesome name={read ? 'eye' : 'check'} size={10} color="grey" />
      </Text>
    );
  };

  const messageContent = () => {
    return (
      <View
        className={`
            min-w-20 max-w-[75%] rounded-2xl px-3 py-2 shadow-sm
            ${
              isFromSelf
                ? 'mr-2 self-end rounded-br-sm bg-lighterPrimary'
                : 'ml-2 self-start rounded-bl-sm bg-white'
            }
            ${reaction ? 'mb-5' : ''}
            
          `}>
        <Text className="text-base leading-snug text-gray-800">{content}</Text>
        <View className="mt-1 flex-row items-center self-end">
          <Text className="text-xs text-gray-500">{formatTimestamp(timestamp ?? 0)}</Text>
          {renderReadStatus()}
        </View>
        {reaction && (
          <View
            className={`absolute -bottom-5 rounded-full bg-white/90 p-0.5 shadow ${isFromSelf ? 'right-1' : 'left-1'}`}>
            <Text className="text-base">{reaction}</Text>
          </View>
        )}
      </View>
    );
  };

  const handleSwipeOpen = () => {
    if (onReply) {
      onReply({ id, content, senderId });
    }
    setTimeout(() => {
      swipeableRef.current?.close();
    }, 1000);
  };

  const renderLeftActions = (progress: any, dragX: any) => {
    return (
      <Animated.View style={[styles.leftAction]}>
        <View className="flex h-full items-center justify-center bg-transparent pr-2">
          <MaterialCommunityIcons name="reply" size={24} color="grey" />
        </View>
      </Animated.View>
    );
  };

  const renderRightActions = (progress: any, dragX: any) => {
    return (
      <Animated.View style={[styles.rightAction]}>
        <View className="flex h-full items-center justify-center bg-transparent pl-2">
          <MaterialCommunityIcons name="reply" size={24} color="grey" />
        </View>
      </Animated.View>
    );
  };

  const handleSwipeableWillOpen = () => {
    if (updateRef?.current && updateRef.current !== swipeableRef.current) {
      updateRef.current.close();
    }
    if (updateRef) {
      updateRef.current = swipeableRef.current;
    }
  };

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        friction={2}
        leftThreshold={40}
        rightThreshold={40}
        renderLeftActions={!isFromSelf ? renderLeftActions : undefined}
        renderRightActions={isFromSelf ? renderRightActions : undefined}
        onSwipeableOpen={handleSwipeOpen}
        onSwipeableWillOpen={handleSwipeableWillOpen}
        overshootLeft={false}
        overshootRight={false}
        containerStyle={[styles.swipeableContainer]}>
        <TouchableOpacity ref={bubbleRef} onLongPress={handleLongPress} activeOpacity={0.9}>
          {messageContent()}
        </TouchableOpacity>
      </Swipeable>

      <Modal
        animationType="fade"
        transparent
        visible={showEmojiPicker}
        onRequestClose={handleCloseModal}>
        <TouchableOpacity
          className="absolute inset-0 "
          activeOpacity={1}
          onPress={handleCloseModal}>
          <BlurView intensity={40} tint="dark" className=" h-full w-full  " />
          {pickerPosition && (
            <View
              className=" w-full flex-col gap-2 p-2"
              style={
                pickerPosition
                  ? {
                      position: 'absolute',
                      top: pickerPosition.top,
                      left: pickerPosition.left,
                      zIndex: 999,
                    }
                  : { display: 'none' }
              }>
              {renderEmojiPicker()}
              <View
                style={{
                  marginLeft: pickerPosition.left < 50 ? 0 : -pickerPosition.left + 10,
                }}>
                {messageContent()}
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  swipeableContainer: {},
  leftAction: {
    width: 80,
    // backgroundColor: 'lightblue',
  },
  rightAction: {
    width: 80,
    // backgroundColor: 'lightcoral',
  },
});

export default MessageBubble;
