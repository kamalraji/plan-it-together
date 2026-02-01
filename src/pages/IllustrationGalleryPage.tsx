import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  IllustrationSize,
  IllustrationAnimation,
  // Scenes
  DashboardWoman,
  WorkingMan,
  CelebrationScene,
  ThinkingPerson,
  EventHosting,
  TeamCollaboration,
  CalendarPlanning,
  TicketScanning,
  EmptyInbox,
  NetworkingPeople,
  OnboardingWelcome,
  DataAnalytics,
  SecurityCheck,
  SupportHelpdesk,
  SuccessConfirmation,
  MarketplaceVendor,
  ProfileSetup,
  ErrorWarning,
  ConnectionOffline,
  WelcomeUser,
  DocumentFile,
  NotificationEmpty,
  // Character Types
  AdminPerson,
  CreativePerson,
  StudentLearner,
  RunnerActive,
  MeditatingPerson,
  BuilderPerson,
  DetectiveSearch,
  ExplorerAstronaut,
} from '@/components/illustrations';

const SIZES: IllustrationSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const ANIMATIONS: IllustrationAnimation[] = ['none', 'float', 'subtle'];

const SCENES = [
  { name: 'DashboardWoman', component: DashboardWoman },
  { name: 'WorkingMan', component: WorkingMan },
  { name: 'CelebrationScene', component: CelebrationScene },
  { name: 'ThinkingPerson', component: ThinkingPerson },
  { name: 'EventHosting', component: EventHosting },
  { name: 'TeamCollaboration', component: TeamCollaboration },
  { name: 'CalendarPlanning', component: CalendarPlanning },
  { name: 'TicketScanning', component: TicketScanning },
  { name: 'EmptyInbox', component: EmptyInbox },
  { name: 'NetworkingPeople', component: NetworkingPeople },
  { name: 'OnboardingWelcome', component: OnboardingWelcome },
  { name: 'DataAnalytics', component: DataAnalytics },
  { name: 'SecurityCheck', component: SecurityCheck },
  { name: 'SupportHelpdesk', component: SupportHelpdesk },
  { name: 'SuccessConfirmation', component: SuccessConfirmation },
  { name: 'MarketplaceVendor', component: MarketplaceVendor },
  { name: 'ProfileSetup', component: ProfileSetup },
  { name: 'ErrorWarning', component: ErrorWarning },
  { name: 'ConnectionOffline', component: ConnectionOffline },
  { name: 'WelcomeUser', component: WelcomeUser },
  { name: 'DocumentFile', component: DocumentFile },
  { name: 'NotificationEmpty', component: NotificationEmpty },
];

const CHARACTERS = [
  { name: 'AdminPerson', component: AdminPerson },
  { name: 'CreativePerson', component: CreativePerson },
  { name: 'StudentLearner', component: StudentLearner },
  { name: 'RunnerActive', component: RunnerActive },
  { name: 'MeditatingPerson', component: MeditatingPerson },
  { name: 'BuilderPerson', component: BuilderPerson },
  { name: 'DetectiveSearch', component: DetectiveSearch },
  { name: 'ExplorerAstronaut', component: ExplorerAstronaut },
];

export function IllustrationGalleryPage() {
  const [selectedSize, setSelectedSize] = useState<IllustrationSize>('md');
  const [selectedAnimation, setSelectedAnimation] = useState<IllustrationAnimation>('none');
  const [showBackground, setShowBackground] = useState(true);

  const renderIllustration = (
    Component: React.ComponentType<{
      size?: IllustrationSize;
      animation?: IllustrationAnimation;
      showBackground?: boolean;
    }>,
    name: string
  ) => (
    <Card key={name} className="overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/30">
        <CardTitle className="text-sm font-mono">{name}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex items-center justify-center min-h-[200px] bg-[repeating-conic-gradient(#80808010_0%_25%,transparent_0%_50%)] bg-[length:20px_20px]">
        <Component
          size={selectedSize}
          animation={selectedAnimation}
          showBackground={showBackground}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Illustration Gallery</h1>
          <p className="text-muted-foreground">
            Preview all illustrations with different sizes and configurations.
          </p>
        </div>

        {/* Controls */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-8">
              {/* Size Selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Size</Label>
                <div className="flex gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                        selectedSize === size
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      {size.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Selector */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Animation</Label>
                <div className="flex gap-2">
                  {ANIMATIONS.map((anim) => (
                    <button
                      key={anim}
                      onClick={() => setSelectedAnimation(anim)}
                      className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                        selectedAnimation === anim
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      {anim.charAt(0).toUpperCase() + anim.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Background</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={showBackground}
                    onCheckedChange={setShowBackground}
                  />
                  <span className="text-sm text-muted-foreground">
                    {showBackground ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gallery Tabs */}
        <Tabs defaultValue="scenes" className="space-y-6">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="scenes">Scenes ({SCENES.length})</TabsTrigger>
            <TabsTrigger value="characters">Characters ({CHARACTERS.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="scenes">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {SCENES.map(({ name, component }) => renderIllustration(component, name))}
            </div>
          </TabsContent>

          <TabsContent value="characters">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {CHARACTERS.map(({ name, component }) => renderIllustration(component, name))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Usage Example */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Usage Example</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`import { ${selectedSize === 'md' ? 'DashboardWoman' : 'DashboardWoman'} } from '@/components/illustrations';

<DashboardWoman
  size="${selectedSize}"
  animation="${selectedAnimation}"
  showBackground={${showBackground}}
/>`}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default IllustrationGalleryPage;
