// Pages/Progress.js
import React, { useState, useEffect } from 'react';
import {
  Image, View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, ScrollView, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../AuthContext';
import firestore from '@react-native-firebase/firestore';

function Avatar({ initials, color, size = 40 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export default function Progress({ navigation }) {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('myRequests');
  const [myRequests, setMyRequests] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const getClientInfo = (request) => {
    if (request.clientName && request.clientInitials) {
      return {
        name: request.clientName,
        initials: request.clientInitials,
        phone: request.clientPhone || '',
      };
    }
    if (request.clientId === user?.uid && profile?.fullName) {
      const fallbackInitials = profile.fullName
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      return {
        name: profile.fullName,
        initials: fallbackInitials,
        phone: profile.phone || '',
      };
    }
    return { name: 'Unknown', initials: '?', phone: '' };
  };

  // 1. My Requests (client's own open or taken)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = firestore()
      .collection('requests')
      .where('clientId', '==', user.uid)
      .where('status', 'in', ['open', 'taken'])
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        setMyRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });
    return unsubscribe;
  }, [user]);

  // 2. My Tasks (helpmate's taken – in progress)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = firestore()
      .collection('requests')
      .where('helpmateId', '==', user.uid)
      .where('status', '==', 'taken')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        setMyTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      });
    return unsubscribe;
  }, [user]);

  // 3. Pending Tasks – real‑time for both client and helpmate
  useEffect(() => {
    if (!user) return;
    let combined = [];

    const updatePending = () => {
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      unique.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
      setPendingTasks(unique);
    };

    const unsubscribeClient = firestore()
      .collection('requests')
      .where('clientId', '==', user.uid)
      .where('status', '==', 'pending_confirmation')
      .onSnapshot(snapshot => {
        const clientPending = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        combined = [...clientPending, ...combined.filter(item => item.helpmateId === user.uid)];
        updatePending();
      });

    const unsubscribeHelpmate = firestore()
      .collection('requests')
      .where('helpmateId', '==', user.uid)
      .where('status', '==', 'pending_confirmation')
      .onSnapshot(snapshot => {
        const helpmatePending = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        combined = [...combined.filter(item => item.clientId === user.uid), ...helpmatePending];
        updatePending();
      });

    return () => {
      unsubscribeClient();
      unsubscribeHelpmate();
    };
  }, [user]);

  // 4. Completed Tasks – real‑time for both client and helpmate
  useEffect(() => {
    if (!user) return;
    let combined = [];

    const updateCompleted = () => {
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      unique.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
      setCompletedTasks(unique);
    };

    const unsubscribeClient = firestore()
      .collection('requests')
      .where('clientId', '==', user.uid)
      .where('status', '==', 'completed')
      .onSnapshot(snapshot => {
        const clientCompleted = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        combined = [...clientCompleted, ...combined.filter(item => item.helpmateId === user.uid)];
        updateCompleted();
      });

    const unsubscribeHelpmate = firestore()
      .collection('requests')
      .where('helpmateId', '==', user.uid)
      .where('status', '==', 'completed')
      .onSnapshot(snapshot => {
        const helpmateCompleted = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        combined = [...combined.filter(item => item.clientId === user.uid), ...helpmateCompleted];
        updateCompleted();
      });

    return () => {
      unsubscribeClient();
      unsubscribeHelpmate();
    };
  }, [user]);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);
  const formatDateTime = (dateStr, timeStr) => dateStr && timeStr ? `${dateStr} at ${timeStr}` : (dateStr || 'Not set');

  const getStatusText = (status) => {
    if (status === 'open') return 'Open';
    if (status === 'taken') return 'In Progress';
    if (status === 'pending_confirmation') return 'Waiting for confirmation';
    if (status === 'completed') return 'Completed';
    return status;
  };

  // Client actions
  const handleConfirmCompletion = async (request) => {
    Alert.alert('Confirm', `Did ${request.helpmateName} complete "${request.task}"?`, [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', onPress: async () => {
          await firestore().collection('requests').doc(request.id).update({ status: 'completed' });
          Alert.alert('Done', 'Task completed.');
        }
      }
    ]);
  };

  const handleDeclineCompletion = async (request) => {
    Alert.alert('Decline', `Decline completion for "${request.task}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: async () => {
          await firestore().collection('requests').doc(request.id).update({ status: 'taken' });
          Alert.alert('Declined', 'Task remains in progress.');
        }
      }
    ]);
  };

  // Helpmate actions
  const handleFinishTask = async (request) => {
    Alert.alert('Finish Task', `Mark "${request.task}" as finished?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Finish', onPress: async () => {
          await firestore().collection('requests').doc(request.id).update({ status: 'pending_confirmation' });
          Alert.alert('Done', 'Waiting for client confirmation.');
        }
      }
    ]);
  };

  const handleDropTask = async (request) => {
    Alert.alert('Drop Task', `Drop "${request.task}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Drop', style: 'destructive', onPress: async () => {
          await firestore().collection('requests').doc(request.id).update({ helpmateId: null, helpmateName: null, helpmateInitials: null, helpmatePhone: null, status: 'open' });
          Alert.alert('Dropped', 'Task is now available again.');
        }
      }
    ]);
  };

  const renderItem = (item, type) => {
    let displayName, displayPhone, displayInitials, displayColor;
    const isClientRequest = type === 'myRequests';
    const isHelpmateTask = type === 'myTasks';
    const isPending = type === 'pending';
    const isCompleted = type === 'completed';

    // Determine which person to show based on user role
    if (isClientRequest || isPending || isCompleted) {
      // For client views (My Request, Pending, Completed) – show helpmate if exists, else client
      if (item.helpmateName) {
        displayName = item.helpmateName;
        displayPhone = item.helpmatePhone;
        displayInitials = item.helpmateInitials;
      } else {
        const clientInfo = getClientInfo(item);
        displayName = clientInfo.name;
        displayPhone = clientInfo.phone;
        displayInitials = clientInfo.initials;
      }
    } else {
      // For helpmate views (My Tasks) – always show client info
      const clientInfo = getClientInfo(item);
      displayName = clientInfo.name;
      displayPhone = clientInfo.phone;
      displayInitials = clientInfo.initials;
    }

    // Override for Pending/Completed when user is the client – we already did above, but special case:
    // Actually, the above logic for isPending already uses item.helpmateName, which is correct.
    // For helpmate viewing Pending, we need to show client name, not helpmate name.
    // The current isClientRequest block does not cover helpmate as the viewer.
    // So we add a specific check for Pending/Completed where the logged-in user is the helpmate.
    if ((isPending || isCompleted) && item.helpmateId === user?.uid) {
      // Helpmate is viewing the pending/completed task – show client info
      const clientInfo = getClientInfo(item);
      displayName = clientInfo.name;
      displayPhone = clientInfo.phone;
      displayInitials = clientInfo.initials;
    }

    displayColor = item.type === 'Basic' ? '#E8652A' : '#1B2B4B';
    const statusText = getStatusText(item.status);

    return (
      <View key={item.id} style={styles.cardWrapper}>
        <TouchableOpacity style={styles.card} onPress={() => toggleExpand(item.id)} activeOpacity={0.7}>
          <Avatar initials={displayInitials || '?'} color={displayColor} size={42} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{displayName}</Text>
            {displayPhone && <Text style={styles.cardPhone}>{displayPhone}</Text>}
            <Text style={styles.cardTask}>{item.task}</Text>
            <Text style={styles.cardRate}>₱ {item.rate}</Text>
            <Text style={styles.cardStatus}>Status: {statusText}</Text>
          </View>
          <Text style={styles.expandIcon}>{expandedId === item.id ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {expandedId === item.id && (
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>☰</Text>
              <View><Text style={styles.detailLabel}>TASK</Text><Text style={styles.detailValue}>{item.task}</Text></View>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailIcon}>📅</Text>
              <View>
                <Text style={styles.detailLabel}>REQUEST DATE & TIME</Text>
                <Text style={styles.detailValue}>{formatDateTime(item.dateReq, item.timeReq)}</Text>
                <Text style={styles.expText}>Expires on {formatDateTime(item.dateExp, item.timeExp)}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <Text style={styles.descLabel}>DESCRIPTION</Text>
            <Text style={styles.descText}>{item.description}</Text>

            {(isPending || isCompleted) && item.clientId === user?.uid && (
              <View style={styles.confirmBox}>
                <Text style={styles.confirmQuestion}>Did {item.helpmateName} complete the task?</Text>
                <View style={styles.confirmBtnRow}>
                  <TouchableOpacity style={styles.declineBtn} onPress={() => handleDeclineCompletion(item)}><Text style={styles.declineBtnText}>Decline</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={() => handleConfirmCompletion(item)}><Text style={styles.confirmBtnText}>Confirm</Text></TouchableOpacity>
                </View>
              </View>
            )}

            {isHelpmateTask && item.status === 'taken' && (
              <>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.dropBtn} onPress={() => handleDropTask(item)}><Text style={styles.dropBtnText}>Drop Task</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.finishBtn} onPress={() => handleFinishTask(item)}><Text style={styles.finishBtnText}>Finish Task</Text></TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.chatFromTaskBtn} onPress={() => navigation.navigate('Chatbox', { requestId: item.id, otherUserId: item.clientId, otherUserName: item.clientName, otherUserInitials: item.clientInitials })}>
                  <Text style={styles.chatFromTaskBtnText}>💬 Chat Client</Text>
                </TouchableOpacity>
              </>
            )}

            {(isPending || isCompleted) && (
              <TouchableOpacity style={styles.chatFromTaskBtn} onPress={() => navigation.navigate('Chatbox', { requestId: item.id, otherUserId: item.clientId === user?.uid ? item.helpmateId : item.clientId, otherUserName: displayName, otherUserInitials: displayInitials })}>
                <Text style={styles.chatFromTaskBtnText}>💬 Chat</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading && !myRequests.length && !myTasks.length && !pendingTasks.length && !completedTasks.length) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
        <View style={styles.header}>
          <Image source={require('../Assets/HuzzlersLogo2.png')} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity style={styles.profileCircle} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
            <Text style={styles.profileInitials}>{initials}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loader}><ActivityIndicator size="large" color="#1B2B4B" /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      <View style={styles.header}>
        <Image source={require('../Assets/HuzzlersLogo2.png')} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity style={styles.profileCircle} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
          <Text style={styles.profileInitials}>{initials}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.pageTitle}>Progress</Text>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab === 'myRequests' && styles.tabActive]} onPress={() => setActiveTab('myRequests')}>
          <Text style={[styles.tabText, activeTab === 'myRequests' && styles.tabTextActive]}>My Request</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'myTasks' && styles.tabActive]} onPress={() => setActiveTab('myTasks')}>
          <Text style={[styles.tabText, activeTab === 'myTasks' && styles.tabTextActive]}>My Task</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'pending' && styles.tabActive]} onPress={() => setActiveTab('pending')}>
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'completed' && styles.tabActive]} onPress={() => setActiveTab('completed')}>
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>Completed</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {activeTab === 'myRequests' && (myRequests.length === 0 ? <EmptyState icon="📋" text="No active requests" subtext="Tap + Add Request to create one" /> : myRequests.map(item => renderItem(item, 'myRequests')))}
        {activeTab === 'myTasks' && (myTasks.length === 0 ? <EmptyState icon="⚡" text="No active tasks" subtext="Accept a request to get started" /> : myTasks.map(item => renderItem(item, 'myTasks')))}
        {activeTab === 'pending' && (pendingTasks.length === 0 ? <EmptyState icon="⏳" text="No pending confirmations" subtext="Tasks waiting for approval will appear here" /> : pendingTasks.map(item => renderItem(item, 'pending')))}
        {activeTab === 'completed' && (completedTasks.length === 0 ? <EmptyState icon="✅" text="No completed tasks" subtext="Completed tasks will appear here" /> : completedTasks.map(item => renderItem(item, 'completed')))}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const EmptyState = ({ icon, text, subtext }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.emptyText}>{text}</Text>
    <Text style={styles.emptySubtext}>{subtext}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f7f8fa', paddingTop: Platform.OS === 'ios' ? 44 : 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#fff' },
  logo: { width: 130, height: 40 },
  profileCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1B2B4B', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#1B2B4B' },
  profileInitials: { fontSize: 13, fontWeight: '800', color: '#fff' },
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#1B2B4B', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff' },
  tabRow: { flexDirection: 'row', backgroundColor: '#f0f0f0', marginHorizontal: 20, borderRadius: 12, padding: 4, marginBottom: 16, flexWrap: 'wrap' },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center', minWidth: 80 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 12, fontWeight: '700', color: '#999' },
  tabTextActive: { color: '#1B2B4B' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardWrapper: { marginBottom: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardName: { fontSize: 15, fontWeight: '800', color: '#1B2B4B', marginBottom: 2 },
  cardPhone: { fontSize: 12, color: '#666', marginBottom: 2 },
  cardTask: { fontSize: 13, color: '#444', marginBottom: 2 },
  cardRate: { fontSize: 14, fontWeight: '700', color: '#2A9D4E', marginBottom: 2 },
  cardStatus: { fontSize: 12, color: '#888' },
  expandIcon: { fontSize: 16, color: '#999', marginLeft: 8 },
  detailCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 4, marginBottom: 4, borderWidth: 1, borderColor: '#e8e8e8' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  detailIcon: { fontSize: 18, marginTop: 2 },
  detailLabel: { fontSize: 10, fontWeight: '800', color: '#aaa', letterSpacing: 0.5, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1B2B4B' },
  expText: { fontSize: 12, color: '#E85757', fontWeight: '600', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#f3f3f3', marginVertical: 10 },
  descLabel: { fontSize: 10, fontWeight: '800', color: '#aaa', letterSpacing: 0.5, marginBottom: 6 },
  descText: { fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 12 },
  confirmBox: { alignItems: 'center', paddingTop: 4, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 12 },
  confirmQuestion: { fontSize: 14, fontWeight: '700', color: '#1B2B4B', marginBottom: 8 },
  confirmBtnRow: { flexDirection: 'row', gap: 12, width: '100%' },
  declineBtn: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  declineBtnText: { fontWeight: '700', color: '#555', fontSize: 14 },
  confirmBtn: { flex: 1, backgroundColor: '#1B2B4B', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  confirmBtnText: { fontWeight: '800', color: '#fff', fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  dropBtn: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  dropBtnText: { fontWeight: '700', color: '#555', fontSize: 14 },
  finishBtn: { flex: 1, backgroundColor: '#1B2B4B', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  finishBtnText: { fontWeight: '800', color: '#fff', fontSize: 14 },
  chatFromTaskBtn: { marginTop: 12, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fafafa' },
  chatFromTaskBtnText: { color: '#1B2B4B', fontWeight: '700', fontSize: 14 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: '#aaa' },
});