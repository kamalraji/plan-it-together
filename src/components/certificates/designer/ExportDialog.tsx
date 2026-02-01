import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Download, FileImage, Loader2, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type ExportFormat = 'A4' | 'Letter' | 'A3' | 'A5';
export type ExportQuality = 'standard' | 'high' | 'print' | 'print-300dpi';
export type ExportFileType = 'pdf' | 'png' | 'both';
export type ExportOrientation = 'landscape' | 'portrait';

export interface ExportOptions {
  format: ExportFormat;
  orientation: ExportOrientation;
  quality: ExportQuality;
  fileType: ExportFileType;
  includeBleed: boolean;
  bleedMm: number;
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => Promise<void>;
  isExporting: boolean;
  templateName: string;
}

const FORMAT_INFO = {
  A4: { name: 'A4', dimensions: '297 × 210 mm', pixels: '3508 × 2480 px (300 DPI)' },
  Letter: { name: 'US Letter', dimensions: '279 × 216 mm', pixels: '3300 × 2550 px (300 DPI)' },
  A3: { name: 'A3', dimensions: '420 × 297 mm', pixels: '4961 × 3508 px (300 DPI)' },
  A5: { name: 'A5', dimensions: '210 × 148 mm', pixels: '2480 × 1748 px (300 DPI)' },
};

const QUALITY_INFO = {
  standard: {
    name: 'Standard',
    dpi: 72,
    description: 'Screen viewing',
    estimatedSize: '~500 KB',
  },
  high: {
    name: 'High',
    dpi: 150,
    description: 'Home printing',
    estimatedSize: '~2 MB',
  },
  print: {
    name: 'Print Quality',
    dpi: 200,
    description: 'Office printing',
    estimatedSize: '~4 MB',
  },
  'print-300dpi': {
    name: 'Professional Print',
    dpi: 300,
    description: 'Commercial printing',
    estimatedSize: '~8 MB',
  },
};

export function ExportDialog({
  open,
  onOpenChange,
  onExport,
  isExporting,
  templateName,
}: ExportDialogProps) {
  const [options, setOptions] = useState<ExportOptions>({
    format: 'A4',
    orientation: 'landscape',
    quality: 'high',
    fileType: 'pdf',
    includeBleed: false,
    bleedMm: 3,
  });

  const handleExport = async () => {
    await onExport(options);
  };

  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const formatInfo = FORMAT_INFO[options.format];
  const qualityInfo = QUALITY_INFO[options.quality];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Certificate</DialogTitle>
          <DialogDescription>
            Configure export settings for "{templateName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Paper Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Paper Format</Label>
            <Select
              value={options.format}
              onValueChange={(v) => updateOption('format', v as ExportFormat)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FORMAT_INFO).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span>{info.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({info.dimensions})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              At 300 DPI: {formatInfo.pixels}
            </p>
          </div>

          {/* Orientation */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Orientation</Label>
            <RadioGroup
              value={options.orientation}
              onValueChange={(v) => updateOption('orientation', v as ExportOrientation)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="landscape" id="landscape" />
                <Label htmlFor="landscape" className="cursor-pointer">
                  Landscape
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="portrait" id="portrait" />
                <Label htmlFor="portrait" className="cursor-pointer">
                  Portrait
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          {/* Quality */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Quality</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p>Higher DPI produces sharper prints but larger file sizes.</p>
                    <p className="mt-1">300 DPI is recommended for professional printing.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <RadioGroup
              value={options.quality}
              onValueChange={(v) => updateOption('quality', v as ExportQuality)}
              className="grid grid-cols-2 gap-2"
            >
              {Object.entries(QUALITY_INFO).map(([key, info]) => (
                <div key={key} className="relative">
                  <RadioGroupItem
                    value={key}
                    id={key}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={key}
                    className="flex flex-col items-start gap-1 rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                  >
                    <span className="font-medium text-sm">{info.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {info.dpi} DPI • {info.description}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Estimated file size: {qualityInfo.estimatedSize}
            </p>
          </div>

          <Separator />

          {/* File Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export As</Label>
            <RadioGroup
              value={options.fileType}
              onValueChange={(v) => updateOption('fileType', v as ExportFileType)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="cursor-pointer flex items-center gap-1">
                  <Download className="h-4 w-4" />
                  PDF
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="png" id="png" />
                <Label htmlFor="png" className="cursor-pointer flex items-center gap-1">
                  <FileImage className="h-4 w-4" />
                  PNG
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="both" />
                <Label htmlFor="both" className="cursor-pointer">
                  Both
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Print Bleed */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Include Print Bleed</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p>Adds extra margin around the certificate for professional printing and trimming.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                checked={options.includeBleed}
                onCheckedChange={(v) => updateOption('includeBleed', v)}
              />
            </div>
            {options.includeBleed && (
              <Select
                value={String(options.bleedMm)}
                onValueChange={(v) => updateOption('bleedMm', parseInt(v))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3mm bleed</SelectItem>
                  <SelectItem value="5">5mm bleed</SelectItem>
                  <SelectItem value="6">6mm bleed</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {options.fileType === 'both' ? 'PDF & PNG' : options.fileType.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
