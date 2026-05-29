export default {
  name: 'Huzzlers',
  slug: 'huzzlers',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './Assets/HomeScreenLogo.png',
  splash: {
    image: './Assets/HuzzlersLogo2.png',
    resizeMode: 'contain',
    backgroundColor: '#1B2B4B',
  },
  android: {
    package: "com.huzzlers.app",
    googleServicesFile: "./google-services.json",
    config: {
      googleMaps: {
        apiKey: "AIzaSyBmkIfuxwUFL2zJgDXU8-F8aC7QJMT339E",
      },
    },
  },
  ios: {
    config: {
      googleMapsApiKey: "AIzaSyBmkIfuxwUFL2zJgDXU8-F8aC7QJMT339E",
    },
  },
  plugins: [
    "@react-native-firebase/app",
    "@react-native-firebase/auth",
    "@react-native-community/datetimepicker",
  ],
  // ADD THIS SECTION:
  extra: {
    eas: {
      projectId: "5155ff16-ee8d-4274-aaa3-0e9f37cd6bb5"
    }
  }
};