import React from 'react';
import { CheckCircle, Circle, AlertTriangle, Clock, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AssistantTask } from '@/data/dashboard';

interface AssistantTasksCardProps {
  tasks: AssistantTask[];
  onTaskToggle?: (taskId: string) => void;
  className?: string;
}

/**
 * Assistant tasks card showing a list of vehicle maintenance and action items
 */
const AssistantTasksCard: React.FC<AssistantTasksCardProps> = ({
  tasks,
  onTaskToggle,
  className = ''
}) => {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-3 w-3" />;
      case 'medium':
        return <Clock className="h-3 w-3" />;
      case 'low':
        return <Circle className="h-3 w-3" />;
      default:
        return <Circle className="h-3 w-3" />;
    }
  };

  const activeTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4" />
          Assistant Tasks
          {activeTasks.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
              {activeTasks.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Active Tasks */}
          {activeTasks.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Active Tasks
              </h4>
              <div className="task-list">
                {activeTasks.map((task) => (
                  <div key={task.id} className="task-item">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto"
                      onClick={() => onTaskToggle?.(task.id)}
                      aria-label={`Mark task "${task.title}" as completed`}
                    >
                      <Circle className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Button>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{task.title}</span>
                        <span className={`task-priority ${task.priority}`}>
                          {getPriorityIcon(task.priority)}
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {task.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No active tasks */}
          {activeTasks.length === 0 && (
            <div className="text-center py-6">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium">All tasks completed!</p>
              <p className="text-xs text-muted-foreground">
                Your vehicle is in great shape
              </p>
            </div>
          )}

          {/* Completed Tasks (collapsed) */}
          {completedTasks.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Completed ({completedTasks.length})
              </h4>
              <div className="space-y-2">
                {completedTasks.slice(0, 2).map((task) => (
                  <div key={task.id} className="task-item completed">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div className="flex-1">
                      <span className="text-sm">{task.title}</span>
                    </div>
                  </div>
                ))}
                {completedTasks.length > 2 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{completedTasks.length - 2} more completed
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="pt-3 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                Schedule Service
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Add Task
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AssistantTasksCard;