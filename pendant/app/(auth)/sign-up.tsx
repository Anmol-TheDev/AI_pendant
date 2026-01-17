import * as React from "react";
import { View, Alert } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useOAuth } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");

  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert("Error", err.errors[0].message);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
      }
    } catch (err: any) {
      Alert.alert("Error", err.errors[0].message);
    }
  };

  const onGoogleSignUpPress = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } =
        await startOAuthFlow({
          redirectUrl: AuthSession.makeRedirectUri({
            path: "/(auth)/sign-up",
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
        {!pendingVerification && (
          <View className="gap-8">
            <View>
              <Text className="text-3xl font-bold text-foreground">
                Create account
              </Text>
              <Text className="text-muted-foreground mt-2">
                Sign up to get started
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

              <Button onPress={onSignUpPress}>
                <Text>Sign up</Text>
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

              <Button variant="outline" onPress={onGoogleSignUpPress}>
                <Text>Continue with Google</Text>
              </Button>
            </View>

            <View className="flex-row justify-center gap-1">
              <Text className="text-muted-foreground">
                Already have an account?
              </Text>
              <Link href="/sign-in" asChild>
                <Text className="text-primary font-bold">Sign in</Text>
              </Link>
            </View>
          </View>
        )}
        {pendingVerification && (
          <View className="gap-8">
            <View>
              <Text className="text-3xl font-bold text-foreground">
                Verify your email
              </Text>
              <Text className="text-muted-foreground mt-2">
                Enter the verification code sent to your email
              </Text>
            </View>

            <View className="gap-4">
              <View className="gap-2">
                <Text className="text-foreground font-medium">
                  Verification Code
                </Text>
                <Input
                  value={code}
                  placeholder="Enter code..."
                  onChangeText={setCode}
                />
              </View>

              <Button onPress={onPressVerify}>
                <Text>Verify Email</Text>
              </Button>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}