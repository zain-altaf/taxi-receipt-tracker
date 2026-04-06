import React, { useState } from "react";
import { Alert, StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Button, Text, TextInput, Divider, useTheme } from "react-native-paper";
import { Link } from "expo-router";
import { authService } from "../../src/features/auth/services/authService";
import { spacing, borderRadius } from "../../src/theme/theme";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();

  async function handleGoogleRegister() {
    setLoading(true);
    const { error } = await authService.handleGoogleOAuth(true);
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function handleRegister() {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);
    const { error } = await authService.signUpWithEmail(email, password);
    if (error) Alert.alert("Registration Failed", error.message);
    else Alert.alert("Success", "Account created successfully. Please sign in.");
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text variant="displayMedium" style={[styles.header, { color: theme.colors.onSurface }]}>
            Join Hub
          </Text>
          <Text variant="bodyLarge" style={[styles.subHeader, { color: theme.colors.onSurfaceVariant }]}>
            Professional Driver Registration
          </Text>
        </View>

        <View style={styles.formCard}>
          <TextInput
            label="Professional Email"
            mode="outlined"
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            left={<TextInput.Icon icon="account" color={theme.colors.onSurfaceVariant} />}
            onChangeText={setEmail}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            textColor={theme.colors.onSurface}
          />

          <TextInput
            label="Password"
            mode="outlined"
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            left={<TextInput.Icon icon="lock" color={theme.colors.onSurfaceVariant} />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
                color={theme.colors.onSurfaceVariant}
              />
            }
            onChangeText={setPassword}
            value={password}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={styles.input}
            textColor={theme.colors.onSurface}
          />

          <TextInput
            label="Confirm Password"
            mode="outlined"
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            left={<TextInput.Icon icon="lock-check" color={theme.colors.onSurfaceVariant} />}
            onChangeText={setConfirmPassword}
            value={confirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={styles.input}
            textColor={theme.colors.onSurface}
          />

          <Button
            mode="contained"
            loading={loading}
            disabled={loading}
            onPress={handleRegister}
            style={styles.mainButton}
            labelStyle={styles.buttonLabel}
            elevation={1}
          >
            CREATE ACCOUNT
          </Button>

          <View style={styles.dividerContainer}>
            <Divider style={styles.divider} />
            <Text style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>OR QUICK START</Text>
            <Divider style={styles.divider} />
          </View>

          <Button
            mode="outlined"
            icon="google"
            loading={loading}
            disabled={loading}
            onPress={handleGoogleRegister}
            style={styles.googleButton}
            textColor={theme.colors.onSurface}
          >
            GOOGLE REGISTRATION
          </Button>
        </View>

        <View style={styles.footer}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Already Registered? </Text>
          <Link href="/login" replace asChild>
            <Text style={[styles.link, { color: theme.colors.primary }]}>Sign In Instead</Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  header: {
    textAlign: "center",
  },
  subHeader: {
    marginTop: spacing.xs,
    fontSize: 14,
    fontWeight: "500",
  },
  formCard: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: "white",
  },
  mainButton: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
  },
  buttonLabel: {
    fontWeight: "bold",
    letterSpacing: 1,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  googleButton: {
    borderRadius: borderRadius.md,
    borderColor: '#E2E8F0',
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.xxl,
  },
  link: {
    fontWeight: "bold",
    fontSize: 14,
  },
});
