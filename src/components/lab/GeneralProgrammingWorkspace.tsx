import React, { useState, useRef } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle,
  Copy,
  Download,
  AlertCircle,
  Terminal,
  Clock,
  Code,
  FileCode,
  FolderOpen,
} from 'lucide-react';

interface GeneralProgrammingWorkspaceProps {
  className?: string;
  onSave?: (code: string, language: string) => void;
}

const TEMPLATES: Record<'c' | 'cpp' | 'python' | 'java', { title: string; code: string; defaultInput: string }[]> = {
  c: [
    {
      title: 'Sum of Two Numbers (stdin)',
      code: `#include <stdio.h>

int main(void) {
    int a, b;
    if (scanf("%d %d", &a, &b) == 2) {
        printf("Sum = %d\\n", a + b);
    } else {
        printf("Please provide two integers in input.\\n");
    }
    return 0;
}`,
      defaultInput: '10 20',
    },
    {
      title: 'Bubble Sort Array',
      code: `#include <stdio.h>

void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main(void) {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr) / sizeof(arr[0]);
    printf("Original array: ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");

    bubbleSort(arr, n);

    printf("Sorted array:   ");
    for (int i = 0; i < n; i++) printf("%d ", arr[i]);
    printf("\\n");
    return 0;
}`,
      defaultInput: '',
    },
  ],
  cpp: [
    {
      title: 'Two Sum Vector (C++17)',
      code: `#include <iostream>
#include <vector>
#include <unordered_map>

using namespace std;

vector<int> twoSum(const vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (seen.find(complement) != seen.end()) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    vector<int> nums = {2, 7, 11, 15};
    int target = 9;
    vector<int> indices = twoSum(nums, target);

    if (!indices.empty()) {
        cout << "Indices: [" << indices[0] << ", " << indices[1] << "]\\n";
        cout << "Values: " << nums[indices[0]] << " + " << nums[indices[1]] << " = " << target << "\\n";
    }
    return 0;
}`,
      defaultInput: '',
    },
    {
      title: 'Binary Search (stdin)',
      code: `#include <iostream>
#include <vector>
using namespace std;

int binarySearch(const vector<int>& arr, int target) {
    int low = 0, high = arr.size() - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> arr = {10, 20, 30, 40, 50, 60, 70, 80};
    int target;
    if (cin >> target) {
        int index = binarySearch(arr, target);
        if (index != -1) {
            cout << "Found target " << target << " at index " << index << endl;
        } else {
            cout << "Target " << target << " not found in array." << endl;
        }
    } else {
        cout << "Target: 40 -> Index: " << binarySearch(arr, 40) << endl;
    }
    return 0;
}`,
      defaultInput: '40',
    },
  ],
  python: [
    {
      title: 'Sum of Two Numbers (stdin)',
      code: `# Python 3 General Programming
import sys

def main():
    try:
        raw = sys.stdin.read().strip().split()
        if len(raw) >= 2:
            a, b = int(raw[0]), int(raw[1])
            print(f"Sum = {a + b}")
        else:
            print("Sum = 30 (Default sample: 10 + 20)")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()`,
      defaultInput: '10 20',
    },
    {
      title: 'Fibonacci Generator & Timing',
      code: `# Python Fibonacci Generator
def fibonacci(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print("First 15 Fibonacci Numbers:")
print(fibonacci(15))
`,
      defaultInput: '',
    },
  ],
  java: [
    {
      title: 'Addition & Scanner (stdin)',
      code: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        if (scanner.hasNextInt()) {
            int a = scanner.nextInt();
            int b = scanner.nextInt();
            System.out.println("Sum = " + (a + b));
        } else {
            System.out.println("Sum = 30 (Sample: 10 + 20)");
        }
        scanner.close();
    }
}`,
      defaultInput: '10 20',
    },
    {
      title: 'Palindrome & String Methods',
      code: `public class Main {
    public static boolean isPalindrome(String s) {
        int left = 0, right = s.length() - 1;
        while (left < right) {
            if (s.charAt(left++) != s.charAt(right--)) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        String test = "racecar";
        System.out.println("String: " + test);
        System.out.println("Is Palindrome: " + isPalindrome(test));
    }
}`,
      defaultInput: '',
    },
  ],
};

export const GeneralProgrammingWorkspace: React.FC<GeneralProgrammingWorkspaceProps> = ({
  className = '',
  onSave,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'c' | 'cpp' | 'python' | 'java'>('c');
  const [code, setCode] = useState<string>(TEMPLATES.c[0].code);
  const [inputData, setInputData] = useState<string>(TEMPLATES.c[0].defaultInput);
  const [output, setOutput] = useState<string>('');
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<'output' | 'input' | 'diagnostics'>('output');
  const [copied, setCopied] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lineNumbersRef = useRef<HTMLDivElement | null>(null);

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleLanguageChange = (lang: 'c' | 'cpp' | 'python' | 'java') => {
    setSelectedLanguage(lang);
    setCode(TEMPLATES[lang][0].code);
    setInputData(TEMPLATES[lang][0].defaultInput);
    setOutput('');
    setCompilationError(null);
    setExecutionTime(null);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setCompilationError(null);
    setOutput('');

    try {
      const res = await fetch('/api/execute-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage,
          code,
          input: inputData,
        }),
      });

      const data = await res.json();

      if (data.compilationError) {
        setCompilationError(data.compilationError);
        setActiveConsoleTab('diagnostics');
      } else {
        setOutput(data.stdout || (data.stderr ? `Error:\n${data.stderr}` : '[Process exited with code 0 - No output]'));
        setActiveConsoleTab('output');
      }

      if (data.executionTimeMs !== undefined) {
        setExecutionTime(data.executionTimeMs);
      }
    } catch (err: any) {
      setCompilationError(`Execution request failed: ${err?.message || err}`);
      setActiveConsoleTab('diagnostics');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = Math.max(1, code.split('\n').length);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className={`flex flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-xl overflow-hidden ${className}`}>
      {/* Top Header / Language Selector Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selector: C, C++, Python, Java */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 px-1">Language:</span>
            <button
              type="button"
              onClick={() => handleLanguageChange('c')}
              className={`px-2.5 py-1 rounded font-semibold text-xs transition cursor-pointer ${
                selectedLanguage === 'c'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              C
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('cpp')}
              className={`px-2.5 py-1 rounded font-semibold text-xs transition cursor-pointer ${
                selectedLanguage === 'cpp'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              C++
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('python')}
              className={`px-2.5 py-1 rounded font-semibold text-xs transition cursor-pointer ${
                selectedLanguage === 'python'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Python
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('java')}
              className={`px-2.5 py-1 rounded font-semibold text-xs transition cursor-pointer ${
                selectedLanguage === 'java'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Java
            </button>
          </div>

          {/* Templates Dropdown */}
          <div className="flex items-center gap-1">
            <select
              onChange={(e) => {
                const idx = Number(e.target.value);
                const t = TEMPLATES[selectedLanguage][idx];
                if (t) {
                  setCode(t.code);
                  setInputData(t.defaultInput);
                }
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="" disabled selected>
                Templates ({selectedLanguage.toUpperCase()})
              </option>
              {TEMPLATES[selectedLanguage].map((t, i) => (
                <option key={i} value={i} className="bg-slate-900 text-white">
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition cursor-pointer disabled:opacity-50 shadow-md shadow-emerald-600/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isRunning ? 'Executing...' : 'Run Code'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title="Copy Code"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {onSave && (
            <button
              type="button"
              onClick={() => onSave(code, selectedLanguage)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs transition cursor-pointer"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Layout: Independent Scroll Containers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-0 flex-1 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* Left Column: Code Editor (Fixed-Height Independent Scroll Container) */}
        <div className="lg:col-span-7 flex flex-col h-[480px] min-h-0 bg-slate-950 overflow-hidden">
          <div className="relative flex-1 flex min-h-0 overflow-hidden">
            {/* Line Numbers */}
            <div
              ref={lineNumbersRef}
              className="select-none py-3 px-2 bg-slate-950/90 text-slate-600 text-right font-mono text-[11px] border-r border-slate-900 w-12 shrink-0 overflow-hidden leading-5 pointer-events-none"
            >
              {lineNumbers.map((num) => (
                <div key={num} className="leading-5 h-5">
                  {num}
                </div>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={handleScroll}
              spellCheck={false}
              className="flex-1 w-full h-full bg-slate-950 text-cyan-100 p-3 leading-5 resize-none focus:outline-none font-mono text-xs selection:bg-cyan-500/30 overflow-y-auto overscroll-contain select-text"
              placeholder={`Write your ${selectedLanguage.toUpperCase()} source code here...`}
            />
          </div>

          {/* Editor Status Bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-3">
              <span>Lines: {lineCount}</span>
              <span>Chars: {code.length}</span>
              <span className="text-cyan-400 uppercase font-semibold">{selectedLanguage} Toolchain</span>
            </div>
            {executionTime !== null && (
              <span className="text-emerald-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{executionTime} ms</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Dedicated General Programming Console (Independent Fixed-Height Scroll Container) */}
        <div className="lg:col-span-5 flex flex-col h-[480px] min-h-0 bg-slate-950 overflow-hidden">
          {/* Console Header Tabs */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveConsoleTab('output')}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  activeConsoleTab === 'output'
                    ? 'bg-slate-800 text-emerald-400 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Output (stdout)
              </button>
              <button
                type="button"
                onClick={() => setActiveConsoleTab('input')}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
                  activeConsoleTab === 'input'
                    ? 'bg-slate-800 text-cyan-400 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Input (stdin)
              </button>
              <button
                type="button"
                onClick={() => setActiveConsoleTab('diagnostics')}
                className={`px-2.5 py-1 rounded font-medium transition cursor-pointer flex items-center gap-1 ${
                  activeConsoleTab === 'diagnostics'
                    ? 'bg-slate-800 text-rose-400 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Errors / Build
                {compilationError && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setOutput('');
                setCompilationError(null);
              }}
              className="text-[11px] text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* Console Content: Fixed-height scroll container with overscroll-contain */}
          <div className="flex-1 min-h-0 p-3 font-mono text-xs overflow-y-auto overscroll-contain select-text bg-black/40">
            {activeConsoleTab === 'output' && (
              <div className="space-y-1">
                {output ? (
                  <pre className="text-emerald-300 whitespace-pre-wrap leading-relaxed">{output}</pre>
                ) : (
                  <div className="text-slate-500 italic">
                    [Console Ready] Click "Run Code" to compile and execute with current standard input.
                  </div>
                )}
              </div>
            )}

            {activeConsoleTab === 'input' && (
              <div className="space-y-2 h-full flex flex-col">
                <span className="text-[11px] text-slate-400 block">
                  Provide custom input for <code className="text-cyan-400 font-mono">scanf / cin / input() / Scanner</code>:
                </span>
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="e.g. 10 20"
                  className="flex-1 w-full bg-slate-950 text-cyan-200 border border-slate-800 rounded-lg p-2.5 font-mono text-xs resize-none focus:outline-none overscroll-contain"
                />
              </div>
            )}

            {activeConsoleTab === 'diagnostics' && (
              <div className="space-y-1">
                {compilationError ? (
                  <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300 whitespace-pre-wrap leading-relaxed">
                    <strong className="block mb-1 text-rose-400 font-bold">Compilation / Runtime Diagnostics:</strong>
                    {compilationError}
                  </div>
                ) : (
                  <div className="text-slate-500 italic">No errors detected. Build is clean.</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
