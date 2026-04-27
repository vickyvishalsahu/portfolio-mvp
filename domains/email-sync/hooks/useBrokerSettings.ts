'use client';

import { useState, useEffect } from 'react';
import type { BrokerDefinition } from '@/domains/shared/types';

const extractDomain = (input: string): string => {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed.split('@')[1] ?? trimmed;
  return trimmed;
};

export const useBrokerSettings = () => {
  const [catalog, setCatalog] = useState<BrokerDefinition[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customDomains, setCustomDomains] = useState<Record<string, string[]>>({});
  const [expandedBroker, setExpandedBroker] = useState<string | null>(null);
  const [savingBrokers, setSavingBrokers] = useState(false);
  const [newDomainInput, setNewDomainInput] = useState('');

  const fetchBrokerSettings = async () => {
    try {
      const res = await fetch('/api/settings/brokers');
      const data = await res.json();
      setCatalog(data.catalog ?? []);
      setSelectedIds(data.selected ?? []);
      setCustomDomains(data.customDomains ?? {});
    } catch {
      // non-fatal
    }
  };

  const saveBrokerSettings = async (
    nextSelected: string[],
    nextCustomDomains: Record<string, string[]>
  ) => {
    setSavingBrokers(true);
    try {
      await fetch('/api/settings/brokers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected: nextSelected, customDomains: nextCustomDomains }),
      });
    } finally {
      setSavingBrokers(false);
    }
  };

  useEffect(() => {
    fetchBrokerSettings();
  }, []);

  const handleToggleBroker = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    setSelectedIds(next);
    if (!next.includes(id)) setExpandedBroker(null);
    saveBrokerSettings(next, customDomains);
  };

  const handleExpandBroker = (id: string) => {
    setExpandedBroker(expandedBroker === id ? null : id);
    setNewDomainInput('');
  };

  const handleAddDomain = (brokerId: string) => {
    const domain = extractDomain(newDomainInput);
    if (!domain) return;
    const current = customDomains[brokerId] ?? [];
    if (current.includes(domain)) return;
    const next = { ...customDomains, [brokerId]: [...current, domain] };
    setCustomDomains(next);
    setNewDomainInput('');
    saveBrokerSettings(selectedIds, next);
  };

  const handleRemoveCustomDomain = (brokerId: string, domain: string) => {
    const next = {
      ...customDomains,
      [brokerId]: (customDomains[brokerId] ?? []).filter((d) => d !== domain),
    };
    setCustomDomains(next);
    saveBrokerSettings(selectedIds, next);
  };

  return {
    catalog,
    selectedIds,
    customDomains,
    expandedBroker,
    savingBrokers,
    newDomainInput,
    setNewDomainInput,
    handleToggleBroker,
    handleExpandBroker,
    handleAddDomain,
    handleRemoveCustomDomain,
  };
};
