import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  KeyboardAvoidingView,
  Image,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Progress from 'react-native-progress';

import ChatTextInput from '../chatRoom/chatTextInput/ChatTextInput';

export type PickedFile = DocumentPicker.DocumentPickerAsset | ImagePicker.ImagePickerAsset | null;

interface FilePreviewModalProps {
  file: PickedFile;
  onClose: () => void;
  setInputText: (arg0: string) => void;
  inputText: string;
  handleSendMessage: () => void;
  progress: number;
}

const FilePreviewModal = ({
  file,
  onClose,
  setInputText,
  inputText,
  handleSendMessage,
  progress,
}: FilePreviewModalProps) => {
  const isVisible = file !== null;
  const renderPreviewContent = () => {
    if (!file) {
      return null;
    }

    return (
      <View style={styles.documentPreviewContainer}>
        <MaterialCommunityIcons name="file-document-outline" size={80} color="#ccc" />
        <Text style={styles.documentFileName}>{file?.name}</Text>
        <Progress.Circle progress={progress} size={50} color="white" />
      </View>
    );
  };

  return (
    <Modal animationType="fade" transparent visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <BlurView style={StyleSheet.absoluteFill} tint="dark" intensity={90} />
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <AntDesign name="closecircle" size={36} color="grey" />
        </TouchableOpacity>
        {renderPreviewContent()}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatInputContainer}>
          <ChatTextInput
            value={inputText}
            onChangeText={(e) => setInputText(e)}
            onSendPress={handleSendMessage}
            placeholder="Add a caption..."
            showCameraIcon={false}
            onFilePicked={() => {}}
          />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    zIndex: 20,
  },
  chatInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
  documentPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  documentFileName: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  documentFileInfo: {
    fontSize: 12,
    color: '#ccc',
    marginTop: 5,
  },
});

export default FilePreviewModal;
