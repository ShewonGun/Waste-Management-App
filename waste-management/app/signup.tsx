import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';
import { auth } from '../utils/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { createUserProfile } from '../utils/database';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    if (!username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: username });

  // Create user profile with role
  await createUserProfile({
    email: email,
    displayName: username,
    role: role,
    points: 0, // Initialize with 0 points
  });

  router.replace('/(tabs)' as any); // Redirect to home page
    } catch (e: any) {
      setError(e.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.background }]}> 
      <View style={styles.card}>
        <Text style={[styles.title, { color: Colors.light.text }]}>Sign Up</Text>
        <TextInput
          style={[styles.input, { backgroundColor: Colors.light.inputBackground, borderColor: Colors.light.inputBorder, color: Colors.light.text }]}
          placeholder="Username"
          placeholderTextColor={Colors.light.icon}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { backgroundColor: Colors.light.inputBackground, borderColor: Colors.light.inputBorder, color: Colors.light.text }]}
          placeholder="Email"
          placeholderTextColor={Colors.light.icon}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { backgroundColor: Colors.light.inputBackground, borderColor: Colors.light.inputBorder, color: Colors.light.text }]}
          placeholder="Password"
          placeholderTextColor={Colors.light.icon}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={[styles.input, { backgroundColor: Colors.light.inputBackground, borderColor: Colors.light.inputBorder, color: Colors.light.text }]}
          placeholder="Confirm Password"
          placeholderTextColor={Colors.light.icon}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {/* Role Selection */}
        <Text style={[styles.label, { color: Colors.light.text }]}>Select Account Type</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'user' && styles.roleButtonSelected]}
            onPress={() => setRole('user')}
            activeOpacity={0.8}
          >
            <Text style={[styles.roleButtonText, role === 'user' && styles.roleButtonTextSelected]}>User</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleButton, role === 'admin' && styles.roleButtonSelected]}
            onPress={() => setRole('admin')}
            activeOpacity={0.8}
          >
            <Text style={[styles.roleButtonText, role === 'admin' && styles.roleButtonTextSelected]}>Admin</Text>
          </TouchableOpacity>
        </View>
        {error ? <Text style={[styles.error, { color: Colors.light.error }]}>{error}</Text> : null}
        {loading ? <ActivityIndicator color={Colors.light.tint} /> : (
          <TouchableOpacity style={styles.button} onPress={handleSignup} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/login' as any)}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Login</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  error: {
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
  },
  button: {
    backgroundColor: Colors.light.button,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
    shadowColor: Colors.light.button,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: Colors.light.buttonText,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  linkText: {
    color: Colors.light.icon,
    fontSize: 15,
  },
  linkHighlight: {
    color: Colors.light.tint,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.light.text,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    backgroundColor: Colors.light.inputBackground,
    borderWidth: 1,
    borderColor: Colors.light.inputBorder,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  roleButtonSelected: {
    backgroundColor: Colors.light.button,
    borderColor: Colors.light.button,
  },
  roleButtonText: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  roleButtonTextSelected: {
    color: Colors.light.buttonText,
    fontWeight: 'bold',
  },
});
