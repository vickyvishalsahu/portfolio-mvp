'use client';

import { useState, useEffect, useRef } from 'react';
import type { Institution } from '@/domains/shared/types';

type Suggestion = { name: string; domain: string; logo: string };

export const useInstitutionSettings = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchInstitutions = async () => {
    try {
      const response = await fetch('/api/institutions');
      const data = await response.json();
      setInstitutions(data.institutions ?? []);
    } catch {
      // non-fatal
    }
  };

  const saveInstitutions = async (next: Institution[]) => {
    setSaving(true);
    try {
      await fetch('/api/institutions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institutions: next }),
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchInstitutions();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/institutions/suggest?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [searchQuery]);

  const addInstitution = (institution: Institution) => {
    if (institutions.some((existing) => existing.domain === institution.domain)) return;
    const next = [...institutions, institution];
    setInstitutions(next);
    setSearchQuery('');
    setSuggestions([]);
    saveInstitutions(next);
  };

  const removeInstitution = (domain: string) => {
    const next = institutions.filter((institution) => institution.domain !== domain);
    setInstitutions(next);
    saveInstitutions(next);
  };

  const updateDomain = (oldDomain: string, newDomain: string) => {
    const trimmed = newDomain.trim().toLowerCase();
    if (!trimmed || trimmed === oldDomain) return;
    const next = institutions.map((institution) =>
      institution.domain === oldDomain ? { ...institution, domain: trimmed } : institution
    );
    setInstitutions(next);
    saveInstitutions(next);
  };

  return {
    institutions,
    searchQuery,
    setSearchQuery,
    suggestions,
    searching,
    saving,
    addInstitution,
    removeInstitution,
    updateDomain,
  };
};
