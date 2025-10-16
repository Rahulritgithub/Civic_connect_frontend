import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ViewScreen() {
  const [problems, setProblems] = useState([
    {
      id: '1',
      title: 'Potholes on Main Street',
      description: 'Large potholes causing traffic issues and vehicle damage near downtown area.',
      location: 'Downtown',
      category: 'Infrastructure',
      votes: 24,
      comments: 8,
      userVoted: false,
      timestamp: '2 hours ago',
      urgency: 'high'
    },
    {
      id: '2',
      title: 'Street Light Not Working',
      description: 'Street light has been out for 3 days, making the area unsafe at night.',
      location: 'North Park',
      category: 'Public Safety',
      votes: 15,
      comments: 3,
      userVoted: true,
      timestamp: '5 hours ago',
      urgency: 'medium'
    },
    {
      id: '3',
      title: 'Garbage Collection Delay',
      description: 'Garbage hasn\'t been collected in our area for 4 days.',
      location: 'West Side',
      category: 'Sanitation',
      votes: 42,
      comments: 12,
      userVoted: false,
      timestamp: '1 day ago',
      urgency: 'medium'
    },
    {
      id: '4',
      title: 'Water Supply Issue',
      description: 'Low water pressure throughout the building for the past week.',
      location: 'Central Apartments',
      category: 'Utilities',
      votes: 31,
      comments: 6,
      userVoted: false,
      timestamp: '2 days ago',
      urgency: 'high'
    }
  ]);

  const [topProblems, setTopProblems] = useState([
    {
      id: '5',
      title: 'Park Maintenance Needed',
      description: 'Playground equipment is broken and needs immediate repair.',
      votes: 87,
      location: 'Central Park'
    },
    {
      id: '6',
      title: 'Traffic Signal Malfunction',
      description: 'Traffic light stuck on red during peak hours.',
      votes: 65,
      location: 'Main Intersection'
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const handleVote = (problemId: string) => {
    setProblems(problems.map(problem => {
      if (problem.id === problemId) {
        const voteChange = problem.userVoted ? -1 : 1;
        return {
          ...problem,
          votes: problem.votes + voteChange,
          userVoted: !problem.userVoted
        };
      }
      return problem;
    }));
  };

  const handleAddComment = (problemId: string) => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    // In a real app, you would send this to your backend
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
    : problems.filter(problem => problem.category.toLowerCase() === activeTab.toLowerCase());

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Community Problems</Text>
        <Text style={styles.subtitle}>Report and vote on local issues</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{problems.length}</Text>
          <Text style={styles.statLabel}>Active Issues</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {problems.reduce((sum, problem) => sum + problem.votes, 0)}
          </Text>
          <Text style={styles.statLabel}>Total Votes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {problems.reduce((sum, problem) => sum + problem.comments, 0)}
          </Text>
          <Text style={styles.statLabel}>Comments</Text>
        </View>
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tabsContainer}>
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

      {/* Top Problems Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={24} color="#FFD700" />
          <Text style={styles.sectionTitle}>Top Voted Problems</Text>
        </View>
        {topProblems.map((problem) => (
          <View key={problem.id} style={styles.topProblemCard}>
            <View style={styles.topProblemBadge}>
              <Ionicons name="trending-up" size={16} color="#FFFFFF" />
              <Text style={styles.topProblemBadgeText}>Top</Text>
            </View>
            <Text style={styles.topProblemTitle}>{problem.title}</Text>
            <Text style={styles.topProblemLocation}>{problem.location}</Text>
            <View style={styles.voteCount}>
              <Ionicons name="chevron-up" size={20} color="#34C759" />
              <Text style={styles.voteCountText}>{problem.votes} votes</Text>
            </View>
          </View>
        ))}
      </View>

      {/* All Problems Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list" size={24} color="#007AFF" />
          <Text style={styles.sectionTitle}>
            {activeTab === 'all' ? 'All Problems' : `${activeTab} Problems`}
          </Text>
        </View>

        {filteredProblems.map((problem) => (
          <View key={problem.id} style={styles.problemCard}>
            {/* Problem Header */}
            <View style={styles.problemHeader}>
              <View style={styles.problemMeta}>
                <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor(problem.urgency) }]} />
                <Text style={styles.problemCategory}>{problem.category}</Text>
                <Text style={styles.problemLocation}>• {problem.location}</Text>
                <Text style={styles.problemTime}>• {problem.timestamp}</Text>
              </View>
            </View>

            {/* Problem Content */}
            <Text style={styles.problemTitle}>{problem.title}</Text>
            <Text style={styles.problemDescription}>{problem.description}</Text>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={[styles.voteButton, problem.userVoted && styles.votedButton]}
                onPress={() => handleVote(problem.id)}
              >
                <Ionicons 
                  name={problem.userVoted ? "chevron-up" : "chevron-up-outline"} 
                  size={20} 
                  color={problem.userVoted ? "#FFFFFF" : "#007AFF"} 
                />
                <Text style={[styles.voteText, problem.userVoted && styles.votedText]}>
                  {problem.votes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.commentButton}>
                <Ionicons name="chatbubble-outline" size={18} color="#666666" />
                <Text style={styles.commentText}>{problem.comments}</Text>
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
        ))}
      </View>

      {/* Creative Features Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles" size={24} color="#AF52DE" />
          <Text style={styles.sectionTitle}>Community Features</Text>
        </View>
        
        <View style={styles.featuresGrid}>
          <TouchableOpacity style={styles.featureCard}>
            <Ionicons name="map" size={32} color="#007AFF" />
            <Text style={styles.featureTitle}>Problem Map</Text>
            <Text style={styles.featureDescription}>View issues on interactive map</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <Ionicons name="stats-chart" size={32} color="#34C759" />
            <Text style={styles.featureTitle}>Progress Tracker</Text>
            <Text style={styles.featureDescription}>Track resolution status</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <Ionicons name="people" size={32} color="#FF9500" />
            <Text style={styles.featureTitle}>Community</Text>
            <Text style={styles.featureDescription}>Connect with neighbors</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard}>
            <Ionicons name="medal" size={32} color="#FFD700" />
            <Text style={styles.featureTitle}>Leaderboard</Text>
            <Text style={styles.featureDescription}>Top contributors</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

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
    paddingHorizontal: 16,
    marginVertical: 16,
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
  topProblemCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topProblemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  topProblemBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  topProblemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  topProblemLocation: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  voteCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    marginLeft: 4,
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
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
  },
});