import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';
import { auth } from '../utils/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
  await signInWithEmailAndPassword(auth, email, password);
  router.replace('/(tabs)' as any); // Redirect to home page
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.light.background }]}> 
      <View style={styles.card}>
        <Text style={[styles.title, { color: Colors.light.text }]}>Login</Text>
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
        {error ? <Text style={[styles.error, { color: Colors.light.error }]}>{error}</Text> : null}
        {loading ? <ActivityIndicator color={Colors.light.tint} /> : (
          <TouchableOpacity style={styles.button} onPress={handleLogin} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/signup' as any)}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkHighlight}>Sign Up</Text></Text>
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
});
