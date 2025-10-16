import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import LayoutWithNav from '../components/LayoutWithNav';
import React, { useState, useEffect } from 'react';

// Types for better type safety
type Post = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  status: string;
  date: string;
  votes: number;
  comments: number;
  image: string | null;
  urgency: string;
};
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MyPostsScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);
  const [myPosts, setMyPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);


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

  // Fetch posts from backend
  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch('http://127.0.0.1:8000/post/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication token if needed
          'Authorization': `Token ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the API response to match your frontend structure
      const transformedPosts = data.posts?.map((post: any, index: number) => ({
        id: post.id?.toString() || (index + 1).toString(),
        title: post.title || 'Untitled Post',
        description: post.description || 'No description available',
        location: post.location || 'Location not specified',
        category: post.category || 'General',
        status: post.status || 'Reported',
        date: post.created_at ? new Date(post.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        votes: post.votes || 0,
        comments: post.comments_count || 0,
        image: post.image_url || null,
        urgency: post.urgency || 'medium',
      })) || [];

      setMyPosts(transformedPosts);
      
    } catch (error) {
      console.error('Error fetching posts:', error);
      Alert.alert(
        'Error',
        'Failed to load your posts. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      // Fallback to empty array
      setMyPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load posts on component mount
  React.useEffect(() => {
    fetchMyPosts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyPosts();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'reported': return '#FF3B30';
      case 'in progress': return '#FF9500';
      case 'completed': return '#34C759';
      case 'resolved': return '#34C759';
      case 'pending': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high': return 'warning';
      case 'medium': return 'alert-circle';
      case 'low': return 'information-circle';
      default: return 'help-circle';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => {
        // Navigate to post details if needed
        // router.push(`/post/${item.id}`);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) }]}>
            <Ionicons name={getUrgencyIcon(item.urgency)} size={12} color="#FFFFFF" />
            <Text style={styles.urgencyText}>{item.urgency}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.postDescription}>{item.description}</Text>
      
      <View style={styles.postDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="pricetag-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.category}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
      </View>

      <View style={styles.engagementContainer}>
        <View style={styles.engagementItem}>
          <Ionicons name="chevron-up" size={16} color="#007AFF" />
          <Text style={styles.engagementText}>{item.votes} votes</Text>
        </View>
        
        <View style={styles.engagementItem}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.engagementText}>{item.comments} comments</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LayoutWithNav>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>Your reported problems</Text>
        </View>

        {/* Posts List */}
        <FlatList
          data={myPosts}
          renderItem={renderPostItem}
          keyExtractor={item => item.id}
          style={styles.postsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {loading ? (
                <>
                  <Ionicons name="refresh" size={64} color="#CCC" />
                  <Text style={styles.emptyStateTitle}>Loading your posts...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={64} color="#CCC" />
                  <Text style={styles.emptyStateTitle}>No posts yet</Text>
                  <Text style={styles.emptyStateText}>
                    You haven't reported any problems yet. Start by creating your first post!
                  </Text>
                  <TouchableOpacity 
                    style={styles.createPostButton}
                    onPress={() => router.back()}
                  >
                    <Text style={styles.createPostButtonText}>Report a Problem</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          }
        />
      </View>
    </LayoutWithNav>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 21,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  postsList: {
    flex: 1,
    padding: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  postDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  postDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  engagementContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  engagementText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  createPostButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createPostButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});