import React, { useState, useEffect } from 'react';
import { useVoiceAgentConfig } from '@/hooks/useVoiceAgentConfig';
import { VoiceAgentConfigWithId } from '@/hooks/useVoiceAgentConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceAgentConfigManagerProps {
  className?: string;
}

export const VoiceAgentConfigManager: React.FC<VoiceAgentConfigManagerProps> = ({ className }) => {
  const { configs, activeConfig, loading, createConfig, updateConfig, setActive, deleteConfig } = useVoiceAgentConfig();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<VoiceAgentConfigWithId | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    instructions: '',
    voice: 'alloy' as const,
    model: 'gpt-4o-realtime-preview-2024-10-01',
    temperature: 0.7,
    max_tokens: 1000,
    is_active: false,
  });

  const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  const models = [
    'gpt-4o-realtime-preview-2024-10-01',
    'gpt-4o-mini-realtime-preview-2024-10-01',
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      instructions: '',
      voice: 'alloy',
      model: 'gpt-4o-realtime-preview-2024-10-01',
      temperature: 0.7,
      max_tokens: 1000,
      is_active: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingConfig) {
        await updateConfig(editingConfig.id, formData);
        setEditingConfig(null);
      } else {
        await createConfig(formData);
      }
      
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleEdit = (config: VoiceAgentConfigWithId) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      instructions: config.instructions,
      voice: config.voice,
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      is_active: config.is_active,
    });
    setIsCreateOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      try {
        await deleteConfig(id);
      } catch (error) {
        // Error handled by hook
      }
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await setActive(id);
    } catch (error) {
      // Error handled by hook
    }
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingConfig(null);
    setIsCreateOpen(true);
  };

  if (loading) {
    return (
      <Card className={cn("glass-card border-glass", className)}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading configurations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card className="glass-card border-glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Voice Agent Configuration</CardTitle>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreateDialog} className="glass-button">
                  <Plus className="w-4 h-4 mr-2" />
                  New Configuration
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingConfig ? 'Edit Configuration' : 'Create New Configuration'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Configuration name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="instructions">Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={formData.instructions}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      placeholder="System instructions for the voice agent"
                      rows={6}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="voice">Voice</Label>
                      <Select
                        value={formData.voice}
                        onValueChange={(value) => setFormData({ ...formData, voice: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {voices.map((voice) => (
                            <SelectItem key={voice} value={voice}>
                              {voice.charAt(0).toUpperCase() + voice.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Select
                        value={formData.model}
                        onValueChange={(value) => setFormData({ ...formData, model: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {models.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="temperature">Temperature</Label>
                      <Input
                        id="temperature"
                        type="number"
                        min="0"
                        max="2"
                        step="0.01"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="max_tokens">Max Tokens</Label>
                      <Input
                        id="max_tokens"
                        type="number"
                        min="1"
                        max="4096"
                        value={formData.max_tokens}
                        onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="glass-button">
                      {editingConfig ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {configs.map((config) => (
              <div
                key={config.id}
                className={cn(
                  "p-4 rounded-lg border",
                  config.is_active ? "border-green-500/50 bg-green-500/10" : "border-glass"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{config.name}</h3>
                      {config.is_active && (
                        <Badge className="bg-green-500/20 text-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Voice: {config.voice} | Model: {config.model} | Temp: {config.temperature}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {config.instructions.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!config.is_active && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetActive(config.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Set Active
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(config)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(config.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
