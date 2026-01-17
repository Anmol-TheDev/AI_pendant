import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { View, Alert } from "react-native";
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useWarmUpBrowser } from "@/src/hooks/useWarmUpBrowser";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  useWarmUpBrowser();

  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");

  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) return;

    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // This indicates the user is signed in
      await setActive({ session: completeSignIn.createdSessionId });
      router.replace("/");
    } catch (err: any) {
      Alert.alert("Error", err.errors ? err.errors[0].message : err.message);
    }
  }, [isLoaded, emailAddress, password]);

  const onGoogleSignInPress = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } =
        await startOAuthFlow({
          redirectUrl: AuthSession.makeRedirectUri({
            path: "/(auth)/sign-in",
          }),
        });

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      } else {
        // Use signIn or signUp for next steps such as MFA
      }
    } catch (err) {
      console.error("OAuth error", err);
    }
  }, [startOAuthFlow]);

  return (
    <View className="flex-1 bg-background mt-6">
      <View className="pt-12 px-6">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold">Pendant</Text>
            <Text className="text-muted-foreground">Recording Dashboard</Text>
          </View>
        </View>
      </View>
      <View className="flex-1 justify-center px-6 bg-background">
        <View className="gap-8">
          <View>
            <Text className="text-3xl font-bold text-foreground">
              Welcome back
            </Text>
            <Text className="text-muted-foreground mt-2">
              Sign in to your account to continue
            </Text>
          </View>

          <View className="gap-4">
            <View className="gap-2">
              <Text className="text-foreground font-medium">Email</Text>
              <Input
                autoCapitalize="none"
                value={emailAddress}
                placeholder="Enter email..."
                onChangeText={setEmailAddress}
              />
            </View>
            <View className="gap-2">
              <Text className="text-foreground font-medium">Password</Text>
              <Input
                value={password}
                placeholder="Enter password..."
                secureTextEntry={true}
                onChangeText={setPassword}
              />
            </View>

            <Button onPress={onSignInPress}>
              <Text>Sign in</Text>
            </Button>

            <View className="relative my-4">
              <View className="absolute inset-0 flex items-center">
                <View className="w-full border-t border-border" />
              </View>
              <View className="relative flex justify-center text-xs uppercase">
                <View className="bg-background px-2">
                  <Text className="text-muted-foreground">
                    Or continue with
                  </Text>
                </View>
              </View>
            </View>

            <Button variant="outline" onPress={onGoogleSignInPress}>
              <Text>Continue with Google</Text>
            </Button>
          </View>

          <View className="flex-row justify-center gap-1">
            <Text className="text-muted-foreground">
              Don't have an account?
            </Text>
            <Link href="/sign-up" asChild>
              <Text className="text-primary font-bold">Sign up</Text>
            </Link>
          </View>
        </View>
      </View>
    </View>
  );
}