import React, { useState } from 'react';
import { ArrowLeft, Clock, Users, Star, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { freeVisitorAssessments, userAssessments, Assessment } from '../data/assessments';

const MobileAssessmentHub = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');

  const handleAssessmentClick = (assessmentId: string) => {
    navigate(`/assessment/${assessmentId}`);
  };

  const AssessmentCard = ({ assessment }: { assessment: Assessment }) => (
    <div 
      className="glass border-card-border rounded-xl p-4 mb-4 hover:glass-glow transition-all cursor-pointer"
      onClick={() => handleAssessmentClick(assessment.id)}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">{assessment.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{assessment.description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground ml-2 flex-shrink-0" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-muted-foreground text-xs">
            <Clock className="w-3 h-3 mr-1" />
            <span>{assessment.estimatedTime} min</span>
          </div>
          <div className="flex items-center text-muted-foreground text-xs">
            <Users className="w-3 h-3 mr-1" />
            <span className="capitalize">{assessment.category.replace('-', ' ')}</span>
          </div>
        </div>
        
        {assessment.visibility === 'public' && (
          <div className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded-full">
            Free
          </div>
        )}
        {assessment.visibility === 'users' && (
          <div className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">
            Premium
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center p-4 pb-2">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg glass text-foreground hover:glass-glow transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold ml-4">Assessment Hub</h1>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 mb-4">
          <div className="glass rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab('free')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'free'
                  ? 'bg-background text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Free Assessments
            </button>
            <button
              onClick={() => setActiveTab('premium')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === 'premium'
                  ? 'bg-background text-foreground shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Premium
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-6">
          {activeTab === 'free' && (
            <div>
              <div className="mb-4">
                <h2 className="font-semibold mb-2">Free Assessments</h2>
                <p className="text-muted-foreground text-sm">
                  No signup required. Start exploring your personality and growth areas.
                </p>
              </div>
              
              {freeVisitorAssessments.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
            </div>
          )}

          {activeTab === 'premium' && (
            <div>
              <div className="mb-4">
                <h2 className="font-semibold mb-2">Premium Assessments</h2>
                <p className="text-muted-foreground text-sm">
                  Advanced assessments for deeper insights and personal development.
                </p>
              </div>
              
              {userAssessments.map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
              
              {userAssessments.length === 0 && (
                <div className="glass border-card-border rounded-xl p-6 text-center">
                  <Star className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground text-sm">
                    Premium assessments are being prepared. Sign up to be notified when they're available!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileAssessmentHub;
