import React, { useMemo, useState } from 'react';
import { Check, X, AlertTriangle, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface SEOIssue {
  id: string;
  type: 'error' | 'warning' | 'success';
  title: string;
  description: string;
  recommendation?: string;
}

interface SEOValidatorProps {
  html: string;
  meta?: {
    title?: string;
    description?: string;
  };
}

export const SEOValidator: React.FC<SEOValidatorProps> = ({ html, meta }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const issues = useMemo(() => {
    const result: SEOIssue[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check title
    const titleText = meta?.title || doc.querySelector('title')?.textContent || '';
    if (!titleText) {
      result.push({
        id: 'title-missing',
        type: 'error',
        title: 'Missing page title',
        description: 'No title tag found.',
        recommendation: 'Add a descriptive title between 50-60 characters.',
      });
    } else if (titleText.length < 30) {
      result.push({
        id: 'title-short',
        type: 'warning',
        title: 'Title too short',
        description: `Title is ${titleText.length} characters.`,
        recommendation: 'Aim for 50-60 characters for optimal SEO.',
      });
    } else if (titleText.length > 60) {
      result.push({
        id: 'title-long',
        type: 'warning',
        title: 'Title too long',
        description: `Title is ${titleText.length} characters.`,
        recommendation: 'Keep under 60 characters to avoid truncation.',
      });
    } else {
      result.push({
        id: 'title-ok',
        type: 'success',
        title: 'Title length optimal',
        description: `${titleText.length} characters`,
      });
    }

    // Check meta description
    const descText = meta?.description || 
      doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    if (!descText) {
      result.push({
        id: 'desc-missing',
        type: 'error',
        title: 'Missing meta description',
        description: 'No meta description found.',
        recommendation: 'Add a compelling description between 150-160 characters.',
      });
    } else if (descText.length < 120) {
      result.push({
        id: 'desc-short',
        type: 'warning',
        title: 'Description too short',
        description: `Description is ${descText.length} characters.`,
        recommendation: 'Aim for 150-160 characters for better CTR.',
      });
    } else if (descText.length > 160) {
      result.push({
        id: 'desc-long',
        type: 'warning',
        title: 'Description too long',
        description: `Description is ${descText.length} characters.`,
        recommendation: 'Keep under 160 characters to avoid truncation.',
      });
    } else {
      result.push({
        id: 'desc-ok',
        type: 'success',
        title: 'Description length optimal',
        description: `${descText.length} characters`,
      });
    }

    // Check H1
    const h1Elements = doc.querySelectorAll('h1');
    if (h1Elements.length === 0) {
      result.push({
        id: 'h1-missing',
        type: 'error',
        title: 'Missing H1 heading',
        description: 'No H1 tag found on the page.',
        recommendation: 'Add exactly one H1 that describes the page content.',
      });
    } else if (h1Elements.length > 1) {
      result.push({
        id: 'h1-multiple',
        type: 'warning',
        title: 'Multiple H1 headings',
        description: `Found ${h1Elements.length} H1 tags.`,
        recommendation: 'Use only one H1 per page for clarity.',
      });
    } else {
      result.push({
        id: 'h1-ok',
        type: 'success',
        title: 'H1 heading present',
        description: 'Single H1 found.',
      });
    }

    // Check images for alt text
    const images = doc.querySelectorAll('img');
    const imagesWithoutAlt = Array.from(images).filter(
      (img) => !img.getAttribute('alt')
    );
    if (imagesWithoutAlt.length > 0) {
      result.push({
        id: 'img-alt-missing',
        type: 'warning',
        title: 'Images missing alt text',
        description: `${imagesWithoutAlt.length} of ${images.length} images lack alt text.`,
        recommendation: 'Add descriptive alt text for accessibility and SEO.',
      });
    } else if (images.length > 0) {
      result.push({
        id: 'img-alt-ok',
        type: 'success',
        title: 'All images have alt text',
        description: `${images.length} images with alt text.`,
      });
    }

    // Check links
    const links = doc.querySelectorAll('a');
    const emptyLinks = Array.from(links).filter(
      (a) => !a.textContent?.trim() && !a.getAttribute('aria-label')
    );
    if (emptyLinks.length > 0) {
      result.push({
        id: 'links-empty',
        type: 'warning',
        title: 'Empty link text',
        description: `${emptyLinks.length} links have no descriptive text.`,
        recommendation: 'Use meaningful anchor text or aria-label.',
      });
    }

    return result;
  }, [html, meta]);

  const score = useMemo(() => {
    const total = issues.length;
    const successes = issues.filter((i) => i.type === 'success').length;
    return total > 0 ? Math.round((successes / total) * 100) : 0;
  }, [issues]);

  const errors = issues.filter((i) => i.type === 'error');
  const warnings = issues.filter((i) => i.type === 'warning');
  const successes = issues.filter((i) => i.type === 'success');

  return (
    <div className="border-t border-[var(--gjs-border)] pt-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-[var(--gjs-text-primary)] hover:bg-[var(--gjs-bg-hover)] rounded-md transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-[var(--gjs-text-muted)]" />
        ) : (
          <ChevronRight className="h-4 w-4 text-[var(--gjs-text-muted)]" />
        )}
        <Search className="h-4 w-4 text-[var(--gjs-accent)]" />
        <span>SEO Check</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span
            className={cn(
              'text-xs font-medium',
              score >= 80
                ? 'text-green-500'
                : score >= 60
                ? 'text-amber-500'
                : 'text-destructive'
            )}
          >
            {score}%
          </span>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="mt-3 space-y-3 px-2">
          {/* Score bar */}
          <div className="space-y-1">
            <Progress
              value={score}
              className={cn(
                'h-2',
                score >= 80
                  ? '[&>div]:bg-green-500'
                  : score >= 60
                  ? '[&>div]:bg-amber-500'
                  : '[&>div]:bg-destructive'
              )}
            />
            <div className="flex justify-between text-[10px] text-[var(--gjs-text-muted)]">
              <span>
                {errors.length} errors • {warnings.length} warnings
              </span>
              <span>{successes.length} passed</span>
            </div>
          </div>

          {/* Issues list */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {issues.map((issue) => (
              <IssueItem key={issue.id} issue={issue} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const IssueItem: React.FC<{ issue: SEOIssue }> = ({ issue }) => {
  const icons = {
    error: X,
    warning: AlertTriangle,
    success: Check,
  };
  const colors = {
    error: 'text-destructive',
    warning: 'text-amber-500',
    success: 'text-green-500',
  };

  const Icon = icons[issue.type];

  return (
    <div className="flex items-start gap-2 p-1.5 rounded text-xs">
      <Icon className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', colors[issue.type])} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[var(--gjs-text-primary)]">{issue.title}</p>
        <p className="text-[var(--gjs-text-muted)]">{issue.description}</p>
        {issue.recommendation && (
          <p className="mt-0.5 text-[var(--gjs-accent)]">{issue.recommendation}</p>
        )}
      </div>
    </div>
  );
};
