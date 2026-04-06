import React from 'react';
import { StyleSheet, View, SafeAreaView, ScrollView, StatusBar } from 'react-native';
import { Text, List, Button, Divider, useTheme, IconButton, Card } from 'react-native-paper';
import { supabase } from '../../src/lib/supabase';
import { spacing, borderRadius } from '../../src/theme/theme';
import { useAuth } from '../../src/providers/AuthProvider';

const Settings = () => {
  const { session } = useAuth();
  const theme = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const driverName = session?.user?.email?.split('@')[0] || 'Driver';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#020617' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.headerTitle}>SETTINGS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <Card style={styles.profileCard} mode="contained">
          <Card.Content style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{driverName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileText}>
              <Text variant="headlineSmall" style={styles.profileName}>{driverName.toUpperCase()}</Text>
              <Text variant="bodyMedium" style={{ color: '#94A3B8' }}>{session?.user?.email}</Text>
            </View>
          </Card.Content>
        </Card>

        <Text variant="labelLarge" style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.optionsContainer}>
          <List.Item
            title="Edit Profile"
            left={props => <List.Icon {...props} icon="account-edit-outline" color="#FDE047" />}
            right={props => <List.Icon {...props} icon="chevron-right" color="#1E293B" />}
            titleStyle={styles.optionText}
            style={styles.optionItem}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Notifications"
            left={props => <List.Icon {...props} icon="bell-outline" color="#FDE047" />}
            right={props => <List.Icon {...props} icon="chevron-right" color="#1E293B" />}
            titleStyle={styles.optionText}
            style={styles.optionItem}
          />
        </View>

        <Text variant="labelLarge" style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.optionsContainer}>
          <List.Item
            title="Appearance"
            description="Dark Theme Active"
            left={props => <List.Icon {...props} icon="palette-outline" color="#FDE047" />}
            titleStyle={styles.optionText}
            descriptionStyle={{ color: '#64748B' }}
            style={styles.optionItem}
          />
          <Divider style={styles.divider} />
          <List.Item
            title="Data & Storage"
            left={props => <List.Icon {...props} icon="database-outline" color="#FDE047" />}
            right={props => <List.Icon {...props} icon="chevron-right" color="#1E293B" />}
            titleStyle={styles.optionText}
            style={styles.optionItem}
          />
        </View>

        <View style={styles.footer}>
          <Button 
            mode="contained" 
            onPress={handleSignOut} 
            style={styles.signOutButton}
            buttonColor={theme.colors.error}
            icon="logout"
            contentStyle={{ height: 56 }}
          >
            LOGOUT ACCOUNT
          </Button>
          <Text variant="labelSmall" style={styles.versionText}>TAXI TRACKER STABLE v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Settings;

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
  profileCard: { backgroundColor: '#0F172A', borderRadius: borderRadius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: '#1E293B' },
  profileContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FDE047', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '900', color: '#020617' },
  profileText: { flex: 1 },
  profileName: { fontWeight: '900', color: '#FDE047', letterSpacing: 1 },
  sectionTitle: { letterSpacing: 2, fontWeight: '800', color: '#64748B', fontSize: 10, marginTop: spacing.sm },
  optionsContainer: { backgroundColor: '#0F172A', borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: '#1E293B' },
  optionItem: { paddingVertical: spacing.xs },
  optionText: { color: '#F8FAFC', fontWeight: '700' },
  divider: { backgroundColor: '#1E293B' },
  footer: { marginTop: spacing.xl, gap: spacing.md, paddingBottom: spacing.xxl },
  signOutButton: { borderRadius: borderRadius.sm },
  versionText: { textAlign: 'center', color: '#334155', letterSpacing: 2, fontSize: 10, fontWeight: '800' },
});
