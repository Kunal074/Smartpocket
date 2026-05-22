'use client';

import { useState } from 'react';
import { X, Receipt, Camera, Chat as MessageSquare, Globe, NavigationArrow as Navigation, MagnifyingGlass as Search } from '@phosphor-icons/react';
import { useGroupExpenses } from '@/hooks/useGroupExpenses';
import { useGroups } from '@/hooks/useGroups';

const INTEGRATIONS = [
  { id: 'gpay',   name: 'GPay',   color: '#4285F4', icon: Navigation },
  { id: 'phonepe',name: 'PhonePe',color: '#5E3B8F', icon: MessageSquare },
  { id: 'swiggy', name: 'Swiggy', color: '#FC8019', icon: Globe },
  { id: 'zomato', name: 'Zomato', color: '#E23744', icon: Receipt },
];

export default function AddGroupExpenseSheet({ isOpen, onClose, group }) {
  const { addExpense, isLoading } = useGroupExpenses();
  const { addMember } = useGroups();
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('other');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // View states
  const [activeTab, setActiveTab] = useState('equally'); // equally, unequally, itemwise
  const [unequalMode, setUnequalMode] = useState('amount'); // amount, percentage
  
  // Add friend state
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [isAddingFriend, setIsAddingFriend] = useState(false);
  
  // member state shape: { user_id, percentage, amount, isIncluded }
  const [memberSplits, setMemberSplits] = useState(
    group?.members?.map(m => ({
      user_id: m.user_id,
      name: m.name,
      percentage: '',
      amount: '',
      isIncluded: true
    })) || []
  );

  const handleMemberChange = (userId, field, value) => {
    setMemberSplits(prev => prev.map(m => 
      m.user_id === userId ? { ...m, [field]: value } : m
    ));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Mock upload delay for now
      await new Promise(r => setTimeout(r, 1000));
      alert("Cloudinary keys needed! (We'll set this up next)");
      // setReceiptUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!newFriendEmail) return;
    
    setIsAddingFriend(true);
    try {
      await addMember(group.id, newFriendEmail);
      setShowAddFriend(false);
      setNewFriendEmail('');
      // Note: The parent component will re-fetch group details and pass down new props, 
      // but to be safe we could manually append it or just let the user reopen the sheet.
      // For a seamless experience, we can mock append if the API succeeds:
      setMemberSplits(prev => [...prev, {
        user_id: 'temp-' + Date.now(),
        name: newFriendEmail.split('@')[0],
        percentage: '', amount: '', isIncluded: true
      }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAddingFriend(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount) return;

    const activeMembers = memberSplits.filter(m => m.isIncluded);
    
    // Determine the backend split_type based on frontend selection
    let backendSplitType = 'equal';
    if (activeTab === 'unequally') {
      backendSplitType = unequalMode === 'amount' ? 'custom' : 'percentage';
    } else if (activeTab === 'itemwise') {
      // For item-wise, we pre-calculate custom amounts for each person
      backendSplitType = 'custom';
    }

    if (backendSplitType === 'percentage') {
      const sum = activeMembers.reduce((acc, m) => acc + (parseFloat(m.percentage) || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        alert('Percentages must sum exactly to 100%');
        return;
      }
    } else if (backendSplitType === 'custom' && activeTab !== 'itemwise') {
      const sum = activeMembers.reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
      if (Math.abs(sum - parseFloat(amount)) > 0.01) {
        alert('Custom amounts must sum exactly to the total amount');
        return;
      }
    }

    try {
      await addExpense(group.id, {
        title,
        amount: parseFloat(amount),
        category,
        split_type: backendSplitType,
        note: receiptUrl, // temporarily storing receipt url in note
        members: activeMembers.map(m => ({
          user_id: m.user_id,
          percentage: backendSplitType === 'percentage' ? parseFloat(m.percentage) : undefined,
          amount: backendSplitType === 'custom' ? parseFloat(m.amount) : undefined
        }))
      });
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 backdrop-blur-md transition-all"
        style={{ background: 'rgba(4, 18, 30, 0.6)' }}
        onClick={onClose}
      />
      
      <div 
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300"
        style={{ 
          background: 'var(--sp-bg)',
          borderLeft: '1px solid var(--sp-border)' 
        }}
      >
        <div 
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 backdrop-blur-xl"
          style={{ borderBottom: '1px solid var(--sp-border)', background: 'rgba(4,18,30,0.85)' }}
        >
          <h2 className="flex items-center gap-2 font-display text-lg font-bold" style={{ color: 'var(--sp-text)' }}>
            Add Expense
          </h2>
          <button 
            onClick={onClose} 
            className="flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110"
            style={{ background: 'var(--sp-accent-bg)', color: 'var(--sp-accent)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6 pb-24">
          
          {/* Integration Strip */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--sp-text-muted)' }}>
              Auto-fetch from
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {INTEGRATIONS.map((int) => {
                const Icon = int.icon;
                return (
                  <button
                    key={int.id}
                    type="button"
                    className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'var(--sp-card)', border: '1px solid var(--sp-border)' }}
                  >
                    <Icon className="h-4 w-4" style={{ color: int.color }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--sp-text)' }}>{int.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--sp-text-muted)' }}>
                Description
              </label>
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Dinner at Olive"
                className="w-full rounded-2xl px-4 py-3.5 text-sm font-medium focus:outline-none transition-colors"
                style={{ 
                  background: 'var(--sp-card)', 
                  border: '1px solid var(--sp-border)',
                  color: 'var(--sp-text)' 
                }}
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--sp-text-muted)' }}>
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-xl" style={{ color: 'var(--sp-accent)' }}>₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-2xl pl-10 pr-4 py-3.5 font-display text-xl font-bold focus:outline-none transition-colors"
                  style={{ 
                    background: 'var(--sp-card)', 
                    border: '1px solid var(--sp-border)',
                    color: 'var(--sp-text)'
                  }}
                  required
                />
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--sp-text-muted)' }}>
                Receipt
              </label>
              <label 
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed py-3.5 transition-all hover:opacity-80"
                style={{ 
                  background: 'var(--sp-accent-bg)', 
                  borderColor: 'var(--sp-accent-border)',
                  color: 'var(--sp-accent)'
                }}
              >
                <Camera className="h-5 w-5" />
                <span className="text-sm font-semibold">{isUploading ? 'Uploading...' : 'Add Bill'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
              </label>
            </div>
          </div>

          {/* Split Mode Tabs */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider mb-2 block" style={{ color: 'var(--sp-text-muted)' }}>
              Split Type
            </label>
            <div className="flex rounded-2xl p-1" style={{ background: 'var(--sp-card)', border: '1px solid var(--sp-border)' }}>
              {['equally', 'unequally', 'itemwise'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveTab(type)}
                  className="flex-1 rounded-xl py-2.5 text-xs font-semibold capitalize transition-all duration-200"
                  style={activeTab === type ? {
                    background: 'var(--sp-accent)',
                    color: '#04121e',
                    boxShadow: '0 4px 12px rgba(73,152,214,0.3)'
                  } : {
                    color: 'var(--sp-text-muted)'
                  }}
                >
                  {type === 'itemwise' ? 'Item-wise' : type}
                </button>
              ))}
            </div>
          </div>

          {/* Unequal Sub-tabs */}
          {activeTab === 'unequally' && (
            <div className="flex justify-center gap-2">
              <button 
                type="button"
                onClick={() => setUnequalMode('amount')}
                className={`rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all ${unequalMode === 'amount' ? 'opacity-100' : 'opacity-40'}`}
                style={{ background: unequalMode === 'amount' ? 'var(--sp-accent-bg)' : 'transparent', color: 'var(--sp-accent)' }}
              >
                By Amount
              </button>
              <button 
                type="button"
                onClick={() => setUnequalMode('percentage')}
                className={`rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-all ${unequalMode === 'percentage' ? 'opacity-100' : 'opacity-40'}`}
                style={{ background: unequalMode === 'percentage' ? 'var(--sp-accent-bg)' : 'transparent', color: 'var(--sp-accent)' }}
              >
                By Percentage
              </button>
            </div>
          )}

          {/* Item-wise WIP */}
          {activeTab === 'itemwise' ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--sp-card)', border: '1px dashed var(--sp-border-strong)' }}>
              <Receipt className="mx-auto h-8 w-8 mb-3 opacity-50" style={{ color: 'var(--sp-accent)' }} />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--sp-text)' }}>Item-wise Splitting</h3>
              <p className="mt-1 text-xs" style={{ color: 'var(--sp-text-muted)' }}>
                Add individual items (like Pizza, Fries) and select who ate what. 
                (Coming soon in Phase 2!)
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 mb-2">
                <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--sp-text-muted)' }}>
                  Members Involved
                </label>
                <button 
                  type="button" 
                  onClick={() => setShowAddFriend(!showAddFriend)}
                  className="text-[10px] font-semibold uppercase tracking-wider transition-all hover:scale-105" 
                  style={{ color: 'var(--sp-accent)' }}
                >
                  + Add Friend
                </button>
              </div>

              {showAddFriend && (
                <div className="mb-4 flex items-center gap-2 rounded-xl p-2 transition-all" style={{ background: 'var(--sp-accent-bg)' }}>
                  <input 
                    type="email" 
                    value={newFriendEmail}
                    onChange={(e) => setNewFriendEmail(e.target.value)}
                    placeholder="Friend's email..."
                    className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ background: 'var(--sp-bg)', color: 'var(--sp-text)', border: '1px solid var(--sp-border)' }}
                  />
                  <button 
                    type="button"
                    onClick={handleAddFriend}
                    disabled={isAddingFriend || !newFriendEmail}
                    className="rounded-lg px-4 py-2 text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: 'var(--sp-gradient)', color: '#04121e' }}
                  >
                    {isAddingFriend ? 'Adding...' : 'Add'}
                  </button>
                </div>
              )}
              
              <div className="overflow-hidden rounded-2xl" style={{ border: '1px solid var(--sp-border)' }}>
                {memberSplits.map((m, i) => (
                  <div 
                    key={m.user_id} 
                    className="flex items-center justify-between p-4 transition-colors"
                    style={{ 
                      background: 'var(--sp-card)',
                      borderBottom: i < memberSplits.length - 1 ? '1px solid var(--sp-border)' : 'none'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox"
                        checked={m.isIncluded}
                        onChange={(e) => handleMemberChange(m.user_id, 'isIncluded', e.target.checked)}
                        className="h-5 w-5 rounded-md accent-[#4998d6]"
                      />
                      <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'var(--sp-accent-bg)', color: 'var(--sp-accent)' }}>
                        <span className="text-xs font-bold">{m.name.charAt(0)}</span>
                      </div>
                      <span className={`text-sm font-semibold transition-all ${!m.isIncluded && 'opacity-40 line-through'}`} style={{ color: 'var(--sp-text)' }}>
                        {m.name}
                      </span>
                    </div>
                    
                    {m.isIncluded && activeTab === 'unequally' && unequalMode === 'percentage' && (
                      <div className="relative w-20">
                        <input 
                          type="number" 
                          value={m.percentage}
                          onChange={(e) => handleMemberChange(m.user_id, 'percentage', e.target.value)}
                          className="w-full rounded-xl px-2 py-1.5 pr-6 text-right text-sm font-semibold focus:outline-none"
                          style={{ background: 'var(--sp-bg)', border: '1px solid var(--sp-border)', color: 'var(--sp-text)' }}
                          placeholder="0"
                        />
                        <span className="absolute right-2 top-2 text-xs" style={{ color: 'var(--sp-text-muted)' }}>%</span>
                      </div>
                    )}

                    {m.isIncluded && activeTab === 'unequally' && unequalMode === 'amount' && (
                      <div className="relative w-24">
                        <span className="absolute left-2 top-2 text-xs" style={{ color: 'var(--sp-text-muted)' }}>₹</span>
                        <input 
                          type="number" 
                          value={m.amount}
                          onChange={(e) => handleMemberChange(m.user_id, 'amount', e.target.value)}
                          className="w-full rounded-xl py-1.5 pl-6 pr-2 text-sm font-semibold focus:outline-none"
                          style={{ background: 'var(--sp-bg)', border: '1px solid var(--sp-border)', color: 'var(--sp-text)' }}
                          placeholder="0"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="fixed bottom-0 right-0 w-full max-w-lg p-6 backdrop-blur-xl" style={{ background: 'rgba(4,18,30,0.85)', borderTop: '1px solid var(--sp-border)' }}>
            <button
              type="submit"
              disabled={isLoading || !title || !amount}
              className="w-full rounded-2xl py-4 text-sm font-bold text-[#04121e] shadow-glow transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              style={{ background: 'var(--sp-gradient)' }}
            >
              {isLoading ? 'Splitting...' : 'Split Expense'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
