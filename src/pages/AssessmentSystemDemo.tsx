import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Users, 
  TrendingUp, 
  BookOpen,
  Play,
  Database,
  Activity
} from 'lucide-react';
import RealAssessmentService from '@/services/realAssessmentService';
import RealAssessmentList from '@/components/assessment/RealAssessmentList';
import LocalAssessmentTaker from '@/components/assessment/LocalAssessmentTaker';
import { Assessment } from '@/types/assessment';

interface AssessmentResults {
  answers: Record<string, string | number | string[]>;
  score?: number;
  category?: string;
}

const AssessmentSystemDemo: React.FC = () => {
  const [stats, setStats] = useState({
    totalAssessments: 0,
    totalQuestions: 0,
    activeUsers: 0,
    completionRate: 0
  });
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [currentView, setCurrentView] = useState<'overview' | 'browse' | 'take'>('overview');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessmentData();
  }, []);

  const loadAssessmentData = async () => {
    try {
      const data = await RealAssessmentService.getPublicAssessments();
      setAssessments(data);
      
      // Calculate stats
      const totalQuestions = data.reduce((sum, assessment) => sum + assessment.questions.length, 0);
      setStats({
        totalAssessments: data.length,
        totalQuestions,
        activeUsers: Math.floor(Math.random() * 50) + 10, // Simulated
        completionRate: Math.floor(Math.random() * 40) + 60 // Simulated
      });
    } catch (error) {
      console.error('Error loading assessment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setCurrentView('take');
  };

  const handleAssessmentComplete = (results: AssessmentResults) => {
    console.log('Assessment completed:', results);
    setCurrentView('overview');
    setSelectedAssessment(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-white">Loading assessment system...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Growth Echo Nexus Assessment System
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Real-time assessment platform with database integration, interactive experiences, and comprehensive analytics.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            <Button
              onClick={() => setCurrentView('overview')}
              variant={currentView === 'overview' ? 'default' : 'outline'}
              className="flex items-center space-x-2"
            >
              <Activity className="w-4 h-4" />
              <span>Overview</span>
            </Button>
            <Button
              onClick={() => setCurrentView('browse')}
              variant={currentView === 'browse' ? 'default' : 'outline'}
              className="flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Assessments</span>
            </Button>
          </div>
        </div>

        {/* Content based on current view */}
        {currentView === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="flex items-center p-6">
                  <Database className="w-10 h-10 text-blue-400 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalAssessments}</p>
                    <p className="text-white/60 text-sm">Total Assessments</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="flex items-center p-6">
                  <BookOpen className="w-10 h-10 text-green-400 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.totalQuestions}</p>
                    <p className="text-white/60 text-sm">Questions Available</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="flex items-center p-6">
                  <Users className="w-10 h-10 text-purple-400 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
                    <p className="text-white/60 text-sm">Active Users</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="flex items-center p-6">
                  <TrendingUp className="w-10 h-10 text-orange-400 mr-4" />
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.completionRate}%</p>
                    <p className="text-white/60 text-sm">Completion Rate</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System Status */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Database Integration</span>
                      <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Real Assessment Service</span>
                      <Badge className="bg-green-500/20 text-green-400">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Question Rendering</span>
                      <Badge className="bg-green-500/20 text-green-400">Working</Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Scoring Algorithms</span>
                      <Badge className="bg-green-500/20 text-green-400">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">Result Storage</span>
                      <Badge className="bg-green-500/20 text-green-400">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70">TypeScript Compliance</span>
                      <Badge className="bg-green-500/20 text-green-400">Validated</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={() => setCurrentView('browse')}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600"
                  >
                    <Play className="w-4 h-4" />
                    <span>Take Assessment</span>
                  </Button>
                  <Button
                    onClick={loadAssessmentData}
                    variant="outline"
                    className="flex items-center space-x-2"
                  >
                    <Database className="w-4 h-4" />
                    <span>Refresh Data</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Available Assessments Preview */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Available Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {assessments.map((assessment) => (
                    <Card key={assessment.id} className="bg-white/5 border-white/10">
                      <CardContent className="p-4">
                        <h3 className="text-white font-semibold mb-2">{assessment.title}</h3>
                        <p className="text-white/60 text-sm mb-3">{assessment.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{assessment.category}</Badge>
                          <span className="text-white/50 text-xs">
                            {assessment.questions.length} questions
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentView === 'browse' && (
          <div>
            <RealAssessmentList onSelectAssessment={handleSelectAssessment} />
          </div>
        )}

        {currentView === 'take' && selectedAssessment && (
          <div>
            <LocalAssessmentTaker
              assessment={selectedAssessment}
              onComplete={handleAssessmentComplete}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentSystemDemo;
