import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Search, 
  Play,
  Clock,
  Star,
  Bookmark,
  Download,
  Target,
  Headphones,
  FileText,
  Video,
  Sparkles,
  Loader2
} from 'lucide-react';
import { MobileContainer, MobileGrid, MobileCard } from '@/components/responsive/MobileOptimized';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

type LibraryItem = Tables<'library_items'> & {
  isBookmarked: boolean;
  isCompleted: boolean;
  progress?: number;
};
type UserLibraryProgress = Tables<'user_library_progress'>;

const Library = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('browse');
  const [loading, setLoading] = useState(true);

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLibraryItems();
  }, []);

  const fetchLibraryItems = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch library items from database
      const { data: items, error: itemsError } = await supabase
        .from('library_items')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      // Get current user for progress/bookmarks
      const { data: { user } } = await supabase.auth.getUser();
      
      let userProgress: UserLibraryProgress[] = [];
      if (user) {
        const { data: progressData, error: progressError } = await supabase
          .from('user_library_progress')
          .select('*')
          .eq('user_id', user.id);
        
        if (!progressError) {
          userProgress = progressData || [];
        }
      }

      // Transform data to match interface
      const transformedItems: LibraryItem[] = (items || []).map((item) => {
        const userItemProgress = userProgress.find(p => p.library_item_id === item.id);
        
        return {
          ...item,
          isBookmarked: userItemProgress?.is_bookmarked || false,
          isCompleted: userItemProgress?.is_completed || false,
          progress: userItemProgress?.progress || 0,
        };
      });

      setLibraryItems(transformedItems<dyad-problem-report summary="6 problems">
<problem file="supabase/functions/submit-result/index.ts" line="1" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2.39.6' or its corresponding type declarations.</problem>
<problem file="supabase/functions/chat-completion/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.168.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/chat-completion/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2' or its corresponding type declarations.</problem>
<problem file="supabase/functions/get-realtime-token/index.ts" line="1" column="23" code="2307">Cannot find module 'https://deno.land/std@0.168.0/http/server.ts' or its corresponding type declarations.</problem>
<problem file="supabase/functions/get-realtime-token/index.ts" line="2" column="30" code="2307">Cannot find module 'https://esm.sh/@supabase/supabase-js@2' or its corresponding type declarations.</problem>
<problem file="supabase/functions/realtime-voice-session/index.ts" line="2" column="23" code="2307">Cannot find module 'https://deno.land/std@0.168.0/http/server.ts' or its corresponding type declarations.</problem>
</dyad-problem-report><think>**Troubleshooting Module Errors**

I'm currently dealing with TypeScript errors within Supabase Edge Functions. It appears I'm grappling with a `TS2307` error: the dreaded "cannot find module" issue. The problem seems to stem from URL imports, which complicates things further. I'm focusing on debugging module resolution in this context.


**Isolating the Conflict**

I've isolated the conflict. The issue stems from the main TypeScript compiler, which is unintentionally type-checking the Supabase functions. This is leading to module resolution errors for URL imports, which are valid in Deno but not in the Node.js context. To fix this, I plan to exclude the 'supabase/functions' directory from the main application's `tsconfig.app.json` file. This should prevent the compiler from attempting to process those Deno-specific modules.


**Refining the Exclusion Strategy**

My focus has shifted slightly. I've confirmed the initial diagnosis: the primary compiler is incorrectly parsing Deno-specific code within the Supabase functions directory. The optimal strategy, I believe, lies in refining the exclusion. Simply adding `supabase/functions` to the `exclude` array should resolve all six reported errors, preventing unnecessary type-checking. I've prepared a concise explanation and a code snippet of the modified `tsconfig.app.json` for clarity. This should provide a straightforward and effective solution.


</think>Of course. I can fix these TypeScript errors for you.

The problem is that your application's TypeScript compiler is trying to process the code for your Supabase Edge Functions. Since these functions are designed to run in a Deno environment, they use URL imports (`https://...`) which the Vite/Node.js build process doesn't understand.

The solution is to tell the application's TypeScript configuration to ignore the `supabase/functions` directory. I will update your `tsconfig.app.json` to do just that.

<dyad-write path="tsconfig.app.json" description="Excluding Supabase functions from the TypeScript build.">
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "supabase/functions"]
}