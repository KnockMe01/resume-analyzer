import React, { useState } from 'react';
import { FileText, Briefcase, TrendingUp, AlertTriangle, Award, Loader2, Upload, CheckCircle, Zap, Sparkles, ArrowRight, Check, X } from 'lucide-react';

export default function App() {
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF file only');
      return;
    }

    setResumeFile(file);
    setLoading(true);

    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'document',
                  source: {
                    type: 'base64',
                    media_type: 'application/pdf',
                    data: base64Data
                  }
                },
                {
                  type: 'text',
                  text: 'Extract all text content from this resume document. Return only the extracted text, preserving the structure and formatting as much as possible.'
                }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      const extractedText = data.content[0].text;
      setResume(extractedText);
      
    } catch (error) {
      console.error('File upload error:', error);
      alert('Error reading PDF file. Please try another file.');
      setResumeFile(null);
    } finally {
      setLoading(false);
    }
  };

  const analyzeResume = async () => {
    if (!jobDescription.trim() || !resume.trim()) {
      alert('Please provide both Job Description and Resume');
      return;
    }

    setLoading(true);
    
    try {
      const promptText = `You are an Expert Hiring Panel compressed into one system: Senior Hiring Manager, Technical Evaluator, Recruiter, Career Coach, and Resume Strategist.

Evaluate this candidate's resume against the job description across five layers:

1. JD Fit
2. Impact Evidence
3. Career Trajectory
4. Credibility & Red Flags
5. Competitiveness

Be brutally honest, specific, and actionable. Use real hiring heuristics, not keyword matching.

Job Description:
${jobDescription}

Candidate's Resume:
${resume}

Provide your analysis in the following JSON structure (respond ONLY with valid JSON, no markdown, no preamble):

{
  "overallScore": 0,
  "verdict": "STRONG CANDIDATE",
  "jdFit": {
    "score": 0,
    "mustHaves": [
      {"requirement": "string", "evidence": "string", "status": "MET"}
    ],
    "niceToHaves": [
      {"requirement": "string", "evidence": "string", "status": "MET"}
    ],
    "hardGaps": ["string"],
    "softGaps": ["string"],
    "summary": "string"
  },
  "impactEvidence": {
    "score": 0,
    "strongAchievements": ["string"],
    "weakStatements": ["string"],
    "missingMetrics": ["string"],
    "summary": "string"
  },
  "careerTrajectory": {
    "score": 0,
    "pattern": "ASCENDING",
    "growthIndicators": ["string"],
    "concerns": ["string"],
    "positioning": "string",
    "summary": "string"
  },
  "credibilityRedFlags": {
    "score": 0,
    "trustSignals": ["string"],
    "concerns": ["string"],
    "verificationNeeded": ["string"],
    "summary": "string"
  },
  "competitiveness": {
    "score": 0,
    "tier": "TOP 10%",
    "strengths": ["string"],
    "weaknesses": ["string"],
    "differentiators": ["string"],
    "interviewLikelihood": "HIGH",
    "summary": "string"
  },
  "actionableRecommendations": ["string"],
  "finalVerdict": "string"
}`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 16000,
          messages: [
            {
              role: 'user',
              content: promptText
            }
          ]
        })
      });

      const data = await response.json();
      const content = data.content[0].text;
      
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsedAnalysis = JSON.parse(cleanContent);
      
      setAnalysis(parsedAnalysis);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Error analyzing resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-slate-900';
    if (score >= 60) return 'text-slate-700';
    return 'text-slate-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-slate-900';
    if (score >= 60) return 'bg-slate-700';
    return 'bg-slate-500';
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Resume Analyzer</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <a href="#" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#" className="hover:text-slate-900 transition-colors">About</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Contact</a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {!analysis ? (
          <div className="space-y-12">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-semibold">
                <Zap size={16} />
                AI-Powered Analysis
              </div>
              
              <h1 className="text-5xl font-bold text-slate-900">
                Shortlist Hobo? Engine
              </h1>
              
              <p className="text-xl text-slate-600 leading-relaxed">
                Get instant AI-driven insights on how well your resume matches any job description.
                Discover gaps, strengths, and get tailored improvement suggestions.
              </p>

              <div className="flex items-center justify-center gap-8 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-slate-900" />
                  <span>Semantic Matching</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-slate-900" />
                  <span>Gap Detection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-slate-900" />
                  <span>AI Insights</span>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Job Description</h2>
                  <span className="text-sm text-slate-500">(Paste the full JD text)</span>
                </div>
                
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here...

