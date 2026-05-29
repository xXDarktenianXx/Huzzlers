// Pages/IndividualRequest.js
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Alert, Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../AuthContext';

function Avatar({ initials, color, size = 42 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export default function IndividualRequest({ route, navigation }) {
  const { user, profile } = useAuth();
  const request = route?.params?.request;
  if (!request) {
    navigation.goBack();
    return null;
  }

  const isOwnRequest = user?.uid === request.clientId;

  const handleAccept = async () => {
    if (isOwnRequest) {
      Alert.alert('Cannot accept', 'You cannot accept your own request.');
      return;
    }
    Alert.alert(
      'Accept Task',
      `Accept "${request.task}" from ${request.clientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              const helpmateInitials = profile?.fullName
                ? profile.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                : '?';
              await firestore().collection('requests').doc(request.id).update({
                helpmateId: user?.uid,
                helpmateName: profile?.fullName,
                helpmateInitials,
                helpmatePhone: profile?.phone || '',
                status: 'taken',
                takenAt: firestore.FieldValue.serverTimestamp(),
              });
              Alert.alert('Success!', 'Task added to your Progress.', [
                { text: 'OK', onPress: () => navigation.navigate('Progress') }
              ]);
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Could not accept task. Please try again.');
            }
          },
        },
      ]
    );
  };

  const displayDate = request.dateReq && request.timeReq ? `${request.dateReq} | ${request.timeReq}` : 'Not specified';
  const displayExpiration = request.dateExp && request.timeExp ? `${request.dateExp} at ${request.timeExp}` : 'Not set';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹ Requests</Text>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        <View style={styles.clientCard}>
          <Avatar initials={request.clientInitials || '?'} color={request.type === 'Basic' ? '#E8652A' : '#1B2B4B'} size={44} />
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{request.clientName}</Text>
            {request.clientPhone && <Text style={styles.clientPhone}>{request.clientPhone}</Text>}
            <Text style={styles.clientDist}>{request.distance || '?'} away</Text>
          </View>
          <Text style={styles.clientRate}>₱ {request.rate}</Text>
        </View>
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}><Text style={styles.detailIcon}>☰</Text></View>
            <View>
              <Text style={styles.detailRowLabel}>TASK</Text>
              <Text style={styles.detailRowValue}>{request.task}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={[styles.detailIconBox, { backgroundColor: '#EAF4FF' }]}><Text style={styles.detailIcon}>📅</Text></View>
            <View>
              <Text style={styles.detailRowLabel}>DATE AND TIME OF REQUEST</Text>
              <Text style={styles.detailRowValue}>{displayDate}</Text>
              <Text style={styles.expText}>Expires on {displayExpiration}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.descLabel}>DESCRIPTION</Text>
          <Text style={styles.descText}>{request.description}</Text>
        </View>

        <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('Chatbox', { requestId: request.id, otherUserId: request.clientId, otherUserName: request.clientName, otherUserInitials: request.clientInitials })}>
          <Text style={styles.chatBtnText}>💬  Chat Client</Text>
        </TouchableOpacity>

        {!isOwnRequest && (
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept} activeOpacity={0.85}>
            <Text style={styles.acceptBtnText}>Accept Task</Text>
          </TouchableOpacity>
        )}
        {isOwnRequest && (
          <View style={styles.ownRequestWarning}>
            <Text style={styles.ownRequestText}>⚠️ You cannot accept your own request</Text>
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f8fa', paddingTop: Platform.OS === 'ios' ? 44 : 40 },
  header: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn: { paddingVertical: 2 },
  backArrow: { fontSize: 15, fontWeight: '700', color: '#1B2B4B' },
  scroll: { flex: 1, padding: 16 },
  clientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  clientInfo: { flex: 1, marginLeft: 12 },
  clientName: { fontSize: 15, fontWeight: '800', color: '#1B2B4B' },
  clientPhone: { fontSize: 12, color: '#666', marginTop: 2 },
  clientDist: { fontSize: 12, color: '#999', marginTop: 2 },
  clientRate: { fontSize: 16, fontWeight: '800', color: '#2A9D4E' },
  detailCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  detailIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#F0F4F0', justifyContent: 'center', alignItems: 'center' },
  detailIcon: { fontSize: 16 },
  detailRowLabel: { fontSize: 10, fontWeight: '800', color: '#aaa', letterSpacing: 0.5, marginBottom: 2 },
  detailRowValue: { fontSize: 14, fontWeight: '600', color: '#1B2B4B' },
  expText: { fontSize: 12, color: '#E85757', marginTop: 2, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f3f3f3', marginVertical: 12 },
  descLabel: { fontSize: 10, fontWeight: '800', color: '#aaa', letterSpacing: 0.5, marginBottom: 8 },
  descText: { fontSize: 14, color: '#444', lineHeight: 22 },
  chatBtn: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 10, backgroundColor: '#fff' },
  chatBtnText: { color: '#555', fontWeight: '700', fontSize: 15 },
  acceptBtn: { backgroundColor: '#1B2B4B', borderRadius: 12, paddingVertical: 16, alignItems: 'center', shadowColor: '#1B2B4B', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  acceptBtnText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  ownRequestWarning: { backgroundColor: '#FFFBEA', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FFD700', marginTop: 10 },
  ownRequestText: { fontSize: 13, color: '#7A6000', textAlign: 'center' },
});