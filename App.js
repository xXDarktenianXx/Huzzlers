// App.js
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer, useRoute } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, Platform, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './AuthContext';

// Import all screens
import Home from './Pages/Home';
import Request from './Pages/Request';
import IndividualRequest from './Pages/IndividualRequest';
import AddRequest from './Pages/AddRequest';
import EditRequest from './Pages/EditRequest';
import Progress from './Pages/Progress';
import Chatbox from './Pages/Chatbox';
import Associate from './Pages/Associate';
import OtherUserProfile from './Pages/OtherUserProfile';
import Profile from './Pages/Profile';
import Login from './Pages/Login';
import SignUp from './Pages/Signup';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Hook to reset the current stack to its first screen when the same tab is pressed
function useTabPressReset(navigation, routeName, firstScreenName) {
  const route = useRoute();
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      if (route.name === routeName) {
        navigation.reset({
          index: 0,
          routes: [{ name: firstScreenName }],
        });
      }
    });
    return unsubscribe;
  }, [navigation, route.name, routeName, firstScreenName]);
}

// Home Stack
function HomeStack({ navigation }) {
  useTabPressReset(navigation, 'Home', 'HomeMain');
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={Home} />
      <Stack.Screen name="IndividualRequest" component={IndividualRequest} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Chatbox" component={Chatbox} />
    </Stack.Navigator>
  );
}

// Request Stack
function RequestStack({ navigation }) {
  useTabPressReset(navigation, 'Request', 'RequestList');
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RequestList" component={Request} />
      <Stack.Screen name="IndividualRequest" component={IndividualRequest} />
      <Stack.Screen name="AddRequest" component={AddRequest} />
      <Stack.Screen name="EditRequest" component={EditRequest} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Chatbox" component={Chatbox} />
    </Stack.Navigator>
  );
}

// Progress Stack
function ProgressStack({ navigation }) {
  useTabPressReset(navigation, 'Progress', 'ProgressMain');
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProgressMain" component={Progress} />
      <Stack.Screen name="Chatbox" component={Chatbox} />
      <Stack.Screen name="Profile" component={Profile} />
    </Stack.Navigator>
  );
}

// Chat Stack
function ChatStack({ navigation }) {
  useTabPressReset(navigation, 'Chat', 'ChatMain');
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatMain" component={Chatbox} />
      <Stack.Screen name="Profile" component={Profile} />
    </Stack.Navigator>
  );
}

// Associate Stack (includes OtherUserProfile)
function AssociateStack({ navigation }) {
  useTabPressReset(navigation, 'Associate', 'AssociateMain');
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AssociateMain" component={Associate} />
      <Stack.Screen name="OtherUserProfile" component={OtherUserProfile} />
      <Stack.Screen name="Profile" component={Profile} />
    </Stack.Navigator>
  );
}

// Tab icons mapping
const TAB_ICONS = {
  Home: '🏠',
  Request: '☰',
  Progress: '✓',
  Chat: '💬',
  Associate: '👤',
};

function TabIcon({ name, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 2 }}>
      <Text style={{ fontSize: focused ? 20 : 18, opacity: focused ? 1 : 0.45 }}>
        {TAB_ICONS[name]}
      </Text>
    </View>
  );
}

// Main Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#1B2B4B',
        tabBarInactiveTintColor: '#aaa',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f0f0f0',
          borderTopWidth: 1,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 22 : 45,
          height: Platform.OS === 'ios' ? 82 : 100,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: 2 },
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ title: 'Home' }} />
      <Tab.Screen name="Request" component={RequestStack} options={{ title: 'Request' }} />
      <Tab.Screen name="Progress" component={ProgressStack} options={{ title: 'Progress' }} />
      <Tab.Screen name="Chat" component={ChatStack} options={{ title: 'Chat' }} />
      <Tab.Screen name="Associate" component={AssociateStack} options={{ title: 'Associate' }} />
    </Tab.Navigator>
  );
}

// Authentication Stack (Login/Signup)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="SignUp" component={SignUp} />
    </Stack.Navigator>
  );
}

// Root navigator – decides whether to show MainTabs or AuthStack
function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1B2B4B" />
      </View>
    );
  }
  return user ? <MainTabs /> : <AuthStack />;
}

// App entry point
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}