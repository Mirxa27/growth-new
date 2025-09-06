-- Fix infinite recursion in user_conversation_participants policy
DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.user_conversation_participants;

-- Create proper policies for user_conversation_participants
CREATE POLICY "Users can view their own participation" 
ON public.user_conversation_participants 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own participation" 
ON public.user_conversation_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" 
ON public.user_conversation_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own participation" 
ON public.user_conversation_participants 
FOR DELETE 
USING (auth.uid() = user_id);

-- Also fix user_conversations policies to avoid recursion
DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.user_conversations;

CREATE POLICY "Users can view their own conversations" 
ON public.user_conversations 
FOR SELECT 
USING (auth.uid() = created_by);

CREATE POLICY "Users can create conversations" 
ON public.user_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own conversations" 
ON public.user_conversations 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own conversations" 
ON public.user_conversations 
FOR DELETE 
USING (auth.uid() = created_by);