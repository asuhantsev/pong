import Logger from './logger';
import { featureFlags, FeatureFlags } from './featureFlags';

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.marks = new Map();
    this.frameMetrics = {
      fps: 0,
      frameTime: 0,
      lastFrameTimestamp: performance.now()
    };
  }

  // Start measuring a specific operation
  startMeasure(name) {
    if (!featureFlags.isEnabled(FeatureFlags.ENABLE_PERFORMANCE_MONITORING)) return;
    
    const start = performance.now();
    this.marks.set(name, start);
    return start;
  }

  // End measuring and record the duration
  endMeasure(name, category = 'default') {
    if (!featureFlags.isEnabled(FeatureFlags.ENABLE_PERFORMANCE_MONITORING)) return;
    
    const end = performance.now();
    const start = this.marks.get(name);
    
    if (!start) {
      Logger.warn('PerformanceMonitor', `No start mark found for: ${name}`);
      return;
    }

    const duration = end - start;
    this.recordMetric(name, duration, category);
    this.marks.delete(name);
    
    return duration;
  }

  // Record a metric value
  recordMetric(name, value, category = 'default') {
    if (!featureFlags.isEnabled(FeatureFlags.ENABLE_PERFORMANCE_MONITORING)) return;
    
    if (!this.metrics.has(category)) {
      this.metrics.set(category, new Map());
    }
    
    const categoryMetrics = this.metrics.get(category);
    if (!categoryMetrics.has(name)) {
      categoryMetrics.set(name, {
        values: [],
        min: value,
        max: value,
        avg: value,
        count: 0
      });
    }

    const metric = categoryMetrics.get(name);
    metric.values.push(value);
    if (metric.values.length > 100) metric.values.shift(); // Keep last 100 values
    
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.count++;
    metric.avg = metric.values.reduce((a, b) => a + b, 0) / metric.values.length;
  }

  // Update frame metrics
  updateFrameMetrics() {
    if (!featureFlags.isEnabled(FeatureFlags.ENABLE_PERFORMANCE_MONITORING)) return;
    
    const now = performance.now();
    const frameTime = now - this.frameMetrics.lastFrameTimestamp;
    
    this.frameMetrics.frameTime = frameTime;
    this.frameMetrics.fps = 1000 / frameTime;
    this.frameMetrics.lastFrameTimestamp = now;
    
    this.recordMetric('FPS', this.frameMetrics.fps, 'frame');
    this.recordMetric('Frame Time', frameTime, 'frame');
  }

  // Get metrics for a specific category
  getMetrics(category = 'default') {
    return this.metrics.get(category) || new Map();
  }

  // Get all metrics
  getAllMetrics() {
    const result = {};
    for (const [category, metrics] of this.metrics) {
      result[category] = Object.fromEntries(metrics);
    }
    return result;
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics.clear();
    this.marks.clear();
  }

  // Clear specific measures
  clearMeasures(name) {
    if (!featureFlags.isEnabled(FeatureFlags.ENABLE_PERFORMANCE_MONITORING)) return;
    
    // Clear marks for the specific measure
    this.marks.delete(name);
    
    // Clear metrics for the measure across all categories
    for (const categoryMetrics of this.metrics.values()) {
      categoryMetrics.delete(name);
    }
  }
}

// Create and export singleton instance
const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor; 