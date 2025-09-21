import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Camera, 
  Mic, 
  Play, 
  Pause, 
  Square,
  Upload,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Share2
} from 'lucide-react';
// Dynamic imports for Capacitor to avoid build issues on web
let Capacitor: any;
let CapCamera: any;

// Initialize Capacitor modules dynamically
const initializeCapacitorModules = async () => {
  try {
    const capacitorCore = await import('@capacitor/core');
    Capacitor = capacitorCore.Capacitor;
    
    if (Capacitor.isNativePlatform()) {
      const cameraModule = await import('@capacitor/camera');
      CapCamera = cameraModule.Camera;
    }
    
    return true;
  } catch (error) {
    console.warn('Capacitor modules not available, running in web mode', error);
    return false;
  }
};

import { logger } from '@/utils/logger';

export interface AssessmentQuestion {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'image_upload' | 'audio_response' | 'scale';
  order_index: number;
  points: number;
  time_limit?: number;
  hint?: string;
  media_url?: string;
  media_type?: string;
  media_caption?: string;
  options?: {
    id: string;
    option_text: string;
    order_index: number;
    media_url?: string;
  }[];
}

export interface Assessment {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructions?: string;
  type: string;
  difficulty: string;
  estimated_time: number;
  passing_score: number;
  questions: AssessmentQuestion[];
}

interface AnonymousAssessmentProps {
  assessment: Assessment;
  onComplete: (results: any) => void;
  onBack?: () => void;
}

interface QuestionResponse {
  questionId: string;
  response_text?: string;
  selected_option_ids?: string[];
  response_value?: any;
  media_url?: string;
  time_taken: number;
}

