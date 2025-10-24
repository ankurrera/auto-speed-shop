// Order Progress Tracking Service
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  OrderProgressStep,
  OrderProgressTracking,
  ProgressStatus,
  UpdateProgressStepRequest,
  InitializeProgressRequest,
  OrderProgressUpdate,
  PROGRESS_STATUS,
  ORDER_PROGRESS_STEP_CONFIGS,
  calculateProgressPercentage,
  getOverallStatus,
  getCurrentStep,
  UpdateProgressStepRequestSchema,
  InitializeProgressRequestSchema
} from "@/types/orderProgress";

/**
 * Service for managing order progress tracking with 7 predefined steps
 */
export class OrderProgressService {
  
  /**
   * Initialize order progress steps for a new order
   */
  static async initializeOrderProgress(request: InitializeProgressRequest): Promise<OrderProgressStep[]> {
    try {
      // Validate request
      const validatedRequest = InitializeProgressRequestSchema.parse(request);
      
      console.log('[OrderProgressService] Initializing progress for order:', validatedRequest.order_id);
      
      // Call the database function to initialize steps
      const { error: functionError } = await supabase.rpc('initialize_order_progress_steps', {
        order_id: validatedRequest.order_id
      });
      
      if (functionError) {
        throw new Error(`Failed to initialize order progress: ${functionError.message}`);
      }
      
      // Fetch the initialized steps
      const { data, error } = await supabase
        .from('order_progress_steps')
        .select('*')
        .eq('order_id', validatedRequest.order_id)
        .order('step_number', { ascending: true });
      
      if (error) {
        throw new Error(`Failed to fetch initialized progress steps: ${error.message}`);
      }
      
      console.log('[OrderProgressService] Initialized progress steps:', data);
      return data || [];
      
    } catch (error) {
      console.error('[OrderProgressService] Error initializing order progress:', error);
      throw error;
    }
  }
  
  /**
   * Get order progress tracking data for a specific order
   */
  static async getOrderProgress(orderId: string): Promise<OrderProgressTracking | null> {
    try {
      console.log('[OrderProgressService] Fetching progress for order:', orderId);
      
      // Fetch all progress steps for the order
      const { data: steps, error } = await supabase
        .from('order_progress_steps')
        .select('*')
        .eq('order_id', orderId)
        .order('step_number', { ascending: true });
      
      if (error) {
        throw new Error(`Failed to fetch order progress: ${error.message}`);
      }
      
      if (!steps || steps.length === 0) {
        console.log('[OrderProgressService] No progress steps found, initializing...');
        // Initialize progress steps if they don't exist
        const initializedSteps = await this.initializeOrderProgress({ order_id: orderId });
        return this.buildProgressTracking(orderId, initializedSteps);
      }
      
      return this.buildProgressTracking(orderId, steps);
      
    } catch (error) {
      console.error('[OrderProgressService] Error fetching order progress:', error);
      throw error;
    }
  }
  
  /**
   * Update a specific progress step status
   */
  static async updateProgressStep(request: UpdateProgressStepRequest): Promise<OrderProgressStep> {
    try {
      // Validate request
      const validatedRequest = UpdateProgressStepRequestSchema.parse(request);
      
      console.log('[OrderProgressService] Updating progress step:', validatedRequest);
      
      // Call the database function to update step with conditional logic
      const { error: functionError } = await supabase.rpc('update_order_progress_step', {
        p_order_id: validatedRequest.order_id,
        p_step_number: validatedRequest.step_number,
        p_status: validatedRequest.status
      });
      
      if (functionError) {
        throw new Error(`Failed to update progress step: ${functionError.message}`);
      }
      
      // Fetch the updated step
      const { data, error } = await supabase
        .from('order_progress_steps')
        .select('*')
        .eq('order_id', validatedRequest.order_id)
        .eq('step_number', validatedRequest.step_number)
        .single();
      
      if (error) {
        throw new Error(`Failed to fetch updated progress step: ${error.message}`);
      }
      
      console.log('[OrderProgressService] Updated progress step:', data);
      return data;
      
    } catch (error) {
      console.error('[OrderProgressService] Error updating progress step:', error);
      throw error;
    }
  }
  
