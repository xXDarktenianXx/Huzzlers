// Pages/OtherUserProfile.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../AuthContext';
import firestore from '@react-native-firebase/firestore';

function Avatar({ initials, color, size = 80 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export default function OtherUserProfile({ route, navigation }) {
  const { userId } = route.params; // userId is the Firebase UID
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const doc = await firestore().collection('users').doc(userId).get();
        if (doc.exists) {
          setUserData(doc.data());
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleSendMessage = async () => {
    // Find a common request between current user and this other user
    try {
      const userRequests = await firestore()
        .collection('requests')
        .where('status', 'in', ['taken', 'pending_confirmation', 'completed'])
        .where('clientId', '==', user.uid)
        .get();
      const helpmateRequests = await firestore()
        .collection('requests')
        .where('status', 'in', ['taken', 'pending_confirmation', 'completed'])
        .where('helpmateId', '==', user.uid)
        .get();
      const allRequests = [...userRequests.docs, ...helpmateRequests.docs];
      const common = allRequests.find(doc => {
        const data = doc.data();
        return data.clientId === userId || data.helpmateId === userId;
      });
      if (common) {
        // Navigate to the Chat tab and pass the requestId
        // Use getParent() to access the root navigator (tab navigator)
        const parent = navigation.getParent();
        if (parent) {
          parent.navigate('Chat', {
            screen: 'ChatMain',
            params: { requestId: common.id },
          });
        } else {
          // Fallback: go directly (if inside the same stack? but not here)
          navigation.navigate('Chat', { requestId: common.id });
        }
      } else {
        Alert.alert('No Conversation', 'You have no ongoing or completed tasks with this user.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not open chat.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loader}><ActivityIndicator size="large" color="#1B2B4B" /></View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.container}>
          <Text>User not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullName = userData.fullName || 'Unknown';
  const initials = userData.initials || fullName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase();
  const isOwnProfile = user?.uid === userId;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatarSection}>
          <Avatar initials={initials} color="#1B2B4B" size={80} />
          <Text style={styles.fullName}>{fullName}</Text>
          <Text style={styles.userId}>ID: #{userData.userId || '???'}</Text>
        </View>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>📞 Phone</Text>
            <Text style={styles.infoValue}>{userData.phone || 'Not provided'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>✉️ Email</Text>
            <Text style={styles.infoValue}>{userData.email || 'Not provided'}</Text>
          </View>
        </View>
        {!isOwnProfile && (
          <TouchableOpacity style={styles.chatBtn} onPress={handleSendMessage}>
            <Text style={styles.chatBtnText}>💬  Send Message</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 44 : 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn: { paddingVertical: 4 },
  backArrow: { fontSize: 16, fontWeight: '700', color: '#1B2B4B' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1B2B4B' },
  container: { alignItems: 'center', paddingVertical: 30 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  fullName: { fontSize: 22, fontWeight: '900', color: '#1B2B4B', marginTop: 12 },
  userId: { fontSize: 14, color: '#666', marginTop: 4 },
  infoCard: { width: '90%', backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#f0f0f0', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 14, fontWeight: '700', color: '#888' },
  infoValue: { fontSize: 14, color: '#1B2B4B' },
  divider: { height: 1, backgroundColor: '#f3f3f3', marginVertical: 4 },
  chatBtn: { backgroundColor: '#1B2B4B', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 30, alignItems: 'center' },
  chatBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});