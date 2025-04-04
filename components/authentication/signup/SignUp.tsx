import { useSession } from 'context/authContext';
import { router, Link } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { signUp } = useSession();

  const handleRegister = async () => {
    try {
      return await signUp(email, password, name);
    } catch (err) {
      console.log('[handleRegister] ==>', err);
      return null;
    }
  };

  const handleSignUpPress = async () => {
    const resp = await handleRegister();
    console.log('e', resp);
    if (resp) {
      router.replace('/chats');
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-slate-200 p-4">
      <View className="mb-8 items-center">
        <Text className="mb-2 text-2xl font-bold text-gray-800">Create Account</Text>
        <Text className="text-sm text-gray-500">Sign up to get started</Text>
      </View>

      <View className="mb-8 w-full max-w-[300px] space-y-4">
        <View>
          <Text className="mb-1 ml-1 text-sm font-medium text-gray-700">Name</Text>
          <TextInput
            placeholder="Your full name"
            value={name}
            onChangeText={setName}
            textContentType="name"
            autoCapitalize="words"
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-base"
          />
        </View>

        <View>
          <Text className="mb-1 ml-1 text-sm font-medium text-gray-700">Email</Text>
          <TextInput
            placeholder="name@mail.com"
            value={email}
            onChangeText={setEmail}
            textContentType="emailAddress"
            keyboardType="email-address"
            autoCapitalize="none"
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-base"
          />
        </View>

        <View>
          <Text className="mb-1 ml-1 text-sm font-medium text-gray-700">Password</Text>
          <TextInput
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-base"
          />
        </View>
      </View>

      <Pressable
        onPress={handleSignUpPress}
        className="w-full max-w-[300px] rounded-lg bg-violet-600 py-3 active:bg-violet-700">
        <Text className="text-center text-base font-semibold text-white">Sign Up</Text>
      </Pressable>

      <View className="mt-6 flex-row items-center">
        <Text className="text-gray-600">Already have an account?</Text>
        <Link href="/sign-in" asChild>
          <Pressable className="ml-2">
            <Text className="font-semibold text-violet-600">Sign In</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
