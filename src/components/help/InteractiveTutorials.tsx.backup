import React, { useState, useEffect } from 'react';
import { 
  PlayIcon as Play, 
  CheckCircleIcon as CheckCircle, 
  ClockIcon as Clock, 
  UsersIcon as Users, 
  StarIcon as Star, 
  ArrowRightIcon as ArrowRight, 
  ArrowLeftIcon as ArrowLeft, 
  XMarkIcon as X 
} from '@heroicons/react/24/outline';

interface InteractiveTutorialsProps {
  searchQuery?: string;
  currentContext?: string;
  user?: any;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  steps: TutorialStep[];
  prerequisites?: string[];
  roles?: string[];
  featured: boolean;
  completedBy: number;
  rating: number;
  thumbnail?: string;
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  content: string;
  action?: {
    type: 'click' | 'input' | 'navigate' | 'wait';
    target?: string;
    value?: string;
  };
  validation?: {
    type: 'element_exists' | 'url_contains' | 'text_contains';
    target: string;
  };
  hints?: string[];
}

interface TutorialProgress {
  tutorialId: string;
  currentStep: number;
  completed: boolean;
  startedAt: string;
  completedAt?: string;
}

export const InteractiveTutorials: React.FC<InteractiveTutorialsProps> = ({
  searchQuery = '',
  currentContext,
  user
}) => {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState<TutorialProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [tutorialMode, setTutorialMode] = useState(false);

  // Mock tutorial data
  const mockTutorials: Tutorial[] = [
    {
      id: '1',
      title: 'Creating Your First Event',
      description: 'Learn how to create and configure your first event from start to finish.',
      category: 'getting-started',
      difficulty: 'beginner',
      duration: 10,
      featured: true,
      completedBy: 1250,
      rating: 4.8,
      roles: ['ORGANIZER'],
      steps: [
        {
          id: '1',
          title: 'Navigate to Events',
          description: 'First, let\'s go to the Events section of the console.',
          content: 'Click on the "Events" menu item in the left sidebar to access event management.',
          action: {
            type: 'click',
            target: '[data-testid="events-nav"]'
          },
          validation: {
            type: 'url_contains',
            target: '/console/events'
          },
          hints: ['Look for the calendar icon in the sidebar', 'The Events section is under the main navigation']
        },
        {
          id: '2',
          title: 'Start Creating an Event',
          description: 'Now let\'s create a new event.',
          content: 'Click the "Create Event" button to start the event creation process.',
          action: {
            type: 'click',
            target: '[data-testid="create-event-btn"]'
          },
          validation: {
            type: 'url_contains',
            target: '/console/events/create'
          },
          hints: ['Look for a blue "Create Event" button', 'It should be prominently displayed on the events page']
        },
        {
          id: '3',
          title: 'Enter Event Details',
          description: 'Fill in the basic information for your event.',
          content: 'Enter a name for your event in the "Event Name" field.',
          action: {
            type: 'input',
            target: '[data-testid="event-name-input"]',
            value: 'My First Event'
          },
          validation: {
            type: 'element_exists',
            target: '[data-testid="event-name-input"][value="My First Event"]'
          },
          hints: ['The event name field should be at the top of the form', 'Make sure to give your event a descriptive name']
        }
      ]
    },
    {
      id: '2',
      title: 'Setting Up Team Workspaces',
      description: 'Learn how to create and manage team workspaces for collaborative event planning.',
      category: 'workspaces',
      difficulty: 'intermediate',
      duration: 15,
      featured: true,
      completedBy: 890,
      rating: 4.6,
      roles: ['ORGANIZER', 'TEAM_LEAD'],
      steps: [
        {
          id: '1',
          title: 'Access Workspaces',
          description: 'Navigate to the Workspaces section.',
          content: 'Click on "Workspaces" in the main navigation to manage your team collaboration spaces.',
          action: {
            type: 'click',
            target: '[data-testid="workspaces-nav"]'
          },
          validation: {
            type: 'url_contains',
            target: '/console/workspaces'
          }
        },
        {
          id: '2',
          title: 'Create New Workspace',
          description: 'Set up a new workspace for your team.',
          content: 'Click "Create Workspace" to start setting up a collaborative space for your event team.',
          action: {
            type: 'click',
            target: '[data-testid="create-workspace-btn"]'
          },
          validation: {
            type: 'element_exists',
            target: '[data-testid="workspace-form"]'
          }
        }
      ]
    },
    {
      id: '3',
      title: 'Using the Marketplace',
      description: 'Discover how to find and book services through the marketplace.',
      category: 'marketplace',
      difficulty: 'beginner',
      duration: 12,
      featured: false,
      completedBy: 654,
      rating: 4.4,
      roles: ['ORGANIZER'],
      steps: [
        {
          id: '1',
          title: 'Browse Marketplace',
          description: 'Explore available services in the marketplace.',
          content: 'Navigate to the Marketplace to see available services for your events.',
          action: {
            type: 'click',
            target: '[data-testid="marketplace-nav"]'
          },
          validation: {
            type: 'url_contains',
            target: '/console/marketplace'
          }
        }
      ]
    }
  ];

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setTutorials(mockTutorials);
      // Load user progress (mock data)
      setProgress([
        { tutorialId: '1', currentStep: 2, completed: false, startedAt: '2024-01-15T10:00:00Z' }
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredTutorials = searchQuery
    ? tutorials.filter(tutorial =>
        tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutorial.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tutorials.filter(tutorial => {
        // Filter by user role if user is available
        if (user && tutorial.roles && tutorial.roles.length > 0) {
          return tutorial.roles.includes(user.role);
        }
        // Filter by current context if available
        if (currentContext && tutorial.category) {
          return tutorial.category.toLowerCase().includes(currentContext.toLowerCase());
        }
        return true;
      });

  const featuredTutorials = tutorials.filter(tutorial => tutorial.featured);

  const startTutorial = (tutorial: Tutorial) => {
    setActiveTutorial(tutorial);
    setCurrentStep(0);
    setTutorialMode(true);
    
    // Track tutorial start
    const existingProgress = progress.find(p => p.tutorialId === tutorial.id);
    if (!existingProgress) {
      setProgress(prev => [...prev, {
        tutorialId: tutorial.id,
        currentStep: 0,
        completed: false,
        startedAt: new Date().toISOString()
      }]);
    }
  };

  const nextStep = () => {
    if (activeTutorial && currentStep < activeTutorial.steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      
      // Update progress
      setProgress(prev => prev.map(p => 
        p.tutorialId === activeTutorial.id 
          ? { ...p, currentStep: newStep }
          : p
      ));
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    if (activeTutorial) {
      setProgress(prev => prev.map(p => 
        p.tutorialId === activeTutorial.id 
          ? { ...p, completed: true, completedAt: new Date().toISOString() }
          : p
      ));
      setTutorialMode(false);
      setActiveTutorial(null);
      setCurrentStep(0);
    }
  };

  const exitTutorial = () => {
    setTutorialMode(false);
    setActiveTutorial(null);
    setCurrentStep(0);
  };

  const getTutorialProgress = (tutorialId: string) => {
    return progress.find(p => p.tutorialId === tutorialId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Tutorial overlay component
  const TutorialOverlay = () => {
    if (!tutorialMode || !activeTutorial) return null;

    const step = activeTutorial.steps[currentStep];
    const isLastStep = currentStep === activeTutorial.steps.length - 1;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="font-semibold text-gray-900">{activeTutorial.title}</h3>
              <p className="text-sm text-gray-500">
                Step {currentStep + 1} of {activeTutorial.steps.length}
              </p>
            </div>
            <button
              onClick={exitTutorial}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-4 py-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / activeTutorial.steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          <div className="p-4">
            <h4 className="font-medium text-gray-900 mb-2">{step.title}</h4>
            <p className="text-gray-600 text-sm mb-4">{step.content}</p>
            
            {step.hints && step.hints.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 font-medium mb-1">💡 Hints:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  {step.hints.map((hint, index) => (
                    <li key={index}>• {hint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200">
            <button
              onClick={previousStep}
              disabled={currentStep === 0}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Previous
            </button>

            {isLastStep ? (
              <button
                onClick={completeTutorial}
                className="flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Complete
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Featured Tutorials */}
        {!searchQuery && featuredTutorials.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Featured Tutorials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredTutorials.map((tutorial) => {
                const tutorialProgress = getTutorialProgress(tutorial.id);
                return (
                  <div
                    key={tutorial.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-gray-900">{tutorial.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(tutorial.difficulty)}`}>
                        {tutorial.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{tutorial.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {tutorial.duration} min
                      </span>
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {tutorial.completedBy}
                      </span>
                      <span className="flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        {tutorial.rating}
                      </span>
                    </div>

                    {tutorialProgress && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{tutorialProgress.currentStep + 1}/{tutorial.steps.length}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-600 h-1 rounded-full"
                            style={{ width: `${((tutorialProgress.currentStep + 1) / tutorial.steps.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => startTutorial(tutorial)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {tutorialProgress?.completed ? 'Restart' : tutorialProgress ? 'Continue' : 'Start Tutorial'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Tutorials */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {searchQuery ? `Search Results (${filteredTutorials.length})` : 'All Tutorials'}
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredTutorials.map((tutorial) => {
              const tutorialProgress = getTutorialProgress(tutorial.id);
              return (
                <div key={tutorial.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{tutorial.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(tutorial.difficulty)}`}>
                          {tutorial.difficulty}
                        </span>
                        {tutorialProgress?.completed && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{tutorial.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {tutorial.duration} min
                        </span>
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {tutorial.completedBy} completed
                        </span>
                        <span className="flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          {tutorial.rating}
                        </span>
                      </div>

                      {tutorialProgress && !tutorialProgress.completed && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{tutorialProgress.currentStep + 1}/{tutorial.steps.length}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-blue-600 h-1 rounded-full"
                              style={{ width: `${((tutorialProgress.currentStep + 1) / tutorial.steps.length) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => startTutorial(tutorial)}
                      className="ml-4 flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {tutorialProgress?.completed ? 'Restart' : tutorialProgress ? 'Continue' : 'Start'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTutorials.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Play className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tutorials found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      <TutorialOverlay />
    </>
  );
};