import { useState, useCallback } from 'react';

interface CommunityActivityData {
  userId: string;
  communityId: string;
  communityName: string;
  action: 'joined' | 'left' | 'posted' | 'liked' | 'commented';
  data?: any;
}

interface ActivityResponse {
  success?: boolean;
  message: string;
  githubResult?: {
    commitUrl: string;
    sha: string;
    message: string;
    timestamp: string;
    filePath: string;
    stats: {
      totalJoins: number;
      totalPosts: number;
      totalInteractions: number;
      uniqueUsers: number;
    };
  };
  attempts: number;
  error?: string;
}

interface ActivityStatus {
  currentAttempts: number;
  maxAttempts: number;
  canTryAgain: boolean;
  lastResetTime: string;
  message: string;
  environment: {
    hasGithubToken: boolean;
    githubOwner: string;
    githubRepo: string;
  };
}

export function useCommunityActivity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recordActivity = useCallback(async (activityData: CommunityActivityData): Promise<ActivityResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/communities-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });

      const result: ActivityResponse = await response.json();

      if (!response.ok) {
        setError(result.message || 'Erro ao registrar atividade da comunidade');
        return result;
      }

      console.log('Atividade da comunidade registrada:', result);
      return result;

    } catch (err: any) {
      const errorMessage = err.message || 'Erro de conexão';
      setError(errorMessage);
      console.error('Erro ao registrar atividade da comunidade:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatus = useCallback(async (): Promise<ActivityStatus | null> => {
    try {
      const response = await fetch('/api/communities-activity');
      const status: ActivityStatus = await response.json();
      return status;
    } catch (err: any) {
      console.error('Erro ao obter status:', err);
      return null;
    }
  }, []);

  // Specific community action functions
  const recordJoin = useCallback((userId: string, communityId: string, communityName: string, additionalData?: any) => {
    return recordActivity({
      userId,
      communityId,
      communityName,
      action: 'joined',
      data: {
        joinDate: new Date().toISOString(),
        userAgent: navigator?.userAgent,
        ...additionalData
      }
    });
  }, [recordActivity]);

  const recordLeave = useCallback((userId: string, communityId: string, communityName: string, additionalData?: any) => {
    return recordActivity({
      userId,
      communityId,
      communityName,
      action: 'left',
      data: {
        leaveDate: new Date().toISOString(),
        reason: additionalData?.reason || 'user_request',
        ...additionalData
      }
    });
  }, [recordActivity]);

  const recordPost = useCallback((userId: string, communityId: string, communityName: string, postData: any) => {
    return recordActivity({
      userId,
      communityId,
      communityName,
      action: 'posted',
      data: {
        postDate: new Date().toISOString(),
        title: postData.title,
        content: postData.content?.substring(0, 100) + (postData.content?.length > 100 ? '...' : ''),
        hasImage: !!postData.image,
        ...postData
      }
    });
  }, [recordActivity]);

  const recordLike = useCallback((userId: string, communityId: string, communityName: string, targetData: any) => {
    return recordActivity({
      userId,
      communityId,
      communityName,
      action: 'liked',
      data: {
        likeDate: new Date().toISOString(),
        targetType: targetData.type || 'post', // 'post' or 'comment'
        targetId: targetData.id,
        ...targetData
      }
    });
  }, [recordActivity]);

  const recordComment = useCallback((userId: string, communityId: string, communityName: string, commentData: any) => {
    return recordActivity({
      userId,
      communityId,
      communityName,
      action: 'commented',
      data: {
        commentDate: new Date().toISOString(),
        postId: commentData.postId,
        comment: commentData.comment?.substring(0, 100) + (commentData.comment?.length > 100 ? '...' : ''),
        ...commentData
      }
    });
  }, [recordActivity]);

  return {
    // States
    loading,
    error,
    
    // General functions
    recordActivity,
    getStatus,
    
    // Specific community actions
    recordJoin,
    recordLeave,
    recordPost,
    recordLike,
    recordComment,
  };
}
