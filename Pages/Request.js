// Pages/Request.js
import React, { useState, useEffect } from 'react';
import {
  Image, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../AuthContext';
import firestore from '@react-native-firebase/firestore';

const FILTERS = ['All', 'Nearby', 'Basic', 'Professional'];

function Avatar({ initials, color, size = 42 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export default function Request({ navigation }) {
  const { profile } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('requests')
      .where('status', '==', 'open')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRequests(data);
        setLoading(false);
      }, error => {
        console.error(error);
        setLoading(false);
      });
    return unsubscribe;
  }, []);

  const filtered = requests.filter(req => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Nearby') return true; // TODO: implement geolocation
    if (activeFilter === 'Basic') return req.type === 'Basic';
    if (activeFilter === 'Professional') return req.type === 'Professional';
    return true;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />

      <View style={styles.header}>
        <Image source={require('../Assets/HuzzlersLogo2.png')} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity style={styles.profileCircle} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
          <Text style={styles.profileInitials}>{initials}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterContent}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
            onPress={() => setActiveFilter(f)}>
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1B2B4B" />
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No requests found</Text>
              <Text style={styles.emptySubtext}>Be the first to post a request!</Text>
            </View>
          ) : (
            filtered.map(req => (
              <TouchableOpacity
                key={req.id}
                style={styles.card}
                onPress={() => navigation.navigate('IndividualRequest', { request: req })}
                activeOpacity={0.7}>
                <Avatar initials={req.clientInitials || '?'} color={req.type === 'Basic' ? '#E8652A' : '#1B2B4B'} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{req.clientName}</Text>
                  <Text style={styles.cardDist}>{req.distance || '0m'} away</Text>
                  <Text style={styles.cardSubject}>{req.task}</Text>
                </View>
                <Text style={styles.cardRate}>₱ {req.rate}</Text>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      <View style={styles.addBtnContainer}>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddRequest')} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>+ Add Request</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 44 : 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  logo: { width: 130, height: 40 },
  profileCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1B2B4B', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#1B2B4B' },
  profileInitials: { fontSize: 13, fontWeight: '800', color: '#fff' },
  filterBar: { maxHeight: 50, paddingBottom: 4 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filterPill: { paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#e8e8e8' },
  filterPillActive: { backgroundColor: '#1B2B4B', borderColor: '#1B2B4B' },
  filterText: { fontSize: 13, fontWeight: '700', color: '#888' },
  filterTextActive: { color: '#fff' },
  scroll: { flex: 1, paddingHorizontal: 20, marginTop: 8 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#f2f2f2' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 14, fontWeight: '800', color: '#1B2B4B', marginBottom: 1 },
  cardDist: { fontSize: 12, color: '#999', marginBottom: 3 },
  cardSubject: { fontSize: 13, color: '#555' },
  cardRate: { fontSize: 15, fontWeight: '800', color: '#2A9D4E' },
  addBtnContainer: { position: 'absolute', bottom: 12, left: 20, right: 20 },
  addBtn: { backgroundColor: '#1B2B4B', borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: '#1B2B4B', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: '#aaa' },
});