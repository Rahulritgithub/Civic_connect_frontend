// components/VoteButton.tsx
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VoteButtonProps {
  postId: number;
  initialVotes: number;
  initialUserVoted: boolean;
  onVoteUpdate?: (newVoteCount: number, userVoted: boolean) => void;
  compact?: boolean;
  disabled?: boolean;
}

export default function VoteButton({ 
  postId, 
  initialVotes, 
  initialUserVoted, 
  onVoteUpdate, 
  compact = false,
  disabled = false 
}: VoteButtonProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [hasVoted, setHasVoted] = useState(initialUserVoted);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setVotes(initialVotes);
    setHasVoted(initialUserVoted);
  }, [initialVotes, initialUserVoted]);

  const handleVote = async () => {
    if (disabled || isLoading) return;

    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        Alert.alert('Login Required', 'Please login to vote on posts.');
        return;
      }

      // Optimistic update
      const newVoteState = !hasVoted;
      const voteChange = newVoteState ? 1 : -1;
      const newVotesCount = votes + voteChange;

      setHasVoted(newVoteState);
      setVotes(newVotesCount);
      onVoteUpdate?.(newVotesCount, newVoteState);

      const response = await fetch(`http://127.0.0.1:8000/api/posts/${postId}/vote/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update with server response for consistency
        if (data.vote_count !== undefined) {
          setVotes(data.vote_count);
          setHasVoted(data.user_has_voted || newVoteState);
          onVoteUpdate?.(data.vote_count, data.user_has_voted || newVoteState);
        }
        
        console.log('Vote successful:', data);
      } else if (response.status === 401) {
        // Revert optimistic update on auth failure
        setHasVoted(hasVoted);
        setVotes(votes);
        onVoteUpdate?.(votes, hasVoted);
        
        Alert.alert('Session Expired', 'Please login again to vote.');
        await AsyncStorage.removeItem('authToken');
      } else {
        // Revert optimistic update on other errors
        setHasVoted(hasVoted);
        setVotes(votes);
        onVoteUpdate?.(votes, hasVoted);
        
        const errorText = await response.text();
        Alert.alert('Error', 'Failed to submit vote: ' + errorText);
      }
    } catch (error) {
      // Revert optimistic update on network errors
      setHasVoted(hasVoted);
      setVotes(votes);
      onVoteUpdate?.(votes, hasVoted);
      
      console.error('Voting error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.voteButtonCompact,
          hasVoted ? styles.votedButtonCompact : styles.notVotedButtonCompact,
          (isLoading || disabled) && styles.disabledButton
        ]}
        onPress={handleVote}
        disabled={isLoading || disabled}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#64748B" />
        ) : (
          <>
            <Ionicons 
              name={hasVoted ? "chevron-up" : "chevron-up-outline"} 
              size={20} 
              color={hasVoted ? "#10B981" : "#64748B"} 
            />
            <Text style={[
              styles.voteCountCompact,
              hasVoted && styles.votedCountCompact
            ]}>
              {votes}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.voteContainer}>
      <TouchableOpacity
        style={[
          styles.voteButton,
          hasVoted ? styles.votedButton : styles.notVotedButton,
          (isLoading || disabled) && styles.disabledButton
        ]}
        onPress={handleVote}
        disabled={isLoading || disabled}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#64748B" />
        ) : (
          <>
            <Ionicons 
              name={hasVoted ? "chevron-up-circle" : "chevron-up-circle-outline"} 
              size={24} 
              color={hasVoted ? "#10B981" : "#64748B"} 
            />
            <Text style={[
              styles.voteCount,
              hasVoted && styles.votedCount
            ]}>
              {votes}
            </Text>
          </>
        )}
      </TouchableOpacity>
      <Text style={styles.voteLabel}>Support</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  voteContainer: {
    alignItems: 'center',
    gap: 4,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 80,
    justifyContent: 'center',
  },
  notVotedButton: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  votedButton: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  voteButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  notVotedButtonCompact: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  votedButtonCompact: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  disabledButton: {
    opacity: 0.6,
  },
  voteCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    minWidth: 20,
    textAlign: 'center',
  },
  votedCount: {
    color: '#10B981',
  },
  voteCountCompact: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    minWidth: 16,
    textAlign: 'center',
  },
  votedCountCompact: {
    color: '#10B981',
  },
  voteLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});