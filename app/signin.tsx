import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

const handleSignIn = async () => {
  if (!email || !password) {
    Alert.alert('Error', 'Please enter both email and password');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch('http://localhost:8000/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If not JSON, get the text to see what's wrong
      const text = await response.text();
      console.error('Non-JSON response from server:', text.substring(0, 200));
      throw new Error(`Server error: ${response.status}`);
    }

    console.log('Login response:', data);

    if (response.ok) {
      Alert.alert('Success', 'Login successful!');
      
      // FIX: Actually store the token instead of just logging it
      if (data.token) {
        console.log('User token:', data.token);
        await AsyncStorage.setItem('authToken', data.token);
        console.log('Token stored successfully!');
        
        // Verify storage
        const storedToken = await AsyncStorage.getItem('authToken');
        console.log('Verified stored token:', storedToken ? 'Token exists' : 'No token');
      } else {
        console.warn('No token received in login response');
      }
      
      // Redirect to tabs
      router.replace('/post');
    } else {
      // Handle login errors
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (data.non_field_errors) {
        errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
      } else if (data.error) {
        errorMessage = data.error;
      } else if (data.detail) {
        errorMessage = data.detail;
      } else if (typeof data === 'object') {
        // Extract first error
        const errorKeys = Object.keys(data);
        if (errorKeys.length > 0) {
          errorMessage = `${errorKeys[0]}: ${Array.isArray(data[errorKeys[0]]) ? data[errorKeys[0]][0] : data[errorKeys[0]]}`;
        }
      }
      
      Alert.alert('Login Failed', errorMessage);
    }
  } catch (error) {
    console.error('Login error:', error);
    Alert.alert('Error', 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity 
        onPress={handleSignIn} 
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>

      <Link href="/register" style={styles.link}>
        Don't have an account? Sign Up
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    padding: 20, 
    backgroundColor: "#fff" 
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    marginBottom: 30, 
    textAlign: "center" 
  },
  input: { 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 15,
    fontSize: 16,
  },
  button: { 
    backgroundColor: "#007AFF", 
    padding: 15, 
    borderRadius: 8,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: { 
    color: "#fff", 
    textAlign: "center", 
    fontWeight: "bold",
    fontSize: 16,
  },
  link: { 
    textAlign: "center", 
    marginTop: 20, 
    color: "#007AFF",
    fontSize: 16,
  },
});