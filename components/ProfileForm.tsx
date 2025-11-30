'use client';

import { useState } from 'react';

type Profile = {
  employmentType: string | null;
  yearlyIncome: number | null;
  hasPartner: boolean;
  hasMortgage: boolean;
  hasCompany: boolean;
  companyType: string | null;
};

export function ProfileForm({ initial }: { initial: Profile | null }) {
  const [profile, setProfile] = useState<Profile>(initial || {
    employmentType: null,
    yearlyIncome: null,
    hasPartner: false,
    hasMortgage: false,
    hasCompany: false,
    companyType: null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Wat is je werksituatie?
        </label>
        <select
          value={profile.employmentType || ''}
          onChange={(e) => setProfile({ ...profile, employmentType: e.target.value || null })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">Selecteer...</option>
          <option value="employed">In loondienst</option>
          <option value="zzp">ZZP / Freelancer</option>
          <option value="both">Beide</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Geschat jaarinkomen (€)
        </label>
        <input
          type="number"
          value={profile.yearlyIncome || ''}
          onChange={(e) => setProfile({ ...profile, yearlyIncome: e.target.value ? parseInt(e.target.value) : null })}
          placeholder="50000"
          className="w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={profile.hasPartner}
            onChange={(e) => setProfile({ ...profile, hasPartner: e.target.checked })}
            className="rounded"
          />
          <span>Ik heb een fiscaal partner</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={profile.hasMortgage}
            onChange={(e) => setProfile({ ...profile, hasMortgage: e.target.checked })}
            className="rounded"
          />
          <span>Ik heb een hypotheek</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={profile.hasCompany}
            onChange={(e) => setProfile({ ...profile, hasCompany: e.target.checked })}
            className="rounded"
          />
          <span>Ik heb een bedrijf</span>
        </label>
      </div>

      {profile.hasCompany && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type bedrijf
          </label>
          <select
            value={profile.companyType || ''}
            onChange={(e) => setProfile({ ...profile, companyType: e.target.value || null })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">Selecteer...</option>
            <option value="eenmanszaak">Eenmanszaak</option>
            <option value="vof">VOF</option>
            <option value="bv">BV</option>
          </select>
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
      >
        {saving ? 'Opslaan...' : saved ? '✓ Opgeslagen' : 'Opslaan'}
      </button>
    </div>
  );
}
