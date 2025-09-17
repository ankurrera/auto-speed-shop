import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Clock,
  FileText,
  CreditCard,
  AlertCircle,
  Package,
  Share,
  XCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrderProgress } from "@/services/orderProgressService";
import { 
  OrderProgressStep,
  PROGRESS_STATUS,
  getStatusDisplayText,
  getStatusColor,
  getCurrentStep
} from "@/types/orderProgress";

interface OrderProgressTrackerProps {
  orderId: string;
  className?: string;
  showRefresh?: boolean;
  allowAdminActions?: boolean;
}

const OrderProgressTracker: React.FC<OrderProgressTrackerProps> = ({ 
  orderId, 
  className = "",
  showRefresh = false,
  allowAdminActions = false
}) => {
  const { progressTracking, loading, error, updateStep, syncProgress } = useOrderProgress(orderId);

  // Icon mapping for each step
  const getStepIcon = (stepNumber: number) => {
    switch (stepNumber) {
      case 1: return <Package className="h-5 w-5" />;
      case 2: return <FileText className="h-5 w-5" />;
      case 3: return <AlertCircle className="h-5 w-5" />;
      case 4: return <Share className="h-5 w-5" />;
      case 5: return <CreditCard className="h-5 w-5" />;
      case 6: return <CheckCircle className="h-5 w-5" />;
      case 7: return <CheckCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case PROGRESS_STATUS.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case PROGRESS_STATUS.CANCELED:
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const handleRefresh = async () => {
    await syncProgress();
  };

  const handleStepAction = async (stepNumber: number, newStatus: string) => {
    if (allowAdminActions) {
      await updateStep(stepNumber, newStatus as any);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading order progress...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !progressTracking) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 mb-4">{error || "Failed to load order progress"}</p>
            {showRefresh && (
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { steps, progress_percentage, completed_steps, total_steps, overall_status } = progressTracking;
  const currentStep = getCurrentStep(steps);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Progress Tracking
          </CardTitle>
          {showRefresh && (
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Progress: {completed_steps} of {total_steps} steps completed
            </span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{progress_percentage}%</span>
              <Badge 
                variant={
                  overall_status === 'completed' ? 'default' : 
                  overall_status === 'canceled' ? 'destructive' : 
                  'secondary'
                }
              >
                {overall_status === 'completed' ? 'Complete' : 
                 overall_status === 'canceled' ? 'Canceled' : 
                 'In Progress'}
              </Badge>
            </div>
          </div>
          <Progress value={progress_percentage} className="h-2" />
          {currentStep && (
            <div className="text-sm text-muted-foreground">
              Current Step: <span className="font-medium">{currentStep.title}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Timeline line */}
              {index < steps.length - 1 && (
                <div 
                  className={`absolute left-5 top-11 w-0.5 h-5 ${
                    step.status === PROGRESS_STATUS.COMPLETED ? 'bg-green-300' : 
                    step.status === PROGRESS_STATUS.CANCELED ? 'bg-red-300' : 
                    'bg-gray-200'
                  }`} 
                  style={{ left: '22px' }}
                />
              )}
              
              <div className="flex items-start gap-4">
                {/* Status icon */}
                <div className={`flex-shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center ${getStatusColor(step.status)}`}>
                  {getStatusIcon(step.status)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-semibold text-sm ${
                      step.status === PROGRESS_STATUS.CANCELED ? 'text-red-600 dark:text-red-400' : 
                      step.status === PROGRESS_STATUS.COMPLETED ? 'text-green-600 dark:text-green-400' : 
                      'text-foreground'
                    }`}>
                      Step {step.step_number}: {step.title}
                    </h4>
                    <Badge 
                      variant={
                        step.status === PROGRESS_STATUS.COMPLETED ? 'default' : 
                        step.status === PROGRESS_STATUS.CANCELED ? 'destructive' : 
                        'outline'
                      }
                      className="text-xs"
                    >
                      {getStatusDisplayText(step.status)}
                    </Badge>
                  </div>
                  
                  {step.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {step.description}
                    </p>
                  )}
                  
                  {/* Timestamps */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    {step.completed_at && (
                      <div>Completed: {new Date(step.completed_at).toLocaleString()}</div>
                    )}
                    {step.canceled_at && (
                      <div>Canceled: {new Date(step.canceled_at).toLocaleString()}</div>
                    )}
                    {!step.completed_at && !step.canceled_at && (
                      <div>Created: {new Date(step.created_at).toLocaleString()}</div>
                    )}
                  </div>
                  
                  {/* Admin Actions */}
                  {allowAdminActions && step.status === PROGRESS_STATUS.PENDING && (
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStepAction(step.step_number, PROGRESS_STATUS.COMPLETED)}
                      >
                        Mark Complete
                      </Button>
                      {(step.step_number === 3 || step.step_number === 6) && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleStepAction(step.step_number, PROGRESS_STATUS.CANCELED)}
                        >
                          {step.step_number === 3 ? 'Decline Invoice' : 'Reject Payment'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary section */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h5 className="font-medium mb-2">Order Status Summary</h5>
          <p className="text-sm text-muted-foreground">
            {overall_status === 'completed'
              ? "All steps have been completed successfully. Your order is confirmed."
              : overall_status === 'canceled'
              ? "This order has been canceled. Some steps may have been completed before cancellation."
              : `Your order is currently in progress. ${currentStep ? `Currently on: ${currentStep.title}` : 'Awaiting next step.'}`
            }
          </p>
          
          {/* Progress breakdown */}
          <div className="mt-3 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">
                {steps.filter(s => s.status === PROGRESS_STATUS.COMPLETED).length}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-yellow-600">
                {steps.filter(s => s.status === PROGRESS_STATUS.PENDING).length}
              </div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {steps.filter(s => s.status === PROGRESS_STATUS.CANCELED).length}
              </div>
              <div className="text-xs text-muted-foreground">Canceled</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderProgressTracker;