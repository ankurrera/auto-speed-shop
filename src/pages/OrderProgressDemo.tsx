import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import OrderProgressTracker from "@/components/OrderProgressTracker";
import { mockOrderProgress } from "@/services/orderProgressService";
import { 
  OrderProgressTracking, 
  PROGRESS_STATUS, 
  ORDER_PROGRESS_STEP_CONFIGS 
} from "@/types/orderProgress";

const OrderProgressDemo = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>("in-progress");
  const [mockProgress, setMockProgress] = useState<OrderProgressTracking | null>(null);

  // Demo scenarios
  const scenarios = {
    "in-progress": {
      name: "In Progress - Step 3",
      description: "User has completed checkout and invoice generation, waiting for decision",
      progress: {
        ...mockOrderProgress("demo-order-1"),
        steps: mockOrderProgress("demo-order-1").steps.map((step, index) => ({
          ...step,
          status: index === 0 ? PROGRESS_STATUS.COMPLETED :
                  index === 1 ? PROGRESS_STATUS.COMPLETED :
                  index === 2 ? 'pending' as any : 'pending' as any,
          completed_at: index <= 1 ? new Date().toISOString() : null
        })),
        completed_steps: 2,
        progress_percentage: Math.round((2 / 7) * 100),
        overall_status: 'in_progress' as const
      }
    },
    "invoice-declined": {
      name: "Invoice Declined",
      description: "User declined the invoice, remaining steps canceled",
      progress: {
        ...mockOrderProgress("demo-order-2"),
        steps: mockOrderProgress("demo-order-2").steps.map((step, index) => ({
          ...step,
          status: index === 0 ? PROGRESS_STATUS.COMPLETED :
                  index === 1 ? PROGRESS_STATUS.COMPLETED :
                  index === 2 ? PROGRESS_STATUS.CANCELED :
                  PROGRESS_STATUS.CANCELED,
          completed_at: index <= 1 ? new Date().toISOString() : null,
          canceled_at: index >= 2 ? new Date().toISOString() : null
        })),
        completed_steps: 2,
        progress_percentage: Math.round((2 / 7) * 100),
        overall_status: 'canceled' as const
      }
    },
    "payment-rejected": {
      name: "Payment Rejected",
      description: "Admin rejected payment verification, final steps canceled",
      progress: {
        ...mockOrderProgress("demo-order-3"),
        steps: mockOrderProgress("demo-order-3").steps.map((step, index) => ({
          ...step,
          status: index <= 4 ? PROGRESS_STATUS.COMPLETED :
                  index === 5 ? PROGRESS_STATUS.CANCELED :
                  PROGRESS_STATUS.CANCELED,
          completed_at: index <= 4 ? new Date().toISOString() : null,
          canceled_at: index >= 5 ? new Date().toISOString() : null
        })),
        completed_steps: 5,
        progress_percentage: Math.round((5 / 7) * 100),
        overall_status: 'canceled' as const
      }
    },
    "completed": {
      name: "Completed Order",
      description: "All steps completed successfully",
      progress: {
        ...mockOrderProgress("demo-order-4"),
        steps: mockOrderProgress("demo-order-4").steps.map((step) => ({
          ...step,
          status: PROGRESS_STATUS.COMPLETED,
          completed_at: new Date().toISOString()
        })),
        completed_steps: 7,
        progress_percentage: 100,
        overall_status: 'completed' as const
      }
    }
  };

  useEffect(() => {
    setMockProgress(scenarios[selectedScenario as keyof typeof scenarios].progress);
  }, [selectedScenario]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Order Progress Tracking System Demo</h1>
            <p className="text-muted-foreground">
              Demonstration of the 7-step order progress tracking system with real-time updates and conditional logic.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Demo Controls */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Demo Scenarios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(scenarios).map(([key, scenario]) => (
                    <div key={key}>
                      <Button
                        variant={selectedScenario === key ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => setSelectedScenario(key)}
                      >
                        {scenario.name}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1 px-2">
                        {scenario.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* System Features */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>System Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">✓</Badge>
                      <span>7 predefined tracking steps</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">✓</Badge>
                      <span>Real-time status updates</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">✓</Badge>
                      <span>Conditional cancellation logic</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">✓</Badge>
                      <span>Visual progress tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">✓</Badge>
                      <span>Database-backed persistence</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">✓</Badge>
                      <span>REST API endpoints</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress Tracker Demo */}
            <div className="lg:col-span-2">
              {mockProgress ? (
                <div className="space-y-6">
                  {/* Mock Progress Tracker */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Demo Progress Tracker
                        <Badge variant="secondary">
                          {scenarios[selectedScenario as keyof typeof scenarios].name}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Render the progress manually for demo */}
                      <div className="space-y-4">
                        {/* Progress Header */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Progress: {mockProgress.completed_steps} of {mockProgress.total_steps} steps completed
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{mockProgress.progress_percentage}%</span>
                              <Badge 
                                variant={
                                  mockProgress.overall_status === 'completed' ? 'default' : 
                                  mockProgress.overall_status === 'canceled' ? 'destructive' : 
                                  'secondary'
                                }
                              >
                                {mockProgress.overall_status === 'completed' ? 'Complete' : 
                                 mockProgress.overall_status === 'canceled' ? 'Canceled' : 
                                 'In Progress'}
                              </Badge>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${mockProgress.progress_percentage}%` }}
                            />
                          </div>
                        </div>

                        <Separator />

                        {/* Steps */}
                        <div className="space-y-4">
                          {mockProgress.steps.map((step, index) => (
                            <div key={step.id} className="relative">
                              {/* Timeline line */}
                              {index < mockProgress.steps.length - 1 && (
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
                                <div className={`flex-shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center ${
                                  step.status === PROGRESS_STATUS.COMPLETED ? 'text-green-600 bg-green-100 border-green-200' :
                                  step.status === PROGRESS_STATUS.CANCELED ? 'text-red-600 bg-red-100 border-red-200' :
                                  'text-yellow-600 bg-yellow-100 border-yellow-200'
                                }`}>
                                  {step.status === PROGRESS_STATUS.COMPLETED ? (
                                    <span className="text-lg">✓</span>
                                  ) : step.status === PROGRESS_STATUS.CANCELED ? (
                                    <span className="text-lg">✗</span>
                                  ) : (
                                    <span className="text-lg">●</span>
                                  )}
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0 pb-2">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className={`font-semibold text-sm ${
                                      step.status === PROGRESS_STATUS.CANCELED ? 'text-red-600' : 
                                      step.status === PROGRESS_STATUS.COMPLETED ? 'text-green-600' : 
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
                                      {step.status === PROGRESS_STATUS.COMPLETED ? 'Completed' :
                                       step.status === PROGRESS_STATUS.CANCELED ? 'Canceled' : 'Pending'}
                                    </Badge>
                                  </div>
                                  
                                  {step.description && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                      {step.description}
                                    </p>
                                  )}
                                  
                                  {/* Timestamps */}
                                  <div className="text-xs text-muted-foreground">
                                    {step.completed_at && (
                                      <div>Completed: {new Date(step.completed_at).toLocaleString()}</div>
                                    )}
                                    {step.canceled_at && (
                                      <div>Canceled: {new Date(step.canceled_at).toLocaleString()}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Step Definitions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>7-Step System Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {ORDER_PROGRESS_STEP_CONFIGS.map((config) => (
                          <div key={config.stepNumber} className="border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">Step {config.stepNumber}</Badge>
                              <h5 className="font-medium">{config.title}</h5>
                            </div>
                            <p className="text-sm text-muted-foreground">{config.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center p-8">
                    <span className="text-muted-foreground">Loading demo...</span>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderProgressDemo;