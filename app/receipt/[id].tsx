import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, Image, SafeAreaView, ActivityIndicator, TouchableOpacity, Modal, Dimensions, Alert } from 'react-native';
import { Text, IconButton, useTheme, Card, Divider, Portal } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { spacing, borderRadius } from '../../src/theme/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ReceiptDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const { data, error } = await supabase
          .from('receipts')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setReceipt(data);
      } catch (error: any) {
        console.error("Error fetching receipt:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchReceipt();
  }, [id]);

  const handleDelete = async () => {
    Alert.alert(
      "Delete Receipt",
      "Are you sure you want to delete this receipt? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            setDeleting(true);
            try {
              // 1. Delete from Cloudinary FIRST (Securely via Edge Function)
              if (receipt?.public_id) {
                console.log(`Attempting to delete Cloudinary image: ${receipt.public_id}`);
                const { data, error: funcError } = await supabase.functions.invoke('delete-cloudinary-image', {
                  body: { public_id: receipt.public_id }
                });

                if (funcError) {
                  console.error("Edge Function Error:", funcError);
                  throw new Error("Cloudinary deletion service failed. Please check your Edge Function logs.");
                }

                if (data?.result !== 'ok' && data?.result !== 'not found') {
                  console.error("Cloudinary API Error:", data);
                  throw new Error(`Cloudinary deletion failed: ${data?.error?.message || 'Unknown error'}`);
                }
                
                console.log("Cloudinary image deleted successfully or not found.");
              }

              // 2. Delete from Supabase SECOND
              const { error } = await supabase
                .from('receipts')
                .delete()
                .eq('id', id);

              if (error) throw error;
              
              Alert.alert("Deleted", "Receipt has been removed successfully.");
              router.back();
            } catch (error: any) {
              Alert.alert("Deletion Error", error.message);
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!receipt) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <Text>Receipt not found.</Text>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Portal>
        <Modal 
          visible={isImageModalVisible} 
          transparent={true} 
          onRequestClose={() => setIsImageModalVisible(false)}
        >
          <View style={styles.fullScreenModal}>
            <TouchableOpacity 
              style={styles.modalOverlay} 
              activeOpacity={1} 
              onPress={() => setIsImageModalVisible(false)}
            >
              <Image 
                source={{ uri: receipt.image_url }} 
                style={styles.fullScreenImage} 
                resizeMode="contain" 
              />
              <IconButton 
                icon="close" 
                iconColor="white" 
                size={32} 
                style={styles.modalCloseButton} 
                onPress={() => setIsImageModalVisible(false)} 
              />
            </TouchableOpacity>
          </View>
        </Modal>
      </Portal>

      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="headlineSmall" style={styles.headerTitle}>Receipt Detail</Text>
        <IconButton 
          icon="trash-can-outline" 
          iconColor={theme.colors.error} 
          onPress={handleDelete}
          disabled={deleting}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {deleting && (
          <View style={styles.deletingOverlay}>
            <ActivityIndicator size="small" color={theme.colors.error} />
            <Text style={{ marginLeft: spacing.md, color: theme.colors.error, fontWeight: '700' }}>DELETING...</Text>
          </View>
        )}

        <TouchableOpacity activeOpacity={0.9} onPress={() => receipt.image_url && setIsImageModalVisible(true)}>
          <Card style={styles.imageCard} mode="contained">
            {receipt.image_url ? (
              <Image 
                source={{ uri: receipt.image_url }} 
                style={styles.image} 
                resizeMode="contain" 
              />
            ) : (
              <View style={styles.noImage}>
                <IconButton icon="image-off" size={48} />
                <Text>No image available</Text>
              </View>
            )}
            {receipt.image_url && (
              <View style={styles.imageOverlay}>
                <IconButton icon="magnify-plus-outline" iconColor="white" size={20} />
                <Text style={styles.imageOverlayText}>Tap to Enlarge</Text>
              </View>
            )}
          </Card>
        </TouchableOpacity>

        <Card style={styles.detailsCard} mode="contained">
          <Card.Content>
            <View style={styles.detailRow}>
              <Text variant="labelLarge" style={styles.label}>AMOUNT</Text>
              <Text variant="displaySmall" style={[styles.value, { color: theme.colors.primary }]}>
                ${parseFloat(receipt.amount).toFixed(2)}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text variant="labelLarge" style={styles.label}>DATE & TIME</Text>
              <Text variant="titleMedium" style={styles.value}>
                {new Date(receipt.datetime).toLocaleDateString()}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                {new Date(receipt.datetime).toLocaleTimeString()}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text variant="labelLarge" style={styles.label}>NOTES</Text>
              <Text variant="bodyLarge" style={styles.value}>
                {receipt.notes || "No notes added."}
              </Text>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailRow}>
              <Text variant="labelLarge" style={styles.label}>SYSTEM ID</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {receipt.public_id || receipt.id}
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReceiptDetail;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  imageCard: {
    backgroundColor: 'white',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    height: 350,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.sm,
    borderTopLeftRadius: borderRadius.md,
  },
  imageOverlayText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noImage: {
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  detailRow: {
    paddingVertical: spacing.md,
  },
  label: {
    color: '#64748B',
    marginBottom: spacing.xs,
    fontSize: 10,
    fontWeight: '800',
  },
  value: {
    fontWeight: '800',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: 'black',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  deletingOverlay: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: '#FEF2F2',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
});
