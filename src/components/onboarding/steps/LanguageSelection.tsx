import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  MapPin, 
  ArrowRight 
} from 'lucide-react';

interface LanguageSelectionProps {
  onComplete: (data: any) => void;
  onSkip: () => void;
  initialData?: any;
}

const LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    regions: [
      { code: 'us', name: 'United States', sensitivities: ['individualism', 'direct_communication'] },
      { code: 'uk', name: 'United Kingdom', sensitivities: ['politeness', 'understatement'] },
      { code: 'ca', name: 'Canada', sensitivities: ['multiculturalism', 'politeness'] },
      { code: 'au', name: 'Australia', sensitivities: ['casual_culture', 'mateship'] },
      { code: 'global', name: 'International/Global', sensitivities: ['cultural_diversity'] },
    ]
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    regions: [
      { code: 'sa', name: 'Saudi Arabia', sensitivities: ['family_honor', 'religious_values', 'gender_roles', 'community_respect'] },
      { code: 'ae', name: 'UAE', sensitivities: ['tradition_modernity', 'family_values', 'respect_hierarchy'] },
      { code: 'eg', name: 'Egypt', sensitivities: ['family_centrality', 'social_harmony', 'religious_consideration'] },
      { code: 'jo', name: 'Jordan', sensitivities: ['family_loyalty', 'hospitality', 'social_status'] },
      { code: 'lb', name: 'Lebanon', sensitivities: ['family_bonds', 'social_connections', 'cultural_pride'] },
      { code: 'ma', name: 'Morocco', sensitivities: ['family_respect', 'traditional_values', 'social_harmony'] },
      { code: 'mena', name: 'Middle East/North Africa', sensitivities: ['family_centrality', 'cultural_values', 'community_respect'] },
    ]
  }
];

export const LanguageSelection = ({ onComplete, onSkip, initialData }: LanguageSelectionProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>(initialData?.language || '');
  const [selectedRegion, setSelectedRegion] = useState<string>(initialData?.culturalContext?.region || '');

  const currentLanguageData = LANGUAGES.find(lang => lang.code === selectedLanguage);
  const currentRegionData = currentLanguageData?.regions.find(region => region.code === selectedRegion);

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setSelectedRegion(''); // Reset region when language changes
  };

  const handleRegionSelect = (regionCode: string) => {
    setSelectedRegion(regionCode);
  };

  const handleContinue = () => {
    if (!selectedLanguage) return;

    const regionData = currentLanguageData?.regions.find(r => r.code === selectedRegion);
    
    onComplete({
      language: selectedLanguage as 'en' | 'ar',
      culturalContext: {
        region: selectedRegion || 'global',
        culturalSensitivities: regionData?.sensitivities || ['cultural_diversity'],
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
          <Globe className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Choose Your Language</h2>
        <p className="text-muted-foreground">
          Select your preferred language and cultural context to personalize your experience
        </p>
      </div>

      {/* Language Selection */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Language Preference
        </h3>
        <div className="grid gap-3">
          {LANGUAGES.map((language) => (
            <Card
              key={language.code}
              className={`cursor-pointer transition-all hover:scale-[1.02] ${
                selectedLanguage === language.code
                  ? 'glass-strong border-primary shadow-lg shadow-primary/20'
                  : 'glass-subtle hover:glass-strong'
              }`}
              onClick={() => handleLanguageSelect(language.code)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{language.flag}</span>
                    <div>
                      <p className="font-medium">{language.name}</p>
                      <p className="text-sm text-muted-foreground">{language.nativeName}</p>
                    </div>
                  </div>
                  {selectedLanguage === language.code && (
                    <Badge className="bg-primary/20 text-primary">Selected</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Region Selection */}
      {selectedLanguage && currentLanguageData && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Cultural Context
          </h3>
          <p className="text-sm text-muted-foreground">
            This helps us provide culturally sensitive guidance and support
          </p>
          <div className="grid gap-2">
            {currentLanguageData.regions.map((region) => (
              <Card
                key={region.code}
                className={`cursor-pointer transition-all hover:scale-[1.01] ${
                  selectedRegion === region.code
                    ? 'glass-strong border-secondary shadow-md shadow-secondary/20'
                    : 'glass-subtle hover:glass-strong'
                }`}
                onClick={() => handleRegionSelect(region.code)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{region.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {region.sensitivities.slice(0, 2).map((sensitivity) => (
                          <Badge key={sensitivity} variant="outline" className="text-xs">
                            {sensitivity.replace('_', ' ')}
                          </Badge>
                        ))}
                        {region.sensitivities.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{region.sensitivities.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    {selectedRegion === region.code && (
                      <Badge className="bg-secondary/20 text-secondary text-xs">Selected</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Cultural Sensitivity Info */}
      {currentRegionData && (
        <Card className="glass-subtle border-primary/20">
          <CardContent className="p-4">
            <h4 className="font-medium text-primary mb-2">Cultural Considerations</h4>
            <div className="flex flex-wrap gap-2">
              {currentRegionData.sensitivities.map((sensitivity) => (
                <Badge key={sensitivity} variant="outline" className="text-xs">
                  {sensitivity.replace('_', ' ')}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              NewMe will adapt her guidance style to respect these cultural values
            </p>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleContinue}
          disabled={!selectedLanguage}
          className="flex-1 bg-gradient-primary hover:opacity-90"
          size="lg"
        >
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};