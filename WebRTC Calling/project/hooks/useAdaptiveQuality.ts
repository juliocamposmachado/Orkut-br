'use client';

import { useCallback, useEffect, useRef } from 'react';
import { STREAM_QUALITIES } from './useStreaming';

export interface ConnectionMetrics {
  bitrate: number;
  packetLoss: number;
  rtt: number; // Round trip time
  jitter: number;
  bandwidth: number;
}

export interface QualityRecommendation {
  quality: keyof typeof STREAM_QUALITIES;
  reason: string;
  confidence: number; // 0-1 scale
}

interface UseAdaptiveQualityProps {
  currentQuality: keyof typeof STREAM_QUALITIES;
  onQualityChange: (quality: keyof typeof STREAM_QUALITIES) => void;
  enabled?: boolean;
  aggressiveness?: 'conservative' | 'balanced' | 'aggressive';
}

export function useAdaptiveQuality({
  currentQuality,
  onQualityChange,
  enabled = true,
  aggressiveness = 'balanced'
}: UseAdaptiveQualityProps) {
  const metricsHistory = useRef<ConnectionMetrics[]>([]);
  const lastQualityChange = useRef<Date | null>(null);
  const stabilityPeriod = useRef(0); // Consecutive periods with stable metrics
  
  // Quality change thresholds based on aggressiveness
  const thresholds = {
    conservative: {
      minStabilityPeriods: 5,
      packetLossUpgrade: 0.01,
      packetLossDowngrade: 0.05,
      bitrateMargin: 1.5,
      changeIntervalMs: 30000, // 30 seconds minimum between changes
    },
    balanced: {
      minStabilityPeriods: 3,
      packetLossUpgrade: 0.02,
      packetLossDowngrade: 0.03,
      bitrateMargin: 1.2,
      changeIntervalMs: 15000, // 15 seconds minimum between changes
    },
    aggressive: {
      minStabilityPeriods: 2,
      packetLossUpgrade: 0.03,
      packetLossDowngrade: 0.02,
      bitrateMargin: 1.1,
      changeIntervalMs: 5000, // 5 seconds minimum between changes
    },
  };

  const config = thresholds[aggressiveness];

  /**
   * Calculate average metrics from recent history
   */
  const calculateAverageMetrics = useCallback((windowSize: number = 5): ConnectionMetrics => {
    const recentMetrics = metricsHistory.current.slice(-windowSize);
    if (recentMetrics.length === 0) {
      return {
        bitrate: 0,
        packetLoss: 0,
        rtt: 0,
        jitter: 0,
        bandwidth: 0,
      };
    }

    return {
      bitrate: recentMetrics.reduce((sum, m) => sum + m.bitrate, 0) / recentMetrics.length,
      packetLoss: recentMetrics.reduce((sum, m) => sum + m.packetLoss, 0) / recentMetrics.length,
      rtt: recentMetrics.reduce((sum, m) => sum + m.rtt, 0) / recentMetrics.length,
      jitter: recentMetrics.reduce((sum, m) => sum + m.jitter, 0) / recentMetrics.length,
      bandwidth: recentMetrics.reduce((sum, m) => sum + m.bandwidth, 0) / recentMetrics.length,
    };
  }, []);

  /**
   * Estimate available bandwidth based on connection metrics
   */
  const estimateBandwidth = useCallback((metrics: ConnectionMetrics): number => {
    // Simple bandwidth estimation based on current bitrate and packet loss
    const baseEstimate = metrics.bitrate;
    const lossAdjustment = Math.max(0, 1 - (metrics.packetLoss * 10));
    const rttAdjustment = Math.max(0.5, 1 - (metrics.rtt / 1000));
    
    return baseEstimate * lossAdjustment * rttAdjustment;
  }, []);

  /**
   * Get quality recommendation based on current metrics
   */
  const getQualityRecommendation = useCallback((metrics: ConnectionMetrics): QualityRecommendation => {
    const estimatedBandwidth = estimateBandwidth(metrics);
    const currentQualityBitrate = STREAM_QUALITIES[currentQuality].bitrate;

    // Check if we should upgrade quality
    if (currentQuality !== 'high') {
      const nextQuality = currentQuality === 'low' ? 'medium' : 'high';
      const nextQualityBitrate = STREAM_QUALITIES[nextQuality].bitrate;
      
      if (estimatedBandwidth > nextQualityBitrate * config.bitrateMargin &&
          metrics.packetLoss < config.packetLossUpgrade &&
          metrics.rtt < 200) {
        return {
          quality: nextQuality,
          reason: `Good connection quality allows upgrade to ${nextQuality}`,
          confidence: Math.min(1, (estimatedBandwidth / nextQualityBitrate) / config.bitrateMargin),
        };
      }
    }

    // Check if we should downgrade quality
    if (currentQuality !== 'low') {
      const prevQuality = currentQuality === 'high' ? 'medium' : 'low';
      
      if (metrics.packetLoss > config.packetLossDowngrade ||
          estimatedBandwidth < currentQualityBitrate ||
          metrics.rtt > 500) {
        return {
          quality: prevQuality,
          reason: metrics.packetLoss > config.packetLossDowngrade 
            ? `High packet loss (${(metrics.packetLoss * 100).toFixed(1)}%) requires downgrade`
            : estimatedBandwidth < currentQualityBitrate
            ? `Insufficient bandwidth for current quality`
            : `High latency (${metrics.rtt}ms) requires downgrade`,
          confidence: Math.min(1, Math.max(
            metrics.packetLoss / config.packetLossDowngrade,
            currentQualityBitrate / estimatedBandwidth,
            metrics.rtt / 500
          )),
        };
      }
    }

    // No change recommended
    return {
      quality: currentQuality,
      reason: 'Current quality is optimal for connection',
      confidence: 0.8,
    };
  }, [currentQuality, estimateBandwidth, config]);

  /**
   * Check if metrics are stable enough to make quality decisions
   */
  const areMetricsStable = useCallback((windowSize: number = 3): boolean => {
    if (metricsHistory.current.length < windowSize) {
      return false;
    }

    const recentMetrics = metricsHistory.current.slice(-windowSize);
    const avgPacketLoss = recentMetrics.reduce((sum, m) => sum + m.packetLoss, 0) / recentMetrics.length;
    const avgRtt = recentMetrics.reduce((sum, m) => sum + m.rtt, 0) / recentMetrics.length;

    // Check variance in key metrics
    const packetLossVariance = recentMetrics.reduce((sum, m) => 
      sum + Math.pow(m.packetLoss - avgPacketLoss, 2), 0) / recentMetrics.length;
    const rttVariance = recentMetrics.reduce((sum, m) => 
      sum + Math.pow(m.rtt - avgRtt, 2), 0) / recentMetrics.length;

    // Metrics are stable if variance is low
    return packetLossVariance < 0.001 && rttVariance < 10000; // 100ms std dev
  }, []);

  /**
   * Process new connection metrics and potentially trigger quality change
   */
  const processMetrics = useCallback((metrics: ConnectionMetrics) => {
    if (!enabled) return;

    // Add metrics to history (keep last 10 entries)
    metricsHistory.current.push(metrics);
    if (metricsHistory.current.length > 10) {
      metricsHistory.current.shift();
    }

    // Check if enough time has passed since last quality change
    if (lastQualityChange.current) {
      const timeSinceLastChange = Date.now() - lastQualityChange.current.getTime();
      if (timeSinceLastChange < config.changeIntervalMs) {
        return;
      }
    }

    // Check if we have enough stable metrics
    if (areMetricsStable()) {
      stabilityPeriod.current++;
    } else {
      stabilityPeriod.current = 0;
    }

    if (stabilityPeriod.current < config.minStabilityPeriods) {
      return;
    }

    // Get quality recommendation based on average metrics
    const avgMetrics = calculateAverageMetrics();
    const recommendation = getQualityRecommendation(avgMetrics);

    // Apply quality change if recommended and confidence is high enough
    if (recommendation.quality !== currentQuality && recommendation.confidence > 0.7) {
      console.log('Adaptive quality change:', {
        from: currentQuality,
        to: recommendation.quality,
        reason: recommendation.reason,
        confidence: recommendation.confidence,
        metrics: avgMetrics,
      });

      onQualityChange(recommendation.quality);
      lastQualityChange.current = new Date();
      stabilityPeriod.current = 0; // Reset stability period after change
    }
  }, [enabled, config, currentQuality, areMetricsStable, calculateAverageMetrics, getQualityRecommendation, onQualityChange]);

  /**
   * Extract metrics from WebRTC stats
   */
  const extractMetricsFromStats = useCallback((stats: RTCStatsReport): ConnectionMetrics | null => {
    let inboundStats: any = null;
    let candidatePairStats: any = null;

    // Find relevant stats
    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        inboundStats = report;
      } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        candidatePairStats = report;
      }
    });

    if (!inboundStats) return null;

    const packetLoss = inboundStats.packetsLost && inboundStats.packetsReceived 
      ? inboundStats.packetsLost / (inboundStats.packetsLost + inboundStats.packetsReceived)
      : 0;

    return {
      bitrate: Math.round((inboundStats.bytesReceived * 8) / 1000) || 0, // kbps
      packetLoss,
      rtt: candidatePairStats?.currentRoundTripTime * 1000 || 0, // ms
      jitter: inboundStats.jitter || 0,
      bandwidth: Math.round((inboundStats.bytesReceived * 8) / 1000) || 0, // Simplified
    };
  }, []);

  /**
   * Start monitoring connection metrics from peer connection
   */
  const startMonitoring = useCallback((peerConnection: RTCPeerConnection) => {
    if (!enabled) return;

    const monitorInterval = setInterval(async () => {
      try {
        const stats = await peerConnection.getStats();
        const metrics = extractMetricsFromStats(stats);
        
        if (metrics) {
          processMetrics(metrics);
        }
      } catch (error) {
        console.error('Failed to get connection stats:', error);
      }
    }, 2000); // Check every 2 seconds

    return () => {
      clearInterval(monitorInterval);
    };
  }, [enabled, extractMetricsFromStats, processMetrics]);

  /**
   * Reset quality adaptation state
   */
  const reset = useCallback(() => {
    metricsHistory.current = [];
    lastQualityChange.current = null;
    stabilityPeriod.current = 0;
  }, []);

  /**
   * Get current metrics summary
   */
  const getCurrentMetrics = useCallback((): ConnectionMetrics | null => {
    return metricsHistory.current.length > 0 
      ? calculateAverageMetrics(1)
      : null;
  }, [calculateAverageMetrics]);

  /**
   * Force quality evaluation with current metrics
   */
  const evaluateQuality = useCallback((): QualityRecommendation | null => {
    if (metricsHistory.current.length === 0) return null;
    
    const avgMetrics = calculateAverageMetrics();
    return getQualityRecommendation(avgMetrics);
  }, [calculateAverageMetrics, getQualityRecommendation]);

  return {
    processMetrics,
    startMonitoring,
    reset,
    getCurrentMetrics,
    evaluateQuality,
    isStable: areMetricsStable(),
    stabilityPeriod: stabilityPeriod.current,
  };
}
