// Pages/Profile.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
  Image, ScrollView, Alert, Platform,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../AuthContext';

export default function Profile({ navigation }) {
  const { user, profile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [address, setAddress] = useState(profile?.address || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  const fullName = profile?.fullName || 'No Name';
  const email = profile?.email || user?.email || '—';
  const userId = profile?.userId || '••••••';

  const initials = fullName
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSave = async () => {
    try {
      await firestore().collection('users').doc(user.uid).update({
        address: address.trim(),
        phone: phone.trim(),
      });
      setIsEditing(false);
      Alert.alert('Saved!', 'Your profile has been updated.');
    } catch (error) {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => auth().signOut(),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Image source={require('../Assets/HuzzlersLogo2.png')} style={styles.logo} resizeMode="contain" />
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
            <View style={styles.editDot}>
              <Text style={styles.editDotText}>✏️</Text>
            </View>
          </View>
          <Text style={styles.fullName}>{fullName}</Text>
          <Text style={styles.userId}>ID: #{userId}</Text>
        </View>

        <Text style={styles.sectionHeader}>ACCOUNT</Text>

        <View style={styles.fieldsCard}>
          {/* Location */}
          <View style={styles.fieldRow}>
            <View style={styles.fieldIconBox}>
              <Text style={styles.fieldIcon}>📍</Text>
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Location</Text>
              {isEditing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter your address"
                  placeholderTextColor="#bbb"
                />
              ) : (
                <Text style={styles.fieldValue}>{address || '—'}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Phone Number */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldIconBox, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.fieldIcon}>📞</Text>
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              {isEditing ? (
                <TextInput
                  style={styles.fieldInput}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="Enter your phone number"
                  placeholderTextColor="#bbb"
                />
              ) : (
                <Text style={styles.fieldValue}>{phone || '—'}</Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Email (read only) */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldIconBox, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.fieldIcon}>✉️</Text>
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <Text style={styles.fieldValue}>{email}</Text>
            </View>
          </View>
        </View>

        {isEditing ? (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.75}>
          <View style={[styles.fieldIconBox, { backgroundColor: '#FDECEA' }]}>
            <Text style={styles.fieldIcon}>🚪</Text>
          </View>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 44 : 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f3f3' },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 32, color: '#1B2B4B', fontWeight: '300', lineHeight: 36 },
  logo: { width: 130, height: 40 },
  headerSpacer: { width: 36 },
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatarCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#1B2B4B', justifyContent: 'center', alignItems: 'center', marginBottom: 12, position: 'relative' },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  editDot: { position: 'absolute', bottom: 2, right: 2, width: 24, height: 24, borderRadius: 12, backgroundColor: '#E8652A', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  editDotText: { fontSize: 10 },
  fullName: { fontSize: 20, fontWeight: '900', color: '#1B2B4B' },
  userId: { fontSize: 14, color: '#666', marginTop: 4 },
  sectionHeader: { fontSize: 11, fontWeight: '800', color: '#aaa', letterSpacing: 0.8, paddingHorizontal: 20, marginBottom: 8 },
  fieldsCard: { marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#f0f0f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, marginBottom: 16 },
  fieldRow: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  fieldIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  fieldIcon: { fontSize: 16 },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#aaa', marginBottom: 3 },
  fieldValue: { fontSize: 14, color: '#1B2B4B', fontWeight: '500', lineHeight: 20 },
  fieldInput: { fontSize: 14, color: '#1B2B4B', borderBottomWidth: 1.5, borderBottomColor: '#1B2B4B', paddingVertical: 4 },
  divider: { height: 1, backgroundColor: '#f3f3f3', marginLeft: 62 },
  editBtn: { marginHorizontal: 16, borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10, backgroundColor: '#fafafa' },
  editBtnText: { color: '#555', fontWeight: '700', fontSize: 15 },
  saveBtn: { marginHorizontal: 16, backgroundColor: '#1B2B4B', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f0f0f0', gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  signOutText: { fontSize: 15, fontWeight: '700', color: '#E85757' },
});