export const AnonymousAssessment: React.FC<AnonymousAssessmentProps> = ({
  assessment,
  onComplete,
  onBack
}) => {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [capacitorInitialized, setCapacitorInitialized] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === assessment.questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;

  // Initialize Capacitor modules on component mount
  useEffect(() => {
    initializeCapacitorModules().then((initialized) => {
      setCapacitorInitialized(initialized);
    });
  }, []);

  useEffect(() => {
    initializeAttempt();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reset question timer when question changes
    setQuestionStartTime(new Date());
    
    // Set up question time limit if applicable
    if (currentQuestion?.time_limit) {
      setTimeRemaining(currentQuestion.time_limit);
      
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev && prev <= 1) {
            // Time's up - auto-advance
            handleNextQuestion();
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);
    } else {
      setTimeRemaining(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuestionIndex]);

  const initializeAttempt = async () => {
    try {
      const visitorSessionId = generateVisitorSessionId();
      const deviceFingerprint = await generateDeviceFingerprint();
      
      const { data, error } = await supabase.rpc('start_assessment_attempt', {
        p_assessment_id: assessment.id,
        p_visitor_session_id: visitorSessionId,
        p_device_fingerprint: deviceFingerprint,
        p_ip_address: null // Will be set by server
      });

      if (error) throw error;
      
      setAttemptId(data);
      logger.info('Assessment attempt started', { attemptId: data, assessmentId: assessment.id });
    } catch (error) {
      logger.error('Failed to start assessment attempt', 'AnonymousAssessment', error);
      toast({
        title: 'Error',
        description: 'Failed to start assessment. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const generateVisitorSessionId = (): string => {
    return `visitor_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  };

  const generateDeviceFingerprint = async (): Promise<string> => {
    const platform = (Capacitor && Capacitor.isNativePlatform()) ? Capacitor.getPlatform() : 'web';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${platform}_${timestamp}_${random}`;
  };

  const handleResponseChange = (value: any, type: 'text' | 'options' | 'media' = 'text') => {
    const timeTaken = Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000);
    
    const response: QuestionResponse = {
      questionId: currentQuestion.id,
      time_taken: timeTaken
    };

    switch (type) {
      case 'text':
        response.response_text = value;
        break;
      case 'options':
        response.selected_option_ids = Array.isArray(value) ? value : [value];
        break;
      case 'media':
        response.media_url = value;
        break;
    }

    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: response
    }));
  };

  const handleImageCapture = async () => {
    if (!Capacitor || !Capacitor.isNativePlatform()) {
      // Web fallback - use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const imageData = reader.result as string;
            setCapturedImage(imageData);
            handleResponseChange(imageData, 'media');
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      return;
    }

    try {
      if (!CapCamera) {
        throw new Error('Camera not available');
      }
      
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: 'dataUrl'
      });

      setCapturedImage(image.dataUrl!);
      handleResponseChange(image.dataUrl!, 'media');
    } catch (error) {
      logger.error('Failed to capture image', 'AnonymousAssessment', error);
      toast({
        title: 'Camera Error',
        description: 'Failed to capture image. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        handleResponseChange(audioUrl, 'media');
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      logger.error('Failed to start audio recording', 'AnonymousAssessment', error);
      toast({
        title: 'Microphone Error',
        description: 'Failed to access microphone. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleNextQuestion = async () => {
    // Submit current response
    if (attemptId && responses[currentQuestion.id]) {
      await submitResponse(responses[currentQuestion.id]);
    }

    if (isLastQuestion) {
      handleSubmitAssessment();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitResponse = async (response: QuestionResponse) => {
    if (!attemptId) return;

    try {
      const { error } = await supabase.rpc('submit_question_response', {
        p_attempt_id: attemptId,
        p_question_id: response.questionId,
        p_response_text: response.response_text,
        p_selected_option_ids: response.selected_option_ids,
        p_response_value: response.response_value,
        p_time_taken: response.time_taken
      });

      if (error) throw error;
    } catch (error) {
      logger.error('Failed to submit response', 'AnonymousAssessment', error);
    }
  };

  const handleSubmitAssessment = async () => {
    if (!attemptId) return;

    setIsSubmitting(true);
    try {
      const { data: results, error } = await supabase.rpc('complete_assessment_attempt', {
        p_attempt_id: attemptId
      });

      if (error) throw error;

      onComplete(results);
    } catch (error) {
      logger.error('Failed to submit assessment', 'AnonymousAssessment', error);
      toast({
        title: 'Submission Error',
        description: 'Failed to submit assessment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionContent = () => {
    const response = responses[currentQuestion.id];

    switch (currentQuestion.question_type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={response?.selected_option_ids?.[0] || ''}
            onValueChange={(value) => handleResponseChange(value, 'options')}
            className="space-y-3"
          >
            {currentQuestion.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                  {option.option_text}
                  {option.media_url && (
                    <img 
                      src={option.media_url} 
                      alt="Option visual" 
                      className="mt-2 max-w-full h-32 object-cover rounded"
                    />
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'true_false':
        return (
          <RadioGroup
            value={response?.selected_option_ids?.[0] || ''}
            onValueChange={(value) => handleResponseChange(value, 'options')}
            className="space-y-3"
          >
            {currentQuestion.options?.map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.id} id={option.id} />
                <Label htmlFor={option.id} className="cursor-pointer">
                  {option.option_text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'short_answer':
        return (
          <Textarea
            value={response?.response_text || ''}
            onChange={(e) => handleResponseChange(e.target.value)}
            placeholder="Enter your response here..."
            className="min-h-32"
          />
        );

      case 'image_upload':
        return (
          <div className="space-y-4">
            <Button
              onClick={handleImageCapture}
              variant="outline"
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              {capturedImage ? 'Retake Photo' : 'Take Photo'}
            </Button>
            
            {capturedImage && (
              <div className="relative">
                <img 
                  src={capturedImage} 
                  alt="Captured response" 
                  className="max-w-full h-64 object-cover rounded border"
                />
                <Button
                  onClick={() => {
                    setCapturedImage(null);
                    handleResponseChange('', 'media');
                  }}
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        );

      case 'audio_response':
        return (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={isRecording ? stopAudioRecording : startAudioRecording}
                variant={isRecording ? "destructive" : "default"}
                className="flex-1"
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
            </div>

            {recordedAudio && (
              <div className="space-y-2">
                <audio controls src={recordedAudio} className="w-full" />
                <Button
                  onClick={() => {
                    setRecordedAudio(null);
                    handleResponseChange('', 'media');
                  }}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Re-record
                </Button>
              </div>
            )}

            {isRecording && (
              <div className="text-center text-red-600 animate-pulse">
                <Mic className="h-6 w-6 mx-auto mb-2" />
                Recording in progress...
              </div>
            )}
          </div>
        );

      default:
        return (
          <Input
            value={response?.response_text || ''}
            onChange={(e) => handleResponseChange(e.target.value)}
            placeholder="Enter your response..."
          />
        );
    }
  };

  const isResponseValid = () => {
    const response = responses[currentQuestion.id];
    if (!response) return false;

    switch (currentQuestion.question_type) {
      case 'multiple_choice':
      case 'true_false':
        return response.selected_option_ids && response.selected_option_ids.length > 0;
      case 'short_answer':
        return response.response_text && response.response_text.trim().length > 0;
      case 'image_upload':
        return response.media_url && response.media_url.length > 0;
      case 'audio_response':
        return response.media_url && response.media_url.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{assessment.type.replace('_', ' ')}</Badge>
          <Badge variant="outline">{assessment.difficulty}</Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Question {currentQuestionIndex + 1} of {assessment.questions.length}</span>
          {timeRemaining && (
            <span className="flex items-center text-orange-600">
              <Clock className="h-4 w-4 mr-1" />
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      {/* Question Card */}
      <Card className="glass-strong">
        <CardHeader>
          <CardTitle className="text-xl">
            {currentQuestion.question_text}
          </CardTitle>
          {currentQuestion.hint && (
            <CardDescription>
              💡 Hint: {currentQuestion.hint}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
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

          {/* Question Input */}
          {renderQuestionContent()}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={handleNextQuestion}
              disabled={!isResponseValid() || isSubmitting}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              ) : isLastQuestion ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {isLastQuestion ? 'Submit Assessment' : 'Next Question'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Info */}
      <Card className="glass">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Estimated time: {assessment.estimated_time} minutes</span>
            <span>Passing score: {assessment.passing_score}%</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnonymousAssessment;