import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ResultCategory } from '@/data/visitor-assessments';
import { 
  Star, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Share2, 
  Download, 
  RotateCcw,
  ArrowRight,
  CheckCircle,
  Clock,
  Award,
  BookOpen,
  Users,
  Heart,
  Sparkles
} from 'lucide-react';

interface VisitorResultsProps {
  assessmentTitle: string;
  assessmentDescription: string;
  result: ResultCategory;
  totalScore: number;
  maxScore: number;
  timeTaken: number; // in seconds
  responses: any[];
  onRetake: () => void;
  onExploreMore: () => void;
}

interface InsightCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export const VisitorResultsDisplay: React.FC<VisitorResultsProps> = ({
  assessmentTitle,
  assessmentDescription,
  result,
  totalScore,
  maxScore,
  timeTaken,
  responses,
  onRetake,
  onExploreMore
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');

  const percentage = Math.round((totalScore / maxScore) * 100);
  const timeInMinutes = Math.round(timeTaken / 60);

  /**
   * Share results
   */
  const handleShare = async () => {
    const shareData = {
      title: `My ${assessmentTitle} Result`,
      text: `I just completed the ${assessmentTitle} and got: ${result.name}. ${result.description}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
          title: 'Shared Successfully',
          description: 'Your results have been shared!',
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast({
          title: 'Copied to Clipboard',
          description: 'Share text copied to clipboard!',
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast({
          title: 'Share Failed',
          description: 'Unable to share results. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  /**
   * Download results as PDF
   */
  const handleDownload = () => {
    // Create a formatted text version for download
    const resultText = `
${assessmentTitle} Results
${'='.repeat(50)}

Your Result: ${result.name}
Score: ${totalScore}/${maxScore} (${percentage}%)
Time Taken: ${timeInMinutes} minutes

Description:
${result.description}

Recommendations:
${result.recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n')}

Assessment Details:
${assessmentDescription}

Generated on: ${new Date().toLocaleDateString()}
    `.trim();

    const blob = new Blob([resultText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${assessmentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_results.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Results Downloaded',
      description: 'Your results have been saved as a text file.',
    });
  };

  /**
   * Get insights based on result
   */
  const getPersonalizedInsights = (): InsightCard[] => {
    const insights: InsightCard[] = [
      {
        title: 'Your Strength',
        description: `Your ${result.name} profile indicates strong capabilities in areas that align with your natural tendencies.`,
        icon: <Star className="w-5 h-5" />,
        color: 'bg-yellow-500'
      },
      {
        title: 'Growth Opportunity',
        description: 'Focus on the recommendations provided to unlock your next level of personal development.',
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'bg-green-500'
      },
      {
        title: 'Action Focus',
        description: 'Start with one recommendation that resonates most with you and build momentum from there.',
        icon: <Target className="w-5 h-5" />,
        color: 'bg-blue-500'
      },
      {
        title: 'Key Insight',
        description: 'Your results suggest you have unique perspectives that can contribute significantly to your personal and professional growth.',
        icon: <Lightbulb className="w-5 h-5" />,
        color: 'bg-purple-500'
      }
    ];

    return insights;
  };

  const insights = getPersonalizedInsights();

  return (
    <div className="space-y-6">
      {/* Result Header */}
      <Card className="text-center bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-6">
          <div className="flex justify-center mb-4">
            <div className={`w-20 h-20 rounded-full ${result.color} flex items-center justify-center text-white shadow-lg`}>
              <Award className="w-10 h-10" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            {result.name}
          </CardTitle>
          <CardDescription className="text-lg text-gray-700 max-w-2xl mx-auto">
            {result.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-blue-600">{totalScore}</div>
              <div className="text-sm text-muted-foreground">Total Score</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">{percentage}%</div>
              <div className="text-sm text-muted-foreground">Percentage</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-600">{timeInMinutes}</div>
              <div className="text-sm text-muted-foreground">Minutes</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">{responses.length}</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="next-steps">Next Steps</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Score Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Your Score</span>
                      <span className="font-semibold">{totalScore} / {maxScore}</span>
                    </div>
                    <Progress value={percentage} className="h-3" />
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>
                      You scored in the <strong>{result.name}</strong> range, which represents 
                      {percentage < 25 ? ' the developing ' : 
                       percentage < 50 ? ' the emerging ' : 
                       percentage < 75 ? ' the proficient ' : ' the advanced '}
                      level for this assessment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assessment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Assessment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assessment</span>
                    <span className="font-medium">{assessmentTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Questions Answered</span>
                    <span className="font-medium">{responses.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time Taken</span>
                    <span className="font-medium">{timeInMinutes} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completion Date</span>
                    <span className="font-medium">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Personalized Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {insights.map((insight, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg ${insight.color} flex items-center justify-center text-white`}>
                      {insight.icon}
                    </div>
                    <h3 className="font-semibold">{insight.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>
                Based on your {result.name} profile, here are specific recommendations for your growth
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 leading-relaxed">{recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  Your Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Based on high-scoring areas */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Natural Tendencies</h4>
                    <p className="text-sm text-green-700">
                      Your responses indicate strong natural abilities in areas that align with your {result.name} profile.
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">Unique Perspective</h4>
                    <p className="text-sm text-blue-700">
                      You bring a distinctive viewpoint that can be valuable in personal and professional settings.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Growth Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700">
                  <TrendingUp className="w-5 h-5" />
                  Growth Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-medium text-orange-800 mb-2">Development Areas</h4>
                    <p className="text-sm text-orange-700">
                      Areas where focused attention and practice can lead to significant personal growth.
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2">Potential Unlocked</h4>
                    <p className="text-sm text-purple-700">
                      With intentional development, you can expand your capabilities in these areas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Detailed Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <h4 className="font-semibold text-gray-900 mb-2">What Your Results Mean</h4>
                  <p className="text-gray-700 leading-relaxed">
                    As someone with a <strong>{result.name}</strong> profile, you demonstrate specific patterns 
                    in how you approach challenges, relationships, and personal growth. This assessment reveals 
                    your natural tendencies and provides a roadmap for continued development.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {Math.round(percentage / 20)} / 5
                    </div>
                    <div className="text-sm text-green-700">Development Level</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {result.recommendations.length}
                    </div>
                    <div className="text-sm text-blue-700">Action Items</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">
                      High
                    </div>
                    <div className="text-sm text-purple-700">Growth Potential</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Next Steps Tab */}
        <TabsContent value="next-steps" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5" />
                Your Next Steps
              </CardTitle>
              <CardDescription>
                Concrete actions you can take to continue your growth journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Immediate Actions */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    This Week (Start Now)
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800">
                        Choose one recommendation that resonates most with you
                      </span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-800">
                        Reflect on how your {result.name} traits show up in daily life
                      </span>
                    </div>
                  </div>
                </div>

                {/* Medium-term Actions */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    This Month (Build Momentum)
                  </h4>
                  <div className="space-y-2">
                    {result.recommendations.slice(0, 2).map((rec, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-gray-600 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-gray-800">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Long-term Vision */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Long-term Vision (3-6 Months)
                  </h4>
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                    <p className="text-purple-800 leading-relaxed">
                      As you continue developing your {result.name} qualities, you'll likely find yourself 
                      more confident in your natural strengths while building capabilities in new areas. 
                      This balanced growth approach will enhance both your personal satisfaction and your 
                      ability to contribute meaningfully to others.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button onClick={handleShare} variant="outline" className="flex-1 sm:flex-none">
          <Share2 className="w-4 h-4 mr-2" />
          Share Results
        </Button>
        <Button onClick={handleDownload} variant="outline" className="flex-1 sm:flex-none">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button onClick={onRetake} variant="outline" className="flex-1 sm:flex-none">
          <RotateCcw className="w-4 h-4 mr-2" />
          Retake Assessment
        </Button>
        <Button onClick={onExploreMore} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-1 sm:flex-none">
          <Sparkles className="w-4 h-4 mr-2" />
          Explore More
        </Button>
      </div>

      {/* Upgrade CTA */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="text-center py-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-2">Ready for Deeper Insights?</h3>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Create a free account to access 20+ comprehensive assessments, track your progress over time, 
            get personalized growth plans, and connect with a supportive community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/auth/register')}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              <Users className="w-5 h-5 mr-2" />
              Create Free Account
            </Button>
            <Button 
              onClick={() => navigate('/auth/login')}
              size="lg"
              variant="outline"
            >
              Sign In
            </Button>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-sm">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-4 h-4" />
              <span>20+ Assessments</span>
            </div>
            <div className="flex items-center gap-2 text-blue-700">
              <TrendingUp className="w-4 h-4" />
              <span>Progress Tracking</span>
            </div>
            <div className="flex items-center gap-2 text-purple-700">
              <Target className="w-4 h-4" />
              <span>Personal Plans</span>
            </div>
            <div className="flex items-center gap-2 text-orange-700">
              <Users className="w-4 h-4" />
              <span>Community Access</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorResultsDisplay;