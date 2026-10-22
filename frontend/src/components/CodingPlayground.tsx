'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface CodingPlaygroundProps {
  initialHtml?: string;
  initialCss?: string;
  initialJs?: string;
  exercise?: {
    title: string;
    description: string;
    expectedOutput?: string;
    hints?: string[];
  };
  onRun?: (output: string) => void;
  onReset?: () => void;
}

export default function CodingPlayground({
  initialHtml = '<h1>Hello World</h1>\n<p>Edit this code to see changes!</p>',
  initialCss = 'body {\n  font-family: Arial, sans-serif;\n  padding: 20px;\n}',
  initialJs = '// Write JavaScript here\nconsole.log("Hello from JavaScript!");',
  exercise,
  onRun,
  onReset,
}: CodingPlaygroundProps) {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [js, setJs] = useState(initialJs);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const runCode = () => {
    setIsRunning(true);
    setConsoleLogs([]);

    const combinedCode = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>
            (function() {
              const originalLog = console.log;
              const logs = [];
              console.log = function(...args) {
                logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
                originalLog.apply(console, args);
              };
              
              try {
                ${js}
                
                // Send logs to parent
                window.parent.postMessage({ type: 'console', logs }, '*');
              } catch (error) {
                console.error('Error:', error.message);
                window.parent.postMessage({ type: 'console', logs: ['Error: ' + error.message] }, '*');
              }
            })();
          </script>
        </body>
      </html>
    `;

    if (iframeRef.current) {
      const iframe = iframeRef.current;
      iframe.srcdoc = combinedCode;
    }

    // Listen for console messages from iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'console') {
        setConsoleLogs(event.data.logs);
        setOutput(event.data.logs.join('\n'));
        onRun?.(event.data.logs.join('\n'));
      }
    };

    window.addEventListener('message', handleMessage);

    setTimeout(() => {
      setIsRunning(false);
      window.removeEventListener('message', handleMessage);
    }, 1000);
  };

  const resetCode = () => {
    setHtml(initialHtml);
    setCss(initialCss);
    setJs(initialJs);
    setOutput('');
    setConsoleLogs([]);
    onReset?.();
  };

  const validateOutput = () => {
    if (exercise?.expectedOutput) {
      const isCorrect = consoleLogs.some(log => 
        log.toLowerCase().includes(exercise.expectedOutput!.toLowerCase())
      );
      return isCorrect;
    }
    return null;
  };

  const validation = validateOutput();

  return (
    <div className="w-full">
      {exercise && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {exercise.title}
              {validation === true && <Badge className="bg-green-600">Correct!</Badge>}
              {validation === false && <Badge variant="destructive">Try Again</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-2">{exercise.description}</p>
            {exercise.expectedOutput && (
              <p className="text-sm text-gray-500">
                Expected output: <code className="bg-gray-100 px-1 py-0.5 rounded">{exercise.expectedOutput}</code>
              </p>
            )}
            {exercise.hints && exercise.hints.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Hints:</p>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  {exercise.hints.map((hint, i) => (
                    <li key={i}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Code Editors */}
        <div className="space-y-4">
          <Tabs defaultValue="html" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="css">CSS</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            </TabsList>
            <TabsContent value="html">
              <Card>
                <CardContent className="p-0">
                  <Editor
                    height="300px"
                    defaultLanguage="html"
                    value={html}
                    onChange={(value) => setHtml(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="css">
              <Card>
                <CardContent className="p-0">
                  <Editor
                    height="300px"
                    defaultLanguage="css"
                    value={css}
                    onChange={(value) => setCss(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="javascript">
              <Card>
                <CardContent className="p-0">
                  <Editor
                    height="300px"
                    defaultLanguage="javascript"
                    value={js}
                    onChange={(value) => setJs(value || '')}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2">
            <Button onClick={runCode} disabled={isRunning} className="flex-1">
              {isRunning ? 'Running...' : '▶ Run'}
            </Button>
            <Button onClick={resetCode} variant="outline">
              ↺ Reset
            </Button>
          </div>
        </div>

        {/* Output */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <iframe
                ref={iframeRef}
                title="Preview"
                className="w-full h-[300px] border rounded bg-white"
                sandbox="allow-scripts"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Console Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded min-h-[150px] font-mono text-sm overflow-auto">
                {consoleLogs.length > 0 ? (
                  consoleLogs.map((log, i) => (
                    <div key={i} className="py-1">
                      {log}
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">No output yet. Click Run to execute.</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
