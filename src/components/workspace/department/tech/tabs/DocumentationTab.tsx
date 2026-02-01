import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Book, Search, Plus, ExternalLink, Clock, User, FolderOpen } from 'lucide-react';
import { useState } from 'react';

interface DocumentationTabProps {
  workspaceId: string;
}

const documents = [
  { id: 1, title: 'Network Architecture Guide', category: 'Infrastructure', author: 'IT Team', updated: '1 week ago', views: 234 },
  { id: 2, title: 'Security Best Practices', category: 'Security', author: 'Security Team', updated: '3 days ago', views: 567 },
  { id: 3, title: 'Backup & Recovery Procedures', category: 'Operations', author: 'Ops Team', updated: '2 weeks ago', views: 123 },
  { id: 4, title: 'User Onboarding Guide', category: 'HR/IT', author: 'HR Team', updated: '1 month ago', views: 890 },
  { id: 5, title: 'Incident Response Playbook', category: 'Security', author: 'Security Team', updated: '5 days ago', views: 345 },
  { id: 6, title: 'VPN Setup Instructions', category: 'Infrastructure', author: 'IT Team', updated: '2 days ago', views: 678 },
];

const categories = [
  { name: 'Infrastructure', count: 12, color: 'bg-blue-500' },
  { name: 'Security', count: 8, color: 'bg-red-500' },
  { name: 'Operations', count: 15, color: 'bg-emerald-500' },
  { name: 'HR/IT', count: 6, color: 'bg-purple-500' },
];

export function DocumentationTab({ workspaceId: _workspaceId }: DocumentationTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documentation</h2>
          <p className="text-muted-foreground">Access and manage IT documentation</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <Card key={category.name} className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${category.color}`} />
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{category.count} docs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{documents.length}</p>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold text-amber-500">3</p>
                <p className="text-sm text-muted-foreground">Updated This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-blue-500">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            All Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{doc.author}</span>
                      <span>•</span>
                      <Clock className="h-3 w-3" />
                      <span>{doc.updated}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{doc.category}</Badge>
                  <span className="text-sm text-muted-foreground">{doc.views} views</span>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
