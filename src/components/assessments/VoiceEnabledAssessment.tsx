import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { realtimeService, RealtimeConfig } from '@/services/ai/realtime.service';
import { realtimeTranscriptionService } from '@/services/ai/realtime-transcription.service';
import { AnonymousAssessment, AssessmentQuestion, Assessment } from './AnonymousAssessment';
import VoiceAgent from '../voice/VoiceAgent';
import TranscriptionPanel from '../voice/TranscriptionPanel';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  FileText,
  Play,
  Pause,
  Square,
  Bot,
  User,
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';

interface VoiceResponse {
  questionId: string;
  audioUrl?: string;
  transcription?: string;
  confidence?: number;
  duration?: number;
  timestamp: Date;
}

interface VoiceEnabledAssessmentProps {
  assessment: Assessment;
  onComplete: (responses: any[]) => void;
  onBack?: () => void;
  enableVoiceQuestions?: boolean;
  enableVoiceResponses?: boolean;
  voiceConfig?: Partial<RealtimeConfig>;
}

export const VoiceEnabledAssessment: React.FC<VoiceEnabledAssessmentProps> = ({
  assessment,
  onComplete,
  onBack,
  enableVoiceQuestions = true,
  enableVoiceResponses = true,
  voiceConfig = {}
}) => {
  const { toast } = useToast();
  const [currentMode, setCurrentMode] = useState<'traditional' | 'voice' | 'hybrid'>('traditional');
  const [voiceResponses, setVoiceResponses] = useState<Map<string, VoiceResponse>>(new Map());
  const [isVoiceSessionActive, setIsVoiceSessionActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [voiceInstructions, setVoiceInstructions] = useState<string>('');

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const sessionIdRef = useRef<string | null>(null);

  /**
   * Initialize voice instructions based on assessment
   */
  useEffect(() => {
    const instructions = `You are helping a user complete an assessment called "${assessment.title}". 
    ${assessment.description ? `The assessment is about: ${assessment.description}` : ''}
    
    Your role is to:
    1. Read questions aloud clearly and naturally
    2. Help the user understand what's being asked
    3. Listen to their responses and provide encouragement
    4. Guide them through the assessment process
    5. Be supportive and non-judgmental
    
    Current question: "${currentQuestion.question_text}"
    ${currentQuestion.hint ? `Hint: ${currentQuestion.hint}` : ''}
    
    Please read this question to the user and wait for their response.`;
    
    setVoiceInstructions(instructions);
  }, [assessment, currentQuestion]);

  /**
   * Handle voice session start
   */
  const handleVoiceSessionStart = useCallback((sessionId: string) => {
    sessionIdRef.current = sessionId;
    setIsVoiceSessionActive(true);
    
    toast({
      title: 'Voice Session Started',
      description: 'Your AI assistant is ready to help with the assessment',
    });

    // Send initial instructions to read the current question
    setTimeout(async () => {
      if (sessionIdRef.current) {
        try {
          await realtimeService.sendMessage(
            sessionIdRef.current, 
            `Please read the current question to the user: "${currentQuestion.question_text}"`
          );
        } catch (error) {
          console.error('Failed to send initial question:', error);
        }
      }
    }, 2000);
  }, [currentQuestion, toast]);

  /**
   * Handle voice session end
   */
  const handleVoiceSessionEnd = useCallback((sessionId: string) => {
    sessionIdRef.current = null;
    setIsVoiceSessionActive(false);
    
    toast({
      title: 'Voice Session Ended',
      description: 'Voice assistance has been disabled',
    });
  }, [toast]);

  /**
   * Handle voice message from user or assistant
   */
  const handleVoiceMessage = useCallback((message: string, type: 'user' | 'assistant') => {
    if (type === 'user' && currentQuestion) {
      // Store user's voice response
      const voiceResponse: VoiceResponse = {
        questionId: currentQuestion.id,
        transcription: message,
        confidence: 0.9, // This would come from actual transcription
        timestamp: new Date(),
      };

      setVoiceResponses(prev => new Map(prev.set(currentQuestion.id, voiceResponse)));

      toast({
        title: 'Voice Response Recorded',
        description: 'Your response has been captured',
      });
    }
  }, [currentQuestion, toast]);

  /**
   * Handle voice transcription
   */
  const handleVoiceTranscript = useCallback((transcript: string, type: 'user' | 'assistant') => {
    if (type === 'user' && transcript.trim()) {
      handleVoiceMessage(transcript, 'user');
    }
  }, [handleVoiceMessage]);

  /**
   * Navigate to next question with voice support
   */
  const handleNextQuestion = useCallback(async () => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < assessment.questions.length) {
      setCurrentQuestionIndex(nextIndex);
      const nextQuestion = assessment.questions[nextIndex];
      
      // Update voice instructions for new question
      const newInstructions = `Now moving to question ${nextIndex + 1} of ${assessment.questions.length}.
      Question: "${nextQuestion.question_text}"
      ${nextQuestion.hint ? `Hint: ${nextQuestion.hint}` : ''}
      
      Please read this question to the user and wait for their response.`;
      
      setVoiceInstructions(newInstructions);
      
      // If voice session is active, have the assistant read the new question
      if (isVoiceSessionActive && sessionIdRef.current) {
        try {
          await realtimeService.sendMessage(
            sessionIdRef.current,
            `Please read the next question: "${nextQuestion.question_text}"`
          );
        } catch (error) {
          console.error('Failed to send next question:', error);
        }
      }
    } else {
      // Assessment complete
      handleAssessmentComplete();
    }
  }, [currentQuestionIndex, assessment.questions, isVoiceSessionActive, voiceInstructions]);

  /**
   * Navigate to previous question with voice support
   */
  const handlePreviousQuestion = useCallback(async () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      const prevQuestion = assessment.questions[prevIndex];
      
      // Update voice instructions
      const newInstructions = `Going back to question ${prevIndex + 1} of ${assessment.questions.length}.
      Question: "${prevQuestion.question_text}"
      ${prevQuestion.hint ? `Hint: ${prevQuestion.hint}` : ''}`;
      
      setVoiceInstructions(newInstructions);
      
      // If voice session is active, have the assistant read the previous question
      if (isVoiceSessionActive && sessionIdRef.current) {
        try {
          await realtimeService.sendMessage(
            sessionIdRef.current,
            `Going back to the previous question: "${prevQuestion.question_text}"`
          );
        } catch (error) {
          console.error('Failed to send previous question:', error);
        }
      }
    }
  }, [currentQuestionIndex, assessment.questions, isVoiceSessionActive]);

  /**
   * Handle assessment completion
   */
  const handleAssessmentComplete = useCallback(() => {
    // Combine traditional responses with voice responses
    const allResponses: any[] = [];
    
    // Add voice responses
    voiceResponses.forEach((voiceResponse, questionId) => {
      allResponses.push({
        question_id: questionId,
        response_type: 'voice',
        response_value: voiceResponse.transcription,
        audio_url: voiceResponse.audioUrl,
        confidence: voiceResponse.confidence,
        time_taken: voiceResponse.duration || 0,
        metadata: {
          mode: 'voice',
          timestamp: voiceResponse.timestamp.toISOString(),
        }
      });
    });

    onComplete(allResponses);

    if (isVoiceSessionActive && sessionIdRef.current) {
      realtimeService.sendMessage(
        sessionIdRef.current,
        'Great job! You have completed the assessment. Thank you for your participation.'
      );
    }
  }, [voiceResponses, onComplete, isVoiceSessionActive]);

  /**
   * Check if current question has a response
   */
  const hasCurrentResponse = useCallback(() => {
    return voiceResponses.has(currentQuestion.id);
  }, [voiceResponses, currentQuestion]);

  /**
   * Get progress percentage
   */
  const getProgress = useCallback(() => {
    return ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  }, [currentQuestionIndex, assessment.questions.length]);

  /**
   * Render question content based on type
   */
  const renderQuestionContent = () => {
    if (!currentQuestion) return null;

    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Question {currentQuestionIndex + 1} of {assessment.questions.length}
          </h3>
          <p className="text-blue-800">{currentQuestion.question_text}</p>
          
          {currentQuestion.hint && (
            <div className="mt-3 p-2 bg-blue-100 rounded text-sm text-blue-700">
              <strong>Hint:</strong> {currentQuestion.hint}
            </div>
          )}
        </div>

        {/* Voice Response Indicator */}
        {hasCurrentResponse() && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Voice Response Recorded</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              "{voiceResponses.get(currentQuestion.id)?.transcription}"
            </p>
          </div>
        )}

        {/* Question Media */}
        {currentQuestion.media_url && (
          <div className="space-y-2">
            {currentQuestion.media_type === 'image' && (
              <img 
                src={currentQuestion.media_url} 
                alt={currentQuestion.media_caption || 'Question image'}
                className="max-w-full h-64 object-cover rounded border"
              />
            )}
            {currentQuestion.media_type === 'audio' && (
              <audio controls src={currentQuestion.media_url} className="w-full" />
            )}
            {currentQuestion.media_caption && (
              <p className="text-sm text-muted-foreground italic">
                {currentQuestion.media_caption}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Assessment Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {assessment.title}
            </span>
            <Badge variant="outline" className="bg-blue-500 text-white">
              Voice Enabled
            </Badge>
          </CardTitle>
          <CardDescription>
            {assessment.description}
          </CardDescription>
          
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(getProgress())}%</span>
            </div>
            <Progress value={getProgress()} />
          </div>
        </CardHeader>
      </Card>

      {/* Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assessment Mode</CardTitle>
          <CardDescription>
            Choose how you'd like to complete this assessment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentMode} onValueChange={(value: any) => setCurrentMode(value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="traditional">Traditional</TabsTrigger>
              <TabsTrigger value="voice">Voice Only</TabsTrigger>
              <TabsTrigger value="hybrid">Hybrid</TabsTrigger>
            </TabsList>

            {/* Traditional Mode */}
            <TabsContent value="traditional" className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Traditional Assessment</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete the assessment using the standard text-based interface
                </p>
                
                <AnonymousAssessment
                  assessment={assessment}
                  onComplete={onComplete}
                  onBack={onBack}
                />
              </div>
            </TabsContent>

            {/* Voice Only Mode */}
            <TabsContent value="voice" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Question Display */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Question</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderQuestionContent()}
                    
                    {/* Navigation */}
                    <div className="flex justify-between pt-6">
                      <Button
                        variant="outline"
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                      >
                        Previous
                      </Button>

                      <Button
                        onClick={handleNextQuestion}
                        disabled={!hasCurrentResponse()}
                      >
                        {currentQuestionIndex === assessment.questions.length - 1 ? 'Complete' : 'Next'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Voice Assistant */}
                <VoiceAgent
                  config={{
                    ...voiceConfig,
                    instructions: voiceInstructions,
                    enableTranscription: true,
                  }}
                  onSessionStart={handleVoiceSessionStart}
                  onSessionEnd={handleVoiceSessionEnd}
                  onMessage={handleVoiceMessage}
                  onTranscript={handleVoiceTranscript}
                />
              </div>
            </TabsContent>

            {/* Hybrid Mode */}
            <TabsContent value="hybrid" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Traditional Assessment */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Assessment Questions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AnonymousAssessment
                        assessment={assessment}
                        onComplete={onComplete}
                        onBack={onBack}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Voice Support */}
                <div className="space-y-4">
                  <VoiceAgent
                    config={{
                      ...voiceConfig,
                      instructions: `You are assisting with an assessment. Help the user understand questions and provide encouragement. Current question: "${currentQuestion.question_text}"`,
                      enableTranscription: false, // Don't interfere with traditional responses
                    }}
                    onSessionStart={handleVoiceSessionStart}
                    onSessionEnd={handleVoiceSessionEnd}
                    className="h-80"
                  />

                  <TranscriptionPanel
                    config={{
                      language: 'en',
                      enable_word_timestamps: true,
                    }}
                    onTranscriptionComplete={(result) => {
                      // Optional: use transcription for notes or additional context
                      console.log('Transcription completed:', result);
                    }}
                    className="h-80"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Voice Responses Summary */}
      {voiceResponses.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Voice Responses ({voiceResponses.size})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(voiceResponses.entries()).map(([questionId, response], index) => (
                <div key={questionId} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">Question {index + 1}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        "{response.transcription}"
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{response.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                  {response.confidence && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Confidence: {Math.round(response.confidence * 100)}%
                        </span>
                        <Progress value={response.confidence * 100} className="h-1 flex-1" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceEnabledAssessment;