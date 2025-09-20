#!/bin/bash

# iOS Build Script for Newomen App
# Builds the app for iOS deployment and TestFlight

set -e

echo "🚀 Starting iOS build process for Newomen App..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Check if Capacitor is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npm/npx not found. Please install Node.js.${NC}"
    exit 1
fi

# Function to check if Xcode is installed
check_xcode() {
    if ! command -v xcodebuild &> /dev/null; then
        echo -e "${RED}❌ Error: Xcode not found. Please install Xcode from the Mac App Store.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Xcode found${NC}"
}

# Function to install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install --legacy-peer-deps
    
    # Install iOS pods
    if [ -d "ios/App" ]; then
        cd ios/App
        if command -v pod &> /dev/null; then
            echo -e "${BLUE}📦 Installing CocoaPods...${NC}"
            pod install
        else
            echo -e "${YELLOW}⚠️ CocoaPods not found. Installing...${NC}"
            sudo gem install cocoapods
            pod install
        fi
        cd ../..
    fi
}

# Function to build web assets
build_web() {
    echo -e "${BLUE}🔨 Building web assets...${NC}"
    npm run build:production
    
    if [ ! -d "dist" ]; then
        echo -e "${RED}❌ Error: Build failed. dist directory not found.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Web build completed${NC}"
}

# Function to sync with Capacitor
sync_capacitor() {
    echo -e "${BLUE}🔄 Syncing with Capacitor...${NC}"
    npx cap sync ios
    
    echo -e "${GREEN}✅ Capacitor sync completed${NC}"
}

# Function to open Xcode project
open_xcode() {
    echo -e "${BLUE}🍎 Opening Xcode project...${NC}"
    npx cap open ios
    
    echo -e "${GREEN}✅ Xcode project opened${NC}"
}

# Function to build for device (requires manual signing in Xcode)
build_for_device() {
    echo -e "${BLUE}📱 Building for device...${NC}"
    
    cd ios/App
    
    # Build for generic iOS device
    xcodebuild -workspace App.xcworkspace \
               -scheme App \
               -configuration Release \
               -destination generic/platform=iOS \
               -archivePath ./build/App.xcarchive \
               archive
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Archive build completed successfully${NC}"
        echo -e "${YELLOW}📋 Archive location: ios/App/build/App.xcarchive${NC}"
    else
        echo -e "${RED}❌ Archive build failed${NC}"
        echo -e "${YELLOW}💡 Try opening Xcode and building manually with proper signing certificates${NC}"
        cd ../..
        return 1
    fi
    
    cd ../..
}

# Function to create IPA for TestFlight
create_ipa() {
    echo -e "${BLUE}📦 Creating IPA for TestFlight...${NC}"
    
    cd ios/App
    
    # Export IPA
    xcodebuild -exportArchive \
               -archivePath ./build/App.xcarchive \
               -exportOptionsPlist ./build/ExportOptions.plist \
               -exportPath ./build/
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ IPA created successfully${NC}"
        echo -e "${YELLOW}📋 IPA location: ios/App/build/App.ipa${NC}"
    else
        echo -e "${RED}❌ IPA creation failed${NC}"
        echo -e "${YELLOW}💡 Make sure ExportOptions.plist is configured correctly${NC}"
    fi
    
    cd ../..
}

# Function to create ExportOptions.plist if it doesn't exist
create_export_options() {
    if [ ! -f "ios/App/build/ExportOptions.plist" ]; then
        echo -e "${BLUE}📝 Creating ExportOptions.plist...${NC}"
        mkdir -p ios/App/build
        
        cat > ios/App/build/ExportOptions.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>YOUR_TEAM_ID</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>destination</key>
    <string>export</string>
</dict>
</plist>
EOF
        
        echo -e "${YELLOW}⚠️ Please update ExportOptions.plist with your Team ID${NC}"
    fi
}

# Function to validate build
validate_build() {
    echo -e "${BLUE}🔍 Validating build...${NC}"
    
    # Check if iOS directory exists
    if [ ! -d "ios" ]; then
        echo -e "${RED}❌ iOS directory not found${NC}"
        return 1
    fi
    
    # Check if Xcode project exists
    if [ ! -f "ios/App/App.xcodeproj/project.pbxproj" ]; then
        echo -e "${RED}❌ Xcode project not found${NC}"
        return 1
    fi
    
    # Check if Info.plist has required permissions
    if ! grep -q "NSCameraUsageDescription" ios/App/App/Info.plist; then
        echo -e "${YELLOW}⚠️ Camera permission missing in Info.plist${NC}"
    fi
    
    if ! grep -q "NSMicrophoneUsageDescription" ios/App/App/Info.plist; then
        echo -e "${YELLOW}⚠️ Microphone permission missing in Info.plist${NC}"
    fi
    
    echo -e "${GREEN}✅ Build validation completed${NC}"
}

# Function to show build instructions
show_instructions() {
    echo -e "${BLUE}📋 iOS Build Instructions:${NC}"
    echo ""
    echo -e "${YELLOW}1. Development Build:${NC}"
    echo "   - Run: ./scripts/build-ios.sh --dev"
    echo "   - Opens Xcode for development and testing"
    echo ""
    echo -e "${YELLOW}2. TestFlight Build:${NC}"
    echo "   - Run: ./scripts/build-ios.sh --testflight"
    echo "   - Creates archive and IPA for App Store Connect"
    echo ""
    echo -e "${YELLOW}3. Manual Xcode Build:${NC}"
    echo "   - Run: ./scripts/build-ios.sh --xcode"
    echo "   - Just opens Xcode project"
    echo ""
    echo -e "${YELLOW}4. Prerequisites:${NC}"
    echo "   - macOS with Xcode installed"
    echo "   - Apple Developer account"
    echo "   - Provisioning profiles configured"
    echo "   - Signing certificates installed"
    echo ""
    echo -e "${YELLOW}5. TestFlight Deployment:${NC}"
    echo "   - Upload IPA to App Store Connect"
    echo "   - Add build to TestFlight"
    echo "   - Invite testers"
    echo ""
}

# Main script logic
case "${1:-}" in
    --dev)
        echo -e "${GREEN}🔧 Development build mode${NC}"
        check_xcode
        install_dependencies
        build_web
        sync_capacitor
        validate_build
        open_xcode
        ;;
    --testflight)
        echo -e "${GREEN}🚀 TestFlight build mode${NC}"
        check_xcode
        install_dependencies
        build_web
        sync_capacitor
        validate_build
        create_export_options
        build_for_device
        create_ipa
        echo -e "${GREEN}✅ TestFlight build completed!${NC}"
        echo -e "${YELLOW}📋 Next steps:${NC}"
        echo "1. Upload ios/App/build/App.ipa to App Store Connect"
        echo "2. Add the build to TestFlight"
        echo "3. Invite testers"
        ;;
    --xcode)
        echo -e "${GREEN}🍎 Opening Xcode project${NC}"
        install_dependencies
        build_web
        sync_capacitor
        open_xcode
        ;;
    --help)
        show_instructions
        ;;
    *)
        echo -e "${GREEN}🚀 Default build (development)${NC}"
        check_xcode
        install_dependencies
        build_web
        sync_capacitor
        validate_build
        open_xcode
        
        echo ""
        echo -e "${BLUE}ℹ️ For more options, run: ./scripts/build-ios.sh --help${NC}"
        ;;
esac

echo -e "${GREEN}🎉 iOS build process completed!${NC}"