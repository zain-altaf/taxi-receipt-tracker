import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, Image, KeyboardAvoidingView, Platform, Alert, Keyboard, Dimensions, TouchableOpacity, StatusBar, Modal, Pressable } from 'react-native';
import { Button, Text, TextInput, useTheme, IconButton, Card, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../src/lib/supabase';
import { spacing, borderRadius } from '../src/theme/theme';
import { useAuth } from '../src/providers/AuthProvider';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AddReceipt = () => {
  const { session } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  // Data from Camera/Cloudinary
  const imageUrl = params.imageUrl as string;
  const publicId = params.publicId as string;

  // Form State
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());
  const [tempDate, setTempDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [isSaving, setIsSaving] = useState(false);

  const formatLocalDateTo24Hour = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleSave = async () => {
    if (!session?.user?.id || !imageUrl) return;
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('receipts').insert({
        user_id: session.user.id,
        amount: parseFloat(amount),
        datetime: formatLocalDateTo24Hour(date),
        notes: notes,
        image_url: imageUrl,
        public_id: publicId,
      });

      if (error) throw error;
      
      Alert.alert("Success", "Receipt saved successfully!");
      router.replace('/(tabs)'); 
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const onPickerChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        selectedDate.setSeconds(0, 0);
        setDate(selectedDate);
      }
    } else {
      // iOS handling
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const confirmIOSSelection = () => {
    tempDate.setSeconds(0, 0);
    setDate(tempDate);
    setShowPicker(false);
  };

  const openPicker = (mode: 'date' | 'time') => {
    Keyboard.dismiss();
    setPickerMode(mode);
    setTempDate(new Date(date));
    
    // Tiny delay to allow keyboard to start dismissing
    setTimeout(() => {
      setShowPicker(true);
    }, 100);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#020617' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <View style={styles.header}>
        <IconButton icon="close" iconColor="#FDE047" onPress={() => router.replace('/(tabs)')} />
        <Text variant="titleLarge" style={styles.headerTitle}>ENTRY DETAILS</Text>
        <Button mode="text" textColor="#FDE047" onPress={handleSave} loading={isSaving} disabled={isSaving}>
          SAVE
        </Button>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          <Card style={styles.imageCard} mode="contained">
            <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
            <View style={styles.imageBadge}>
              <Text variant="labelSmall" style={{ color: '#020617', fontWeight: '900' }}>CAPTURED</Text>
            </View>
          </Card>

          <View style={styles.formSection}>
            <Text variant="labelLarge" style={styles.sectionTitle}>TRANSACTION</Text>
            
            <TextInput 
              label="Amount ($)" 
              value={amount} 
              onChangeText={setAmount} 
              keyboardType="numeric" 
              mode="outlined" 
              style={styles.input} 
              placeholder="0.00"
              textColor="#F8FAFC"
              placeholderTextColor="#64748B"
              theme={{ colors: { primary: '#FDE047', outline: '#1E293B', surfaceVariant: '#0F172A' } }}
              left={<TextInput.Icon icon="currency-usd" iconColor="#FDE047" />}
            />

            <TextInput 
              label="Notes (Optional)" 
              value={notes} 
              onChangeText={setNotes} 
              mode="outlined" 
              multiline
              numberOfLines={3}
              style={styles.input} 
              placeholder="Add details about this trip..."
              textColor="#F8FAFC"
              placeholderTextColor="#64748B"
              theme={{ colors: { primary: '#FDE047', outline: '#1E293B', surfaceVariant: '#0F172A' } }}
            />

            <Divider style={styles.divider} />
            
            <Text variant="labelLarge" style={styles.sectionTitle}>DATE & TIME</Text>
            
            {/* Native Pressable for maximum reliability */}
            <Pressable 
              onPress={() => openPicker('date')} 
              style={({ pressed }) => [styles.pickerButton, pressed && { opacity: 0.5 }]}
            >
              <View style={styles.pickerIconContainer}>
                <IconButton icon="calendar" size={24} iconColor="#FDE047" />
              </View>
              <View>
                <Text variant="labelMedium" style={styles.pickerLabel}>SELECT DATE</Text>
                <Text variant="titleMedium" style={styles.pickerValue}>{date.toLocaleDateString()}</Text>
              </View>
            </Pressable>

            <Pressable 
              onPress={() => openPicker('time')} 
              style={({ pressed }) => [styles.pickerButton, pressed && { opacity: 0.5 }]}
            >
              <View style={styles.pickerIconContainer}>
                <IconButton icon="clock-outline" size={24} iconColor="#FDE047" />
              </View>
              <View>
                <Text variant="labelMedium" style={styles.pickerLabel}>SELECT TIME</Text>
                <Text variant="titleMedium" style={styles.pickerValue}>
                  {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Button 
              mode="contained" 
              onPress={handleSave} 
              style={styles.saveButton} 
              contentStyle={styles.saveButtonContent}
              loading={isSaving}
              disabled={isSaving}
              buttonColor="#FDE047"
              textColor="#020617"
            >
              SAVE INSTANCE
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Standard React Native Modal for iOS */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={showPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Button onPress={() => setShowPicker(false)} textColor="#64748B">Cancel</Button>
                <Text variant="titleMedium" style={{ fontWeight: '900', color: '#F8FAFC' }}>
                  {pickerMode === 'date' ? 'SELECT DATE' : 'SELECT TIME'}
                </Text>
                <Button onPress={confirmIOSSelection} textColor="#FDE047" style={{ fontWeight: '900' }}>Confirm</Button>
              </View>
              <DateTimePicker
                value={tempDate}
                mode={pickerMode}
                display="spinner"
                onChange={onPickerChange}
                textColor="#F8FAFC"
                style={{ height: 250 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Direct rendering for Android */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={date}
          mode={pickerMode}
          display="default"
          onChange={onPickerChange}
        />
      )}
    </SafeAreaView>
  );
};

export default AddReceipt;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: spacing.sm,
    height: 60,
  },
  headerTitle: { fontWeight: '900', letterSpacing: 2, color: '#FDE047', fontSize: 16 },
  scrollContent: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xxl },
  imageCard: { 
    height: 240, 
    borderRadius: borderRadius.md, 
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  previewImage: { width: '100%', height: '100%' },
  imageBadge: { 
    position: 'absolute', 
    top: spacing.sm, 
    right: spacing.sm, 
    backgroundColor: '#FDE047', 
    paddingHorizontal: spacing.sm, 
    paddingVertical: 4, 
    borderRadius: borderRadius.sm 
  },
  formSection: { gap: spacing.md },
  sectionTitle: { letterSpacing: 1.5, fontWeight: '800', color: '#64748B', fontSize: 10, marginBottom: spacing.xs },
  input: { backgroundColor: '#0F172A' },
  divider: { marginVertical: spacing.sm, opacity: 0.2, backgroundColor: '#94A3B8' },
  pickerButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#0F172A', 
    padding: spacing.sm, 
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    height: 64,
  },
  pickerIconContainer: { 
    backgroundColor: '#020617', 
    borderRadius: borderRadius.sm, 
    marginRight: spacing.md 
  },
  pickerLabel: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  pickerValue: { fontWeight: '900', color: '#F8FAFC' },
  footer: { marginTop: spacing.lg, alignItems: 'center', gap: spacing.sm },
  saveButton: { width: '100%', borderRadius: borderRadius.sm },
  saveButtonContent: { height: 56 },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: '#1E293B',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
});
