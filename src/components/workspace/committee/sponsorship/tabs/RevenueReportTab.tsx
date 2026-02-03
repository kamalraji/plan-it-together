import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Workspace } from '@/types';
import { useSponsors, useSponsorshipStats } from '@/hooks/useSponsorshipCommitteeData';
import { 
  DollarSign, 
  TrendingUp,
  PieChart,
  Download,
  Building2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface RevenueReportTabProps {
  workspace: Workspace;
}

const tierColors: Record<string, string> = {
  platinum: '#64748b',
  gold: '#f59e0b',
  silver: '#9ca3af',
  bronze: '#ea580c',
};

const paymentStatusColors: Record<string, { color: string; bgColor: string; label: string }> = {
  paid: { color: 'text-emerald-600', bgColor: 'bg-emerald-500/10', label: 'Paid' },
  pending: { color: 'text-amber-600', bgColor: 'bg-amber-500/10', label: 'Pending' },
  partial: { color: 'text-blue-600', bgColor: 'bg-blue-500/10', label: 'Partial' },
  overdue: { color: 'text-red-600', bgColor: 'bg-red-500/10', label: 'Overdue' },
};

export function RevenueReportTab({ workspace }: RevenueReportTabProps) {
  const [tierFilter, setTierFilter] = useState<string>('all');
  
  const { data: sponsors = [], isLoading } = useSponsors(workspace.id);
  const stats = useSponsorshipStats(workspace.id);

  // Filter active sponsors
  const activeSponsors = sponsors.filter(s => s.status === 'active');
  const filteredSponsors = tierFilter === 'all' 
    ? activeSponsors 
    : activeSponsors.filter(s => s.tier === tierFilter);

  // Calculate stats
  const totalContracted = activeSponsors.reduce((sum, s) => sum + (s.contract_value || 0), 0);
  const totalCollected = activeSponsors
    .filter(s => s.payment_status === 'paid')
    .reduce((sum, s) => sum + (s.contract_value || 0), 0);
  const partialCollected = activeSponsors
    .filter(s => s.payment_status === 'partial')
    .reduce((sum, s) => sum + (s.contract_value || 0) * 0.5, 0); // Assuming 50% for partial
  const totalPending = activeSponsors
    .filter(s => ['pending', 'overdue'].includes(s.payment_status))
    .reduce((sum, s) => sum + (s.contract_value || 0), 0);
  const collectionRate = totalContracted > 0 
    ? Math.round(((totalCollected + partialCollected) / totalContracted) * 100) 
    : 0;

  // Pie chart data for tier distribution
  const tierData = Object.entries(stats.revenueByTier).map(([tier, value]) => ({
    name: tier.charAt(0).toUpperCase() + tier.slice(1),
    value,
    color: tierColors[tier] || '#6b7280',
  }));

  // Bar chart data for payment status
  const paymentData = [
    { status: 'Paid', amount: totalCollected, color: '#10b981' },
    { status: 'Partial', amount: partialCollected * 2, color: '#3b82f6' }, // Show full amount
    { status: 'Pending', amount: totalPending, color: '#f59e0b' },
  ].filter(d => d.amount > 0);

  const handleExportCSV = () => {
    const headers = ['Sponsor', 'Tier', 'Contract Value', 'Payment Status', 'Contact'];
    const rows = filteredSponsors.map(s => [
      s.name,
      s.tier,
      s.contract_value?.toString() || '0',
      s.payment_status,
      s.contact_email || '',
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sponsorship-revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">${totalContracted.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Contracted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">${(totalCollected + partialCollected).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">${totalPending.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{collectionRate}%</p>
                <p className="text-xs text-muted-foreground">Collection Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue by Tier */}
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Revenue by Tier</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {tierData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPie>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {tierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            )}
            <div className="flex justify-center gap-4 mt-4">
              {tierData.map((tier) => (
                <div key={tier.name} className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: tier.color }} 
                  />
                  <span className="text-xs text-muted-foreground">{tier.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader className="py-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Payment Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {paymentData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={paymentData} layout="vertical">
                  <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="status" width={60} />
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sponsor Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-4">
          <CardTitle className="text-lg">Sponsor Revenue Details</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredSponsors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Building2 className="h-8 w-8 mb-2 opacity-50" />
                <p>No sponsors found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Sponsor</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Tier</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">Contract Value</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-muted-foreground">Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSponsors.map((sponsor) => {
                    const statusConfig = paymentStatusColors[sponsor.payment_status] || paymentStatusColors.pending;
                    return (
                      <tr key={sponsor.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm text-foreground">{sponsor.name}</p>
                              {sponsor.contact_name && (
                                <p className="text-xs text-muted-foreground">{sponsor.contact_name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant="outline" 
                            className="capitalize text-xs"
                            style={{ 
                              backgroundColor: `${tierColors[sponsor.tier]}20`,
                              color: tierColors[sponsor.tier],
                              borderColor: tierColors[sponsor.tier],
                            }}
                          >
                            {sponsor.tier}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-foreground">
                            ${(sponsor.contract_value || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="secondary" className={cn('text-xs', statusConfig.bgColor, statusConfig.color)}>
                            {statusConfig.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/30">
                    <td colSpan={2} className="py-3 px-4 font-medium text-sm">
                      Total ({filteredSponsors.length} sponsors)
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-foreground">
                      ${filteredSponsors.reduce((sum, s) => sum + (s.contract_value || 0), 0).toLocaleString()}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
