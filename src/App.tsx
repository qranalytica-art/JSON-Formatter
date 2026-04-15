import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Copy, 
  Download, 
  Check, 
  FileJson, 
  Type as TypeIcon,
  AlertCircle,
  Wand2,
  Eraser,
  Code2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AnswerOption {
  text: string;
  isCorrect: boolean;
  rationale: string;
}

interface QuizQuestion {
  question: string;
  answerOptions: AnswerOption[];
  hint: string;
}

export default function App() {
  const [content, setContent] = useState("");
  const [result, setResult] = useState<QuizQuestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const unescapeHtml = (safe: string) => {
    return safe
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"')
      .replace(/&lsquo;/g, "'")
      .replace(/&rsquo;/g, "'");
  };

  const formatDirectly = () => {
    if (!content.trim()) {
      setError("Please provide some content to format.");
      return;
    }

    setError(null);
    setResult(null);

    try {
      // 1. Unescape HTML entities
      let cleaned = unescapeHtml(content);

      // 2. Remove ALL LaTeX dollar signs ($word$ or $123$)
      cleaned = cleaned.replace(/\$([^$]+)\$/g, '$1');
      
      // 3. Try to find JSON structure
      const jsonMatch = cleaned.match(/\[\s*\{[\s\S]*\}\s*\]|\{\s*"question"[\s\S]*\}/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setResult(Array.isArray(parsed) ? parsed : [parsed]);
      } else {
        // 4. Fallback: Parse as custom text blocks if not JSON
        const blocks = cleaned.split(/\n\s*\n/).filter(b => b.trim());
        
        if (blocks.length > 0) {
          const options = blocks.map(block => {
            const lines = block.split('\n').map(l => l.trim()).filter(l => l);
            const isCorrect = lines.some(l => l.toLowerCase() === 'correct');
            const text = lines[0];
            const rationale = lines
              .filter(l => l.toLowerCase() !== 'correct')
              .slice(1)
              .join(' ');
              
            return { 
              text: text || "Empty Option", 
              isCorrect, 
              rationale: rationale || "" 
            };
          });

          setResult([{
            question: "Parsed Question (Please edit)",
            answerOptions: options,
            hint: ""
          }]);
        } else {
          throw new Error("Could not find valid JSON or text blocks.");
        }
      }
    } catch (err) {
      console.error(err);
      setError("Formatting failed. If pasting JSON, ensure it's valid. If pasting text, separate options with double newlines.");
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-formatted-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    setContent("");
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <FileJson className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Direct JSON Formatter</h1>
            </div>
            <p className="text-muted-foreground">
              Clean, unescape, and format your quiz JSON directly without AI.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearAll} className="w-fit">
              <Eraser className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-none shadow-sm h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Raw Input
                </CardTitle>
                <CardDescription>
                  Paste your raw data (even with &quot; or $ symbols) here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 flex-1 flex flex-col">
                <Textarea
                  placeholder='Paste your JSON here... e.g. { &quot;question&quot;: &quot;...&quot; }'
                  className="flex-1 min-h-[400px] font-mono text-xs resize-none focus-visible:ring-primary"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                
                <Button 
                  className="w-full h-12 text-lg font-semibold mt-4" 
                  onClick={formatDirectly}
                >
                  <Wand2 className="mr-2 h-5 w-5" />
                  Format Directly
                </Button>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-destructive/10 text-destructive text-sm rounded-md flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Output Section */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="border-none shadow-sm h-full flex flex-col min-h-[500px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg">Formatted Output</CardTitle>
                  <CardDescription>
                    Cleaned and structured JSON data.
                  </CardDescription>
                </div>
                {result && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={copyToClipboard}>
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      <span className="ml-2 hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadJson}>
                      <Download className="w-4 h-4" />
                      <span className="ml-2 hidden sm:inline">Download</span>
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <Tabs defaultValue="preview" className="h-full flex flex-col">
                  <div className="px-6 border-b">
                    <TabsList className="bg-transparent h-12">
                      <TabsTrigger value="preview" className="data-[state=active]:bg-slate-100">Preview</TabsTrigger>
                      <TabsTrigger value="code" className="data-[state=active]:bg-slate-100">Clean JSON</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="preview" className="h-full m-0 p-6">
                      <ScrollArea className="h-[500px]">
                        <AnimatePresence mode="wait">
                          {result ? (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="space-y-6"
                            >
                              {result.map((q, i) => (
                                <div key={i} className="p-4 border rounded-lg bg-white space-y-4">
                                  <h3 className="font-semibold text-lg">{i + 1}. {q.question}</h3>
                                  <div className="grid gap-2">
                                    {q.answerOptions?.map((opt, j) => (
                                      <div 
                                        key={j} 
                                        className={cn(
                                          "p-3 rounded-md border text-sm",
                                          opt.isCorrect ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
                                        )}
                                      >
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium">{opt.text}</span>
                                          {opt.isCorrect && <span className="text-[10px] font-bold uppercase text-green-600">Correct</span>}
                                        </div>
                                        <p className="text-muted-foreground text-xs italic">{opt.rationale}</p>
                                      </div>
                                    ))}
                                  </div>
                                  {q.hint && (
                                    <div className="pt-2 border-t text-xs text-muted-foreground">
                                      <span className="font-bold uppercase tracking-wider mr-2">Hint:</span>
                                      {q.hint}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </motion.div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 py-20">
                              <div className="p-4 bg-slate-100 rounded-full">
                                <FileJson className="w-8 h-8 opacity-20" />
                              </div>
                              <p>Paste some JSON data to see the formatted result.</p>
                            </div>
                          )}
                        </AnimatePresence>
                      </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="code" className="h-full m-0 p-0">
                      <ScrollArea className="h-[500px] bg-slate-900">
                        <pre className="p-6 text-sm font-mono text-slate-300">
                          {result ? JSON.stringify(result, null, 2) : "// No JSON formatted yet"}
                        </pre>
                      </ScrollArea>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© 2026 Direct JSON Formatter. Local Processing Only.</p>
        </footer>
      </div>
    </div>
  );
}
