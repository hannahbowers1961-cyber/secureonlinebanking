'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import { supabase } from '../../lib/supabaseClient';

export default function ClientDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [username, setUsername] = useState('');
  
  // App State
  const [transactions, setTransactions] = useState([]);
  const [activeModal, setActiveModal] = useState(null); 
  const [systemAlert, setSystemAlert] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Transfer State
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [fromAccount, setFromAccount] = useState('Main');
  const [successMsg, setSuccessMsg] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Baselines
  const initialMain = 250000.00;
  const initialVault = 1500000.00;

  useEffect(() => {
    const isAuth = sessionStorage.getItem('client_authenticated');
    if (!isAuth) { window.location.href = '/client-login'; return; }
    
    const currentUser = sessionStorage.getItem('current_user') || 'Member';
    setUsername(currentUser);
    setIsMounted(true); 
    fetchCloudTransactions(currentUser);
  }, []);

  const fetchCloudTransactions = async (user) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user)
      .order('id', { ascending: false });
    if (data) setTransactions(data);
  };

  const calculateBalance = (targetAccount, startingAmount) => {
    let balance = startingAmount;
    transactions.forEach(t => {
      const tAccount = t.account || 'Main'; 
      if (t.status === 'approved' && tAccount === targetAccount) {
        if (t.type === 'Credit') balance += Number(t.amount);
        if (t.type === 'Debit') balance -= Number(t.amount);
      }
    });
    return balance;
  };

  const mainBalance = calculateBalance('Main', initialMain);
  const vaultBalance = calculateBalance('Vault', initialVault);
  const totalAssets = mainBalance + vaultBalance;

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    setIsTransferring(true);
    const amountVal = Number(transferAmount);
    if (!amountVal || amountVal <= 0) { setIsTransferring(false); return; }

    const availableFunds = fromAccount === 'Main' ? mainBalance : vaultBalance;
    if (amountVal > availableFunds) {
      setSuccessMsg('❌ ERROR: Insufficient funds.'); 
      setTimeout(() => setSuccessMsg(''), 4000); 
      setIsTransferring(false);
      return;
    }

    const newTx = {
      type: 'Debit',
      desc: transferDesc || `Transfer: ${recipientAccount}`,
      amount: amountVal,
      status: 'pending',
      account: fromAccount,
      user_id: username,
      date: new Date().toISOString().split('T')[0]
    };

    const { error } = await supabase.from('transactions').insert([newTx]);

    if (!error) {
      fetchCloudTransactions(username);
      setTransferAmount(''); setTransferDesc(''); setRecipientAccount('');
      setSuccessMsg('✓ Transfer initiated. Awaiting manager approval.'); 
      setTimeout(() => { setActiveModal(null); setSuccessMsg(''); }, 3000);
    }
    setIsTransferring(false);
  };

  const generatePDFStatement = () => {
    const doc = new jsPDF();
    doc.text("Apex Global Vault - Activity Statement", 14, 22);
    const tableRows = transactions.map(t => [t.date, t.desc, t.account || 'Main', t.status.toUpperCase(), `${t.type === 'Credit' ? '+' : '-'}$${Number(t.amount).toLocaleString()}`]);
    autoTable(doc, { startY: 30, head: [["Date", "Description", "Account", "Status", "Amount"]], body: tableRows, theme: 'grid' });
    doc.save(`Activity_Statement.pdf`);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('client_authenticated'); 
    window.location.href = '/client-login';
  };

  const triggerMockFeature = (feature) => {
    setSystemAlert(`Module "${feature}" is under secure maintenance.`);
    setTimeout(() => setSystemAlert(''), 3000);
  };

  const styles = `
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
    body { background-color: #f4f5f7; margin: 0; padding: 0; color: #333; -webkit-font-smoothing: antialiased; }
    
    .app-wrapper { display: flex; min-height: 100vh; position: relative; }
    
    /* LEFT SIDEBAR */
    .sidebar { width: 260px; background-color: #ffffff; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; z-index: 50; transition: transform 0.3s ease; }
    .sidebar-header { padding: 24px; border-bottom: 1px solid #f1f5f9; }
    .brand-title { color: #00365b; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin: 0; display: flex; align-items: center; gap: 8px; }
    .fdic-text { font-size: 10px; color: #64748b; margin-top: 8px; display: block; }
    
    /* Mobile Close Button & Backdrop */
    .close-menu-btn { display: none; background: none; border: none; font-size: 28px; color: #00365b; cursor: pointer; padding: 0; line-height: 1; }
    .mobile-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 54, 91, 0.5); z-index: 40; backdrop-filter: blur(2px); opacity: 0; visibility: hidden; transition: all 0.3s ease; }
    .mobile-backdrop.open { opacity: 1; visibility: visible; }
    
    .nav-list { list-style: none; padding: 12px 0; margin: 0; flex: 1; overflow-y: auto; }
    .nav-item { padding: 12px 24px; display: flex; align-items: center; gap: 12px; color: #475569; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
    .nav-item:hover { background-color: #f8fafc; color: #00365b; }
    .nav-item.active { border-left: 4px solid #689221; color: #00365b; font-weight: 600; background-color: #f1f5f9; padding-left: 20px; }
    .nav-icon { font-size: 18px; color: #94a3b8; }
    .nav-item.active .nav-icon { color: #00365b; }
    
    .sidebar-footer { padding: 16px 24px; border-top: 1px solid #f1f5f9; }
    .logout-btn { display: flex; align-items: center; gap: 8px; color: #991b1b; font-size: 14px; font-weight: 600; cursor: pointer; background: none; border: none; padding: 0; width: 100%; }

    /* MAIN CONTENT AREA */
    .main-area { flex: 1; display: flex; flex-direction: column; overflow-x: hidden; }
    
    .top-header { display: flex; justify-content: flex-end; align-items: center; padding: 24px 40px; background-color: #f4f5f7; }
    .greeting-box { text-align: right; }
    .greeting-text { font-size: 18px; color: #00365b; font-weight: 600; margin: 0; }
    .last-login { font-size: 11px; color: #64748b; margin-top: 4px; }
    
    .mobile-menu-btn { display: none; background: none; border: none; font-size: 24px; color: #00365b; cursor: pointer; }

    .dashboard-content { padding: 0 40px 40px 40px; max-width: 1200px; margin: 0 auto; width: 100%; }

    /* ACCOUNTS GRID */
    .accounts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }

    /* HERO CARDS */
    .hero-card { background: white; border-radius: 12px; padding: 24px 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: relative; border-top: 6px solid #00365b; display: flex; flex-direction: column; }
    .hero-card.savings { border-top-color: #689221; }
    
    .hero-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .hero-icon { width: 40px; height: 40px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; color: #00365b; font-weight: bold; }
    .hero-card.savings .hero-icon { color: #689221; }
    .hero-title { font-size: 18px; font-weight: 700; color: #00365b; margin: 0; letter-spacing: -0.5px; }
    
    .hero-balances { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; flex: 1; }
    
    .available-bal { text-align: left; }
    .available-bal-amount { font-size: 40px; font-weight: 800; color: #00365b; letter-spacing: -1px; line-height: 1; }
    .available-bal-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; font-weight: 600; }
    
    .hero-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: auto; }
    .quick-link { color: #005a9c; font-size: 13px; font-weight: 600; text-decoration: none; cursor: pointer; background: none; border: none; padding: 0; }
    .quick-link:hover { text-decoration: underline; color: #00365b; }

    /* WIDGET GRID */
    .widget-grid { display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 24px; }
    
    .widget { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.03); display: flex; flex-direction: column; }
    .widget-title { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin: 0 0 20px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
    
    /* Account Summary Widget */
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 16px; align-items: center; }
    .summary-label { font-size: 14px; color: #475569; font-weight: 500; }
    .summary-value { font-size: 16px; color: #00365b; font-weight: 700; }
    .view-all-link { text-align: right; margin-top: auto; color: #005a9c; font-size: 13px; font-weight: 600; cursor: pointer; }

    /* Move Money Widget */
    .move-money-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .action-btn { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 12px; display: flex; flex-direction: column; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s; }
    .action-btn:hover { background: #00365b; border-color: #00365b; }
    .action-btn:hover * { color: white !important; }
    .action-icon { font-size: 24px; color: #005a9c; }
    .action-text { font-size: 12px; font-weight: 600; color: #475569; text-align: center; }

    /* Recent Activity Widget */
    .tx-list { display: flex; flex-direction: column; gap: 16px; margin: 0; padding: 0; list-style: none; }
    .tx-item { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px; }
    .tx-item:last-child { border-bottom: none; padding-bottom: 0; }
    .tx-info { display: flex; flex-direction: column; gap: 4px; }
    .tx-desc { font-size: 14px; font-weight: 600; color: #0f172a; }
    .tx-date { font-size: 11px; color: #64748b; }
    .tx-amount { font-size: 14px; font-weight: 700; }
    .tx-amount.credit { color: #166534; }
    .tx-amount.debit { color: #991b1b; }
    
    /* Institutional Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 54, 91, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(2px); }
    .modal-content { background: white; width: 100%; max-width: 480px; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
    .modal-header { background: #00365b; color: white; padding: 20px 24px; font-weight: 600; font-size: 16px; display: flex; justify-content: space-between; align-items: center; }
    .modal-body { padding: 32px 24px; }
    .input-group { margin-bottom: 20px; }
    .input-label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 8px; }
    .input-field { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; background: #f8fafc; transition: all 0.2s; outline: none; }
    .input-field:focus { background: white; border-color: #005a9c; box-shadow: 0 0 0 3px rgba(0,90,156,0.1); }
    
    /* Alert Toast */
    .toast { position: fixed; bottom: 30px; right: 30px; background: #00365b; color: white; padding: 16px 24px; border-radius: 8px; font-weight: 500; font-size: 14px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); z-index: 9999; border-left: 4px solid #689221; animation: slideUp 0.3s ease; }
    @keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .widget-grid { grid-template-columns: 1fr 1fr; }
      .widget:nth-child(3) { grid-column: 1 / -1; }
    }
    @media (max-width: 768px) {
      .sidebar { position: fixed; transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); }
      .close-menu-btn { display: block; }
      .top-header { justify-content: space-between; padding: 16px 24px; }
      .mobile-menu-btn { display: block; }
      .dashboard-content { padding: 0 16px 24px 16px; }
      .accounts-grid { grid-template-columns: 1fr; }
      .widget-grid { grid-template-columns: 1fr; }
    }
  `;

  if (!isMounted) return <div style={{ height: '100vh', backgroundColor: '#f4f5f7' }}></div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      {systemAlert && <div className="toast">ℹ️ {systemAlert}</div>}

      {/* MOBILE BACKDROP - Closes menu when clicked outside */}
      <div className={`mobile-backdrop ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* TRANSFER MODAL */}
      {activeModal === 'transfer' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <span>Initiate Secure Transfer</span>
              <button onClick={() => setActiveModal(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}>×</button>
            </div>
            <div className="modal-body">
              {successMsg && <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '6px', backgroundColor: successMsg.includes('❌') ? '#fee2e2' : '#ecfccb', border: `1px solid ${successMsg.includes('❌') ? '#fca5a5' : '#bef264'}`, color: successMsg.includes('❌') ? '#991b1b' : '#3f6212', fontSize: '13px', fontWeight: '600' }}>{successMsg}</div>}
              <form onSubmit={handleTransferSubmit}>
                <div className="input-group">
                  <label className="input-label">Transfer From Account</label>
                  <select className="input-field" value={fromAccount} onChange={(e) => setFromAccount(e.target.value)}>
                    <option value="Main">Checking (Main) - ${mainBalance.toLocaleString()}</option>
                    <option value="Vault">Savings (Vault) - ${vaultBalance.toLocaleString()}</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Destination Routing / Account #</label>
                  <input type="text" required className="input-field" value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} placeholder="000000000" />
                </div>
                <div className="input-group">
                  <label className="input-label">Amount ($)</label>
                  <input type="number" required min="1" step="0.01" className="input-field" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="0.00" />
                </div>
                <div className="input-group">
                  <label className="input-label">Memo (Optional)</label>
                  <input type="text" className="input-field" value={transferDesc} onChange={(e) => setTransferDesc(e.target.value)} placeholder="e.g. Invoice #1234" />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="button" onClick={() => setActiveModal(null)} style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '12px', fontWeight: '600', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={isTransferring} style={{ flex: 2, backgroundColor: isTransferring ? '#94a3b8' : '#00365b', color: 'white', border: 'none', padding: '12px', fontWeight: '600', borderRadius: '6px', cursor: isTransferring ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    {isTransferring ? 'Processing...' : 'Authorize Transfer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="app-wrapper">
        
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h1 className="brand-title">
                <div style={{ width: '24px', height: '24px', backgroundColor: '#689221', borderRadius: '4px' }}></div>
                APEX VAULT
              </h1>
              {/* THE FIX: Mobile Close Button */}
              <button className="close-menu-btn" onClick={() => setMobileMenuOpen(false)}>×</button>
            </div>
            <span className="fdic-text"><strong>FDIC</strong> Insured • Backed by the full faith and credit of the U.S. Government.</span>
          </div>
          
          <ul className="nav-list">
            <li className="nav-item active" onClick={() => setMobileMenuOpen(false)}>
              <span className="nav-icon">⌂</span> Accounts Home
            </li>
            <li className="nav-item" onClick={() => { setActiveModal('transfer'); setMobileMenuOpen(false); }}>
              <span className="nav-icon">⇄</span> Transfers & Payments
            </li>
            <li className="nav-item" onClick={() => { triggerMockFeature('Debit Card Controls'); setMobileMenuOpen(false); }}>
              <span className="nav-icon">💳</span> Debit Card Controls
            </li>
            <li className="nav-item" onClick={() => { triggerMockFeature('My Credit View'); setMobileMenuOpen(false); }}>
              <span className="nav-icon">📊</span> My Credit View
            </li>
            <li className="nav-item" onClick={() => { triggerMockFeature('Services'); setMobileMenuOpen(false); }}>
              <span className="nav-icon">⚙️</span> Services
            </li>
            <li className="nav-item" onClick={() => { generatePDFStatement(); setMobileMenuOpen(false); }}>
              <span className="nav-icon">📄</span> Statements & Docs
            </li>
            <li className="nav-item" onClick={() => { triggerMockFeature('Secure Messages'); setMobileMenuOpen(false); }}>
              <span className="nav-icon">✉️</span> Secure Messages
            </li>
          </ul>

          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <span>🚪</span> Log Off System
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT PORTION */}
        <main className="main-area">
          
          <header className="top-header">
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>
            <div className="greeting-box">
              <h2 className="greeting-text">Good Morning, {username}</h2>
              <div className="last-login">Last login: {new Date().toLocaleDateString()} at 08:14 AM</div>
            </div>
          </header>

          <div className="dashboard-content">
            
            {/* THE NEW DUAL ACCOUNTS GRID */}
            <div className="accounts-grid">
              
              {/* Checking Account Card */}
              <div className="hero-card">
                <div className="hero-header">
                  <div className="hero-icon">C</div>
                  <h3 className="hero-title">CHECKING (MAIN)</h3>
                </div>
                <div className="hero-balances">
                  <div className="available-bal">
                    <div className="available-bal-amount">${mainBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                    <div className="available-bal-label">Available Balance</div>
                  </div>
                </div>
                <div className="hero-footer">
                  <button className="quick-link" onClick={() => triggerMockFeature('Account Details')}>Details</button>
                  <button className="quick-link" onClick={() => setActiveModal('transfer')}>Quick Transfer</button>
                </div>
                <div style={{ position: 'absolute', right: '30px', top: '30px', opacity: '0.03', fontSize: '100px', pointerEvents: 'none', color: '#00365b' }}>$</div>
              </div>

              {/* Savings Account Card */}
              <div className="hero-card savings">
                <div className="hero-header">
                  <div className="hero-icon">S</div>
                  <h3 className="hero-title">SAVINGS (VAULT)</h3>
                </div>
                <div className="hero-balances">
                  <div className="available-bal">
                    <div className="available-bal-amount" style={{ color: '#689221' }}>${vaultBalance.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                    <div className="available-bal-label">Available Balance</div>
                  </div>
                </div>
                <div className="hero-footer">
                  <button className="quick-link" onClick={() => triggerMockFeature('Vault Details')}>Details</button>
                  <button className="quick-link" onClick={() => setActiveModal('transfer')}>Quick Transfer</button>
                </div>
                <div style={{ position: 'absolute', right: '30px', top: '30px', opacity: '0.03', fontSize: '100px', pointerEvents: 'none', color: '#689221' }}>$</div>
              </div>

            </div>

            {/* WIDGET GRID */}
            <div className="widget-grid">
              
              {/* Account Summary Widget */}
              <div className="widget">
                <h4 className="widget-title">Account Summary</h4>
                <div className="summary-row">
                  <span className="summary-label">Total Assets</span>
                  <span className="summary-value">${totalAssets.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Liabilities</span>
                  <span className="summary-value" style={{ color: '#64748b' }}>$0.00</span>
                </div>
                <div className="summary-row" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px', marginTop: '16px' }}>
                  <span className="summary-label">Net Worth</span>
                  <span className="summary-value" style={{ color: '#689221' }}>${totalAssets.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="view-all-link" onClick={() => triggerMockFeature('Full Summary')}>View Accounts ›</div>
              </div>

              {/* Move Money Widget */}
              <div className="widget">
                <h4 className="widget-title">Move Money</h4>
                <div className="move-money-grid">
                  <div className="action-btn" onClick={() => setActiveModal('transfer')}>
                    <div className="action-icon">⇄</div>
                    <div className="action-text">Internal<br/>Transfer</div>
                  </div>
                  <div className="action-btn" onClick={() => triggerMockFeature('External Transfer')}>
                    <div className="action-icon">🏦</div>
                    <div className="action-text">External<br/>Transfer</div>
                  </div>
                  <div className="action-btn" onClick={() => triggerMockFeature('Zelle')}>
                    <div className="action-icon">💸</div>
                    <div className="action-text">Send Money<br/>with Zelle®</div>
                  </div>
                  <div className="action-btn" onClick={() => triggerMockFeature('Bill Pay')}>
                    <div className="action-icon">📅</div>
                    <div className="action-text">Pay<br/>Bills</div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Widget */}
              <div className="widget">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                  <h4 className="widget-title" style={{ border: 'none', margin: 0, padding: 0 }}>Recent Activity</h4>
                  <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '12px', fontWeight: '600' }}>All Accounts</span>
                </div>
                
                <ul className="tx-list">
                  {transactions.slice(0, 4).length === 0 && <li style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '20px 0' }}>No recent activity.</li>}
                  {transactions.slice(0, 4).map((t) => (
                    <li className="tx-item" key={t.id}>
                      <div className="tx-info">
                        <span className="tx-desc">{t.desc}</span>
                        <span className="tx-date">{t.date} • {t.account || 'Main'} • {t.status}</span>
                      </div>
                      <div className={`tx-amount ${t.type === 'Credit' ? 'credit' : 'debit'}`}>
                        {t.type === 'Credit' ? '+' : '-'}${Number(t.amount).toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="view-all-link" style={{ marginTop: '20px' }} onClick={() => generatePDFStatement()}>Download Statement ›</div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}