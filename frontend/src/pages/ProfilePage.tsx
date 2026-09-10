import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Save, UserRound } from 'lucide-react';
import axios from 'axios';
import { getAuthErrorMessage } from '../services/authService';
import { getProfile, updateProfile } from '../services/api';
import type { UserProfileRequest, UserProfileResponse } from '../types';

type ProfileForm = {
  phone: string;
  education: string;
  college: string;
  careerGoal: string;
  bio: string;
  location: string;
  graduationYear: string;
  skills: string;
};

const emptyForm: ProfileForm = {
  phone: '', education: '', college: '', graduationYear: '',
  careerGoal: '', bio: '', location: '', skills: '',
};

const toForm = (profile: UserProfileResponse): ProfileForm => ({
  phone: profile.phone ?? '', education: profile.education ?? '', college: profile.college ?? '',
  graduationYear: profile.graduationYear?.toString() ?? '', careerGoal: profile.careerGoal ?? '',
  bio: profile.bio ?? '', location: profile.location ?? '', skills: profile.skills.join(', '),
});

export const ProfilePage: React.FC = () => {
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const profile = await getProfile();
        if (isMounted) setForm(toForm(profile));
      } catch (err: unknown) {
        if (isMounted) {
          if (!axios.isAxiosError(err) || err.response?.status !== 404) {
            setError(getAuthErrorMessage(err, 'Unable to load your profile. Please try again.'));
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void loadProfile();
    return () => { isMounted = false; };
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError(null);
    setSuccess(null);
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const year = form.graduationYear.trim();
    const profileData: UserProfileRequest = {
      phone: form.phone.trim() || null,
      education: form.education.trim() || null,
      college: form.college.trim() || null,
      graduationYear: year ? Number(year) : null,
      careerGoal: form.careerGoal.trim() || null,
      bio: form.bio.trim() || null,
      location: form.location.trim() || null,
      skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
    };

    try {
      const saved = await updateProfile(profileData);
      setForm(toForm(saved));
      setSuccess('Your profile was saved successfully.');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Unable to save your profile. Check the fields and try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-[45vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400"><UserRound className="w-6 h-6" /></div>
        <div><h1 className="text-2xl sm:text-3xl font-bold text-white">Your profile</h1><p className="text-sm text-slate-400 mt-1">Keep your career context current for better guidance.</p></div>
      </div>

      {error && <Feedback icon={<AlertCircle className="w-4 h-4" />} className="text-rose-300 bg-rose-500/10 border-rose-500/30">{error}</Feedback>}
      {success && <Feedback icon={<CheckCircle2 className="w-4 h-4" />} className="text-emerald-300 bg-emerald-500/10 border-emerald-500/30">{success}</Feedback>}

      <form onSubmit={handleSubmit} className="glass-card p-5 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" />
          <Field label="Location" name="location" value={form.location} onChange={handleChange} placeholder="Bengaluru, India" />
          <Field label="Education" name="education" value={form.education} onChange={handleChange} placeholder="Computer Science" />
          <Field label="College" name="college" value={form.college} onChange={handleChange} placeholder="Your college or university" />
          <Field label="Graduation year" name="graduationYear" type="number" value={form.graduationYear} onChange={handleChange} placeholder="2027" min="1900" max="2200" />
          <Field label="Career goal" name="careerGoal" value={form.careerGoal} onChange={handleChange} placeholder="Backend Engineer" />
        </div>
        <Field label="Skills" name="skills" value={form.skills} onChange={handleChange} placeholder="Java, SQL, Spring Boot" hint="Separate skills with commas." />
        <div className="space-y-1.5">
          <label htmlFor="bio" className="block text-sm font-medium text-slate-300">Bio</label>
          <textarea id="bio" name="bio" value={form.bio} onChange={handleChange} rows={5} maxLength={2000} placeholder="Tell us about your experience and interests." className={inputClass} />
        </div>
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 hover:bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/20 transition disabled:cursor-not-allowed disabled:opacity-50">
            {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save profile</>}
          </button>
        </div>
      </form>
    </div>
  );
};

const inputClass = 'w-full rounded-xl border border-slate-700/80 bg-slate-800/60 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-brand-500/60 focus:outline-none focus:ring-2 focus:ring-brand-500/60';

const Field: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }> = ({ label, hint, id, ...props }) => (
  <div className="space-y-1.5"><label htmlFor={id ?? props.name} className="block text-sm font-medium text-slate-300">{label}</label><input id={id ?? props.name} className={inputClass} {...props} />{hint && <p className="text-xs text-slate-500">{hint}</p>}</div>
);

const Feedback: React.FC<{ icon: React.ReactNode; className: string; children: React.ReactNode }> = ({ icon, className, children }) => (
  <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${className}`}>{icon}<span>{children}</span></div>
);

export default ProfilePage;