// Pages/AddRequest.js
import React, { useState, useEffect } from 'react';
import {
  Image, View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ScrollView, Alert, Platform,
  ActivityIndicator, // <-- ADD THIS
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../AuthContext';
import firestore from '@react-native-firebase/firestore';

export default function AddRequest({ navigation }) {
  const { user, profile } = useAuth();
  const [clientData, setClientData] = useState({
    name: '',
    initials: '',
    phone: '',
  });
  const [loadingProfile, setLoadingProfile] = useState(true);

  // If profile is not available from context, fetch directly from Firestore
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.uid) return;
      if (profile && profile.fullName) {
        const fullName = profile.fullName;
        const initials = fullName
          .split(' ')
          .map(w => w[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || '?';
        setClientData({
          name: fullName,
          initials,
          phone: profile.phone || '',
        });
        setLoadingProfile(false);
      } else {
        try {
          const doc = await firestore().collection('users').doc(user.uid).get();
          if (doc.exists) {
            const data = doc.data();
            const fullName = data.fullName || 'Unknown';
            const initials = fullName
              .split(' ')
              .map(w => w[0])
              .slice(0, 2)
              .join('')
              .toUpperCase() || '?';
            setClientData({
              name: fullName,
              initials,
              phone: data.phone || '',
            });
          } else {
            setClientData({ name: 'Unknown', initials: '?', phone: '' });
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          setClientData({ name: 'Unknown', initials: '?', phone: '' });
        } finally {
          setLoadingProfile(false);
        }
      }
    };
    fetchProfile();
  }, [user, profile]);

  const [requestType, setRequestType] = useState('Basic');
  const [task, setTask] = useState('');
  const [rate, setRate] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const [requestDate, setRequestDate] = useState(new Date());
  const [showRequestDatePicker, setShowRequestDatePicker] = useState(false);
  const [showRequestTimePicker, setShowRequestTimePicker] = useState(false);

  const [expirationDate, setExpirationDate] = useState(new Date());
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);
  const [showExpirationTimePicker, setShowExpirationTimePicker] = useState(false);

  const formatDate = (date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const handleConfirm = async () => {
    if (!task || !rate || !description) {
      Alert.alert('Missing Fields', 'Please fill in Task, Rate, and Description.');
      return;
    }

    setLoading(true);
    try {
      const randomDistance = Math.floor(Math.random() * 2500) + 10;
      const distanceStr = randomDistance > 1000 ? `${(randomDistance/1000).toFixed(1)}km` : `${randomDistance}m`;

      await firestore().collection('requests').add({
        clientId: user?.uid,
        clientName: clientData.name,
        clientInitials: clientData.initials,
        clientPhone: clientData.phone,
        type: requestType,
        task: task.trim(),
        rate: Number(rate),
        description: description.trim(),
        status: 'open',
        distance: distanceStr,
        dateReq: formatDate(requestDate),
        timeReq: formatTime(requestDate),
        dateExp: formatDate(expirationDate),
        timeExp: formatTime(expirationDate),
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Request Posted!', 'Your request has been added.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not post request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
        <View style={styles.header}>
          <Image source={require('../Assets/HuzzlersLogo2.png')} style={styles.logo} resizeMode="contain" />
          <View style={styles.profileCircle}><Text style={styles.profileInitials}>?</Text></View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1B2B4B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
      <View style={styles.header}>
        <Image source={require('../Assets/HuzzlersLogo2.png')} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity style={styles.profileCircle} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
          <Text style={styles.profileInitials}>{clientData.initials}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Add a Request</Text>
        <Text style={styles.pageSubtitle}>Fill in the details below to post your task.</Text>

        <Text style={styles.label}>TYPE OF REQUEST</Text>
        <View style={styles.toggleRow}>
          {['Basic', 'Professional'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.toggleBtn, requestType === type && styles.toggleBtnActive]}
              onPress={() => setRequestType(type)}>
              <Text style={[styles.toggleText, requestType === type && styles.toggleTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>TASK</Text>
        <TextInput style={styles.input} placeholder="e.g. Help with Engineering project" value={task} onChangeText={setTask} placeholderTextColor="#bbb" />

        <Text style={styles.label}>RATE (PHP)</Text>
        <TextInput style={styles.input} placeholder="e.g. 500" value={rate} onChangeText={setRate} keyboardType="numeric" placeholderTextColor="#bbb" />

        <Text style={styles.label}>DATE AND TIME OF REQUEST</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowRequestDatePicker(true)}>
          <Text>{formatDate(requestDate)}</Text>
        </TouchableOpacity>
        {showRequestDatePicker && (
          <DateTimePicker
            value={requestDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowRequestDatePicker(false);
              if (selectedDate) setRequestDate(selectedDate);
            }}
            minimumDate={new Date()}
          />
        )}
        <TouchableOpacity style={[styles.input, { marginTop: 8 }]} onPress={() => setShowRequestTimePicker(true)}>
          <Text>{formatTime(requestDate)}</Text>
        </TouchableOpacity>
        {showRequestTimePicker && (
          <DateTimePicker
            value={requestDate}
            mode="time"
            display={Platform.OS === 'android' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              setShowRequestTimePicker(false);
              if (selectedTime) setRequestDate(selectedTime);
            }}
            is24Hour={false}
          />
        )}

        <Text style={styles.label}>EXPIRATION</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowExpirationDatePicker(true)}>
          <Text>{formatDate(expirationDate)}</Text>
        </TouchableOpacity>
        {showExpirationDatePicker && (
          <DateTimePicker
            value={expirationDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowExpirationDatePicker(false);
              if (selectedDate) setExpirationDate(selectedDate);
            }}
            minimumDate={new Date()}
            maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
          />
        )}
        <TouchableOpacity style={[styles.input, { marginTop: 8 }]} onPress={() => setShowExpirationTimePicker(true)}>
          <Text>{formatTime(expirationDate)}</Text>
        </TouchableOpacity>
        {showExpirationTimePicker && (
          <DateTimePicker
            value={expirationDate}
            mode="time"
            display={Platform.OS === 'android' ? 'spinner' : 'default'}
            onChange={(event, selectedTime) => {
              setShowExpirationTimePicker(false);
              if (selectedTime) setExpirationDate(selectedTime);
            }}
            is24Hour={false}
          />
        )}

        <Text style={styles.label}>DESCRIPTION</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="Describe the task and include any address or special instructions..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor="#bbb"
          maxLength={500}
        />
        <Text style={styles.charCount}>{description.length}/500</Text>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.confirmBtn, loading && { opacity: 0.7 }]} onPress={handleConfirm} disabled={loading}>
            <Text style={styles.confirmText}>{loading ? 'Posting...' : 'Confirm'}</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 44 : 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  logo: { width: 130, height: 40 },
  profileCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#1B2B4B', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#1B2B4B' },
  profileInitials: { fontSize: 13, fontWeight: '800', color: '#fff' },
  scroll: { flex: 1, paddingHorizontal: 20 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#1B2B4B', marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '800', color: '#888', marginTop: 16, marginBottom: 6, letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#222', backgroundColor: '#fafafa', justifyContent: 'center' },
  textarea: { height: 110, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: '#e8e8e8', alignItems: 'center', backgroundColor: '#fafafa' },
  toggleBtnActive: { backgroundColor: '#1B2B4B', borderColor: '#1B2B4B' },
  toggleText: { fontWeight: '700', color: '#888', fontSize: 14 },
  toggleTextActive: { color: '#fff' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingVertical: 14, alignItems: 'center', backgroundColor: '#fafafa' },
  cancelText: { color: '#555', fontWeight: '700', fontSize: 15 },
  confirmBtn: { flex: 1, backgroundColor: '#1B2B4B', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});