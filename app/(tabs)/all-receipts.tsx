import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl, StatusBar } from 'react-native';
import { Text, IconButton, useTheme, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../src/lib/supabase';
import { spacing, borderRadius } from '../../src/theme/theme';
import { useAuth } from '../../src/providers/AuthProvider';

const AllReceipts = () => {
  const { session } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  
  // UI State
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllReceipts = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('datetime', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error: any) {
      console.error("Fetch All Receipts Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchAllReceipts();
    }, [fetchAllReceipts])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllReceipts();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#020617' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.headerTitle}>RECEIPTS</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={styles.summaryContainer}>
          <Text variant="labelLarge" style={styles.summaryLabel}>TOTAL RECORDS</Text>
          <Text variant="displaySmall" style={styles.summaryValue}>{receipts.length}</Text>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: spacing.xl }} />
        ) : receipts.length === 0 ? (
          <View style={styles.emptyState}>
            <IconButton icon="receipt-text-outline" size={64} iconColor="#1E293B" />
            <Text variant="bodyLarge" style={{ color: '#64748B' }}>No receipts found.</Text>
          </View>
        ) : (
          receipts.map((receipt) => (
            <Card 
              key={receipt.id} 
              style={styles.receiptCard} 
              mode="contained" 
              onPress={() => router.push(`/receipt/${receipt.id}`)}
            >
              <Card.Content style={styles.receiptContent}>
                <View style={styles.receiptMain}>
                  <Text variant="titleLarge" style={styles.amount}>
                    ${parseFloat(receipt.amount).toFixed(2)}
                  </Text>
                  <Text variant="bodySmall" style={styles.dateText}>
                    {new Date(receipt.datetime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.receiptActions}>
                  <Text variant="labelSmall" style={styles.timeLabel}>
                    {new Date(receipt.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <IconButton icon="chevron-right" size={20} iconColor="#FDE047" />
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default AllReceipts;

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
  scrollContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  summaryContainer: { padding: spacing.lg, alignItems: 'center', marginBottom: spacing.sm },
  summaryLabel: { letterSpacing: 2, fontWeight: '800', color: '#64748B', fontSize: 10 },
  summaryValue: { fontWeight: '900', marginTop: spacing.xs, color: '#F8FAFC' },
  receiptCard: {
    backgroundColor: '#0F172A',
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  receiptContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptMain: { flex: 1 },
  amount: { fontWeight: '900', color: '#FDE047' },
  dateText: { color: '#94A3B8', fontWeight: '700' },
  receiptActions: { alignItems: 'flex-end' },
  timeLabel: { color: '#64748B', fontWeight: '800' },
  emptyState: { alignItems: 'center', marginTop: spacing.xxl },
});
