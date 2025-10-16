import { Link, Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";

export default function Register() {
  const [email, setEmail] = useState("");
  const [phonenum, setPhonenum] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword || !phonenum || !name) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match!');
      return;
    }
  
    // More flexible phone validation
    if (phonenum.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number (at least 10 digits)');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

      setLoading(true);

  try {
    const response = await fetch('http://localhost:8000/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        email: email,
        phone_number: phonenum,
        password: password,
        password2: confirmPassword,
      }),
    });

    const data = await response.json();
    console.log('Full response data:', data); // Add this to see the actual error

    if (response.status === 201) {
      Alert.alert('Success', 'Registration successful! Please login.');
      router.replace('/signin');
    } else {
      // Handle serializer validation errors
      let errorMessage = 'Registration failed. Please check your information.';
        
      if (data.name) {
        errorMessage = `Name: ${Array.isArray(data.name) ? data.name[0] : data.name}`;
      } else if (data.email) {
        errorMessage = `Email: ${Array.isArray(data.email) ? data.email[0] : data.email}`;
      } else if (data.phone_number) {
        errorMessage = `Phone: ${Array.isArray(data.phone_number) ? data.phone_number[0] : data.phone_number}`;
      } else if (data.password) {
        errorMessage = `Password: ${Array.isArray(data.password) ? data.password[0] : data.password}`;
      } else if (data.password2) {
        errorMessage = `Confirm Password: ${Array.isArray(data.password2) ? data.password2[0] : data.password2}`;
      } else if (data.non_field_errors) {
        errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
      }
      
      Alert.alert('Registration Failed', errorMessage);
    }
  } catch (error) {
    Alert.alert('Error', 'Registration failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        autoCapitalize="words"
      />
      
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
        placeholder="Phone Number"
        value={phonenum}
        onChangeText={setPhonenum}
        style={styles.input}
        keyboardType="phone-pad"
      />
      
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      
      <TextInput
        placeholder="Confirm Password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={styles.input}
      />

      <TouchableOpacity 
        onPress={handleRegister} 
        style={[styles.button, loading && styles.buttonDisabled]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <Link href="/signin" style={styles.link}>
        Already have an account? Sign In
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
    backgroundColor: "#28a745", 
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