 import { cn } from '@/lib/utils';
 
 interface Thittam1HubLogoProps {
   size?: 'sm' | 'md' | 'lg';
   showText?: boolean;
   className?: string;
 }
 
 /**
  * Hub network icon - matches the favicon design
  * Purple (#8B5CF6) to Cyan (#06B6D4) gradient with white hub symbol
  */
 export function Thittam1HubLogo({ 
   size = 'md', 
   showText = true,
   className 
 }: Thittam1HubLogoProps) {
   const sizeClasses = {
     sm: 'h-7 w-7',
     md: 'h-9 w-9',
     lg: 'h-12 w-12',
   };
 
   const textSizeClasses = {
     sm: 'text-xs',
     md: 'text-sm',
     lg: 'text-base',
   };
 
   return (
     <div className={cn('flex items-center gap-2', className)}>
       {/* Hub Icon with gradient background */}
       <div 
         className={cn(
           'relative rounded-lg shadow-md flex items-center justify-center',
           sizeClasses[size]
         )}
         style={{
           background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
         }}
       >
         {/* Hub Network SVG Icon */}
         <svg 
           viewBox="0 0 24 24" 
           fill="none" 
           className="w-[60%] h-[60%]"
           aria-hidden="true"
         >
           {/* Center node */}
           <circle cx="12" cy="12" r="2.5" fill="white" />
           
           {/* Outer nodes */}
           <circle cx="12" cy="4" r="1.8" fill="white" />
           <circle cx="12" cy="20" r="1.8" fill="white" />
           <circle cx="5" cy="8" r="1.8" fill="white" />
           <circle cx="19" cy="8" r="1.8" fill="white" />
           <circle cx="5" cy="16" r="1.8" fill="white" />
           <circle cx="19" cy="16" r="1.8" fill="white" />
           
           {/* Connecting lines */}
           <line x1="12" y1="9.5" x2="12" y2="5.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
           <line x1="12" y1="14.5" x2="12" y2="18.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
           <line x1="9.8" y1="10.7" x2="6.5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
           <line x1="14.2" y1="10.7" x2="17.5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
           <line x1="9.8" y1="13.3" x2="6.5" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
           <line x1="14.2" y1="13.3" x2="17.5" y2="15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
         </svg>
       </div>
 
       {showText && (
         <div className="flex flex-col leading-tight">
           <span className={cn('font-semibold tracking-tight text-foreground', textSizeClasses[size])}>
             Thittam1Hub
           </span>
           {size !== 'sm' && (
             <span className="text-[10px] text-muted-foreground hidden sm:block">
               Event marketing workspaces
             </span>
           )}
         </div>
       )}
     </div>
   );
 }
 
 export default Thittam1HubLogo;