  /**
   * Sync order progress with current order status
   */
  static async syncOrderProgress(orderId: string): Promise<OrderProgressTracking> {
    try {
      console.log('[OrderProgressService] Syncing progress for order:', orderId);
      
      // Call the database function to sync progress
      const { error: functionError } = await supabase.rpc('sync_order_progress_with_status', {
        p_order_id: orderId
      });
      
      if (functionError) {
        throw new Error(`Failed to sync order progress: ${functionError.message}`);
      }
      
      // Fetch the updated progress
      const progressTracking = await this.getOrderProgress(orderId);
      if (!progressTracking) {
        throw new Error('Failed to get progress tracking after sync');
      }
      
      console.log('[OrderProgressService] Synced progress:', progressTracking);
      return progressTracking;
      
    } catch (error) {
      console.error('[OrderProgressService] Error syncing order progress:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to real-time order progress updates
   */
  static subscribeToOrderProgressUpdates(
    orderId: string,
    onUpdate: (update: OrderProgressUpdate) => void
  ): () => void {
    console.log('[OrderProgressService] Setting up progress subscription for order:', orderId);
    
    const channelName = `order_progress:${orderId}:${Date.now()}`;
    const channel = supabase.channel(channelName);
    
    // Subscribe to progress step changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_progress_steps',
        filter: `order_id=eq.${orderId}`,
      },
      async (payload) => {
        console.log('[OrderProgressService] Progress update received:', payload);
        
        if (payload.eventType === 'UPDATE' && payload.old && payload.new) {
          const update: OrderProgressUpdate = {
            order_id: payload.new.order_id,
            step_number: payload.new.step_number,
            old_status: payload.old.status,
            new_status: payload.new.status,
            updated_at: payload.new.updated_at
          };
          
          onUpdate(update);
        }
      }
    );
    
    // Subscribe the channel
    channel.subscribe((status) => {
      console.log('[OrderProgressService] Progress subscription status:', status, 'for order:', orderId);
    });
    
    // Return unsubscribe function
    return () => {
      console.log('[OrderProgressService] Unsubscribing from progress updates for order:', orderId);
      supabase.removeChannel(channel);
    };
  }
  
  /**
   * Helper method to build progress tracking object
   */
  private static buildProgressTracking(orderId: string, steps: OrderProgressStep[]): OrderProgressTracking {
    const completedSteps = steps.filter(step => step.status === PROGRESS_STATUS.COMPLETED);
    const progressPercentage = calculateProgressPercentage(steps);
    const overallStatus = getOverallStatus(steps);
    const lastUpdated = steps.reduce((latest, step) => {
      const stepUpdated = new Date(step.updated_at);
      const latestDate = new Date(latest);
      return stepUpdated > latestDate ? step.updated_at : latest;
    }, steps[0]?.updated_at || new Date().toISOString());
    
    return {
      order_id: orderId,
      steps: steps.sort((a, b) => a.step_number - b.step_number),
      overall_status: overallStatus,
      total_steps: steps.length,
      completed_steps: completedSteps.length,
      progress_percentage: progressPercentage,
      last_updated: lastUpdated
    };
  }
}

/**
 * Hook for using order progress in React components
 */
export const useOrderProgress = (orderId: string | undefined) => {
  const [progressTracking, setProgressTracking] = React.useState<OrderProgressTracking | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Fetch progress data
  React.useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    
    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError(null);
        const progress = await OrderProgressService.getOrderProgress(orderId);
        setProgressTracking(progress);
      } catch (err) {
        console.error('Error fetching order progress:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch order progress');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProgress();
  }, [orderId]);
  
  // Set up real-time subscription
  React.useEffect(() => {
    if (!orderId) return;
    
    const unsubscribe = OrderProgressService.subscribeToOrderProgressUpdates(
      orderId,
      (update) => {
        console.log('Received progress update:', update);
        // Refresh progress data
        OrderProgressService.getOrderProgress(orderId)
          .then(setProgressTracking)
          .catch(err => setError(err.message));
      }
    );
    
    return unsubscribe;
  }, [orderId]);
  
  const updateStep = async (stepNumber: number, status: ProgressStatus) => {
    if (!orderId) return;
    
    try {
      await OrderProgressService.updateProgressStep({
        order_id: orderId,
        step_number: stepNumber,
        status
      });
      // Progress will be updated via subscription
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update progress step');
    }
  };
  
  const syncProgress = async () => {
    if (!orderId) return;
    
    try {
      const updated = await OrderProgressService.syncOrderProgress(orderId);
      setProgressTracking(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync order progress');
    }
  };
  
  return {
    progressTracking,
    loading,
    error,
    updateStep,
    syncProgress
  };
};

// Development mode helpers
export const mockOrderProgress = (orderId: string): OrderProgressTracking => {
  const mockSteps: OrderProgressStep[] = ORDER_PROGRESS_STEP_CONFIGS.map((config, index) => ({
    id: `mock-step-${index + 1}`,
    order_id: orderId,
    step_number: config.stepNumber,
    title: config.title,
    description: config.description,
    status: index === 0 ? PROGRESS_STATUS.COMPLETED : 
            index === 1 ? PROGRESS_STATUS.COMPLETED :
            index === 2 ? 'pending' as ProgressStatus : 'pending' as ProgressStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    completed_at: index <= 1 ? new Date().toISOString() : null,
    canceled_at: null
  }));
  
  return {
    order_id: orderId,
    steps: mockSteps,
    overall_status: 'in_progress',
    total_steps: mockSteps.length,
    completed_steps: 2,
    progress_percentage: Math.round((2 / mockSteps.length) * 100),
    last_updated: new Date().toISOString()
  };
};