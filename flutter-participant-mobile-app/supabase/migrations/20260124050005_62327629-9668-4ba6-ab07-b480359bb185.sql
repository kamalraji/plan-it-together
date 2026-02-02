-- Add missing updated_at column to event_images table
ALTER TABLE public.event_images 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing rows with created_at value
UPDATE public.event_images SET updated_at = created_at WHERE updated_at IS NULL;

-- Add trigger for automatic timestamp updates
CREATE OR REPLACE TRIGGER update_event_images_updated_at
BEFORE UPDATE ON public.event_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();