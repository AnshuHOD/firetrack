'use client';

import { useState } from 'react';
import { Search, Filter, Copy, ExternalLink, ChevronDown } from 'lucide-react';

export default function LeadTable({ leads = [] }: { leads?: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLeads = leads.filter(l => 
    l.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.incidents?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getImpactBadge = (level: string) => {
    switch(level) {
      case 'High': return <span className="bg-accentRed/10 text-accentRed px-2 py-1 rounded text-xs font-semibold border border-accentRed/20">High</span>;
      case 'Medium': return <span className="bg-accentOrange/10 text-accentOrange px-2 py-1 rounded text-xs font-semibold border border-accentOrange/20">Medium</span>;
      case 'Low': return <span className="bg-accentGreen/10 text-accentGreen px-2 py-1 rounded text-xs font-semibold border border-accentGreen/20">Low</span>;
      default: return <span className="bg-gray-500/10 text-gray-400 px-2 py-1 rounded text-xs font-semibold">Unknown</span>;
    }
  };

  const copyToClipboard = (text: string) => {
    if(!text) return;
    navigator.clipboard.writeText(text);
    // Simple toast could be added here
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg shadow-sm">
      {/* Header & Controls */}
      <div className="p-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          Lead Database <span className="text-sm font-normal text-textSecondary bg-background px-2 py-0.5 rounded-full border border-border">{leads.length} total</span>
        </h2>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
            <input 
              type="text" 
              placeholder="Search business or city..." 
              className="w-full bg-background border border-border rounded-md pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-accentBlue focus:ring-1 focus:ring-accentBlue transition-all text-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center gap-2 bg-background border border-border hover:bg-border/50 text-foreground px-3 py-1.5 rounded-md text-sm font-medium transition-colors">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto relative">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-[#1f1f1f] sticky top-0 z-10 text-textSecondary uppercase text-xs">
            <tr>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Time <ChevronDown className="w-3 h-3 inline-block ml-1"/></th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Business / Type</th>
              <th className="px-4 py-3 font-medium">Impact</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium text-right">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-textSecondary">
                  {leads.length === 0 ? "No leads found. Waiting for first scrape..." : "No leads match your search."}
                </td>
              </tr>
            ) : filteredLeads.map((lead, i) => (
              <tr key={lead.id || i} className="hover:bg-background/40 transition-colors group">
                <td className="px-4 py-3 text-textSecondary whitespace-nowrap">
                  {lead.incidents?.published_at ? new Date(lead.incidents.published_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  <div className="text-xs text-textSecondary/50 mt-0.5">
                    {lead.incidents?.published_at ? new Date(lead.incidents.published_at).toLocaleDateString() : ''}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-foreground">{lead.incidents?.city || 'Unknown City'}</div>
                  <div className="text-xs text-textSecondary truncate max-w-[150px]" title={lead.incidents?.locality || ''}>
                    {lead.incidents?.state || ''} {lead.incidents?.locality ? `• ${lead.incidents.locality}` : ''}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-accentBlue group-hover:underline cursor-pointer">
                    {lead.business_name || 'Unidentified Business'}
                  </div>
                  <div className="text-xs text-textSecondary">
                    {lead.business_type || 'Unknown Type'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {getImpactBadge(lead.incidents?.impact_level)}
                  {lead.incidents?.impact_level === 'High' && (
                     <div className="text-[10px] text-accentRed mt-1">Priority</div>
                  )}
                </td>
                <td className="px-4 py-3 min-w-[140px]">
                  {lead.contact_phone ? (
                    <div className="flex items-center gap-2 group/copy cursor-pointer" onClick={() => copyToClipboard(lead.contact_phone)}>
                      <span className="font-medium">{lead.contact_phone}</span>
                      <Copy className="w-3 h-3 text-textSecondary opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                    </div>
                  ) : <span className="text-textSecondary italic text-xs">Ph N/A</span>}
                  
                  {lead.contact_email ? (
                    <div className="flex items-center gap-2 text-xs text-textSecondary group/copy cursor-pointer mt-0.5" onClick={() => copyToClipboard(lead.contact_email)}>
                      <span>{lead.contact_email}</span>
                      <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right">
                   <a 
                     href={lead.incidents?.source_url || '#'} 
                     target="_blank" 
                     rel="noreferrer"
                     className="inline-flex items-center gap-1.5 text-xs font-medium text-textSecondary hover:text-foreground bg-background px-2 py-1 rounded border border-border hover:border-textSecondary transition-all"
                   >
                     {lead.incidents?.news_source || 'News'} <ExternalLink className="w-3 h-3" />
                   </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
