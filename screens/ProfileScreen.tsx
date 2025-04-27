import { router } from 'expo-router';
import { View, Text, TouchableOpacity } from 'react-native';

import { useSession } from '~/context/authContext';

const ProfileScreen = () => {
  const { signOut } = useSession();

  const handleSignOut = () => {
    signOut();
    router.replace('/sign-in');
  };
  return (
    <View
      testID="profile-container"
      className="flex-1 items-center justify-center bg-body-light p-4 dark:bg-body-dark">
      <TouchableOpacity className=" rounded-xl bg-primary p-4" onPress={() => handleSignOut()}>
        <Text className="text-title-light dark:text-title-dark">Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ProfileScreen;
