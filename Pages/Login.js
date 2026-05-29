// Pages/Login.js

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
  Image, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';

export default function Login({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email.trim(), password);
      // RootNavigator in App.js automatically redirects to MainTabs
    } catch (error) {
      let msg = 'Something went wrong. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        msg = 'Incorrect email or password.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Image source={require('../Assets/HuzzlersLogo2.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>Login to your Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#bbb"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#bbb"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.signInBtn, loading && { opacity: 0.7 }]}
          onPress={handleSignIn}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={styles.signInText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Don't have an account?  </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.linkText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#fff' },
  container:  { flex: 1, paddingHorizontal: 32, justifyContent: 'center' },
  logo:       { width: 180, height: 72, marginBottom: 32, alignSelf: 'center' },
  title:      { fontSize: 22, fontWeight: '800', color: '#1B2B4B', marginBottom: 24 },
  input: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 14, color: '#222', backgroundColor: '#fafafa', marginBottom: 12,
  },
  signInBtn: {
    backgroundColor: '#1B2B4B', borderRadius: 10,
    paddingVertical: 15, alignItems: 'center', marginTop: 4, marginBottom: 24,
  },
  signInText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  bottomRow:  { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  bottomText: { fontSize: 13, color: '#999' },
  linkText:   { fontSize: 13, fontWeight: '800', color: '#1B2B4B' },
});