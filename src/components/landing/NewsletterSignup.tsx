import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface NewsletterSignupProps {
  className?: string;
  /** Variant style */
  variant?: 'default' | 'compact' | 'inline';
  /** Source identifier for tracking */
  source?: string;
}

export function NewsletterSignup({
  className,
  variant = 'default',
  source = 'landing',
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // Direct insert into newsletter_subscribers table
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({
          email: email.toLowerCase().trim(),
          source,
          metadata: {
            subscribed_via: 'web',
            user_agent: navigator.userAgent,
          },
        });

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation - email already exists
          setErrorMessage('This email is already subscribed.');
          setStatus('error');
          return;
        }
        console.error('Newsletter subscription error:', error);
        setErrorMessage('Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      setStatus('success');
      setEmail('');
    } catch (err) {
      console.error('Newsletter subscription error:', err);
      setErrorMessage('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (variant === 'compact') {
    return (
      <div className={className}>
        {status === 'success' ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="w-4 h-4" />
            <span>Thanks for subscribing!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-full text-sm"
              disabled={status === 'loading'}
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-full px-4"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Subscribe'
              )}
            </Button>
          </form>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex flex-col sm:flex-row gap-3 ${className ?? ''}`}>
        {status === 'success' ? (
          <div className="flex items-center gap-2 text-sm text-green-600 py-2">
            <Check className="w-4 h-4" />
            <span>Thanks for subscribing! Check your inbox to confirm.</span>
          </div>
        ) : (
          <>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-full"
              disabled={status === 'loading'}
            />
            <Button
              onClick={handleSubmit}
              className="rounded-full px-6"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              Subscribe
            </Button>
          </>
        )}
        {status === 'error' && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <section
      className={`py-12 md:py-16 bg-card/80 backdrop-blur-sm border-t border-border/60 ${className ?? ''}`}
    >
      <div className="container max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
            <Mail className="w-5 h-5" />
          </div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Stay Updated
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Get the latest news about Thittam1Hub features, tips, and event management best practices.
          </p>

          {status === 'success' ? (
            <div className="flex items-center justify-center gap-2 text-green-600 py-4">
              <Check className="w-5 h-5" />
              <span>Thanks for subscribing! Check your inbox to confirm.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-full text-center sm:text-left"
                disabled={status === 'loading'}
              />
              <Button
                type="submit"
                className="rounded-full px-6"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Subscribing...
                  </>
                ) : (
                  'Subscribe'
                )}
              </Button>
            </form>
          )}

          {status === 'error' && (
            <p className="text-sm text-destructive mt-2">{errorMessage}</p>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            No spam, ever. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default NewsletterSignup;
