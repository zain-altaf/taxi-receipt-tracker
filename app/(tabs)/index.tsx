import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Platform, StatusBar } from 'react-native';
import { Button, Text, Card, useTheme, IconButton } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ExpoRouter from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../src/lib/supabase';
import { spacing, borderRadius } from '../../src/theme/theme';
import { useAuth } from '../../src/providers/AuthProvider';

const Dashboard = () => {
  const { session } = useAuth();
  const theme = useTheme();
  const router = ExpoRouter.useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  
  // UI State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  // Data State
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      // Calculate Sunday (Start of Week) and Saturday (End of Week)
      const now = new Date();
      const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
      
      const sunday = new Date(now);
      sunday.setDate(now.getDate() - currentDay);
      sunday.setHours(0, 0, 0, 0);

      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      saturday.setHours(23, 59, 59, 999);

      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        const seconds = String(d.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const startOfWeek = formatDate(sunday);
      const endOfWeek = formatDate(saturday);

      const { data: weekAmounts, error: sumError } = await supabase
        .from('receipts')
        .select('amount')
        .eq('user_id', session.user.id)
        .gte('datetime', startOfWeek)
        .lte('datetime', endOfWeek);

      if (sumError) throw sumError;
      const total = (weekAmounts || []).reduce((sum, r) => sum + (r.amount || 0), 0);
      setWeeklyEarnings(total);
    } catch (error: any) {
      console.error("Fetch Data Error:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const driverName = session?.user?.email?.split('@')[0] || 'Driver';
  const CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUD_NAME || "";
  const UPLOAD_PRESET = process.env.EXPO_PUBLIC_UPLOAD_PRESET || "";

  const openCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert("Permission Required", "Please allow camera access.");
        return;
      }
    }
    setIsCameraOpen(true);
  };

  const uploadToCloudinary = async (uri: string) => {
    const formData = new FormData();
    formData.append('file', { uri, type: 'image/jpeg', name: 'receipt.jpg' } as any);
    formData.append('upload_preset', UPLOAD_PRESET);
    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data;
    } catch (error: any) {
      Alert.alert("Upload Failed", error.message);
      return null;
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        setIsCameraOpen(false);
        setIsUploading(true);
        const data = await uploadToCloudinary(photo.uri);
        setIsUploading(false);
        if (data) {
          router.push({
            pathname: '/add-receipt',
            params: { imageUrl: data.secure_url, publicId: data.public_id }
          });
        }
      }
    } catch (error) {
      Alert.alert("Error", "Capture failed");
      setIsUploading(false);
    }
  };

  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setIsCameraOpen(false)}>
            <IconButton icon="close" iconColor="white" size={30} />
          </TouchableOpacity>
          <View style={styles.cameraFooter}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#020617' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.headerTitle}>DASHBOARD</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={styles.welcomeSection}>
          <Text variant="headlineSmall" style={styles.welcomeTextSmall}>Good Day,</Text>
          <Text variant="displayMedium" style={styles.welcomeTextLarge} numberOfLines={1} adjustsFontSizeToFit>
            {driverName.toUpperCase()}
          </Text>
        </View>

        {isUploading && (
          <View style={styles.uploadingCard}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.uploadingText}>UPLOADING SECURELY...</Text>
          </View>
        )}

        <View style={styles.quickActionsGrid}>
          <Card style={styles.captureCard} onPress={openCamera}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.actionIconContainer}>
                <IconButton icon="camera-plus" iconColor="#FDE047" size={36} />
              </View>
              <Text variant="labelLarge" style={styles.actionLabelPrimary}>CAPTURE</Text>
            </Card.Content>
          </Card>
        </View>

        <Text variant="labelLarge" style={styles.sectionTitle}>WEEKLY PROGRESS</Text>
        <Card style={styles.summaryCard} mode="contained">
          <Card.Content>
            <View style={styles.metricRow}>
              <View>
                <Text variant="labelMedium" style={styles.metricLabel}>THIS WEEK'S EARNINGS</Text>
                <Text variant="displaySmall" style={styles.metricValue}>
                  ${weeklyEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <IconButton icon="chart-line-variant" iconColor={theme.colors.primary} size={32} />
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: spacing.sm,
    height: 64,
  },
  headerTitle: { fontWeight: '900', letterSpacing: 4, color: '#FDE047' },
  scrollContent: { padding: spacing.md, gap: spacing.md },
  welcomeSection: { marginTop: spacing.md, marginBottom: spacing.md },
  welcomeTextSmall: { fontWeight: '700', color: '#94A3B8' },
  welcomeTextLarge: { fontWeight: '900', letterSpacing: -2, color: '#FDE047', marginTop: -4 },
  sectionTitle: { letterSpacing: 2, fontWeight: '800', color: '#64748B', fontSize: 10, marginTop: spacing.sm },
  quickActionsGrid: { flexDirection: 'row', gap: spacing.md },
  captureCard: { flex: 1, borderRadius: borderRadius.md, backgroundColor: '#FDE047', elevation: 4 },
  cardContent: { alignItems: 'center', paddingVertical: spacing.md },
  actionIconContainer: { backgroundColor: '#020617', borderRadius: 50, marginBottom: spacing.xs },
  actionLabelPrimary: { color: '#020617', fontWeight: '900', letterSpacing: 1 },
  summaryCard: { backgroundColor: '#0F172A', borderRadius: borderRadius.md, borderWidth: 1, borderColor: '#1E293B' },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricLabel: { color: '#94A3B8', fontWeight: '800', letterSpacing: 1 },
  metricValue: { fontWeight: '900', color: '#F8FAFC' },
  uploadingCard: { flexDirection: 'row', padding: spacing.md, backgroundColor: '#1E293B', borderRadius: borderRadius.md, alignItems: 'center', marginBottom: spacing.md },
  uploadingText: { marginLeft: spacing.md, fontWeight: '800', color: '#FDE047' },
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  closeButton: { marginTop: 40, marginLeft: 20 },
  cameraFooter: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
  captureButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'white', borderWidth: 2, borderColor: 'black' },
});
