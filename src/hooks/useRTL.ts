import { useEffect, useState } from 'react';

export const useRTL = (language?: 'en' | 'ar') => {
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    const isArabic = language === 'ar' || document.documentElement.lang === 'ar';
    setIsRTL(isArabic);
    
    // Update document direction
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.documentElement.lang = language || 'en';
    
    // Add RTL class to body for additional styling
    if (isArabic) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  }, [language]);

  return { isRTL };
};

export const getRTLClasses = (isRTL: boolean) => ({
  textAlign: isRTL ? 'text-right' : 'text-left',
  marginStart: isRTL ? 'mr-' : 'ml-',
  marginEnd: isRTL ? 'ml-' : 'mr-',
  paddingStart: isRTL ? 'pr-' : 'pl-',
  paddingEnd: isRTL ? 'pl-' : 'pr-',
  borderStart: isRTL ? 'border-r' : 'border-l',
  borderEnd: isRTL ? 'border-l' : 'border-r',
  roundedStart: isRTL ? 'rounded-r' : 'rounded-l',
  roundedEnd: isRTL ? 'rounded-l' : 'rounded-r',
});