Include responsibilities, required skills, qualifications, and any other relevant information from the job posting."
                  rows={18}
                  className="w-full px-4 py-3 bg-white border-2 border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                />
                <div className="text-xs text-slate-500">{jobDescription.length} characters</div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Resume</h2>
                
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-20 text-center transition-all ${
                    dragActive 
                      ? 'border-slate-900 bg-slate-50' 
                      : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={loading}
                  />
                  
                  {resumeFile ? (
                    <div className="flex flex-col items-center gap-3">
                      <CheckCircle className="text-slate-900" size={56} />
                      <p className="font-semibold text-slate-900 text-lg">{resumeFile.name}</p>
                      <p className="text-sm text-slate-600">PDF uploaded successfully</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setResumeFile(null);
                          setResume('');
                        }}
                        className="text-sm text-slate-600 hover:text-slate-900 underline mt-2"
                      >
                        Upload different file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <Upload className="text-slate-400" size={56} />
                      <div>
                        <p className="font-semibold text-slate-900 text-lg mb-2">Upload Resume (PDF)</p>
                        <p className="text-sm text-slate-600">Drag and drop or click to browse</p>
                        <p className="text-xs text-slate-500 mt-2">PDF files only • Max 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={analyzeResume}
                disabled={loading || !resume || !jobDescription}
                className="inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    Analyzing Your Resume...
                  </>
                ) : (
                  <>
                    Analyze My Fit
                    <ArrowRight size={24} />
                  </>
                )}
              </button>
              <p className="text-sm text-slate-500 mt-4">Free AI-powered analysis • No sign-up required</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 max-w-5xl mx-auto">
            <button
              onClick={() => {
                setAnalysis(null);
                setResumeFile(null);
                setResume('');
                setJobDescription('');
              }}
              className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-2"
            >
              ← New Analysis
            </button>

            <div className="bg-slate-900 rounded-2xl p-10 text-white">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-sm uppercase tracking-wider mb-2 text-slate-400">Overall Score</div>
                  <div className="text-7xl font-bold">{analysis.overallScore}</div>
                  <div className="text-slate-400 text-sm mt-1">out of 100</div>
                </div>
                <div>
                  <div className="text-sm uppercase tracking-wider mb-2 text-slate-400">Match Quality</div>
                  <div className="text-3xl font-bold mt-4">{analysis.verdict}</div>
                </div>
                <div>
                  <div className="text-sm uppercase tracking-wider mb-2 text-slate-400">Interview Chance</div>
                  <div className="text-3xl font-bold mt-4">{analysis.competitiveness.interviewLikelihood}</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Detailed Analysis</h2>

              <div className="bg-white border-2 border-slate-200 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Briefcase className="text-slate-900" size={28} />
                    <h3 className="text-2xl font-bold text-slate-900">Job Description Fit</h3>
                  </div>
                  <div className={`text-4xl font-bold ${getScoreColor(analysis.jdFit.score)}`}>
                    {analysis.jdFit.score}%
                  </div>
                </div>
                
                <p className="text-slate-700 leading-relaxed mb-6 text-lg">{analysis.jdFit.summary}</p>
                
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-900 text-lg">Requirements Match</h4>
                  {analysis.jdFit.mustHaves.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                      {item.status === 'MET' ? (
                        <Check size={24} className="text-slate-900 flex-shrink-0 mt-1" />
                      ) : item.status === 'PARTIAL' ? (
                        <div className="w-6 h-6 rounded-full bg-slate-400 flex-shrink-0 mt-1"></div>
                      ) : (
                        <X size={24} className="text-slate-400 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 mb-1">{item.requirement}</div>
                        <div className="text-sm text-slate-600">{item.evidence}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {analysis.jdFit.hardGaps.length > 0 && (
                  <div className="mt-6 bg-slate-100 rounded-lg p-5">
                    <h4 className="font-bold text-slate-900 mb-3">Critical Gaps</h4>
                    <ul className="space-y-2">
                      {analysis.jdFit.hardGaps.map((gap, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-700">
                          <span className="text-slate-400 mt-1">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="bg-white border-2 border-slate-200 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="text-slate-900" size={28} />
                    <h3 className="text-2xl font-bold text-slate-900">Impact & Achievements</h3>
                  </div>
                  <div className={`text-4xl font-bold ${getScoreColor(analysis.impactEvidence.score)}`}>
                    {analysis.impactEvidence.score}%
                  </div>
                </div>
                
                <p className="text-slate-700 leading-relaxed mb-6 text-lg">{analysis.impactEvidence.summary}</p>
                
                {analysis.impactEvidence.strongAchievements.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-slate-900 mb-3 text-lg">Strong Points</h4>
                    <ul className="space-y-2">
                      {analysis.impactEvidence.strongAchievements.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-slate-700">
                          <Check size={20} className="text-slate-900 flex-shrink-0 mt-1" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.impactEvidence.weakStatements.length > 0 && (
                  <div className="bg-slate-100 rounded-lg p-5">
                    <h4 className="font-bold text-slate-900 mb-3">Needs Improvement</h4>
                    <ul className="space-y-2">
                      {analysis.impactEvidence.weakStatements.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-slate-700">
                          <span className="text-slate-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="bg-white border-2 border-slate-200 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Award className="text-slate-900" size={28} />
                    <h3 className="text-2xl font-bold text-slate-900">Market Position</h3>
                  </div>
                  <div className={`text-4xl font-bold ${getScoreColor(analysis.competitiveness.score)}`}>
                    {analysis.competitiveness.score}%
                  </div>
                </div>
                
                <div className="mb-6">
                  <span className="text-sm text-slate-600 font-semibold">Candidate Tier:</span>
                  <span className="ml-2 text-2xl font-bold text-slate-900">{analysis.competitiveness.tier}</span>
                </div>
                
                <p className="text-slate-700 leading-relaxed mb-6 text-lg">{analysis.competitiveness.summary}</p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {analysis.competitiveness.strengths.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-3 text-lg">Strengths</h4>
                      <ul className="space-y-2">
                        {analysis.competitiveness.strengths.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-slate-700">
                            <Check size={20} className="text-slate-900 flex-shrink-0 mt-1" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {analysis.competitiveness.weaknesses.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-900 mb-3 text-lg">Areas to Develop</h4>
                      <ul className="space-y-2">
                        {analysis.competitiveness.weaknesses.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-700">
                            <span className="text-slate-400 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Action Plan</h3>
              <div className="space-y-4">
                {analysis.actionableRecommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-4 bg-white bg-opacity-10 rounded-lg p-5">
                    <span className="font-bold text-2xl text-slate-400">{idx + 1}</span>
                    <span className="leading-relaxed text-lg">{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Final Assessment</h3>
              <p className="text-lg leading-relaxed text-slate-700">{analysis.finalVerdict}</p>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={() => {
                  setAnalysis(null);
                  setResumeFile(null);
                  setResume('');
                  setJobDescription('');
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all"
              >
                Analyze Another Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
