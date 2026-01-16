import "@/global.css";
import { ClerkProvider, ClerkLoaded, useAuth } from "@clerk/clerk-expo";
import { tokenCache } from "@/src/services/auth.service";
import { ToastProvider } from "@/components/ui/Toast";
import { NetworkProvider } from "@/src/services/network.service";
import { PortalHost } from "@rn-primitives/portal";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
  );
}

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (isSignedIn && inAuthGroup) {
      router.replace("/");
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace("/sign-in");
    }
  }, [isSignedIn, segments, isLoaded, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <NetworkProvider>
          <ToastProvider>
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            <InitialLayout />
            <PortalHost />
          </ToastProvider>
        </NetworkProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
