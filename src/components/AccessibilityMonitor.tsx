/**
 * Accessibility Monitor Component
 * Real-time accessibility monitoring and reporting overlay
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAccessibilityAudit } from '@/utils/accessibilityAudit';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  FileText,
  RefreshCw,
  Settings,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccessibilityMonitorProps {
  enabled?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoRun?: boolean;
  showInProduction?: boolean;
}

export const AccessibilityMonitor: React.FC<AccessibilityMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  autoRun = true,
  showInProduction = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [wcagLevel, setWcagLevel] = useState<'A' | 'AA' | 'AAA'>('AA');

  const { 
    result, 
    isAuditing, 
    runAudit, 
    enableLiveAudit, 
    disableLiveAudit,
    generateReport 
  } = useAccessibilityAudit({
    wcagLevel,
    includeWarnings: true,
    enableLiveAudit: liveMode
  });

  // Don't show in production unless explicitly enabled
  const shouldShow = enabled && (process.env.NODE_ENV === 'development' || showInProduction);

  useEffect(() => {
    if (!shouldShow) return;

    setIsVisible(true);

    if (autoRun) {
      // Initial audit after a delay to let the page settle
      const timer = setTimeout(() => {
        runAudit();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [shouldShow, autoRun, runAudit]);

  useEffect(() => {
    if (liveMode) {
      enableLiveAudit();
    } else {
      disableLiveAudit();
    }
    
    return () => disableLiveAudit();
  }, [liveMode, enableLiveAudit, disableLiveAudit]);

  const handleToggleLiveMode = useCallback(() => {
    setLiveMode(!liveMode);
  }, [liveMode]);

  const handleRunAudit = useCallback(() => {
    runAudit({ wcagLevel });
  }, [runAudit, wcagLevel]);

  const handleHighlightIssue = useCallback((issueId: string) => {
    const issue = result?.issues.find(i => i.id === issueId);
    if (!issue) return;

    // Remove existing highlights
    document.querySelectorAll('.a11y-highlight').forEach(el => {
      el.classList.remove('a11y-highlight');
    });

    // Add highlight to issue element
    issue.element.classList.add('a11y-highlight');
    issue.element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });

    // Add temporary highlight styles if not already added
    if (!document.getElementById('a11y-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'a11y-highlight-styles';
      style.textContent = `
        .a11y-highlight {
          outline: 3px solid #ef4444 !important;
          outline-offset: 2px !important;
          background-color: rgba(239, 68, 68, 0.1) !important;
          animation: a11y-pulse 2s ease-in-out;
        }
        @keyframes a11y-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `;
      document.head.appendChild(style);
    }

    // Remove highlight after 5 seconds
    setTimeout(() => {
      issue.element.classList.remove('a11y-highlight');
    }, 5000);
  }, [result]);

  const handleExportReport = useCallback(() => {
    if (!result) return;

    const report = generateReport(result);
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result, generateReport]);

  if (!shouldShow || !isVisible) return null;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };

  const errorCount = result?.issues.filter(i => i.severity === 'error').length || 0;
  const warningCount = result?.issues.filter(i => i.severity === 'warning').length || 0;
  const score = result?.score || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`fixed ${positionClasses[position]} z-50 max-w-sm`}
      >
        <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm font-medium">
                  A11y Monitor
                </CardTitle>
                <Badge 
                  variant={score >= 90 ? 'success' : score >= 70 ? 'warning' : 'destructive'}
                  className="text-xs"
                >
                  {score}%
                </Badge>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-6 w-6 p-0"
                >
                  {isMinimized ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVisible(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CardContent className="space-y-4">
                  {/* Score and Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Accessibility Score</span>
                      <span className="font-medium">{score}/100</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>

                  {/* Issue Summary */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        <span className="font-medium text-red-600">{errorCount}</span>
                      </div>
                      <div className="text-gray-500 text-xs">Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <Info className="w-3 h-3 text-yellow-500" />
                        <span className="font-medium text-yellow-600">{warningCount}</span>
                      </div>
                      <div className="text-gray-500 text-xs">Warnings</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="font-medium text-green-600">{result?.passed || 0}</span>
                      </div>
                      <div className="text-gray-500 text-xs">Passed</div>
                    </div>
                  </div>

                  {/* WCAG Compliance */}
                  <div className="flex items-center justify-between text-xs">
                    <span>WCAG {wcagLevel} Compliant</span>
                    <Badge variant={result?.compliance.wcagAA ? 'success' : 'destructive'}>
                      {result?.compliance.wcagAA ? 'Yes' : 'No'}
                    </Badge>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRunAudit}
                      disabled={isAuditing}
                      className="flex-1"
                    >
                      {isAuditing ? (
                        <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="w-3 h-3 mr-1" />
                      )}
                      Scan
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={liveMode ? 'default' : 'outline'}
                      onClick={handleToggleLiveMode}
                    >
                      {liveMode ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleExportReport}
                      disabled={!result}
                    >
                      <FileText className="w-3 h-3" />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowSettings(!showSettings)}
                    >
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>

                  {/* Settings Panel */}
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t pt-3 space-y-2"
                      >
                        <div className="text-xs font-medium">Settings</div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">WCAG Level</span>
                            <select
                              value={wcagLevel}
                              onChange={(e) => setWcagLevel(e.target.value as 'A' | 'AA' | 'AAA')}
                              className="text-xs border rounded px-2 py-1"
                            >
                              <option value="A">A</option>
                              <option value="AA">AA</option>
                              <option value="AAA">AAA</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Auto-scan</span>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={liveMode}
                                onChange={handleToggleLiveMode}
                                className="mr-1 text-xs"
                              />
                            </label>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Issues List */}
                  {result && result.issues.length > 0 && (
                    <div className="border-t pt-3">
                      <div className="text-xs font-medium mb-2">Issues</div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {result.issues.slice(0, 5).map((issue) => (
                          <div
                            key={issue.id}
                            className="text-xs p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => handleHighlightIssue(issue.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-1 mb-1">
                                  {issue.severity === 'error' ? (
                                    <AlertTriangle className="w-3 h-3 text-red-500" />
                                  ) : issue.severity === 'warning' ? (
                                    <Info className="w-3 h-3 text-yellow-500" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3 text-blue-500" />
                                  )}
                                  <span className="font-medium text-gray-900">
                                    {issue.rule}
                                  </span>
                                </div>
                                <div className="text-gray-600 text-xs leading-tight">
                                  {issue.description}
                                </div>
                                <div className="text-gray-400 text-xs mt-1">
                                  {issue.wcagCriteria} • {issue.selector}
                                </div>
                              </div>
                              <ExternalLink className="w-3 h-3 text-gray-400 ml-2 flex-shrink-0" />
                            </div>
                          </div>
                        ))}
                        {result.issues.length > 5 && (
                          <div className="text-xs text-gray-500 text-center py-1">
                            +{result.issues.length - 5} more issues
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* No Issues */}
                  {result && result.issues.length === 0 && (
                    <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <div className="text-sm font-medium text-green-600">
                        No accessibility issues found!
                      </div>
                      <div className="text-xs text-gray-500">
                        Your page meets WCAG {wcagLevel} standards
                      </div>
                    </div>
                  )}

                  {/* Status Messages */}
                  {isAuditing && (
                    <div className="text-center py-2">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-blue-600" />
                      <div className="text-xs text-gray-600">Scanning for accessibility issues...</div>
                    </div>
                  )}

                  {liveMode && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-blue-700">Live monitoring enabled</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default AccessibilityMonitor;