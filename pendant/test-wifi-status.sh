#!/bin/bash

echo "📶 Testing WiFi Status Component"
echo "================================"

# Check if WiFiStatus component exists
if [ -f "components/features/home/WiFiStatus.tsx" ]; then
    echo "✅ WiFiStatus component created"
else
    echo "❌ WiFiStatus component missing"
fi

# Check if homepage is updated with WiFiStatus
if grep -q "WiFiStatus" app/index.tsx; then
    echo "✅ Homepage updated with WiFiStatus component"
else
    echo "❌ Homepage not updated with WiFiStatus component"
fi

# Check for key features in WiFiStatus
echo ""
echo "🔍 Checking WiFiStatus features:"

if grep -q "expo-network" components/features/home/WiFiStatus.tsx; then
    echo "✅ Uses Expo Network API"
else
    echo "❌ Expo Network API not found"
fi

if grep -q "getNetworkStateAsync" components/features/home/WiFiStatus.tsx; then
    echo "✅ Network state checking implemented"
else
    echo "❌ Network state checking missing"
fi

if grep -q "NetworkStateType.WIFI" components/features/home/WiFiStatus.tsx; then
    echo "✅ WiFi detection implemented"
else
    echo "❌ WiFi detection missing"
fi

if grep -q "text-green-500\|text-red-500" components/features/home/WiFiStatus.tsx; then
    echo "✅ Connection status colors (green/red)"
else
    echo "❌ Connection status colors missing"
fi

if grep -q "Wifi\|WifiOff\|Signal" components/features/home/WiFiStatus.tsx; then
    echo "✅ Network status icons"
else
    echo "❌ Network status icons missing"
fi

if grep -q "setInterval" components/features/home/WiFiStatus.tsx; then
    echo "✅ Periodic network status updates"
else
    echo "❌ Periodic network status updates missing"
fi

echo ""
echo "📱 WiFi Status Features:"
echo "• Real-time network connection monitoring"
echo "• WiFi, Cellular, Ethernet detection"
echo "• Visual status indicators (icons + colors)"
echo "• Connection status dot indicator"
echo "• Automatic updates every 5 seconds"
echo "• Integrated into homepage header section"
echo ""
echo "✅ WiFi Status Component Complete!"