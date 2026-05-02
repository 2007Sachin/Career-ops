"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, X, Save } from "lucide-react";

export default function RecruiterJobsConfig() {
  const [skills, setSkills] = useState(["Python", "FastAPI", "PostgreSQL", "Kafka"]);
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      e.preventDefault();
      if (!skills.includes(newSkill.trim())) {
        setSkills([...skills, newSkill.trim()]);
      }
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  return (
    <div className="flex-1 p-8 bg-slate-50 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" /> 
            </div>
            Job Schema Configuration
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Define your requirements. The Pulse-Ops engine will strictly match candidates against this exact matrix.</p>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-5">
            <CardTitle className="text-xl text-slate-800">Create New Role</CardTitle>
            <CardDescription className="text-slate-500">All matched candidates in your feed will be scored against these requirements.</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700">Role Title</label>
                <Input placeholder="e.g. Senior Backend Engineer" className="border-slate-300 h-11" defaultValue="Senior Backend Engineer" />
              </div>
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700">Domain / Industry</label>
                <Select defaultValue="fintech">
                  <SelectTrigger className="border-slate-300 h-11">
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fintech">Fintech / Web3</SelectItem>
                    <SelectItem value="healthtech">Healthtech</SelectItem>
                    <SelectItem value="ai">AI / Machine Learning</SelectItem>
                    <SelectItem value="saas">B2B SaaS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700">Hard Technical Requirements (Tags)</label>
              <p className="text-xs text-slate-500 mb-2">Press enter to add a skill. We will verify impact in these specific areas.</p>
              
              <div className="flex flex-wrap gap-2 mb-3 bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[64px]">
                {skills.map(skill => (
                  <Badge key={skill} variant="secondary" className="bg-white text-blue-700 border border-blue-200 shadow-sm px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium">
                    {skill}
                    <button onClick={() => handleRemoveSkill(skill)} className="hover:bg-blue-50 text-blue-400 hover:text-blue-700 rounded-full p-0.5 transition-colors focus:outline-none">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
              
              <Input 
                placeholder="Type a skill and press Enter..." 
                className="border-slate-300 max-w-md h-11" 
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={handleAddSkill}
              />
            </div>

            <div className="space-y-2.5">
               <label className="text-sm font-bold text-slate-700">Job Description (Optional Context)</label>
               <Textarea 
                 placeholder="Paste the full job description here to help our matching agent understand soft requirements and context..." 
                 className="min-h-[160px] border-slate-300 resize-y p-4" 
               />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700">Salary Range</label>
                <Input placeholder="$150,000 - $180,000" className="border-slate-300 h-11" />
              </div>
              <div className="space-y-2.5">
                <label className="text-sm font-bold text-slate-700">Location / Model</label>
                <Select defaultValue="remote">
                  <SelectTrigger className="border-slate-300 h-11">
                    <SelectValue placeholder="Select working model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Fully Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 flex justify-end">
               <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg shadow-blue-600/20 px-8 h-12 text-base">
                  <Save className="w-5 h-5 mr-2" /> Save & Activate Matching
               </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
