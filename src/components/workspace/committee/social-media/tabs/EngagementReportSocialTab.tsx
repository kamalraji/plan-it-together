import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Eye, Heart, MessageCircle, Share2, Download, Instagram, Twitter, Linkedin, Facebook, Youtube } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useEngagementReports, useSocialPlatforms, useSocialPosts } from '@/hooks/useSocialMediaCommitteeData';

interface EngagementReportSocialTabProps {
  workspaceId: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  twitter: '#1DA1F2',
  linkedin: '#0A66C2',
  facebook: '#4267B2',
  youtube: '#FF0000',
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  youtube: Youtube,
};

const DATE_RANGES = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
];

export function EngagementReportSocialTab({ workspaceId }: EngagementReportSocialTabProps) {
  const [dateRange, setDateRange] = useState('30d');

  const selectedRange = DATE_RANGES.find(r => r.id === dateRange) || DATE_RANGES[1];
  const fromDate = format(subDays(new Date(), selectedRange.days), 'yyyy-MM-dd');
  const toDate = format(new Date(), 'yyyy-MM-dd');

  // Queries
  const { isLoading: reportsLoading } = useEngagementReports(workspaceId, { from: fromDate, to: toDate });
  const { data: platforms = [] } = useSocialPlatforms(workspaceId);
  const { data: posts = [] } = useSocialPosts(workspaceId, { status: 'published' });

  // Aggregate stats
  const stats = useMemo(() => {
    const totalFollowers = platforms.reduce((sum, p) => sum + p.followers_count, 0);
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, p) => sum + p.engagement_likes, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.engagement_comments, 0);
    const totalShares = posts.reduce((sum, p) => sum + p.engagement_shares, 0);
    const totalSaves = posts.reduce((sum, p) => sum + p.engagement_saves, 0);
    const totalReach = posts.reduce((sum, p) => sum + p.reach, 0);
    const totalImpressions = posts.reduce((sum, p) => sum + p.impressions, 0);
    const avgEngagementRate = platforms.length > 0 
      ? platforms.reduce((sum, p) => sum + Number(p.engagement_rate), 0) / platforms.length 
      : 0;

    return {
      totalFollowers,
      totalPosts,
      totalLikes,
      totalComments,
      totalShares,
      totalSaves,
      totalReach,
      totalImpressions,
      avgEngagementRate,
    };
  }, [platforms, posts]);

  // Chart data for platform comparison
  const platformChartData = useMemo(() => {
    return platforms.map(p => ({
      name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
      platform: p.platform,
      followers: p.followers_count,
      engagement: Number(p.engagement_rate),
      posts: p.posts_count,
    }));
  }, [platforms]);

  // Chart data for engagement over time (mock - would be from reports in production)
  const engagementOverTime = useMemo(() => {
    const days = [];
    for (let i = selectedRange.days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayPosts = posts.filter(p => {
        if (!p.published_at) return false;
        const postDate = new Date(p.published_at);
        return postDate >= startOfDay(date) && postDate <= endOfDay(date);
      });
      
      days.push({
        date: format(date, 'MMM d'),
        likes: dayPosts.reduce((sum, p) => sum + p.engagement_likes, 0),
        comments: dayPosts.reduce((sum, p) => sum + p.engagement_comments, 0),
        shares: dayPosts.reduce((sum, p) => sum + p.engagement_shares, 0),
      });
    }
    // Sample only some days for readability
    if (selectedRange.days > 14) {
      return days.filter((_, i) => i % Math.ceil(selectedRange.days / 14) === 0);
    }
    return days;
  }, [posts, selectedRange.days]);

  // Top performing posts
  const topPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        const aScore = a.engagement_likes + a.engagement_comments * 2 + a.engagement_shares * 3;
        const bScore = b.engagement_likes + b.engagement_comments * 2 + b.engagement_shares * 3;
        return bScore - aScore;
      })
      .slice(0, 5);
  }, [posts]);

  // Pie chart data for content type breakdown
  const contentTypeData = useMemo(() => {
    const types: Record<string, number> = {};
    posts.forEach(p => {
      types[p.post_type] = (types[p.post_type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [posts]);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  if (reportsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Engagement Report</h2>
          <p className="text-muted-foreground">Analyze your social media performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((range) => (
                <SelectItem key={range.id} value={range.id}>{range.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Users className="h-4 w-4" />
              <span className="text-sm">Followers</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalFollowers.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-sm">Reach</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalReach.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Heart className="h-4 w-4" />
              <span className="text-sm">Likes</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalLikes.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">Comments</span>
            </div>
            <div className="text-2xl font-bold">{stats.totalComments.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Eng. Rate</span>
            </div>
            <div className="text-2xl font-bold">{stats.avgEngagementRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Over Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement Over Time</CardTitle>
            <CardDescription>Likes, comments, and shares trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementOverTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="likes" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="comments" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="shares" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Platform Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Performance</CardTitle>
            <CardDescription>Followers by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {platformChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))' 
                      }} 
                    />
                    <Bar dataKey="followers" name="Followers" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No platform data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Type Mix</CardTitle>
            <CardDescription>Distribution by post type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {contentTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={contentTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {contentTypeData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No posts yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Posts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Top Performing Posts</CardTitle>
            <CardDescription>Highest engagement content</CardDescription>
          </CardHeader>
          <CardContent>
            {topPosts.length > 0 ? (
              <div className="space-y-3">
                {topPosts.map((post, i) => {
                  const Icon = PLATFORM_ICONS[post.platform] || Instagram;
                  return (
                    <div key={post.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                      <Icon className="h-4 w-4" style={{ color: PLATFORM_COLORS[post.platform] }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{post.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {post.published_at ? format(new Date(post.published_at), 'MMM d, yyyy') : 'Draft'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" /> {post.engagement_likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3.5 w-3.5" /> {post.engagement_comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Share2 className="h-3.5 w-3.5" /> {post.engagement_shares}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                No published posts yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
