import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

export default function useImagePicker() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission to access media library was denied');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Failed to pick image');
    }
  };

  return { imageUri, setImageUri, uploading, setUploading, error, pickImage };
}
