import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
// Define TypeScript interfaces
interface Problem {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  urgency: string;
  votes: number;
  comments: number;
  userVoted: boolean;
  created_at: string;
  user_has_voted?: boolean;
}

interface ApiResponse {
  success: boolean;
  posts: Problem[];
  error?: string;
}

interface VoteResponse {
  success: boolean;
  post?: Problem;
  error?: string;
}

 const router = useRouter();

export default function ViewScreen() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [votingInProgress, setVotingInProgress] = useState<Set<string>>(new Set());
  const [topProblems, setTopProblems] = useState<Problem[]>([
    {
      id: '5',
      title: 'Park Maintenance Needed',
      description: 'Playground equipment is broken and needs immediate repair.',
      votes: 87,
      location: 'Central Park',
      category: 'Infrastructure',
      urgency: 'medium',
      comments: 0,
      userVoted: false,
      created_at: new Date().toISOString()
    },
    {
      id: '6',
      title: 'Traffic Signal Malfunction',
      description: 'Traffic light stuck on red during peak hours.',
      votes: 65,
      location: 'Main Intersection',
      category: 'Public Safety',
      urgency: 'high',
      comments: 0,
      userVoted: false,
      created_at: new Date().toISOString()
    }
  ]);
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    getAllPosts();
  }, []);

  const loadVotedPosts = async (): Promise<Record<string, boolean>> => {
    try {
      const votedPostsJson = await AsyncStorage.getItem('votedPosts');
      if (votedPostsJson) {
        return JSON.parse(votedPostsJson);
      }
    } catch (error) {
      console.error('Error loading voted posts:', error);
    }
    return {};
  };

  const saveVotedPost = async (problemId: string, isVoted: boolean) => {
    try {
      const votedPosts = await loadVotedPosts();
      if (isVoted) {
        votedPosts[problemId] = true;
      } else {
        delete votedPosts[problemId];
      }
      await AsyncStorage.setItem('votedPosts', JSON.stringify(votedPosts));
    } catch (error) {
      console.error('Error saving voted post:', error);
    }
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

  const handleVote = async (problemId: string) => {
    if (votingInProgress.has(problemId)) {
      return;
    }

    try {
      setVotingInProgress(prev => new Set(prev).add(problemId));

      const currentProblem = problems.find(p => p.id === problemId);
      if (!currentProblem) return;

      const wasVoted = currentProblem.userVoted || false;
      const currentVotes = currentProblem.votes || 0;
      const newVoteState = !wasVoted;
      const voteChange = newVoteState ? 1 : -1;
      const newVotesCount = currentVotes + voteChange;

      // Optimistic UI update
      setProblems(currentProblems => 
        currentProblems.map(problem => 
          problem.id === problemId ? {
            ...problem,
            votes: newVotesCount,
            userVoted: newVoteState
          } : problem
        )
      );

      await saveVotedPost(problemId, newVoteState);

      // For development - try without authentication first
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Try to get CSRF token if needed
      const csrfToken = await AsyncStorage.getItem('csrftoken');
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const response = await fetch(`http://127.0.0.1:8000/api/posts/${problemId}/public_vote/`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          vote: newVoteState
        }),
        credentials: 'include' // Include cookies if needed
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        
        if (response.status === 403) {
          // Try to get more details from response
          try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.error || 'Authentication or CORS issue';
          } catch {
            errorMessage = 'CORS or Authentication issue. Check backend configuration.';
          }
        }
        
        throw new Error(errorMessage);
      }

      const data: VoteResponse = await response.json();
      
      if (data.success) {
        console.log('Vote updated successfully on server');
        
        // Sync with server response if available
        if (data.post) {
          setProblems(currentProblems => 
            currentProblems.map(problem => 
              problem.id === problemId ? {
                ...problem,
                votes: data.post!.votes,
                userVoted: data.post!.user_has_voted || false
              } : problem
            )
          );
        }
      } else {
        throw new Error(data.error || 'Failed to update vote');
      }

    } catch (error) {
      console.error('Error updating vote:', error);
      
      // Revert optimistic update
      setProblems(currentProblems => 
        currentProblems.map(problem => {
          if (problem.id === problemId) {
            const originalProblem = problems.find(p => p.id === problemId);
            return originalProblem ? { ...originalProblem } : problem;
          }
          return problem;
        })
      );
      
      await saveVotedPost(problemId, false);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update vote. Please try again.';
      
      // Show specific guidance for CORS issues
      if (errorMessage.includes('CORS')) {
        Alert.alert(
          'Connection Issue', 
          'Please check your Django CORS configuration. Make sure corsheaders is installed and configured properly.'
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setVotingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(problemId);
        return newSet;
      });
    }
  };

  const getAllPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:8000/view_all_posts/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        const votedPosts = await loadVotedPosts();
        
        const postsWithVoteStatus: Problem[] = data.posts.map(post => ({
          ...post,
          userVoted: votedPosts[post.id] || post.user_has_voted || false,
          votes: post.votes || 0,
          comments: post.comments || 0,
          category: post.category || 'General',
          urgency: post.urgency || 'medium',
          location: post.location || 'Unknown Location',
          created_at: post.created_at || new Date().toISOString()
        }));
        
        setProblems(postsWithVoteStatus);
        setError('');
      } else {
        setError('Failed to fetch posts: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError('Error fetching posts: ' + errorMessage);
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = (problemId: string) => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    Alert.alert('Success', 'Comment added!');
    setNewComment('');
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const filteredProblems = activeTab === 'all' 
    ? problems 
    : problems.filter(problem => problem.category && problem.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community Problems</Text>
        <Text style={styles.subtitle}>Report and vote on local issues</Text>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      )}

      {/* Error State */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={24} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={getAllPosts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{loading ? '-' : problems.length}</Text>
          <Text style={styles.statLabel}>Active Issues</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {loading ? '-' : problems.reduce((sum, problem) => sum + (problem.votes || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Total Votes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {loading ? '-' : problems.reduce((sum, problem) => sum + (problem.comments || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Comments</Text>
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContentContainer}
      >
        {['All', 'Infrastructure', 'Public Safety', 'Sanitation', 'Utilities', 'Other'].map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.tab, activeTab === category.toLowerCase() && styles.activeTab]}
            onPress={() => setActiveTab(category.toLowerCase())}
          >
            <Text style={[styles.tabText, activeTab === category.toLowerCase() && styles.activeTabText]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* All Problems Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>
            {activeTab === 'all' ? 'All Problems' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Problems`}
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={getAllPosts}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {!loading && problems.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No problems reported yet</Text>
            <Text style={styles.emptyStateSubtext}>Be the first to report an issue!</Text>
          </View>
        )}

        {filteredProblems.map((problem) => {
          const isVoting = votingInProgress.has(problem.id);
          
          return (
            <View key={problem.id} style={styles.problemCard}>
              {/* Problem Header */}
              <View style={styles.problemHeader}>
                <View style={styles.problemMeta}>
                  <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor(problem.urgency || 'medium') }]} />
                  <Text style={styles.problemCategory}>{problem.category || 'General'}</Text>
                  <Text style={styles.problemLocation}>• {problem.location || 'Unknown Location'}</Text>
                  <Text style={styles.problemTime}>• {problem.created_at ? new Date(problem.created_at).toLocaleDateString() : 'Recently'}</Text>
                </View>
              </View>

              {/* Problem Content */}
              <Text style={styles.problemTitle}>{problem.title || 'Untitled'}</Text>
              <Text style={styles.problemDescription}>{problem.description || 'No description provided'}</Text>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[
                    styles.voteButton, 
                    problem.userVoted && styles.votedButton,
                    isVoting && styles.disabledButton
                  ]}
                  onPress={() => handleVote(problem.id)}
                  disabled={isVoting}
                >
                  {isVoting ? (
                    <Ionicons name="hourglass-outline" size={20} color="#666666" />
                  ) : (
                    <Ionicons 
                      name={problem.userVoted ? "chevron-up" : "chevron-up-outline"} 
                      size={20} 
                      color={problem.userVoted ? "#FFFFFF" : "#007AFF"} 
                    />
                  )}
                  <Text style={[styles.voteText, problem.userVoted && styles.votedText]}>
                    {problem.votes || 0}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.commentButton}>
                  <Ionicons name="chatbubble-outline" size={18} color="#666666" />
                  <Text style={styles.commentText}>{problem.comments || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareButton}>
                  <Ionicons name="share-outline" size={18} color="#666666" />
                  <Text style={styles.shareText}>Share</Text>
                </TouchableOpacity>
              </View>

              {/* Add Comment */}
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                />
                <TouchableOpacity 
                  style={styles.commentSubmitButton}
                  onPress={() => handleAddComment(problem.id)}
                >
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// Keep the same styles as before...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#34C759',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  tabsContainer: {
    marginVertical: 16,
  },
  tabsContentContainer: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  activeTab: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginLeft: 8,
  },
  problemCard: {
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
  problemHeader: {
    marginBottom: 8,
  },
  problemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  urgencyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  problemCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 6,
  },
  problemLocation: {
    fontSize: 12,
    color: '#666666',
    marginRight: 6,
  },
  problemTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  problemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  problemDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
  },
  votedButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  voteText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 4,
  },
  votedText: {
    color: '#FFFFFF',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
  },
  commentText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  shareText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    marginRight: 8,
  },
  commentSubmitButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 20,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FFE5E5',
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginVertical: 8,
  },
  retryButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  refreshButton: {
    marginLeft: 'auto',
    padding: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
  },
});