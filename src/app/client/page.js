'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 

export default function ClientDashboard() {
  const [isMounted, setIsMounted] = useState(false);
  const [username, setUsername] = useState('');
  
  const [transactions, setTransactions] = useState([]);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [fromAccount, setFromAccount] = useState('Main');
  const [successMsg, setSuccessMsg] = useState('');

  const mainAccountNo = "•••• •••• •••• 8842";
  const vaultAccountNo = "•••• •••• •••• 1195";
  const initialMain = 250000.00;
  const initialVault = 1500000.00;

  useEffect(() => {
    const isAuth = sessionStorage.getItem('client_authenticated');
    if (!isAuth) { window.location.href = '/client-login'; return; }
    setUsername(sessionStorage.getItem('current_user') || 'Member');
    setIsMounted(true); 
    
    try {
      const saved = localStorage.getItem('bank_transactions');
      if (saved) {
        setTransactions(JSON.parse(saved));
      } else {
        const startingHistory = [{ id: Date.now(), type: 'Credit', desc: 'Initial Asset Liquidation', amount: 250000.00, status: 'approved', date: new Date().toISOString().split('T')[0], account: 'Main' }];
        localStorage.setItem('bank_transactions', JSON.stringify(startingHistory));
        setTransactions(startingHistory);
      }
    } catch (error) { console.error("Local storage error:", error); }
  }, []);

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
  const netWorth = mainBalance + vaultBalance;

  const generatePDFStatement = () => {
    const doc = new jsPDF();
    doc.setFontSize(24); doc.setTextColor(17, 46, 69); doc.text("Apex Global Vault", 14, 22);
    doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text("PRIVATE WEALTH MANAGEMENT", 14, 30);
    doc.setFontSize(12); doc.setTextColor(50, 50, 50); doc.text(`Official Account Statement`, 14, 45);
    doc.setFontSize(10);
    doc.text(`Account Holder: ${username}`, 14, 52);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 58);
    doc.text(`Total Verified Assets: $${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 14, 64);

    const tableColumn = ["Execution Date", "Description", "Source/Dest", "Status", "Amount"];
    const tableRows = transactions.map(t => [
      t.date, t.desc, t.account || 'Main', t.status.toUpperCase(),
      `${t.type === 'Credit' ? '+' : '-'}$${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: 75, head: [tableColumn], body: tableRows, theme: 'striped',
      headStyles: { fillColor: [17, 46, 69] }, styles: { fontSize: 9 }, alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150);
      doc.text('CONFIDENTIAL: This document is secured by Apex Global Vault. Do not share.', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    doc.save(`Apex_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    const amountVal = Number(transferAmount);
    if (!amountVal || amountVal <= 0) return;

    const availableFunds = fromAccount === 'Main' ? mainBalance : vaultBalance;
    if (amountVal > availableFunds) {
      setSuccessMsg('❌ ERROR: Insufficient funds available.'); setTimeout(() => setSuccessMsg(''), 4000); return;
    }

    const newPendingRequest = { id: Date.now(), type: 'Debit', desc: transferDesc || `Wire Transfer: ${recipientAccount}`, amount: amountVal, status: 'pending', account: fromAccount, date: new Date().toISOString().split('T')[0] };
    const updatedLedger = [newPendingRequest, ...transactions];
    localStorage.setItem('bank_transactions', JSON.stringify(updatedLedger));
    setTransactions(updatedLedger);
    setTransferAmount(''); setTransferDesc(''); setRecipientAccount('');
    setSuccessMsg('✓ Transfer logged. Awaiting manager verification.'); setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('client_authenticated'); sessionStorage.removeItem('current_user');
    window.location.href = '/client-login';
  };

  // Upgraded CSS for absolute mobile constraint
  const styles = `
    * { box-sizing: border-box; }
    html, body { overflow-x: hidden; margin: 0; padding: 0; width: 100%; }
    .dash-wrapper { min-height: 100vh; background-color: #f4f5f7; font-family: Arial, sans-serif; color: #333; overflow-x: hidden; width: 100%; }
    .dash-header { background-color: #112e45; color: white; padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #0d2336; flex-wrap: wrap; gap: 12px; width: 100%; }
    .dash-main { width: 100%; max-width: 1000px; margin: 0 auto; padding: 32px 16px; display: flex; gap: 24px; align-items: flex-start; }
    .dash-left { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 24px; width: 100%; max-width: 100%; }
    .dash-right { width: 350px; flex-shrink: 0; max-width: 100%; }
    
    /* The strict card clamp */
    .card { background-color: white; border: 1px solid #ccc; border-radius: 2px; width: 100%; overflow: hidden; display: flex; flex-direction: column; max-width: 100vw; }
    .card-header { background-color: #f8f9fa; padding: 16px 20px; border-bottom: 1px solid #ccc; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    
    /* Smooth mobile table scrolling */
    .table-container { overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; }
    .responsive-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 500px; }
    .input-field { width: 100%; padding: 10px; font-size: 14px; border: 1px solid #999; border-radius: 2px; outline: none; }

    /* MOBILE RESPONSIVENESS */
    @media (max-width: 850px) {
      .dash-main { flex-direction: column; padding: 16px; width: 100%; }
      .dash-right { width: 100%; max-width: none; }
      .dash-header { padding: 12px 16px; }
      h1 { font-size: 18px !important; }
      .account-row { flex-direction: column; align-items: flex-start !important; gap: 12px; }
      .account-row > div { text-align: left !important; }
    }
  `;

  if (!isMounted) return <div style={{ minHeight: '100vh', backgroundColor: '#f4f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ fontFamily: 'sans-serif', color: '#112e45', fontWeight: 'bold' }}>Loading Secure Environment...</p></div>;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="dash-wrapper">
        <header className="dash-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '36px', height: '36px', backgroundColor: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
              <svg style={{ width: '20px', height: '20px', color: 'white' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
              </svg>
            </div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'normal', letterSpacing: '0.5px' }}>Apex Global Vault</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', fontWeight: 'bold' }}>
            <span style={{ opacity: 0.9 }}>Welcome, {username}</span>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', textDecoration: 'underline' }}>Log On Out</button>
          </div>
        </header>

        <main className="dash-main">
          <div className="dash-left">
            <div className="card">
              <div className="card-header"><h2 style={{ margin: 0, fontSize: '18px', color: '#112e45', fontWeight: 'normal' }}>Bank Accounts</h2></div>
              <div style={{ padding: '0 20px' }}>
                <div className="account-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid #eee' }}>
                  <div>
                    <div style={{ color: '#005ea6', fontWeight: 'bold', fontSize: '16px' }}>Liquid Capital (Main)</div>
                    <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>{mainAccountNo}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>${mainBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>Available Balance</div>
                  </div>
                </div>
                <div className="account-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }}>
                  <div>
                    <div style={{ color: '#005ea6', fontWeight: 'bold', fontSize: '16px' }}>Secure Asset Vault</div>
                    <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>{vaultAccountNo}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>${vaultBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>Available Balance</div>
                  </div>
                </div>
              </div>
              <div style={{ backgroundColor: '#f8f9fa', padding: '16px 20px', borderTop: '1px solid #ccc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '14px' }}>Total Deposit Accounts</strong>
                <strong style={{ fontSize: '16px' }}>${netWorth.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 style={{ margin: 0, fontSize: '18px', color: '#112e45', fontWeight: 'normal' }}>Recent Transactions</h2>
                <button onClick={generatePDFStatement} style={{ backgroundColor: '#112e45', color: 'white', padding: '8px 16px', fontSize: '12px', fontWeight: 'bold', border: 'none', borderRadius: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Download Statement
                </button>
              </div>
              <div className="table-container">
                <table className="responsive-table">
                  <thead>
                    <tr style={{ borderBottom: '2px solid #ccc', color: '#666', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px', fontWeight: 'normal' }}>Date</th>
                      <th style={{ padding: '12px 8px', fontWeight: 'normal' }}>Description</th>
                      <th style={{ padding: '12px 8px', fontWeight: 'normal' }}>Status</th>
                      <th style={{ padding: '12px 8px', fontWeight: 'normal', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 && (<tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>No recent activity.</td></tr>)}
                    {transactions.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px 8px', color: '#666' }}>{t.date}</td>
                        <td style={{ padding: '12px 8px', color: '#005ea6', fontWeight: 'bold' }}>{t.desc} <br/><span style={{ fontSize: '11px', color: '#999', fontWeight: 'normal' }}>From: {t.account || 'Main'}</span></td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: t.status === 'approved' ? '#e6f4ea' : t.status === 'rejected' ? '#fce8e6' : '#fef7e0', color: t.status === 'approved' ? '#137333' : t.status === 'rejected' ? '#c5221f' : '#b06000' }}>{t.status}</span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: t.type === 'Credit' ? '#137333' : '#333' }}>
                          {t.type === 'Credit' ? '+' : '-'}${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="dash-right">
            <div className="card" style={{ padding: '24px' }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#112e45', fontWeight: 'normal', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>Transfer Funds</h2>
              
              {successMsg && <div style={{ padding: '12px', marginBottom: '16px', fontSize: '13px', backgroundColor: successMsg.includes('❌') ? '#fef2f2' : '#fef7e0', border: `1px solid ${successMsg.includes('❌') ? '#fca5a5' : '#fde047'}`, color: successMsg.includes('❌') ? '#b91c1c' : '#854d0e' }}>{successMsg}</div>}

              <form onSubmit={handleTransferSubmit}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>From Account</label>
                  <select value={fromAccount} onChange={(e) => setFromAccount(e.target.value)} className="input-field" style={{ backgroundColor: 'white' }}>
                    <option value="Main">Liquid Capital (Main) - ${mainBalance.toLocaleString()}</option>
                    <option value="Vault">Secure Vault - ${vaultBalance.toLocaleString()}</option>
                  </select>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>To Account / Routing</label>
                  <input type="text" required placeholder="Routing / Account No." value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value)} className="input-field" />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>Amount</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '10px', color: '#666', fontSize: '14px' }}>$</span>
                    <input type="number" required placeholder="0.00" min="1" step="0.01" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} className="input-field" style={{ paddingLeft: '24px' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px', fontWeight: 'bold' }}>Memo (Optional)</label>
                  <input type="text" placeholder="What is this for?" value={transferDesc} onChange={(e) => setTransferDesc(e.target.value)} className="input-field" />
                </div>
                <button type="submit" style={{ width: '100%', backgroundColor: '#53682b', color: 'white', padding: '12px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '2px' }}>
                  Submit Transfer
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}