import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useEffect, useRef, useState } from 'react';
import { TouchableOpacity, View, TextInput, Keyboard, StyleSheet } from 'react-native';

interface ChatTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSendPress: () => void;
  placeholder?: string;
  setFocus?: () => void;
  onBlur?: () => void;
  onFocus?: () => void;
  onImagePress?: () => void;
  showCameraIcon?: boolean;
  isUploading?: boolean;
  onFilePicked: (file: DocumentPicker.DocumentPickerAsset) => void;
}

const ChatTextInput = ({
  value,
  onChangeText,
  onSendPress,
  placeholder = 'Reply',
  setFocus,
  onFocus: parentOnFocus,
  onBlur,
  onImagePress,
  isUploading = false,
  showCameraIcon = true,
  onFilePicked,
}: ChatTextInputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showFileOptions, setShowFileOptions] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  // TODO : FORCE KEYBOARD TO SHOW

  const canSend = value.trim() !== '';

  useEffect(() => {
    if (setFocus) {
      setFocus();
      textInputRef.current?.focus();
      handleOnFocus();
    }
  }, [setFocus]);

  const handleOnFocus = () => {
    setIsFocused(true);
    if (parentOnFocus) {
      parentOnFocus();
    }
  };

  const handleOnBlur = () => {
    setIsFocused(false);
    if (onBlur) {
      onBlur();
    }
  };

  const handleAddFilePress = () => {
    Keyboard.dismiss();
    setShowFileOptions(!showFileOptions);
  };

  const handleAddFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });

      if (result.canceled === false) {
        const file = result.assets[0];
        onFilePicked(file);
        setShowFileOptions(false);
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };

  return (
    <View>
      <View
        className={` flex-row items-end justify-between gap-4 bg-slate-50 p-4 dark:bg-neutral-700`}>
        <TouchableOpacity
          testID="plus-button"
          className=""
          onPress={handleAddFilePress}
          disabled={isUploading}>
          <MaterialCommunityIcons
            name={showFileOptions ? 'keyboard' : 'plus'}
            size={24}
            color="grey"
          />
        </TouchableOpacity>
        <TextInput
          className=" max-h-28 min-h-10 w-8/12 flex-grow rounded-3xl bg-slate-100 px-3 py-2 color-slate-700"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9a9a9a"
          multiline
          onFocus={handleOnFocus}
          onBlur={() => setIsFocused(false)}
          underlineColorAndroid="transparent"
        />
        {showCameraIcon && (
          <TouchableOpacity
            testID="camera-button"
            className=""
            onPress={onImagePress}
            disabled={isUploading}>
            <MaterialCommunityIcons name="camera" size={20} color="grey" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          testID="send-button"
          className=" items-center justify-center px-2  "
          onPress={onSendPress}
          // disabled={!canSend}
        >
          <FontAwesome name="send" size={20} color="#FFB0FE" />
        </TouchableOpacity>
      </View>
      {showFileOptions && (
        <View
          className={`h-60 flex-row items-center justify-around bg-body-light py-5 dark:bg-body-dark/70 `}>
          <TouchableOpacity onPress={handleAddFilePick} style={styles.fileOptionButton}>
            <MaterialCommunityIcons name="file-document-outline" size={30} color="#3182CE" />
          </TouchableOpacity>
          <View style={styles.fileOptionButton}>
            <MaterialCommunityIcons name="image-outline" size={30} color="#34D399" />
          </View>
          <View style={styles.fileOptionButton}>
            <MaterialCommunityIcons name="camera-outline" size={30} color="#E53E3E" />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fileOptionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
});

export default ChatTextInput;
