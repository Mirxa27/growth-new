import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Trash2,
  Edit,
  BarChart2,
  Eye
} from 'lucide-react';

interface Assessment {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'personality' | 'test';
  visibility: 'public' | 'private';
  question_count: number;
  completion_count: number;
  created_at: string;
}

export const AssessmentManager: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAssessments = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assessments' as any)
        .select(`
          *,
          assessment_questions (
            count
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const assessmentsWithCounts = data?.map((assessment: any) => ({
        ...assessment,
        question_count: assessment.assessment_questions?.[0]?.count || 0,
        completion_count: Math.floor(Math.random() * 100) // Mock completion count
      })) || [];

      setAssessments(assessmentsWithCounts as any);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assessments",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleCreate = async () => {
    // This would open a form/modal to create a new assessment
    toast({ title: "Create new assessment clicked" });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('assessments' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAssessments(assessments.filter(a => a.id !== id));
      toast({ title: "Success", description: "Assessment deleted" });
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast({ title: "Error", description: "Failed to delete assessment", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="text-center p-8">Loading assessments...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Assessment Manager</CardTitle>
            <Button onClick={handleCreate}><Plus className="w-4 h-4 mr-2" />Create New</Button>
          </div>
          <CardDescription>Create, edit, and manage all assessments and quizzes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search assessments..." />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {assessments.map(assessment => (
          <Card key={assessment.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{assessment.title}</h3>
                <p className="text-sm text-muted-foreground">{assessment.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{assessment.type}</Badge>
                  <Badge variant={assessment.visibility === 'public' ? 'default' : 'secondary'}>
                    {assessment.visibility}
                  </Badge>
                  <Badge variant="secondary">{assessment.question_count} Questions</Badge>
                  <Badge variant="secondary">{assessment.completion_count} Completions</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm"><BarChart2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(assessment.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};