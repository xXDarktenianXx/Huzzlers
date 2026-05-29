// Pages/Home.js
import React, { useState, useEffect } from 'react';
import {
  Image, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Platform, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '../AuthContext';
import firestore from '@react-native-firebase/firestore';

function Avatar({ initials, color, size = 42 }) {
  return (
    <View style={[styles.avatar, { backgroundColor: color, width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

export default function Home({ navigation }) {
  const { profile } = useAuth();
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

  // Coordinates for Mandaue City, Cebu (City Hall)
  const mandaueRegion = {
    latitude: 10.3236,
    longitude: 123.9221,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />

      <View style={styles.header}>
        <Image source={require('../Assets/HuzzlersLogo2.png')} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity
          style={styles.profileCircle}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}>
          <Text style={styles.profileInitials}>{initials}</Text>
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mandaueRegion}
          showsUserLocation={false}
          mapType="terrain"
        >
          <Marker
            coordinate={{ latitude: 10.3236, longitude: 123.9221 }}
            title="Mandaue City Hall"
            description="Center of Mandaue City"
          />
        </MapView>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>Requests near you</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Request')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#1B2B4B" />
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No requests nearby</Text>
              <Text style={styles.emptySubtext}>Check back later or add a request</Text>
            </View>
          ) : (
            requests.slice(0, 5).map((req) => (
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
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 44 : 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  logo: { width: 130, height: 40 },
  profileCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1B2B4B', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#1B2B4B' },
  profileInitials: { fontSize: 13, fontWeight: '800', color: '#fff' },
  mapContainer: { height: 200, marginHorizontal: 16, borderRadius: 14, overflow: 'hidden', marginBottom: 16, backgroundColor: '#f0f0f0' },
  map: { flex: 1 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  sectionLabel: { fontSize: 15, fontWeight: '800', color: '#1B2B4B' },
  seeAll: { fontSize: 13, fontWeight: '700', color: '#E8652A' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3, borderWidth: 1, borderColor: '#f2f2f2' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 14, fontWeight: '800', color: '#1B2B4B', marginBottom: 1 },
  cardDist: { fontSize: 12, color: '#999', marginBottom: 3 },
  cardSubject: { fontSize: 13, color: '#555' },
  cardRate: { fontSize: 15, fontWeight: '800', color: '#2A9D4E' },
  avatar: { justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: '#aaa' },
});