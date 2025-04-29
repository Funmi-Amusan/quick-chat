import AntDesign from '@expo/vector-icons/AntDesign';
import { BlurView } from 'expo-blur';
import { View, Modal, TouchableOpacity, KeyboardAvoidingView, Image } from 'react-native';

import ChatTextInput from '../chatRoom/chatTextInput/ChatTextInput';

const ImageMessagePreviewModal = ({
  setImageUri,
  imageUri,
  setInputText,
  inputText,
  handleSendMessage,
}: {
  setImageUri: (arg0: string | null) => void;
  imageUri: string | null;
  setInputText: (arg0: string) => void;
  inputText: string;
  handleSendMessage: () => void;
}) => {
  const handleCloseModal = () => {
    setImageUri(null);
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={imageUri !== null}
      onRequestClose={handleCloseModal}>
      <View className=" h-full w-full bg-transparent">
        <BlurView
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
          }}
          tint="dark"
          intensity={90}
        />

        <TouchableOpacity className="absolute left-10 top-12 z-20" onPress={handleCloseModal}>
          <AntDesign name="closecircle" size={36} color="grey" />
        </TouchableOpacity>

        <KeyboardAvoidingView
          behavior="padding"
          className="absolute bottom-10 left-0 right-0 z-10 flex-row items-center justify-between">
          <ChatTextInput
            value={inputText}
            onChangeText={(e) => setInputText(e)}
            onSendPress={handleSendMessage}
            placeholder="Add a caption..."
            showCameraIcon={false}
            onFilePicked={() => {}}
          />
        </KeyboardAvoidingView>

        <Image source={{ uri: imageUri || '' }} className="h-full w-full" resizeMode="contain" />
      </View>
    </Modal>
  );
};

export default ImageMessagePreviewModal;
