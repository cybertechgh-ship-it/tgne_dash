import React, { useState } from 'react';

/**
 * ClientForm component that implements a multi-step process.
 * The second part focuses on capturing associated sites for the renewal schedule.
 */
const ClientForm = ({ client, onSave, onCancel }) => {
  const [step, setStep] = useState(1); // 1: Identity, 2: Business/Billing, 3: Sites, 4: Metadata
  const [formData, setFormData] = useState({
    logo: client?.logo || null,
    clientName: client?.clientName || '',
    businessType: client?.businessType || 'LLC',
    industry: client?.industry || '',
    status: client?.status || 'Active',
    contactName: client?.contactName || '',
    contactTitle: client?.contactTitle || '',
    email: client?.email || '',
    phone: client?.phone || '',
    preferredContact: client?.preferredContact || 'Email',
    city: client?.city || '',
    country: client?.country || '',
    currency: client?.currency || 'GHS',
    paymentTerms: client?.paymentTerms || 'Due on Receipt',
    preferredPayment: client?.preferredPayment || 'Mobile Money',
    accountManager: client?.accountManager || '',
    taxApplied: client?.taxApplied ?? true,
    tags: client?.tags || [],
    notes: client?.notes || '',
    serviceType: client?.serviceType || '',
    sites: client?.sites || ['']
  });
  // State to hold validation errors for each site
  const [siteErrors, setSiteErrors] = useState(formData.sites.map(() => ''));

  // Helper function for URL validation
  const isValidUrl = (url) => {
    if (!url.trim()) return true; // Allow empty URLs
    try {
      // Prepend a scheme for URL validation, assuming user inputs domain part
      new URL(`https://${url}`);
      return true;
    } catch (e) {
      return false;
    }
  };

  const updateSite = (index, value) => {
    const newSites = [...formData.sites];
    newSites[index] = value;
    setFormData({ ...formData, sites: newSites });

    // Validate immediately and update errors
    const newErrors = [...siteErrors];
    newErrors[index] = isValidUrl(value) ? '' : 'Invalid URL format';
    setSiteErrors(newErrors);
  };

  const addSiteField = () => {
    setFormData({ ...formData, sites: [...formData.sites, ''] });
    setSiteErrors([...siteErrors, '']); // Add an empty error for the new field
  };

  const toggleTag = (tag) => {
    const newTags = formData.tags.includes(tag) 
      ? formData.tags.filter(t => t !== tag) 
      : [...formData.tags, tag];
    setFormData({ ...formData, tags: newTags });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 1024 * 1024) setFormData({...formData, logo: URL.createObjectURL(file)});
  };

  const removeSiteField = (index) => {
    const newSites = formData.sites.filter((_, i) => i !== index);
    const newErrors = siteErrors.filter((_, i) => i !== index);
    setFormData({ ...formData, sites: newSites });
    setSiteErrors(newErrors);
  };

  const handleNextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Validate all sites before saving
      const newErrors = formData.sites.map(site => isValidUrl(site) ? '' : 'Invalid URL format');
      setSiteErrors(newErrors);

      const hasErrors = newErrors.some(error => error !== '');
      if (!hasErrors) {
        onSave(formData);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 p-8 font-['Inter',_sans-serif]">
      {/* Step Indicator */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'bg-[#8585E3]' : 'bg-slate-100'}`} />
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-black text-[#4A7289] tracking-tight">
          {step === 1 && 'Client Identity'}
          {step === 2 && 'Business & Billing'}
          {step === 3 && 'Site Capture'}
          {step === 4 && 'Notes & Tags'}
        </h2>
      </div>

      {step === 1 ? (
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2 flex items-center gap-6 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group">
              {formData.logo ? <img src={formData.logo} className="w-full h-full object-cover" /> : <span className="text-slate-300 text-xs font-bold text-center p-2">Logo</span>}
              <input type="file" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">Update Logo</p>
              <p className="text-[10px] text-slate-400">Square image, max 1 MB</p>
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Business Name</label>
            <input type="text" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-[#8585E3]" />
          </div>
          <div className="col-span-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Full Name</label>
            <input type="text" value={formData.contactName} onChange={(e) => setFormData({...formData, contactName: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-[#8585E3]" />
          </div>
          <div className="col-span-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Contact Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-[#8585E3]" />
          </div>
        </div>
      ) : step === 2 ? (
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Business Type</label>
            <select value={formData.businessType} onChange={(e) => setFormData({...formData, businessType: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none">
              <option>LLC</option><option>Sole Proprietorship</option><option>Corporation</option>
            </select>
          </div>
          <div className="col-span-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Currency</label>
            <select value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none">
              <option>GHS</option><option>USD</option><option>EUR</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Preferred Payment</label>
            <select value={formData.preferredPayment} onChange={(e) => setFormData({...formData, preferredPayment: e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl outline-none">
              <option>Mobile Money</option><option>Bank Transfer</option><option>Credit Card</option>
            </select>
          </div>
          <div className="col-span-2 flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
            <input type="checkbox" checked={formData.taxApplied} onChange={(e) => setFormData({...formData, taxApplied: e.target.checked})} className="w-4 h-4 text-[#8585E3]" />
            <span className="text-xs font-bold text-[#4A7289]">Apply Ghana VAT (15%) to all invoices</span>
          </div>
        </div>
      ) : step === 3 ? (
        <div className="space-y-4">
          <p className="text-xs font-bold text-[#4A7289]/60 mb-4 italic">
            Add all domains or project URLs associated with this client for tracking.
          </p>
          {formData.sites.map((site, index) => (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex gap-2 group items-center">
                <div className={`flex-1 bg-[#ECF1F3]/50 rounded-2xl flex items-center px-4 transition-all ${siteErrors[index] ? 'ring-2 ring-red-500' : 'focus-within:ring-2 focus-within:ring-[#8585E3]'}`}>
                  <span className="text-[#8585E3] font-bold text-[10px] mr-2">HTTPS://</span>
                  <input
                    type="text"
                    value={site}
                    onChange={(e) => updateSite(index, e.target.value)}
                    className="w-full py-4 bg-transparent border-none focus:ring-0 text-sm font-medium outline-none"
                    placeholder="www.client-site.com"
                  />
                </div>
                {formData.sites.length > 1 && (
                  <button 
                    onClick={() => removeSiteField(index)}
                    className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Remove Site"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
              {siteErrors[index] && (
                <p className="text-red-500 text-xs ml-4">{siteErrors[index]}</p>
              )}
            </div>
          ))}
          <button
            onClick={addSiteField}
            className="w-full py-3 border-2 border-dashed border-[#8585E3]/30 rounded-2xl text-[#8585E3] text-xs font-black uppercase tracking-widest hover:bg-[#8585E3]/5 transition-all"
          >
            + Add Site
          </button>
        </div>
      ) : step === 4 ? (
        <div className="space-y-6">
          <p className="text-xs font-bold text-[#4A7289]/60 mb-4 italic">
            Add internal notes and labels to categorize this client.
          </p>
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 mb-2 block">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              rows={5}
              className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-[#8585E3] resize-none"
              placeholder="Internal notes about this client..."
            />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {['VIP', 'High Value', 'Risky', 'New', 'Recurring', 'Priority'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    formData.tags.includes(tag)
                      ? 'bg-[#8585E3] text-white border-[#8585E3]'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-[#8585E3]/50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-10 flex gap-4">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="px-6 py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">Back</button>
        ) : onCancel ? (
          <button type="button" onClick={onCancel} className="px-6 py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">Cancel</button>
        ) : null}
        <button
          type={step < 4 ? "button" : "submit"}
          onClick={(e) => { e.preventDefault(); handleNextStep(); }}
          className="flex-1 py-4 bg-[#8585E3] text-white rounded-2xl font-black text-sm shadow-xl shadow-[#8585E3]/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          {step < 4 ? 'Continue' : 'Finish & Save'}
        </button>
      </div>
    </div>
  );
};

export default ClientForm;