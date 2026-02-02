import React, { useState, forwardRef } from 'react';
import { Mail, Copy, Check, MessageSquare, HelpCircle, Send, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContactSectionProps {
  className?: string;
  /** Show the embedded contact form */
  showForm?: boolean;
}

export const ContactSection = forwardRef<HTMLElement, ContactSectionProps>(
  function ContactSection({ className, showForm = false }, ref) {
    const [copied, setCopied] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      category: 'general',
      message: '',
    });
    const supportEmail = 'support@thittam1hub.com';

    const handleCopyEmail = async () => {
      try {
        await navigator.clipboard.writeText(supportEmail);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = supportEmail;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }

      setIsSubmitting(true);

      try {
        const { error } = await supabase.from('contact_submissions').insert({
          name: formData.name.trim(),
          email: formData.email.trim(),
          category: formData.category,
          message: formData.message.trim(),
        });

        if (error) throw error;

        setFormSubmitted(true);
        setFormData({ name: '', email: '', category: 'general', message: '' });
        toast.success('Message sent! We\'ll get back to you soon.');
      } catch (error) {
        console.error('Failed to submit contact form:', error);
        toast.error('Failed to send message. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <section
        ref={ref}
        className={`py-16 md:py-20 bg-background/95 border-t border-border/60 ${className ?? ''}`}
        aria-labelledby="contact-heading"
      >
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2
              id="contact-heading"
              className="text-2xl md:text-3xl font-semibold tracking-tight mb-4"
            >
              Get in Touch
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Have questions? We're here to help. Reach out to our team and we'll get back to you as soon as possible.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Email contact */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: 0 }}
              className="rounded-2xl border border-border/60 bg-card/80 p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Email Us</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drop us a line and we'll respond within 24 hours.
              </p>
              <button
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline min-h-[44px]"
              >
                {supportEmail}
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </motion.div>

            {/* Help Center */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border border-border/60 bg-card/80 p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-4">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Help Center</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Browse guides, tutorials, and FAQs to get started.
              </p>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/help">Visit Help Center</Link>
              </Button>
            </motion.div>

            {/* Live Chat / Feedback */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="rounded-2xl border border-border/60 bg-card/80 p-6 text-center hover:shadow-md transition-shadow"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/50 text-secondary-foreground mb-4">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Feedback</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your ideas or report issues to help us improve.
              </p>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/help?intent=feedback">Send Feedback</Link>
              </Button>
            </motion.div>
          </div>

          {/* Contact Form */}
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12 rounded-2xl border border-border/60 bg-card/80 p-6 md:p-8"
            >
              <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
                Send us a message
              </h3>

              {formSubmitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                    <Check className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">Message Sent!</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Thanks for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <Button variant="outline" onClick={() => setFormSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-name">Name *</Label>
                      <Input
                        id="contact-name"
                        type="text"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Email *</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-category">Category</Label>
                    <select
                      id="contact-category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="sales">Sales & Pricing</option>
                      <option value="partnership">Partnership</option>
                      <option value="feedback">Feedback</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-message">Message *</Label>
                    <textarea
                      id="contact-message"
                      placeholder="How can we help you?"
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      required
                      rows={4}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  <div className="flex justify-center pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="rounded-full px-8"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </div>
      </section>
    );
  }
);

export default ContactSection;
