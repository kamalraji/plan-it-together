/**
 * LanguageSelector - Dropdown for changing application language
 */
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/hooks/useLanguage';

interface LanguageSelectorProps {
  variant?: 'default' | 'ghost' | 'outline';
  showLabel?: boolean;
}

export function LanguageSelector({ 
  variant = 'ghost',
  showLabel = false 
}: LanguageSelectorProps) {
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();
  
  const currentLangName = supportedLanguages.find(l => l.code === currentLanguage)?.name || 'English';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={showLabel ? 'default' : 'icon'} className="gap-2">
          <Globe className="h-4 w-4" />
          {showLabel && <span>{currentLangName}</span>}
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={currentLanguage === lang.code ? 'bg-accent' : ''}
          >
            <span className="mr-2">{lang.code.toUpperCase()}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
