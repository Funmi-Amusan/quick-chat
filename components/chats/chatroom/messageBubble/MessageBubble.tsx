import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BlurView } from 'expo-blur';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { User } from 'firebase/auth';
import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  UIManager,
  Platform,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import * as Progress from 'react-native-progress';
import Animated from 'react-native-reanimated';

import { ImageAssets } from '~/assets';
import { reactToMessage } from '~/lib/firebase-sevice';
import { formatTimestamp } from '~/lib/helpers';
import { ReplyMessageInfo } from '~/lib/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🥳', '😍', '🥶', '🤯'];

const MessageBubble = ({
  content,
  timestamp,
  read = false,
  id,
  chatId,
  reaction,
  updateRef,
  senderId,
  onReply,
  replyMessage,
  imageUrl,
  isHighlighted,
  currentUser,
  fileUrl,
  fileType,
  fileName,
  status = 'sent',
  uploadProgress,
}: {
  content: string;
  timestamp?: number;
  read: boolean;
  id: string;
  chatId: string;
  reaction: string | null;
  senderId: string;
  updateRef: React.RefObject<any>;
  onReply: (replyInfo: ReplyMessageInfo) => void;
  replyMessage?: ReplyMessageInfo | null;
  imageUrl?: string | null;
  isHighlighted: boolean;
  currentUser: User | null;
  fileUrl?: string | null;
  fileType?: string | null;
  fileName?: string | null;
  status?: 'pending' | 'sent' | 'failed';
  uploadProgress?: number;
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);
  const [activeSwipeable, setActiveSwipeable] = useState<SwipeableMethods | null>(null);
  const bubbleRef = useRef<View>(null);
  const swipeableRef = useRef<SwipeableMethods>(null);
  const isFromSelf = senderId === currentUser?.uid;

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

  const downloadAndOpenFile = async (fileUrl: string, fileName: string) => {
    const fileUri = FileSystem.documentDirectory + fileName;

    try {
      const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Sharing is not available on this platform');
        return;
      }
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert('Error', 'Failed to download or open the file.');
    }
  };

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
        <FontAwesome
          testID={read ? 'readIcon' : 'notReadIcon'}
          name={read ? 'eye' : 'check'}
          size={10}
          color="grey"
        />
      </Text>
    );
  };
  const messageContent = () => {
    return (
      <View
        className={`relative
            min-w-20 max-w-[75%] rounded-2xl shadow-sm
            ${
              isFromSelf
                ? 'mr-2 self-end rounded-br-sm bg-lighterPrimary'
                : 'ml-2 self-start rounded-bl-sm bg-white'
            }
            ${reaction ? 'mb-5' : ''}
            ${imageUrl ? 'p-1' : 'px-3 py-2'}
          `}>
        {replyMessageContent()}
        {imageUrl && (
          <TouchableOpacity
            onPress={() => setPreviewImage(imageUrl)}
            className=" mb-2 overflow-hidden rounded-2xl">
            <Image
              testID="img"
              source={{ uri: imageUrl }}
              className="h-48 w-48"
              resizeMode="cover"
            />
            {status === 'pending' && uploadProgress !== undefined && uploadProgress < 100 && (
              <View className="absolute inset-0 flex-row items-center justify-center bg-black/50">
                <Progress.Circle progress={uploadProgress} size={50} color="white" />
              </View>
            )}
          </TouchableOpacity>
        )}
        {fileUrl && (
          <TouchableOpacity
            onPress={() => downloadAndOpenFile(fileUrl, fileName)}
            className="mb-2 overflow-hidden rounded-2xl p-1">
            <View className="relative flex-row items-center gap-2">
              {status === 'pending' && uploadProgress !== undefined && uploadProgress < 100 && (
                <View className=" flex-row items-center justify-center ">
                  <Progress.Circle progress={uploadProgress} size={20} color="grey" />
                </View>
              )}
              <Image
                testID="img"
                source={ImageAssets.pdfFile}
                className="h-10 w-8"
                resizeMode="cover"
              />
              <View>
                <Text className="">{fileName}</Text>
                <View className="flex-row gap-1">
                  <Text className="text-sm">543 KB</Text>
                  <Entypo name="dot-single" size={14} color="grey" />
                  <Text className="text-sm">{fileType}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        {content && (
          <Text
            testID={`${isHighlighted ? 'highlighted-message' : 'message-content'}`}
            className={`mb-1 text-base leading-snug text-gray-800 ${isHighlighted ? ' bg-yellow-400' : ''} `}>
            {content}
          </Text>
        )}
        <View className=" flex-row items-center self-end">
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
      onReply({ id, content, senderId, imageUrl: imageUrl ?? null, fileName: fileName ?? null });
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
    if (activeSwipeable && activeSwipeable !== swipeableRef.current) {
      activeSwipeable.close();
    }
    setActiveSwipeable(swipeableRef.current);
  };

  const replyMessageContent = () => {
    return replyMessage !== null ? (
      <View className="h-fit flex-row items-center rounded-md border-l-4 border-mint bg-white/50">
        <View className="flex-grow flex-row items-center gap-2 px-2">
          {replyMessage?.imageUrl && (
            <MaterialCommunityIcons name="camera" size={20} color="grey" />
          )}
          {replyMessage?.fileName && <MaterialCommunityIcons name="file" size={20} color="grey" />}
          <Text className="text-grey-700 line-clamp-1 text-sm">
            {replyMessage?.content
              ? replyMessage.content
              : replyMessage?.imageUrl
                ? 'Photo'
                : replyMessage?.fileName
                  ? replyMessage.fileName
                  : ''}
          </Text>
        </View>
        {replyMessage?.imageUrl && (
          <Image
            testID="img"
            source={{ uri: replyMessage?.imageUrl }}
            className="h-16 w-16 rounded-r-2xl "
            resizeMode="cover"
          />
        )}
      </View>
    ) : null;
  };

  return (
    <>
      <Swipeable
        testID="swipeable-container"
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

      <Modal
        animationType="fade"
        transparent
        visible={previewImage !== null}
        onRequestClose={handleCloseModal}>
        {previewImage && (
          <>
            <Image
              role="img"
              source={{ uri: previewImage }}
              className="h-full w-full"
              resizeMode="cover"
            />
            <TouchableOpacity
              className="absolute left-5 top-10 z-50 m-4"
              onPress={() => setPreviewImage(null)}>
              <MaterialIcons name="arrow-back-ios-new" size={24} color="black" />
            </TouchableOpacity>
          </>
        )}
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
