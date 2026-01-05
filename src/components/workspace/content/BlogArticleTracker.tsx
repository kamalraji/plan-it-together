import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Edit, Eye, Clock, CheckCircle2, Plus } from 'lucide-react';

interface BlogArticle {
  id: string;
  title: string;
  author: string;
  status: 'draft' | 'review' | 'scheduled' | 'published';
  wordCount: number;
  targetWords: number;
  publishDate?: string;
  views?: number;
}

export function BlogArticleTracker() {
  const articles: BlogArticle[] = [
    {
      id: '1',
      title: 'Complete Guide to Event Registration',
      author: 'Sarah M.',
      status: 'published',
      wordCount: 1500,
      targetWords: 1500,
      publishDate: 'Jan 2, 2026',
      views: 342,
    },
    {
      id: '2',
      title: 'Top 10 Networking Tips',
      author: 'John D.',
      status: 'scheduled',
      wordCount: 1200,
      targetWords: 1200,
      publishDate: 'Jan 8, 2026',
    },
    {
      id: '3',
      title: 'Speaker Spotlight: Industry Leaders',
      author: 'Emily R.',
      status: 'review',
      wordCount: 800,
      targetWords: 1000,
    },
    {
      id: '4',
      title: 'What to Expect at This Year\'s Event',
      author: 'Mike T.',
      status: 'draft',
      wordCount: 450,
      targetWords: 1500,
    },
  ];

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      draft: { color: 'bg-muted text-muted-foreground', icon: <Edit className="h-3 w-3" />, label: 'Draft' },
      review: { color: 'bg-amber-500/10 text-amber-600', icon: <Eye className="h-3 w-3" />, label: 'In Review' },
      scheduled: { color: 'bg-blue-500/10 text-blue-600', icon: <Clock className="h-3 w-3" />, label: 'Scheduled' },
      published: { color: 'bg-emerald-500/10 text-emerald-600', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Published' },
    };
    return configs[status] || configs.draft;
  };

  const publishedCount = articles.filter(a => a.status === 'published').length;
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Blog & Articles
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {publishedCount} published • {totalViews} total views
            </p>
          </div>
          <Button size="sm">
            <Plus className="h-3 w-3 mr-1" />
            New Article
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {articles.map((article) => {
          const statusConfig = getStatusConfig(article.status);
          const progress = (article.wordCount / article.targetWords) * 100;

          return (
            <div
              key={article.id}
              className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{article.title}</p>
                  <p className="text-xs text-muted-foreground">by {article.author}</p>
                </div>
                <Badge className={`${statusConfig.color} text-xs shrink-0`}>
                  <span className="mr-1">{statusConfig.icon}</span>
                  {statusConfig.label}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-1">
                <Progress value={Math.min(progress, 100)} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {article.wordCount}/{article.targetWords} words
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {article.publishDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.publishDate}
                  </span>
                )}
                {article.views !== undefined && (
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {article.views} views
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
