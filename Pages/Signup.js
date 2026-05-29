// Pages/Signup.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
  Image, KeyboardAvoidingView, Platform,
  ScrollView, Alert,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Helper to generate a random 6‑character alphanumeric string (excluding similar chars)
const generateUserId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function SignUp({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAccount = async () => {
    if (!fullName || !email || !phone || !address || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const userCred = await auth().createUserWithEmailAndPassword(email.trim(), password);
      // Generate a unique user ID (check for uniqueness)
      let userId = generateUserId();
      let unique = false;
      while (!unique) {
        const existing = await firestore().collection('users').where('userId', '==', userId).get();
        if (existing.empty) {
          unique = true;
        } else {
          userId = generateUserId();
        }
      }

      await firestore().collection('users').doc(userCred.user.uid).set({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        userId: userId,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      await auth().signOut();
      Alert.alert('Success!', `Account created. Your Huzzler ID is: #${userId}\nPlease log in.`, [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      let msg = 'Something went wrong. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        msg = 'That email is already registered.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      Alert.alert('Sign Up Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Image source={require('../Assets/HuzzlersLogo2.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Become a Huzzler now!</Text>
          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#bbb" value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#bbb" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#bbb" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Present Address" placeholderTextColor="#bbb" value={address} onChangeText={setAddress} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#bbb" value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#bbb" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          <TouchableOpacity style={[styles.createBtn, loading && { opacity: 0.7 }]} onPress={handleCreateAccount} activeOpacity={0.85} disabled={loading}>
            <Text style={styles.createBtnText}>{loading ? 'Creating Account...' : 'Create Account'}</Text>
          </TouchableOpacity>
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Already have an account?  </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 44 : 40 },
  container: { paddingHorizontal: 32, paddingTop: 60 },
  logo: { width: 180, height: 72, marginBottom: 28 },
  title: { fontSize: 20, fontWeight: '800', color: '#1B2B4B', marginBottom: 22 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, fontSize: 14, color: '#222', backgroundColor: '#fafafa', marginBottom: 12 },
  createBtn: { backgroundColor: '#1B2B4B', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 4, marginBottom: 24 },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  bottomText: { fontSize: 13, color: '#999' },
  linkText: { fontSize: 13, fontWeight: '800', color: '#1B2B4B' },
});