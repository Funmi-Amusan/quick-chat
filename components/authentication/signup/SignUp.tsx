import { useSession } from 'context/authContext';
import { router, Link } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View, Pressable } from 'react-native';

/**
 * SignUp component handles new user registration
 * @returns {JSX.Element} Sign-up form component
 */
export default function SignUp() {
  // ============================================================================
  // Hooks & State
  // ============================================================================

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { signUp } = useSession();

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handles the registration process
   * @returns {Promise<Models.User<Models.Preferences> | null>}
   */
  const handleRegister = async () => {
    try {
      return await signUp(email, password, name);
    } catch (err) {
      console.log('[handleRegister] ==>', err);
      return null;
    }
  };

  /**
   * Handles the sign-up button press
   */
  const handleSignUpPress = async () => {
    const resp = await handleRegister();
    if (resp) {
      router.replace('/chats');
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <View className="flex-1 items-center justify-center p-4">
      {/* Welcome Section */}
      <View className="mb-8 items-center">
        <Text className="mb-2 text-2xl font-bold text-gray-800">Create Account</Text>
        <Text className="text-sm text-gray-500">Sign up to get started</Text>
      </View>

      {/* Form Section */}
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

      {/* Sign Up Button */}
      <Pressable
        onPress={handleSignUpPress}
        className="w-full max-w-[300px] rounded-lg bg-blue-600 py-3 active:bg-blue-700">
        <Text className="text-center text-base font-semibold text-white">Sign Up</Text>
      </Pressable>

      {/* Sign In Link */}
      <View className="mt-6 flex-row items-center">
        <Text className="text-gray-600">Already have an account?</Text>
        <Link href="/sign-in" asChild>
          <Pressable className="ml-2">
            <Text className="font-semibold text-blue-600">Sign In</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
