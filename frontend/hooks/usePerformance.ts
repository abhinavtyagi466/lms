import { useEffect, useState, useCallback } from 'react';

interface PerformanceMetrics {
  isSlowConnection: boolean;
  connectionType: string;
  loadTime: number;
  memoryUsage?: number;
  isLowEndDevice: boolean;
}

interface PerformanceConfig {
  enableLogging?: boolean;
  slowConnectionThreshold?: number;
  lowEndDeviceThreshold?: number;
}

export const usePerformance = (config: PerformanceConfig = {}) => {
  const {
    enableLogging = false,
    slowConnectionThreshold = 2, // 2G or slower
    lowEndDeviceThreshold = 4 // Less than 4GB RAM
  } = config;

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    isSlowConnection: false,
    connectionType: 'unknown',
    loadTime: 0,
    isLowEndDevice: false
  });

  const [isLoading, setIsLoading] = useState(true);

  // Detect connection speed and device capabilities
  useEffect(() => {
    const detectPerformance = () => {
      const newMetrics: PerformanceMetrics = {
        isSlowConnection: false,
        connectionType: 'unknown',
        loadTime: 0,
        isLowEndDevice: false
      };

      // Check network connection
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        newMetrics.connectionType = connection.effectiveType || 'unknown';
        
        // Consider 2G and slow-2G as slow connections
        const slowTypes = ['slow-2g', '2g'];
        newMetrics.isSlowConnection = slowTypes.includes(connection.effectiveType);
        
        if (enableLogging) {
          console.log('Network connection:', {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt
          });
        }
      }

      // Check device memory (if available)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        newMetrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        
        // Consider devices with less than 4GB as low-end
        const totalMemory = memory.totalJSHeapSize / 1024 / 1024;
        newMetrics.isLowEndDevice = totalMemory < lowEndDeviceThreshold * 1024;
        
        if (enableLogging) {
          console.log('Memory usage:', {
            used: newMetrics.memoryUsage,
            total: totalMemory,
            limit: memory.jsHeapSizeLimit / 1024 / 1024
          });
        }
      }

      // Check hardware concurrency (CPU cores)
      if ('hardwareConcurrency' in navigator) {
        const cores = navigator.hardwareConcurrency;
        if (cores && cores < 4) {
          newMetrics.isLowEndDevice = true;
        }
        
        if (enableLogging) {
          console.log('CPU cores:', cores);
        }
      }

      setMetrics(newMetrics);
      setIsLoading(false);
    };

    // Initial detection
    detectPerformance();

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', detectPerformance);
      
      return () => {
        connection.removeEventListener('change', detectPerformance);
      };
    }
  }, [enableLogging, slowConnectionThreshold, lowEndDeviceThreshold]);

  // Measure load time for components
  const measureLoadTime = useCallback((componentName: string, startTime?: number) => {
    const endTime = performance.now();
    const loadTime = startTime ? endTime - startTime : 0;
    
    if (enableLogging) {
      console.log(`Load time for ${componentName}:`, `${loadTime.toFixed(2)}ms`);
    }
    
    setMetrics(prev => ({
      ...prev,
      loadTime
    }));
    
    return loadTime;
  }, [enableLogging]);

  // Get performance recommendations
  const getRecommendations = useCallback(() => {
    const recommendations: string[] = [];
    
    if (metrics.isSlowConnection) {
      recommendations.push('Consider reducing image quality or using lower resolution videos');
      recommendations.push('Enable data saver mode for faster loading');
    }
    
    if (metrics.isLowEndDevice) {
      recommendations.push('Reduce animation complexity for better performance');
      recommendations.push('Limit concurrent data requests');
    }
    
    if (metrics.loadTime > 3000) {
      recommendations.push('Consider implementing lazy loading for heavy components');
      recommendations.push('Optimize bundle size and reduce JavaScript payload');
    }
    
    return recommendations;
  }, [metrics]);

  // Check if we should show lightweight version
  const shouldUseLightweightMode = useCallback(() => {
    return metrics.isSlowConnection || metrics.isLowEndDevice;
  }, [metrics]);

  // Get optimized configuration based on performance
  const getOptimizedConfig = useCallback(() => {
    return {
      enableAnimations: !metrics.isLowEndDevice,
      enableHighQualityImages: !metrics.isSlowConnection,
      enableRealTimeUpdates: !metrics.isSlowConnection,
      maxConcurrentRequests: metrics.isLowEndDevice ? 2 : 5,
      cacheDuration: metrics.isSlowConnection ? 600 : 300, // seconds
      enableVirtualScrolling: metrics.isLowEndDevice
    };
  }, [metrics]);

  return {
    metrics,
    isLoading,
    measureLoadTime,
    getRecommendations,
    shouldUseLightweightMode,
    getOptimizedConfig,
    // Helper methods
    isSlowConnection: metrics.isSlowConnection,
    isLowEndDevice: metrics.isLowEndDevice,
    connectionType: metrics.connectionType
  };
};

// Performance monitoring hook for API calls
export const useAPIPerformance = () => {
  const [apiMetrics, setApiMetrics] = useState<Record<string, number>>({});

  const measureAPI = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setApiMetrics(prev => ({
        ...prev,
        [endpoint]: duration
      }));
      
      console.log(`API call ${endpoint} took:`, `${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`API call ${endpoint} failed after:`, `${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }, []);

  const getSlowEndpoints = useCallback((threshold: number = 1000) => {
    return Object.entries(apiMetrics)
      .filter(([_, duration]) => duration > threshold)
      .sort(([_, a], [__, b]) => b - a);
  }, [apiMetrics]);

  return {
    apiMetrics,
    measureAPI,
    getSlowEndpoints
  };
};

// Hook for monitoring component render performance
export const useRenderPerformance = (componentName: string) => {
  const [renderCount, setRenderCount] = useState(0);
  const [renderTimes, setRenderTimes] = useState<number[]>([]);

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setRenderTimes(prev => [...prev, renderTime]);
      setRenderCount(prev => prev + 1);
      
      console.log(`${componentName} render #${renderCount + 1}:`, `${renderTime.toFixed(2)}ms`);
    };
  });

  const averageRenderTime = renderTimes.length > 0 
    ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length 
    : 0;

  const isSlowRendering = averageRenderTime > 16; // 60fps threshold

  return {
    renderCount,
    renderTimes,
    averageRenderTime,
    isSlowRendering
  };
};
