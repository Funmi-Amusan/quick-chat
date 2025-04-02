import { router, Link } from 'expo-router';
import { Text, TextInput, View, Pressable } from 'react-native';
import { useState } from 'react';
import { useSession } from 'context/authContext';

/**
 * SignIn component handles user authentication through email and password
 * @returns {JSX.Element} Sign-in form component
 */
export default function SignIn() {
  // ============================================================================
  // Hooks & State
  // ============================================================================

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useSession();

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handles the sign-in process
   * @returns {Promise<Models.User<Models.Preferences> | null>}
   */
  const handleLogin = async () => {
    try {
      return await signIn(email, password);
    } catch (err) {
      console.log('[handleLogin] ==>', err);
      return null;
    }
  };

  /**
   * Handles the sign-in button press
   */
  const handleSignInPress = async () => {
    const resp = await handleLogin();
    router.replace('/chats');
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <View className="flex-1 items-center justify-center p-4">
      {/* Welcome Section */}
      <View className="mb-8 items-center">
        <Text className="mb-2 text-2xl font-bold text-gray-800">Welcome Back</Text>
        <Text className="text-sm text-gray-500">Please sign in to continue</Text>
      </View>

      {/* Form Section */}
      <View className="mb-8 w-full max-w-[300px] space-y-4">
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
            placeholder="Your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-base"
          />
        </View>
      </View>

      {/* Sign In Button */}
      <Pressable
        onPress={handleSignInPress}
        className="w-full max-w-[300px] rounded-lg bg-blue-600 py-3 active:bg-blue-700">
        <Text className="text-center text-base font-semibold text-white">Sign In</Text>
      </Pressable>

      {/* Sign Up Link */}
      <View className="mt-6 flex-row items-center">
        <Text className="text-gray-600">Don't have an account?</Text>
        <Link href="/sign-up" asChild>
          <Pressable className="ml-2">
            <Text className="font-semibold text-blue-600">Sign Up</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}
