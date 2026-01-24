import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  HelpCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface EventFAQ {
  id?: string;
  question: string;
  answer: string;
  sort_order: number;
}

interface EventFAQsSectionProps {
  faqs: EventFAQ[];
  onChange: (faqs: EventFAQ[]) => void;
  maxFaqs?: number;
  disabled?: boolean;
}

export const EventFAQsSection: React.FC<EventFAQsSectionProps> = ({
  faqs,
  onChange,
  maxFaqs = 20,
  disabled = false,
}) => {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  const handleAdd = () => {
    if (faqs.length >= maxFaqs) return;
    
    const newFaq: EventFAQ = {
      question: '',
      answer: '',
      sort_order: faqs.length,
    };
    
    onChange([...faqs, newFaq]);
    setExpandedIndex(faqs.length);
  };

  const handleRemove = (index: number) => {
    const newFaqs = faqs.filter((_, i) => i !== index);
    // Recalculate sort orders
    newFaqs.forEach((faq, i) => {
      faq.sort_order = i;
    });
    onChange(newFaqs);
    
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleQuestionChange = (index: number, question: string) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], question };
    onChange(newFaqs);
  };

  const handleAnswerChange = (index: number, answer: string) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], answer };
    onChange(newFaqs);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newFaqs = [...faqs];
    [newFaqs[index - 1], newFaqs[index]] = [newFaqs[index], newFaqs[index - 1]];
    newFaqs.forEach((faq, i) => {
      faq.sort_order = i;
    });
    onChange(newFaqs);
    setExpandedIndex(index - 1);
  };

  const handleMoveDown = (index: number) => {
    if (index === faqs.length - 1) return;
    const newFaqs = [...faqs];
    [newFaqs[index], newFaqs[index + 1]] = [newFaqs[index + 1], newFaqs[index]];
    newFaqs.forEach((faq, i) => {
      faq.sort_order = i;
    });
    onChange(newFaqs);
    setExpandedIndex(index + 1);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFaqs = [...faqs];
    const draggedFaq = newFaqs[draggedIndex];
    newFaqs.splice(draggedIndex, 1);
    newFaqs.splice(index, 0, draggedFaq);
    
    newFaqs.forEach((faq, i) => {
      faq.sort_order = i;
    });

    onChange(newFaqs);
    setDraggedIndex(index);
    
    if (expandedIndex === draggedIndex) {
      setExpandedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* FAQ list */}
      {faqs.length > 0 && (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              draggable={!disabled}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'rounded-lg border border-border/50 bg-card overflow-hidden transition-all',
                draggedIndex === index && 'opacity-50 ring-2 ring-primary',
                !disabled && 'cursor-grab'
              )}
            >
              {/* FAQ header */}
              <div
                className={cn(
                  'flex items-center gap-3 p-3 bg-muted/30',
                  !disabled && 'cursor-pointer hover:bg-muted/50'
                )}
                onClick={() => !disabled && setExpandedIndex(expandedIndex === index ? null : index)}
              >
                {/* Drag handle */}
                {!disabled && (
                  <div 
                    className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>
                )}

                {/* Question number */}
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                  {index + 1}
                </div>

                {/* Question preview */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    faq.question ? 'text-foreground' : 'text-muted-foreground italic'
                  )}>
                    {faq.question || 'Untitled question'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {!disabled && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(index);
                        }}
                        disabled={index === 0}
                        title="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(index);
                        }}
                        disabled={index === faqs.length - 1}
                        title="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(index);
                        }}
                        title="Remove FAQ"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <ChevronDown className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform',
                    expandedIndex === index && 'rotate-180'
                  )} />
                </div>
              </div>

              {/* FAQ content (expanded) */}
              {expandedIndex === index && (
                <div className="p-4 space-y-4 border-t border-border/50">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Question
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., What is the refund policy?"
                      value={faq.question}
                      onChange={(e) => handleQuestionChange(index, e.target.value)}
                      disabled={disabled}
                      className="h-10"
                      maxLength={500}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Answer
                    </label>
                    <Textarea
                      placeholder="Provide a clear and helpful answer..."
                      value={faq.answer}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      disabled={disabled}
                      className="min-h-[100px] resize-none"
                      maxLength={2000}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {faq.answer.length}/2000 characters
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add FAQ button */}
      {faqs.length < maxFaqs && !disabled && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          className="w-full border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
      )}

      {/* Empty state */}
      {faqs.length === 0 && !disabled && (
        <div className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center">
          <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No FAQs yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Add frequently asked questions to help attendees
          </p>
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add your first FAQ
          </Button>
        </div>
      )}

      {/* FAQ tips */}
      {faqs.length > 0 && (
        <div className="rounded-lg border border-border/50 bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">💡 Tips:</strong> Common FAQs include registration process, 
            refund policy, parking/venue access, what to bring, and contact information. 
            Drag to reorder.
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {faqs.length}/{maxFaqs} FAQs
      </p>
    </div>
  );
};

export default EventFAQsSection;
