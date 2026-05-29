// Pages/EditRequest.js
import React, { useState } from 'react';
import {
  Image, View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ScrollView, Alert, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../AuthContext';
import firestore from '@react-native-firebase/firestore';

export default function EditRequest({ route, navigation }) {
  const { request } = route.params;
  const { profile } = useAuth();

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  // Parse existing dates from stored format (MM/DD/YYYY) back into Date objects
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      // month/day/year
      return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
    }
    return new Date();
  };

  const parseTime = (timeStr) => {
    if (!timeStr) return new Date();
    // timeStr format: "HH:MM AM/PM"
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const date = new Date();
      date.setHours(hours, minutes, 0);
      return date;
    }
    return new Date();
  };

  const [requestType, setRequestType] = useState(request.type || 'Basic');
  const [address, setAddress] = useState(request.address || '');
  const [task, setTask] = useState(request.task || '');
  const [rate, setRate] = useState(request.rate?.toString() || '');
  const [description, setDescription] = useState(request.description || '');
  const [loading, setLoading] = useState(false);

  const [requestDate, setRequestDate] = useState(parseDate(request.dateReq));
  const [showRequestDatePicker, setShowRequestDatePicker] = useState(false);
  const [showRequestTimePicker, setShowRequestTimePicker] = useState(false);

  const [expirationDate, setExpirationDate] = useState(parseDate(request.dateExp));
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

  const handleSave = async () => {
    if (!address || !task || !rate || !description) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      await firestore().collection('requests').doc(request.id).update({
        type: requestType,
        address: address.trim(),
        task: task.trim(),
        rate: Number(rate),
        description: description.trim(),
        dateReq: formatDate(requestDate),
        timeReq: formatTime(requestDate),
        dateExp: formatDate(expirationDate),
        timeExp: formatTime(expirationDate),
        // keep clientId, clientName, etc. unchanged
      });
      Alert.alert('Success', 'Request updated successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹ Back</Text>
        </TouchableOpacity>
        <Image source={require('../Assets/HuzzlersLogo2.png')} style={styles.logo} resizeMode="contain" />
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Edit Request</Text>

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

        <Text style={styles.label}>ADDRESS</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Address" />

        <Text style={styles.label}>TASK</Text>
        <TextInput style={styles.input} value={task} onChangeText={setTask} placeholder="Task" />

        <Text style={styles.label}>RATE (PHP)</Text>
        <TextInput style={styles.input} value={rate} onChangeText={setRate} keyboardType="numeric" placeholder="Rate" />

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
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholder="Description"
          maxLength={300}
        />
        <Text style={styles.charCount}>{description.length}/300</Text>

        <TouchableOpacity style={[styles.saveBtn, loading && { opacity: 0.7 }]} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveBtnText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 44 : 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f3f3' },
  backBtn: { paddingVertical: 4 },
  backArrow: { fontSize: 16, fontWeight: '700', color: '#1B2B4B' },
  logo: { width: 100, height: 32 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  pageTitle: { fontSize: 22, fontWeight: '900', color: '#1B2B4B', marginBottom: 20, marginTop: 8 },
  label: { fontSize: 11, fontWeight: '800', color: '#888', marginTop: 16, marginBottom: 6, letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: '#e8e8e8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#222', backgroundColor: '#fafafa', justifyContent: 'center' },
  textarea: { height: 110, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: { flex: 1, paddingVertical: 11, borderRadius: 10, borderWidth: 1.5, borderColor: '#e8e8e8', alignItems: 'center', backgroundColor: '#fafafa' },
  toggleBtnActive: { backgroundColor: '#1B2B4B', borderColor: '#1B2B4B' },
  toggleText: { fontWeight: '700', color: '#888', fontSize: 14 },
  toggleTextActive: { color: '#fff' },
  saveBtn: { backgroundColor: '#1B2B4B', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});