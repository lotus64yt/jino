"use client";
import React from 'react';
// import rawComponents from '@/components/layout/sidebar/build/components.json';
import { useLanguage } from '@/context/LanguageContext';
import { getComponentsData } from '@/utils/getComponentsData';

// Define types for documentation data
// type PortDef = { portId: string; name: string; dataType: string; };
// type DefaultPorts = {
//   executionIn?: PortDef;
//   executionOuts?: PortDef[];
//   dataIns?: PortDef[];
//   dataOuts?: PortDef[];
// };
// type ComponentItem = { id: string; name: string; documentation?: string; defaultPorts: DefaultPorts; };
// type DocsData = { category: string; items: ComponentItem[] }[];
// const componentsData = (rawComponents as unknown) as DocsData;

export default function DocsPage() {
  const { t, lang } = useLanguage();
  const categorizedComponents = getComponentsData(lang);
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 sticky top-16 h-screen overflow-y-auto bg-muted-bg border-r border-card-border p-4">
        <h2 className="text-xl font-semibold mb-4">{t('docs.sidebarTitle')}</h2>
        {categorizedComponents.map((category) => (
          <div key={category.category} className="mb-6">
            <h3 className="font-medium mb-2">{category.category}</h3>
            <ul className="pl-2 space-y-1 text-sm">
              {category.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </aside>
      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-4xl font-bold mb-8">{t('docs.title')}</h1>
        {categorizedComponents.map((category) => (
          <section key={category.category} className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">{category.category}</h2>
            <div className="space-y-8">
              {category.items.map((item) => (
                <div
                  key={item.id}
                  id={item.id}
                  className="bg-card-bg border border-card-border rounded-lg p-6 scroll-mt-20"
                >
                  <h3 className="text-xl font-medium mb-2">
                    {item.name}{' '}
                    <span className="text-sm text-gray-400">({item.id})</span>
                  </h3>
                  {item.documentation && (
                    <p className="mb-4 text-gray-300">{item.documentation}</p>
                  )}
                  <div className="space-y-2">
                    {item.defaultPorts.executionIn && (
                      <p>
                        <strong>Execution In:</strong> {item.defaultPorts.executionIn.name}{' '}
                        <code>id={item.defaultPorts.executionIn.portId}</code>
                      </p>
                    )}
                    {item.defaultPorts.executionOuts && item.defaultPorts.executionOuts.length > 0 && (
                      <div>
                        <strong>Execution Outs:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {item.defaultPorts.executionOuts.map((port) => (
                            <li key={port.portId}>
                              {port.name} <code>id={port.portId}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {'dataIns' in item.defaultPorts && item.defaultPorts.dataIns && item.defaultPorts.dataIns.length > 0 && (
                      <div>
                        <strong>Data Inputs:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {item.defaultPorts.dataIns.map((port) => (
                            <li key={port.portId}>
                              {port.name} <em>({port.dataType})</em>{' '}
                              <code>id={port.portId}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.defaultPorts.dataOuts && item.defaultPorts.dataOuts.length > 0 && (
                      <div>
                        <strong>Data Outputs:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {item.defaultPorts.dataOuts.map((port) => (
                            <li key={port.portId}>
                              {port.name} <em>({port.dataType})</em>{' '}
                              <code>id={port.portId}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
