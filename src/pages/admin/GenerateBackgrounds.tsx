import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/looseClient';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { 
  Sparkles, 
  Image as ImageIcon, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  RefreshCw,
  Award,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

interface GenerationResult {
  theme: string;
  style: string;
  url?: string;
  error?: string;
  status: 'pending' | 'generating' | 'success' | 'error';
}

// ID Card specs
const ID_CARD_THEMES = ['technology', 'medical', 'corporate', 'conference', 'education', 'creative', 'nature', 'abstract'];
const ID_CARD_STYLES = ['professional', 'modern', 'minimal', 'vibrant', 'elegant'];

// Certificate specs  
const CERTIFICATE_THEMES = ['formal', 'celebration', 'corporate', 'academic', 'tech', 'creative', 'nature', 'awards'];
const CERTIFICATE_STYLES = ['elegant', 'modern', 'minimal', 'vibrant', 'classic'];

export default function GenerateBackgrounds() {
  const { user, isLoading: authLoading } = useAuth();
  const [idCardResults, setIdCardResults] = useState<GenerationResult[]>([]);
  const [certificateResults, setCertificateResults] = useState<GenerationResult[]>([]);
  const [isGeneratingIdCards, setIsGeneratingIdCards] = useState(false);
  const [isGeneratingCertificates, setIsGeneratingCertificates] = useState(false);
  const [currentlyGenerating, setCurrentlyGenerating] = useState<string | null>(null);

  // Initialize results
  const initializeResults = useCallback((themes: string[], styles: string[]): GenerationResult[] => {
    return themes.flatMap(theme => 
      styles.map(style => ({
        theme,
        style,
        status: 'pending' as const
      }))
    );
  }, []);

  // Generate single ID card background
  const generateSingleIdCard = async (theme: string, style: string): Promise<GenerationResult> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('generate-idcard-backgrounds', {
        body: { action: 'generate-single', theme, style }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Generation failed');
      }

      return {
        theme,
        style,
        url: response.data?.imageUrl,
        status: 'success'
      };
    } catch (error) {
      return {
        theme,
        style,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      };
    }
  };

  // Generate single certificate background
  const generateSingleCertificate = async (theme: string, style: string): Promise<GenerationResult> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('generate-certificate-backgrounds', {
        body: { theme, style }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Generation failed');
      }

      const result = response.data?.results?.[0];
      if (result?.error) {
        throw new Error(result.error);
      }

      return {
        theme,
        style,
        url: result?.url,
        status: 'success'
      };
    } catch (error) {
      return {
        theme,
        style,
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error'
      };
    }
  };

  // Generate all ID card backgrounds sequentially
  const generateAllIdCards = async () => {
    setIsGeneratingIdCards(true);
    const results = initializeResults(ID_CARD_THEMES, ID_CARD_STYLES);
    setIdCardResults(results);

    for (let i = 0; i < results.length; i++) {
      const { theme, style } = results[i];
      setCurrentlyGenerating(`${theme}/${style}`);
      
      // Update status to generating
      setIdCardResults(prev => 
        prev.map((r, idx) => idx === i ? { ...r, status: 'generating' } : r)
      );

      const result = await generateSingleIdCard(theme, style);
      
      // Update with result
      setIdCardResults(prev => 
        prev.map((r, idx) => idx === i ? result : r)
      );

      // Add delay between generations to avoid rate limiting
      if (i < results.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setCurrentlyGenerating(null);
    setIsGeneratingIdCards(false);
    toast.success('ID Card backgrounds generation complete!');
  };

  // Generate all certificate backgrounds sequentially
  const generateAllCertificates = async () => {
    setIsGeneratingCertificates(true);
    const results = initializeResults(CERTIFICATE_THEMES, CERTIFICATE_STYLES);
    setCertificateResults(results);

    for (let i = 0; i < results.length; i++) {
      const { theme, style } = results[i];
      setCurrentlyGenerating(`${theme}/${style}`);
      
      // Update status to generating
      setCertificateResults(prev => 
        prev.map((r, idx) => idx === i ? { ...r, status: 'generating' } : r)
      );

      const result = await generateSingleCertificate(theme, style);
      
      // Update with result
      setCertificateResults(prev => 
        prev.map((r, idx) => idx === i ? result : r)
      );

      // Add delay between generations to avoid rate limiting
      if (i < results.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setCurrentlyGenerating(null);
    setIsGeneratingCertificates(false);
    toast.success('Certificate backgrounds generation complete!');
  };

  const getProgressPercent = (results: GenerationResult[]) => {
    if (results.length === 0) return 0;
    const completed = results.filter(r => r.status === 'success' || r.status === 'error').length;
    return Math.round((completed / results.length) * 100);
  };

  const getSuccessCount = (results: GenerationResult[]) => 
    results.filter(r => r.status === 'success').length;

  const getErrorCount = (results: GenerationResult[]) => 
    results.filter(r => r.status === 'error').length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Background Generator
          </h1>
          <p className="text-muted-foreground">
            Generate all AI background images for ID cards and certificates
          </p>
        </div>

        {/* Currently Generating */}
        {currentlyGenerating && (
          <div className="flex items-center justify-center gap-2 text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating: {currentlyGenerating}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* ID Cards Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                ID Card Backgrounds
              </CardTitle>
              <CardDescription>
                {ID_CARD_THEMES.length} themes × {ID_CARD_STYLES.length} styles = {ID_CARD_THEMES.length * ID_CARD_STYLES.length} images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={generateAllIdCards}
                disabled={isGeneratingIdCards || isGeneratingCertificates}
                className="w-full"
              >
                {isGeneratingIdCards ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating... ({getProgressPercent(idCardResults)}%)
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate All ID Card Backgrounds
                  </>
                )}
              </Button>

              {idCardResults.length > 0 && (
                <>
                  <Progress value={getProgressPercent(idCardResults)} />
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {getSuccessCount(idCardResults)} success
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      {getErrorCount(idCardResults)} failed
                    </span>
                  </div>
                  
                  <ScrollArea className="h-64 border rounded-lg p-2">
                    <div className="grid grid-cols-2 gap-2">
                      {idCardResults.map((result, idx) => (
                        <div 
                          key={idx} 
                          className="p-2 rounded border bg-card text-xs flex items-center gap-2"
                        >
                          {result.status === 'pending' && (
                            <Badge variant="outline" className="text-[10px]">Pending</Badge>
                          )}
                          {result.status === 'generating' && (
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          )}
                          {result.status === 'success' && (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          )}
                          {result.status === 'error' && (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                          <span className="truncate">{result.theme}/{result.style}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>

          {/* Certificates Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certificate Backgrounds
              </CardTitle>
              <CardDescription>
                {CERTIFICATE_THEMES.length} themes × {CERTIFICATE_STYLES.length} styles = {CERTIFICATE_THEMES.length * CERTIFICATE_STYLES.length} images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={generateAllCertificates}
                disabled={isGeneratingIdCards || isGeneratingCertificates}
                className="w-full"
              >
                {isGeneratingCertificates ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating... ({getProgressPercent(certificateResults)}%)
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate All Certificate Backgrounds
                  </>
                )}
              </Button>

              {certificateResults.length > 0 && (
                <>
                  <Progress value={getProgressPercent(certificateResults)} />
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {getSuccessCount(certificateResults)} success
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <XCircle className="h-4 w-4" />
                      {getErrorCount(certificateResults)} failed
                    </span>
                  </div>
                  
                  <ScrollArea className="h-64 border rounded-lg p-2">
                    <div className="grid grid-cols-2 gap-2">
                      {certificateResults.map((result, idx) => (
                        <div 
                          key={idx} 
                          className="p-2 rounded border bg-card text-xs flex items-center gap-2"
                        >
                          {result.status === 'pending' && (
                            <Badge variant="outline" className="text-[10px]">Pending</Badge>
                          )}
                          {result.status === 'generating' && (
                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          )}
                          {result.status === 'success' && (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          )}
                          {result.status === 'error' && (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                          <span className="truncate">{result.theme}/{result.style}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Generated Images Preview */}
        {(idCardResults.some(r => r.url) || certificateResults.some(r => r.url)) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Generated Images Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {[...idCardResults, ...certificateResults]
                  .filter(r => r.url)
                  .map((result, idx) => (
                    <a
                      key={idx}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-video rounded overflow-hidden border hover:ring-2 ring-primary transition-all"
                    >
                      <img
                        src={result.url}
                        alt={`${result.theme}/${result.style}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
