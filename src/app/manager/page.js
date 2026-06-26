'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function ManagerDashboard() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [clients, setClients] = useState([]); // NEW: State for your clients

  useEffect(() => {
    setIsMounted(true);
    verifySecurityClearance();
  }, []);

  const verifySecurityClearance = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/client-login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('email', session.user.email)
      .single();

    if (profile && profile.is_admin === true) {
      setIsAuthorized(true);
      fetchDashboardData(); // Fetch both transactions AND clients
    } else {
      router.push('/client'); 
    }
    
    setIsCheckingAuth(false);
  };

  const fetchDashboardData = async () => {
    // Fetch Transactions
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .order('id', { ascending: false });
    
    if (txData) setTransactions(txData);
    if (txError) console.error("Error fetching tx:", txError);

    // Fetch Clients (Profiles) - Excluding other admins to keep the list clean
    const { data: clientData, error: clientError } = await supabase
      .from('profiles')
      .select('*')
      .is('is_admin', false) 
      .order('full_name', { ascending: true });

    if (clientData) setClients(clientData);
    if (clientError) console.error("Error fetching clients:", clientError);
  };

  // --- NEW: INJECT BALANCE FUNCTION ---
  const handleInjectBalance = async (email, currentBalance, clientName) => {
    // Prompt the manager to enter a new balance
    const newBalanceInput = window.prompt(`Enter new account balance for ${clientName}:`, currentBalance || 0);
    
    // If they click cancel or enter nothing, stop
    if (newBalanceInput === null || newBalanceInput.trim() === '') return;
    
    const parsedBalance = parseFloat(newBalanceInput);
    
    if (isNaN(parsedBalance)) {
      alert("Invalid number. Please enter a valid amount.");
      return;
    }

    // Push the new balance to the database
    const { error } = await supabase
      .from('profiles')
      .update({ account_balance: parsedBalance })
      .eq('email', email);

    if (error) {
      alert(`Error updating balance: ${error.message}`);
    } else {
      // Update the screen instantly
      setClients(clients.map(c => c.email === email ? { ...c, account_balance: parsedBalance } : c));
    }
  };

  // --- EXISTING TRANSACTION FUNCTIONS ---
  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', id);
      
    if (!error) {
      setTransactions(transactions.map(t => t.id === id ? { ...t, status: newStatus } : t));
    }
  };

  const clearHistory = async () => {
    if(confirm("Are you sure you want to wipe the entire database? This cannot be undone.")) {
      const { error } = await supabase.from('transactions').delete().neq('id', 0);
      if (!error) setTransactions([]);
    }
  };

  const styles = `
    * { box-sizing: border-box; }
    html, body { overflow-x: hidden; margin: 0; padding: 0; width: 100%; }
    .manager-wrapper { min-height: 100vh; background-color: #e2e8f0; font-family: Arial, sans-serif; color: #333; overflow-x: hidden; width: 100%; }
    .manager-header { background-color: #0f172a; color: white; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #dc2626; flex-wrap: wrap; gap: 12px; width: 100%; }
    .manager-main { width: 100%; max-width: 1200px; margin: 0 auto; padding: 32px 16px; display: flex; flex-direction: column; gap: 32px; }
    .admin-card { background-color: white; border: 1px solid #cbd5e1; border-radius: 4px; width: 100%; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .admin-card-header { background-color: #f8fafc; padding: 16px 20px; border-bottom: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
    .table-container { overflow-x: auto; width: 100%; -webkit-overflow-scrolling: touch; padding: 0; }
    .admin-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 700px; }
    .admin-th { background-color: #f1f5f9; padding: 14px 16px; text-align: left; font-weight: bold; color: #475569; border-bottom: 2px solid #cbd5e1; }
    .admin-td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
    .btn-action { padding: 6px 12px; font-size: 12px; font-weight: bold; border: none; border-radius: 4px; cursor: pointer; transition: opacity 0.2s; margin-right: 8px; }
    .btn-approve { background-color: #16a34a; color: white; }
    .btn-reject { background-color: #dc2626; color: white; }
    .btn-inject { background-color: #2563eb; color: white; }
    .btn-approve:hover, .btn-reject:hover, .btn-inject:hover { opacity: 0.8; }
    @media (max-width: 768px) { .manager-header { padding: 12px 16px; flex-direction: column; align-items: flex-start; } .manager-main { padding: 16px; } h1 { font-size: 20px !important; } }
  `;

  if (!isMounted || isCheckingAuth) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#e2e8f0' }}>
        <h2 style={{ color: '#0f172a' }}>Verifying Security Clearance...</h2>
      </div>
    );
  }

  if (!isAuthorized) return null;

  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="manager-wrapper">
        <header className="manager-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', backgroundColor: '#dc2626', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '24px', height: '24px', color: 'white' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', letterSpacing: '0.5px' }}>GLOBAL VAULT OVERSEER</h1>
              <div style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '1px' }}>SYSTEM ADMINISTRATOR PORTAL</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ backgroundColor: '#b91c1c', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{pendingCount} PENDING ACTION(S)</span>
            <Link href="/" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'underline', fontWeight: 'bold' }}>Secure Exit</Link>
          </div>
        </header>

        <main className="manager-main">
          
          {/* --- NEW SECTION: CLIENT ACCOUNTS CONTROLS --- */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>Client Account Controls</h2>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-th">Client Name</th>
                    <th className="admin-th">Username</th>
                    <th className="admin-th">Email</th>
                    <th className="admin-th">Current Balance</th>
                    <th className="admin-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.length === 0 && (<tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No active clients found.</td></tr>)}
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td className="admin-td" style={{ fontWeight: 'bold', color: '#0f172a' }}>{client.full_name || 'N/A'}</td>
                      <td className="admin-td">{client.username}</td>
                      <td className="admin-td">{client.email}</td>
                      <td className="admin-td" style={{ fontWeight: 'bold', color: '#16a34a', fontSize: '16px' }}>
                        ${Number(client.account_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="admin-td">
                        <button 
                          onClick={() => handleInjectBalance(client.email, client.account_balance, client.full_name)} 
                          className="btn-action btn-inject"
                        >
                          INJECT BALANCE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- EXISTING SECTION: MASTER TRANSACTION LEDGER --- */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 'bold' }}>Master Transaction Ledger</h2>
              <button onClick={clearHistory} style={{ backgroundColor: 'transparent', border: '1px solid #dc2626', color: '#dc2626', padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>⚠ WIPE DATABASE</button>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-th">User ID</th>
                    <th className="admin-th">Date / Source</th>
                    <th className="admin-th">Description</th>
                    <th className="admin-th">Amount</th>
                    <th className="admin-th">Current Status</th>
                    <th className="admin-th">Admin Override</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 && (<tr><td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>No transactions recorded.</td></tr>)}
                  {transactions.map((t) => (
                    <tr key={t.id} style={{ backgroundColor: t.status === 'pending' ? '#fefce8' : 'transparent' }}>
                      <td className="admin-td" style={{ fontWeight: 'bold', color: '#0f172a' }}>{t.user_id}</td>
                      <td className="admin-td"><strong>{t.date}</strong><br/><span style={{ fontSize: '12px', color: '#64748b' }}>Acc: {t.account}</span></td>
                      <td className="admin-td" style={{ fontWeight: 'bold' }}>{t.desc}</td>
                      <td className="admin-td" style={{ fontWeight: 'bold', color: t.type === 'Credit' ? '#16a34a' : '#0f172a' }}>{t.type === 'Credit' ? '+' : '-'}${Number(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="admin-td">
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: t.status === 'approved' ? '#dcfce7' : t.status === 'rejected' ? '#fee2e2' : '#fef08a', color: t.status === 'approved' ? '#166534' : t.status === 'rejected' ? '#991b1b' : '#854d0e' }}>{t.status}</span>
                      </td>
                      <td className="admin-td">
                        {t.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => updateStatus(t.id, 'approved')} className="btn-action btn-approve">APPROVE</button>
                            <button onClick={() => updateStatus(t.id, 'rejected')} className="btn-action btn-reject">REJECT</button>
                          </div>
                        ) : (<span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Resolved</span>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}