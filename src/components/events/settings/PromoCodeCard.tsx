import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Copy, Trash2, Tag } from 'lucide-react';
import { 
  PromoCode, 
  getPromoCodeStatus, 
  getPromoCodeStatusColor, 
  formatDiscount 
} from '@/types/promoCode';
import { useToast } from '@/hooks/use-toast';

interface PromoCodeCardProps {
  promoCode: PromoCode;
  onEdit: (promoCode: PromoCode) => void;
  onDuplicate: (promoCode: PromoCode) => void;
  onDelete: (promoCode: PromoCode) => void;
}

export const PromoCodeCard: React.FC<PromoCodeCardProps> = ({
  promoCode,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  const { toast } = useToast();
  const status = getPromoCodeStatus(promoCode);
  const statusColor = getPromoCodeStatusColor(status);

  const copyCode = () => {
    navigator.clipboard.writeText(promoCode.code);
    toast({ title: 'Code copied', description: `"${promoCode.code}" copied to clipboard` });
  };

  const getUsageText = () => {
    if (promoCode.max_uses === null) {
      return `${promoCode.current_uses} uses`;
    }
    return `${promoCode.current_uses}/${promoCode.max_uses} uses`;
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">
          <Tag className="h-4 w-4 text-primary" />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={copyCode}
                  className="font-mono font-bold text-primary hover:underline cursor-pointer"
                >
                  {promoCode.code}
                </button>
                <Badge variant="secondary" className={`text-xs ${statusColor}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Badge>
              </div>
              {promoCode.name && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {promoCode.name}
                </p>
              )}
            </div>

            {/* Discount */}
            <div className="text-right shrink-0">
              <p className="font-bold text-lg text-success">
                {formatDiscount(promoCode)}
              </p>
              <p className="text-xs text-muted-foreground">{getUsageText()}</p>
            </div>
          </div>

          {/* Conditions */}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
            {promoCode.min_quantity > 1 && (
              <span className="px-2 py-0.5 bg-muted rounded">
                Min {promoCode.min_quantity} tickets
              </span>
            )}
            {promoCode.valid_from && (
              <span className="px-2 py-0.5 bg-muted rounded">
                From: {new Date(promoCode.valid_from).toLocaleDateString()}
              </span>
            )}
            {promoCode.valid_until && (
              <span className="px-2 py-0.5 bg-muted rounded">
                Until: {new Date(promoCode.valid_until).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={copyCode}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Code
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(promoCode)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(promoCode)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(promoCode)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
};
