import { View, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { LogOutIcon, UserIcon, MailIcon } from "lucide-react-native";

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-6 gap-8">
        <View>
          <Text className="text-3xl font-bold">Settings</Text>
          <Text className="text-muted-foreground">Manage your account</Text>
        </View>

        {/* User Profile Section */}
        <View className="items-center gap-4">
          <View className="size-24 rounded-full bg-muted items-center justify-center overflow-hidden border-2 border-border">
            {user.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} className="size-full" />
            ) : (
              <Text className="text-3xl font-bold text-muted-foreground">
                {user.firstName?.charAt(0) ||
                  user.emailAddresses[0].emailAddress.charAt(0)}
              </Text>
            )}
          </View>
          <View className="items-center">
            <Text className="text-xl font-semibold">
              {user.fullName || "User"}
            </Text>
            <Text className="text-muted-foreground">
              {user.primaryEmailAddress?.emailAddress}
            </Text>
          </View>
        </View>

        {/* Account Details Card */}
        <View className="bg-card border border-border rounded-xl p-4 gap-4">
          <Text className="font-semibold mb-2">Account Details</Text>

          <View className="flex-row items-center gap-3">
            <View className="p-2 rounded-full bg-primary/10">
              <Icon as={UserIcon} className="size-5 text-primary" />
            </View>
            <View>
              <Text className="text-sm text-muted-foreground">Name</Text>
              <Text className="font-medium">{user.fullName || "N/A"}</Text>
            </View>
          </View>
          <View className="w-full h-px bg-border" />
          <View className="flex-row items-center gap-3">
            <View className="p-2 rounded-full bg-primary/10">
              <Icon as={MailIcon} className="size-5 text-primary" />
            </View>
            <View>
              <Text className="text-sm text-muted-foreground">Email</Text>
              <Text className="font-medium">
                {user.primaryEmailAddress?.emailAddress}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-1" />

        <Button
          variant="outline"
          className="flex-row gap-2 border-destructive/50"
          onPress={handleSignOut}
        >
          <Icon as={LogOutIcon} className="size-4 text-destructive" />
          <Text className="text-destructive">Sign Out</Text>
        </Button>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}
