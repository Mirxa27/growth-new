import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Clock,
  ArrowLeft
} from 'lucide-react';
import { Assessment } from '@/data/assessments';

interface FreeAssessmentTakerProps {
  assessment: Assessment;
  onComplete: (results: any) => void;
  onBack: () => void;
}

interface QuestionAnswer {
  questionId: string;
  answer: any;
  questionText: string;
  questionType: string;
}

export const FreeAssessmentTaker: React.FC<FreeAssessmentTakerProps> = ({
  assessment,
  onComplete,
  onBack
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime] = useState(new Date());

  const questions = assessment.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = (questionId: string, answer: any) => {
    const existingAnswerIndex = answers.findIndex(a => a.questionId === questionId);
    const answerData: QuestionAnswer = {
      questionId,
      answer,
      questionText: currentQuestion.text,
      questionType: currentQuestion.type
    };

    if (existingAnswerIndex >= 0) {
      const newAnswers = [...answers];
      newAnswers[existingAnswerIndex] = answerData;
      setAnswers(newAnswers);
    } else {
      setAnswers([...answers, answerData]);
    }
  };

  const getCurrentAnswer = (questionId: string) => {
    const answer = answers.find(a => a.questionId === questionId);
    return answer?.answer;
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateResults = () => {
    const results: any = {
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      totalQuestions: questions.length,
      answeredQuestions: answers.length,
      completionTime: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
      answers: answers,
      scores: {},
      insights: [],
      recommendations: []
    };

    // Calculate scores based on assessment type
    switch (assessment.type) {
      case 'personality':
        results.scores = calculatePersonalityScores(answers);
        break;
      case 'mental-health':
        results.scores = calculateMentalHealthScores(answers);
        break;
      case 'stress':
        results.scores = calculateStressScores(answers);
        break;
      case 'career':
        results.scores = calculateCareerScores(answers);
        break;
      case 'relationships':
        results.scores = calculateRelationshipScores(answers);
        break;
      case 'skills':
        results.scores = calculateSkillsScores(answers);
        break;
      default:
        results.scores = calculateDefaultScores(answers);
    }

    // Generate insights based on scores
    results.insights = generateInsights(results.scores, assessment.type);
    results.recommendations = generateRecommendations(assessment.type);

    return results;
  };

  const calculatePersonalityScores = (answers: QuestionAnswer[]) => {
    const traits = {
      extroversion: 0,
      agreeableness: 0,
      conscientiousness: 0,
      neuroticism: 0,
      openness: 0
    };

    answers.forEach(answer => {
      const value = parseInt(answer.answer) || 0;
      if (answer.questionText.toLowerCase().includes('social') || answer.questionText.toLowerCase().includes('party')) {
        traits.extroversion += value;
      } else if (answer.questionText.toLowerCase().includes('organized') || answer.questionText.toLowerCase().includes('plan')) {
        traits.conscientiousness += value;
      } else if (answer.questionText.toLowerCase().includes('anxious') || answer.questionText.toLowerCase().includes('worry')) {
        traits.neuroticism += value;
      } else if (answer.questionText.toLowerCase().includes('creative') || answer.questionText.toLowerCase().includes('art')) {
        traits.openness += value;
      } else if (answer.questionText.toLowerCase().includes('cooperative') || answer.questionText.toLowerCase().includes('help')) {
        traits.agreeableness += value;
      }
    });

    return traits;
  };

  const calculateMentalHealthScores = (answers: QuestionAnswer[]) => {
    let totalScore = 0;
    answers.forEach(answer => {
      const value = parseInt(answer.answer) || 0;
      totalScore += value;
    });

    return {
      overallScore: totalScore,
      level: totalScore <= 15 ? 'low' : totalScore <= 30 ? 'moderate' : 'high',
      wellbeing: totalScore <= 15 ? 'good' : totalScore <= 30 ? 'fair' : 'needs attention'
    };
  };

  const calculateStressScores = (answers: QuestionAnswer[]) => {
    let stressLevel = 0;
    answers.forEach(answer => {
      const value = parseInt(answer.answer) || 0;
      stressLevel += value;
    });

    return {
      stressLevel,
      category: stressLevel <= 10 ? 'low' : stressLevel <= 20 ? 'moderate' : 'high',
      description: stressLevel <= 10 ? 'Well managed' : stressLevel <= 20 ? 'Moderate stress' : 'High stress'
    };
  };

  const calculateCareerScores = (answers: QuestionAnswer[]) => {
    const interests = {
      analytical: 0,
      creative: 0,
      social: 0,
      enterprising: 0,
      conventional: 0
    };

    answers.forEach(answer => {
      const value = parseInt(answer.answer) || 0;
      if (answer.questionText.toLowerCase().includes('problem') || answer.questionText.toLowerCase().includes('analyze')) {
        interests.analytical += value;
      } else if (answer.questionText.toLowerCase().includes('creative') || answer.questionText.toLowerCase().includes('design')) {
        interests.creative += value;
      } else if (answer.questionText.toLowerCase().includes('helping') || answer.questionText.toLowerCase().includes('teach')) {
        interests.social += value;
      } else if (answer.questionText.toLowerCase().includes('leading') || answer.questionText.toLowerCase().includes('manage')) {
        interests.enterprising += value;
      } else if (answer.questionText.toLowerCase().includes('organized') || answer.questionText.toLowerCase().includes('detail')) {
        interests.conventional += value;
      }
    });

    return interests;
  };

  const calculateRelationshipScores = (answers: QuestionAnswer[]) => {
    const aspects = {
      communication: 0,
      trust: 0,
      intimacy: 0,
      conflict: 0,
      support: 0
    };

    answers.forEach(answer => {
      const value = parseInt(answer.answer) || 0;
      if (answer.questionText.toLowerCase().includes('communicate') || answer.questionText.toLowerCase().includes('talk')) {
        aspects.communication += value;
      } else if (answer.questionText.toLowerCase().includes('trust') || answer.questionText.toLowerCase().includes('honest')) {
        aspects.trust += value;
      } else if (answer.questionText.toLowerCase().includes('close') || answer.questionText.toLowerCase().includes('intimate')) {
        aspects.intimacy += value;
      } else if (answer.questionText.toLowerCase().includes('argue') || answer.questionText.toLowerCase().includes('fight')) {
        aspects.conflict += value;
      } else if (answer.questionText.toLowerCase().includes('support') || answer.questionText.toLowerCase().includes('help')) {
        aspects.support += value;
      }
    });

    return aspects;
  };

  const calculateSkillsScores = (answers: QuestionAnswer[]) => {
    const skills = {
      leadership: 0,
      creativity: 0,
      problemSolving: 0,
      communication: 0,
      adaptability: 0
    };

    answers.forEach(answer => {
      const value = parseInt(answer.answer) || 0;
      if (answer.questionText.toLowerCase().includes('lead') || answer.questionText.toLowerCase().includes('manage')) {
        skills.leadership += value;
      } else if (answer.questionText.toLowerCase().includes('creative') || answer.questionText.toLowerCase().includes('innovate')) {
        skills.creativity += value;
      } else if (answer.questionText.toLowerCase().includes('problem') || answer.questionText.toLowerCase().includes('solution')) {
        skills.problemSolving += value;
      } else if (answer.questionText.toLowerCase().includes('communicate') || answer.questionText.toLowerCase().includes('present')) {
        skills.communication += value;
      } else if (answer.questionText.toLowerCase().includes('adapt') || answer.questionText.toLowerCase().includes('change')) {
        skills.adaptability += value;
      }
    });

    return skills;
  };

  const calculateDefaultScores = (answers: QuestionAnswer[]) => {
    return {
      totalScore: answers.length,
      completionRate: (answers.length / questions.length) * 100,
      averageResponse: answers.reduce((sum, ans) => sum + (parseInt(ans.answer) || 0), 0) / answers.length
    };
  };

  const generateInsights = (scores: any, type: string) => {
    const insights = [];
    
    switch (type) {
      case 'personality':
        const highestTrait = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        insights.push(`Your strongest personality trait is ${highestTrait} (${scores[highestTrait]} points)`);
        insights.push(`Your personality suggests ${scores.extroversion > 15 ? 'you thrive in social situations' : 'you prefer meaningful one-on-one interactions'}`);
        insights.push(`You show ${scores.conscientiousness > 15 ? 'high levels of organization and planning' : 'a more spontaneous and flexible approach'}`);
        break;
      
      case 'mental-health':
        insights.push(`Your mental health score indicates ${scores.level} levels of distress`);
        insights.push(`This suggests your overall wellbeing is ${scores.wellbeing}`);
        insights.push(scores.level === 'low' ? 'Keep up the good mental health practices!' : 'Consider implementing some stress-reduction techniques');
        break;
      
      case 'stress':
        insights.push(`Your stress level is ${scores.category} (${scores.stressLevel} points)`);
        insights.push(`This indicates ${scores.description.toLowerCase()}`);
        insights.push(scores.category === 'low' ? 'Your stress management techniques appear effective' : 'You may benefit from additional stress-reduction strategies');
        break;
      
      case 'career':
        const topCareer = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        insights.push(`Your strongest career interest is ${topCareer} (${scores[topCareer]} points)`);
        insights.push(`This suggests careers in ${topCareer} fields may be particularly fulfilling for you`);
        insights.push(`Consider exploring roles that leverage your ${topCareer} strengths`);
        break;
      
      case 'relationships':
        const strongestAspect = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        insights.push(`Your strongest relationship aspect is ${strongestAspect} (${scores[strongestAspect]} points)`);
        insights.push(`This indicates ${strongestAspect} plays a key role in your relationships`);
        insights.push(`Focus on maintaining strong ${strongestAspect} while working on areas needing improvement`);
        break;
      
      case 'skills':
        const topSkill = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        insights.push(`Your strongest skill is ${topSkill} (${scores[topSkill]} points)`);
        insights.push(`This skill could be valuable in both professional and personal contexts`);
        insights.push(`Consider how you can further develop and apply your ${topSkill} abilities`);
        break;
      
      default:
        insights.push('Thank you for completing this assessment');
        insights.push('Use these insights to guide your personal growth journey');
    }

    return insights;
  };

  const generateRecommendations = (type: string) => {
    const recommendations = [];
    
    switch (type) {
      case 'personality':
        recommendations.push('Reflect on how your personality traits influence your daily interactions');
        recommendations.push('Consider careers that align with your personality strengths');
        recommendations.push('Practice self-awareness in social and professional situations');
        break;
      
      case 'mental-health':
        recommendations.push('Practice daily mindfulness or meditation for 10 minutes');
        recommendations.push('Consider journaling to track your emotional patterns');
        recommendations.push('Maintain regular sleep schedule and physical exercise');
        recommendations.push('Connect with supportive friends or family members regularly');
        break;
      
      case 'stress':
        recommendations.push('Try deep breathing exercises when feeling stressed');
        recommendations.push('Establish healthy boundaries in work and relationships');
        recommendations.push('Engage in regular physical activity like walking or yoga');
        recommendations.push('Practice progressive muscle relaxation techniques');
        break;
      
      case 'career':
        recommendations.push('Research careers that align with your top interests');
        recommendations.push('Take additional career assessments for more detailed insights');
        recommendations.push('Talk to professionals in fields that interest you');
        recommendations.push('Consider internships or volunteer opportunities to test different paths');
        break;
      
      case 'relationships':
        recommendations.push('Practice active listening in your conversations');
        recommendations.push('Express appreciation to important people in your life');
        recommendations.push('Schedule regular quality time with loved ones');
        recommendations.push('Consider couples or family counseling if needed');
        break;
      
      case 'skills':
        recommendations.push('Set specific goals to develop your strongest skills further');
        recommendations.push('Seek feedback from mentors or colleagues on your skill development');
        recommendations.push('Take online courses or workshops to enhance your abilities');
        recommendations.push('Look for opportunities to apply your skills in new contexts');
        break;
      
      default:
        recommendations.push('Reflect on your responses and consider next steps');
        recommendations.push('Share your results with trusted friends or mentors');
        recommendations.push('Set specific goals based on your insights');
    }

    return recommendations;
  };

  const handleSubmit = async () => {
    if (answers.length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build payload expected by the submit-result Edge Function
      const payload = {
        assessment_id: assessment.id,
        answers: answers.map(a => ({
          question_id: a.questionId,
          value: a.answer
        })),
        time_taken_seconds: Math.floor((new Date().getTime() - startTime.getTime()) / 1000),
        meta: {
          source: 'web-free-assessment'
        }
      };

      // Prefer using Supabase Functions client; fallback to fetch if unavailable
      let responseData: any = null;
      try {
        // supabase.functions.invoke returns { data, error } in the client library
        // Use invoke to call the Edge Function named "submit-result"
        // @ts-ignore - functions might not be typed in all environments
        const fn = (supabase as any).functions?.invoke
          ? await (supabase as any).functions.invoke('submit-result', { body: JSON.stringify(payload) })
          : null;

        if (fn && fn.data) {
          responseData = typeof fn.data === 'string' ? JSON.parse(fn.data) : fn.data;
        } else if (fn && fn.error) {
          throw fn.error;
        } else {
          // Fallback: call the direct Supabase Functions URL
          const SUPABASE_URL = (supabase as any).url || '';
          const SUPABASE_KEY = (supabase as any).anonKey || '';
          const resp = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/submit-result`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: SUPABASE_KEY
            },
            body: JSON.stringify(payload)
          });
          if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`Function call failed: ${resp.status} ${text}`);
          }
          responseData = await resp.json();
        }
      } catch (fnErr) {
        console.error('Function invocation failed, attempting direct DB insert as fallback:', fnErr);
        // Fallback: compute locally and save for authenticated users (best-effort)
        const localResults = calculateResults();
        if ((supabase as any) && (assessment.visibility !== 'public')) {
          // Try to persist via recommended insert if user is authenticated (not guaranteed)
          try {
            const insertPayload: any = {
              assessment_id: assessment.id,
              assessment_results: localResults,
              score_total: localResults.scores?.totalScore ?? 0
            };
            // Only attempt insert if user object available via supabase.auth
            // @ts-ignore
            const { data: authUser } = await (supabase as any).auth.getUser();
            if (authUser?.user?.id) {
              await (supabase as any).from('assessment_results').insert({
                ...insertPayload,
                user_id: authUser.user.id
              });
            }
          } catch (insertErr) {
            console.warn('Fallback insert failed:', insertErr);
          }
        }
        // Use local results as response
        responseData = { success: true, generated: localResults, fallback: true };
      }

      // Normalize and pass to onComplete
      onComplete(responseData);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit assessment. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const currentAnswer = getCurrentAnswer(currentQuestion.id);

    return (
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span className="text-sm text-gray-500 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {assessment.estimatedTime} min
            </span>
          </div>
          <CardTitle className="text-lg leading-tight">{currentQuestion.text}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentQuestion.type === 'single' && (
            <RadioGroup 
              value={currentAnswer || ''} 
              onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
            >
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 mb-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.type === 'multiple' && (
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <Checkbox
                    id={`multi-${index}`}
                    checked={currentAnswer?.includes(option) || false}
                    onCheckedChange={(checked) => {
                      const currentAnswers = currentAnswer || [];
                      const newAnswers = checked
                        ? [...currentAnswers, option]
                        : currentAnswers.filter((a: string) => a !== option);
                      handleAnswer(currentQuestion.id, newAnswers);
                    }}
                  />
                  <Label htmlFor={`multi-${index}`} className="cursor-pointer text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {currentQuestion.type === 'scale' && (
            <div className="space-y-4">
              <Slider
                value={[currentAnswer || 3]}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value[0])}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500">
                <span>Strongly Disagree</span>
                <span>Neutral</span>
                <span>Strongly Agree</span>
              </div>
              <div className="text-center">
                <span className="text-lg font-semibold">{currentAnswer || 3}</span>
              </div>
            </div>
          )}

          {currentQuestion.type === 'text' && (
            <Textarea
              value={currentAnswer || ''}
              onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full text-sm"
            />
          )}
        </CardContent>
      </Card>
    );
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="text-destructive text-lg mb-2">No Questions Found</div>
            <p className="text-gray-600 mb-4">This assessment doesn't have any questions yet.</p>
            <Button variant="outline" onClick={onBack}>
              Back to Assessments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Hub
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold">{assessment.title}</h1>
            <p className="text-gray-600 text-sm">{assessment.description}</p>
          </div>
          <div className="w-24"></div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>{currentQuestionIndex + 1} / {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Question */}
        {renderQuestion()}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !getCurrentAnswer(currentQuestion.id)}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin">⟳</div>
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Complete Assessment
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!getCurrentAnswer(currentQuestion.id)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};