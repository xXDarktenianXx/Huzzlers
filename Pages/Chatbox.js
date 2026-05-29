// Pages/Chatbox.js
import React, { useState, useEffect } from 'react';
import {
  Image, View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, FlatList, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../AuthContext';
import firestore from '@react-native-firebase/firestore';

const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString();
};

function Avatar({ initials, color, size = 44 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export default function Chatbox({ navigation, route }) {
  const { user, profile } = useAuth();
  const initialRequestId = route?.params?.requestId;
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const isDirectOpen = !!initialRequestId;

  // Helper to get the other party info from a request
  const getOtherParty = (request, currentUserId) => {
    if (request.clientId === currentUserId) {
      return {
        id: request.helpmateId,
        name: request.helpmateName || 'Unknown',
        initials: request.helpmateInitials || '?',
        phone: request.helpmatePhone,
      };
    } else {
      return {
        id: request.clientId,
        name: request.clientName,
        initials: request.clientInitials,
        phone: request.clientPhone,
      };
    }
  };

  // Fetch all requests where user is client OR helpmate (regardless of status)
  // Then filter out irrelevant statuses and get last message
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const fetchConversations = async () => {
      try {
        // Query requests where user is client (status not open? Actually all that have messages)
        const clientQuery = firestore()
          .collection('requests')
          .where('clientId', '==', user.uid);
        const helpmateQuery = firestore()
          .collection('requests')
          .where('helpmateId', '==', user.uid);

        const [clientSnap, helpmateSnap] = await Promise.all([
          clientQuery.get(),
          helpmateQuery.get(),
        ]);

        const allDocs = [...clientSnap.docs, ...helpmateSnap.docs];
        // Deduplicate by id
        const unique = [];
        const ids = new Set();
        for (const doc of allDocs) {
          if (!ids.has(doc.id)) {
            ids.add(doc.id);
            unique.push(doc);
          }
        }

        const convosWithLastMsg = [];
        for (const doc of unique) {
          const request = { id: doc.id, ...doc.data() };
          // Only include if status is taken, pending_confirmation, or completed (ignore open)
          if (!['taken', 'pending_confirmation', 'completed'].includes(request.status)) continue;

          const lastMsgSnap = await firestore()
            .collection('requests')
            .doc(request.id)
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

          const lastMsg = lastMsgSnap.empty ? null : { id: lastMsgSnap.docs[0].id, ...lastMsgSnap.docs[0].data() };
          const other = getOtherParty(request, user.uid);
          convosWithLastMsg.push({
            id: request.id,
            task: request.task,
            otherUser: other,
            lastMessage: lastMsg?.text || 'No messages yet',
            lastMessageTime: lastMsg?.timestamp || null,
            lastMessageSenderId: lastMsg?.senderId,
            status: request.status,
          });
        }

        // Sort by latest message time
        convosWithLastMsg.sort((a, b) => {
          const timeA = a.lastMessageTime ? a.lastMessageTime.toDate().getTime() : 0;
          const timeB = b.lastMessageTime ? b.lastMessageTime.toDate().getTime() : 0;
          return timeB - timeA;
        });

        if (isMounted) {
          setConversations(convosWithLastMsg);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        if (isMounted) setLoading(false);
        Alert.alert('Error', 'Could not load conversations.');
      }
    };

    fetchConversations();
    return () => { isMounted = false; };
  }, [user]);

  // Real-time listener for messages when a conversation is open
  useEffect(() => {
    if (!activeChat) return;
    const requestId = activeChat.id;
    const unsubscribe = firestore()
      .collection('requests')
      .doc(requestId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot(snapshot => {
        if (!snapshot) return;
        const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(msgs);
        // Mark messages as read (optional)
        msgs.forEach(async (msg) => {
          if (msg.senderId !== user.uid && !msg.read) {
            await firestore().collection('requests').doc(requestId).collection('messages').doc(msg.id).update({ read: true });
          }
        });
      }, error => {
        console.error('Message listener error:', error);
        Alert.alert('Error', 'Could not load messages.');
      });
    return unsubscribe;
  }, [activeChat, user]);

  // Handle direct open via route params
  useEffect(() => {
    if (initialRequestId && !activeChat && conversations.length > 0) {
      const found = conversations.find(c => c.id === initialRequestId);
      if (found) {
        setActiveChat(found);
      } else {
        // Fetch request directly
        firestore().collection('requests').doc(initialRequestId).get().then(doc => {
          if (doc.exists) {
            const request = { id: doc.id, ...doc.data() };
            const other = getOtherParty(request, user.uid);
            setActiveChat({ id: request.id, task: request.task, otherUser: other, status: request.status });
          }
        }).catch(err => console.error(err));
      }
    }
  }, [initialRequestId, conversations, activeChat, user]);

  const sendMessage = async () => {
    if (!inputText.trim() || !activeChat || !user) return;
    setSending(true);
    try {
      const message = {
        senderId: user.uid,
        senderName: profile?.fullName || 'User',
        text: inputText.trim(),
        timestamp: firestore.FieldValue.serverTimestamp(),
        read: false,
      };
      await firestore()
        .collection('requests')
        .doc(activeChat.id)
        .collection('messages')
        .add(message);
      setInputText('');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  // Conversation list view
  if (!activeChat) {
    const myInitials = profile?.fullName ? profile.fullName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() : '?';
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
        <View style={styles.header}>
          <Image source={require('../Assets/HuzzlersLogo2.png')} style={styles.logo} resizeMode="contain" />
          <TouchableOpacity style={styles.profileCircle} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
            <Text style={styles.profileInitials}>{myInitials}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.pageTitle}>Messages</Text>
        {loading ? (
          <View style={styles.loader}><ActivityIndicator size="large" color="#1B2B4B" /></View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>When you accept or post a request, chat will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingTop: 4 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.convoItem} onPress={() => setActiveChat(item)} activeOpacity={0.7}>
                <View style={styles.avatarWrap}>
                  <Avatar initials={item.otherUser.initials || '?'} color="#1B2B4B" size={48} />
                </View>
                <View style={styles.convoInfo}>
                  <View style={styles.convoTopRow}>
                    <Text style={styles.convoName}>{item.otherUser.name}</Text>
                    <Text style={styles.convoTime}>{formatMessageTime(item.lastMessageTime)}</Text>
                  </View>
                  <Text style={styles.convoLastMsg} numberOfLines={1}>
                    {item.lastMessageSenderId === user.uid ? `Me: ${item.lastMessage}` : item.lastMessage}
                  </Text>
                  <Text style={styles.convoTask}>Task: {item.task}</Text>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </SafeAreaView>
    );
  }

  // Chat thread view
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => isDirectOpen ? navigation.goBack() : setActiveChat(null)} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Avatar initials={activeChat.otherUser.initials || '?'} color="#1B2B4B" size={36} />
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>{activeChat.otherUser.name}</Text>
          <Text style={styles.chatTask}>Task: {activeChat.task}</Text>
        </View>
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          style={styles.messageList}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.senderId === user.uid ? styles.bubbleMe : styles.bubbleThem]}>
              <Text style={[styles.bubbleText, item.senderId === user.uid ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                {item.text}
              </Text>
              <Text style={styles.bubbleTime}>{formatMessageTime(item.timestamp)}</Text>
            </View>
          )}
        />
        <View style={styles.inputBar}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor="#bbb"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={[styles.sendBtn, sending && { opacity: 0.7 }]} onPress={sendMessage} disabled={sending}>
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 44 : 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  logo: { width: 130, height: 40 },
  profileCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1B2B4B', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#1B2B4B' },
  profileInitials: { fontSize: 13, fontWeight: '800', color: '#fff' },
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#1B2B4B', paddingHorizontal: 20, marginBottom: 12 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySubtext: { fontSize: 13, color: '#aaa', textAlign: 'center' },
  convoItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13 },
  avatarWrap: { marginRight: 14 },
  convoInfo: { flex: 1 },
  convoTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  convoName: { fontSize: 15, fontWeight: '800', color: '#1B2B4B' },
  convoTime: { fontSize: 12, color: '#bbb' },
  convoLastMsg: { fontSize: 13, color: '#888', marginBottom: 2 },
  convoTask: { fontSize: 11, color: '#999' },
  separator: { height: 1, backgroundColor: '#f5f5f5', marginLeft: 82 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 12, backgroundColor: '#fff' },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 32, color: '#1B2B4B', fontWeight: '300', lineHeight: 36 },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: 16, fontWeight: '800', color: '#1B2B4B' },
  chatTask: { fontSize: 12, color: '#888' },
  messageList: { flex: 1, backgroundColor: '#f7f8fa' },
  bubble: { maxWidth: '76%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, marginBottom: 8 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: '#1B2B4B', borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextThem: { color: '#222' },
  bubbleTime: { fontSize: 10, color: '#aaa', marginTop: 4, alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff', gap: 10 },
  messageInput: { flex: 1, borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#222', maxHeight: 100, backgroundColor: '#fafafa' },
  sendBtn: { backgroundColor: '#1B2B4B', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  sendBtnText: { color: '#fff', fontSize: 17 },
});