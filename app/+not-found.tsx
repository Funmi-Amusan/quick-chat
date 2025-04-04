import { Link, router, Stack } from 'expo-router';
import { Pressable, SafeAreaView, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <SafeAreaView className=" flex-1 bg-slate-200">
        <Stack.Screen options={{ title: 'Oops!' }} />
        <View className=" flex-1 items-center justify-center bg-slate-500">
          <Text className="">This screen doesn't exist.</Text>
          <Pressable
            style={{
              width: 'auto',
              height: 32,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: 'black',
              justifyContent: 'center',
              backgroundColor: 'transparent',
            }}
            onPress={() => router.push(__DEV__ ? '/_sitemap' : '/')}>
            <Text className=""> Click to go to site map.</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </>
  );
}
