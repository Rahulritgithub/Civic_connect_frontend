import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const { width: screenWidth } = Dimensions.get('window');

export default function PostScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [urgency, setUrgency] = useState('medium');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();

  const categories = [
    { label: '🚧 Infrastructure', value: 'infrastructure', icon: 'construct' },
    { label: '🧹 Sanitation', value: 'sanitation', icon: 'water' },
    { label: '🛡️ Safety', value: 'public_safety', icon: 'shield-checkmark' },
    { label: '⚡ Utilities', value: 'utilities', icon: 'flash' },
    { label: '🌳 Environment', value: 'environment', icon: 'leaf' },
    { label: '📝 Other', value: 'other', icon: 'ellipsis-horizontal' },
  ];

  const urgencyData = {
    low: { label: 'Low', color: '#34C759', icon: 'alert-circle-outline' },
    medium: { label: 'Medium', color: '#FF9500', icon: 'alert-circle' },
    high: { label: 'High', color: '#FF3B30', icon: 'warning' },
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setIsLoggedIn(!!token);
      
      if (!token) {
        Alert.alert(
          'Login Required',
          'You need to be logged in to create a post.',
          [
            { 
              text: 'Cancel', 
              onPress: () => router.back() 
            },
            { 
              text: 'Login', 
              onPress: () => router.push('/signin') 
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      setIsLoggedIn(false);
    }
  };

  const pickImage = async () => {
    if (!isLoggedIn) {
      showLoginAlert();
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your gallery.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    if (!isLoggedIn) {
      showLoginAlert();
      return;
    }

    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your camera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const showLoginAlert = () => {
    Alert.alert(
      'Login Required',
      'You need to be logged in to perform this action.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/signin') }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      showLoginAlert();
      return;
    }

    if (!description || !category) {
      Alert.alert('Error', 'Please fill in description and category');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalLocation = location;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const currentPosition = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest,
          });
          const { latitude, longitude } = currentPosition.coords;
          finalLocation = `${latitude},${longitude}`;
          console.log('GPS location used:', finalLocation);
        } else {
          console.log('Location permission denied, using manual location.');
        }
      } catch (locErr) {
        console.log('GPS fetch error:', locErr);
      }

      if (!finalLocation) {
        Alert.alert('Error', 'Unable to get location. Please enter it manually.');
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      if (title) formData.append('title', title);
      formData.append('description', description);
      formData.append('location', finalLocation);
      formData.append('category', category);
      formData.append('urgency', urgency);

      if (image) {
        const fileExtension = image.split('.').pop();
        const mimeType = `image/${fileExtension}`;
        formData.append('image', {
          uri: image,
          type: mimeType,
          name: `post_image_${Date.now()}.${fileExtension}`,
        } as any);
      }

      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch('http://127.0.0.1:8000/post/', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please log in again.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Login', onPress: () => router.push('/signin') },
            ]
          );
          await AsyncStorage.removeItem('authToken');
          setIsLoggedIn(false);
          return;
        }

        const errorText = await response.text();
        Alert.alert('Error', errorText || `Server error: ${response.status}`);
        return;
      }

      const data = await response.json();
      if (data.success) {
        Alert.alert('Success', data.message, [
          {
            text: 'OK',
            onPress: () => {
              setTitle('');
              setDescription('');
              setLocation('');
              setCategory('');
              setImage(null);
              setUrgency('medium');
              router.push('/');
            },
          },
        ]);
      } else {
        Alert.alert('Error', data.error || 'Failed to submit post');
      }
    } catch (error) {
      console.error('Submission error:', error);
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToMyPosts = () => {
    if (!isLoggedIn) {
      showLoginAlert();
      return;
    }
    router.push('/myposts');
  };

  const navigateToLogin = () => {
    router.push('/signin');
  };

  if (isLoggedIn === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        <View style={styles.loginContent}>
          <View style={styles.loginIconContainer}>
            <Ionicons name="lock-closed" size={80} color="#6366F1" />
          </View>
          <Text style={styles.loginTitle}>Authentication Required</Text>
          <Text style={styles.loginSubtitle}>
            You need to be logged in to create a post and help improve your community.
          </Text>
          <TouchableOpacity style={styles.loginButton} onPress={navigateToLogin}>
            <Text style={styles.loginButtonText}>Login to Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerBackground}>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Report an Issue</Text>
              <Text style={styles.headerSubtitle}>Help improve your community</Text>
            </View>
            <TouchableOpacity style={styles.myPostsButton} onPress={navigateToMyPosts}>
              <Ionicons name="list" size={20} color="#FFFFFF" />
              <Text style={styles.myPostsButtonText}>My Posts</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Problem Title */}
          <View style={styles.inputCard}>
            <View style={styles.labelContainer}>
              <Ionicons name="document-text" size={18} color="#6366F1" />
              <Text style={styles.label}>Problem Title</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Brief description of the problem"
              value={title}
              onChangeText={setTitle}
              editable={!isSubmitting}
            />
          </View>

          {/* Description */}
          <View style={styles.inputCard}>
            <View style={styles.labelContainer}>
              <Ionicons name="create" size={18} color="#6366F1" />
              <Text style={styles.label}>Description *</Text>
            </View>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detailed description of the issue..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>

          {/* Location */}
          <View style={styles.inputCard}>
            <View style={styles.labelContainer}>
              <Ionicons name="location" size={18} color="#6366F1" />
              <Text style={styles.label}>Location *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Where is this problem located?"
              value={location}
              onChangeText={setLocation}
              editable={!isSubmitting}
            />
          </View>

          {/* Category */}
          <View style={styles.inputCard}>
            <View style={styles.labelContainer}>
              <Ionicons name="grid" size={18} color="#6366F1" />
              <Text style={styles.label}>Category *</Text>
            </View>
            <View style={styles.categoryContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    category === cat.value && styles.categoryButtonActive,
                    isSubmitting && styles.disabledButton,
                  ]}
                  onPress={() => setCategory(cat.value)}
                  disabled={isSubmitting}
                >
                  <Ionicons 
                    name={cat.icon as any} 
                    size={16} 
                    color={category === cat.value ? '#FFFFFF' : '#6366F1'} 
                  />
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat.value && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Urgency Level */}
          <View style={styles.inputCard}>
            <View style={styles.labelContainer}>
              <Ionicons name="flag" size={18} color="#6366F1" />
              <Text style={styles.label}>Urgency Level</Text>
            </View>
            <View style={styles.urgencyContainer}>
              {Object.entries(urgencyData).map(([level, data]) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.urgencyButton,
                    urgency === level && styles.urgencyButtonActive,
                    urgency === level && { backgroundColor: data.color },
                    isSubmitting && styles.disabledButton,
                  ]}
                  onPress={() => setUrgency(level)}
                  disabled={isSubmitting}
                >
                  <Ionicons 
                    name={data.icon as any} 
                    size={20} 
                    color={urgency === level ? '#FFFFFF' : data.color} 
                  />
                  <Text
                    style={[
                      styles.urgencyButtonText,
                      urgency === level && styles.urgencyButtonTextActive,
                    ]}
                  >
                    {data.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Photo Upload */}
          <View style={styles.inputCard}>
            <View style={styles.labelContainer}>
              <Ionicons name="camera" size={18} color="#6366F1" />
              <Text style={styles.label}>Add Photo (Optional)</Text>
            </View>
            
            {image && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => setImage(null)}
                  disabled={isSubmitting}
                >
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity 
                style={[styles.imageButton, isSubmitting && styles.disabledButton]} 
                onPress={pickImage}
                disabled={isSubmitting}
              >
                <View style={styles.imageButtonIcon}>
                  <Ionicons name="image" size={24} color="#6366F1" />
                </View>
                <Text style={styles.imageButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.imageButton, isSubmitting && styles.disabledButton]} 
                onPress={takePhoto}
                disabled={isSubmitting}
              >
                <View style={styles.imageButtonIcon}>
                  <Ionicons name="camera" size={24} color="#6366F1" />
                </View>
                <Text style={styles.imageButtonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[
              styles.submitButton, 
              isSubmitting && styles.submitButtonDisabled
            ]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  loginContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  loginIconContainer: {
    backgroundColor: '#EEF2FF',
    padding: 20,
    borderRadius: 50,
    marginBottom: 24,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: '#6366F1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  backButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#6366F1',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerBackground: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#E0E7FF',
    opacity: 0.9,
  },
  myPostsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  myPostsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  formContainer: {
    gap: 16,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    minWidth: (screenWidth - 72) / 2,
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  urgencyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  urgencyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  urgencyButtonActive: {
    borderColor: 'transparent',
  },
  urgencyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  urgencyButtonTextActive: {
    color: '#FFFFFF',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    gap: 8,
  },
  imageButtonIcon: {
    backgroundColor: '#EEF2FF',
    padding: 8,
    borderRadius: 8,
  },
  imageButtonText: {
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 32,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});