// Pages/Associate.js
import React, { useState, useEffect } from 'react';
import {
  Image, View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, FlatList, TextInput, Modal,
  Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../AuthContext';
import firestore from '@react-native-firebase/firestore';

function Avatar({ initials, color, size = 44 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export default function Associate({ navigation }) {
  const { user, profile } = useAuth();
  const [associates, setAssociates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  useEffect(() => {
    if (!user) return;
    const fetchAssociates = async () => {
      try {
        // Get completed requests where user is client
        const clientRequests = await firestore()
          .collection('requests')
          .where('clientId', '==', user.uid)
          .where('status', '==', 'completed')
          .get();
        // Get completed requests where user is helpmate
        const helpmateRequests = await firestore()
          .collection('requests')
          .where('helpmateId', '==', user.uid)
          .where('status', '==', 'completed')
          .get();

        const associatesMap = new Map();

        clientRequests.forEach(doc => {
          const data = doc.data();
          if (data.helpmateId && data.helpmateName) {
            associatesMap.set(data.helpmateId, {
              id: data.helpmateId,
              name: data.helpmateName,
              initials: data.helpmateInitials || '?',
              phone: data.helpmatePhone,
              userId: data.helpmateUserId,
            });
          }
        });

        helpmateRequests.forEach(doc => {
          const data = doc.data();
          if (data.clientId && data.clientName) {
            associatesMap.set(data.clientId, {
              id: data.clientId,
              name: data.clientName,
              initials: data.clientInitials || '?',
              phone: data.clientPhone,
              userId: data.clientUserId,
            });
          }
        });

        setAssociates(Array.from(associatesMap.values()));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssociates();
  }, [user]);

  const handleAddAssociate = async () => {
    if (!searchId.trim()) return;
    const cleanId = searchId.trim().replace(/^#/, '');
    setSearchLoading(true);
    try {
      const usersSnap = await firestore()
        .collection('users')
        .where('userId', '==', cleanId)
        .limit(1)
        .get();
      if (usersSnap.empty) {
        Alert.alert('Not Found', 'No user with that ID. Please check and try again.');
        return;
      }
      const foundUser = usersSnap.docs[0];
      const userData = foundUser.data();
      navigation.navigate('OtherUserProfile', { userId: foundUser.id, userData });
      setModalVisible(false);
      setSearchId('');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not search for user.');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      <View style={styles.header}>
        <Image source={require('../Assets/HuzzlersLogo2.png')} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity style={styles.profileCircle} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
          <Text style={styles.profileInitials}>{initials}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Associates</Text>
        <Text style={styles.pageSubtitle}>People you've worked with</Text>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color="#1B2B4B" /></View>
      ) : associates.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👥</Text>
          <Text style={styles.emptyText}>No associates yet</Text>
          <Text style={styles.emptySubtext}>Complete tasks with others to see them here</Text>
        </View>
      ) : (
        <FlatList
          data={associates}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('OtherUserProfile', { userId: item.id })}
              activeOpacity={0.7}
            >
              <Avatar initials={item.initials || '?'} color="#1B2B4B" size={44} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}</Text>
                {item.phone && <Text style={styles.cardPhone}>{item.phone}</Text>}
                <Text style={styles.cardId}>ID: #{item.userId || '???'}</Text>
              </View>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.addBtnText}>+</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Associate</Text>
            <Text style={styles.modalSubtitle}>Enter Huzzler ID (e.g. #sa65x0)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.hashTag}>#</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="sa65x0"
                placeholderTextColor="#bbb"
                value={searchId}
                onChangeText={setSearchId}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleAddAssociate} disabled={searchLoading}>
                <Text style={styles.modalSubmitText}>{searchLoading ? 'Searching...' : 'Find'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 44 : 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  logo: { width: 130, height: 40 },
  profileCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1B2B4B', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#1B2B4B' },
  profileInitials: { fontSize: 13, fontWeight: '800', color: '#fff' },
  titleRow: { paddingHorizontal: 20, paddingBottom: 12 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#1B2B4B' },
  pageSubtitle: { fontSize: 13, color: '#999', marginTop: 2 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: '#aaa', textAlign: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 15, fontWeight: '800', color: '#1B2B4B', marginBottom: 2 },
  cardPhone: { fontSize: 13, color: '#555', marginBottom: 2 },
  cardId: { fontSize: 12, color: '#888' },
  separator: { height: 1, backgroundColor: '#f5f5f5', marginLeft: 70 },
  addBtn: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: '#1B2B4B', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  addBtnText: { fontSize: 28, color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', backgroundColor: '#fff', borderRadius: 20, padding: 20, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1B2B4B', marginBottom: 8 },
  modalSubtitle: { fontSize: 13, color: '#666', marginBottom: 16 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10, width: '100%', marginBottom: 20, paddingHorizontal: 12, backgroundColor: '#fafafa' },
  hashTag: { fontSize: 16, color: '#1B2B4B', fontWeight: '700', marginRight: 8 },
  modalInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#222' },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalCancelText: { fontWeight: '700', color: '#555' },
  modalSubmit: { flex: 1, backgroundColor: '#1B2B4B', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  modalSubmitText: { fontWeight: '700', color: '#fff' },
});