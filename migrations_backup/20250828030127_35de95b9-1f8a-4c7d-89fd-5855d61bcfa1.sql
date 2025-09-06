-- Fix user_conversations table structure and policies
-- First check the correct column name for the user_conversations table
-- Fix policies based on actual table structure

DROP POLICY IF EXISTS "user_conversations_select_policy" ON public.user_conversations;
DROP POLICY IF EXISTS "user_conversations_insert_policy" ON public.user_conversations;
DROP POLICY IF EXISTS "user_conversation_participants_select_policy" ON public.user_conversation_participants;
DROP POLICY IF EXISTS "user_conversation_participants_insert_policy" ON public.user_conversation_participants;

-- Create proper policies for user_conversations
CREATE POLICY "Users can view conversations they participate in" 
ON public.user_conversations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_conversation_participants 
  WHERE conversation_id = user_conversations.id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can create conversations" 
ON public.user_conversations 
FOR INSERT 
WITH CHECK (true);

-- Create proper policies for user_conversation_participants
CREATE POLICY "Users can view participants of their conversations" 
ON public.user_conversation_participants 
FOR SELECT 
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM user_conversation_participants p2 
  WHERE p2.conversation_id = user_conversation_participants.conversation_id 
  AND p2.user_id = auth.uid()
));

CREATE POLICY "Users can join conversations" 
ON public.user_conversation_participants 
FOR INSERT 
WITH CHECK (user_id = auth.uid());