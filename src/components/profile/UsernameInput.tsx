import React from 'react';
import { Loader2, CheckCircle2, XCircle, AtSign, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUsernameValidation, canChangeUsername } from '@/hooks/useUsernameValidation';
import { cn } from '@/lib/utils';

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  currentUsername?: string | null;
  usernameChangedAt?: string | null;
  error?: string;
  disabled?: boolean;
}

export const UsernameInput: React.FC<UsernameInputProps> = ({
  value,
  onChange,
  currentUsername,
  usernameChangedAt,
  error: formError,
  disabled = false,
}) => {
  const { isChecking, isAvailable, error: validationError, suggestions } = useUsernameValidation(value);
  const { canChange, daysRemaining } = canChangeUsername(usernameChangedAt ?? null);
  
  // Determine if input should be disabled
  const isDisabled = disabled || (!canChange && !!currentUsername);
  
  // Determine if value matches current username (no change)
  const isCurrentUsername = !!(currentUsername && value.toLowerCase() === currentUsername.toLowerCase());
  
  // Handle input change - auto lowercase
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    onChange(newValue);
  };

  // Determine status icon
  const renderStatusIcon = () => {
    if (!value || value.length < 3) return null;
    
    if (isCurrentUsername) {
      return <CheckCircle2 className="h-4 w-4 text-muted-foreground" />;
    }
    
    if (isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    
    if (isAvailable === true) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    
    if (isAvailable === false) {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    
    return null;
  };

  // Get the display error
  const displayError = formError || (!isCurrentUsername ? validationError : null);

  return (
    <div className="space-y-2">
      <Label htmlFor="username" className="flex items-center gap-1">
        Username
        <span className="text-muted-foreground text-xs font-normal">(optional)</span>
      </Label>
      
      <div className="relative">
        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="username"
          type="text"
          value={value}
          onChange={handleChange}
          disabled={isDisabled}
          className={cn(
            "pl-9 pr-10",
            displayError && "border-destructive focus-visible:ring-destructive",
            isAvailable === true && !isCurrentUsername && "border-green-500 focus-visible:ring-green-500"
          )}
          placeholder="your_username"
          maxLength={30}
          autoComplete="username"
          aria-describedby="username-help username-error"
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {renderStatusIcon()}
        </div>
      </div>
      
      {/* Helper text and character counter */}
      <div className="flex justify-between items-start gap-2">
        <p id="username-help" className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="h-3 w-3" />
          3-30 characters, letters, numbers, underscores
        </p>
        <span className={cn(
          "text-xs tabular-nums",
          value.length > 25 ? "text-amber-500" : "text-muted-foreground",
          value.length >= 30 && "text-destructive"
        )}>
          {value.length}/30
        </span>
      </div>
      
      {/* Error message */}
      {displayError && (
        <p id="username-error" className="text-xs text-destructive" role="alert">
          {displayError}
        </p>
      )}
      
      {/* Availability status for valid usernames */}
      {!displayError && value.length >= 3 && !isCurrentUsername && (
        <>
          {isChecking && (
            <p className="text-xs text-muted-foreground">
              Checking availability...
            </p>
          )}
          {!isChecking && isAvailable === true && (
            <p className="text-xs text-green-600">
              ✓ Username is available
            </p>
          )}
        </>
      )}
      
      {/* Suggestions when username is taken */}
      {suggestions.length > 0 && !isCurrentUsername && (
        <div className="text-xs space-x-1">
          <span className="text-muted-foreground">Try:</span>
          {suggestions.map((suggestion, index) => (
            <React.Fragment key={suggestion}>
              <button
                type="button"
                onClick={() => onChange(suggestion)}
                className="text-primary hover:underline focus:underline focus:outline-none"
              >
                @{suggestion}
              </button>
              {index < suggestions.length - 1 && (
                <span className="text-muted-foreground">,</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      
      {/* Rate limit warning */}
      {!canChange && currentUsername && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1.5 rounded-md">
          <Info className="h-3 w-3 shrink-0" />
          <span>
            Username can be changed again in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};
