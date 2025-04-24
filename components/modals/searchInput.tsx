import Feather from '@expo/vector-icons/Feather';
import { View, Pressable } from 'react-native';

import BaseSearchTextInput from '../ui/input/BaseSearchTextInput';

const SearchInput = ({
  setSearchString,
  searchString,
  closeSearchModal,
}: {
  setSearchString: (arg: string) => void;
  searchString: string;
  closeSearchModal: () => void;
}) => {
  return (
    <View className=" flex-row items-center gap-4  ">
      <Pressable onPress={closeSearchModal}>
        <Feather name="chevron-left" size={30} color="white" />
      </Pressable>
      <BaseSearchTextInput
        value={searchString}
        placeholder="Search Chats"
        onChangeText={(e) => setSearchString(e)}
        textContentType="none"
      />
      {/* <Pressable className=" rounded-full bg-primary p-2">
        <MaterialIcons name="send" size={24} color="black" />
      </Pressable> */}
    </View>
  );
};

export default SearchInput;
