// Utility to select the correct components JSON based on current language
import componentsEn from '@/components/layout/sidebar/build/components.json';
import componentsFr from '@/components/layout/sidebar/build/components.fr.json';

export interface ComponentItem {
  id: string;
  name: string;
  defaultPorts: {
    executionIn?: { portId: string; name: string; dataType: string };
    executionOuts?: { portId: string; name: string; dataType: string }[];
    dataIns?: { portId: string; name: string; dataType: string }[];
    dataOuts?: { portId: string; name: string; dataType: string }[];
  };
  documentation?: string;
}

export interface ComponentsCategory {
  category: string;
  items: ComponentItem[];
}

/**
 * Returns the components metadata array for the given language.
 * @param lang  "en" or "fr"
 */
export function getComponentsData(lang: 'en' | 'fr'): ComponentsCategory[] {
  return (lang === 'fr' ? componentsFr : componentsEn) as ComponentsCategory[];
}
